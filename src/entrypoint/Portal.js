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
 * Renderiza o Portal de cadastro de Parceira.
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet() {
  return HtmlService.createTemplateFromFile('src/ui/cadastro-parceira')
    .evaluate()
    .setTitle('TEAR — Cadastro de Parceira');
}

/**
 * Abre a planilha física "BASE DE DADOS" do banco V2. O ID vive em Script
 * Properties (nunca hardcode) — fail-fast se ausente.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function abrirBaseDeDados() {
  var planilha = SpreadsheetApp.openById(getConfig(CONFIG_KEYS.SPREADSHEET_ID));
  var aba = planilha.getSheetByName('BASE DE DADOS');
  if (!aba) {
    throw new Error("Aba 'BASE DE DADOS' não encontrada na planilha configurada.");
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { doGet, cadastrarParceira };
}
