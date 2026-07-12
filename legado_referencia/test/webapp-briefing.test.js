/**
 * Fluxo crítico #3 (prioridade do usuário): BRIEFING.
 * Cobre getBriefing() — mae/WebApp.js — cruzamento ATIVAÇÕES+BRIEFING,
 * seleção do texto por formato (REEL/CARROSSEL/STORIES_1/STORIES_2) e a
 * resolução de todas as colunas de BRIEFING por nome via getHeaderMap
 * (sem índice fixo). Ver FLOW.md "FLOW: Briefing", SYSTEM_MAP.md seção 3.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const {
  criarCacheServiceFake,
  criarLockServiceFake,
  criarUtilitiesFake,
  criarLoggerFake,
  criarAbaFake,
  criarSpreadsheetAppFake
} = require('./helpers/gasServiceMocks');
const { HEADER_BASE, linhaBase, INFLUENCIADORA_PADRAO, HEADER_ATIVACOES, linhaAtivacao } = require('./helpers/fixtures');

const WEBAPP_PATH = path.join(__dirname, '..', 'mae', 'WebApp.js');
const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

const HEADER_BRIEFING_PADRAO = ['INFLU_KEY', 'CUPOM', 'MES', 'RESUMO', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'SOBRE_REEL', 'SOBRE_CARROSSEL', 'SOBRE_STORIES_1', 'SOBRE_STORIES_2'];

// getBriefing (WebApp.js) resolve TODAS as colunas de BRIEFING por nome via
// getHeaderMap (INFLU_KEY, MES, RESUMO/RESUMO_DO_MES/RESUMO_MES,
// SOBRE_REEL..SOBRE_STORIES_2) — não há mais índice fixo nem fallback
// posicional. Este fixture usa o layout padrão (RESUMO na coluna D) por
// conveniência; os testes de layout deslocado provam que a posição não
// importa.
function linhaBriefing({ influKey, cupom, mes, resumo = '', sobreReel = '', sobreCarrossel = '', sobreStories1 = '', sobreStories2 = '' }) {
  const linha = new Array(16).fill('');
  linha[0] = influKey;
  linha[1] = cupom;
  linha[2] = mes;
  linha[3] = resumo;
  linha[12] = sobreReel;
  linha[13] = sobreCarrossel;
  linha[14] = sobreStories1;
  linha[15] = sobreStories2;
  return linha;
}

// ANO_REFERENCIA (2026-07-07): coluna nova em BRIEFING, ver
// garantirColunaAnoReferenciaBriefing() em mae/Código.js. Fixture separado
// (linhaBriefingComAno) em vez de mexer em linhaBriefing()/HEADER_BRIEFING_PADRAO
// — a maioria dos testes acima cobre o layout padrão (sem a coluna nova),
// que continua sendo o caso legado relevante (ver describe abaixo).
const HEADER_BRIEFING_COM_ANO = [...HEADER_BRIEFING_PADRAO, 'ANO_REFERENCIA'];
function linhaBriefingComAno(dados) {
  const linha = linhaBriefing(dados);
  linha.push(dados.ano !== undefined ? dados.ano : '');
  return linha;
}

function montarAmbienteBriefing({ ativacoes, briefings, headerBriefing, semAbaBriefing, linhaBriefingBuilder }) {
  const abaBase = criarAbaFake([HEADER_BASE, linhaBase(INFLUENCIADORA_PADRAO)]);
  const abaAtivacoes = criarAbaFake([HEADER_ATIVACOES, ...ativacoes.map(linhaAtivacao)]);
  const abas = { 'BASE DE DADOS': abaBase, 'ATIVAÇÕES': abaAtivacoes };
  if (!semAbaBriefing) {
    const builder = linhaBriefingBuilder || linhaBriefing;
    abas['BRIEFING'] = criarAbaFake([headerBriefing || HEADER_BRIEFING_PADRAO, ...(briefings || []).map(builder)]);
  }

  const sandbox = {
    SpreadsheetApp: criarSpreadsheetAppFake(abas),
    CacheService: criarCacheServiceFake(),
    LockService: criarLockServiceFake(),
    Utilities: criarUtilitiesFake(),
    Logger: criarLoggerFake()
  };
  const modulo = loadGasFiles([CODIGO_PATH, WEBAPP_PATH], sandbox);
  const token = modulo.login('MARIA10', '12345').token;
  return { modulo, token };
}

const BRIEFING_JULHO = {
  influKey: INFLUENCIADORA_PADRAO.influKey, cupom: INFLUENCIADORA_PADRAO.cupom, mes: 'JULHO',
  resumo: 'Resumo do mês de julho.',
  sobreReel: 'Texto do briefing para REEL.',
  sobreCarrossel: 'Texto do briefing para CARROSSEL.',
  sobreStories1: 'Texto do briefing para STORIES 1.',
  sobreStories2: 'Texto do briefing para STORIES 2.'
};

describe('WebApp.js — getBriefing() — seleção de texto por formato', () => {
  test.each([
    ['REEL', 'Texto do briefing para REEL.'],
    ['CARROSSEL', 'Texto do briefing para CARROSSEL.'],
    ['STORIES_1', 'Texto do briefing para STORIES 1.'],
    ['STORIES', 'Texto do briefing para STORIES 1.'], // formato legado sem sufixo numérico
    ['STORIES_2', 'Texto do briefing para STORIES 2.']
  ])('formato %s retorna o texto correspondente', (formato, textoEsperado) => {
    const { modulo, token } = montarAmbienteBriefing({
      ativacoes: [{ id: 'ativ-001', formato, mes: 'JULHO' }],
      briefings: [BRIEFING_JULHO]
    });
    const res = modulo.getBriefing(token, 'ativ-001');
    expect(res.ok).toBe(true);
    expect(res.textoBriefing).toBe(textoEsperado);
    expect(res.resumoMes).toBe('Resumo do mês de julho.');
    expect(res.campanha).toBe('JULHO');
  });
});

describe('WebApp.js — getBriefing() — casos negativos e de borda', () => {
  test('sem briefing correspondente ao mês/influenciadora → mensagem padrão, sem quebrar', () => {
    const { modulo, token } = montarAmbienteBriefing({
      ativacoes: [{ id: 'ativ-001', formato: 'REEL', mes: 'AGOSTO' }],
      briefings: [BRIEFING_JULHO] // só tem briefing de JULHO
    });
    const res = modulo.getBriefing(token, 'ativ-001');
    expect(res.ok).toBe(true);
    expect(res.textoBriefing).toBe('Briefing não encontrado para este formato/mês.');
    expect(res.resumoMes).toBe('');
  });

  test('aba BRIEFING ausente → ABA_BRIEFING_NAO_ENCONTRADA', () => {
    const { modulo, token } = montarAmbienteBriefing({
      ativacoes: [{ id: 'ativ-001', formato: 'REEL', mes: 'JULHO' }],
      semAbaBriefing: true
    });
    expect(modulo.getBriefing(token, 'ativ-001')).toEqual({ ok: false, erro: 'ABA_BRIEFING_NAO_ENCONTRADA' });
  });

  test('idAtivacao inexistente → ATIVACAO_NAO_ENCONTRADA', () => {
    const { modulo, token } = montarAmbienteBriefing({
      ativacoes: [{ id: 'ativ-001', formato: 'REEL', mes: 'JULHO' }],
      briefings: [BRIEFING_JULHO]
    });
    expect(modulo.getBriefing(token, 'nao-existe')).toEqual({ ok: false, erro: 'ATIVACAO_NAO_ENCONTRADA' });
  });

  test('ativação de outra influenciadora → ACESSO_NEGADO', () => {
    const { modulo, token } = montarAmbienteBriefing({
      ativacoes: [{ id: 'ativ-001', formato: 'REEL', mes: 'JULHO', influKey: 'OUTRA INFLUENCIADORA' }],
      briefings: [BRIEFING_JULHO]
    });
    expect(modulo.getBriefing(token, 'ativ-001')).toEqual({ ok: false, erro: 'ACESSO_NEGADO' });
  });

  test('token inválido → SESSAO_EXPIRADA', () => {
    const { modulo } = montarAmbienteBriefing({
      ativacoes: [{ id: 'ativ-001', formato: 'REEL', mes: 'JULHO' }],
      briefings: [BRIEFING_JULHO]
    });
    expect(modulo.getBriefing('token-invalido', 'ativ-001')).toEqual({ ok: false, erro: 'SESSAO_EXPIRADA' });
  });

  test('fallback de nome de coluna: cabeçalho "Resumo do Mês" (não "RESUMO") ainda é resolvido corretamente, mesmo com RESUMO fora da coluna D', () => {
    // Layout não-padrão: RESUMO deslocado para a coluna E (índice 4), com uma
    // coluna extra na D — só é encontrado porque getHeaderMap resolve por
    // nome normalizado ("Resumo do Mês" -> RESUMO_DO_MES), não por posição.
    const headerCustom = ['INFLU_KEY', 'CUPOM', 'MES', 'OUTRA_COISA', 'Resumo do Mês', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'SOBRE_REEL', 'SOBRE_CARROSSEL', 'SOBRE_STORIES_1', 'SOBRE_STORIES_2'];
    const linhaCustom = [
      INFLUENCIADORA_PADRAO.influKey, INFLUENCIADORA_PADRAO.cupom, 'JULHO', 'lixo',
      'Resumo encontrado pelo nome da coluna.', '', '', '', '', '', '', '',
      'Texto REEL customizado.', '', '', ''
    ];
    const { modulo, token } = montarAmbienteBriefing({
      ativacoes: [{ id: 'ativ-001', formato: 'REEL', mes: 'JULHO' }],
      headerBriefing: headerCustom,
      briefings: [] // injeta a linha manualmente abaixo (layout não é o padrão de linhaBriefing())
    });
    // injeta a linha customizada direto na aba fake (montarAmbienteBriefing só monta pelo fixture padrão)
    const ss = modulo.SpreadsheetApp.getActiveSpreadsheet();
    ss.getSheetByName('BRIEFING')._linhas.push(linhaCustom);

    const res = modulo.getBriefing(token, 'ativ-001');
    expect(res.ok).toBe(true);
    expect(res.resumoMes).toBe('Resumo encontrado pelo nome da coluna.');
    expect(res.textoBriefing).toBe('Texto REEL customizado.');
  });

  test('resiliência a inserção de coluna: coluna extra antes das SOBRE_* desloca todas as posições e getBriefing continua correto', () => {
    // Layout com uma coluna extra ("COLUNA_NOVA") inserida antes do bloco
    // SOBRE_* — todas as posições a partir dali ficam deslocadas em relação
    // ao layout padrão. Só funciona porque getBriefing resolve INFLU_KEY/MES/
    // RESUMO/SOBRE_* por nome (getHeaderMap), nunca por posição.
    const headerDeslocado = ['INFLU_KEY', 'CUPOM', 'MES', 'RESUMO', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'COLUNA_NOVA', 'SOBRE_REEL', 'SOBRE_CARROSSEL', 'SOBRE_STORIES_1', 'SOBRE_STORIES_2'];
    const linhaDeslocada = [
      INFLUENCIADORA_PADRAO.influKey, INFLUENCIADORA_PADRAO.cupom, 'JULHO',
      'Resumo com layout deslocado.', '', '', '', '', '', '', '', '',
      'valor da coluna nova (não é briefing)',
      'Texto REEL deslocado.', 'Texto CARROSSEL deslocado.',
      'Texto STORIES 1 deslocado.', 'Texto STORIES 2 deslocado.'
    ];
    const { modulo, token } = montarAmbienteBriefing({
      ativacoes: [
        { id: 'ativ-reel', formato: 'REEL', mes: 'JULHO' },
        { id: 'ativ-stories', formato: 'STORIES', mes: 'JULHO' }
      ],
      headerBriefing: headerDeslocado,
      briefings: [] // injeta a linha manualmente abaixo (layout não é o padrão de linhaBriefing())
    });
    const ss = modulo.SpreadsheetApp.getActiveSpreadsheet();
    ss.getSheetByName('BRIEFING')._linhas.push(linhaDeslocada);

    const resReel = modulo.getBriefing(token, 'ativ-reel');
    expect(resReel.ok).toBe(true);
    expect(resReel.resumoMes).toBe('Resumo com layout deslocado.');
    expect(resReel.textoBriefing).toBe('Texto REEL deslocado.');

    // "STORIES" (legado, sem sufixo) tem que cair em SOBRE_STORIES_1 mesmo deslocado
    const resStories = modulo.getBriefing(token, 'ativ-stories');
    expect(resStories.ok).toBe(true);
    expect(resStories.textoBriefing).toBe('Texto STORIES 1 deslocado.');
  });
});

/**
 * (2026-07-07) BRIEFING casava com ATIVAÇÕES só por MES (auditoria técnica,
 * seções 16.5/16.6/18.5) — duas campanhas do mesmo mês em anos diferentes
 * colidiam no mesmo registro de briefing. getBriefing() agora também exige
 * ANO_REFERENCIA igual (coluna nova, resolvida por getHeaderMap — ver
 * garantirColunaAnoReferenciaBriefing() em mae/Código.js).
 */
describe('WebApp.js — getBriefing() — casamento por MES + ANO_REFERENCIA', () => {
  test('duas campanhas do mesmo MES em ANO_REFERENCIA diferente não colidem mais', () => {
    const { modulo, token } = montarAmbienteBriefing({
      ativacoes: [{ id: 'ativ-2026', formato: 'REEL', mes: 'JULHO', ano: 2026 }],
      headerBriefing: HEADER_BRIEFING_COM_ANO,
      linhaBriefingBuilder: linhaBriefingComAno,
      briefings: [
        { ...BRIEFING_JULHO, ano: 2025, resumo: 'Resumo 2025', sobreReel: 'Texto REEL 2025.' },
        { ...BRIEFING_JULHO, ano: 2026, resumo: 'Resumo 2026', sobreReel: 'Texto REEL 2026.' }
      ]
    });

    const res = modulo.getBriefing(token, 'ativ-2026');
    expect(res.ok).toBe(true);
    expect(res.resumoMes).toBe('Resumo 2026');
    expect(res.textoBriefing).toBe('Texto REEL 2026.');
  });

  test('linha de BRIEFING legado sem ANO_REFERENCIA preenchido casa com qualquer ano (compatibilidade de transição)', () => {
    const { modulo, token } = montarAmbienteBriefing({
      ativacoes: [{ id: 'ativ-001', formato: 'REEL', mes: 'JULHO', ano: 2026 }],
      headerBriefing: HEADER_BRIEFING_COM_ANO,
      linhaBriefingBuilder: linhaBriefingComAno,
      briefings: [BRIEFING_JULHO] // sem 'ano' -> célula ANO_REFERENCIA fica vazia
    });

    const res = modulo.getBriefing(token, 'ativ-001');
    expect(res.ok).toBe(true);
    expect(res.resumoMes).toBe('Resumo do mês de julho.');
    expect(res.textoBriefing).toBe('Texto do briefing para REEL.');
  });
});
