const { loadGas } = require('./helpers/gasHarness');

// ACL fake: prova que o repositório persiste SEMPRE via ACL (contrato),
// sem tocar a planilha diretamente.
function fakeAcl() {
  return { inseridas: [], inserir(parceira) { this.inseridas.push(parceira); } };
}

function novoRepo(acl) {
  const gas = loadGas([
    'src/modulos/Parceira.js',
  ]);
  return { gas, repo: new gas.ParceiraRepository(acl) };
}

describe('ParceiraRepository', () => {
  test('salvar() persiste a Parceira exclusivamente via ACL', () => {
    const acl = fakeAcl();
    const { gas, repo } = novoRepo(acl);
    const parceira = new gas.Parceira('Maria');

    repo.salvar(parceira);

    expect(acl.inseridas).toEqual([parceira]);
  });

  test('salvar() devolve a Parceira persistida', () => {
    const acl = fakeAcl();
    const { gas, repo } = novoRepo(acl);
    const parceira = new gas.Parceira('Maria');

    expect(repo.salvar(parceira)).toBe(parceira);
  });
});
