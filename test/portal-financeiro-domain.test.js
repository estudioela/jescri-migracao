const { loadGas } = require('./helpers/gasHarness');

function montar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Financeiro.js',
    'src/modulos/Entrega.js',
    'src/modulos/PortalConteudo.js',
  ]);
}

describe('ResumoFinanceiro (SPEC-030 §6.1)', () => {
  test('de(): soma EmAberto+Aprovado em previsto, Pago em pago (RN-02/CB-02)', () => {
    const gas = montar();
    const mes = gas.MesReferencia.deTexto('2026-07');
    const emAberto = new gas.ObrigacaoFinanceira('o1', 'Maria', 'Mensal', mes, 100);
    const aprovada = new gas.ObrigacaoFinanceira('o2', 'Maria', 'Mensal', mes, 200);
    aprovada.liberar();
    const paga = new gas.ObrigacaoFinanceira('o3', 'Maria', 'Mensal', mes, 300);
    paga.liberar();
    paga.pagar(new Date('2026-07-20'));

    const resumo = gas.ResumoFinanceiro.de([emAberto, aprovada, paga]);

    expect(resumo.previsto).toBe(300); // 100 (EmAberto) + 200 (Aprovado)
    expect(resumo.pago).toBe(300); // só a paga
  });

  test('de(): lista vazia devolve previsto e pago zerados', () => {
    const gas = montar();

    const resumo = gas.ResumoFinanceiro.de([]);

    expect(resumo.previsto).toBe(0);
    expect(resumo.pago).toBe(0);
  });
});

describe('ItemDeHistorico (SPEC-030 §6.1)', () => {
  test('deEntrega(): projeta uma Entrega Publicada como item de Conteúdo', () => {
    const gas = montar();
    const mes = gas.MesReferencia.deTexto('2026-07');
    const entrega = new gas.Entrega('Maria', mes, 'Reels');
    entrega.enviarMaterial('https://drive/link');
    entrega.aprovar();
    entrega.publicar(new Date('2026-07-30'));

    const item = gas.ItemDeHistorico.deEntrega(entrega);

    expect(item.tipo).toBe('Conteudo');
    expect(item.referencia).toBe('Reels');
    expect(item.estado).toBe('Publicado');
    expect(item.dataArquivamento).toEqual(new Date('2026-07-30'));
    expect(item.valor).toBeNull();
  });

  test('deObrigacao(): projeta uma Obrigação Paga como item de Pagamento', () => {
    const gas = montar();
    const mes = gas.MesReferencia.deTexto('2026-07');
    const obrigacao = new gas.ObrigacaoFinanceira('o1', 'Maria', 'Mensal', mes, 350);
    obrigacao.liberar();
    obrigacao.pagar(new Date('2026-07-25'));

    const item = gas.ItemDeHistorico.deObrigacao(obrigacao);

    expect(item.tipo).toBe('Pagamento');
    expect(item.referencia).toBe('Mensal');
    expect(item.estado).toBe('Pago');
    expect(item.dataArquivamento).toEqual(new Date('2026-07-25'));
    expect(item.valor).toBe(350);
  });
});
