const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas(['src/modulos/ColaboracaoMensal.js', 'src/modulos/Financeiro.js']);
}

describe('ObrigacaoFinanceira — máquina de estados (SPEC-020 §9)', () => {
  test('nasce EmAberto; liberar → Aprovado; pagar → Pago (terminal, arquiva)', () => {
    const gas = carregar();
    const mes = gas.MesReferencia.deTexto('2026-07');
    const obrigacao = new gas.ObrigacaoFinanceira('o1', 'Maria', 'Mensal', mes, 3500);

    expect(obrigacao.estado).toBe('EmAberto');

    obrigacao.liberar();
    expect(obrigacao.estado).toBe('Aprovado');

    const data = new Date('2026-07-20');
    obrigacao.pagar(data);
    expect(obrigacao.estado).toBe('Pago');
    expect(obrigacao.dataArquivamento).toBe(data);
    expect(obrigacao.estaPaga()).toBe(true);
    expect(Object.isFrozen(obrigacao)).toBe(true);
  });

  test('transição inválida falha barulhento (PG-03) — pagar antes de liberar', () => {
    const gas = carregar();
    const obrigacao = new gas.ObrigacaoFinanceira('o1', 'Maria', 'Avulso', null, 500);

    expect(() => obrigacao.pagar(new Date())).toThrow(/PG-03/);
  });

  test('já paga recusa nova transição (CB-02)', () => {
    const gas = carregar();
    const obrigacao = new gas.ObrigacaoFinanceira('o1', 'Maria', 'Avulso', null, 500);
    obrigacao.liberar().pagar(new Date());

    expect(() => obrigacao.pagar(new Date())).toThrow(/PG-03/);
  });

  test('Obrigação Mensal exige competência (RN-01)', () => {
    const gas = carregar();
    expect(() => new gas.ObrigacaoFinanceira('o1', 'Maria', 'Mensal', null, 500)).toThrow(
      /RN-01/
    );
  });

  test('Obrigação Avulso pode não ter competência (CB-01)', () => {
    const gas = carregar();
    expect(
      () => new gas.ObrigacaoFinanceira('o1', 'Maria', 'Avulso', null, 500)
    ).not.toThrow();
  });
});
