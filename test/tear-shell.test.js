/**
 * Casca navegável da V2 (Etapa 1): roteamento, escape e renderizadores.
 *
 * Carrega o <script> real de tear/app.html via loadGasModule — nenhuma lógica
 * é reescrita aqui. Como o script guarda a ligação com o DOM atrás de
 * `typeof document !== 'undefined'`, ele carrega no sandbox sem shim algum.
 *
 * Esta é a primeira cobertura automatizada de tear/ (até aqui, nenhum teste da
 * suíte tocava a V2 — ver FLOW.md, "Projeto Tear").
 */
const fs = require('fs');
const path = require('path');
const { loadGasModule } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const app = loadGasModule(path.join(RAIZ, 'tear', 'app.html'));

describe('roteamento', () => {
  test('resolve uma rota conhecida', () => {
    expect(app.resolverRota('perfil')).toBe('perfil');
  });

  test.each([['inexistente'], [''], [null], [undefined]])(
    'cai no painel para a rota %p',
    (entrada) => {
      expect(app.resolverRota(entrada)).toBe('dashboard');
    }
  );

  // hasOwnProperty é o que impede 'constructor' ou '__proto__' de "existirem"
  // como rota por herança do Object.prototype.
  test.each([['constructor'], ['__proto__'], ['toString']])(
    'não trata %p como rota, apesar de existir no protótipo',
    (herdada) => {
      expect(app.ehRotaValida(herdada)).toBe(false);
      expect(app.resolverRota(herdada)).toBe('dashboard');
    }
  );

  test('a bottom nav tem 4 itens, todos rotas válidas', () => {
    expect(app.ROTAS_DO_NAV).toHaveLength(4);
    app.ROTAS_DO_NAV.forEach((rota) => expect(app.ehRotaValida(rota)).toBe(true));
  });

  test('todo template declarado em ROTAS existe em views.html', () => {
    const views = fs.readFileSync(path.join(RAIZ, 'tear', 'views.html'), 'utf8');

    Object.keys(app.ROTAS).forEach((rota) => {
      expect(views).toContain(`id="${app.ROTAS[rota].template}"`);
    });
  });
});

describe('escaparHtml — todo dado exibido vem de célula editável por terceiros', () => {
  test('neutraliza os cinco metacaracteres', () => {
    expect(app.escaparHtml(`<img src=x onerror="alerta">&'`))
      .toBe('&lt;img src=x onerror=&quot;alerta&quot;&gt;&amp;&#39;');
  });

  test.each([[null], [undefined]])('converte %p em string vazia', (entrada) => {
    expect(app.escaparHtml(entrada)).toBe('');
  });

  test('escapa o & antes dos demais, sem escape duplo', () => {
    expect(app.escaparHtml('&lt;')).toBe('&amp;lt;');
  });
});

describe('renderizadores — recebem dados por parâmetro e devolvem string', () => {
  test('pendências: escapa o conteúdo vindo dos dados', () => {
    const html = app.renderizarPendencias([
      { formato: '<script>', ciclo: 'julho', estado: 'em aprovação' }
    ]);

    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  test.each([
    ['renderizarPendencias', 'nenhuma entrega pendente.'],
    ['renderizarPagamentos', 'nenhum pagamento no período.'],
    ['renderizarHistorico', 'nada arquivado ainda.']
  ])('%s exibe estado vazio para lista vazia', (fn, mensagem) => {
    expect(app[fn]([])).toContain(mensagem);
    expect(app[fn](null)).toContain(mensagem);
  });

  test('briefing e perfil têm estado vazio próprio', () => {
    expect(app.renderizarBriefing(null)).toContain('sem briefing');
    expect(app.renderizarPerfil(null)).toContain('perfil indisponível');
  });

  test('os dados simulados não vazam nome real de influenciadora', () => {
    // O repositório é público. A Etapa 1 não pode carregar PII no mock.
    expect(JSON.stringify(app.DADOS_MOCK)).toMatch(/exemplo/i);
  });
});

describe('fiação com o backend (Etapa 4)', () => {
  const noFalso = () => ({ innerHTML: '' });

  test('sem google.script.run, temBackend() é falso', () => {
    expect(app.temBackend()).toBe(false);
  });

  test('pendenciaDeDto traduz o DTO do domínio para o card', () => {
    expect(app.pendenciaDeDto({ tipoConteudo: 'REEL', idCiclo: 'c-1', estado: 'Em Produção', linkBriefing: 'x' }))
      .toEqual({ formato: 'REEL', ciclo: 'c-1', estado: 'Em Produção' });
  });

  // Sem backend (preview local) a tela cai no mock e o banner continua visível.
  test('sem backend, carregarPendencias usa o mock e sinaliza origem simulada', async () => {
    const no = noFalso();

    await expect(app.carregarPendencias(no)).resolves.toBe(false);
    expect(no.innerHTML).toContain('reel');
  });

  test('renderizarErro escapa a mensagem vinda do servidor', () => {
    expect(app.renderizarErro('<b>falhou</b>')).toContain('&lt;b&gt;falhou&lt;/b&gt;');
  });

  // Um erro de domínio não pode ser mascarado por dados simulados: a tela
  // passaria a mentir sobre o estado do sistema.
  test('erro de domínio é exibido, não substituído pelo mock', async () => {
    // `chamar()` faz `.apply(null, args)`: dentro da função `this` não é o
    // objeto run. O fake fecha sobre `run`, como o próprio Apps Script faz.
    const run = {
      aoTerSucesso: null,
      withSuccessHandler(ok) { run.aoTerSucesso = ok; return run; },
      withFailureHandler() { return run; },
      apiListarAtivacoesDoCiclo() {
        run.aoTerSucesso({ success: false, error: 'Aba "Ativacoes" não encontrada.' });
      }
    };

    const app2 = loadGasModule(path.join(RAIZ, 'tear', 'app.html'), { google: { script: { run } } });
    app2.CICLO_ATIVO = 'c-1';

    const no = noFalso();
    await app2.carregarPendencias(no);

    expect(no.innerHTML).toContain('Aba &quot;Ativacoes&quot; não encontrada.');
    expect(no.innerHTML).not.toContain('reel');
  });
});

describe('tear/Roteador.js — fronteira HTTP', () => {
  function carregarRoteador() {
    const saida = {
      evaluate: jest.fn().mockReturnThis(),
      setTitle: jest.fn().mockReturnThis(),
      addMetaTag: jest.fn().mockReturnThis()
    };
    const HtmlService = {
      createTemplateFromFile: jest.fn().mockReturnValue(saida),
      createHtmlOutputFromFile: jest.fn().mockReturnValue({ getContent: () => '<style></style>' })
    };

    return { sandbox: loadGasModule(path.join(RAIZ, 'tear', 'Roteador.js'), { HtmlService }), HtmlService, saida };
  }

  test('doGet serve o Index e declara o viewport mobile', () => {
    const { sandbox, HtmlService, saida } = carregarRoteador();

    sandbox.doGet();

    expect(HtmlService.createTemplateFromFile).toHaveBeenCalledWith('Index');
    expect(saida.addMetaTag).toHaveBeenCalledWith('viewport', expect.stringContaining('width=device-width'));
  });

  test('include() devolve o conteúdo do arquivo pedido', () => {
    const { sandbox, HtmlService } = carregarRoteador();

    expect(sandbox.include('styles_core')).toBe('<style></style>');
    expect(HtmlService.createHtmlOutputFromFile).toHaveBeenCalledWith('styles_core');
  });

  // O Controller é a fronteira de dados; o Roteador serve HTML. Se um começar a
  // fazer o trabalho do outro, a separação da §13 do CLAUDE.md deixa de existir.
  test('o Roteador não toca planilha, Drive nem propriedades do script', () => {
    const fonte = fs.readFileSync(path.join(RAIZ, 'tear', 'Roteador.js'), 'utf8');
    // Os comentários do próprio arquivo citam essas APIs para explicar por que
    // não as usa — a asserção é sobre o código, não sobre a prosa.
    const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    expect(codigo).not.toMatch(/SpreadsheetApp|DriveApp|PropertiesService/);
  });
});
