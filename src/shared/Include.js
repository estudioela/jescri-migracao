/**
 * Helper de composição de HTML Service (ADR-002 / PROJECT_GOVERNANCE §3.3).
 * Permite `<?!= include('caminho/arquivo') ?>` em templates.
 *
 * Camada: shared. Não conhece regra de negócio nem tokens de design;
 * apenas injeta o conteúdo de um arquivo HTML no template chamador.
 *
 * @param {string} filename nome do arquivo HTML (sem extensão) no projeto GAS.
 * @returns {string} conteúdo renderizado do arquivo.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { include };
}
