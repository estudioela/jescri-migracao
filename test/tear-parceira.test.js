/**
 * Cadastro/edição de parceiras — ferramenta interna/admin (Etapa 2).
 *
 * Valida a extensão do ParceiroRepository (lookup por campo + upsert por nome de
 * cabeçalho), a validação do ParceiroService e o gate administrativo dos dois
 * entrypoints. A aba fake usa o cabeçalho FÍSICO do schema do Wizard — mais largo
 * que a projeção de auth CAMPOS_PARCEIRO — porque é isso que o upsart enxerga.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

const HEADER = ['INFLU_KEY', 'INFLUENCIADORA_RAZAO_SOCIAL', 'INFLUENCIADORA_CNPJ', 'EMAIL', 'CUPOM', 'CHAVE_PIX', 'Derivado'];
const col = (nome) => HEADER.indexOf(nome);

function abaFalsa(cabecalho, linhas) {
  return {
    linhas,
    getDataRange: () => ({ getValues: () => [cabecalho.slice()].concat(linhas.map((l) => l.slice())) }),
    getRange: (linha, coluna) => ({
      setValue: (valor) => { linhas[linha - 2][coluna - 1] = valor; },
      getFormulas: () => [cabecalho.map(() => '')],
      setValues: () => {}
    }),
    appendRow: (linha) => linhas.push(linha.slice())
  };
}

function cacheFalso() {
  const dados = new Map();
  return {
    get: (k) => (dados.has(k) ? dados.get(k) : null),
    put: (k, v) => dados.set(k, String(v)),
    remove: (k) => dados.delete(k)
  };
}

function montar(linhas, adminToken) {
  const aba = abaFalsa(HEADER, (linhas || []).map((l) => l.slice()));
  const cache = cacheFalso();
  const sandbox = {
    console: { error() {} },
    Utilities: {
      getUuid: () => 'uuid',
      computeDigest: () => [],
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' }
    },
    SpreadsheetApp: { getActive: () => ({ getSheetByName: () => aba }) },
    CacheService: { getScriptCache: () => cache },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => (adminToken === undefined ? 'ADMIN-OK' : adminToken) }) }
  };

  const ctx = loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js', 'Services.js', 'Controllers.js', 'Roteador.js'].map(arquivo),
    sandbox,
    ['apiBuscarParceira', 'apiSalvarParceira', 'ParceiroRepository', 'ParceiroService']
  );

  return { ctx, aba };
}

describe('ParceiroRepository — lookup e upsert por cabeçalho físico', () => {
  test('buscarPorCampo encontra por e-mail e por CNPJ, e devolve null quando ausente', () => {
    const { ctx } = montar([['k1', 'Fulana', '11222333', 'a@x.com', 'CUP1', 'pix1', 'D1']]);
    const repo = new ctx.ParceiroRepository();

    expect(repo.buscarPorCampo('EMAIL', 'a@x.com').INFLU_KEY).toBe('k1');
    expect(repo.buscarPorCampo('INFLUENCIADORA_CNPJ', '11222333').CUPOM).toBe('CUP1');
    expect(repo.buscarPorCampo('EMAIL', 'nao@existe.com')).toBeNull();
  });

  test('upsert insere uma nova linha preenchendo só as colunas mapeadas', () => {
    const { ctx, aba } = montar([]);
    const resultado = new ctx.ParceiroRepository().upsert({ INFLU_KEY: 'k2', EMAIL: 'b@x.com', CUPOM: 'CUP2' }, 'INFLU_KEY');

    expect(resultado).toEqual({ chave: 'k2', criado: true });
    expect(aba.linhas).toHaveLength(1);
    expect(aba.linhas[0][col('INFLU_KEY')]).toBe('k2');
    expect(aba.linhas[0][col('EMAIL')]).toBe('b@x.com');
    expect(aba.linhas[0][col('Derivado')]).toBe(''); // coluna não mapeada nasce vazia
  });

  test('upsert atualiza a linha existente e preserva colunas não mapeadas', () => {
    const { ctx, aba } = montar([['k1', 'Fulana', '11', 'a@x.com', 'CUP1', 'pix1', 'DERIVADO']]);
    const resultado = new ctx.ParceiroRepository().upsert({ INFLU_KEY: 'k1', EMAIL: 'novo@x.com' }, 'INFLU_KEY');

    expect(resultado).toEqual({ chave: 'k1', criado: false });
    expect(aba.linhas).toHaveLength(1);                              // não duplicou
    expect(aba.linhas[0][col('EMAIL')]).toBe('novo@x.com');         // mapeada: atualizou
    expect(aba.linhas[0][col('Derivado')]).toBe('DERIVADO');        // não mapeada: intacta
    expect(aba.linhas[0][col('INFLUENCIADORA_RAZAO_SOCIAL')]).toBe('Fulana');
  });
});

describe('entrypoints do cadastro — gate administrativo', () => {
  test('token admin errado é rejeitado, sem tocar a base', () => {
    const { ctx, aba } = montar([], 'ADMIN-OK');

    expect(ctx.apiBuscarParceira('ERRADO', 'EMAIL', 'a@x.com')).toEqual({ success: false, error: 'Operação não autorizada.' });
    expect(ctx.apiSalvarParceira('ERRADO', { INFLU_KEY: 'k' })).toEqual({ success: false, error: 'Operação não autorizada.' });
    expect(aba.linhas).toHaveLength(0);
  });

  test('apiSalvarParceira com token válido faz o upsert e devolve envelope de sucesso', () => {
    const { ctx, aba } = montar([], 'ADMIN-OK');
    const r = ctx.apiSalvarParceira('ADMIN-OK', { INFLU_KEY: 'k3', INFLUENCIADORA_RAZAO_SOCIAL: 'Beltrana', CUPOM: 'CUP3', EMAIL: 'c@x.com' });

    expect(r.success).toBe(true);
    expect(r.data.criado).toBe(true);
    expect(aba.linhas).toHaveLength(1);
  });

  test('apiSalvarParceira exige os campos obrigatórios do schema', () => {
    const { ctx } = montar([], 'ADMIN-OK');
    const r = ctx.apiSalvarParceira('ADMIN-OK', { INFLU_KEY: 'k4' });

    expect(r.success).toBe(false);
    expect(r.error).toMatch(/INFLUENCIADORA_RAZAO_SOCIAL/);
  });

  test('apiBuscarParceira devolve o cadastro por e-mail; null quando não acha', () => {
    const { ctx } = montar([['k1', 'Fulana', '11', 'a@x.com', 'CUP1', 'pix1', 'D']], 'ADMIN-OK');

    expect(ctx.apiBuscarParceira('ADMIN-OK', 'EMAIL', 'a@x.com').data.INFLU_KEY).toBe('k1');
    expect(ctx.apiBuscarParceira('ADMIN-OK', 'EMAIL', 'x@x.com').data).toBeNull();
  });

  test('a busca só aceita e-mail ou CNPJ, nunca coluna arbitrária', () => {
    const { ctx } = montar([['k1', 'Fulana', '11', 'a@x.com', 'CUP1', 'pix1', 'D']], 'ADMIN-OK');
    const r = ctx.apiBuscarParceira('ADMIN-OK', 'CUPOM', 'CUP1');

    expect(r.success).toBe(false);
    expect(r.error).toMatch(/e-mail ou CNPJ/);
  });
});
