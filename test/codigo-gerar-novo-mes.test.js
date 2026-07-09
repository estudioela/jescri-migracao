/**
 * gerarNovoMesCompleto() — mae/Código.js (~L83). Motor de criação do
 * planejamento mensal (BRIEFING + ATIVAÇÕES + FLUXO LOGÍSTICO + PAGAMENTOS)
 * para todas as influenciadoras ativas de uma vez — a função mais crítica
 * do ERP: um erro aqui afeta todas as influenciadoras simultaneamente.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const { criarUtilitiesFake, criarLoggerFake, criarAbaFake, criarSpreadsheetAppFake } = require('./helpers/gasServiceMocks');
const { HEADER_ATIVACOES } = require('./helpers/fixtures');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

const HEADER_BASE = ['STATUS', 'INFLU_KEY', 'CUPOM', 'PASTA_DRIVE_LINK', 'INFLUENCIADORA_ENDERECO', 'VALOR_TOTAL', 'CHAVE_PIX', 'REELS_TEXTO', 'CARROSSEL_TEXTO', 'STORIES_TEXTO'];
const HEADER_BRIEFING = ['INFLU_KEY', 'CUPOM', 'MES', 'RESUMO', 'PASTA_DRIVE_LINK'];
const HEADER_PAGAMENTOS = ['INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'VALOR_TOTAL', 'CHAVE_PIX', 'STATUS_PAGAMENTO', 'DATA_PAGAMENTO', 'MENSAGEM_PIX'];
const HEADER_FLUXO = ['INFLU_KEY', 'ENDERECO', 'STATUS_REVISAO', 'MES_REFERENCIA', 'RASTREIO', 'DATA_DE_ENVIO', 'STATUS_LOGISTICA'];

function linhaBaseInflu({ status = 'ON', nome, cupom, pasta = '', endereco = '', valor = 0, pix = '', qReels = 0, qCarrosel = 0, qStories = 0 }) {
  return [status, nome, cupom, pasta, endereco, valor, pix, qReels, qCarrosel, qStories];
}

function montarAmbiente({ influenciadoras = [], briefingAntigo = [], respostaPrompt }) {
  const abaBase = criarAbaFake([HEADER_BASE, ...influenciadoras.map(linhaBaseInflu)]);
  const abaBriefing = criarAbaFake([HEADER_BRIEFING, ...briefingAntigo]);
  const abaAtiv = criarAbaFake([HEADER_ATIVACOES]);
  const abaFluxo = criarAbaFake([HEADER_FLUXO]);
  const abaPag = criarAbaFake([HEADER_PAGAMENTOS]);

  const abas = {
    'BASE DE DADOS': abaBase,
    'BRIEFING': abaBriefing,
    'ATIVAÇÕES': abaAtiv,
    'FLUXO LOGÍSTICO': abaFluxo,
    'PAGAMENTOS': abaPag
  };

  const uiFake = {
    _alertas: [],
    prompt: () => respostaPrompt || { getSelectedButton: () => 'OK', getResponseText: () => 'AGOSTO 2026' },
    alert: (...args) => { uiFake._alertas.push(args); },
    ButtonSet: { OK_CANCEL: 'OK_CANCEL', OK: 'OK' },
    Button: { OK: 'OK' }
  };

  const spreadsheetAppFake = criarSpreadsheetAppFake(abas);
  spreadsheetAppFake.getUi = () => uiFake;

  const sandbox = {
    SpreadsheetApp: spreadsheetAppFake,
    Utilities: criarUtilitiesFake(),
    Logger: criarLoggerFake(),
    // exportarSchemaAoIniciarNovoMes vive em mae/SchemaExporter.js, não em
    // Código.js — no projeto real ambos compartilham o mesmo namespace
    // global; aqui, como só queremos testar gerarNovoMesCompleto(), stub
    // simples no lugar de carregar SchemaExporter.js inteiro (que traria
    // dependências de Drive/Properties irrelevantes para este teste).
    exportarSchemaAoIniciarNovoMes: () => {}
  };
  const modulo = loadGasFiles([CODIGO_PATH], sandbox);
  return { modulo, abas, uiFake };
}

function formatosDe(abaAtiv) {
  return abaAtiv._linhas.slice(1).map((r) => r[HEADER_ATIVACOES.indexOf('FORMATO')]);
}

describe('Código.js — gerarNovoMesCompleto() — fluxo feliz', () => {
  test('gera ATIVAÇÕES/BRIEFING/FLUXO/PAGAMENTOS para 1 influenciadora ativa, com as quantidades corretas', () => {
    const { modulo, abas } = montarAmbiente({
      influenciadoras: [{
        status: 'ON', nome: 'MARIA INFLUENCER', cupom: 'MARIA10', pasta: 'https://drive/pasta',
        endereco: 'Rua Teste, 123', valor: 1000, pix: 'chave-pix', qReels: 2, qCarrosel: 1, qStories: 2
      }]
    });

    modulo.gerarNovoMesCompleto();

    const abaAtiv = abas['ATIVAÇÕES'];
    expect(abaAtiv._linhas).toHaveLength(6); // cabeçalho + 2 REEL + 1 CARROSSEL + 2 STORIES
    const formatos = formatosDe(abaAtiv).sort();
    expect(formatos).toEqual(['CARROSSEL', 'REEL', 'REEL', 'STORIES_1', 'STORIES_2'].sort());

    const colStatus = HEADER_ATIVACOES.indexOf('STATUS_CONTEUDO');
    const colId = HEADER_ATIVACOES.indexOf('ID');
    abaAtiv._linhas.slice(1).forEach((r) => {
      expect(r[colStatus]).toBe('em aberto');
      expect(r[colId]).toBeTruthy();
    });

    const abaBrief = abas['BRIEFING'];
    expect(abaBrief._linhas).toHaveLength(2); // cabeçalho + 1 nova linha
    expect(abaBrief._linhas[1][0]).toBe('MARIA INFLUENCER'); // INFLU_KEY
    expect(abaBrief._linhas[1][1]).toBe('MARIA10'); // CUPOM
    expect(abaBrief._linhas[1][2]).toBe('AGOSTO'); // MES

    const abaFluxo = abas['FLUXO LOGÍSTICO'];
    expect(abaFluxo._linhas).toHaveLength(2);
    expect(abaFluxo._linhas[1]).toEqual(['MARIA INFLUENCER', 'Rua Teste, 123', 'Aguardando Confirmação', 'AGOSTO', '', '', 'pendente']);

    const abaPag = abas['PAGAMENTOS'];
    expect(abaPag._linhas).toHaveLength(2);
    const colStatusPag = HEADER_PAGAMENTOS.indexOf('STATUS_PAGAMENTO');
    expect(abaPag._linhas[1][colStatusPag]).toBe('em aberto');
  });

  test('qStories = 1 gera formato "STORIES" (sem sufixo numérico)', () => {
    const { modulo, abas } = montarAmbiente({
      influenciadoras: [{ nome: 'ANA', cupom: 'ANA10', qStories: 1 }]
    });
    modulo.gerarNovoMesCompleto();
    expect(formatosDe(abas['ATIVAÇÕES'])).toEqual(['STORIES']);
  });
});

describe('Código.js — gerarNovoMesCompleto() — filtragem por status', () => {
  test('influenciadora OFF é ignorada; só a ON gera linhas', () => {
    const { modulo, abas } = montarAmbiente({
      influenciadoras: [
        { status: 'ON', nome: 'ATIVA', cupom: 'ATIVA10', qReels: 1 },
        { status: 'OFF', nome: 'INATIVA', cupom: 'INATIVA10', qReels: 5 }
      ]
    });
    modulo.gerarNovoMesCompleto();

    const abaAtiv = abas['ATIVAÇÕES'];
    expect(abaAtiv._linhas).toHaveLength(2); // cabeçalho + 1 (só da ATIVA)
    expect(abaAtiv._linhas[1][HEADER_ATIVACOES.indexOf('INFLU_KEY')]).toBe('ATIVA');
    expect(abas['BRIEFING']._linhas).toHaveLength(2); // só 1 influenciadora processada
  });

  test('nenhuma influenciadora ativa → alerta de aviso, nenhuma linha gerada em nenhuma aba', () => {
    const { modulo, abas, uiFake } = montarAmbiente({
      influenciadoras: [{ status: 'OFF', nome: 'INATIVA', cupom: 'INATIVA10', qReels: 3 }]
    });
    modulo.gerarNovoMesCompleto();

    expect(abas['ATIVAÇÕES']._linhas).toHaveLength(1);
    expect(abas['BRIEFING']._linhas).toHaveLength(1);
    expect(abas['FLUXO LOGÍSTICO']._linhas).toHaveLength(1);
    expect(abas['PAGAMENTOS']._linhas).toHaveLength(1);
    expect(uiFake._alertas.some((a) => a[0] === 'Aviso')).toBe(true);
  });
});

describe('Código.js — gerarNovoMesCompleto() — BRIEFING é limpo antes de gerar', () => {
  test('conteúdo antigo do BRIEFING desaparece; nova linha reflete a campanha atual', () => {
    const { modulo, abas } = montarAmbiente({
      influenciadoras: [{ nome: 'MARIA INFLUENCER', cupom: 'MARIA10', qReels: 1 }],
      briefingAntigo: [['OLD_INFLU', 'OLDCUPOM', 'JUNHO', 'resumo antigo que deve sumir', '']]
    });
    modulo.gerarNovoMesCompleto();

    const abaBrief = abas['BRIEFING'];
    expect(abaBrief._linhas).toHaveLength(2); // cabeçalho + a mesma posição de linha, reaproveitada
    expect(abaBrief._linhas[1][0]).toBe('MARIA INFLUENCER'); // INFLU_KEY novo, não mais OLD_INFLU
    expect(abaBrief._linhas[1][2]).toBe('AGOSTO'); // MES novo, não mais JUNHO
    expect(abaBrief._linhas[1][3]).toBe(''); // RESUMO: limpo pelo clearContent, e gerarNovoMesCompleto não reescreve essa coluna
  });

  test('ACHADO (comportamento real, não corrigido — só documentado): se o BRIEFING antigo tinha mais linhas que o número de influenciadoras ativas no novo mês, as linhas excedentes ficam em branco (não são removidas fisicamente, clearContent só limpa o conteúdo)', () => {
    const { modulo, abas } = montarAmbiente({
      influenciadoras: [{ nome: 'MARIA INFLUENCER', cupom: 'MARIA10', qReels: 1 }], // só 1 ativa
      briefingAntigo: [
        ['OLD_INFLU_1', 'OLDCUPOM1', 'JUNHO', 'resumo 1', ''],
        ['OLD_INFLU_2', 'OLDCUPOM2', 'JUNHO', 'resumo 2', '']
      ] // 2 linhas antigas
    });
    modulo.gerarNovoMesCompleto();

    const abaBrief = abas['BRIEFING'];
    expect(abaBrief._linhas).toHaveLength(3); // cabeçalho + linha reaproveitada + linha órfã em branco
    expect(abaBrief._linhas[1][0]).toBe('MARIA INFLUENCER'); // reaproveitada com dado novo
    expect(abaBrief._linhas[2]).toEqual(['', '', '', '', '']); // órfã: limpa, mas ainda existe fisicamente
  });
});

describe('Código.js — gerarNovoMesCompleto() — usuário cancela o prompt', () => {
  test('getSelectedButton() diferente de OK → função retorna sem gerar nada', () => {
    const { modulo, abas } = montarAmbiente({
      influenciadoras: [{ nome: 'MARIA INFLUENCER', cupom: 'MARIA10', qReels: 2 }],
      respostaPrompt: { getSelectedButton: () => 'CANCEL', getResponseText: () => 'AGOSTO 2026' }
    });
    modulo.gerarNovoMesCompleto();

    expect(abas['ATIVAÇÕES']._linhas).toHaveLength(1);
    expect(abas['BRIEFING']._linhas).toHaveLength(1);
    expect(abas['FLUXO LOGÍSTICO']._linhas).toHaveLength(1);
    expect(abas['PAGAMENTOS']._linhas).toHaveLength(1);
  });
});
