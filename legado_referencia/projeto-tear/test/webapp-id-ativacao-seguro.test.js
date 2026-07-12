/**
 * INV-06 — defesa em profundidade na fronteira do servidor.
 *
 * O front deixou de colocar idAtivacao em contexto JavaScript (ver
 * index-render-pendencias-xss.test.js). Aqui se garante a outra metade: um ID
 * capaz de injetar nunca chega a sair de getPendencias().
 *
 * Ref: docs/auditoria/03_execucao_operacional.md INV-06, INV-12
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const {
  criarAbaFake,
  criarSpreadsheetAppFake,
  criarCacheServiceFake,
  criarUtilitiesFake,
  criarLoggerFake
} = require('./helpers/gasServiceMocks');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');
const WEBAPP_PATH = path.join(__dirname, '..', 'mae', 'WebApp.js');

const TOKEN = 'token-de-teste';
const CUPOM = 'CUPOM10';
const INFLU = 'FULANA';

const CAB_ATIV = ['ID', 'INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'FORMATO', 'STATUS_CONTEUDO', 'DATA_ATIVACAO', 'DATA_APROVACAO'];
const linhaAtiv = (id) => [id, INFLU, 'AGOSTO', 2026, 'REEL', 'em aberto', '', ''];

function carregar(linhasAtivacoes) {
  const cacheService = criarCacheServiceFake();
  cacheService.getScriptCache().put(TOKEN, CUPOM);
  cacheService.getScriptCache().put('influkey_' + CUPOM, INFLU);

  const logger = criarLoggerFake({ registrarChamadas: true });
  const aba = criarAbaFake([CAB_ATIV].concat(linhasAtivacoes));

  const sandbox = loadGasFiles([CODIGO_PATH, WEBAPP_PATH], {
    SpreadsheetApp: criarSpreadsheetAppFake({ 'ATIVAÇÕES': aba }),
    CacheService: cacheService,
    Utilities: criarUtilitiesFake(),
    Logger: logger
  });
  return { sandbox, logger, aba };
}

describe('idAtivacaoSeguro — charset de fronteira', () => {
  const { sandbox, logger } = carregar([]);

  test('UUID de Utilities.getUuid() passa intacto', () => {
    const uuid = 'a1b2c3d4-0000-4000-8000-abcdefabcdef';
    expect(sandbox.idAtivacaoSeguro(uuid, 5)).toBe(uuid);
  });

  test('id manual legítimo passa — não se exige UUID estrito', () => {
    // Exigir UUID empurraria linhas legítimas para o fallback ROWn, que é a
    // corrida por número de linha que a coluna ID veio resolver (INV-12).
    expect(sandbox.idAtivacaoSeguro('REEL-01', 5)).toBe('REEL-01');
    expect(sandbox.idAtivacaoSeguro('a_b-9', 5)).toBe('a_b-9');
  });

  test('célula vazia cai no fallback de linha, sem log de anomalia', () => {
    expect(sandbox.idAtivacaoSeguro('', 7)).toBe('ROW7');
    expect(sandbox.idAtivacaoSeguro(null, 7)).toBe('ROW7');
    expect(sandbox.idAtivacaoSeguro(undefined, 7)).toBe('ROW7');
  });

  test.each([
    ["'); alert(1); //", 'quebra de string JS'],
    ['<img src=x onerror=alert(1)>', 'tag HTML'],
    ['" onmouseover="alert(1)', 'quebra de atributo'],
    ['a b', 'espaço'],
    ['../../etc/passwd', 'barra e ponto'],
    ['x'.repeat(65), 'acima de 64 chars']
  ])('id perigoso (%s) vira fallback de linha: %s', (payload) => {
    expect(sandbox.idAtivacaoSeguro(payload, 3)).toBe('ROW3');
  });

  test('id rejeitado é registrado no log, com o valor ofensor', () => {
    const { sandbox: s, logger: l } = carregar([]);
    s.idAtivacaoSeguro("'); alert(1); //", 4);

    const linhasLog = l._chamadas.map((c) => c.join(' ')).join('\n');
    expect(linhasLog).toContain('ID fora do formato aceito');
  });
});

describe('getPendencias — o payload nunca sai do servidor', () => {
  test('ID com injeção é substituído pelo fallback de linha antes de chegar ao front', () => {
    const { sandbox } = carregar([linhaAtiv("'); alert(1); //")]);

    const res = sandbox.getPendencias(TOKEN, 'AGOSTO', 2026);

    expect(res.ok).toBe(true);
    expect(res.itens).toHaveLength(1);
    expect(res.itens[0].idAtivacao).toBe('ROW2');
    expect(JSON.stringify(res)).not.toContain('alert');
  });

  test('ID legítimo continua trafegando normalmente (sem regressão)', () => {
    const uuid = 'a1b2c3d4-0000-4000-8000-abcdefabcdef';
    const { sandbox } = carregar([linhaAtiv(uuid)]);

    const res = sandbox.getPendencias(TOKEN, 'AGOSTO', 2026);

    expect(res.itens[0].idAtivacao).toBe(uuid);
  });

  test('ID vazio continua caindo em ROWn, como antes', () => {
    const { sandbox } = carregar([linhaAtiv('')]);

    expect(sandbox.getPendencias(TOKEN, 'AGOSTO', 2026).itens[0].idAtivacao).toBe('ROW2');
  });
});

describe('encontrarLinhaAtivacaoPorId — guarda de id vazio', () => {
  test('id vazio devolve -1, em vez de casar com a primeira linha de ID vazio', () => {
    // Antes: a comparação `"" === ""` fazia um id vazio vindo do cliente
    // resolver para uma ativação que o chamador nunca pediu. A checagem de
    // ownership limitava o dano, não o alcance.
    const aba = criarAbaFake([CAB_ATIV, linhaAtiv(''), linhaAtiv('uuid-real')]);
    const { sandbox } = carregar([]);
    const h = sandbox.getHeaderMap(aba);

    expect(sandbox.encontrarLinhaAtivacaoPorId(aba, h, '')).toBe(-1);
    expect(sandbox.encontrarLinhaAtivacaoPorId(aba, h, null)).toBe(-1);
    expect(sandbox.encontrarLinhaAtivacaoPorId(aba, h, '   ')).toBe(-1);
  });

  test('resolução por ID e por ROWn continuam funcionando', () => {
    const aba = criarAbaFake([CAB_ATIV, linhaAtiv('uuid-a'), linhaAtiv('uuid-b')]);
    const { sandbox } = carregar([]);
    const h = sandbox.getHeaderMap(aba);

    expect(sandbox.encontrarLinhaAtivacaoPorId(aba, h, 'uuid-b')).toBe(3);
    expect(sandbox.encontrarLinhaAtivacaoPorId(aba, h, 'ROW2')).toBe(2);
    expect(sandbox.encontrarLinhaAtivacaoPorId(aba, h, 'inexistente')).toBe(-1);
  });
});
