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
    // Defaults funcionais (ADR-013): a composição de identidade do Portal
    // (montarUsuarioService) toca ScriptApp/CacheService em TODA rota
    // guardada por RBAC — um fake default evita repetir infra idêntica em
    // cada smoke test. Testes que exercitam o fluxo OAuth de verdade podem
    // sobrescrever.
    ScriptApp: {
      getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/FAKE/exec' }),
    },
    CacheService: (() => {
      const dados = {};
      return {
        getScriptCache: () => ({
          put: (k, v) => {
            dados[k] = v;
          },
          get: (k) => (k in dados ? dados[k] : null),
          remove: (k) => {
            delete dados[k];
          },
        }),
      };
    })(),
  };
  return Object.assign(base, overrides || {});
}

/**
 * Arquivos de src/shared/ SEMPRE são carregados primeiro, na frente de
 * qualquer lista pedida pelo teste. Espelha o runtime real do Apps Script
 * (GAS concatena todo arquivo num único namespace global — não existe
 * "esquecer de importar" um utilitário de shared/ em produção) e evita que
 * cada teste precise listar manualmente todo novo módulo compartilhado
 * (ex.: src/shared/ColunaFisica.js, extraído das ACLs na FASE 1 pós-SPECs).
 * Arquivos puramente declarativos (funções/consts) — recarregar é inócuo.
 * @returns {string[]} caminhos relativos, a partir de src/shared/.
 */
function arquivosCompartilhados() {
  const dir = path.resolve(ROOT, 'src/shared');
  return fs
    .readdirSync(dir)
    .filter((nome) => nome.endsWith('.js'))
    .sort()
    .map((nome) => path.join('src/shared', nome));
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
  const compartilhados = arquivosCompartilhados();
  const restantes = files.filter((rel) => !compartilhados.includes(rel));
  for (const rel of compartilhados.concat(restantes)) {
    const abs = path.resolve(ROOT, rel);
    const code = fs.readFileSync(abs, 'utf8');
    vm.runInContext(code, sandbox, { filename: abs });
  }
  return sandbox;
}

module.exports = { loadGas, gasGlobals };
