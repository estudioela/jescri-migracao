/**
 * INV-06 — XSS armazenado em renderPendencias(), e V-01 — persistência de sessão.
 *
 * O vetor: idAtivacao é o valor bruto da célula ID de ATIVAÇÕES, editável por
 * qualquer pessoa com escrita no ERP. Era interpolado dentro de um atributo
 * onclick:
 *
 *     onclick="abrirBriefing('<id>')"
 *
 * O payload `'); alert(1); //` fecha a string JS e executa. E escaparHtml() —
 * que escapa só & < > — NÃO teria resolvido: além de não escapar aspas, o
 * parser HTML decodifica entidades no valor do atributo ANTES de o JS parsear a
 * string, então `&#39;` voltaria a ser `'`. Escapar para HTML nunca protege um
 * contexto JS.
 *
 * A correção não escapa melhor: tira o dado do contexto JS. data-attribute
 * escrito via DOM API + um listener delegado.
 *
 * Ref: docs/auditoria/03_execucao_operacional.md INV-06
 * Ref: docs/auditoria/01_gestao_parceiros.md V-01
 */
const path = require('path');
const { loadGasModule } = require('./helpers/loadGasModule');

const INDEX_PATH = path.join(__dirname, '..', 'mae', 'Index.html');

const PAYLOAD_XSS = "'); alert(1); //";
const PAYLOAD_TAG = '<img src=x onerror=alert(1)>';

/* Shim de DOM pequeno, mas com semântica real onde o teste depende dela:
   innerHTML guarda string; setAttribute/getAttribute guardam valor cru;
   appendChild monta uma árvore inspecionável. */
function criarElemento(tag) {
  const el = {
    tagName: tag,
    className: '',
    textContent: '',
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    _atributos: {},
    _filhos: [],
    _html: '',
    _listeners: {},
    _acoes: null,
    setAttribute(k, v) { el._atributos[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(el._atributos, k) ? el._atributos[k] : null; },
    appendChild(filho) { el._filhos.push(filho); return filho; },
    addEventListener(tipo, fn) { (el._listeners[tipo] = el._listeners[tipo] || []).push(fn); },
    querySelector(seletor) {
      if (seletor === '.card-acoes' && el._html.includes('card-acoes')) {
        if (!el._acoes) el._acoes = criarElemento('div');
        return el._acoes;
      }
      return null;
    },
    // O listener delegado usa evento.target.closest('button[data-acao]').
    closest(seletor) {
      if (seletor === 'button[data-acao]' && el.getAttribute('data-acao') !== null) return el;
      return null;
    }
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html; },
    set(v) { el._html = String(v); el._filhos = []; el._acoes = null; }
  });
  return el;
}

function carregarIndex() {
  const elementos = {};
  const sandbox = {
    document: {
      body: { classList: { add() {}, remove() {}, toggle() {} } },
      getElementById(id) {
        if (!elementos[id]) elementos[id] = criarElemento('div');
        return elementos[id];
      },
      querySelectorAll() { return []; },
      createElement: criarElemento
    },
    console,
    setTimeout,
    clearTimeout,
    google: { script: { run: {} } }
  };
  const ctx = loadGasModule(INDEX_PATH, sandbox);
  ctx._elementos = elementos;
  return ctx;
}

// Percorre a árvore montada, devolvendo todo HTML string + atributos, para as
// asserções de "não existe onclick em lugar nenhum".
function coletarTudo(el, acc) {
  acc = acc || { html: [], atributos: [] };
  acc.html.push(el._html || '');
  acc.atributos.push(JSON.stringify(el._atributos || {}));
  (el._filhos || []).forEach((f) => coletarTudo(f, acc));
  if (el._acoes) coletarTudo(el._acoes, acc);
  return acc;
}

// Os elementos são criados sob demanda no primeiro getElementById — pegar pelo
// mapa antes disso devolve undefined.
const pegarElemento = (ctx, id) => ctx.document.getElementById(id);

function botoesDe(lista) {
  const botoes = [];
  lista._filhos.forEach((card) => {
    if (card._acoes) card._acoes._filhos.forEach((b) => botoes.push(b));
  });
  return botoes;
}

const itemBase = (over) => Object.assign({
  idAtivacao: 'a1b2c3d4-0000-4000-8000-abcdefabcdef',
  formato: 'REEL',
  campanha: 'AGOSTO 2026',
  dataEntrega: '01/08/2026',
  dataAprovacao: '08/08/2026',
  status: 'AGUARDANDO_MATERIAL',
  temBriefing: true
}, over || {});

describe('renderPendencias — INV-06: nenhum dado entra em contexto JavaScript', () => {
  test('não gera nenhum atributo onclick', () => {
    const ctx = carregarIndex();
    ctx.renderPendencias([itemBase()]);

    const tudo = coletarTudo(pegarElemento(ctx, 'pend-lista'));
    expect(tudo.html.join('')).not.toContain('onclick');
    expect(tudo.atributos.join('')).not.toContain('onclick');
  });

  test('payload de quebra de string JS não vira código, e sobrevive intacto como data-id', () => {
    const ctx = carregarIndex();
    ctx.renderPendencias([itemBase({ idAtivacao: PAYLOAD_XSS })]);

    const tudo = coletarTudo(pegarElemento(ctx, 'pend-lista'));
    // O payload NÃO aparece no HTML serializado — nem escapado, nem cru.
    expect(tudo.html.join('')).not.toContain('alert');

    // Ele existe apenas como valor de atributo, escrito via setAttribute.
    const botoes = botoesDe(pegarElemento(ctx, 'pend-lista'));
    expect(botoes).toHaveLength(2);
    botoes.forEach((b) => expect(b.getAttribute('data-id')).toBe(PAYLOAD_XSS));
  });

  test('o id chega intacto ao handler, via listener delegado', () => {
    const ctx = carregarIndex();
    const lista = pegarElemento(ctx, 'pend-lista');
    const recebidos = [];
    ctx.abrirBriefing = (id) => recebidos.push(['briefing', id]);
    ctx.abrirEnviarMaterial = (id) => recebidos.push(['upload', id]);

    ctx.renderPendencias([itemBase({ idAtivacao: PAYLOAD_XSS })]);

    const [botaoBriefing, botaoUpload] = botoesDe(lista);
    const disparar = (alvo) => lista._listeners.click.forEach((fn) => fn({ target: alvo }));
    disparar(botaoBriefing);
    disparar(botaoUpload);

    expect(recebidos).toEqual([['briefing', PAYLOAD_XSS], ['upload', PAYLOAD_XSS]]);
  });

  test('um único listener é registrado, mesmo após vários renders', () => {
    const ctx = carregarIndex();
    const lista = pegarElemento(ctx, 'pend-lista');

    ctx.renderPendencias([itemBase()]);
    ctx.renderPendencias([itemBase()]);
    ctx.renderPendencias([itemBase()]);

    expect(lista._listeners.click).toHaveLength(1);
  });

  test('sem briefing, só o botão de upload é criado', () => {
    const ctx = carregarIndex();
    ctx.renderPendencias([itemBase({ temBriefing: false })]);

    const botoes = botoesDe(pegarElemento(ctx, 'pend-lista'));
    expect(botoes).toHaveLength(1);
    expect(botoes[0].getAttribute('data-acao')).toBe('upload');
  });
});

describe('renderPendencias — escape dos demais campos vindos de célula', () => {
  test('formato e datas são escapados antes de entrar em innerHTML', () => {
    const ctx = carregarIndex();
    ctx.renderPendencias([itemBase({ formato: PAYLOAD_TAG, dataEntrega: PAYLOAD_TAG })]);

    const html = coletarTudo(pegarElemento(ctx, 'pend-lista')).html.join('');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});

describe('renderHistoricoAtivacoes — mesma classe de bug (datas vindas de célula)', () => {
  test('a data é escapada', () => {
    const ctx = carregarIndex();
    ctx.renderHistoricoAtivacoes([
      { idAtivacao: 'H1', formato: 'REEL', dataAprovacao: PAYLOAD_TAG, status: 'PUBLICADO' }
    ]);

    const html = coletarTudo(pegarElemento(ctx, 'hist-ativacoes')).html.join('');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});

describe('escaparHtml — o que ela de fato faz (e o que não faz)', () => {
  test('escapa & < >, mas NÃO escapa aspas — por isso não serve para atributo/JS', () => {
    const { escaparHtml } = carregarIndex();

    expect(escaparHtml('<b>&</b>')).toBe('&lt;b&gt;&amp;&lt;/b&gt;');
    // Documenta a limitação que motivou a correção estrutural de INV-06:
    expect(escaparHtml(`'`)).toBe(`'`);
    expect(escaparHtml('"')).toBe('"');
  });

  test('nulo/undefined viram string vazia', () => {
    const { escaparHtml } = carregarIndex();
    expect(escaparHtml(null)).toBe('');
    expect(escaparHtml(undefined)).toBe('');
  });
});
