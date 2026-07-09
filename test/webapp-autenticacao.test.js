/**
 * Fluxo crítico #1 (prioridade do usuário): AUTENTICAÇÃO.
 * Cobre login(), validarToken(), logout(), getInfluKeyByCupom(Cached) —
 * mae/WebApp.js — com mocks simples de CacheService/SpreadsheetApp/
 * LockService/Utilities (test/helpers/gasServiceMocks.js).
 *
 * Ver FLOW.md "FLOW: Login" / "FLOW: Sessão", SYSTEM_TRUTH.md seção 2.
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
const { HEADER_BASE, colBase, linhaBase } = require('./helpers/fixtures');

const WEBAPP_PATH = path.join(__dirname, '..', 'mae', 'WebApp.js');
const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

// (2026-07-07) login()/getInfluKeyByCupom(Cached) migraram de índice fixo
// (MAP.BASE) para getHeaderMap() — WebApp.js chama getHeaderMap(), definida
// em Código.js; no projeto real os dois arquivos compartilham o mesmo
// namespace global (ver test/helpers/loadGasModule.js), então precisam ser
// carregados juntos aqui para reproduzir isso fielmente.
function montarAmbiente(linhasDados, headerBase) {
  const abaBase = criarAbaFake([headerBase || HEADER_BASE, ...linhasDados.map(linhaBase)]);
  const spreadsheetAppFake = criarSpreadsheetAppFake({ 'BASE DE DADOS': abaBase });
  const cacheFake = criarCacheServiceFake();
  const sandbox = {
    SpreadsheetApp: spreadsheetAppFake,
    CacheService: cacheFake,
    LockService: criarLockServiceFake(),
    Utilities: criarUtilitiesFake(),
    Logger: criarLoggerFake()
  };
  const modulo = loadGasFiles([CODIGO_PATH, WEBAPP_PATH], sandbox);
  return { modulo, abaBase, cacheStore: cacheFake._store };
}

const INFLUENCIADORA = {
  influKey: 'MARIA INFLUENCER', cupom: 'MARIA10', nome: 'Maria Influencer',
  cnpj: '12345678000199' // senha esperada: 5 primeiros dígitos = "12345"
};

describe('WebApp.js — login()', () => {
  test('credenciais corretas → sucesso, token retornado, nome correto', () => {
    const { modulo } = montarAmbiente([INFLUENCIADORA]);
    const res = modulo.login('MARIA10', '12345');
    expect(res.ok).toBe(true);
    expect(typeof res.token).toBe('string');
    expect(res.token.length).toBeGreaterThan(0);
    expect(res.nome).toBe('Maria Influencer');
  });

  test('cupom em minúsculas/com espaços é normalizado', () => {
    const { modulo } = montarAmbiente([INFLUENCIADORA]);
    const res = modulo.login('  maria10  ', '12345');
    expect(res.ok).toBe(true);
  });

  test('senha errada → CREDENCIAIS_INVALIDAS', () => {
    const { modulo } = montarAmbiente([INFLUENCIADORA]);
    const res = modulo.login('MARIA10', '00000');
    expect(res).toEqual({ ok: false, erro: 'CREDENCIAIS_INVALIDAS' });
  });

  test('cupom inexistente → CREDENCIAIS_INVALIDAS (não revela se o cupom existe)', () => {
    const { modulo } = montarAmbiente([INFLUENCIADORA]);
    const res = modulo.login('NAOEXISTE', '12345');
    expect(res).toEqual({ ok: false, erro: 'CREDENCIAIS_INVALIDAS' });
  });

  test('cupom ou senha vazios → CREDENCIAIS_INVALIDAS', () => {
    const { modulo } = montarAmbiente([INFLUENCIADORA]);
    expect(modulo.login('', '12345')).toEqual({ ok: false, erro: 'CREDENCIAIS_INVALIDAS' });
    expect(modulo.login('MARIA10', '')).toEqual({ ok: false, erro: 'CREDENCIAIS_INVALIDAS' });
  });

  test('bloqueio: após 5 tentativas erradas, a 6ª retorna MUITAS_TENTATIVAS', () => {
    const { modulo } = montarAmbiente([INFLUENCIADORA]);
    for (let i = 0; i < 5; i++) {
      expect(modulo.login('MARIA10', 'errada')).toEqual({ ok: false, erro: 'CREDENCIAIS_INVALIDAS' });
    }
    expect(modulo.login('MARIA10', 'errada')).toEqual({ ok: false, erro: 'MUITAS_TENTATIVAS' });
    // mesmo com a senha CORRETA, o bloqueio já valeu para esta janela
    expect(modulo.login('MARIA10', '12345')).toEqual({ ok: false, erro: 'MUITAS_TENTATIVAS' });
  });

  test('login bem-sucedido reseta o contador de tentativas', () => {
    const { modulo, cacheStore } = montarAmbiente([INFLUENCIADORA]);
    modulo.login('MARIA10', 'errada'); // 1 tentativa errada
    expect(cacheStore.get('tentativas_MARIA10')).toBe('1');
    modulo.login('MARIA10', '12345'); // sucesso
    expect(cacheStore.has('tentativas_MARIA10')).toBe(false);
  });

  test('bloqueio é isolado por cupom (outro cupom não é afetado)', () => {
    const outraInflu = { influKey: 'JULIA', cupom: 'JULIA10', nome: 'Julia', cnpj: '99999999000188' };
    const { modulo } = montarAmbiente([INFLUENCIADORA, outraInflu]);
    for (let i = 0; i < 6; i++) modulo.login('MARIA10', 'errada');
    // JULIA10 não sofreu nenhuma tentativa — deve logar normalmente
    expect(modulo.login('JULIA10', '99999')).toMatchObject({ ok: true });
  });
});

describe('WebApp.js — validarToken() / logout()', () => {
  test('token válido retorna o cupom associado', () => {
    const { modulo } = montarAmbiente([INFLUENCIADORA]);
    const { token } = modulo.login('MARIA10', '12345');
    expect(modulo.validarToken(token)).toBe('MARIA10');
  });

  test('token inválido ou ausente retorna null', () => {
    const { modulo } = montarAmbiente([INFLUENCIADORA]);
    expect(modulo.validarToken('token-que-nao-existe')).toBeNull();
    expect(modulo.validarToken(null)).toBeNull();
    expect(modulo.validarToken(undefined)).toBeNull();
  });

  test('logout remove o token — validarToken subsequente falha', () => {
    const { modulo } = montarAmbiente([INFLUENCIADORA]);
    const { token } = modulo.login('MARIA10', '12345');
    expect(modulo.logout(token)).toEqual({ ok: true });
    expect(modulo.validarToken(token)).toBeNull();
  });

  test('logout sem token não lança erro', () => {
    const { modulo } = montarAmbiente([INFLUENCIADORA]);
    expect(modulo.logout(null)).toEqual({ ok: true });
    expect(modulo.logout(undefined)).toEqual({ ok: true });
  });
});

describe('WebApp.js — getInfluKeyByCupom / getInfluKeyByCupomCached', () => {
  test('getInfluKeyByCupom encontra por cupom (a função espera o cupom já normalizado pelo chamador — trim+uppercase — como login()/validarToken() sempre fazem antes de chamá-la)', () => {
    const { modulo, abaBase } = montarAmbiente([INFLUENCIADORA]);
    const ss = { getSheetByName: () => abaBase };
    expect(modulo.getInfluKeyByCupom(ss, 'MARIA10')).toBe('MARIA INFLUENCER');
  });

  test('getInfluKeyByCupom retorna null se não encontrar', () => {
    const { modulo, abaBase } = montarAmbiente([INFLUENCIADORA]);
    const ss = { getSheetByName: () => abaBase };
    expect(modulo.getInfluKeyByCupom(ss, 'NAOEXISTE')).toBeNull();
  });

  test('getInfluKeyByCupomCached cacheia o resultado (documenta o comportamento aceito: não revalida durante a sessão)', () => {
    const { modulo, abaBase } = montarAmbiente([INFLUENCIADORA]);
    const ss = { getSheetByName: () => abaBase };
    expect(modulo.getInfluKeyByCupomCached(ss, 'MARIA10')).toBe('MARIA INFLUENCER');

    // Simula mudança de INFLU_KEY na planilha após o primeiro lookup —
    // comportamento hoje aceito (ver SYSTEM_TRUTH.md/WebApp.js comentário):
    // o cache por cupom não invalida se o cadastro mudar no meio da sessão.
    abaBase._linhas[1][colBase('INFLU_KEY') - 1] = 'MARIA MUDOU';
    expect(modulo.getInfluKeyByCupomCached(ss, 'MARIA10')).toBe('MARIA INFLUENCER');
  });
});

describe('WebApp.js — login()/getInfluKeyByCupom — resolução de coluna por nome (não por posição)', () => {
  // Prova da correção do risco #1 da auditoria técnica
  // (docs/AUDITORIA_TECNICA_2026-07-07.md seções 7/15.3/17.1): MAP.BASE
  // migrou de índice fixo para getHeaderMap(). Este teste insere uma coluna
  // nova NO MEIO do cabeçalho de BASE DE DADOS (deslocando todas as posições
  // à direita) e confirma que login() e getInfluKeyByCupom continuam
  // encontrando os campos certos — antes da correção, isso quebrava
  // silenciosamente (lia a célula errada, sem erro).
  test('coluna nova inserida no meio do cabeçalho não quebra login()', () => {
    const headerComColunaNova = [
      'STATUS', 'INFLU_KEY', 'CUPOM',
      'TELEFONE_WHATSAPP', // <- coluna nova, inserida antes de NOME/EMAIL/etc.
      'INFLUENCIADORA_RAZAO_SOCIAL', 'EMAIL', 'CHAVE_PIX', 'INFLUENCIADORA_CNPJ',
      'CEP', 'RUA', 'NUMERO', 'COMPLEMENTO', 'BAIRRO', 'CIDADE', 'UF', 'VALOR_TOTAL'
    ];
    // linhaBase() monta a linha na ordem de HEADER_BASE (sem a coluna nova) —
    // por isso a linha é remontada manualmente aqui, na ordem do header customizado.
    const linhaComColunaNova = [
      'ON', INFLUENCIADORA.influKey, INFLUENCIADORA.cupom,
      '11999998888',
      INFLUENCIADORA.nome, '', '', INFLUENCIADORA.cnpj,
      '', '', '', '', '', '', '', 0
    ];
    const abaBase = criarAbaFake([headerComColunaNova, linhaComColunaNova]);
    const spreadsheetAppFake = criarSpreadsheetAppFake({ 'BASE DE DADOS': abaBase });
    const sandbox = {
      SpreadsheetApp: spreadsheetAppFake,
      CacheService: criarCacheServiceFake(),
      LockService: criarLockServiceFake(),
      Utilities: criarUtilitiesFake(),
      Logger: criarLoggerFake()
    };
    const modulo = loadGasFiles([CODIGO_PATH, WEBAPP_PATH], sandbox);

    const res = modulo.login('MARIA10', '12345');
    expect(res.ok).toBe(true);
    expect(res.nome).toBe('Maria Influencer');

    const ss = { getSheetByName: () => abaBase };
    expect(modulo.getInfluKeyByCupom(ss, 'MARIA10')).toBe('MARIA INFLUENCER');
  });
});
