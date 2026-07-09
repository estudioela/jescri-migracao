/**
 * Fluxo crítico #5 (prioridade do usuário): APROVAÇÃO.
 * Cobre onEdit() (bloco ATIVAÇÕES) e arquivarGenerico() — mae/Código.js —
 * transição de STATUS_CONTEUDO para "postado" (arquivamento) e cálculo +
 * propagação da DATA_APROVACAO ao editar DATA_ATIVACAO. onEdit() é uma
 * função comum (trigger simples) — chamada diretamente com um evento
 * construído, como o Apps Script faria de verdade.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const {
  criarUtilitiesFake,
  criarLoggerFake,
  criarAbaFake,
  criarSpreadsheetAppFake
} = require('./helpers/gasServiceMocks');
const { INFLUENCIADORA_PADRAO, HEADER_ATIVACOES, linhaAtivacao } = require('./helpers/fixtures');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

const HEADER_HIST_CONT = [...HEADER_ATIVACOES, 'DATA_ARQUIVAMENTO'];
const HEADER_BRIEFING = ['INFLU_KEY', 'CUPOM', 'MES', 'RESUMO', 'APROVACAO_REEL', 'APROVACAO_CARROSSEL', 'APROVACAO_STORIES_1', 'APROVACAO_STORIES_2'];

function linhaBriefing({ influKey = INFLUENCIADORA_PADRAO.influKey, cupom = INFLUENCIADORA_PADRAO.cupom, mes }) {
  return [influKey, cupom, mes, '', '', '', '', ''];
}

function montarAmbiente({ ativacoes, briefings, comHistorico = true, headerBriefing = HEADER_BRIEFING, linhaBriefingBuilder = linhaBriefing }) {
  const abaAtivacoes = criarAbaFake([HEADER_ATIVACOES, ...ativacoes.map(linhaAtivacao)]);
  const abas = { 'ATIVAÇÕES': abaAtivacoes };
  if (comHistorico) abas['HISTÓRICO DE CONTEÚDOS'] = criarAbaFake([HEADER_HIST_CONT]);
  if (briefings) abas['BRIEFING'] = criarAbaFake([headerBriefing, ...briefings.map(linhaBriefingBuilder)]);

  const sandbox = {
    SpreadsheetApp: criarSpreadsheetAppFake(abas),
    Utilities: criarUtilitiesFake(),
    Logger: criarLoggerFake()
  };
  const modulo = loadGasFiles([CODIGO_PATH], sandbox);
  return { modulo, abaAtivacoes, abas };
}

function colunaAtiv(nome) { return HEADER_ATIVACOES.indexOf(nome) + 1; }

function construirEvento({ sheet, row, col, valor }) {
  return {
    range: {
      getSheet: () => sheet,
      getRow: () => row,
      getColumn: () => col,
      getValue: () => valor
    },
    value: valor
  };
}

describe('Código.js — onEdit() — ATIVAÇÕES: STATUS_CONTEUDO -> "postado" arquiva a linha', () => {
  test('linha é movida de ATIVAÇÕES para HISTÓRICO DE CONTEÚDOS, com DATA_ARQUIVAMENTO preenchida', () => {
    const { modulo, abaAtivacoes, abas } = montarAmbiente({
      ativacoes: [{ id: 'ativ-001', status: 'aprovado' }]
    });
    const colStatus = colunaAtiv('STATUS_CONTEUDO');
    abaAtivacoes._linhas[1][colStatus - 1] = 'postado';

    modulo.onEdit(construirEvento({ sheet: abaAtivacoes, row: 2, col: colStatus, valor: 'postado' }));

    expect(abaAtivacoes.getLastRow()).toBe(1); // só sobrou o cabeçalho
    const historico = abas['HISTÓRICO DE CONTEÚDOS'];
    expect(historico._linhas).toHaveLength(2); // cabeçalho + linha migrada
    expect(historico._linhas[1][1]).toBe(INFLUENCIADORA_PADRAO.influKey); // INFLU_KEY preservado
    expect(historico._linhas[1][historico._linhas[1].length - 1]).toBeTruthy(); // DATA_ARQUIVAMENTO
  });

  test('valor que NÃO contém "postado" não arquiva', () => {
    const { modulo, abaAtivacoes, abas } = montarAmbiente({ ativacoes: [{ id: 'ativ-001', status: 'ajustes' }] });
    const colStatus = colunaAtiv('STATUS_CONTEUDO');
    modulo.onEdit(construirEvento({ sheet: abaAtivacoes, row: 2, col: colStatus, valor: 'ajustes' }));
    expect(abaAtivacoes.getLastRow()).toBe(2); // continua lá
    expect(abas['HISTÓRICO DE CONTEÚDOS']._linhas).toHaveLength(1); // só cabeçalho
  });
});

describe('Código.js — onEdit() — ATIVAÇÕES: DATA_ATIVACAO calcula e propaga DATA_APROVACAO', () => {
  test('grava DATA_APROVACAO na própria linha e propaga para APROVACAO_REEL em BRIEFING', () => {
    const { modulo, abaAtivacoes, abas } = montarAmbiente({
      ativacoes: [{ id: 'ativ-001', mes: 'JULHO', formato: 'REEL' }],
      briefings: [{ mes: 'JULHO' }]
    });
    const colDataAtiv = colunaAtiv('DATA_ATIVACAO');
    const dataEdicao = new Date(2024, 0, 9); // terça-feira (ver test de calcularDataAprovacao)
    abaAtivacoes._linhas[1][colDataAtiv - 1] = dataEdicao;

    modulo.onEdit(construirEvento({ sheet: abaAtivacoes, row: 2, col: colDataAtiv, valor: dataEdicao }));

    const colDataAprov = colunaAtiv('DATA_APROVACAO');
    const dataAprovacaoGravada = abaAtivacoes._linhas[1][colDataAprov - 1];
    expect(dataAprovacaoGravada).toBeInstanceOf(Date);
    expect(dataAprovacaoGravada.getDate()).toBe(2); // terça anterior (mesma regra já testada em calcularDataAprovacao)

    const briefing = abas['BRIEFING'];
    const colAprovacaoReel = HEADER_BRIEFING.indexOf('APROVACAO_REEL') + 1;
    expect(briefing._linhas[1][colAprovacaoReel - 1]).toEqual(dataAprovacaoGravada);
  });

  test('formato CARROSSEL propaga para a coluna APROVACAO_CARROSSEL (não REEL)', () => {
    const { modulo, abaAtivacoes, abas } = montarAmbiente({
      ativacoes: [{ id: 'ativ-001', mes: 'JULHO', formato: 'CARROSSEL' }],
      briefings: [{ mes: 'JULHO' }]
    });
    const colDataAtiv = colunaAtiv('DATA_ATIVACAO');
    const dataEdicao = new Date(2024, 0, 9);
    abaAtivacoes._linhas[1][colDataAtiv - 1] = dataEdicao;
    modulo.onEdit(construirEvento({ sheet: abaAtivacoes, row: 2, col: colDataAtiv, valor: dataEdicao }));

    const briefing = abas['BRIEFING'];
    const colAprovacaoCarrossel = HEADER_BRIEFING.indexOf('APROVACAO_CARROSSEL') + 1;
    const colAprovacaoReel = HEADER_BRIEFING.indexOf('APROVACAO_REEL') + 1;
    expect(briefing._linhas[1][colAprovacaoCarrossel - 1]).toBeInstanceOf(Date);
    expect(briefing._linhas[1][colAprovacaoReel - 1]).toBe(''); // não vazou pra coluna errada
  });

  test('sem briefing correspondente (mês diferente) não propaga e não lança erro', () => {
    const { modulo, abaAtivacoes, abas } = montarAmbiente({
      ativacoes: [{ id: 'ativ-001', mes: 'JULHO', formato: 'REEL' }],
      briefings: [{ mes: 'AGOSTO' }] // não bate com a ativação
    });
    const colDataAtiv = colunaAtiv('DATA_ATIVACAO');
    const dataEdicao = new Date(2024, 0, 9);
    abaAtivacoes._linhas[1][colDataAtiv - 1] = dataEdicao;
    expect(() => modulo.onEdit(construirEvento({ sheet: abaAtivacoes, row: 2, col: colDataAtiv, valor: dataEdicao }))).not.toThrow();

    const briefing = abas['BRIEFING'];
    const colAprovacaoReel = HEADER_BRIEFING.indexOf('APROVACAO_REEL') + 1;
    expect(briefing._linhas[1][colAprovacaoReel - 1]).toBe('');
  });

  test('limpar a célula DATA_ATIVACAO limpa também DATA_APROVACAO', () => {
    const { modulo, abaAtivacoes } = montarAmbiente({
      ativacoes: [{ id: 'ativ-001', mes: 'JULHO', formato: 'REEL', dataAprovacao: new Date(2026, 6, 1) }]
    });
    const colDataAtiv = colunaAtiv('DATA_ATIVACAO');
    abaAtivacoes._linhas[1][colDataAtiv - 1] = '';
    modulo.onEdit(construirEvento({ sheet: abaAtivacoes, row: 2, col: colDataAtiv, valor: '' }));

    const colDataAprov = colunaAtiv('DATA_APROVACAO');
    expect(abaAtivacoes._linhas[1][colDataAprov - 1]).toBe('');
  });
});

/**
 * (2026-07-07) Propagação de DATA_APROVACAO (bloco DATA_ATIVACAO acima) casava
 * com BRIEFING só por MES — duas campanhas do mesmo mês em anos diferentes
 * colidiam. Ajustado para exigir também ANO_REFERENCIA igual (coluna nova em
 * BRIEFING, ver garantirColunaAnoReferenciaBriefing() em mae/Código.js).
 */
describe('Código.js — onEdit() — ATIVAÇÕES: propagação por MES + ANO_REFERENCIA', () => {
  const HEADER_BRIEFING_COM_ANO = [...HEADER_BRIEFING, 'ANO_REFERENCIA'];
  function linhaBriefingComAno({ influKey = INFLUENCIADORA_PADRAO.influKey, cupom = INFLUENCIADORA_PADRAO.cupom, mes, ano }) {
    return [influKey, cupom, mes, '', '', '', '', '', ano !== undefined ? ano : ''];
  }

  test('duas campanhas do mesmo MES em ANO_REFERENCIA diferente: propaga só para o briefing do ano certo', () => {
    const { modulo, abaAtivacoes, abas } = montarAmbiente({
      ativacoes: [{ id: 'ativ-001', mes: 'JULHO', ano: 2026, formato: 'REEL' }],
      briefings: [
        { mes: 'JULHO', ano: 2025 },
        { mes: 'JULHO', ano: 2026 }
      ],
      headerBriefing: HEADER_BRIEFING_COM_ANO,
      linhaBriefingBuilder: linhaBriefingComAno
    });
    const colDataAtiv = colunaAtiv('DATA_ATIVACAO');
    const dataEdicao = new Date(2024, 0, 9);
    abaAtivacoes._linhas[1][colDataAtiv - 1] = dataEdicao;

    modulo.onEdit(construirEvento({ sheet: abaAtivacoes, row: 2, col: colDataAtiv, valor: dataEdicao }));

    const briefing = abas['BRIEFING'];
    const colAprovacaoReel = HEADER_BRIEFING_COM_ANO.indexOf('APROVACAO_REEL') + 1;
    expect(briefing._linhas[1][colAprovacaoReel - 1]).toBe(''); // linha de 2025 não recebeu
    expect(briefing._linhas[2][colAprovacaoReel - 1]).toBeInstanceOf(Date); // linha de 2026 recebeu
  });

  test('linha de BRIEFING legado sem ANO_REFERENCIA preenchido ainda casa (compatibilidade de transição)', () => {
    const { modulo, abaAtivacoes, abas } = montarAmbiente({
      ativacoes: [{ id: 'ativ-001', mes: 'JULHO', ano: 2026, formato: 'REEL' }],
      briefings: [{ mes: 'JULHO' }], // sem 'ano' -> célula ANO_REFERENCIA fica vazia
      headerBriefing: HEADER_BRIEFING_COM_ANO,
      linhaBriefingBuilder: linhaBriefingComAno
    });
    const colDataAtiv = colunaAtiv('DATA_ATIVACAO');
    const dataEdicao = new Date(2024, 0, 9);
    abaAtivacoes._linhas[1][colDataAtiv - 1] = dataEdicao;

    modulo.onEdit(construirEvento({ sheet: abaAtivacoes, row: 2, col: colDataAtiv, valor: dataEdicao }));

    const briefing = abas['BRIEFING'];
    const colAprovacaoReel = HEADER_BRIEFING_COM_ANO.indexOf('APROVACAO_REEL') + 1;
    expect(briefing._linhas[1][colAprovacaoReel - 1]).toBeInstanceOf(Date);
  });
});

describe('Código.js — onEdit() — defensivo', () => {
  test('evento sem range é ignorado silenciosamente', () => {
    const { modulo } = montarAmbiente({ ativacoes: [{ id: 'ativ-001' }] });
    expect(() => modulo.onEdit({})).not.toThrow();
    expect(() => modulo.onEdit(null)).not.toThrow();
  });

  test('edição na linha de cabeçalho (row 1) é ignorada', () => {
    const { modulo, abaAtivacoes } = montarAmbiente({ ativacoes: [{ id: 'ativ-001' }] });
    const colStatus = colunaAtiv('STATUS_CONTEUDO');
    modulo.onEdit(construirEvento({ sheet: abaAtivacoes, row: 1, col: colStatus, valor: 'postado' }));
    expect(abaAtivacoes.getLastRow()).toBe(2); // nada mudou
  });

  test('edição em aba não tratada (fora de BRIEFING/ATIVAÇÕES/BASE/PAGAMENTOS/FLUXO) é ignorada', () => {
    const { modulo } = montarAmbiente({ ativacoes: [{ id: 'ativ-001' }] });
    const abaQualquer = criarAbaFake([['X'], ['y']]);
    abaQualquer.getName = () => 'CADASTROS';
    expect(() => modulo.onEdit(construirEvento({ sheet: abaQualquer, row: 2, col: 1, valor: 'y' }))).not.toThrow();
  });
});

describe('Código.js — arquivarGenerico() — motor de arquivamento', () => {
  test('só move linhas cuja chave bate (case-insensitive, substring); demais permanecem', () => {
    const { modulo, abaAtivacoes, abas } = montarAmbiente({
      ativacoes: [
        { id: 'a1', status: 'em aberto' },
        { id: 'a2', status: 'POSTADO (revisado)' }, // contém "postado", case diferente
        { id: 'a3', status: 'ajustes' }
      ]
    });
    const movidos = modulo.arquivarGenerico('ATIVAÇÕES', 'HISTÓRICO DE CONTEÚDOS', 'STATUS_CONTEUDO', ['postado'], true);
    expect(movidos).toBe(1);
    expect(abaAtivacoes.getLastRow()).toBe(3); // cabeçalho + 2 linhas restantes
    expect(abas['HISTÓRICO DE CONTEÚDOS']._linhas).toHaveLength(2); // cabeçalho + 1 migrada
  });

  test('aba de origem ou destino ausente não quebra — retorna 0', () => {
    const { modulo } = montarAmbiente({ ativacoes: [{ id: 'a1', status: 'postado' }], comHistorico: false });
    expect(modulo.arquivarGenerico('ATIVAÇÕES', 'HISTÓRICO DE CONTEÚDOS', 'STATUS_CONTEUDO', ['postado'], true)).toBe(0);
  });
});
