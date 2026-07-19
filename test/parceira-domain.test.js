const { loadGas } = require('./helpers/gasHarness');

function novaParceira(nome) {
  const gas = loadGas(['src/modulos/Parceira.js']);
  return new gas.Parceira(nome === undefined ? 'Maria' : nome);
}

describe('Entidade Parceira', () => {
  test('deve carregar a entidade Parceira', () => {
    const gas = loadGas(['src/modulos/Parceira.js']);

    expect(gas.Parceira).toBeDefined();
  });

  test('exige nome (identidade INFLU_KEY) — invariante fail-fast', () => {
    expect(() => novaParceira('')).toThrow();
    expect(() => novaParceira('   ')).toThrow();
  });

  // RN-01 (SPEC-001 §4 / SPEC-002 §9): toda Parceira nasce Inativa (OFF).
  // A ativação nunca é automática; é decisão manual da equipe.
  test('nasce Inativa — a ativação nunca é automática (RN-01)', () => {
    const parceira = novaParceira('Maria');

    expect(parceira.estado).toBe('Inativa');
    expect(parceira.estaAtiva()).toBe(false);
  });

  // Máquina de estados reversível (SPEC-002 §9); estados canônicos ADR-001 §2.1.
  test('ativar() promove Inativa → Ativa', () => {
    const parceira = novaParceira('Maria');

    parceira.ativar();

    expect(parceira.estado).toBe('Ativa');
    expect(parceira.estaAtiva()).toBe(true);
  });

  test('inativar() retorna Ativa → Inativa sem apagar identidade (INV-02)', () => {
    const parceira = novaParceira('Maria');
    parceira.ativar();

    parceira.inativar();

    expect(parceira.estado).toBe('Inativa');
    expect(parceira.nome).toBe('Maria');
  });
});
