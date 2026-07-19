const { loadGas } = require('./helpers/gasHarness');

function montar() {
  const gas = loadGas([
    'src/shared/Nucleo.js',
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Financeiro.js',
    'src/modulos/Entrega.js',
    'src/modulos/PortalConteudo.js',
  ]);

  const entregas = [];
  const obrigacoes = [];

  const entregaService = {
    listarEntregas: (mesReferenciaTexto, parceiraId) =>
      entregas.filter(
        (e) => e.mesReferencia.toString() === mesReferenciaTexto && e.parceiraId === parceiraId
      ),
    listarPorParceira: (parceiraId) => entregas.filter((e) => e.parceiraId === parceiraId),
  };

  const pagamentoService = {
    listarPagamentos: (mesReferenciaTexto, parceiraId) =>
      obrigacoes.filter(
        (o) =>
          o.parceiraId === parceiraId &&
          o.mesReferencia !== null &&
          o.mesReferencia.toString() === mesReferenciaTexto
      ),
    listarPorParceira: (parceiraId) => obrigacoes.filter((o) => o.parceiraId === parceiraId),
  };

  const sessoes = { 'tok-maria': 'Maria' };
  const acessoPortalService = {
    renovar: (dados) => {
      const parceiraId = sessoes[dados && dados.token];
      if (!parceiraId) {
        const erro = new Error('Sessão expirada.');
        erro.codigo = 'AC-03';
        throw erro;
      }
      return { parceiraId: parceiraId };
    },
  };

  const servico = new gas.PortalFinanceiroService(acessoPortalService, entregaService, pagamentoService);

  return { gas, servico, entregas, obrigacoes };
}

function codigoDe(fn) {
  try {
    fn();
    return null;
  } catch (erro) {
    return erro.codigo;
  }
}

describe('PortalFinanceiroService.listarPeriodos (UC-030.03)', () => {
  test('lista as competências com atividade da Parceira, sem duplicar e em ordem cronológica', () => {
    const { gas, servico, entregas, obrigacoes } = montar();
    entregas.push(new gas.Entrega('Maria', gas.MesReferencia.deTexto('2026-08'), 'Reels'));
    obrigacoes.push(
      new gas.ObrigacaoFinanceira('o1', 'Maria', 'Mensal', gas.MesReferencia.deTexto('2026-07'), 3500)
    );
    obrigacoes.push(
      new gas.ObrigacaoFinanceira('o2', 'Maria', 'Mensal', gas.MesReferencia.deTexto('2026-08'), 3500)
    );

    const periodos = servico.listarPeriodos({ token: 'tok-maria' });

    expect(periodos.map((p) => p.toString())).toEqual(['2026-07', '2026-08']);
  });

  test('Obrigação Avulsa sem competência (CB-01) não aparece na seleção', () => {
    const { gas, servico, obrigacoes } = montar();
    obrigacoes.push(new gas.ObrigacaoFinanceira('o1', 'Maria', 'Avulso', null, 500));

    expect(servico.listarPeriodos({ token: 'tok-maria' })).toEqual([]);
  });

  test('sem nenhuma atividade devolve lista vazia (CB-01)', () => {
    const { servico } = montar();

    expect(servico.listarPeriodos({ token: 'tok-maria' })).toEqual([]);
  });

  test('PF-01: token inválido/expirado é recusado', () => {
    const { servico } = montar();

    expect(codigoDe(() => servico.listarPeriodos({ token: 'nao-existe' }))).toBe('PF-01');
  });
});

describe('PortalFinanceiroService.verFinanceiro (UC-030.01)', () => {
  test('RN-02/CB-02: soma EmAberto+Aprovado em previsto, só Pago em pago', () => {
    const { gas, servico, obrigacoes } = montar();
    const mes = gas.MesReferencia.deTexto('2026-07');
    const emAberto = new gas.ObrigacaoFinanceira('o1', 'Maria', 'Mensal', mes, 3500);
    const paga = new gas.ObrigacaoFinanceira('o2', 'Maria', 'Avulso', mes, 500);
    paga.liberar();
    paga.pagar(new Date('2026-07-20'));
    obrigacoes.push(emAberto, paga);

    const resumo = servico.verFinanceiro({ token: 'tok-maria', mesReferencia: '2026-07' });

    expect(resumo.previsto).toBe(3500);
    expect(resumo.pago).toBe(500);
  });

  test('PF-02: período sem atividade da Parceira é recusado', () => {
    const { servico } = montar();

    expect(
      codigoDe(() => servico.verFinanceiro({ token: 'tok-maria', mesReferencia: '2026-07' }))
    ).toBe('PF-02');
  });

  test('PF-01: token inválido/expirado é recusado', () => {
    const { servico } = montar();

    expect(
      codigoDe(() => servico.verFinanceiro({ token: 'nao-existe', mesReferencia: '2026-07' }))
    ).toBe('PF-01');
  });
});

describe('PortalFinanceiroService.verHistorico (UC-030.02)', () => {
  test('lista Entregas Publicadas e Obrigações Pagas do período, exclui as ainda ativas', () => {
    const { gas, servico, entregas, obrigacoes } = montar();
    const mes = gas.MesReferencia.deTexto('2026-07');
    const publicada = new gas.Entrega('Maria', mes, 'Reels');
    publicada.enviarMaterial('https://drive/link');
    publicada.aprovar();
    publicada.publicar(new Date('2026-07-30'));
    entregas.push(publicada, new gas.Entrega('Maria', mes, 'Stories 1'));

    const paga = new gas.ObrigacaoFinanceira('o1', 'Maria', 'Mensal', mes, 3500);
    paga.liberar();
    paga.pagar(new Date('2026-07-28'));
    const emAberto = new gas.ObrigacaoFinanceira('o2', 'Maria', 'Avulso', mes, 500);
    obrigacoes.push(paga, emAberto);

    const historico = servico.verHistorico({ token: 'tok-maria', mesReferencia: '2026-07' });

    expect(historico).toHaveLength(2);
    expect(historico.find((i) => i.tipo === 'Conteudo').referencia).toBe('Reels');
    expect(historico.find((i) => i.tipo === 'Pagamento').referencia).toBe('Mensal');
  });

  test('PF-02: período sem atividade da Parceira é recusado', () => {
    const { servico } = montar();

    expect(
      codigoDe(() => servico.verHistorico({ token: 'tok-maria', mesReferencia: '2026-07' }))
    ).toBe('PF-02');
  });

  test('PF-01: token inválido/expirado é recusado', () => {
    const { servico } = montar();

    expect(
      codigoDe(() => servico.verHistorico({ token: 'nao-existe', mesReferencia: '2026-07' }))
    ).toBe('PF-01');
  });
});
