/**
 * ENTRYPOINT: Portal TEAR — porta de entrada do Web App (M1, Vertical Slice
 * "Cadastro de Parceira"). Substitui o endpoint de fumaça do Sprint 0.
 *
 * Camada entrypoint: ÚNICO lugar autorizado a tocar SpreadsheetApp e a
 * compor o grafo de objetos (Controller -> Service -> Domínio + Repository
 * -> ACL). Não contém regra de negócio nem conhece coluna física — apenas
 * cabla a fatia já implementada e devolve SEMPRE o envelope padrão §3.3.
 */

/**
 * Renderiza o Portal. Sem parâmetro: login federado do Portal (SPEC-035),
 * que também cobre onboarding de quem ainda não tem cadastro.
 * Com `?pagina=compilar-mes`: compilação da Colaboração Mensal (M2).
 * Com `?pagina=briefing`: Briefing da Colaboração (M3).
 * Com `?pagina=entrega`/`envio`: telas internas de operação (M4/M5).
 * Com `?pagina=portal-login`/`portal-pendencias`/`portal-perfil`/
 * `portal-dashboard`/`portal-financeiro`: Portal da Parceira (M8,
 * SPEC-025/027/030/032/035) — scaffolding temporário sem identidade
 * visual (FASE 3 pós-SPECs), a ser substituído pelo Design System oficial
 * do Estúdio Elã sem alterar a lógica de navegação/sessão.
 * Com `?pagina=admin`: painel da equipe (moderação de identidades,
 * SPEC-035 §13.4, e atalhos para as telas operacionais já existentes).
 * @param {GoogleAppsScript.Events.DoGet} [e]
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.pagina === 'compilar-mes') {
    return HtmlService.createTemplateFromFile('src/ui/compilar-mes')
      .evaluate()
      .setTitle('TEAR — Compilar Mês');
  }
  if (e && e.parameter && e.parameter.pagina === 'briefing') {
    return HtmlService.createTemplateFromFile('src/ui/briefing')
      .evaluate()
      .setTitle('TEAR — Briefing');
  }
  if (e && e.parameter && e.parameter.pagina === 'entrega') {
    return HtmlService.createTemplateFromFile('src/ui/entrega')
      .evaluate()
      .setTitle('TEAR — Entregas');
  }
  if (e && e.parameter && e.parameter.pagina === 'envio') {
    return HtmlService.createTemplateFromFile('src/ui/envio')
      .evaluate()
      .setTitle('TEAR — Envios');
  }
  if (e && e.parameter && e.parameter.pagina === 'pagamentos') {
    return HtmlService.createTemplateFromFile('src/ui/pagamentos')
      .evaluate()
      .setTitle('TEAR — Pagamentos');
  }
  if (e && e.parameter && e.parameter.pagina === 'documentos') {
    return HtmlService.createTemplateFromFile('src/ui/documentos')
      .evaluate()
      .setTitle('TEAR — Documentos');
  }
  if (e && e.parameter && e.parameter.pagina === 'portal-login') {
    return HtmlService.createTemplateFromFile('src/ui/login')
      .evaluate()
      .setTitle('TEAR — Portal da Parceira — Login');
  }
  if (e && e.parameter && e.parameter.pagina === 'portal-pendencias') {
    return HtmlService.createTemplateFromFile('src/ui/pendencias')
      .evaluate()
      .setTitle('TEAR — Portal da Parceira — Pendências');
  }
  if (e && e.parameter && e.parameter.pagina === 'portal-perfil') {
    return HtmlService.createTemplateFromFile('src/ui/perfil')
      .evaluate()
      .setTitle('TEAR — Portal da Parceira — Perfil');
  }
  if (e && e.parameter && e.parameter.pagina === 'portal-dashboard') {
    return HtmlService.createTemplateFromFile('src/ui/dashboard')
      .evaluate()
      .setTitle('TEAR — Portal da Parceira — Início');
  }
  if (e && e.parameter && e.parameter.pagina === 'portal-financeiro') {
    return HtmlService.createTemplateFromFile('src/ui/financeiro')
      .evaluate()
      .setTitle('TEAR — Portal da Parceira — Financeiro e Histórico');
  }
  if (e && e.parameter && e.parameter.pagina === 'admin') {
    return HtmlService.createTemplateFromFile('src/ui/admin')
      .evaluate()
      .setTitle('TEAR — Painel da Equipe');
  }
  return HtmlService.createTemplateFromFile('src/ui/login')
    .evaluate()
    .setTitle('TEAR — Portal da Parceira — Login');
}

/**
 * Abre uma aba física da planilha do banco V2. O ID vive em Script
 * Properties (nunca hardcode) — fail-fast se planilha ou aba ausentes.
 * @param {string} nome nome da aba física.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function abrirAba(nome) {
  var planilha = SpreadsheetApp.openById(getConfig(CONFIG_KEYS.SPREADSHEET_ID));
  var aba = planilha.getSheetByName(nome);
  if (!aba) {
    throw new Error("Aba '" + nome + "' não encontrada na planilha configurada.");
  }
  return aba;
}

/**
 * Abre a aba física "BASE DE DADOS" do banco V2.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function abrirBaseDeDados() {
  return abrirAba('BASE DE DADOS');
}

/**
 * Abre a aba "BASE DE DADOS" da planilha LEGADA (SPEC-003 RN-01/INV-01,
 * SOMENTE LEITURA — `LegadoACL` não tem nenhum método de escrita). ID
 * próprio em Script Properties (`SPREADSHEET_ID_LEGADO`), nunca o mesmo de
 * `SPREADSHEET_ID` (DEPLOY_CHECKLIST §2).
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function abrirBaseDeDadosLegada() {
  var planilha = SpreadsheetApp.openById(getConfig(CONFIG_KEYS.SPREADSHEET_ID_LEGADO));
  var aba = planilha.getSheetByName('BASE DE DADOS');
  if (!aba) {
    throw new Error("Aba 'BASE DE DADOS' não encontrada na planilha legada configurada.");
  }
  return aba;
}

/**
 * Compõe o Controller de cadastro sobre a planilha informada.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {ParceiraController}
 */
function montarCadastroParceira(sheet) {
  var acl = new ParceiraACL(sheet);
  var repositorio = new ParceiraRepository(acl);
  var servico = new CadastrarParceiraService(repositorio);
  return new ParceiraController(servico);
}

/**
 * Função exposta a google.script.run: cadastra uma Parceira a partir do
 * formulário do Portal. Devolve SEMPRE o envelope padrão — falhas de
 * infraestrutura (config/planilha) também são convertidas em envelope de
 * falha para nunca vazar exceção crua ao cliente (§3.3).
 * @param {{nome: string}} dados dados do formulário.
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function cadastrarParceira(dados) {
  try {
    return montarCadastroParceira(abrirBaseDeDados()).cadastrar(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Compõe o Controller da Importação Inicial da Base (M1 adjacente,
 * SPEC-003). `LegadoACL` sobre a planilha legada (SOMENTE LEITURA,
 * RN-01/INV-01); `ParceiraACL` sobre a base nova cumpre a porta de
 * idempotência/escrita (`listarChaves`/`importarLote`, §6.3).
 * @returns {ImportacaoController}
 */
function montarImportacao() {
  var servico = new ImportadorService(
    new LegadoACL(abrirBaseDeDadosLegada()),
    new ParceiraACL(abrirBaseDeDados()),
    publicadorDeLog()
  );
  return new ImportacaoController(servico);
}

/**
 * Função exposta a google.script.run: executa a Importação Inicial da Base
 * (UC-003.01) — curadoria + normalização, idempotente por chave (RNF-03).
 * Devolve SEMPRE o envelope padrão (§3.3). Exige papel ADMINISTRADOR
 * (§13/IM-03 da SPEC-003) — fecha o gap registrado em `TASK_ROUTER.md`
 * (SPEC-003, "Dívida registrada, ainda aberta") pelo mesmo mecanismo já
 * aplicado às 15 rotas administrativas de SPEC-012/016/020/023/034
 * (`exigirPapelAdministrador`, §11).
 * @param {{token: string}} dados
 * @returns {{success: true, data: {totalImportado: number}}|{success: false, error: object}}
 */
function importarBaseLegada(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarImportacao().importarBase();
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Publicador de eventos mínimo: registra o fato em log SEM PII (RNF-08) —
 * barramento real para módulos vizinhos é dívida registrada (SPEC-005 D-01).
 * @returns {{publicar: function(object)}}
 */
function publicadorDeLog() {
  return {
    publicar: function (evento) {
      Logger.log('Evento de domínio: ' + evento.nome + ' (' + evento.mesReferencia + ')');
    },
  };
}

/**
 * Relógio do sistema — porta de tempo do M4 (SPEC-012 RN-04/RNF-03).
 * Único ponto autorizado a ler `new Date()` na composição.
 * @returns {{hoje: function(): Date}}
 */
function relogioDoSistema() {
  return {
    hoje: function () {
      return new Date();
    },
  };
}

/**
 * Adaptador de rastreio manual — porta de rastreio do M5 (SPEC-016 D-02).
 * Provedor/contrato real da transportadora é dívida registrada; até lá,
 * nunca indica entrega automaticamente (a atualização de status é sempre
 * degradável — RNF-01/CB-01 — e o registro de entrega segue manual).
 * @returns {{consultar: function(string): {entregue: boolean}}}
 */
function adaptadorDeRastreioManual() {
  return {
    consultar: function () {
      return { entregue: false };
    },
  };
}

/**
 * Compõe o EnvioService sobre as abas informadas (M5, SPEC-016). A
 * ParceiraACL cumpre a porta do Cadastro (obterContatoDeEnvio, D-03).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaBase aba BASE DE DADOS.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaColaboracoes aba COLABORACOES.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaEnvios aba ENVIOS.
 * @returns {EnvioService}
 */
function montarEnvioService(abaBase, abaColaboracoes, abaEnvios) {
  return new EnvioService(
    new ColaboracaoMensalRepository(new ColaboracaoMensalACL(abaColaboracoes)),
    new ParceiraACL(abaBase),
    new EnvioRepository(new EnvioACL(abaEnvios)),
    adaptadorDeRastreioManual(),
    publicadorDeLog(),
    relogioDoSistema()
  );
}

/**
 * Compõe o BriefingService sobre as abas informadas (M3, SPEC-009).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaColaboracoes aba COLABORACOES.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaBriefing aba BRIEFING.
 * @param {{publicar: function(object)}} [publicador] porta de eventos;
 *   default: log sem PII (dívida SPEC-005 D-01).
 * @returns {BriefingService}
 */
function montarBriefingService(abaColaboracoes, abaBriefing, publicador) {
  return new BriefingService(
    new ColaboracaoMensalRepository(new ColaboracaoMensalACL(abaColaboracoes)),
    new BriefingRepository(new BriefingACL(abaBriefing)),
    publicador || publicadorDeLog()
  );
}

/**
 * Compõe o EntregaService sobre as abas informadas (M4, SPEC-012).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaColaboracoes aba COLABORACOES.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaBriefing aba BRIEFING.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaEntregas aba ENTREGAS.
 * @returns {EntregaService}
 */
function montarEntregaService(abaColaboracoes, abaBriefing, abaEntregas) {
  return new EntregaService(
    new ColaboracaoMensalRepository(new ColaboracaoMensalACL(abaColaboracoes)),
    new BriefingRepository(new BriefingACL(abaBriefing)),
    new EntregaRepository(new EntregaACL(abaEntregas)),
    publicadorDeLog(),
    relogioDoSistema()
  );
}

/**
 * Compõe o PagamentoService sobre as abas informadas (M6, SPEC-020). A
 * ParceiraACL cumpre a porta do Cadastro (listarAtivasComCondicoes +
 * obterContatoDeEnvio, RNF-01); a EntregaRepository é injetada só-leitura
 * para o gate de elegibilidade de `liberar` (Q-04, PO 2026-07-17).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaBase aba BASE DE DADOS.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaEntregas aba ENTREGAS.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaPagamentos aba PAGAMENTOS.
 * @returns {PagamentoService}
 */
function montarPagamentoService(abaBase, abaEntregas, abaPagamentos) {
  return new PagamentoService(
    new ParceiraACL(abaBase),
    new EntregaRepository(new EntregaACL(abaEntregas)),
    new PagamentoRepository(new PagamentoACL(abaPagamentos)),
    geradorDeTokenUuid(),
    publicadorDeLog(),
    relogioDoSistema()
  );
}

/**
 * Compõe o Controller de compilação sobre as abas informadas (M2, SPEC-005).
 * A ParceiraACL cumpre a porta do Cadastro (listarAtivasComCondicoes).
 * O publicador reage a `MesCompilado` recriando os briefings da competência
 * (SPEC-009 RN-03), materializando as Entregas (SPEC-012 RN-01), os
 * Envios (SPEC-016 RN-01) e as Obrigações Financeiras mensais (SPEC-020
 * RN-01) — cablagem de consumo feita aqui, na composição, porque o
 * barramento real de eventos é dívida registrada (SPEC-005 D-01).
 * Devolve os 4 Services junto do Controller para a reconciliação idempotente
 * (achado F1, ver `compilarMes`) — sem isso, `CompiladorDoMes` (que não pode
 * conhecer Briefing/Entrega/Envio/Pagamento, §6.4) precisaria saber demais.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaBase aba BASE DE DADOS.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaColaboracoes aba COLABORACOES.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaBriefing aba BRIEFING.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaEntregas aba ENTREGAS.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaEnvios aba ENVIOS.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaPagamentos aba PAGAMENTOS.
 * @returns {{controller: ColaboracaoMensalController,
 *   briefingService: BriefingService, entregaService: EntregaService,
 *   envioService: EnvioService, pagamentoService: PagamentoService}}
 */
function montarCompilarMes(
  abaBase,
  abaColaboracoes,
  abaBriefing,
  abaEntregas,
  abaEnvios,
  abaPagamentos
) {
  var cadastro = new ParceiraACL(abaBase);
  var repositorio = new ColaboracaoMensalRepository(
    new ColaboracaoMensalACL(abaColaboracoes)
  );
  var briefingService = montarBriefingService(abaColaboracoes, abaBriefing);
  var entregaService = montarEntregaService(abaColaboracoes, abaBriefing, abaEntregas);
  var envioService = montarEnvioService(abaBase, abaColaboracoes, abaEnvios);
  var pagamentoService = montarPagamentoService(abaBase, abaEntregas, abaPagamentos);
  var log = publicadorDeLog();
  var publicador = {
    publicar: function (evento) {
      log.publicar(evento);
      if (evento.nome === 'MesCompilado') {
        briefingService.recriarParaCompetencia(String(evento.mesReferencia));
        entregaService.materializarParaCompetencia(String(evento.mesReferencia));
        envioService.materializarParaCompetencia(String(evento.mesReferencia));
        pagamentoService.materializarParaCompetencia(String(evento.mesReferencia));
      }
    },
  };
  var servico = new CompiladorDoMes(cadastro, repositorio, publicador);
  return {
    controller: new ColaboracaoMensalController(servico),
    briefingService: briefingService,
    entregaService: entregaService,
    envioService: envioService,
    pagamentoService: pagamentoService,
  };
}

/**
 * Função exposta a google.script.run: compila a Colaboração Mensal de uma
 * competência (UC-005.01). Devolve SEMPRE o envelope padrão — falhas de
 * infraestrutura também viram envelope de falha (§3.3).
 *
 * Reconciliação idempotente (achado F1 da auditoria SPEC-012,
 * `docs/_workspace/auditorias/AUDITORIA_SPEC012.md`): se a competência já
 * estava compilada, uma tentativa anterior pode ter persistido as
 * Colaborações mas falhado antes de materializar Briefing/Entrega/Envio —
 * sem reconciliação, a idempotência de `CompiladorDoMes` (RN-09/CB-01)
 * selaria esse estado parcial para sempre, sem caminho de reparo. Por isso,
 * quando `jaCompilada` é `true`, os 3 Services de materialização são
 * chamados de novo aqui — fora do evento `MesCompilado` (que só dispara na
 * primeira compilação, preservando CB-01 "nenhum efeito colateral" para o
 * comando em si) — e cada um só materializa quando a própria aba da
 * competência ainda está vazia (achado F2, guarda contra sobrescrever
 * uploads/aprovações/publicações já feitos), então isso nunca destrói o que
 * já existe.
 * @param {{mesReferencia: string}} dados dados do formulário ('AAAA-MM').
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function compilarMes(dados) {
  try {
    return comTravaDeAcesso(function () {
      var composicao = montarCompilarMes(
        abrirBaseDeDados(),
        abrirAba('COLABORACOES'),
        abrirAba('BRIEFING'),
        abrirAba('ENTREGAS'),
        abrirAba('ENVIOS'),
        abrirAba('PAGAMENTOS')
      );
      var resposta = composicao.controller.compilarMes(dados);
      if (resposta.success && resposta.data && resposta.data.jaCompilada) {
        composicao.briefingService.recriarParaCompetencia(resposta.data.mesReferencia);
        composicao.entregaService.materializarParaCompetencia(resposta.data.mesReferencia);
        composicao.envioService.materializarParaCompetencia(resposta.data.mesReferencia);
        composicao.pagamentoService.materializarParaCompetencia(resposta.data.mesReferencia);
      }
      return resposta;
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Compõe o Controller do Briefing (M3, SPEC-009). O publicador reage a
 * `BriefingPublicado` espelhando as datas de aprovação interna nas Entregas
 * da Parceira (SPEC-012 §14.1; SPEC-009 RN-04) — mesma cablagem de consumo
 * na composição (dívida SPEC-005 D-01).
 * @returns {BriefingController}
 */
function montarBriefing() {
  var abaColaboracoes = abrirAba('COLABORACOES');
  var abaBriefing = abrirAba('BRIEFING');
  var entregaService = montarEntregaService(
    abaColaboracoes,
    abaBriefing,
    abrirAba('ENTREGAS')
  );
  var log = publicadorDeLog();
  var publicador = {
    publicar: function (evento) {
      log.publicar(evento);
      if (evento.nome === 'BriefingPublicado') {
        entregaService.espelharAprovacoes(
          String(evento.mesReferencia),
          String(evento.parceiraId)
        );
      }
    },
  };
  return new BriefingController(
    montarBriefingService(abaColaboracoes, abaBriefing, publicador)
  );
}

/**
 * Função exposta a google.script.run: preenche e publica o Briefing de uma
 * Parceira na competência (UC-009.01). Devolve SEMPRE o envelope padrão —
 * falhas de infraestrutura também viram envelope de falha (§3.3).
 * @param {{mesReferencia: string, parceiraId: string, blocos: Array}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function preencherBriefing(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarBriefing().preencherBriefing(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: consulta o Briefing de uma Parceira
 * na competência (leitura para a UI; SPEC-027/023 consumirão a mesma query).
 * @param {{mesReferencia: string, parceiraId: string}} dados
 * @returns {{success: true, data: object|null}|{success: false, error: object}}
 */
function obterBriefing(dados) {
  try {
    return montarBriefing().obterBriefing(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Compõe o Controller da Entrega (M4, SPEC-012).
 * @returns {EntregaController}
 */
function montarEntrega() {
  return new EntregaController(
    montarEntregaService(
      abrirAba('COLABORACOES'),
      abrirAba('BRIEFING'),
      abrirAba('ENTREGAS')
    )
  );
}

/**
 * Função exposta a google.script.run: lista as Entregas da competência,
 * opcionalmente filtradas por Parceira (UC-012.01). Devolve SEMPRE o
 * envelope padrão — falhas de infraestrutura também viram envelope (§3.3).
 * @param {{mesReferencia: string, parceiraId: (string|undefined), token: string}} dados
 * @returns {{success: true, data: object[]}|{success: false, error: object}}
 */
function listarEntregas(dados) {
  try {
    exigirPapelAdministrador(dados);
    return montarEntrega().listarEntregas(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: envia o material de uma Entrega
 * (UC-012.02) — link do Drive, upload físico é dívida (SPEC-012 D-02).
 * Rota da tela interna de operação (`entrega.html`): a equipe registra
 * material recebido fora do Portal em nome da Parceira — por isso exige
 * papel ADMINISTRADOR (§11 do TASK_ROUTER), enquanto a Parceira usa a
 * fachada `enviarMaterialDoPortal` (isolada pela própria Sessão).
 * @param {{mesReferencia: string, parceiraId: string, rotulo: string,
 *          link: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function enviarMaterial(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarEntrega().enviarMaterial(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: aprova uma Entrega em revisão
 * (UC-012.03).
 * @param {{mesReferencia: string, parceiraId: string, rotulo: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function aprovarEntrega(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarEntrega().aprovarEntrega(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: publica uma Entrega aprovada,
 * arquivando com a data do relógio do sistema (UC-012.03; RN-04).
 * @param {{mesReferencia: string, parceiraId: string, rotulo: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function publicarEntrega(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarEntrega().publicarEntrega(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Compõe o Controller do Envio (M5, SPEC-016).
 * @returns {EnvioController}
 */
function montarEnvio() {
  return new EnvioController(
    montarEnvioService(abrirBaseDeDados(), abrirAba('COLABORACOES'), abrirAba('ENVIOS'))
  );
}

/**
 * Função exposta a google.script.run: confirma o endereço de um Envio e
 * devolve a mensagem de confirmação manual com endereço/PIX (UC-016.01,
 * D-03) — devolve SEMPRE o envelope padrão (§3.3).
 * @param {{mesReferencia: string, parceiraId: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function confirmarEndereco(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarEnvio().confirmarEndereco(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: registra o rastreio de um Envio,
 * preenchendo a data de envio automaticamente se vazia (UC-016.02; RN-02).
 * @param {{mesReferencia: string, parceiraId: string, codigo: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function registrarRastreio(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarEnvio().registrarRastreio(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: consulta o adaptador de rastreio e
 * arquiva o Envio se a transportadora indicar entrega (UC-016.03;
 * RNF-01/CB-01 — falha do adaptador é degradável).
 * @param {{mesReferencia: string, parceiraId: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function atualizarStatus(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarEnvio().atualizarStatus(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: lista os Envios da competência,
 * opcionalmente filtrados por Parceira (query do Portal).
 * @param {{mesReferencia: string, parceiraId: (string|undefined), token: string}} dados
 * @returns {{success: true, data: object[]}|{success: false, error: object}}
 */
function listarEnvios(dados) {
  try {
    exigirPapelAdministrador(dados);
    return montarEnvio().listarEnvios(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Compõe o Controller de Pagamentos (M6, SPEC-020).
 * @returns {PagamentoController}
 */
function montarPagamentos() {
  return new PagamentoController(
    montarPagamentoService(abrirBaseDeDados(), abrirAba('ENTREGAS'), abrirAba('PAGAMENTOS'))
  );
}

/**
 * Função exposta a google.script.run: lança uma Obrigação Financeira avulsa
 * (UC-020.02; RN-04/CB-01 — competência opcional).
 * @param {{parceiraId: string, valor: number, mesReferencia: (string|undefined), token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function lancarPagamentoAvulso(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarPagamentos().lancarAvulso(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: gera a mensagem de cobrança e libera
 * uma Obrigação Financeira (UC-020.03, 1ª parte) — Mensal exige conteúdo já
 * `Aprovado` na competência (Q-04, PG-05 se recusada).
 * @param {{id: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function liberarPagamento(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarPagamentos().liberar(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: confirma o pagamento de uma Obrigação
 * Financeira liberada, arquivando com a data do relógio do sistema
 * (UC-020.03, 2ª parte; RN-03).
 * @param {{id: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function confirmarPagamento(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarPagamentos().pagar(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: lista as Obrigações Financeiras da
 * competência, opcionalmente filtradas por Parceira.
 * @param {{mesReferencia: string, parceiraId: (string|undefined), token: string}} dados
 * @returns {{success: true, data: object[]}|{success: false, error: object}}
 */
function listarPagamentos(dados) {
  try {
    exigirPapelAdministrador(dados);
    return montarPagamentos().listarPagamentos(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Compõe o Controller da Geração de Documentos (M7, SPEC-023). A
 * ParceiraACL cumpre a porta do Cadastro (obterParaDocumentos, §14.1); o
 * BriefingRepository fornece o briefing da colaboração (SPEC-009 §14.1).
 * O GeradorDeDocumentosTexto cumpre a porta documental — motor real é
 * dívida registrada (SPEC-023 D-01, ADR futuro).
 * @returns {DocumentoController}
 */
function montarDocumentos() {
  var servico = new DocumentoService(
    new ParceiraACL(abrirBaseDeDados()),
    new BriefingRepository(new BriefingACL(abrirAba('BRIEFING'))),
    new DocumentoRepository(new DocumentoACL(abrirAba('DOCUMENTOS'))),
    new GeradorDeDocumentosTexto(),
    publicadorDeLog()
  );
  return new DocumentoController(servico);
}

/**
 * Função exposta a google.script.run: gera o Contrato individual de uma
 * Parceira Ativa (UC-023.01; RN-01). Devolve SEMPRE o envelope padrão —
 * falhas de infraestrutura também viram envelope de falha (§3.3).
 * @param {{parceiraId: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function gerarContrato(dados) {
  try {
    exigirPapelAdministrador(dados);
    return montarDocumentos().gerarContrato(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: gera o Briefing formal de uma
 * Parceira sinalizada na competência (UC-023.02; RN-02). Devolve SEMPRE o
 * envelope padrão (§3.3).
 * @param {{parceiraId: string, mesReferencia: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function gerarBriefingFormal(dados) {
  try {
    exigirPapelAdministrador(dados);
    return montarDocumentos().gerarBriefingFormal(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Gerador de token opaco — porta de token do M8 (SPEC-025 RNF-03).
 * Único ponto autorizado a chamar Utilities.getUuid() na composição.
 * @returns {{gerar: function(): string}}
 */
function geradorDeTokenUuid() {
  return {
    gerar: function () {
      return Utilities.getUuid();
    },
  };
}

/**
 * Publicador dos eventos de acesso (SPEC-025 §12): registra APENAS o nome
 * do evento — identificador, token e PII nunca vão a log (RN-04, Contrato
 * §5). Barramento real segue dívida registrada (SPEC-005 D-01).
 * @returns {{publicar: function(object)}}
 */
function publicadorDeAcesso() {
  return {
    publicar: function (evento) {
      Logger.log('Evento de domínio: ' + evento.nome);
    },
  };
}

/**
 * Compõe o AcessoPortalService (M8, SPEC-025). A verificação de credencial
 * fica atrás da porta do Autenticador: hoje, o adaptador legado RN-16
 * (cupom + 5 primeiros dígitos do CNPJ) — PROVISÓRIO (🟠 P5/Q-07); trocar o
 * modelo de autenticação = trocar só o adaptador aqui. Extraído à parte
 * (além de `montarAcesso`) porque o M8 (SPEC-027) também precisa resolver
 * Sessão → Parceira, sem depender do AcessoController.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} [abaBase] aba BASE DE DADOS já
 *   aberta pelo chamador; se omitida, abre-a aqui (default retrocompatível
 *   para quem só precisa deste service).
 * @returns {AcessoPortalService}
 */
function montarAcessoService(abaBase) {
  var verificador = new VerificadorDeCredencialLegado(
    new ParceiraACL(abaBase || abrirBaseDeDados())
  );
  return new AcessoPortalService(
    new Autenticador(verificador),
    new SessaoRepository(new SessaoACL(abrirAba('SESSOES'))),
    new BloqueioRepository(new BloqueioACL(abrirAba('BLOQUEIOS'))),
    geradorDeTokenUuid(),
    relogioDoSistema(),
    publicadorDeAcesso()
  );
}

/**
 * Compõe o Controller do Acesso ao Portal (M8, SPEC-025).
 * @returns {AcessoController}
 */
function montarAcesso() {
  return new AcessoController(montarAcessoService());
}

/**
 * Compõe o Controller de Arquivamento (M9, SPEC-034). Depende dos Services
 * de Entrega/Envio/Pagamento (reaproveitados, mesmo princípio de SPEC-030 —
 * nunca ACL/Repository alheios) e do Repository próprio da Colaboração
 * Mensal (o agregado que este módulo sela).
 * @returns {ArquivamentoController}
 */
function montarArquivamento() {
  var abaBase = abrirBaseDeDados();
  var abaColaboracoes = abrirAba('COLABORACOES');
  var abaEntregas = abrirAba('ENTREGAS');
  var colaboracaoMensalRepository = new ColaboracaoMensalRepository(
    new ColaboracaoMensalACL(abaColaboracoes)
  );
  var entregaService = montarEntregaService(abaColaboracoes, abrirAba('BRIEFING'), abaEntregas);
  var envioService = montarEnvioService(abaBase, abaColaboracoes, abrirAba('ENVIOS'));
  var pagamentoService = montarPagamentoService(abaBase, abaEntregas, abrirAba('PAGAMENTOS'));
  var servico = new ArquivamentoService(
    entregaService,
    envioService,
    pagamentoService,
    colaboracaoMensalRepository,
    publicadorDeLog()
  );
  return new ArquivamentoController(servico);
}

/**
 * Função exposta a google.script.run: sela uma competência (UC-034.02) —
 * RN-07 (elegibilidade, resolve D-01): recusa (AR-02) se a competência não
 * foi compilada ou tem pendência operacional em Entrega/Envio/Pagamento.
 * @param {{mesReferencia: string, token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function selarCompetencia(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarArquivamento().selarCompetencia(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: arquivamento manual em lote
 * (UC-034.01) — varre todas as competências ainda não seladas e sela as
 * elegíveis (RN-07); demais reportadas com o motivo, sem interromper o
 * lote (CB-03: nada elegível é no-op).
 * @param {{token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function arquivarLote(dados) {
  try {
    exigirPapelAdministrador(dados);
    return comTravaDeAcesso(function () {
      return montarArquivamento().arquivarLote();
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Executa uma operação sob trava global (LockService). Nasceu com o M8
 * (SPEC-025: regravação de SESSOES/BLOQUEIOS e contagem de tentativas,
 * RN-02) e foi estendida (achado F4 da auditoria SPEC-012,
 * `docs/_workspace/auditorias/AUDITORIA_SPEC012.md`) a toda função
 * administrativa que escreve numa aba física: as ACLs de escrita fazem
 * read-all→filter→rewrite da aba inteira, sem lock próprio — duas escritas
 * concorrentes (ex.: Parceira enviando material pelo Portal enquanto a
 * equipe aprova/publica) causariam lost update silencioso sem esta trava.
 * Único ponto autorizado a tocar LockService (camada entrypoint).
 * @param {function(): *} operacao
 * @returns {*} o resultado da operação.
 */
function comTravaDeAcesso(operacao) {
  var trava = LockService.getScriptLock();
  trava.waitLock(10000);
  try {
    return operacao();
  } finally {
    trava.releaseLock();
  }
}

/**
 * Função exposta a google.script.run: autentica a Parceira no Portal
 * (UC-025.01) — sucesso cria Sessão de 6h deslizante (RN-03); falhas
 * acumulam até bloqueio de 15 min (RN-02). Devolve SEMPRE o envelope
 * padrão (§3.3); erros carregam AC-01/AC-02 (§17).
 * @param {{identificador: string, segredo: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function entrarNoPortal(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarAcesso().entrar(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: renova a Sessão da Parceira a cada
 * interação (UC-025.02, expiração deslizante). Sessão inexistente/vencida
 * devolve AC-03 (§17) — reautenticar (CB-02).
 * @param {{token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function renovarSessaoDoPortal(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarAcesso().renovar(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: encerra a Sessão da Parceira
 * (logout — SPEC-025 §9). Idempotente.
 * @param {{token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function sairDoPortal(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarAcesso().sair(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Compõe o Controller do Conteúdo no Portal (M8, SPEC-027). Fachada sem
 * agregado próprio (§6.2/§6.4): reaproveita o AcessoPortalService (resolve
 * Sessão → Parceira), o EntregaService (consulta e delega o envio de
 * material à SPEC-012) e o BriefingService (lê o bloco correspondente,
 * SPEC-009).
 * @returns {PortalDeConteudoController}
 */
function montarPortalDeConteudo() {
  var abaColaboracoes = abrirAba('COLABORACOES');
  var abaBriefing = abrirAba('BRIEFING');
  var abaEntregas = abrirAba('ENTREGAS');
  var servico = new PortalDeConteudoService(
    montarAcessoService(),
    montarEntregaService(abaColaboracoes, abaBriefing, abaEntregas),
    montarBriefingService(abaColaboracoes, abaBriefing),
    relogioDoSistema()
  );
  return new PortalDeConteudoController(servico);
}

/**
 * Função exposta a google.script.run: lista as pendências de conteúdo da
 * Parceira autenticada na competência corrente (UC-027.01). O parceiraId
 * vem sempre da Sessão (token) — nunca do chamador (RN-01). Devolve SEMPRE
 * o envelope padrão (§3.3); erros do contrato carregam PC-01/02 (§17).
 * @param {{token: string}} dados
 * @returns {{success: true, data: object[]}|{success: false, error: object}}
 */
function verPendencias(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarPortalDeConteudo().verPendencias(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: lê o briefing do item correspondente
 * a uma Entrega da Parceira autenticada (UC-027.02).
 * @param {{token: string, rotulo: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function lerBriefingDoItem(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarPortalDeConteudo().lerBriefingDoItem(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: envia o material de uma Entrega da
 * Parceira autenticada (UC-027.03) — delega integralmente à SPEC-012
 * (estado → EmRevisao, RN-02).
 * @param {{token: string, rotulo: string, link: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function enviarMaterialDoPortal(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarPortalDeConteudo().enviarMaterialDoPortal(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Compõe o Controller do Perfil no Portal (M8, SPEC-032). Reaproveita o
 * AcessoPortalService (resolve Sessão → Parceira, SPEC-025) e a ParceiraACL
 * (novas portas obterPerfil/atualizarPerfil, SPEC-032) — sem agregado nem
 * aba física nova, mesma natureza de fachada da SPEC-027.
 * @returns {PerfilPortalController}
 */
function montarPerfilPortal() {
  var abaBase = abrirBaseDeDados();
  var servico = new PerfilPortalService(
    montarAcessoService(abaBase),
    new ParceiraACL(abaBase),
    new AdaptadorDeCepBrasilApi()
  );
  return new PerfilPortalController(servico);
}

/**
 * Função exposta a google.script.run: exibe o perfil (PIX, e-mail,
 * endereço) da Parceira autenticada (UC-032.01).
 * @param {{token: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function verPerfilDoPortal(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarPerfilPortal().verPerfil(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: edita PIX/e-mail/endereço da Parceira
 * autenticada (UC-032.02/03) — endereço recomposto por CEP (RN-01), falha
 * degradável (RN-02/CB-01); tentativa de editar campo não permitido é
 * recusada (PP-02/CB-02).
 * @param {{token: string, pix: (string|undefined), email: (string|undefined),
 *   cep: (string|undefined), numero: (string|undefined),
 *   complemento: (string|undefined)}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function editarPerfilDoPortal(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarPerfilPortal().editarPerfil(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Compõe o Controller do Financeiro/Histórico no Portal (M8, SPEC-030).
 * Fachada sem agregado próprio (§6.2/§6.4), mesma natureza de
 * PortalDeConteudoController/PerfilPortalController: reaproveita o
 * AcessoPortalService (resolve Sessão → Parceira, SPEC-025), o
 * EntregaService (histórico de conteúdo, SPEC-012) e o PagamentoService
 * (financeiro/histórico de pagamentos, SPEC-020) — sem ACL/Repository nem
 * aba física nova.
 * @returns {PortalFinanceiroController}
 */
function montarPortalFinanceiro() {
  var abaBase = abrirBaseDeDados();
  var abaColaboracoes = abrirAba('COLABORACOES');
  var abaBriefing = abrirAba('BRIEFING');
  var abaEntregas = abrirAba('ENTREGAS');
  var abaPagamentos = abrirAba('PAGAMENTOS');
  var servico = new PortalFinanceiroService(
    montarAcessoService(abaBase),
    montarEntregaService(abaColaboracoes, abaBriefing, abaEntregas),
    montarPagamentoService(abaBase, abaEntregas, abaPagamentos)
  );
  return new PortalFinanceiroController(servico);
}

/**
 * Função exposta a google.script.run: lista as competências (períodos)
 * selecionáveis pela Parceira autenticada (UC-030.03; RN-04/CB-01).
 * @param {{token: string}} dados
 * @returns {{success: true, data: string[]}|{success: false, error: object}}
 */
function listarPeriodosDoPortal(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarPortalFinanceiro().listarPeriodos(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: total previsto x pago do período
 * selecionado, da Parceira autenticada (UC-030.01; RN-02/CB-02).
 * @param {{token: string, mesReferencia: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function verFinanceiroDoPortal(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarPortalFinanceiro().verFinanceiro(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: histórico de conteúdo e pagamentos
 * arquivados do período selecionado, da Parceira autenticada (UC-030.02).
 * @param {{token: string, mesReferencia: string}} dados
 * @returns {{success: true, data: object[]}|{success: false, error: object}}
 */
function verHistoricoDoPortal(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarPortalFinanceiro().verHistorico(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Compõe o UsuarioService (M-ID, SPEC-035). Reaproveita integralmente a
 * stack de sessão de SPEC-025 (`Sessao`/`TokenDeSessao`/`SessaoRepository`/
 * `AcessoPortalService.renovar`) — nenhuma stack de sessão paralela (ver
 * SPEC-035 §9.2-A). `client_id` do provedor via `Config.js`
 * (`GOOGLE_CLIENT_ID`), provisionado pelo operador em Script Properties.
 * Escopo desta unidade de trabalho: papéis Administrador e Influenciadora
 * (Marca fora de escopo, SPEC-035 nota de revisão 2).
 * @returns {UsuarioService}
 */
/**
 * Guarda de RBAC (dívida Q-08 registrada em SPEC-012/020/023/025/034,
 * resolvida pelo modelo de papéis de SPEC-035 §8.3): exige sessão ACTIVE
 * com papel ADMINISTRADOR antes de liberar uma operação de equipe. Único
 * papel de equipe hoje — cobre também a coluna "Operador" das tabelas de
 * Papéis e Permissões dessas SPECs, que não existe como papel distinto no
 * modelo de identidade implementado (precedente "MVP operador único",
 * SPEC-025 §13). Reaproveita `UsuarioService.exigirPapel` — nenhuma lógica
 * de autorização duplicada.
 * @param {{token: string}} dados
 * @throws {Error} ERR_AUTH_INVALID_TOKEN | ERR_AUTH_UNAUTHORIZED_ROLE
 */
function exigirPapelAdministrador(dados) {
  montarUsuarioService().exigirPapel(dados && dados.token, 'ADMINISTRADOR');
}

function montarUsuarioService() {
  var abaBase = abrirBaseDeDados();
  return new UsuarioService(
    new ValidadorDeTokenGoogle(getConfig(CONFIG_KEYS.GOOGLE_CLIENT_ID)),
    new UsuarioRepository(new UsuarioACL(abrirAba('SIS_IDENTIDADES'))),
    new AdministradorACL(abrirAba('BASE_ADMINISTRADORES')),
    new ParceiraACL(abaBase),
    new SessaoRepository(new SessaoACL(abrirAba('SESSOES'))),
    montarAcessoService(abaBase),
    geradorDeTokenUuid(),
    relogioDoSistema(),
    publicadorDeAcesso(),
    // ADR-013: portas do Authorization Code Flow. Único ponto autorizado a
    // tocar ScriptApp (URL /exec do deployment em uso) e CacheService
    // (guarda anti-CSRF do state) — camada entrypoint.
    new AdaptadorOAuthGoogle(
      getConfig(CONFIG_KEYS.GOOGLE_CLIENT_ID),
      getConfig(CONFIG_KEYS.GOOGLE_CLIENT_SECRET),
      ScriptApp.getService().getUrl()
    ),
    new GuardiaoDeEstadoOAuth(CacheService.getScriptCache())
  );
}

/**
 * Compõe o Controller de Identidade e Acesso (M-ID, SPEC-035).
 * @returns {UsuarioController}
 */
function montarUsuario() {
  return new UsuarioController(montarUsuarioService());
}

/**
 * Função exposta a google.script.run: inicia o login federado (ADR-013) —
 * emite o state anti-CSRF e devolve a URL de autorização do Google para o
 * frontend navegar top-level (`window.top.location.href`). Sem trava: não
 * escreve em aba física.
 * @returns {{success: true, data: {urlDeAutorizacao: string}}|{success: false, error: object}}
 */
function iniciarLoginComGoogle() {
  try {
    return montarUsuario().iniciarLogin();
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: callback do Authorization Code Flow
 * (ADR-013; UC-035.01/02, §9.2). O frontend lê `code`/`state` da URL de
 * retorno do Google (`google.script.url.getLocation`) e chama aqui; o
 * backend valida/consome o state, troca o código por id_token e delega ao
 * fluxo de entrada existente. Devolve `AUTENTICADO` (com sessão),
 * `CANDIDATA_VINCULACAO` (§5.1-A) ou `ONBOARDING_REQUERIDO` — os dois
 * últimos com `idToken` para os fluxos de vinculação/onboarding.
 * @param {{code: string, state: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function entrarComCodigoOAuth(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarUsuario().entrarComCodigo(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: confirma a vinculação de identidade
 * federada a uma Parceira pré-existente (UC-035.02, §5.1-A) — nunca
 * automática (RN-02).
 * @param {{idToken: string, parceiraId: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function confirmarVinculacaoDeIdentidade(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarUsuario().confirmarVinculacao(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: completa o cadastro inicial de um
 * utilizador genuinamente novo (UC-035.03, §3.1.2/§5.3).
 * @param {{idToken: string, papel: string, dadosComplementares: object}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function completarCadastroDeUsuario(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarUsuario().completarCadastro(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: lista os cadastros pendentes de
 * aprovação (§13.4). Exclusivo do papel Administrador (RBAC).
 * @param {{token: string}} dados
 * @returns {{success: true, data: object[]}|{success: false, error: object}}
 */
function listarUsuariosPendentes(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarUsuario().listarPendentes(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: aprova um cadastro pendente
 * (UC-035.04, RN-04). Exclusivo do papel Administrador (RBAC).
 * @param {{token: string, subAlvo: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function aprovarUsuario(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarUsuario().aprovarUsuario(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: rejeita um cadastro pendente
 * (UC-035.04, RN-04). Exclusivo do papel Administrador (RBAC).
 * @param {{token: string, subAlvo: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function rejeitarUsuario(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarUsuario().rejeitarUsuario(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: suspende uma conta ACTIVE
 * (§3.1.3/§4.1/§7.2). Exclusivo do papel Administrador (RBAC).
 * @param {{token: string, subAlvo: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function inativarUsuario(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarUsuario().inativarUsuario(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: reativa uma conta INACTIVE (§7.2
 * "Reativação Operacional"). Exclusivo do papel Administrador (RBAC).
 * @param {{token: string, subAlvo: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function reativarUsuario(dados) {
  try {
    return comTravaDeAcesso(function () {
      return montarUsuario().reativarUsuario(dados);
    });
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    doGet,
    entrarNoPortal,
    renovarSessaoDoPortal,
    sairDoPortal,
    cadastrarParceira,
    importarBaseLegada,
    compilarMes,
    preencherBriefing,
    obterBriefing,
    listarEntregas,
    enviarMaterial,
    aprovarEntrega,
    publicarEntrega,
    confirmarEndereco,
    registrarRastreio,
    atualizarStatus,
    listarEnvios,
    lancarPagamentoAvulso,
    liberarPagamento,
    confirmarPagamento,
    listarPagamentos,
    gerarContrato,
    gerarBriefingFormal,
    verPendencias,
    lerBriefingDoItem,
    enviarMaterialDoPortal,
    verPerfilDoPortal,
    editarPerfilDoPortal,
    listarPeriodosDoPortal,
    verFinanceiroDoPortal,
    verHistoricoDoPortal,
    selarCompetencia,
    arquivarLote,
    iniciarLoginComGoogle,
    entrarComCodigoOAuth,
    confirmarVinculacaoDeIdentidade,
    completarCadastroDeUsuario,
    listarUsuariosPendentes,
    aprovarUsuario,
    rejeitarUsuario,
    inativarUsuario,
    reativarUsuario,
  };
}
