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
 * (SPEC-009 RN-03) e materializando as Entregas (SPEC-012 RN-01) —
 * cablagem de consumo feita aqui, na composição, porque o barramento real
 * de eventos é dívida registrada (SPEC-005 D-01).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaBase aba BASE DE DADOS.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaColaboracoes aba COLABORACOES.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaBriefing aba BRIEFING.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} abaEntregas aba ENTREGAS.
 * @returns {ColaboracaoMensalController}
 */
function montarCompilarMes(abaBase, abaColaboracoes, abaBriefing, abaEntregas) {
  var cadastro = new ParceiraACL(abaBase);
  var repositorio = new ColaboracaoMensalRepository(
    new ColaboracaoMensalACL(abaColaboracoes)
  );
  var briefingService = montarBriefingService(abaColaboracoes, abaBriefing);
  var entregaService = montarEntregaService(abaColaboracoes, abaBriefing, abaEntregas);
  var log = publicadorDeLog();
  var publicador = {
    publicar: function (evento) {
      log.publicar(evento);
      if (evento.nome === 'MesCompilado') {
        briefingService.recriarParaCompetencia(String(evento.mesReferencia));
        entregaService.materializarParaCompetencia(String(evento.mesReferencia));
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
      abrirAba('ENTREGAS')
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    doGet,
    cadastrarParceira,
    compilarMes,
    preencherBriefing,
    obterBriefing,
    listarEntregas,
    enviarMaterial,
    aprovarEntrega,
    publicarEntrega,
  };
}
