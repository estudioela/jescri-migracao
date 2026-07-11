/**
 * Carrega arquivo(s) do projeto Apps Script (mae/*.js) ou o <script> inline
 * de um arquivo HTML (mae/Index.html) e os executa num sandbox Node (vm),
 * sem duplicar lógica em outro lugar. As funções top-level ficam disponíveis
 * como propriedades do sandbox retornado.
 *
 * `sandbox` são os únicos globais que os arquivos precisam para o trecho
 * testado (ex.: { Utilities: {...} }) — cada teste injeta só o que usa, sem
 * uma biblioteca de mocks genérica.
 *
 * No Apps Script real, todos os arquivos do projeto compartilham o mesmo
 * escopo global (são concatenados num único namespace) — por isso
 * WebApp.js pode chamar getHeaderMap(), definida em Código.js, sem importar
 * nada. loadGasFiles() replica isso carregando vários arquivos no MESMO
 * contexto vm, na ordem dada.
 */
const fs = require('fs');
const vm = require('vm');

// Cada vm.createContext() tem sua própria classe Date/Array/etc. — sem
// compartilhar essas globais com o processo Node de fora, `instanceof Date`
// dentro do sandbox falha para qualquer Date criado no arquivo de teste.
const GLOBAIS_COMPARTILHADAS = { Date, Array, RegExp, Error, Promise, JSON, Math };

function lerFonteExecutavel(filePath) {
  let source = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.html')) {
    const match = /<script>([\s\S]*?)<\/script>/.exec(source);
    if (!match) throw new Error('Nenhum bloco <script> encontrado em ' + filePath);
    source = match[1];
  }
  return source;
}

/**
 * `exportarNomes` existe por causa de `const` e `class`.
 *
 * No vm (como em <script> no browser, e como no Apps Script), declarações
 * `const`/`let`/`class` de topo entram no escopo léxico global do contexto:
 * um arquivo enxerga o outro, mas elas NÃO viram propriedades do objeto
 * sandbox. `var` e `function` viram. Por isso mae/*.js (que usa var/function)
 * sempre saiu direto no sandbox, e tear/*.js (que usa const/class) não sai.
 *
 * Em vez de reescrever a V2 para acomodar o carregador de testes, copiamos os
 * nomes pedidos para o globalThis do próprio contexto, já carregado.
 */
function loadGasFiles(filePaths, sandbox, exportarNomes) {
  sandbox = sandbox || {};
  Object.keys(GLOBAIS_COMPARTILHADAS).forEach(function (chave) {
    if (!(chave in sandbox)) sandbox[chave] = GLOBAIS_COMPARTILHADAS[chave];
  });

  vm.createContext(sandbox);
  filePaths.forEach(function (filePath) {
    vm.runInContext(lerFonteExecutavel(filePath), sandbox, { filename: filePath });
  });

  if (exportarNomes && exportarNomes.length) {
    var atribuicoes = exportarNomes
      .map(function (nome) {
        return 'globalThis[' + JSON.stringify(nome) + '] = ' + nome + ';';
      })
      .join('\n');

    vm.runInContext(atribuicoes, sandbox, { filename: 'exportarNomes' });
  }

  return sandbox;
}

function loadGasModule(filePath, sandbox) {
  return loadGasFiles([filePath], sandbox);
}

module.exports = { loadGasModule, loadGasFiles };
