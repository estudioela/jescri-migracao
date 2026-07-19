const { loadGas } = require('./helpers/gasHarness');

function dominio() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
    'src/modulos/Briefing.js',
  ]);
}

function snapshotPadrao(gas, sobrescritas) {
  const padrao = {
    valorMensal: 3500,
    formatosContratados: ['Reels', 'Carrossel', 'Stories'],
    quantidadePorFormato: { Reels: 1, Carrossel: 1, Stories: 2 },
  };
  return new gas.CondicaoComercialSnapshot(Object.assign(padrao, sobrescritas || {}));
}

function rascunhoPadrao(gas) {
  return gas.Briefing.criarRascunho(
    'maria-silva',
    new gas.MesReferencia(2026, 7),
    snapshotPadrao(gas)
  );
}

const dadosDeBloco = {
  look: 'Look 12 — vestido linho',
  dataEntrega: new Date(2026, 6, 10),
  dataPostagem: new Date(2026, 6, 22),
  orientacao: 'Luz natural, tom leve.',
};

describe('Briefing — nascimento do rascunho (SPEC-009 §9, RN-02/INV-02)', () => {
  test('deriva um bloco por unidade contratada; contrato padrão gera os 4 blocos da SPEC', () => {
    const gas = dominio();

    const briefing = rascunhoPadrao(gas);

    expect(briefing.estado).toBe('Rascunho');
    expect(briefing.blocos.map((b) => b.rotulo)).toEqual([
      'Reels',
      'Carrossel',
      'Stories 1',
      'Stories 2',
    ]);
  });

  test('CB-03: Parceira sem formato contratado → nenhum bloco criado', () => {
    const gas = dominio();

    const briefing = gas.Briefing.criarRascunho(
      'maria-silva',
      new gas.MesReferencia(2026, 7),
      snapshotPadrao(gas, { formatosContratados: [], quantidadePorFormato: {} })
    );

    expect(briefing.blocos).toEqual([]);
  });

  test('exige identidade completa (INV-01) e Snapshot para derivar blocos (INV-02)', () => {
    const gas = dominio();
    const mes = new gas.MesReferencia(2026, 7);

    expect(() => gas.Briefing.criarRascunho('', mes, snapshotPadrao(gas))).toThrow(/parceira/i);
    expect(() => gas.Briefing.criarRascunho('maria', '2026-07', snapshotPadrao(gas))).toThrow(
      /MesReferencia/
    );
    expect(() => gas.Briefing.criarRascunho('maria', mes, null)).toThrow(/INV-02/);
  });
});

describe('Briefing — preenchimento (UC-009.01, INV-03)', () => {
  test('preencher bloco deriva a data de aprovação interna via RN-01', () => {
    const gas = dominio();
    const briefing = rascunhoPadrao(gas);

    const bloco = briefing.preencherBloco('Reels', dadosDeBloco);

    expect(bloco.estaPreenchido()).toBe(true);
    // Postagem 2026-07-22 (quarta) → aprovação 2026-07-15 (INV-03: derivada).
    expect(bloco.dataAprovacaoInterna.getDate()).toBe(15);
    expect(bloco.look).toBe('Look 12 — vestido linho');
  });

  test('INV-02: preencher bloco fora dos formatos contratados falha', () => {
    const gas = dominio();
    const briefing = rascunhoPadrao(gas);

    expect(() => briefing.preencherBloco('TikTok', dadosDeBloco)).toThrow(/INV-02/);
  });

  test('BR-02: preenchimento sem look ou com data inválida falha fail-fast', () => {
    const gas = dominio();
    const briefing = rascunhoPadrao(gas);

    expect(() =>
      briefing.preencherBloco('Reels', Object.assign({}, dadosDeBloco, { look: '' }))
    ).toThrow(/BR-02/);
    expect(() =>
      briefing.preencherBloco('Reels', Object.assign({}, dadosDeBloco, { dataPostagem: 'x' }))
    ).toThrow(/BR-02/);
    expect(() =>
      briefing.preencherBloco('Reels', Object.assign({}, dadosDeBloco, { dataEntrega: null }))
    ).toThrow(/BR-02/);
  });
});

describe('Briefing — máquina de estados Rascunho → Publicado (§9)', () => {
  function preencherTudo(briefing) {
    briefing.blocos.forEach((bloco) => briefing.preencherBloco(bloco.rotulo, dadosDeBloco));
    return briefing;
  }

  test('publicar com todos os blocos preenchidos transita para Publicado', () => {
    const gas = dominio();
    const briefing = preencherTudo(rascunhoPadrao(gas));

    briefing.publicar();

    expect(briefing.estado).toBe('Publicado');
  });

  test('publicar com bloco pendente falha barulhento', () => {
    const gas = dominio();
    const briefing = rascunhoPadrao(gas);
    briefing.preencherBloco('Reels', dadosDeBloco);

    expect(() => briefing.publicar()).toThrow(/não preenchido/);
    expect(briefing.estado).toBe('Rascunho');
  });

  test('publicar duas vezes e preencher após publicado falham (§9: transição única)', () => {
    const gas = dominio();
    const briefing = preencherTudo(rascunhoPadrao(gas));
    briefing.publicar();

    expect(() => briefing.publicar()).toThrow(/§9/);
    expect(() => briefing.preencherBloco('Reels', dadosDeBloco)).toThrow(/§9/);
  });
});
