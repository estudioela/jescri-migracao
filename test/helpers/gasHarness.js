/**
 * Harness de teste para código Google Apps Script (roadmap §2/§4).
 * GAS declara funções no escopo global e não tem `require`. Este harness
 * carrega um ou mais arquivos `.js` num contexto `vm` isolado, com os
 * globais do GAS mockáveis, e devolve o sandbox para asserção.
 *
 * Uso:
 *   const gas = loadGas(['src/shared/Envelope.js']);
 *   gas.envelopeOk({a:1});
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');

/**
 * Mocks mínimos dos serviços GAS. Cada teste pode sobrescrever o que precisar
 * passando `overrides`. Sprint 0: só o suficiente para a fundação.
 * @param {object} [overrides]
 */
function gasGlobals(overrides) {
  const base = {
    console,
    Logger: { log: () => {} },
    // Serviços comuns; testes que os exercitam devem prover o mock real.
    PropertiesService: undefined,
    SpreadsheetApp: undefined,
    HtmlService: undefined,
    UrlFetchApp: undefined,
    DriveApp: undefined,
  };
  return Object.assign(base, overrides || {});
}

/**
 * Carrega arquivos GAS num contexto vm compartilhado.
 * @param {string[]} files caminhos relativos à raiz do repo.
 * @param {object} [overrides] mocks de globais GAS.
 * @returns {object} o sandbox com as funções/vars globais declaradas.
 */
function loadGas(files, overrides) {
  const sandbox = gasGlobals(overrides);
  sandbox.module = undefined; // força o caminho "Apps Script" (sem module.exports)
  vm.createContext(sandbox);
  for (const rel of files) {
    const abs = path.resolve(ROOT, rel);
    const code = fs.readFileSync(abs, 'utf8');
    vm.runInContext(code, sandbox, { filename: abs });
  }
  return sandbox;
}

module.exports = { loadGas, gasGlobals };
