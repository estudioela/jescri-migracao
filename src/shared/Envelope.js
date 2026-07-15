/**
 * Envelope de resposta padrão do contrato externo.
 * PROJECT_GOVERNANCE §3.3 — toda função exposta a `google.script.run`
 * retorna exatamente uma destas formas:
 *
 *   sucesso: { success: true,  data:  {...} }
 *   falha:   { success: false, error: {...} }
 *
 * Camada: shared (infraestrutura transversal). Sem regra de negócio,
 * sem acesso a Sheets/HTTP.
 */

/**
 * @param {*} [data] payload de sucesso; ausente vira objeto vazio.
 * @returns {{success: true, data: *}}
 */
function envelopeOk(data) {
  return { success: true, data: data === undefined ? {} : data };
}

/**
 * @param {*} [error] descrição do erro; ausente vira objeto vazio.
 * @returns {{success: false, error: *}}
 */
function envelopeFail(error) {
  return { success: false, error: error === undefined ? {} : error };
}

// Exportação condicional: no-op sob Apps Script (sem `module`),
// disponível para o harness de teste (Node/vm/jest).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { envelopeOk, envelopeFail };
}
