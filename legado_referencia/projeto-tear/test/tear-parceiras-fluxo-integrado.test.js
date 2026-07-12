const path = require('path');
const { loadGasFiles, loadGasModule } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);
const templatesPath = path.join(RAIZ, 'tear', 'Templates.html');

const HEADER_BASE = [
  'ID_Influenciadora',
  'Nome',
  'Status_Contrato',
  'Categoria',
  'Cupom',
  'CUPOM',
  'Senha_Hash',
  'INFLU_KEY',
  'INFLUENCIADORA_RAZAO_SOCIAL',
  'INFLUENCIADORA_CNPJ',
  'EMAIL',
  'CHAVE_PIX',
  'DRIVE'
];

function linhaBase(obj) {
  return HEADER_BASE.map((coluna) => (Object.prototype.hasOwnProperty.call(obj, coluna) ? obj[coluna] : ''));
}

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

function criarElementoBase() {
  return {
    value: '',
    textContent: '',
    innerHTML: '',
    hidden: true,
    disabled: false,
    content: { cloneNode: () => ({}) },
    addEventListener() {},
    appendChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    setAttribute() {},
    removeAttribute() {},
    getAttribute() { return ''; },
    closest() { return null; }
  };
}

function montarIntegracao() {
  const linhas = [
    linhaBase({
      ID_Influenciadora: 'ana',
      Nome: 'Ana LTDA',
      Status_Contrato: 'ATIVO',
      Cupom: 'ANA10',
      CUPOM: 'ANA10',
      INFLU_KEY: 'ana',
      INFLUENCIADORA_RAZAO_SOCIAL: 'Ana LTDA',
      INFLUENCIADORA_CNPJ: '11222333000144',
      EMAIL: 'ana@x.com',
      CHAVE_PIX: 'pix-ana'
    })
  ];

  const aba = abaFalsa(HEADER_BASE, linhas);
  const cache = cacheFalso();

  const backend = loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js', 'Services.js', 'Controllers.js', 'Roteador.js'].map(arquivo),
    {
      console: { warn() {}, log() {}, error() {} },
      Utilities: {
        getUuid: () => 'uuid-1',
        computeDigest: () => [],
        DigestAlgorithm: { SHA_256: 'sha256' },
        Charset: { UTF_8: 'utf8' }
      },
      SpreadsheetApp: {
        getActive: () => ({
          getSheetByName: (nome) => (nome === 'BASE' ? aba : null)
        })
      },
      CacheService: { getScriptCache: () => cache },
      PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'ADMIN-OK' }) }
    },
    ['apiListarParceiras', 'apiSalvarParceira', 'apiObterParceira', 'apiDefinirStatusParceira']
  );

  const elementos = new Map();
  const el = (id) => {
    if (!elementos.has(id)) {
      elementos.set(id, criarElementoBase());
    }
    return elementos.get(id);
  };

  el('tear-admin-token').value = 'ADMIN-OK';
  el('tear-admin-token-parc').value = 'ADMIN-OK';
  el('tear-parceiras-lista');
  el('tear-parceiras-busca').value = '';
  el('tear-wizard-aviso');

  const front = loadGasModule(templatesPath, {
    document: {
      addEventListener() {},
      getElementById(id) {
        return el(id);
      },
      querySelector() {
        return criarElementoBase();
      },
      querySelectorAll() {
        return [];
      }
    },
    console: { warn() {}, log() {}, error() {} },
    sessionStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    },
    Promise,
    setTimeout,
    clearTimeout,
    google: { script: { run: {} } }
  });

  front.temBackend = () => true;
  front.chamar = (nome, ...args) => Promise.resolve(backend[nome](...args));
  front.navegar = jest.fn();

  return { front, backend };
}

describe('Vertical Slice Parceiras — fluxo integrado', () => {
  test('Listar -> Nova -> Salvar -> Editar -> Salvar -> Ativar/Desativar', async () => {
    const { front, backend } = montarIntegracao();

    await front.carregarParceiras();
    expect(front.PARCEIRAS_CACHE.map((p) => p.id)).toEqual(['ana']);

    front.abrirCadastroParceira();
    front.WIZARD.dados = {
      INFLU_KEY: 'bia',
      INFLUENCIADORA_RAZAO_SOCIAL: 'Bia LTDA',
      INFLUENCIADORA_CNPJ: '55444333000199',
      EMAIL: 'bia@x.com',
      CUPOM: 'BIA10',
      CHAVE_PIX: 'pix-bia'
    };
    await front.salvarParceira();

    await front.carregarParceiras();
    expect(front.PARCEIRAS_CACHE.map((p) => p.id).sort()).toEqual(['ana', 'bia']);

    front.PARCEIRA_EDICAO_ID = 'bia';
    await front.iniciarWizardParceira();
    expect(front.WIZARD.modo).toBe('editar');
    expect(front.WIZARD.dados.INFLU_KEY).toBe('bia');

    front.WIZARD.dados.INFLUENCIADORA_RAZAO_SOCIAL = 'Bia Atualizada LTDA';
    await front.salvarParceira();

    const aposEdicao = backend.apiObterParceira('ADMIN-OK', 'bia');
    expect(aposEdicao.success).toBe(true);
    expect(front.PARCEIRA_EDICAO_ID).toBe('');
    expect(backend.apiListarParceiras('ADMIN-OK').data.filter((p) => p.id === 'bia')).toHaveLength(1);

    const cartaoBia = {
      getAttribute: (chave) => (chave === 'data-parceira-id' ? 'bia' : '')
    };

    await front.alternarStatusParceira(cartaoBia, 'INATIVO');
    expect(backend.apiObterParceira('ADMIN-OK', 'bia').data.Status_Contrato).toBe('INATIVO');

    await front.alternarStatusParceira(cartaoBia, 'ATIVO');
    expect(backend.apiObterParceira('ADMIN-OK', 'bia').data.Status_Contrato).toBe('ATIVO');
  });
});