/**
 * Acesso a segredos/IDs de ambiente — nunca hardcode no código
 * (roadmap §4 "Ambiente"; PROJECT_GOVERNANCE §3.5/§3.6).
 *
 * Valores vivem em Script Properties (Projeto GAS → Configurações),
 * provisionadas pelo operador. O repositório carrega apenas as CHAVES,
 * jamais os valores.
 *
 * Camada: shared. Fail-fast: chave ausente é erro barulhento.
 */

/** Chaves conhecidas de configuração (documentação executável). */
var CONFIG_KEYS = {
  // ID da planilha nova `portal-ela` (banco V2, Q-10). Provisionado pelo operador.
  SPREADSHEET_ID: 'SPREADSHEET_ID',
};

/**
 * @param {string} key uma das chaves de CONFIG_KEYS.
 * @returns {string} valor da propriedade.
 * @throws se a chave não estiver provisionada (fail-fast).
 */
function getConfig(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (value === null || value === undefined || value === '') {
    throw new Error('Config ausente: "' + key + '". Provisionar em Script Properties.');
  }
  return value;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG_KEYS, getConfig };
}
