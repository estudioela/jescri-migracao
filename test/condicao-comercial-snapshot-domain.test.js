const { loadGas } = require('./helpers/gasHarness');

function novoVO() {
  const gas = loadGas(['src/modulos/Parceira.js']);
  return gas.CondicaoComercialSnapshot;
}

function condicoesValidas() {
  return {
    valorMensal: 3500,
    formatosContratados: ['Reels', 'Carrossel', 'Stories', 'Looks'],
    quantidadePorFormato: { Reels: 2, Carrossel: 1, Stories: 4, Looks: 3 },
  };
}

describe('CondicaoComercialSnapshot — cópia congelada (SPEC-005 §6.1, RN-04)', () => {
  test('copia exatamente valorMensal, formatosContratados e quantidadePorFormato', () => {
    const Snapshot = novoVO();

    const snapshot = new Snapshot(condicoesValidas());

    expect(snapshot.valorMensal).toBe(3500);
    expect(snapshot.formatosContratados).toEqual([
      'Reels',
      'Carrossel',
      'Stories',
      'Looks',
    ]);
    expect(snapshot.quantidadePorFormato).toEqual({
      Reels: 2,
      Carrossel: 1,
      Stories: 4,
      Looks: 3,
    });
  });

  test('é cópia do instante: mutar as condições de origem não retroage (RN-06)', () => {
    const Snapshot = novoVO();
    const origem = condicoesValidas();

    const snapshot = new Snapshot(origem);
    origem.valorMensal = 9999;
    origem.formatosContratados.push('Podcast');
    origem.quantidadePorFormato.Reels = 50;

    expect(snapshot.valorMensal).toBe(3500);
    expect(snapshot.formatosContratados).not.toContain('Podcast');
    expect(snapshot.quantidadePorFormato.Reels).toBe(2);
  });
});

describe('CondicaoComercialSnapshot — imutável após criação (RN-05, INV-04, CB-05)', () => {
  test('atribuições diretas não alteram o Snapshot', () => {
    const Snapshot = novoVO();
    const snapshot = new Snapshot(condicoesValidas());

    snapshot.valorMensal = 1;
    snapshot.formatosContratados = [];
    snapshot.quantidadePorFormato = {};

    expect(snapshot.valorMensal).toBe(3500);
    expect(snapshot.formatosContratados).toHaveLength(4);
    expect(snapshot.quantidadePorFormato.Stories).toBe(4);
  });

  test('estruturas internas também nascem congeladas (congelamento profundo)', () => {
    const Snapshot = novoVO();
    const snapshot = new Snapshot(condicoesValidas());

    expect(() => snapshot.formatosContratados.push('Podcast')).toThrow();
    snapshot.quantidadePorFormato.Reels = 50;

    expect(snapshot.formatosContratados).toHaveLength(4);
    expect(snapshot.quantidadePorFormato.Reels).toBe(2);
  });
});

describe('CondicaoComercialSnapshot — PII banida (RN-10, Contrato §5)', () => {
  test.each(['pix', 'chavePix', 'CHAVE_PIX', 'cnpj', 'endereco'])(
    "recusa fail-fast condições contendo campo PII '%s'",
    (campoPII) => {
      const Snapshot = novoVO();
      const condicoes = condicoesValidas();
      condicoes[campoPII] = 'dado-sensivel';

      expect(() => new Snapshot(condicoes)).toThrow(/CM-04.*RN-10/);
    }
  );

  test('snapshot válido não expõe nenhum campo além da projeção comercial', () => {
    const Snapshot = novoVO();

    const snapshot = new Snapshot(condicoesValidas());

    expect(Object.keys(snapshot).sort()).toEqual([
      'formatosContratados',
      'quantidadePorFormato',
      'valorMensal',
    ]);
  });
});

describe('CondicaoComercialSnapshot — consistência fail-fast (CM-04)', () => {
  test.each([
    ['valorMensal ausente', { valorMensal: undefined }],
    ['valorMensal não numérico', { valorMensal: 'R$ 3500' }],
    ['valorMensal negativo', { valorMensal: -1 }],
    ['formatosContratados não é lista', { formatosContratados: 'Reels' }],
    ['quantidadePorFormato ausente', { quantidadePorFormato: undefined }],
    ['quantidadePorFormato não é objeto', { quantidadePorFormato: 7 }],
  ])('recusa %s com CM-04', (_cenario, sobrescrita) => {
    const Snapshot = novoVO();
    const condicoes = Object.assign(condicoesValidas(), sobrescrita);

    expect(() => new Snapshot(condicoes)).toThrow(/CM-04/);
  });

  test('recusa ausência total de condições com CM-04', () => {
    const Snapshot = novoVO();

    expect(() => new Snapshot()).toThrow(/CM-04/);
    expect(() => new Snapshot(null)).toThrow(/CM-04/);
  });
});
