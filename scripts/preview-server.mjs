// Preview local da UI do Portal TEAR — `npm run preview`.
//
// Serve as telas reais de `src/ui/*.html` SEM OAuth e SEM Apps Script:
// lê os arquivos direto do repositório a cada request (edição → refresh),
// expande o scriptlet `include('src/ui/portal-head')` com a mesma semântica
// do helper GAS (`src/shared/Include.js`) e injeta, apenas na resposta
// HTTP, um simulador de `google.script.run`/`google.script.url` com dados
// de exemplo nos formatos que cada tela consome.
//
// Nada aqui altera `src/`, o fluxo OAuth ou produção: esta pasta está fora
// do allowlist do `.claspignore`, portanto nunca é publicada no Apps
// Script. O simulador existe SOMENTE neste servidor.
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8787);

// Mesmo mapa de rotas do doGet (src/entrypoint/Portal.js).
const PAGINAS = {
  'compilar-mes': 'compilar-mes',
  briefing: 'briefing',
  entrega: 'entrega',
  envio: 'envio',
  pagamentos: 'pagamentos',
  documentos: 'documentos',
  'portal-login': 'login',
  'portal-pendencias': 'pendencias',
  'portal-perfil': 'perfil',
  'portal-dashboard': 'dashboard',
  'portal-financeiro': 'financeiro',
  admin: 'admin',
};

const MOCKS = `
(function () {
  var pagina = new URLSearchParams(window.location.search).get('pagina') || 'portal-login';
  if (pagina === 'portal-login') {
    // Deixa a tela de login visível (sem token, sem redirect).
    sessionStorage.removeItem('tearPortalToken');
  } else {
    sessionStorage.setItem('tearPortalToken', 'preview-token');
  }

  var DATA = {
    verPendencias: [
      { rotulo: 'LOOK 1', estado: 'AguardandoMaterial', briefing: { look: 'Vestido midi verde', dataEntrega: '2026-07-22', dataPostagem: '2026-07-25' } },
      { rotulo: 'LOOK 2', estado: 'EmRevisao', briefing: { look: 'Conjunto de linho cru', dataEntrega: '2026-07-28', dataPostagem: '2026-07-31' } },
      { rotulo: 'LOOK 3', estado: 'AguardandoMaterial', briefing: null }
    ],
    listarPeriodosDoPortal: ['2026-05', '2026-06', '2026-07'],
    verFinanceiroDoPortal: { previsto: 720, pago: 400 },
    verHistoricoDoPortal: [
      { tipo: 'Entrega', referencia: 'LOOK 1', estado: 'Publicado', dataArquivamento: '2026-06-30', valor: 0 },
      { tipo: 'Obrigação Mensal', referencia: '2026-06', estado: 'Pago', dataArquivamento: '2026-06-30', valor: 720 }
    ],
    verPerfilDoPortal: { email: 'parceira@exemplo.com', pix: 'chave-pix-exemplo', endereco: { cep: '04746-115', numero: '150', complemento: 'Apto 173', uf: 'SP', rua: 'Rua Elias Antonio Zogbi', bairro: 'Santo Amaro', cidade: 'São Paulo' } },
    editarPerfilDoPortal: { email: 'parceira@exemplo.com', pix: 'chave-pix-exemplo', endereco: { cep: '04746-115', numero: '150', complemento: 'Apto 173', uf: 'SP', rua: 'Rua Elias Antonio Zogbi', bairro: 'Santo Amaro', cidade: 'São Paulo' } },
    listarUsuariosPendentes: [
      { email: 'nova.influenciadora@gmail.com', papel: 'INFLUENCIADORA', subProvider: 'preview-sub-1' }
    ],
    compilarMes: { jaCompilada: false, mesReferencia: '2026-07', colaboracoes: [
      { parceiraId: 'CAROL TANAKA', estado: 'Compilada', snapshot: { valorMensal: 720 } },
      { parceiraId: 'DUDA PIASSI', estado: 'Compilada', snapshot: { valorMensal: 600 } },
      { parceiraId: 'RIETRA', estado: 'Compilada', snapshot: { valorMensal: 1350 } }
    ] },
    obterBriefing: { estado: 'EmPreenchimento', blocos: [
      { rotulo: 'LOOK 1', look: 'Vestido midi verde', dataEntrega: '2026-07-22', dataPostagem: '2026-07-25', orientacao: 'Luz natural, fundo neutro', dataAprovacaoInterna: '2026-07-20' },
      { rotulo: 'LOOK 2', look: '', dataEntrega: '', dataPostagem: '', orientacao: '', dataAprovacaoInterna: null }
    ] },
    preencherBriefing: { estado: 'Preenchido', blocos: [
      { rotulo: 'LOOK 1', look: 'Vestido midi verde', dataEntrega: '2026-07-22', dataPostagem: '2026-07-25', orientacao: 'Luz natural, fundo neutro', dataAprovacaoInterna: '2026-07-20' }
    ] },
    listarEntregas: [
      { parceiraId: 'CAROL TANAKA', rotulo: 'LOOK 1', estado: 'EmRevisao', linkMaterial: 'https://drive.google.com/exemplo' },
      { parceiraId: 'DUDA PIASSI', rotulo: 'LOOK 1', estado: 'AguardandoMaterial' },
      { parceiraId: 'CAROL TANAKA', rotulo: 'LOOK 2', estado: 'Aprovado' }
    ],
    listarEnvios: [
      { parceiraId: 'CAROL TANAKA', mesReferencia: '2026-07', revisao: 'Confirmado', jornada: 'EmTransito', rastreio: 'BR123456789', dataEnvio: '2026-07-10', dataArquivamento: null },
      { parceiraId: 'DUDA PIASSI', mesReferencia: '2026-07', revisao: 'Pendente', jornada: 'Preparando', rastreio: null, dataEnvio: null, dataArquivamento: null }
    ],
    listarPagamentos: [
      { id: 'PG-2026-07-CAROL', parceiraId: 'CAROL TANAKA', tipo: 'Mensal', estado: 'EmAberto', valor: 720 },
      { id: 'PG-2026-07-DUDA', parceiraId: 'DUDA PIASSI', tipo: 'Mensal', estado: 'Aprovado', valor: 600 },
      { id: 'PG-AV-RIETRA', parceiraId: 'RIETRA', tipo: 'Avulso', estado: 'Pago', valor: 1350 }
    ],
    gerarContrato: { tipo: 'Contrato', conteudo: '(preview) Conteúdo do Contrato gerado a partir do Snapshot Comercial.' },
    gerarBriefingFormal: { tipo: 'Briefing Formal', conteudo: '(preview) Conteúdo do Briefing Formal gerado.' },
    iniciarLoginComGoogle: { urlDeAutorizacao: '/?pagina=portal-login&code=PREVIEW' },
    entrarComCodigoOAuth: { status: 'AUTENTICADO', token: 'preview-token', papel: 'ADMINISTRADOR', expiraEm: '2026-07-19T23:59:59Z' }
  };

  function Runner() {
    var onOk = function () {};
    var proxy = new Proxy({}, {
      get: function (alvo, nome) {
        if (nome === 'withSuccessHandler') return function (fn) { onOk = fn; return proxy; };
        if (nome === 'withFailureHandler') return function () { return proxy; };
        return function () {
          var data = Object.prototype.hasOwnProperty.call(DATA, nome) ? DATA[nome] : {};
          setTimeout(function () { onOk({ success: true, data: data }); }, 200);
        };
      }
    });
    return proxy;
  }

  window.google = { script: {
    run: new Proxy({}, {
      get: function (alvo, nome) { return Runner()[nome]; }
    }),
    url: {
      getLocation: function (fn) {
        var parametros = {};
        new URLSearchParams(window.location.search).forEach(function (v, k) { parametros[k] = v; });
        setTimeout(function () { fn({ parameter: parametros, hash: '' }); }, 0);
      }
    },
    history: { push: function () {}, replace: function () {} },
    host: { close: function () {}, setHeight: function () {}, setWidth: function () {} }
  } };

  // Selo discreto de preview (não existe em produção).
  document.addEventListener('DOMContentLoaded', function () {
    var selo = document.createElement('div');
    selo.textContent = 'PREVIEW — dados simulados';
    selo.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:9999;padding:4px 10px;border-radius:8px;background:#183329;color:#fff;font:600 11px/1.6 Inter,sans-serif;opacity:.75;pointer-events:none;';
    document.body.appendChild(selo);
  });
})();
`;

function renderizar(pagina) {
  const arquivo = PAGINAS[pagina] || 'login';
  let html = readFileSync(join(REPO, 'src', 'ui', arquivo + '.html'), 'utf8');
  // Mesma semântica de include() (src/shared/Include.js).
  html = html.replace(/<\?!=\s*include\('([^']+)'\)\s*\?>/g, (m, nome) =>
    readFileSync(join(REPO, nome + '.html'), 'utf8')
  );
  // Simulador ANTES de qualquer script da página.
  html = html.replace(/<head>/i, '<head>\n<script>' + MOCKS + '</script>');
  return html;
}

http
  .createServer((req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const pagina = url.searchParams.get('pagina') || 'portal-login';
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(renderizar(pagina));
    } catch (erro) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Erro no preview: ' + erro.message);
    }
  })
  .listen(PORT, () => {
    console.log('Preview do Portal TEAR em http://localhost:' + PORT + '/');
    console.log('Telas: /?pagina=portal-login | admin | portal-dashboard | portal-pendencias |');
    console.log('       portal-perfil | portal-financeiro | compilar-mes | briefing | entrega |');
    console.log('       envio | pagamentos | documentos');
  });
