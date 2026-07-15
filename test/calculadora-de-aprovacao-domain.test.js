const { loadGas } = require('./helpers/gasHarness');

function dominio() {
  return loadGas(['src/domain/CalculadoraDeAprovacao.js']);
}

function iso(data) {
  const mes = data.getMonth() + 1;
  const dia = data.getDate();
  return (
    data.getFullYear() +
    '-' +
    (mes < 10 ? '0' + mes : mes) +
    '-' +
    (dia < 10 ? '0' + dia : dia)
  );
}

describe('CalculadoraDeAprovacao — RN-01 (SPEC-009 §10, DoD §19: 4 bordas de dia)', () => {
  test('postagem em dia útil: aprovação = postagem − 7', () => {
    const gas = dominio();

    // 2026-07-22 é quarta; −7 = 2026-07-15, também quarta.
    const aprovacao = gas.CalculadoraDeAprovacao.calcular(new Date(2026, 6, 22));

    expect(iso(aprovacao)).toBe('2026-07-15');
    expect(aprovacao.getDay()).toBe(3);
  });

  test('aprovação caindo em sexta ajusta +3 (segunda)', () => {
    const gas = dominio();

    // 2026-07-24 é sexta; −7 = 2026-07-17 (sexta) → +3 = 2026-07-20 (segunda).
    const aprovacao = gas.CalculadoraDeAprovacao.calcular(new Date(2026, 6, 24));

    expect(iso(aprovacao)).toBe('2026-07-20');
    expect(aprovacao.getDay()).toBe(1);
  });

  test('aprovação caindo em sábado ajusta +2 (segunda)', () => {
    const gas = dominio();

    // 2026-07-25 é sábado; −7 = 2026-07-18 (sábado) → +2 = 2026-07-20 (segunda).
    const aprovacao = gas.CalculadoraDeAprovacao.calcular(new Date(2026, 6, 25));

    expect(iso(aprovacao)).toBe('2026-07-20');
    expect(aprovacao.getDay()).toBe(1);
  });

  test('aprovação caindo em domingo ajusta +1 (segunda)', () => {
    const gas = dominio();

    // 2026-07-26 é domingo; −7 = 2026-07-19 (domingo) → +1 = 2026-07-20 (segunda).
    const aprovacao = gas.CalculadoraDeAprovacao.calcular(new Date(2026, 6, 26));

    expect(iso(aprovacao)).toBe('2026-07-20');
    expect(aprovacao.getDay()).toBe(1);
  });

  test('data de postagem inválida falha fail-fast com BR-02', () => {
    const gas = dominio();

    expect(() => gas.CalculadoraDeAprovacao.calcular(null)).toThrow(/BR-02/);
    expect(() => gas.CalculadoraDeAprovacao.calcular('2026-07-22')).toThrow(/BR-02/);
    expect(() => gas.CalculadoraDeAprovacao.calcular(new Date('lixo'))).toThrow(/BR-02/);
  });
});
