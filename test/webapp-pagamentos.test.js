/**
 * Fluxo crítico #6 (prioridade do usuário): PAGAMENTOS.
 * Cobre getPagamentos() — mae/WebApp.js (~L431) — filtragem por período,
 * totais previsto/pago e controle de acesso; e o bloco PAGAMENTOS de
 * onEdit() + arquivarGenerico() — mae/Código.js (~L290-291) — transição de
 * STATUS_PAGAMENTO para "pago" (arquivamento automático + preenchimento
 * condicional de DATA_PAGAMENTO). Ver FLOW.md "FLOW: Pagamentos —
 * STATUS_PAGAMENTO = PAGO", SYSTEM_MAP.md seção 6.
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

const HEADER_PAGAMENTOS = ['INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'VALOR_TOTAL', 'CHAVE_PIX', 'STATUS_PAGAMENTO', 'DATA_PAGAMENTO', 'MENSAGEM_PIX'];
const HEADER_HIST_PAG = [...HEADER_PAGAMENTOS, 'DATA_ARQUIVAMENTO'];

function linhaPagamento({ influKey = INFLUENCIADORA_PADRAO.influKey, mes, ano = 2026, valor = 1000, pix = 'chave-pix', status = 'em aberto', dataPagamento = '', mensagemPix = '' }) {
  return [influKey, mes, ano, valor, pix, status, dataPagamento, mensagemPix];
}

function colunaPag(nome) { return HEADER_PAGAMENTOS.indexOf(nome) + 1; }

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

// getPagamentos precisa do login() (WebApp.js) para obter um token —
// carrega Código.js + WebApp.js juntos, como os demais testes desta sessão.
function montarAmbienteWebApp({ pagamentos, semAbaPagamentos }) {
  const abaBase = criarAbaFake([HEADER_BASE, linhaBase(INFLUENCIADORA_PADRAO)]);
  const abas = { 'BASE DE DADOS': abaBase };
  if (!semAbaPagamentos) {
    abas['PAGAMENTOS'] = criarAbaFake([HEADER_PAGAMENTOS, ...(pagamentos || []).map(linhaPagamento)]);
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
  return { modulo, token, abas };
}

// onEdit()/arquivarGenerico() (Código.js) não precisam de login/token —
// só da aba PAGAMENTOS (+ histórico de destino).
function montarAmbienteCodigo({ pagamentos, comHistorico = true }) {
  const abaPagamentos = criarAbaFake([HEADER_PAGAMENTOS, ...pagamentos.map(linhaPagamento)]);
  const abas = { 'PAGAMENTOS': abaPagamentos };
  if (comHistorico) abas['HISTÓRICO DE PAGAMENTOS'] = criarAbaFake([HEADER_HIST_PAG]);

  const sandbox = {
    SpreadsheetApp: criarSpreadsheetAppFake(abas),
    Utilities: criarUtilitiesFake(),
    Logger: criarLoggerFake()
  };
  const modulo = loadGasFiles([CODIGO_PATH], sandbox);
  return { modulo, abaPagamentos, abas };
}

describe('WebApp.js — getPagamentos()', () => {
  test('filtra por mês/ano e calcula totais previsto/pago corretamente', () => {
    const { modulo, token } = montarAmbienteWebApp({
      pagamentos: [
        { mes: 'JULHO', ano: 2026, valor: 1000, status: 'em aberto' },
        { mes: 'JULHO', ano: 2026, valor: 500, status: 'pago' },
        { mes: 'AGOSTO', ano: 2026, valor: 999, status: 'em aberto' } // outro mês, não deve entrar
      ]
    });
    const res = modulo.getPagamentos(token, 'JULHO', 2026);
    expect(res.ok).toBe(true);
    expect(res.itens).toHaveLength(2);
    expect(res.totalPrevisto).toBe(1000);
    expect(res.totalPago).toBe(500);
  });

  test('etapa "aprovado" conta como previsto, não como pago', () => {
    const { modulo, token } = montarAmbienteWebApp({
      pagamentos: [{ mes: 'JULHO', ano: 2026, valor: 700, status: 'aprovado' }]
    });
    const res = modulo.getPagamentos(token, 'JULHO', 2026);
    expect(res.itens[0].etapa).toBe('APROVADO');
    expect(res.totalPrevisto).toBe(700);
    expect(res.totalPago).toBe(0);
  });

  test('não vaza pagamento de outra influenciadora', () => {
    const { modulo, token } = montarAmbienteWebApp({
      pagamentos: [{ mes: 'JULHO', ano: 2026, influKey: 'OUTRA INFLUENCIADORA' }]
    });
    const res = modulo.getPagamentos(token, 'JULHO', 2026);
    expect(res.itens).toHaveLength(0);
  });

  test('aba PAGAMENTOS ausente → retorna zeros/lista vazia sem quebrar', () => {
    const { modulo, token } = montarAmbienteWebApp({ semAbaPagamentos: true });
    expect(modulo.getPagamentos(token, 'JULHO', 2026)).toEqual({ ok: true, totalPrevisto: 0, totalPago: 0, itens: [] });
  });

  test('token inválido → SESSAO_EXPIRADA', () => {
    const { modulo } = montarAmbienteWebApp({ pagamentos: [] });
    expect(modulo.getPagamentos('token-invalido', 'JULHO', 2026)).toEqual({ ok: false, erro: 'SESSAO_EXPIRADA' });
  });

  test('sem filtro de mês/ano retorna todos os pagamentos da influenciadora', () => {
    const { modulo, token } = montarAmbienteWebApp({
      pagamentos: [
        { mes: 'JULHO', ano: 2026, valor: 100 },
        { mes: 'AGOSTO', ano: 2026, valor: 200 }
      ]
    });
    const res = modulo.getPagamentos(token, null, null);
    expect(res.itens).toHaveLength(2);
  });
});

describe('Código.js — onEdit() — PAGAMENTOS: STATUS_PAGAMENTO -> "pago" arquiva a linha', () => {
  test('linha é movida para HISTÓRICO DE PAGAMENTOS quando o valor editado contém "pago"', () => {
    const { modulo, abaPagamentos, abas } = montarAmbienteCodigo({
      pagamentos: [{ mes: 'JULHO', status: 'em aberto' }]
    });
    const colStatus = colunaPag('STATUS_PAGAMENTO');
    abaPagamentos._linhas[1][colStatus - 1] = 'pago';

    modulo.onEdit(construirEvento({ sheet: abaPagamentos, row: 2, col: colStatus, valor: 'pago' }));

    expect(abaPagamentos.getLastRow()).toBe(1); // só cabeçalho — linha migrada
    const historico = abas['HISTÓRICO DE PAGAMENTOS'];
    expect(historico._linhas).toHaveLength(2);
    expect(historico._linhas[1][0]).toBe(INFLUENCIADORA_PADRAO.influKey);
  });

  test('DATA_PAGAMENTO é preenchida automaticamente quando estava vazia', () => {
    const { modulo, abaPagamentos, abas } = montarAmbienteCodigo({
      pagamentos: [{ mes: 'JULHO', status: 'em aberto', dataPagamento: '' }]
    });
    const colStatus = colunaPag('STATUS_PAGAMENTO');
    abaPagamentos._linhas[1][colStatus - 1] = 'pago';
    modulo.onEdit(construirEvento({ sheet: abaPagamentos, row: 2, col: colStatus, valor: 'pago' }));

    const colDataPag = colunaPag('DATA_PAGAMENTO');
    const linhaMigrada = abas['HISTÓRICO DE PAGAMENTOS']._linhas[1];
    expect(linhaMigrada[colDataPag - 1]).toBeTruthy();
  });

  test('DATA_PAGAMENTO existente NÃO é sobrescrita', () => {
    const { modulo, abaPagamentos, abas } = montarAmbienteCodigo({
      pagamentos: [{ mes: 'JULHO', status: 'em aberto', dataPagamento: '01/01/2026 10:00' }]
    });
    const colStatus = colunaPag('STATUS_PAGAMENTO');
    abaPagamentos._linhas[1][colStatus - 1] = 'pago';
    modulo.onEdit(construirEvento({ sheet: abaPagamentos, row: 2, col: colStatus, valor: 'pago' }));

    const colDataPag = colunaPag('DATA_PAGAMENTO');
    const linhaMigrada = abas['HISTÓRICO DE PAGAMENTOS']._linhas[1];
    expect(linhaMigrada[colDataPag - 1]).toBe('01/01/2026 10:00'); // preservada, não trocada pela data atual
  });

  test('valor que não contém "pago" não arquiva (ex.: "em aberto", "aprovado")', () => {
    const { modulo, abaPagamentos, abas } = montarAmbienteCodigo({
      pagamentos: [{ mes: 'JULHO', status: 'aprovado' }]
    });
    const colStatus = colunaPag('STATUS_PAGAMENTO');
    modulo.onEdit(construirEvento({ sheet: abaPagamentos, row: 2, col: colStatus, valor: 'aprovado' }));
    expect(abaPagamentos.getLastRow()).toBe(2);
    expect(abas['HISTÓRICO DE PAGAMENTOS']._linhas).toHaveLength(1);
  });

  test('edição em coluna diferente de STATUS_PAGAMENTO na aba PAGAMENTOS não dispara arquivamento', () => {
    const { modulo, abaPagamentos, abas } = montarAmbienteCodigo({
      pagamentos: [{ mes: 'JULHO', status: 'em aberto' }]
    });
    const colValor = colunaPag('VALOR_TOTAL');
    modulo.onEdit(construirEvento({ sheet: abaPagamentos, row: 2, col: colValor, valor: 2000 }));
    expect(abaPagamentos.getLastRow()).toBe(2);
    expect(abas['HISTÓRICO DE PAGAMENTOS']._linhas).toHaveLength(1);
  });
});
