/**
 * Provisionamento automático da senha padrão no fluxo de salvar (regra da V1,
 * BASE.csv). Ao ativar a parceira (cupom preenchido), o Service busca o CNPJ
 * original no CADASTROS — casado pelo apelido, como na V1 —, extrai os 5
 * primeiros dígitos e grava o `Senha_Hash`. Tudo FAIL-SAFE: sem CNPJ válido,
 * o cadastro é salvo assim mesmo.
 */
const path = require('path');
const crypto = require('crypto');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

// Cabeçalho físico da base V2, agora com Cupom/Senha_Hash (colunas de credencial
// que o login realmente usa) ao lado do vocabulário do wizard (INFLU_KEY).
const HEADER_PARCEIROS = ['INFLU_KEY', 'INFLUENCIADORA_RAZAO_SOCIAL', 'CUPOM', 'Senha_Hash', 'Derivado'];

// CADASTROS: entrada raw do Forms (título da pergunta → resposta).
const HEADER_CADASTROS = ['como prefere ser chamada (pode ser apelido + sobrenome, por exemplo)', 'razão social', 'cnpj'];

function abaFalsa(cabecalho, linhas) {
  return {
    linhas,
    getDataRange: () => ({ getValues: () => [cabecalho.slice()].concat(linhas.map((l) => l.slice())) }),
    getRange: (linha, coluna) => ({
      setValue: (valor) => { linhas[linha - 2][coluna - 1] = valor; }
    }),
    appendRow: (linha) => linhas.push(linha.slice())
  };
}

function montar(linhasParceiros, linhasCadastros) {
  const abaParceiros = abaFalsa(HEADER_PARCEIROS, (linhasParceiros || []).map((l) => l.slice()));
  const abaCadastros = abaFalsa(HEADER_CADASTROS, (linhasCadastros || []).map((l) => l.slice()));
  const abas = { 'Parceiros_Influenciadoras': abaParceiros, 'CADASTROS': abaCadastros };

  const sandbox = {
    console: { warn() {}, error() {} },
    Utilities: {
      getUuid: (() => { let n = 0; return () => 'salt-' + ++n; })(),
      computeDigest: (_a, texto) => Array.from(crypto.createHash('sha256').update(texto, 'utf8').digest()),
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' }
    },
    SpreadsheetApp: { getActive: () => ({ getSheetByName: (nome) => abas[nome] }) }
  };

  const ctx = loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js', 'Services.js'].map(arquivo),
    sandbox,
    ['ParceiroService', 'ParceiroRepository', 'senhaConfere']
  );

  const service = new ctx.ParceiroService(new ctx.ParceiroRepository());
  return { ctx, service, abaParceiros };
}

const col = (nome) => HEADER_PARCEIROS.indexOf(nome);

describe('provisionamento automático da senha padrão (CNPJ do CADASTROS)', () => {
  test('ativa a parceira → grava Senha_Hash com os 5 primeiros dígitos do CNPJ', () => {
    const { service, ctx, abaParceiros } = montar(
      [['CAROL TANAKA', 'Caroline Tanaka', '', '', 'D']],
      [['Carol Tanaka', 'Caroline Tanaka', '12.345.678/0001-99']]
    );

    const r = service.salvar({ INFLU_KEY: 'CAROL TANAKA', INFLUENCIADORA_RAZAO_SOCIAL: 'Caroline Tanaka', CUPOM: 'CAROL10' });

    expect(r.criado).toBe(false); // atualizou a linha existente
    expect(r.senhaProvisionada).toBe(true);

    const hashGravado = abaParceiros.linhas[0][col('Senha_Hash')];
    expect(hashGravado).not.toBe('');
    expect(hashGravado).not.toContain('12345');
    expect(ctx.senhaConfere('12345', hashGravado)).toBe(true); // senha = 5 primeiros dígitos
  });

  // CUPOM é obrigatório no salvar, então "sem cupom" só é alcançável chamando o
  // provisionamento direto — o guard existe para esse caminho.
  test('guard SEM_CUPOM: provisionar sem cupom não age', () => {
    const { service } = montar([], []);

    expect(service.provisionarSenhaPadrao({ INFLU_KEY: 'NOVA' })).toEqual({ provisionada: false, motivo: 'SEM_CUPOM' });
  });

  test('fail-safe: CNPJ ausente no CADASTROS não interrompe o salvamento', () => {
    const { service } = montar(
      [['SEM CNPJ', 'Fulana', '', '', 'D']],
      [] // CADASTROS vazio
    );

    const r = service.salvar({ INFLU_KEY: 'SEM CNPJ', INFLUENCIADORA_RAZAO_SOCIAL: 'Fulana', CUPOM: 'FULANA10' });

    expect(r.criado).toBe(false);
    expect(r.senhaProvisionada).toBe(false); // sem CNPJ → só fail-safe
  });

  test('fail-safe: valor com cara de CEP (8 dígitos) mascarado de CNPJ é rejeitado', () => {
    const { service, abaParceiros } = montar(
      [['CEP FAKE', 'Fulana', '', '', 'D']],
      [['CEP Fake', 'Fulana', '35500-166']] // 8 dígitos = CEP, não CNPJ
    );

    const r = service.salvar({ INFLU_KEY: 'CEP FAKE', INFLUENCIADORA_RAZAO_SOCIAL: 'Fulana', CUPOM: 'CEP10' });

    expect(r.senhaProvisionada).toBe(false);
    expect(abaParceiros.linhas[0][col('Senha_Hash')]).toBe('');
  });

  test('não sobrescreve senha já definida (a parceira pode tê-la trocado)', () => {
    const { service, abaParceiros } = montar(
      [['CAROL TANAKA', 'Caroline Tanaka', 'CAROL10', 'salt-existente$hashexistente', 'D']],
      [['Carol Tanaka', 'Caroline Tanaka', '12.345.678/0001-99']]
    );

    const r = service.salvar({ INFLU_KEY: 'CAROL TANAKA', INFLUENCIADORA_RAZAO_SOCIAL: 'Caroline Tanaka', CUPOM: 'CAROL10' });

    expect(r.senhaProvisionada).toBe(false);
    expect(abaParceiros.linhas[0][col('Senha_Hash')]).toBe('salt-existente$hashexistente'); // intacta
  });
});
