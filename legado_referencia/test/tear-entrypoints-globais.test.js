/**
 * Trava da superfície `google.script.run`.
 *
 * `tear/app.html` não chama o backend por referência: chama por NOME, em
 * string (`runner[nomeFuncao].apply(...)`). Logo, um entrypoint renomeado,
 * movido para dentro de uma classe, ou envolvido num objeto/namespace:
 *
 *   - passa no Jest (nenhum teste importa aquele nome);
 *   - passa no `clasp push` sem erro nenhum;
 *   - quebra em PRODUÇÃO, no clique da parceira, como "função não encontrada".
 *
 * É o mesmo modo de falha do `.claspignore` (ver claspignore-allowlist.test.js),
 * e a mesma razão para a trava ser automática. No Apps Script todo arquivo
 * compartilha um único escopo global, então a função pode morar em QUALQUER
 * arquivo de tear/ — o que ela não pode é deixar de ser `function` de topo.
 *
 * Por isso este teste varre a árvore inteira em vez de fixar um arquivo:
 * mover `Api.js` para `entrypoints/Entrypoints.js` é reorganização legítima e
 * não deve derrubar a suíte. Encapsular `apiLogin` deve.
 */
const fs = require('fs');
const path = require('path');

const RAIZ_TEAR = path.join(__dirname, '..', 'tear');

/**
 * `adminDefinirSenha` não é chamada pelo front-end — é operação administrativa,
 * disparada do editor do Apps Script. Mas é global e invocável, e some do mesmo
 * jeito silencioso. Entra na trava à mão porque nenhum .html a menciona.
 */
const ENTRYPOINTS_SEM_FRONT = ['adminDefinirSenha'];

function arquivosJs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return arquivosJs(caminho);
    return entrada.name.endsWith('.js') ? [caminho] : [];
  });
}

/** `function nome(` na coluna 0. Um método de classe é indentado e não casa. */
function funcoesGlobaisDoProjeto() {
  const nomes = new Set();

  arquivosJs(RAIZ_TEAR).forEach((caminho) => {
    const fonte = fs.readFileSync(caminho, 'utf8');
    for (const [, nome] of fonte.matchAll(/^function\s+(\w+)\s*\(/gm)) {
      nomes.add(nome);
    }
  });

  return nomes;
}

/** Todo literal 'apiAlgumaCoisa' em qualquer .html de tear/ é uma chamada ao backend. */
function nomesChamadosPeloFront() {
  const nomes = new Set();

  fs.readdirSync(RAIZ_TEAR)
    .filter((nome) => nome.endsWith('.html'))
    .forEach((nome) => {
      const fonte = fs.readFileSync(path.join(RAIZ_TEAR, nome), 'utf8');
      for (const [, chamada] of fonte.matchAll(/'(api[A-Za-z]\w*)'/g)) {
        nomes.add(chamada);
      }
    });

  return nomes;
}

describe('entrypoints do google.script.run', () => {
  test('o front-end chama pelo menos os entrypoints conhecidos (a varredura funciona)', () => {
    // Sem esta âncora, um regex quebrado acharia zero nomes e o teste seguinte
    // passaria vazio, sem travar coisa nenhuma.
    expect(nomesChamadosPeloFront()).toEqual(
      new Set([
        'apiLogin',
        'apiSessaoAtual',
        'apiLogout',
        'apiListarCiclos',
        'apiListarAtivacoesDoCiclo',
        'apiListarPagamentosDoCiclo',
        'apiListarHistoricoDoCiclo',
        'apiBuscarParceira',
        'apiSalvarParceira',
        'apiListarCiclosAdmin',
        'apiGerarCicloMensal',
        'apiListarLogisticaDoCiclo',
        'apiAlterarStatusLogistica',
        'apiListarAtivacoesAdmin',
        'apiAlterarEstadoAtivacaoAdmin'
      ])
    );
  });

  test('todo nome chamado pelo front existe como function de topo em tear/', () => {
    const globais = funcoesGlobaisDoProjeto();
    const exigidos = [...nomesChamadosPeloFront(), ...ENTRYPOINTS_SEM_FRONT];

    expect(exigidos.filter((nome) => !globais.has(nome))).toEqual([]);
  });

  test('doGet e include continuam globais (sem eles o WebApp não serve HTML)', () => {
    const globais = funcoesGlobaisDoProjeto();

    expect(['doGet', 'include'].filter((nome) => !globais.has(nome))).toEqual([]);
  });
});
