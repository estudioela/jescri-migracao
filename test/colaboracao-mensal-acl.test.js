const { loadGas } = require('./helpers/gasHarness');

const CABECALHO = [
  'INFLU_KEY',
  'MES_REFERENCIA',
  'ANO_REFERENCIA',
  'ESTADO',
  'SNAPSHOT_VALOR',
  'SNAPSHOT_FORMATOS',
  'SNAPSHOT_QTD_POR_FORMATO',
];

// Fake mínimo da aba COLABORACOES: getDataRange/getValues + escrita em lote
// via getRange(...).setValues(...). Conta os lotes para provar atomicidade.
function fakeSheet(header) {
  let rows = [header.slice()];
  const chamadas = { setValues: 0 };
  return {
    get rows() {
      return rows;
    },
    chamadas,
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    clearContents() {
      rows = [];
    },
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

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
  ]);
}

function novaColaboracao(gas, parceiraId) {
  return new gas.ColaboracaoMensal(
    parceiraId,
    new gas.MesReferencia(2026, 7),
    new gas.CondicaoComercialSnapshot({
      valorMensal: 3500,
      formatosContratados: ['Reels', 'Stories'],
      quantidadePorFormato: { Reels: 2, Stories: 4 },
    })
  );
}

describe('ColaboracaoMensalACL — coerção de ESTADO (ADR-001 §2/§2.1)', () => {
  test('canônico → cru e cru → canônico, case/espaço-insensível', () => {
    const gas = carregar();
    const acl = new gas.ColaboracaoMensalACL(fakeSheet(CABECALHO));

    expect(acl.estadoParaCru('Ativa')).toBe('ATIVA');
    expect(acl.estadoParaCru('Concluída')).toBe('CONCLUIDA');
    expect(acl.estadoParaCru('Arquivada')).toBe('ARQUIVADA');
    expect(acl.estadoParaCanonico(' ativa ')).toBe('Ativa');
    expect(acl.estadoParaCanonico('concluida')).toBe('Concluída');
    expect(acl.estadoParaCanonico('ARQUIVADA')).toBe('Arquivada');
  });

  test('valor desconhecido falha barulhento identificando coluna e valor', () => {
    const gas = carregar();
    const acl = new gas.ColaboracaoMensalACL(fakeSheet(CABECALHO));

    expect(() => acl.estadoParaCanonico('pendente')).toThrow(/ESTADO.*pendente/);
    expect(() => acl.estadoParaCru('Rascunho')).toThrow(/Rascunho/);
  });
});

describe('ColaboracaoMensalACL — inserirEmLote (RN-03, por cabeçalho)', () => {
  test('escreve a competência inteira num único setValues (atômico)', () => {
    const gas = carregar();
    const sheet = fakeSheet(CABECALHO);
    const acl = new gas.ColaboracaoMensalACL(sheet);

    acl.inserirEmLote([novaColaboracao(gas, 'maria'), novaColaboracao(gas, 'ana')]);

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
  });

  test('resolve colunas pelo cabeçalho, nunca por índice fixo', () => {
    const gas = carregar();
    const invertido = CABECALHO.slice().reverse();
    const sheet = fakeSheet(invertido);
    const acl = new gas.ColaboracaoMensalACL(sheet);

    acl.inserirEmLote([novaColaboracao(gas, 'maria')]);

    const linha = sheet.rows[1];
    expect(linha[invertido.indexOf('INFLU_KEY')]).toBe('maria');
    expect(linha[invertido.indexOf('MES_REFERENCIA')]).toBe(7);
    expect(linha[invertido.indexOf('ANO_REFERENCIA')]).toBe(2026);
    expect(linha[invertido.indexOf('ESTADO')]).toBe('ATIVA');
  });

  test('coluna desconhecida no cabeçalho fica em branco (projeção fechada, sem PII)', () => {
    const gas = carregar();
    const sheet = fakeSheet(CABECALHO.concat(['CHAVE_PIX']));
    const acl = new gas.ColaboracaoMensalACL(sheet);

    acl.inserirEmLote([novaColaboracao(gas, 'maria')]);

    expect(sheet.rows[1][CABECALHO.length]).toBe('');
  });
});

describe('ColaboracaoMensalACL — listarTodas (reidratação pelo domínio)', () => {
  test('ida e volta: o que foi inserido volta como agregado íntegro', () => {
    const gas = carregar();
    const sheet = fakeSheet(CABECALHO);
    const acl = new gas.ColaboracaoMensalACL(sheet);
    acl.inserirEmLote([novaColaboracao(gas, 'maria')]);

    const todas = acl.listarTodas();

    expect(todas).toHaveLength(1);
    expect(todas[0].parceiraId).toBe('maria');
    expect(todas[0].mesReferencia.toString()).toBe('2026-07');
    expect(todas[0].estado).toBe('Ativa');
    expect(todas[0].snapshot.valorMensal).toBe(3500);
    expect(todas[0].snapshot.formatosContratados).toEqual(['Reels', 'Stories']);
    expect(todas[0].snapshot.quantidadePorFormato).toEqual({ Reels: 2, Stories: 4 });
  });

  test('reidrata estados avançados atravessando a máquina de estados', () => {
    const gas = carregar();
    const sheet = fakeSheet(CABECALHO);
    const acl = new gas.ColaboracaoMensalACL(sheet);
    sheet.rows.push(['maria', 7, 2026, 'CONCLUIDA', 1000, 'Reels', '{"Reels":1}']);
    sheet.rows.push(['ana', 7, 2026, 'ARQUIVADA', 1000, 'Reels', '{"Reels":1}']);

    const todas = acl.listarTodas();

    expect(todas[0].estado).toBe('Concluída');
    expect(todas[1].estado).toBe('Arquivada');
    expect(Object.isFrozen(todas[1])).toBe(true);
  });

  test('ignora linhas em branco (sem INFLU_KEY) e aba só com cabeçalho', () => {
    const gas = carregar();
    const sheet = fakeSheet(CABECALHO);
    const acl = new gas.ColaboracaoMensalACL(sheet);

    expect(acl.listarTodas()).toEqual([]);

    sheet.rows.push(['', '', '', '', '', '', '']);
    sheet.rows.push(['maria', 7, 2026, 'ATIVA', 1000, 'Reels', '{"Reels":1}']);

    expect(acl.listarTodas()).toHaveLength(1);
  });
});

describe('ColaboracaoMensalACL — arquivarCompetencia (selagem, SPEC-034 RN-06/UC-034.02)', () => {
  test('reescreve ESTADO=ARQUIVADA só das linhas da competência selada', () => {
    const gas = carregar();
    const sheet = fakeSheet(CABECALHO);
    const acl = new gas.ColaboracaoMensalACL(sheet);
    sheet.rows.push(['maria', 7, 2026, 'CONCLUIDA', 3500, 'Reels, Stories', '{"Reels":2,"Stories":4}']);
    sheet.rows.push(['ana', 7, 2026, 'CONCLUIDA', 1000, 'Reels', '{"Reels":1}']);
    sheet.rows.push(['maria', 8, 2026, 'ATIVA', 3500, 'Reels, Stories', '{"Reels":2,"Stories":4}']);

    acl.arquivarCompetencia(new gas.MesReferencia(2026, 7));

    const estados = acl.listarTodas().map((c) => ({
      parceiraId: c.parceiraId,
      mesReferencia: c.mesReferencia.toString(),
      estado: c.estado,
    }));
    expect(estados).toEqual([
      { parceiraId: 'maria', mesReferencia: '2026-07', estado: 'Arquivada' },
      { parceiraId: 'ana', mesReferencia: '2026-07', estado: 'Arquivada' },
      { parceiraId: 'maria', mesReferencia: '2026-08', estado: 'Ativa' },
    ]);
  });

  test('resolve coluna pelo cabeçalho e reescreve a aba num único lote', () => {
    const gas = carregar();
    const invertido = CABECALHO.slice().reverse();
    const sheet = fakeSheet(invertido);
    const acl = new gas.ColaboracaoMensalACL(sheet);
    acl.inserirEmLote([novaColaboracao(gas, 'maria')]);
    // Transição Ativa -> Concluída não é objeto do arquivamento (SPEC-034 §2);
    // simula a competência já concluída direto na linha física.
    const colunaEstado = invertido.indexOf('ESTADO');
    sheet.rows[1][colunaEstado] = 'CONCLUIDA';

    acl.arquivarCompetencia(new gas.MesReferencia(2026, 7));

    expect(sheet.rows[1][colunaEstado]).toBe('ARQUIVADA');
  });

  test('competência sem nenhuma linha correspondente é no-op (CB-03)', () => {
    const gas = carregar();
    const sheet = fakeSheet(CABECALHO);
    const acl = new gas.ColaboracaoMensalACL(sheet);
    sheet.rows.push(['maria', 7, 2026, 'CONCLUIDA', 3500, 'Reels', '{"Reels":1}']);

    acl.arquivarCompetencia(new gas.MesReferencia(2027, 1));

    expect(acl.listarTodas()[0].estado).toBe('Concluída');
  });
});
