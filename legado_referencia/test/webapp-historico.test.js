/**
 * Fluxo crítico #4 (prioridade do usuário): HISTÓRICO.
 * Cobre getHistorico(), detectarAbasHistoricoLegado() e listarPeriodos() —
 * mae/WebApp.js — a lógica de detecção dinâmica de abas legado é a mais
 * frágil do sistema por natureza (SYSTEM_MAP.md item 10, FLOW.md "critério
 * de admissão de aba legado").
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
const { HEADER_BASE, linhaBase, INFLUENCIADORA_PADRAO } = require('./helpers/fixtures');

const WEBAPP_PATH = path.join(__dirname, '..', 'mae', 'WebApp.js');
const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

const HEADER_HIST_CONT = ['ID', 'INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'FORMATO', 'DATA_APROVACAO', 'DATA_ATIVACAO', 'STATUS_CONTEUDO', 'LINK_ARQUIVO', 'DATA_ARQUIVAMENTO'];
const HEADER_HIST_PAG = ['INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'VALOR_TOTAL', 'CHAVE_PIX', 'STATUS_PAGAMENTO', 'DATA_PAGAMENTO', 'MENSAGEM_PIX', 'DATA_ARQUIVAMENTO'];

function linhaHistCont({ id, influKey = INFLUENCIADORA_PADRAO.influKey, mes, ano = 2026, formato = 'REEL' }) {
  return [id, influKey, mes, ano, formato, '05/07/2026', '12/07/2026', 'postado', 'https://drive/link', '13/07/2026'];
}
function linhaHistPag({ influKey = INFLUENCIADORA_PADRAO.influKey, mes, ano = 2026, valor = 1000 }) {
  return [influKey, mes, ano, valor, 'chave-pix', 'pago', '15/07/2026', 'msg', '16/07/2026'];
}

function montarAmbiente({ historicoCont, historicoPag, abasExtras }) {
  const abas = {
    'BASE DE DADOS': criarAbaFake([HEADER_BASE, linhaBase(INFLUENCIADORA_PADRAO)])
  };
  if (historicoCont) abas['HISTÓRICO DE CONTEÚDOS'] = criarAbaFake([HEADER_HIST_CONT, ...historicoCont.map(linhaHistCont)]);
  if (historicoPag) abas['HISTÓRICO DE PAGAMENTOS'] = criarAbaFake([HEADER_HIST_PAG, ...historicoPag.map(linhaHistPag)]);
  Object.assign(abas, abasExtras || {});

  const sandbox = {
    SpreadsheetApp: criarSpreadsheetAppFake(abas),
    CacheService: criarCacheServiceFake(),
    LockService: criarLockServiceFake(),
    Utilities: criarUtilitiesFake(),
    Logger: criarLoggerFake()
  };
  const modulo = loadGasFiles([CODIGO_PATH, WEBAPP_PATH], sandbox);
  const token = modulo.login('MARIA10', '12345').token;
  return { modulo, token, ss: sandbox.SpreadsheetApp.getActiveSpreadsheet() };
}

describe('WebApp.js — getHistorico() — abas oficiais', () => {
  test('agrega ativações e pagamentos oficiais, sempre com status terminal (PUBLICADO/PAGO)', () => {
    const { modulo, token } = montarAmbiente({
      historicoCont: [{ id: 'h1', mes: 'JULHO' }],
      historicoPag: [{ mes: 'JULHO' }]
    });
    const res = modulo.getHistorico(token, 'JULHO', 2026);
    expect(res.ok).toBe(true);
    expect(res.ativacoes).toHaveLength(1);
    expect(res.ativacoes[0].status).toBe('PUBLICADO');
    expect(res.ativacoes[0].formato).toBe('REEL');
    expect(res.pagamentos).toHaveLength(1);
    expect(res.pagamentos[0].etapa).toBe('PAGO');
  });

  test('filtra por mês/ano — não retorna histórico de outro período', () => {
    const { modulo, token } = montarAmbiente({
      historicoCont: [{ id: 'h1', mes: 'JULHO', ano: 2026 }, { id: 'h2', mes: 'JUNHO', ano: 2026 }],
      historicoPag: []
    });
    const res = modulo.getHistorico(token, 'JULHO', 2026);
    expect(res.ativacoes).toHaveLength(1);
    expect(res.ativacoes[0].campanha).toBe('JULHO 2026');
  });

  test('não vaza histórico de outra influenciadora', () => {
    const { modulo, token } = montarAmbiente({
      historicoCont: [{ id: 'h1', mes: 'JULHO', influKey: 'OUTRA INFLUENCIADORA' }],
      historicoPag: []
    });
    const res = modulo.getHistorico(token, 'JULHO', 2026);
    expect(res.ativacoes).toHaveLength(0);
  });

  test('abas de histórico oficiais ausentes não quebram — retorna listas vazias', () => {
    const { modulo, token } = montarAmbiente({ historicoCont: null, historicoPag: null });
    expect(modulo.getHistorico(token, 'JULHO', 2026)).toEqual({ ok: true, ativacoes: [], pagamentos: [] });
  });

  test('token inválido → SESSAO_EXPIRADA', () => {
    const { modulo } = montarAmbiente({ historicoCont: [], historicoPag: [] });
    expect(modulo.getHistorico('token-invalido', 'JULHO', 2026)).toEqual({ ok: false, erro: 'SESSAO_EXPIRADA' });
  });
});

describe('WebApp.js — detectarAbasHistoricoLegado()', () => {
  test('aba com "HISTÓRICO" no nome, sem STATUS_CONTEUDO/STATUS_PAGAMENTO no cabeçalho, é classificada pelo nome', () => {
    const { modulo, ss } = montarAmbiente({
      abasExtras: {
        'HISTÓRICO 2024': criarAbaFake([
          ['INFLU_KEY', 'MES_REFERENCIA', 'FORMATO', 'ALGUMA_COISA'],
          [INFLUENCIADORA_PADRAO.influKey, 'MAIO', 'REEL', 'x']
        ])
      }
    });
    const detectadas = modulo.detectarAbasHistoricoLegado(ss);
    expect(detectadas).toEqual([{ nome: 'HISTÓRICO 2024', tipo: 'CONTEUDO' }]);
  });

  test('aba "HISTÓRICO PAGAMENTOS ..." (nome contém "PAGAMENTO") é classificada como PAGAMENTO', () => {
    const { modulo, ss } = montarAmbiente({
      abasExtras: {
        'HISTÓRICO PAGAMENTOS 2023': criarAbaFake([
          ['INFLU_KEY', 'MES_REFERENCIA', 'VALOR'],
          [INFLUENCIADORA_PADRAO.influKey, 'ABRIL', 500]
        ])
      }
    });
    const detectadas = modulo.detectarAbasHistoricoLegado(ss);
    expect(detectadas).toEqual([{ nome: 'HISTÓRICO PAGAMENTOS 2023', tipo: 'PAGAMENTO' }]);
  });

  test('aba SEM "histórico" no nome mas com assinatura completa (INFLU_KEY+MES_REFERENCIA+STATUS_CONTEUDO) é detectada', () => {
    const { modulo, ss } = montarAmbiente({
      abasExtras: {
        'JULHO2025': criarAbaFake([
          ['INFLU_KEY', 'MES_REFERENCIA', 'STATUS_CONTEUDO'],
          [INFLUENCIADORA_PADRAO.influKey, 'JULHO', 'postado']
        ])
      }
    });
    const detectadas = modulo.detectarAbasHistoricoLegado(ss);
    expect(detectadas).toEqual([{ nome: 'JULHO2025', tipo: 'CONTEUDO' }]);
  });

  test('aba sem "histórico" no nome e sem assinatura completa (falta STATUS_*) NÃO é detectada', () => {
    const { modulo, ss } = montarAmbiente({
      abasExtras: {
        'JULHO2025': criarAbaFake([
          ['INFLU_KEY', 'MES_REFERENCIA'],
          [INFLUENCIADORA_PADRAO.influKey, 'JULHO']
        ])
      }
    });
    expect(modulo.detectarAbasHistoricoLegado(ss)).toEqual([]);
  });

  test('aba sem INFLU_KEY no cabeçalho nunca é detectada, mesmo com "histórico" no nome', () => {
    const { modulo, ss } = montarAmbiente({
      abasExtras: {
        'HISTÓRICO SEM CHAVE': criarAbaFake([['NOME', 'MES'], ['Alguém', 'JULHO']])
      }
    });
    expect(modulo.detectarAbasHistoricoLegado(ss)).toEqual([]);
  });

  test('aba vazia (só cabeçalho, sem linhas de dados) não é detectada', () => {
    const { modulo, ss } = montarAmbiente({
      abasExtras: { 'HISTÓRICO VAZIO': criarAbaFake([['INFLU_KEY', 'MES_REFERENCIA']]) }
    });
    expect(modulo.detectarAbasHistoricoLegado(ss)).toEqual([]);
  });

  test('abas oficiais (BASE DE DADOS, ATIVAÇÕES etc.) nunca são tratadas como legado', () => {
    const { modulo, ss } = montarAmbiente({
      historicoCont: [{ id: 'h1', mes: 'JULHO' }],
      historicoPag: [{ mes: 'JULHO' }]
    });
    expect(modulo.detectarAbasHistoricoLegado(ss)).toEqual([]);
  });

  test('getHistorico agrega dados de abas legado detectadas dinamicamente (busca sem ano específico)', () => {
    const { modulo, token } = montarAmbiente({
      abasExtras: {
        'HISTÓRICO 2024': criarAbaFake([
          ['INFLU_KEY', 'MES_REFERENCIA', 'FORMATO'],
          [INFLUENCIADORA_PADRAO.influKey, 'JULHO', 'CARROSSEL']
        ])
      }
    });
    const res = modulo.getHistorico(token, 'JULHO', null);
    expect(res.ativacoes).toHaveLength(1);
    expect(res.ativacoes[0].formato).toBe('CARROSSEL');
    expect(res.ativacoes[0].status).toBe('PUBLICADO');
  });

  test('ACHADO (comportamento real, verificado ao escrever este teste — não é o que a primeira versão deste teste assumia): aba legado SEM coluna ANO_REFERENCIA é excluída quando a busca informa um ano específico, não "ignora" o filtro', () => {
    // extrairAtivacoes/extrairPagamentos comparam rowAno (null, já que a
    // coluna não existe) === anoFiltro (2026) → nunca bate. Na prática isso
    // só é alcançável pelo Portal se listarPeriodos() expuser esse período
    // como {mes, ano:null} e o usuário selecionar exatamente essa entrada —
    // não é tratado como "mesmo período" de uma linha oficial com ano 2026.
    const { modulo, token } = montarAmbiente({
      abasExtras: {
        'HISTÓRICO 2024': criarAbaFake([
          ['INFLU_KEY', 'MES_REFERENCIA', 'FORMATO'],
          [INFLUENCIADORA_PADRAO.influKey, 'JULHO', 'CARROSSEL']
        ])
      }
    });
    const res = modulo.getHistorico(token, 'JULHO', 2026);
    expect(res.ativacoes).toHaveLength(0);
  });

  test('resultado da detecção é cacheado (5 min) — uma aba legado criada após a 1ª chamada não aparece até o cache expirar', () => {
    const { modulo, ss } = montarAmbiente({});
    expect(modulo.listarAbasHistoricoLegado(ss)).toEqual([]);

    // simula uma aba legado nova aparecendo na planilha depois da 1ª varredura
    const abaNova = criarAbaFake([
      ['INFLU_KEY', 'MES_REFERENCIA', 'STATUS_CONTEUDO'],
      [INFLUENCIADORA_PADRAO.influKey, 'JULHO', 'postado']
    ]);
    abaNova.getName = () => 'JULHO2025';
    ss.getSheets = () => [...ss.getSheets(), abaNova];

    // ainda dentro da janela de cache de 5 min: continua vazio (documenta o comportamento aceito)
    expect(modulo.listarAbasHistoricoLegado(ss)).toEqual([]);
  });
});

describe('WebApp.js — listarPeriodos()', () => {
  test('agrega períodos únicos de ATIVAÇÕES/PAGAMENTOS/histórico e ordena do mais recente ao mais antigo', () => {
    const HEADER_ATIV = ['ID', 'INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'FORMATO', 'STATUS_CONTEUDO'];
    const { modulo, token } = montarAmbiente({
      historicoCont: [{ id: 'h1', mes: 'JANEIRO', ano: 2025 }],
      historicoPag: [],
      abasExtras: {
        'ATIVAÇÕES': criarAbaFake([
          HEADER_ATIV,
          ['a1', INFLUENCIADORA_PADRAO.influKey, 'JULHO', 2026, 'REEL', 'em aberto'],
          ['a2', INFLUENCIADORA_PADRAO.influKey, 'AGOSTO', 2026, 'REEL', 'em aberto']
        ])
      }
    });
    const res = modulo.listarPeriodos(token);
    expect(res.ok).toBe(true);
    expect(res.periodos).toEqual([
      { mes: 'AGOSTO', ano: 2026 },
      { mes: 'JULHO', ano: 2026 },
      { mes: 'JANEIRO', ano: 2025 }
    ]);
  });

  test('token inválido → SESSAO_EXPIRADA', () => {
    const { modulo } = montarAmbiente({});
    expect(modulo.listarPeriodos('token-invalido')).toEqual({ ok: false, erro: 'SESSAO_EXPIRADA' });
  });
});
