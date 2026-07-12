// Portal UI integration (Apps Script server-side helpers)
// abrirPortalModal reaproveita o mesmo shell único do portal (Index.html,
// servido em produção por WebApp.js/doGet) para pré-visualização em modal
// dentro da planilha. Não há doGet/include/includeAsJs aqui: esses nomes
// já existem em WebApp.js e uma segunda declaração no mesmo projeto Apps
// Script colidia de forma indefinida com a primeira.
function abrirPortalModal() {
  const html = HtmlService.createTemplateFromFile('Index').evaluate().setWidth(480).setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Portal de Apoio');
}
