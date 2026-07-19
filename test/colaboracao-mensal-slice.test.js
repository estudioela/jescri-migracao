const { loadGas } = require('./helpers/gasHarness');

/**
 * Teste integrado do Vertical Slice "Colaboração Mensal" (SPEC-005 §20).
 *
 * Integra as peças REAIS da fatia: CompiladorDoMes (service) →
 * ColaboracaoMensalRepository → ColaboracaoMensalACL → aba física fake
 * COLABORACOES (mesma API do Sheets). A porta do Cadastro entra como fake
 * (a leitura física de Parceiras ativas na ParceiraACL é integração
 * pendente da cablagem do entrypoint).
 */

const CABECALHO = [
  'INFLU_KEY',
  'MES_REFERENCIA',
  'ANO_REFERENCIA',
  'ESTADO',
  'SNAPSHOT_VALOR',
  'SNAPSHOT_FORMATOS',
  'SNAPSHOT_QTD_POR_FORMATO',
];

function fakeSheet(header) {
  const rows = [header.slice()];
  const chamadas = { setValues: 0 };
  return {
    rows,
    chamadas,
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    getRange(linha, coluna, numLinhas, numColunas) {
      return {
        setValues(valores) {
          chamadas.setValues += 1;
          if (
            coluna !== 1 ||
            valores.length !== numLinhas ||
            valores[0].length !== numColunas
          ) {
            throw new Error('fakeSheet: range incompatível com os valores.');
          }
          valores.forEach((v, i) => {
            rows[linha - 1 + i] = v.slice();
          });
        },
      };
    },
  };
}

function montarFatia(parceiras) {
  const gas = loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
  ]);
  const sheet = fakeSheet(CABECALHO);
  const acl = new gas.ColaboracaoMensalACL(sheet);
  const repositorio = new gas.ColaboracaoMensalRepository(acl);
  const eventos = [];
  const cadastro = {
    listarAtivasComCondicoes: () => parceiras.map((p) => Object.assign({}, p)),
  };
  const servico = new gas.CompiladorDoMes(cadastro, repositorio, {
    publicar: (evento) => eventos.push(evento),
  });
  return { gas, sheet, acl, repositorio, servico, eventos, parceiras };
}

function parceirasAtivas() {
  return [
    {
      parceiraId: 'maria',
      condicoes: {
        valorMensal: 3500,
        formatosContratados: ['Reels', 'Stories'],
        quantidadePorFormato: { Reels: 2, Stories: 4 },
      },
    },
    {
      parceiraId: 'ana',
      condicoes: {
        valorMensal: 1200,
        formatosContratados: ['Carrossel'],
        quantidadePorFormato: { Carrossel: 1 },
      },
    },
  ];
}

describe('Slice Colaboração Mensal — C-01: compilar competência inédita', () => {
  test('materializa uma linha física por Parceira ativa, num único lote', () => {
    const { servico, sheet } = montarFatia(parceirasAtivas());

    servico.executar('2026-07');

    expect(sheet.chamadas.setValues).toBe(1);
    expect(sheet.rows).toHaveLength(3);
    expect(sheet.rows[1]).toEqual([
      'maria',
      7,
      2026,
      'ATIVA',
      3500,
      'Reels, Stories',
      '{"Reels":2,"Stories":4}',
    ]);
    expect(sheet.rows[2]).toEqual([
      'ana',
      7,
      2026,
      'ATIVA',
      1200,
      'Carrossel',
      '{"Carrossel":1}',
    ]);
  });

  test('publica MesCompilado e a consulta reidrata agregados íntegros da planilha', () => {
    const { gas, servico, repositorio, eventos } = montarFatia(parceirasAtivas());

    servico.executar('2026-07');

    expect(eventos).toHaveLength(1);
    expect(eventos[0].nome).toBe('MesCompilado');
    expect(eventos[0].mesReferencia).toBe('2026-07');

    const persistidas = repositorio.listarPor(new gas.MesReferencia(2026, 7));
    expect(persistidas).toHaveLength(2);
    const deMaria = persistidas.find((c) => c.parceiraId === 'maria');
    expect(deMaria.estado).toBe('Ativa');
    expect(deMaria.mesReferencia.toString()).toBe('2026-07');
    expect(deMaria.snapshot.valorMensal).toBe(3500);
    expect(deMaria.snapshot.quantidadePorFormato).toEqual({ Reels: 2, Stories: 4 });
  });
});

describe('Slice Colaboração Mensal — C-02: idempotência ponta a ponta', () => {
  test('compilar duas vezes a mesma competência não duplica linhas nem eventos', () => {
    const { servico, sheet, eventos } = montarFatia(parceirasAtivas());

    servico.executar('2026-07');
    const segunda = servico.executar('2026-07');

    expect(segunda.jaCompilada).toBe(true);
    expect(sheet.rows).toHaveLength(3);
    expect(eventos).toHaveLength(1);
  });

  test('competência seguinte compila normalmente sobre a mesma aba (RN-02)', () => {
    const { servico, sheet } = montarFatia(parceirasAtivas());

    servico.executar('2026-07');
    servico.executar('2026-08');

    expect(sheet.rows).toHaveLength(5);
    expect(sheet.rows[3][CABECALHO.indexOf('MES_REFERENCIA')]).toBe(8);
  });
});

describe('Slice Colaboração Mensal — C-03: congelamento não retroage', () => {
  test('alterar condições no Cadastro após compilar não muda a linha persistida', () => {
    const fatia = montarFatia(parceirasAtivas());

    fatia.servico.executar('2026-07');
    fatia.parceiras[0].condicoes.valorMensal = 9999;
    fatia.servico.executar('2026-08');

    const colunaValor = CABECALHO.indexOf('SNAPSHOT_VALOR');
    expect(fatia.sheet.rows[1][colunaValor]).toBe(3500); // julho congelado
    expect(fatia.sheet.rows[3][colunaValor]).toBe(9999); // agosto reflete o vigente
  });
});

describe('Slice Colaboração Mensal — recusas sem efeito residual (CB-02, CM-02, CB-03)', () => {
  test('sem Parceira ativa: CM-03 e a aba permanece só com o cabeçalho', () => {
    const { servico, sheet, eventos } = montarFatia([]);

    expect(() => servico.executar('2026-07')).toThrow(/CM-03/);
    expect(sheet.rows).toHaveLength(1);
    expect(eventos).toHaveLength(0);
  });

  test('MesReferencia inválida: CM-02 e nenhum efeito', () => {
    const { servico, sheet, eventos } = montarFatia(parceirasAtivas());

    expect(() => servico.executar('2026-13')).toThrow(/CM-02/);
    expect(sheet.rows).toHaveLength(1);
    expect(eventos).toHaveLength(0);
  });

  test('falha física na escrita: erro propaga, nenhum evento publicado (C-07)', () => {
    const { servico, sheet, eventos } = montarFatia(parceirasAtivas());
    sheet.getRange = () => {
      throw new Error('quota do Sheets excedida');
    };

    expect(() => servico.executar('2026-07')).toThrow(/quota/);
    expect(sheet.rows).toHaveLength(1);
    expect(eventos).toHaveLength(0);
  });
});
