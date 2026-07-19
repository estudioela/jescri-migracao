const { loadGas } = require('./helpers/gasHarness');

function dominio() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
  ]);
}

function novaColaboracao(gas, sobrescritas) {
  const padrao = {
    parceiraId: 'maria-silva',
    mesReferencia: new gas.MesReferencia(2026, 7),
    snapshot: new gas.CondicaoComercialSnapshot({
      valorMensal: 3500,
      formatosContratados: ['Reels'],
      quantidadePorFormato: { Reels: 2 },
    }),
  };
  const args = Object.assign(padrao, sobrescritas || {});
  return new gas.ColaboracaoMensal(args.parceiraId, args.mesReferencia, args.snapshot);
}

describe('ColaboracaoMensal — nascimento (SPEC-005 §6.2/§9)', () => {
  test('nasce Ativa, sem estado Rascunho (compilação atômica)', () => {
    const gas = dominio();

    const colaboracao = novaColaboracao(gas);

    expect(colaboracao.estado).toBe('Ativa');
  });

  test('expõe identidade natural e Snapshot obrigatório', () => {
    const gas = dominio();

    const colaboracao = novaColaboracao(gas);

    expect(colaboracao.parceiraId).toBe('maria-silva');
    expect(colaboracao.mesReferencia.toString()).toBe('2026-07');
    expect(colaboracao.snapshot.valorMensal).toBe(3500);
  });

  test('exige parceiraId (RN-07)', () => {
    const gas = dominio();

    expect(() => novaColaboracao(gas, { parceiraId: '' })).toThrow(/parceira/i);
    expect(() => novaColaboracao(gas, { parceiraId: null })).toThrow(/parceira/i);
    expect(() => novaColaboracao(gas, { parceiraId: '   ' })).toThrow(/parceira/i);
  });

  test('exige MesReferencia como Value Object, não texto solto (CM-02)', () => {
    const gas = dominio();

    expect(() => novaColaboracao(gas, { mesReferencia: '2026-07' })).toThrow(/CM-02/);
    expect(() => novaColaboracao(gas, { mesReferencia: null })).toThrow(/CM-02/);
  });

  test('exige exatamente um Snapshot Comercial (INV-02 → CM-04)', () => {
    const gas = dominio();

    expect(() => novaColaboracao(gas, { snapshot: null })).toThrow(/CM-04/);
    expect(() => novaColaboracao(gas, { snapshot: { valorMensal: 1 } })).toThrow(/CM-04/);
  });
});

describe('ColaboracaoMensal — identidade (Parceira × MesReferencia, INV-01)', () => {
  test('duas colaborações com mesma parceira e mesma competência são a mesma', () => {
    const gas = dominio();

    const uma = novaColaboracao(gas);
    const outra = novaColaboracao(gas);

    expect(uma.igualA(outra)).toBe(true);
  });

  test('parceira ou competência diferente = colaboração diferente', () => {
    const gas = dominio();

    const referencia = novaColaboracao(gas);
    const outraParceira = novaColaboracao(gas, { parceiraId: 'ana-souza' });
    const outraCompetencia = novaColaboracao(gas, {
      mesReferencia: new gas.MesReferencia(2026, 8),
    });

    expect(referencia.igualA(outraParceira)).toBe(false);
    expect(referencia.igualA(outraCompetencia)).toBe(false);
  });

  test('igualA é falso para null e para objeto que não é ColaboracaoMensal', () => {
    const gas = dominio();
    const colaboracao = novaColaboracao(gas);

    expect(colaboracao.igualA(null)).toBe(false);
    expect(colaboracao.igualA(undefined)).toBe(false);
    expect(
      colaboracao.igualA({
        parceiraId: 'maria-silva',
        mesReferencia: new gas.MesReferencia(2026, 7),
      })
    ).toBe(false);
  });
});

describe('ColaboracaoMensal — Snapshot através do agregado (INV-02, INV-04)', () => {
  test('mutar o Snapshot através da colaboração não tem efeito (INV-04)', () => {
    const gas = dominio();
    const colaboracao = novaColaboracao(gas);

    colaboracao.snapshot.valorMensal = 1;

    expect(colaboracao.snapshot.valorMensal).toBe(3500);
  });

  test('o Snapshot permanece no agregado após todo o ciclo de vida (INV-02)', () => {
    const gas = dominio();
    const colaboracao = novaColaboracao(gas);

    colaboracao.concluir();
    colaboracao.arquivar();

    expect(colaboracao.snapshot.valorMensal).toBe(3500);
    expect(colaboracao.snapshot.formatosContratados).toEqual(['Reels']);
  });
});

describe('ColaboracaoMensal — máquina de estados (§9): Ativa → Concluída → Arquivada', () => {
  test('concluir leva Ativa a Concluída', () => {
    const gas = dominio();
    const colaboracao = novaColaboracao(gas);

    colaboracao.concluir();

    expect(colaboracao.estado).toBe('Concluída');
  });

  test('arquivar leva Concluída a Arquivada', () => {
    const gas = dominio();
    const colaboracao = novaColaboracao(gas);

    colaboracao.concluir();
    colaboracao.arquivar();

    expect(colaboracao.estado).toBe('Arquivada');
  });

  test('arquivar direto de Ativa é transição inválida (CM-06)', () => {
    const gas = dominio();
    const colaboracao = novaColaboracao(gas);

    expect(() => colaboracao.arquivar()).toThrow(/CM-06/);
    expect(colaboracao.estado).toBe('Ativa');
  });

  test('concluir duas vezes é transição inválida (CM-06)', () => {
    const gas = dominio();
    const colaboracao = novaColaboracao(gas);

    colaboracao.concluir();

    expect(() => colaboracao.concluir()).toThrow(/CM-06/);
  });

  test('Arquivada é terminal: qualquer transição é recusada (CM-06)', () => {
    const gas = dominio();
    const colaboracao = novaColaboracao(gas);
    colaboracao.concluir();
    colaboracao.arquivar();

    expect(() => colaboracao.concluir()).toThrow(/CM-06/);
    expect(() => colaboracao.arquivar()).toThrow(/CM-06/);
  });

  test('estado é sempre um dos canônicos fechados ao longo do ciclo completo', () => {
    const gas = dominio();
    const canonicos = ['Ativa', 'Concluída', 'Arquivada'];
    const colaboracao = novaColaboracao(gas);

    expect(canonicos).toContain(colaboracao.estado);
    colaboracao.concluir();
    expect(canonicos).toContain(colaboracao.estado);
    colaboracao.arquivar();
    expect(canonicos).toContain(colaboracao.estado);
  });

  test('Arquivada é imutável (RN-08): escrita direta não altera o agregado', () => {
    const gas = dominio();
    const colaboracao = novaColaboracao(gas);
    colaboracao.concluir();
    colaboracao.arquivar();

    colaboracao.estado = 'Ativa';
    colaboracao.parceiraId = 'outra';

    expect(colaboracao.estado).toBe('Arquivada');
    expect(colaboracao.parceiraId).toBe('maria-silva');
  });
});
