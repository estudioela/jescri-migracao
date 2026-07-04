if (typeof document !== 'undefined') {

// estúdio elã — portal SPA router
// Hash-based navigation, no build step. Works served over http(s) (GitHub Pages,
// or embedded as an iframe from an Apps Script UI). Requires a real http server
// for local testing (fetch() of partials fails over file://) — e.g. `python3 -m http.server`.

const ROUTES = {
  login:      { file: 'views/login.html',      title: 'login',           navKey: null,        shell: false },
  dashboard:  { file: 'views/dashboard.html',   title: 'dashboard',       navKey: 'dashboard', shell: true  },
  briefing:   { file: 'views/briefing.html',    title: 'briefing',        navKey: 'dashboard', shell: true, showBack: true },
  upload:     { file: 'views/upload.html',      title: 'envio de material', navKey: 'dashboard', shell: true, showBack: true },
  pagamentos: { file: 'views/pagamentos.html',  title: 'pagamentos',      navKey: 'payments',  shell: true  },
  perfil:     { file: 'views/perfil.html',      title: 'perfil',          navKey: 'profile',   shell: true  },
  historico:  { file: 'views/historico.html',   title: 'histórico',       navKey: 'historico', shell: true  },
};

const outlet = document.getElementById('view-outlet');

// estado que precisa sobreviver a uma troca de view (fetch() substitui o
// #view-outlet inteiro, então nada dentro dele pode guardar estado)
const PortalState = {
  ativacaoAtual: null,
  arquivosSelecionados: [],
  mesIndex: { pend: new Date().getMonth(), pag: new Date().getMonth(), hist: new Date().getMonth() },
};

const MESES = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];

const STATUS_LABELS = {
  AGUARDANDO_MATERIAL: 'aguardando material',
  EM_APROVACAO: 'em aprovação',
  APROVADO: 'aprovado',
  PUBLICADO: 'publicado',
};
const STATUS_SOLID = new Set(['APROVADO', 'PUBLICADO']);
const ETAPA_ORDEM = ['MATERIAL_ENVIADO', 'AGUARDANDO_PAGAMENTO', 'PAGO'];
const ETAPA_LABELS = {
  MATERIAL_ENVIADO: 'material enviado',
  AGUARDANDO_PAGAMENTO: 'aguardando pagamento',
  PAGO: 'pago',
};

async function loadShellPartial(id, file) {
  const el = document.getElementById(id);
  const res = await fetch(file);
  el.innerHTML = await res.text();
}

function currentRouteName() {
  const hash = location.hash.replace(/^#\/?/, '');
  return ROUTES[hash] ? hash : null;
}

function isAuthenticated() {
  return window.ElaApi.isAuthenticated();
}

function setActiveNav(navKey) {
  document.querySelectorAll('[data-nav-link]').forEach((el) => {
    el.classList.toggle('is-active', navKey && el.dataset.navLink === navKey);
  });
}

function toggleShell(show) {
  document.body.classList.toggle('no-shell', !show);
}

/* ==========================================================
   TOAST
   ========================================================== */
let toastTimer = null;
function mostrarToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visivel');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visivel'), 3200);
}

/* ==========================================================
   FORMATAÇÃO
   ========================================================== */
function formatarMoeda(valor) {
  const n = Number(valor) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escaparHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function primeiroNome(nomeCompleto) {
  if (!nomeCompleto) return '';
  return nomeCompleto.trim().split(' ')[0];
}

/* ==========================================================
   SELETOR DE MÊS (compartilhado por pendências, pagamentos e histórico)
   ========================================================== */
function atualizarLabelMes(prefixo) {
  const idx = PortalState.mesIndex[prefixo];
  const label = document.getElementById(`${prefixo}-mes-label`);
  const prevBtn = document.getElementById(`${prefixo}-mes-prev`);
  const nextBtn = document.getElementById(`${prefixo}-mes-next`);
  if (label) label.textContent = MESES[idx];
  if (prevBtn) prevBtn.disabled = idx === 0;
  if (nextBtn) nextBtn.disabled = idx === 11;
}

function bindSeletorMes(prefixo, onChange) {
  const prevBtn = document.getElementById(`${prefixo}-mes-prev`);
  const nextBtn = document.getElementById(`${prefixo}-mes-next`);
  if (prevBtn) prevBtn.addEventListener('click', () => mudarMes(prefixo, -1, onChange));
  if (nextBtn) nextBtn.addEventListener('click', () => mudarMes(prefixo, 1, onChange));
  atualizarLabelMes(prefixo);
}

function mudarMes(prefixo, delta, onChange) {
  const novo = PortalState.mesIndex[prefixo] + delta;
  if (novo < 0 || novo > 11) return;
  PortalState.mesIndex[prefixo] = novo;
  atualizarLabelMes(prefixo);
  onChange();
}

/* ==========================================================
   ROTEAMENTO
   ========================================================== */
async function renderRoute(name) {
  const route = ROUTES[name];
  const res = await fetch(route.file);
  outlet.innerHTML = await res.text();
  document.title = `estúdio elã - ${route.title}`;
  toggleShell(route.shell);
  setActiveNav(route.navKey);

  const backBtn = document.querySelector('[data-nav-back]');
  if (backBtn) backBtn.classList.toggle('hidden', !route.showBack);

  // re-trigger the fade-up entrance on every navigation
  outlet.style.animation = 'none';
  // eslint-disable-next-line no-unused-expressions
  outlet.offsetHeight;
  outlet.style.animation = '';

  bindViewInteractions(name);
}

async function router() {
  const name = currentRouteName();

  if (!name) {
    location.hash = isAuthenticated() ? '#/dashboard' : '#/login';
    return;
  }
  if (name !== 'login' && !isAuthenticated()) {
    location.hash = '#/login';
    return;
  }
  if (name === 'login' && isAuthenticated()) {
    location.hash = '#/dashboard';
    return;
  }

  await renderRoute(name);
}

const LOGIN_ERROS = {
  CREDENCIAIS_INVALIDAS: 'cupom ou senha inválidos.',
  MUITAS_TENTATIVAS: 'muitas tentativas. aguarde alguns minutos e tente novamente.',
  ERRO_INTERNO: 'erro interno no servidor. tente novamente.',
  FALHA_DE_REDE: 'falha de rede. verifique sua conexão.',
};

function bindViewInteractions(routeName) {
  if (routeName === 'login') bindLogin();
  if (routeName === 'dashboard') bindDashboard();
  if (routeName === 'briefing') bindBriefing();
  if (routeName === 'upload') bindUpload();
  if (routeName === 'pagamentos') bindPagamentos();
  if (routeName === 'historico') bindHistorico();
  if (routeName === 'perfil') bindPerfil();

  document.querySelectorAll('[data-nav-to]').forEach((el) => {
    el.addEventListener('click', () => { location.hash = `#/${el.dataset.navTo}`; });
  });

  const backBtn = document.querySelector('[data-nav-back]');
  if (backBtn) backBtn.onclick = () => history.back();
}

/* ==========================================================
   LOGIN
   ========================================================== */
function bindLogin() {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const loadingBox = document.getElementById('login-loading');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cupom = document.getElementById('cupom').value.trim();
    const senha = document.getElementById('senha').value.trim();
    errorBox.classList.add('hidden');

    if (!cupom || !senha) {
      errorBox.textContent = 'informe cupom e senha.';
      errorBox.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    loadingBox.classList.remove('hidden');
    const res = await window.ElaApi.login(cupom, senha);
    loadingBox.classList.add('hidden');
    submitBtn.disabled = false;

    if (res.ok) {
      location.hash = '#/dashboard';
    } else {
      errorBox.textContent = LOGIN_ERROS[res.erro] || `falha ao entrar (${res.erro}).`;
      errorBox.classList.remove('hidden');
    }
  });
}

/* ==========================================================
   DASHBOARD (pendências)
   ========================================================== */
function bindDashboard() {
  const session = window.ElaApi.getSession();
  const greeting = document.getElementById('user-greeting-name');
  if (greeting && session) greeting.textContent = primeiroNome(session.nome || session.cupom || '');

  bindSeletorMes('pend', loadDashboardData);
  loadDashboardData();
}

async function loadDashboardData() {
  const list = document.getElementById('campaigns-list');
  if (!list) return;
  list.innerHTML = `<li class="py-stack-md border-b border-outline/20"><span class="font-meta-xs text-meta-xs text-on-surface-variant">carregando...</span></li>`;

  const mesAno = MESES[PortalState.mesIndex.pend];
  const res = await window.ElaApi.getDashboard(mesAno);

  if (res.ok === false && res.erro === 'SESSAO_EXPIRADA') {
    mostrarToast('sua sessão expirou. faça login novamente.');
    location.hash = '#/login';
    return;
  }
  if (!res.ok) {
    list.innerHTML = `<li class="py-stack-md border-b border-outline/20"><span class="font-meta-xs text-meta-xs text-error">não foi possível carregar as campanhas.</span></li>`;
    return;
  }
  if (!res.itens || res.itens.length === 0) {
    list.innerHTML = `<li class="py-stack-md border-b border-outline/20"><span class="font-meta-xs text-meta-xs text-on-surface-variant">nenhuma ativação neste mês.</span></li>`;
    return;
  }

  list.innerHTML = res.itens.map((item) => {
    const pillClasses = STATUS_SOLID.has(item.status)
      ? 'bg-secondary text-on-secondary'
      : 'bg-outline text-on-surface border border-outline/20 bg-transparent';
    return `
      <li class="flex flex-col md:flex-row md:items-center py-stack-md border-b border-outline/20 gap-4 group hover:bg-surface-container-lowest/50 transition-colors duration-300 cursor-pointer" data-nav-to="briefing" data-id-ativacao="${escaparHtml(item.idAtivacao)}">
        <div class="md:w-2/12"><span class="font-meta-xs text-meta-xs text-on-surface-variant">${escaparHtml((item.campanha || '').toLowerCase())}</span></div>
        <div class="md:w-7/12"><span class="font-body-md text-body-md group-hover:text-secondary transition-colors duration-300">${escaparHtml((item.formato || '').toLowerCase())}</span></div>
        <div class="md:w-3/12 flex justify-start md:justify-end">
          <div class="${pillClasses} px-4 py-1.5 rounded-full font-meta-xs text-meta-xs flex items-center justify-center min-w-[80px]">${STATUS_LABELS[item.status] || (item.status || '').toLowerCase()}</div>
        </div>
      </li>`;
  }).join('');

  list.querySelectorAll('[data-nav-to]').forEach((el) => {
    el.addEventListener('click', () => {
      PortalState.ativacaoAtual = el.dataset.idAtivacao;
      location.hash = `#/${el.dataset.navTo}`;
    });
  });
}

/* ==========================================================
   BRIEFING
   ========================================================== */
function bindBriefing() {
  loadBriefingData();
}

async function loadBriefingData() {
  const idAtivacao = PortalState.ativacaoAtual;
  const texto = document.getElementById('briefing-texto');
  if (!idAtivacao) {
    if (texto) texto.textContent = 'nenhuma ativação selecionada.';
    return;
  }

  const res = await window.ElaApi.getBriefing(idAtivacao);
  if (res.ok === false && res.erro === 'SESSAO_EXPIRADA') {
    mostrarToast('sua sessão expirou. faça login novamente.');
    location.hash = '#/login';
    return;
  }
  if (!res.ok) {
    if (texto) texto.textContent = 'não foi possível carregar o briefing.';
    return;
  }

  document.getElementById('briefing-mes').textContent = (res.campanha || '').toLowerCase();
  document.getElementById('briefing-formato').textContent = (res.formato || '').toLowerCase();
  document.getElementById('briefing-entrega').textContent = res.dataEntrega || '—';
  document.getElementById('briefing-postagem').textContent = res.dataAprovacao || '—';
  texto.textContent = res.textoBriefing || '';
}

/* ==========================================================
   ENVIAR MATERIAL / UPLOAD RESUMABLE
   ========================================================== */
function bindUpload() {
  PortalState.arquivosSelecionados = [];
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const list = document.getElementById('transfer-list');
  const commitBtn = document.getElementById('commit-transfer');
  const selecaoSecao = document.getElementById('upload-etapa-selecao');
  const sucessoSecao = document.getElementById('upload-etapa-sucesso');
  const erroSecao = document.getElementById('upload-etapa-erro');
  const erroTexto = document.getElementById('upload-erro-texto');
  const tentarBtn = document.getElementById('upload-btn-tentar-novamente');

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('bg-surface-container'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('bg-surface-container'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('bg-surface-container');
    addFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => addFiles(fileInput.files));

  function addFiles(files) {
    if (!files || !files.length) return;
    PortalState.arquivosSelecionados = Array.from(files);
    commitBtn.disabled = false;

    list.innerHTML = '';
    PortalState.arquivosSelecionados.forEach((file, idx) => {
      const row = document.createElement('div');
      row.className = 'transfer-row flex flex-col gap-2 py-2';
      row.dataset.fileIndex = idx;
      row.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-meta-xs text-meta-xs text-on-surface uppercase truncate max-w-[70%]">${escaparHtml(file.name)}</span>
          <span class="font-meta-xs text-meta-xs text-secondary uppercase transfer-pct">0%</span>
        </div>
        <div class="transfer-bar-track"><div class="transfer-bar-fill" style="width:0%"></div></div>`;
      list.appendChild(row);
    });
  }

  commitBtn.addEventListener('click', async () => {
    const arquivos = PortalState.arquivosSelecionados;
    const idAtivacao = PortalState.ativacaoAtual;
    if (!arquivos.length || !idAtivacao) return;

    commitBtn.disabled = true;
    erroSecao.classList.add('hidden');
    erroSecao.classList.remove('flex');

    try {
      for (let i = 0; i < arquivos.length; i++) {
        const file = arquivos[i];
        const row = list.querySelector(`[data-file-index="${i}"]`);
        const pct = row.querySelector('.transfer-pct');
        const bar = row.querySelector('.transfer-bar-fill');

        const iniciarRes = await window.ElaApi.iniciarEnvioResumable(idAtivacao, file.name, file.type || 'application/octet-stream', file.size);
        if (iniciarRes.ok === false && iniciarRes.erro === 'SESSAO_EXPIRADA') {
          mostrarToast('sua sessão expirou. faça login novamente.');
          location.hash = '#/login';
          return;
        }
        if (!iniciarRes.ok) throw new Error(iniciarRes.erro || `não foi possível iniciar o envio de ${file.name}.`);

        const fileId = await window.ElaApi.enviarArquivoResumable(iniciarRes.uploadUrl, file, (fracao) => {
          const p = Math.round(fracao * 100);
          pct.textContent = `${p}%`;
          bar.style.width = `${p}%`;
        });

        const finalizarRes = await window.ElaApi.finalizarEnvioResumable(idAtivacao, fileId);
        if (finalizarRes.ok === false && finalizarRes.erro === 'SESSAO_EXPIRADA') {
          mostrarToast('sua sessão expirou. faça login novamente.');
          location.hash = '#/login';
          return;
        }
        if (!finalizarRes.ok) throw new Error(finalizarRes.erro || `não foi possível concluir o envio de ${file.name}.`);

        pct.outerHTML = '<span class="material-symbols-outlined text-[16px] text-secondary">check</span>';
      }

      selecaoSecao.classList.add('hidden');
      sucessoSecao.classList.remove('hidden');
      sucessoSecao.classList.add('flex');
    } catch (erro) {
      erroSecao.classList.remove('hidden');
      erroSecao.classList.add('flex');
      erroTexto.textContent = (erro && erro.message) ? erro.message : 'falha no envio. tente novamente.';
    } finally {
      commitBtn.disabled = false;
    }
  });

  if (tentarBtn) {
    tentarBtn.addEventListener('click', () => {
      erroSecao.classList.add('hidden');
      erroSecao.classList.remove('flex');
      selecaoSecao.classList.remove('hidden');
    });
  }
}

/* ==========================================================
   PAGAMENTOS
   ========================================================== */
function bindPagamentos() {
  bindSeletorMes('pag', loadPagamentosData);
  loadPagamentosData();
}

async function loadPagamentosData() {
  const lista = document.getElementById('pag-lista');
  const previstoEl = document.getElementById('pag-total-previsto');
  const pagoEl = document.getElementById('pag-total-pago');
  lista.innerHTML = `<div class="py-stack-md font-meta-xs text-meta-xs text-on-surface-variant">carregando...</div>`;
  previstoEl.textContent = formatarMoeda(0);
  pagoEl.textContent = formatarMoeda(0);

  const mesAno = MESES[PortalState.mesIndex.pag];
  const res = await window.ElaApi.getPagamentos(mesAno);

  if (res.ok === false && res.erro === 'SESSAO_EXPIRADA') {
    mostrarToast('sua sessão expirou. faça login novamente.');
    location.hash = '#/login';
    return;
  }
  if (!res.ok) {
    lista.innerHTML = `<div class="py-stack-md font-meta-xs text-meta-xs text-error">não foi possível carregar os pagamentos.</div>`;
    return;
  }

  previstoEl.textContent = formatarMoeda(res.totalPrevisto);
  pagoEl.textContent = formatarMoeda(res.totalPago);

  const itens = res.itens || [];
  if (!itens.length) {
    lista.innerHTML = `<div class="py-stack-md font-meta-xs text-meta-xs text-on-surface-variant">nenhum pagamento neste mês.</div>`;
    return;
  }

  lista.innerHTML = itens.map((item) => {
    const idxAtual = ETAPA_ORDEM.indexOf(item.etapa);
    const etapasHtml = ETAPA_ORDEM.map((etapa, i) => {
      const cor = i <= idxAtual ? 'text-secondary' : 'text-outline';
      return `<span class="${cor} font-meta-xs text-meta-xs lowercase">${ETAPA_LABELS[etapa]}</span>`;
    }).join('<span class="text-outline">—</span>');
    const dataPagamentoHtml = item.dataPagamento ? `<span class="font-meta-xs text-meta-xs text-on-surface-variant">pago em ${escaparHtml(item.dataPagamento)}</span>` : '';
    return `
      <div class="flex flex-col md:flex-row md:items-center justify-between py-stack-md border-b border-outline/20 gap-2">
        <div class="flex flex-col gap-1">
          <span class="font-body-md text-body-md">${formatarMoeda(item.valor)}</span>
          <span class="font-meta-xs text-meta-xs text-on-surface-variant lowercase">${escaparHtml(item.referencia || '')}</span>
        </div>
        <div class="flex items-center gap-2">${etapasHtml}</div>
        ${dataPagamentoHtml}
      </div>`;
  }).join('');
}

/* ==========================================================
   HISTÓRICO
   ========================================================== */
function bindHistorico() {
  bindSeletorMes('hist', loadHistoricoData);
  loadHistoricoData();
}

async function loadHistoricoData() {
  const elAtiv = document.getElementById('hist-ativacoes');
  const elPag = document.getElementById('hist-pagamentos');
  elAtiv.innerHTML = `<div class="py-stack-md font-meta-xs text-meta-xs text-on-surface-variant">carregando...</div>`;
  elPag.innerHTML = '';

  const mesAno = MESES[PortalState.mesIndex.hist];
  const res = await window.ElaApi.getHistorico(mesAno);

  if (res.ok === false && res.erro === 'SESSAO_EXPIRADA') {
    mostrarToast('sua sessão expirou. faça login novamente.');
    location.hash = '#/login';
    return;
  }
  if (!res.ok) {
    elAtiv.innerHTML = `<div class="py-stack-md font-meta-xs text-meta-xs text-error">não foi possível carregar o histórico.</div>`;
    return;
  }

  const ativacoes = res.ativacoes || [];
  elAtiv.innerHTML = !ativacoes.length
    ? `<div class="py-stack-md font-meta-xs text-meta-xs text-on-surface-variant">nenhuma ativação registrada.</div>`
    : ativacoes.map((item) => `
        <div class="flex items-center justify-between py-stack-sm border-b border-outline/20">
          <div class="flex flex-col">
            <span class="font-body-md text-body-md">${escaparHtml((item.formato || '').toLowerCase())}</span>
            <span class="font-meta-xs text-meta-xs text-on-surface-variant">${escaparHtml(item.dataAprovacao || '')}</span>
          </div>
          <span class="font-meta-xs text-meta-xs lowercase">${STATUS_LABELS[item.status] || (item.status || '').toLowerCase()}</span>
        </div>`).join('');

  const pagamentos = res.pagamentos || [];
  elPag.innerHTML = !pagamentos.length
    ? `<div class="py-stack-md font-meta-xs text-meta-xs text-on-surface-variant">nenhum pagamento registrado.</div>`
    : pagamentos.map((item) => `
        <div class="flex items-center justify-between py-stack-sm border-b border-outline/20">
          <span class="font-body-md text-body-md">${formatarMoeda(item.valor)}</span>
          <span class="font-meta-xs text-meta-xs text-on-surface-variant">${item.dataPagamento ? escaparHtml(item.dataPagamento) : (ETAPA_LABELS[item.etapa] || '')}</span>
        </div>`).join('');
}

/* ==========================================================
   PERFIL
   ========================================================== */
function bindPerfil() {
  loadPerfilData();

  const btn = document.getElementById('btn-salvar-perfil');
  const msg = document.getElementById('perfil-msg');
  btn.addEventListener('click', async () => {
    msg.classList.add('hidden');
    const dados = {
      chavePix: document.getElementById('perfil-input-chavepix').value.trim(),
      email: document.getElementById('perfil-input-email').value.trim(),
      cep: document.getElementById('perfil-input-cep').value.trim(),
      numero: document.getElementById('perfil-input-numero').value.trim(),
      complemento: document.getElementById('perfil-input-complemento').value.trim(),
    };

    btn.disabled = true;
    const res = await window.ElaApi.updateUserData(dados);
    btn.disabled = false;

    if (res.ok === false && res.erro === 'SESSAO_EXPIRADA') {
      mostrarToast('sua sessão expirou. faça login novamente.');
      location.hash = '#/login';
      return;
    }
    if (res.ok) {
      mostrarToast('alterações salvas.');
    } else {
      msg.textContent = 'não foi possível salvar. tente novamente.';
      msg.classList.remove('hidden');
    }
  });
}

async function loadPerfilData() {
  const nomeEl = document.getElementById('perfil-nome');
  if (!nomeEl) return;
  const res = await window.ElaApi.getUserData();

  if (res.ok === false && res.erro === 'SESSAO_EXPIRADA') {
    mostrarToast('sua sessão expirou. faça login novamente.');
    location.hash = '#/login';
    return;
  }
  if (!res.ok) return;

  const { dados, somenteLeitura } = res;
  nomeEl.textContent = (dados.nome || '').toLowerCase();
  document.getElementById('perfil-cupom').textContent = `cupom: ${somenteLeitura.cupom}`;
  document.getElementById('perfil-cnpj').textContent = dados.cnpj || '—';
  document.getElementById('perfil-cidade').textContent = dados.cidade || '—';
  document.getElementById('perfil-estado').textContent = dados.estado || '—';
  document.getElementById('perfil-rua').textContent = dados.rua || '—';
  document.getElementById('perfil-valortotal').textContent = (somenteLeitura.valorTotal !== undefined && somenteLeitura.valorTotal !== null && somenteLeitura.valorTotal !== '')
    ? formatarMoeda(somenteLeitura.valorTotal) : '—';

  document.getElementById('perfil-input-chavepix').value = dados.chavePix || '';
  document.getElementById('perfil-input-email').value = dados.email || '';
  document.getElementById('perfil-input-cep').value = dados.cep || '';
  document.getElementById('perfil-input-numero').value = dados.numero || '';
  document.getElementById('perfil-input-complemento').value = dados.complemento || '';
}

/* ==========================================================
   INIT
   ========================================================== */
(async function init() {
  await Promise.all([
    loadShellPartial('shell-header', 'components/header.html'),
    loadShellPartial('shell-bottomnav', 'components/bottomnav.html'),
    loadShellPartial('shell-footer', 'components/footer.html'),
  ]);
  document.body.addEventListener('click', (e) => {
    const logoutBtn = e.target.closest('[data-action="logout"]');
    if (logoutBtn) {
      window.ElaApi.logout();
      location.hash = '#/login';
    }
  });

  window.addEventListener('hashchange', router);
  router();
})();

}
