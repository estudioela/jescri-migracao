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
