const { loadGas } = require('./helpers/gasHarness');

// Repositório fake: captura o que o service manda persistir.
function fakeRepo() {
  return {
    salvas: [],
    salvar(parceira) { this.salvas.push(parceira); return parceira; },
  };
}

function novoService(repo) {
  const gas = loadGas([
    'src/modulos/Parceira.js',
  ]);
  return { gas, service: new gas.CadastrarParceiraService(repo) };
}

describe('CadastrarParceiraService', () => {
  test('cadastra Parceira Inativa e persiste via repositório (RN-01)', () => {
    const repo = fakeRepo();
    const { service } = novoService(repo);

    const parceira = service.executar({ nome: 'Maria' });

    expect(parceira.nome).toBe('Maria');
    expect(parceira.estado).toBe('Inativa');
    expect(repo.salvas).toEqual([parceira]);
  });

  // SPEC-001 §11: o cadastro nunca ativa automaticamente, mesmo que o
  // formulário tente informar outro status.
  test('ignora status vindo do formulário — nasce sempre Inativa', () => {
    const repo = fakeRepo();
    const { service } = novoService(repo);

    const parceira = service.executar({ nome: 'Maria', estado: 'Ativa' });

    expect(parceira.estado).toBe('Inativa');
  });
});
