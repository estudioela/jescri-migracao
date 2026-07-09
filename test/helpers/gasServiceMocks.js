/**
 * Mocks simples dos serviços do Apps Script realmente usados pelos fluxos
 * testados (CacheService, LockService, SpreadsheetApp, Utilities, Logger).
 * Sem TTL real de cache, sem lock de verdade — só o suficiente para exercitar
 * a lógica de negócio. Criado sob demanda (fluxo de autenticação) e reusado
 * pelos incrementos seguintes, não construído como biblioteca especulativa.
 */

function criarCacheServiceFake() {
  const store = new Map();
  const cache = {
    get(key) { return store.has(key) ? store.get(key) : null; },
    put(key, value) { store.set(key, String(value)); },
    remove(key) { store.delete(key); }
  };
  return { getScriptCache: () => cache, _store: store };
}

function criarLockServiceFake() {
  return { getScriptLock: () => ({ waitLock() {}, tryLock() { return true; }, releaseLock() {} }) };
}

function criarUtilitiesFake() {
  let contador = 0;
  return {
    getUuid: () => 'uuid-teste-' + (++contador),
    formatDate(date, _tz, pattern) {
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      if (pattern && pattern.indexOf('HH:mm') !== -1) {
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${ano} ${hh}:${mm}`;
      }
      return `${dia}/${mes}/${ano}`;
    }
  };
}

// Por padrão é um no-op (comportamento histórico). Passar { registrarChamadas: true }
// faz `log(...)` empilhar os argumentos recebidos em `_chamadas`, pra um teste
// verificar que um catch silencioso passou a logar algo (ex.: onEdit/onFormSubmit).
function criarLoggerFake(opcoes) {
  opcoes = opcoes || {};
  const chamadas = [];
  return {
    log() {
      if (opcoes.registrarChamadas) chamadas.push(Array.prototype.slice.call(arguments));
    },
    _chamadas: chamadas
  };
}

/**
 * Fake de aba (Sheet) apoiado num array 2D mutável (linhas[0] = cabeçalho).
 * Cobre os métodos de leitura/escrita usados pelo projeto: getDataRange,
 * getLastRow, getLastColumn, getRange(...).getValue/getValues/setValue/setValues.
 */
function criarAbaFake(linhas) {
  return {
    getDataRange() { return { getValues: () => linhas.map((r) => r.slice()) }; },
    getLastRow() { return linhas.length; },
    getLastColumn() { return linhas.reduce((max, r) => Math.max(max, r.length), 0); },
    getRange(row, col, numRows, numCols) {
      numRows = numRows || 1;
      numCols = numCols || 1;
      return {
        getValue() { return (linhas[row - 1] || [])[col - 1]; },
        getValues() {
          const out = [];
          for (let r = 0; r < numRows; r++) {
            const linha = linhas[row - 1 + r] || [];
            out.push(linha.slice(col - 1, col - 1 + numCols));
          }
          return out;
        },
        setValue(v) {
          if (!linhas[row - 1]) linhas[row - 1] = [];
          linhas[row - 1][col - 1] = v;
        },
        setValues(vals) {
          vals.forEach((linhaVals, r) => {
            if (!linhas[row - 1 + r]) linhas[row - 1 + r] = [];
            linhaVals.forEach((v, c) => { linhas[row - 1 + r][col - 1 + c] = v; });
          });
        },
        sort() {},
        setBackgrounds() {},
        setBackground() {},
        setFontColor() {},
        setFontWeight() { return this; },
        clearContent() {
          for (let r = 0; r < numRows; r++) {
            if (linhas[row - 1 + r]) {
              for (let c = 0; c < numCols; c++) linhas[row - 1 + r][col - 1 + c] = '';
            }
          }
        }
      };
    },
    deleteRow(row) { linhas.splice(row - 1, 1); },
    deleteRows(row, howMany) { linhas.splice(row - 1, howMany); },
    appendRow(linha) { linhas.push(linha.slice()); },
    setFrozenRows() {},
    _linhas: linhas
  };
}

function criarSpreadsheetAppFake(abasPorNome) {
  // getName() é usado por detectarAbasHistoricoLegado() — anexado aqui a
  // partir da chave do mapa, em vez de exigir que cada teste passe o nome
  // duas vezes (uma no mapa, outra no fake).
  Object.keys(abasPorNome).forEach(function (nome) {
    const aba = abasPorNome[nome];
    if (aba && typeof aba.getName !== 'function') aba.getName = () => nome;
  });
  const ss = {
    getSheetByName(nome) { return abasPorNome[nome] || null; },
    getSheets() { return Object.values(abasPorNome); },
    insertSheet(nome) {
      const nova = criarAbaFake([]);
      nova.getName = () => nome;
      abasPorNome[nome] = nova;
      return nova;
    },
    toast() {}
  };
  return { getActiveSpreadsheet: () => ss, flush() {}, _ss: ss };
}

/**
 * Fake de DriveApp com uma árvore de pastas em memória. getFolderById(id)
 * só resolve pastas conhecidas (a raiz configurada + qualquer pasta criada
 * via createFolder durante o teste, auto-registrada) — imita a falha real
 * (exceção) do Drive quando um ID não existe mais.
 */
function criarDriveAppFake(pastaRaizId) {
  const porId = {};
  let contadorId = 0;

  function novaPasta() {
    const id = 'pasta-fake-' + (++contadorId);
    const subpastas = new Map();
    const pasta = {
      getId: () => id,
      getFoldersByName(nomeBuscado) {
        const encontrada = subpastas.get(nomeBuscado) || null;
        let consumida = false;
        return {
          hasNext: () => !consumida && !!encontrada,
          next: () => { consumida = true; return encontrada; }
        };
      },
      createFolder(nomeNovo) {
        const nova = novaPasta();
        subpastas.set(nomeNovo, nova);
        return nova;
      }
    };
    porId[id] = pasta;
    return pasta;
  }

  const pastaRaiz = novaPasta();
  porId[pastaRaizId] = pastaRaiz;

  const driveAppFake = {
    getFolderById(id) {
      const pasta = porId[id];
      if (!pasta) throw new Error('Pasta não encontrada: ' + id);
      return pasta;
    }
  };
  return { driveAppFake, pastaRaiz };
}

function criarRespostaHttpFake({ code = 200, headers = {}, corpo = '' }) {
  return {
    getResponseCode: () => code,
    getContentText: () => corpo,
    getHeaders: () => headers
  };
}

function criarUrlFetchAppFake(fabricaResposta) {
  return { fetch: fabricaResposta };
}

function criarPropertiesServiceFake(inicial) {
  const store = new Map(Object.entries(inicial || {}));
  const props = {
    getProperty(key) { return store.has(key) ? store.get(key) : null; },
    setProperty(key, value) { store.set(key, value); }
  };
  return { getScriptProperties: () => props, _store: store };
}

function criarScriptAppFake(token) {
  return { getOAuthToken: () => token || 'fake-oauth-token' };
}

module.exports = {
  criarCacheServiceFake,
  criarLockServiceFake,
  criarUtilitiesFake,
  criarLoggerFake,
  criarAbaFake,
  criarSpreadsheetAppFake,
  criarDriveAppFake,
  criarRespostaHttpFake,
  criarUrlFetchAppFake,
  criarPropertiesServiceFake,
  criarScriptAppFake
};
