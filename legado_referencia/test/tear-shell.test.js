/**
 * Casca navegável da V2 (Etapa 1): roteamento, escape e renderizadores.
 *
 * Carrega o <script> real de tear/Templates.html via loadGasModule — nenhuma lógica
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
const app = loadGasModule(path.join(RAIZ, 'tear', 'Templates.html'));

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
    const views = fs.readFileSync(path.join(RAIZ, 'tear', 'Templates.html'), 'utf8');

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
    expect(app.renderizarBriefing([])).toContain('sem briefing');
    expect(app.renderizarPerfil(null)).toContain('perfil indisponível');
  });

  test('briefing escapa o link e sinaliza quando não há', () => {
    expect(app.renderizarBriefing([{ formato: 'reel', link: 'https://x?a=1&b=2' }])).toContain('a=1&amp;b=2');
    expect(app.renderizarBriefing([{ formato: 'reel', link: '' }])).toContain('ainda não publicado');
  });

  test('os dados simulados não vazam nome real de influenciadora', () => {
    // O repositório é público. A Etapa 1 não pode carregar PII no mock.
    expect(JSON.stringify(app.DADOS_MOCK)).toMatch(/exemplo/i);
  });
});

describe('fiação com o backend (Etapa 4)', () => {
  const noFalso = () => ({ innerHTML: '' });

  /**
   * Reproduz o contrato real do `google.script.run`: cada `with*Handler`
   * devolve um NOVO runner com o handler acoplado, e a função invocada acha os
   * handlers em `this`. Se `chamar()` perder o `this` (ex.: `.apply(null, ...)`),
   * `aoTerSucesso` é `undefined` e a Promise nunca resolve — a tela travaria.
   */
  function comBackend(aoSerChamado) {
    const run = {
      withSuccessHandler(ok) { return Object.assign(Object.create(this), { aoTerSucesso: ok }); },
      withFailureHandler(falha) { return Object.assign(Object.create(this), { aoFalhar: falha }); },
      apiListarAtivacoesDoCiclo() { aoSerChamado(this); }
    };

    const ctx = loadGasModule(path.join(RAIZ, 'tear', 'Templates.html'), { google: { script: { run } } });
    // Desde a Etapa 7 todo carregador exige sessão: o token vai em cada chamada.
    ctx.SESSAO = { token: 'tok-teste', perfil: {} };
    return ctx;
  }

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
    const app2 = comBackend((runner) => runner.aoTerSucesso({ success: false, error: 'Aba "Ativacoes" não encontrada.' }));
    app2.CICLO_ATIVO = 'c-1';

    const no = noFalso();
    await app2.carregarPendencias(no);

    expect(no.innerHTML).toContain('Aba &quot;Ativacoes&quot; não encontrada.');
    expect(no.innerHTML).not.toContain('reel');
  });

  test('dados reais do backend substituem o mock e sinalizam origem real', async () => {
    const app2 = comBackend((runner) =>
      runner.aoTerSucesso({ success: true, data: [{ tipoConteudo: 'CARROSSEL', idCiclo: 'c-1', estado: 'Aprovada' }] })
    );
    app2.CICLO_ATIVO = 'c-1';

    const no = noFalso();

    await expect(app2.carregarPendencias(no)).resolves.toBe(true);
    expect(no.innerHTML).toContain('CARROSSEL');
    expect(no.innerHTML).not.toContain('reel');
  });

  // Um envelope fora do contrato é bug de contrato, não falha de transporte:
  // rotulá-lo como "falha de comunicação" manda quem depura para o lado errado.
  test.each([
    [undefined],
    [null],
    [{ data: [] }],
    [{ success: true, data: 'não é array' }]
  ])('envelope malformado %p vira "resposta inesperada", não "falha de comunicação"', async (envelope) => {
    const app2 = comBackend((runner) => runner.aoTerSucesso(envelope));
    app2.CICLO_ATIVO = 'c-1';

    const no = noFalso();
    await app2.carregarPendencias(no);

    expect(no.innerHTML).toContain('Resposta inesperada do servidor.');
    expect(no.innerHTML).not.toContain('Falha de comunicação');
  });

  test('resposta de um ciclo abandonado não pinta a tela do ciclo atual', async () => {
    let disparar;
    const app2 = comBackend((runner) => {
      disparar = () => runner.aoTerSucesso({ success: true, data: [{ tipoConteudo: 'REEL', idCiclo: 'c-1', estado: 'x' }] });
    });
    app2.CICLO_ATIVO = 'c-1';

    const no = noFalso();
    const promessa = app2.carregarPendencias(no);

    app2.CICLO_ATIVO = 'c-2'; // usuário troca de ciclo enquanto a resposta está em voo
    disparar();
    await promessa;

    expect(no.innerHTML).toBe('');
  });
});

describe('sessão no cliente', () => {
  function comStorage() {
    const dados = new Map();
    const sessionStorage = {
      getItem: (k) => (dados.has(k) ? dados.get(k) : null),
      setItem: (k, v) => dados.set(k, v),
      removeItem: (k) => dados.delete(k)
    };

    return { dados, app: loadGasModule(path.join(RAIZ, 'tear', 'Templates.html'), { sessionStorage }) };
  }

  // O token do Apps Script é um bearer puro: o servidor só faz cache.get(token),
  // sem binding de IP ou User-Agent. Em localStorage ele sobreviveria ao reboot.
  test('a sessão usa sessionStorage, e localStorage não aparece no código', () => {
    const fonte = fs.readFileSync(path.join(RAIZ, 'tear', 'Templates.html'), 'utf8');
    // Os comentários citam localStorage para explicar por que NÃO é usado.
    const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    expect(codigo).toContain('sessionStorage');
    expect(codigo).not.toMatch(/\blocalStorage\b/);
  });

  test('sem token persistido, não há sessão', () => {
    const { app: a } = comStorage();

    expect(a.estaAutenticado()).toBe(false);
    expect(a.lerTokenPersistido()).toBe(null);
  });

  test('persistir e apagar o token', () => {
    const { app: a, dados } = comStorage();

    a.persistirToken('tok-1');
    expect(a.lerTokenPersistido()).toBe('tok-1');

    a.persistirToken(null);
    expect(dados.has('tear.token')).toBe(false);
  });

  test('sem backend, restaurarSessao não autentica ninguém', async () => {
    const { app: a } = comStorage();
    a.persistirToken('tok-1');

    await expect(a.restaurarSessao()).resolves.toBe(false);
  });

  test('sair encerra a sessão local mesmo sem backend', async () => {
    const { app: a } = comStorage();
    a.persistirToken('tok-1');

    await a.sairDoApp();

    expect(a.lerTokenPersistido()).toBe(null);
    expect(a.estaAutenticado()).toBe(false);
  });

  test('login é uma rota conhecida e fica fora da bottom nav', () => {
    expect(app.ehRotaValida('login')).toBe(true);
    expect(app.ROTAS_DO_NAV).not.toContain('login');
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

    expect(sandbox.include('Styles')).toBe('<style></style>');
    expect(HtmlService.createHtmlOutputFromFile).toHaveBeenCalledWith('Styles');
  });

  // O Controller é a fronteira de dados; o roteamento HTTP serve HTML. Se um
  // começar a fazer o trabalho do outro, a separação da §13 do CLAUDE.md deixa
  // de existir. Depois da consolidação, Roteador.js reúne roteamento (doGet /
  // include) E os entrypoints do google.script.run — e um entrypoint admin PODE
  // ler PropertiesService. Por isso a trava é sobre as funções que servem HTML,
  // não sobre o arquivo inteiro: são elas que não podem tocar dados.
  test('o roteamento que serve HTML não toca planilha, Drive nem propriedades do script', () => {
    const fonte = fs.readFileSync(path.join(RAIZ, 'tear', 'Roteador.js'), 'utf8');
    const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    // Isola o corpo de uma função de topo: da declaração até a próxima função de
    // topo (ou o fim do arquivo).
    const corpoDe = (nome) => {
      const inicio = codigo.indexOf('function ' + nome);
      if (inicio === -1) return '';
      const resto = codigo.slice(inicio);
      const proxima = resto.indexOf('\nfunction ', 1);
      return proxima === -1 ? resto : resto.slice(0, proxima);
    };

    const roteamento = corpoDe('doGet') + corpoDe('include');

    expect(roteamento).not.toMatch(/^\s*$/);   // âncora: se a extração falhar, o teste não passa vazio
    expect(roteamento).not.toMatch(/SpreadsheetApp|DriveApp|PropertiesService/);
  });
});
