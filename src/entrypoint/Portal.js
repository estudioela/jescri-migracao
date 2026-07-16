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
 * Renderiza o Portal. Sem parâmetro: cadastro de Parceira (M1).
 * Com `?pagina=compilar-mes`: compilação da Colaboração Mensal (M2).
 * Com `?pagina=briefing`: Briefing da Colaboração (M3).
 * Com `?pagina=entrega`/`envio`: telas internas de operação (M4/M5).
 * Com `?pagina=portal-login`/`portal-pendencias`/`portal-perfil`: Portal da
 * Parceira (M8, SPEC-025/027/032) — scaffolding temporário sem identidade
 * visual (FASE 3 pós-SPECs), a ser substituído pelo Design System oficial
 * do Estúdio Elã sem alterar a lógica de navegação/sessão.
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
  return HtmlService.createTemplateFromFile('src/ui/cadastro-parceira')
    .evaluate()
    .setTitle('TEAR — Cadastro de Parceira');
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
 * Compõe o Controller de compilação sobre as abas informadas (M2, SPEC-005).
 * A ParceiraACL cumpre a porta do Cadastro (listarAtivasComCondicoes).
 * O publicador reage a `MesCompilado` recriando os briefings da competência
 * (SPEC-009 RN-03), materializando as Entregas (SPEC-012 RN-01) e os
 * Envios (SPEC-016 RN-01) — cablagem de consumo feita aqui, na composição,
 * porque o barramento real de eventos é dívida registrada (SPEC-005 D-01).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaBase aba BASE DE DADOS.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaColaboracoes aba COLABORACOES.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaBriefing aba BRIEFING.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaEntregas aba ENTREGAS.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaEnvios aba ENVIOS.
 * @returns {ColaboracaoMensalController}
 */
function montarCompilarMes(abaBase, abaColaboracoes, abaBriefing, abaEntregas, abaEnvios) {
  var cadastro = new ParceiraACL(abaBase);
  var repositorio = new ColaboracaoMensalRepository(
    new ColaboracaoMensalACL(abaColaboracoes)
  );
  var briefingService = montarBriefingService(abaColaboracoes, abaBriefing);
  var entregaService = montarEntregaService(abaColaboracoes, abaBriefing, abaEntregas);
  var envioService = montarEnvioService(abaBase, abaColaboracoes, abaEnvios);
  var log = publicadorDeLog();
  var publicador = {
    publicar: function (evento) {
      log.publicar(evento);
      if (evento.nome === 'MesCompilado') {
        briefingService.recriarParaCompetencia(String(evento.mesReferencia));
        entregaService.materializarParaCompetencia(String(evento.mesReferencia));
        envioService.materializarParaCompetencia(String(evento.mesReferencia));
      }
    },
  };
  var servico = new CompiladorDoMes(cadastro, repositorio, publicador);
  return new ColaboracaoMensalController(servico);
}

/**
 * Função exposta a google.script.run: compila a Colaboração Mensal de uma
 * competência (UC-005.01). Devolve SEMPRE o envelope padrão — falhas de
 * infraestrutura também viram envelope de falha (§3.3).
 * @param {{mesReferencia: string}} dados dados do formulário ('AAAA-MM').
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function compilarMes(dados) {
  try {
    return montarCompilarMes(
      abrirBaseDeDados(),
      abrirAba('COLABORACOES'),
      abrirAba('BRIEFING'),
      abrirAba('ENTREGAS'),
      abrirAba('ENVIOS')
    ).compilarMes(dados);
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
    return montarBriefing().preencherBriefing(dados);
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
 * @param {{mesReferencia: string, parceiraId: (string|undefined)}} dados
 * @returns {{success: true, data: object[]}|{success: false, error: object}}
 */
function listarEntregas(dados) {
  try {
    return montarEntrega().listarEntregas(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: envia o material de uma Entrega
 * (UC-012.02) — link do Drive, upload físico é dívida (SPEC-012 D-02).
 * @param {{mesReferencia: string, parceiraId: string, rotulo: string,
 *          link: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function enviarMaterial(dados) {
  try {
    return montarEntrega().enviarMaterial(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: aprova uma Entrega em revisão
 * (UC-012.03).
 * @param {{mesReferencia: string, parceiraId: string, rotulo: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function aprovarEntrega(dados) {
  try {
    return montarEntrega().aprovarEntrega(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: publica uma Entrega aprovada,
 * arquivando com a data do relógio do sistema (UC-012.03; RN-04).
 * @param {{mesReferencia: string, parceiraId: string, rotulo: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function publicarEntrega(dados) {
  try {
    return montarEntrega().publicarEntrega(dados);
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
 * @param {{mesReferencia: string, parceiraId: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function confirmarEndereco(dados) {
  try {
    return montarEnvio().confirmarEndereco(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: registra o rastreio de um Envio,
 * preenchendo a data de envio automaticamente se vazia (UC-016.02; RN-02).
 * @param {{mesReferencia: string, parceiraId: string, codigo: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function registrarRastreio(dados) {
  try {
    return montarEnvio().registrarRastreio(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: consulta o adaptador de rastreio e
 * arquiva o Envio se a transportadora indicar entrega (UC-016.03;
 * RNF-01/CB-01 — falha do adaptador é degradável).
 * @param {{mesReferencia: string, parceiraId: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function atualizarStatus(dados) {
  try {
    return montarEnvio().atualizarStatus(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: lista os Envios da competência,
 * opcionalmente filtrados por Parceira (query do Portal).
 * @param {{mesReferencia: string, parceiraId: (string|undefined)}} dados
 * @returns {{success: true, data: object[]}|{success: false, error: object}}
 */
function listarEnvios(dados) {
  try {
    return montarEnvio().listarEnvios(dados);
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
 * @param {{parceiraId: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function gerarContrato(dados) {
  try {
    return montarDocumentos().gerarContrato(dados);
  } catch (erro) {
    return envelopeFail({ mensagem: erro.message });
  }
}

/**
 * Função exposta a google.script.run: gera o Briefing formal de uma
 * Parceira sinalizada na competência (UC-023.02; RN-02). Devolve SEMPRE o
 * envelope padrão (§3.3).
 * @param {{parceiraId: string, mesReferencia: string}} dados
 * @returns {{success: true, data: object}|{success: false, error: object}}
 */
function gerarBriefingFormal(dados) {
  try {
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
 * @returns {AcessoPortalService}
 */
function montarAcessoService() {
  var verificador = new VerificadorDeCredencialLegado(
    new ParceiraACL(abrirBaseDeDados())
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
 * Executa uma operação de acesso sob trava global (LockService). O M8 é a
 * primeira superfície multiusuária do sistema: a regravação das abas
 * SESSOES/BLOQUEIOS e a contagem de tentativas (RN-02) exigem exclusão
 * mútua — sem trava, requisições concorrentes se sobrescrevem e o limite
 * de 5 falhas seria contornável em paralelo. Único ponto autorizado a
 * tocar LockService (camada entrypoint).
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
  var servico = new PerfilPortalService(
    montarAcessoService(),
    new ParceiraACL(abrirBaseDeDados()),
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    doGet,
    entrarNoPortal,
    renovarSessaoDoPortal,
    sairDoPortal,
    cadastrarParceira,
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
    gerarContrato,
    gerarBriefingFormal,
    verPendencias,
    lerBriefingDoItem,
    enviarMaterialDoPortal,
    verPerfilDoPortal,
    editarPerfilDoPortal,
  };
}
