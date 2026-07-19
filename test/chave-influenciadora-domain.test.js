const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas(['src/modulos/Parceira.js']);
}

describe('ChaveInfluenciadora — normalização (SPEC-003 §6.1, D-02c)', () => {
  test('trim + colapso de espaços preserva a grafia; normalizada() é case-insensitive', () => {
    const gas = carregar();
    const chave = new gas.ChaveInfluenciadora('  Maria   Silva ');

    expect(chave.toString()).toBe('Maria Silva');
    expect(chave.normalizada()).toBe('maria silva');
    expect(new gas.ChaveInfluenciadora('MARIA SILVA').normalizada()).toBe(chave.normalizada());
  });

  test('chave vazia/ausente falha barulhento (IM-02)', () => {
    const gas = carregar();
    expect(() => new gas.ChaveInfluenciadora('   ')).toThrow(/IM-02/);
    expect(() => new gas.ChaveInfluenciadora(null)).toThrow(/IM-02/);
  });
});
