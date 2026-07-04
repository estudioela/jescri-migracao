/**
 * Rotas do portal — o que a influenciadora vê ao abrir o Web App.
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('portal-index')
    .evaluate()
    .setTitle('Portal Influenciadoras Jescri')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
