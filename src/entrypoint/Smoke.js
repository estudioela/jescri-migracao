/**
 * Endpoint de FUMAÇA do Sprint 0 (roadmap §4 — validações de saída).
 * Prova, ponta a ponta, que o envelope e o `include()` funcionam sob
 * HTML Service. NÃO é feature de negócio; existe só para validar a
 * fundação e deve ser removido/substituído quando o primeiro Vertical
 * Slice (M1) entrar.
 *
 * Camada: entrypoint (doGet/doPost/onFormSubmit/menu).
 */

/**
 * Renderiza a página de fumaça, exercitando o helper `include()`.
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet() {
  return HtmlService.createTemplateFromFile('src/ui/smoke')
    .evaluate()
    .setTitle('TEAR V2 — Smoke');
}

/**
 * Função de fumaça exposta a `google.script.run`: retorna um envelope
 * de sucesso bem-formado. Prova o contrato §3.3 sem tocar em Sheets.
 * @returns {{success: true, data: {ping: string}}}
 */
function smokePing() {
  return envelopeOk({ ping: 'pong' });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { doGet, smokePing };
}
