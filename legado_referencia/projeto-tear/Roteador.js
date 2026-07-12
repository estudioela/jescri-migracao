/* ═══════════════════════════════════════════════════════════════
   entrypoints/Entrypoints.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Pontos de entrada de `google.script.run`. É o que o front-end da V2 enxerga.
 *
 * Nada aqui tem lógica de negócio: monta as dependências e delega ao
 * AtivacaoController, que converte exceção de domínio em `{success, data?, error?}`.
 *
 * Por que existe um try/catch AQUI, se "só o Controller captura" (CLAUDE.md §13):
 * a montagem das dependências acontece ANTES de qualquer try do Controller, e
 * `new AtivacaoRepository()` chama `SpreadsheetApp.getActive()`. Se a planilha
 * estiver indisponível, ou se um dos arquivos da V2 não tiver subido no push
 * (allowlist do `.claspignore`), o throw acontece fora do alcance do Controller
 * e o Apps Script devolve uma PÁGINA DE ERRO em vez de JSON — o front-end recebe
 * HTML onde esperava um envelope. Foi assim que a V1 manifestou o "Failed to
 * fetch". A regra continua valendo para as camadas de dentro: Entity, Service e
 * Repository seguem propagando.
 *
 * As dependências são montadas DENTRO da função, nunca em tempo de carga:
 * `const`/`class` não têm hoisting entre arquivos do Apps Script, e a ordem de
 * carga não é garantida (CLAUDE.md §13).
 */

function _comEnvelope(operacao) {
  try {
    return operacao();
  } catch (erro) {
    return { success: false, error: erro && erro.message ? erro.message : String(erro) };
  }
}

function _montarControllerDeAtivacao() {
  return new AtivacaoController(new AtivacaoService(new EventDispatcher(), new AtivacaoRepository()));
}

function _montarControllerDeCiclo() {
  return new CicloController(new CicloService(new CicloRepository()));
}

/**
 * A identidade vem SEMPRE do token, nunca de um parâmetro do cliente. Se
 * `idInfluenciadora` viesse na chamada, qualquer parceira autenticada leria os
 * dados de outra só trocando o argumento.
 *
 * Lança se a sessão não existe ou expirou; `_comEnvelope` converte em
 * `{success:false}`, e o front-end devolve a parceira para a tela de login.
 */
function _idDaSessao(token) {
  return new AuthService(new ParceiroRepository(), new SessaoRepository())
    .sessaoAtual(token)
    .idInfluenciadora;
}

function apiListarAtivacoesDoCiclo(token, idCiclo) {
  return _comEnvelope(function () {
    return _montarControllerDeAtivacao().handleAtivacaoQuery({
      action: ACOES_ATIVACAO.LIST_BY_CYCLE,
      idCiclo: idCiclo,
      idInfluenciadora: _idDaSessao(token)
    });
  });
}

function apiObterAtivacao(token, idAtivacao) {
  return _comEnvelope(function () {
    return _montarControllerDeAtivacao().handleAtivacaoQuery({
      action: ACOES_ATIVACAO.GET_BY_ID,
      idAtivacao: idAtivacao,
      idInfluenciadora: _idDaSessao(token)
    });
  });
}

function apiAlterarEstadoDaAtivacao(token, idAtivacao, novoEstado) {
  return _comEnvelope(function () {
    return _montarControllerDeAtivacao().handleAtivacaoUpdate({
      action: ACOES_ATIVACAO.CHANGE_STATE,
      idAtivacao: idAtivacao,
      newState: novoEstado,
      idInfluenciadora: _idDaSessao(token)
    });
  });
}

function apiListarHistoricoDoCiclo(token, idCiclo) {
  return _comEnvelope(function () {
    return _montarControllerDeAtivacao().handleAtivacaoQuery({
      action: ACOES_ATIVACAO.LIST_ARCHIVED_BY_CYCLE,
      idCiclo: idCiclo,
      idInfluenciadora: _idDaSessao(token)
    });
  });
}

function apiListarCiclos(token) {
  return _comEnvelope(function () {
    _idDaSessao(token);

    return _montarControllerDeCiclo().handleCicloQuery({ action: ACOES_CICLO.LIST_ALL });
  });
}

/* ── Autenticação ─────────────────────────────────────────────────────────── */

function _montarControllerDeAuth() {
  return new AuthController(new AuthService(new ParceiroRepository(), new SessaoRepository()));
}

function apiLogin(cupom, senha) {
  return _comEnvelope(function () {
    return _montarControllerDeAuth().handleAuth({ action: ACOES_AUTH.LOGIN, cupom: cupom, senha: senha });
  });
}

function apiSessaoAtual(token) {
  return _comEnvelope(function () {
    return _montarControllerDeAuth().handleAuth({ action: ACOES_AUTH.ME, token: token });
  });
}

function apiLogout(token) {
  return _comEnvelope(function () {
    return _montarControllerDeAuth().handleAuth({ action: ACOES_AUTH.LOGOUT, token: token });
  });
}

/**
 * Provisionamento de senha. NÃO é uma tela: é operação administrativa.
 *
 * ⚠️ Toda função global de um projeto Apps Script é invocável pelo cliente via
 * `google.script.run` — não existe "função privada" aqui. Por isso esta exige
 * um segredo guardado em `PropertiesService` (propriedade `ADMIN_TOKEN`, criada
 * manualmente, nunca versionada). Sem ela, a função é inerte.
 *
 * A aba nasce com `Senha_Hash` vazia: ninguém loga até que uma senha seja
 * definida por aqui.
 */
const CHAVE_BLOQUEIO_ADMIN = '__admin__';

/**
 * Autorização administrativa compartilhada. Toda função global é invocável pelo
 * cliente; operações de admin exigem o segredo `ADMIN_TOKEN` (PropertiesService,
 * criado à mão, nunca versionado), com rate-limit e comparação em tempo constante.
 * Mesma mensagem para "propriedade ausente" e "token errado": nada a inferir.
 */
function _exigirAdmin(tokenAdmin) {
  const sessoes = new SessaoRepository();

  if (sessoes.estaBloqueado(CHAVE_BLOQUEIO_ADMIN)) {
    throw new Error('Operação não autorizada.');
  }

  // `.trim()` nos dois lados: espaço/quebra-de-linha colado na propriedade
  // `ADMIN_TOKEN` (ou no campo da UI) não deve derrubar a autorização — a
  // comparação é length-strict, então whitespace invisível fazia o token certo falhar.
  const esperado = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  const autorizado = !!esperado && _comparacaoEmTempoConstante(String(tokenAdmin).trim(), String(esperado).trim());

  if (!autorizado) {
    sessoes.registrarTentativa(CHAVE_BLOQUEIO_ADMIN);
    throw new Error('Operação não autorizada.');
  }

  sessoes.limparTentativas(CHAVE_BLOQUEIO_ADMIN);
}

function adminDefinirSenha(cupom, senha, tokenAdmin) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    if (!cupom || !senha) {
      throw new Error('Informe o cupom e a senha.');
    }

    new ParceiroRepository().definirSenhaHash(cupom, criarSenhaHash(senha));

    return { success: true, message: 'Senha definida.' };
  });
}

/**
 * Provisiona a senha PADRÃO da parceira (5 primeiros dígitos do CNPJ — regra
 * herdada da V1). Operação administrativa: a autoridade é o `ADMIN_TOKEN`.
 * A V2 guarda só o hash; o CNPJ vem do cadastro/prefill, não da aba canônica
 * (que não tem coluna de CNPJ). Reusa `definirSenhaHash`, como `adminDefinirSenha`.
 */
function adminProvisionarSenhaPadrao(cupom, cnpj, tokenAdmin) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    if (!cupom) {
      throw new Error('Informe o cupom.');
    }

    const senha = senhaPadraoDeCnpj(cnpj);
    new ParceiroRepository().definirSenhaHash(cupom, criarSenhaHash(senha));

    return { success: true, message: 'Senha padrão provisionada a partir do CNPJ.' };
  });
}

function _montarControllerDeParceiro() {
  return new ParceiroController(new ParceiroService(new ParceiroRepository()));
}

/**
 * Cadastro/edição de parceiras — FERRAMENTA INTERNA/ADMIN. Diferente dos demais
 * entrypoints (que operam sob a sessão da parceira), estes exigem o token
 * administrativo: o gate `_exigirAdmin` é a autoridade server-side.
 */
function apiBuscarParceira(tokenAdmin, campo, valor) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return _montarControllerDeParceiro().handleParceiroQuery({
      action: ACOES_PARCEIRO.FIND_BY_FIELD,
      campo: campo,
      valor: valor
    });
  });
}

function apiSalvarParceira(tokenAdmin, dados) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return _montarControllerDeParceiro().handleParceiroCommand({
      action: ACOES_PARCEIRO.UPSERT,
      dados: dados
    });
  });
}

/**
 * Índice administrativo de parceiras (LIST_ALL). Mesma autoridade e envelope de
 * `apiBuscarParceira`/`apiSalvarParceira`: `_exigirAdmin` roda antes de montar o
 * Controller, então token errado não toca a planilha.
 */
function apiListarParceiras(tokenAdmin) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return _montarControllerDeParceiro().handleParceiroQuery({
      action: ACOES_PARCEIRO.LIST_ALL
    });
  });
}

/** Leitura por identidade (prefill de edição). Admin-gated, como acima. */
function apiObterParceira(tokenAdmin, id) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return _montarControllerDeParceiro().handleParceiroQuery({
      action: ACOES_PARCEIRO.GET_BY_ID,
      id: id
    });
  });
}

/**
 * Desativação/reativação da parceira (SET_STATUS) — o "delete" do CRUD é
 * soft-delete (`Status_Contrato` ATIVO/INATIVO), nunca remoção de linha.
 * Admin-gated, como as demais operações de cadastro.
 */
function apiDefinirStatusParceira(tokenAdmin, chave, status) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return _montarControllerDeParceiro().handleParceiroCommand({
      action: ACOES_PARCEIRO.SET_STATUS,
      chave: chave,
      status: status
    });
  });
}

/* ── Gatilho de formulário (Google Forms → aba CADASTROS) ───────────────────
   Entrypoint de AUTOMAÇÃO (Form Submit Trigger), não HTTP: roda server-side a
   cada envio. Achata o evento em mapa título→resposta e delega ao
   ParceiroService, que faz o upsert canônico seguro. Sem envelope (não há UI):
   loga o desfecho e relança em erro, para o Apps Script registrar a falha. */

function _valoresDeCadastroDoEvento_(evento) {
  if (evento && evento.namedValues) {
    return Object.keys(evento.namedValues).reduce(function (mapa, titulo) {
      const valor = evento.namedValues[titulo];
      mapa[titulo] = Array.isArray(valor) ? valor[0] : valor;
      return mapa;
    }, {});
  }

  // Fallback: linha recém-inserida (execução manual/teste). Lê o cabeçalho da
  // própria aba do evento — nunca por índice fixo.
  if (evento && evento.range && typeof evento.range.getSheet === 'function') {
    const aba = evento.range.getSheet();
    const cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
    const linha = evento.range.getValues()[0];
    return cabecalho.reduce(function (mapa, coluna, i) {
      if (coluna) mapa[String(coluna)] = linha[i];
      return mapa;
    }, {});
  }

  throw new Error('Evento de formulário sem namedValues nem range.');
}

function onFormSubmit(evento) {
  try {
    const valores = _valoresDeCadastroDoEvento_(evento);
    const resultado = new ParceiroService(new ParceiroRepository()).registrarCadastro(valores);

    if (resultado.ignorado) {
      console.warn(`onFormSubmit: linha ignorada (${resultado.motivo}). Confira a pergunta "como prefere ser chamada".`);
    } else {
      console.log(`onFormSubmit: ${resultado.criado ? 'CRIADA' : 'ATUALIZADA'} — ${resultado.chave}`);
    }

    return resultado;
  } catch (erro) {
    console.error(`onFormSubmit falhou: ${erro.message}`);
    throw erro;
  }
}

/* ── Painel Admin — Logística ───────────────────────────────────────────────
   Operações administrativas cross-parceira. A autoridade é o `ADMIN_TOKEN`
   (`_exigirAdmin`), não a sessão de parceira — mesmo padrão de
   `apiBuscarParceira`/`apiSalvarParceira`. O gate roda ANTES de montar qualquer
   Controller, então token errado não toca a planilha. */

function _montarControllerDeLogistica() {
  return new LogisticaController(new LogisticaService(new EventDispatcher(), new LogisticaRepository()));
}

function apiListarCiclosAdmin(tokenAdmin) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return _montarControllerDeCiclo().handleCicloQuery({ action: ACOES_CICLO.LIST_ALL });
  });
}

/**
 * Gatilho administrativo de geração do ciclo mensal: registra o ciclo do mês e
 * provisiona as subpastas mensais das parceiras no Drive. Operação cross-parceira,
 * gated por `_exigirAdmin`. `referencia` (ISO opcional) define o mês; ausente ou
 * inválida → mês corrente. Fail-safe interno (ver CicloService.gerarCicloMensal).
 */
function apiGerarCicloMensal(tokenAdmin, referencia) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    var data = referencia ? new Date(referencia) : new Date();
    if (isNaN(data.getTime())) {
      data = new Date();
    }

    var resultado = new CicloService(new CicloRepository()).gerarCicloMensal(data);
    var resumo = resultado && resultado.resumoOperacional ? resultado.resumoOperacional : {};

    var saida = {
      ciclo: resultado && (resultado.idCiclo || resultado.nomeCiclo || ''),
      parceirosProcessados: resumo.parceiros || 0,
      briefingsGerados: resumo.briefingsGerados || resumo.briefings || 0,
      ativacoesGeradas: resumo.ativacoesGeradas || resumo.ativacoes || 0,
      logisticaGerada: resumo.logisticaGerada || resumo.logistica || 0,
      pagamentosGerados: resumo.pagamentosGerados || resumo.pagamentos || 0
    };

    console.log(
      'apiGerarCicloMensal: ciclo=' + saida.ciclo +
      ' parceiros=' + saida.parceirosProcessados +
      ' briefing=' + saida.briefingsGerados +
      ' ativacoes=' + saida.ativacoesGeradas +
      ' logistica=' + saida.logisticaGerada +
      ' pagamentos=' + saida.pagamentosGerados
    );

    return saida;
  });
}

/**
 * Prepara o ambiente de HOMOLOGAÇÃO/DEV para um novo ciclo de testes.
 * Não é reset de fábrica: preserva FORMS/CADASTROS/BASE e reconstrói derivadas.
 * Histórico só limpa com confirmação explícita no payload.
 */
function apiPrepararAmbienteTestes(tokenAdmin, opcoes) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return new AmbienteTesteService().prepararAmbiente(opcoes);
  });
}

function apiListarLogisticaDoCiclo(tokenAdmin, idCiclo) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return _montarControllerDeLogistica().handleLogisticaQuery({
      action: ACOES_LOGISTICA.LIST_ALL_BY_CYCLE,
      idCiclo: idCiclo
    });
  });
}

function apiAlterarStatusLogistica(tokenAdmin, idLogistica, novoStatus) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return _montarControllerDeLogistica().handleLogisticaUpdate({
      action: ACOES_LOGISTICA.CHANGE_STATUS_ADMIN,
      idLogistica: idLogistica,
      newStatus: novoStatus
    });
  });
}

/* ── Painel Admin — Ativações ───────────────────────────────────────────────
   Cross-parceira, gated por `_exigirAdmin`. Reusa `_montarControllerDeAtivacao`
   e o mesmo padrão da Logística acima. */

function apiListarAtivacoesAdmin(tokenAdmin, idCiclo) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return _montarControllerDeAtivacao().handleAtivacaoQuery({
      action: ACOES_ATIVACAO.LIST_ALL_BY_CYCLE,
      idCiclo: idCiclo
    });
  });
}

function apiAlterarEstadoAtivacaoAdmin(tokenAdmin, idAtivacao, novoEstado) {
  return _comEnvelope(function () {
    _exigirAdmin(tokenAdmin);

    return _montarControllerDeAtivacao().handleAtivacaoUpdate({
      action: ACOES_ATIVACAO.CHANGE_STATE_ADMIN,
      idAtivacao: idAtivacao,
      newState: novoEstado
    });
  });
}

function apiListarPagamentosDoCiclo(token, idCiclo) {
  return _comEnvelope(function () {
    const controller = new PagamentoController(
      new PagamentoService(new PlanoRepository(), new AtivacaoRepository())
    );

    return controller.handlePagamentoQuery({
      action: ACOES_PAGAMENTO.LIST_BY_CYCLE,
      idCiclo: idCiclo,
      idInfluenciadora: _idDaSessao(token)
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   entrypoints/Roteador.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Fronteira HTTP da V2 (Projeto Tear).
 *
 * Serve HTML e nada mais. NÃO toca SpreadsheetApp/DriveApp/PropertiesService,
 * e NÃO conhece Service nem Repository — quem faz a ponte com o domínio é o
 * AtivacaoController (CLAUDE.md §13). Separar o doGet do Controller mantém a
 * fronteira de dados legível: um serve a casca, o outro responde ao cliente.
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Projeto Tear — Estúdio Elã')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
}

/**
 * O Apps Script não serve arquivos estáticos: não existe rota para um .css.
 * Modularizar significa incluir na origem. Ver design-system/adapters/apps-script.md.
 */
function include(nomeArquivo) {
  return HtmlService.createHtmlOutputFromFile(nomeArquivo).getContent();
}

