const path = require('path');
const { loadGasModule } = require('./helpers/loadGasModule');

const TEMPLATES_PATH = path.join(__dirname, '..', 'tear', 'Templates.html');

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

function montarFront() {
  const elementos = new Map();

  function garantir(id) {
    if (!elementos.has(id)) {
      elementos.set(id, criarElementoBase());
    }
    return elementos.get(id);
  }

  const document = {
    addEventListener() {},
    getElementById(id) {
      return garantir(id);
    },
    querySelector() {
      return criarElementoBase();
    },
    querySelectorAll() {
      return [];
    }
  };

  const ctx = loadGasModule(TEMPLATES_PATH, {
    document,
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

  return { ctx, el: garantir };
}

describe('Templates — wizard admin de Parceiras (Etapa 5)', () => {
  test('edição carrega dados via GET_BY_ID e preenche o wizard automaticamente', async () => {
    const { ctx, el } = montarFront();

    el('tear-admin-token').value = 'ADMIN-OK';
    ctx.temBackend = () => true;
    ctx.chamar = jest.fn(() => Promise.resolve({
      success: true,
      data: {
        INFLU_KEY: 'ana',
        INFLUENCIADORA_RAZAO_SOCIAL: 'Ana LTDA',
        CUPOM: 'ANA10',
        EMAIL: 'ana@x.com'
      }
    }));

    ctx.PARCEIRA_EDICAO_ID = 'ana';
    await ctx.iniciarWizardParceira();

    expect(ctx.chamar).toHaveBeenCalledWith('apiObterParceira', 'ADMIN-OK', 'ana');
    expect(ctx.WIZARD.modo).toBe('editar');
    expect(ctx.WIZARD.dados.INFLU_KEY).toBe('ana');
    expect(ctx.WIZARD.dados.EMAIL).toBe('ana@x.com');
    expect(el('tear-wizard-aviso').hidden).toBe(false);
  });

  test('salvar usa UPSERT existente e retorna para listagem de Parceiras', async () => {
    const { ctx, el } = montarFront();

    el('tear-admin-token').value = 'ADMIN-OK';
    ctx.temBackend = () => true;
    ctx.WIZARD.dados = { INFLU_KEY: 'bia', INFLUENCIADORA_RAZAO_SOCIAL: 'Bia LTDA', CUPOM: 'BIA10' };
    ctx.chamar = jest.fn(() => Promise.resolve({ success: true, data: { chave: 'bia', criado: true } }));
    ctx.navegar = jest.fn();

    await ctx.salvarParceira();

    expect(ctx.chamar).toHaveBeenCalledWith('apiSalvarParceira', 'ADMIN-OK', ctx.WIZARD.dados);
    expect(ctx.navegar).toHaveBeenCalledWith('parceiras');
    expect(ctx.PARCEIRA_EDICAO_ID).toBe('');
  });
});
