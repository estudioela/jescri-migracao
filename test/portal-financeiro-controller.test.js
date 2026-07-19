const { loadGas } = require('./helpers/gasHarness');

function montar(servicoFake) {
  const gas = loadGas([
    'src/shared/Nucleo.js',
    'src/modulos/Financeiro.js',
  ]);
  return new gas.PortalFinanceiroController(servicoFake);
}

describe('PortalFinanceiroController', () => {
  test('listarPeriodos: projeta MesReferencia em texto AAAA-MM (envelope de sucesso)', () => {
    const controller = montar({
      listarPeriodos: () => [
        { toString: () => '2026-07' },
        { toString: () => '2026-08' },
      ],
    });

    const resposta = controller.listarPeriodos({ token: 'tok' });

    expect(resposta).toEqual({ success: true, data: ['2026-07', '2026-08'] });
  });

  test('listarPeriodos: erro com codigo PF-01 é propagado no envelope de falha', () => {
    const controller = montar({
      listarPeriodos: () => {
        const erro = new Error('Sessão inválida ou expirada.');
        erro.codigo = 'PF-01';
        throw erro;
      },
    });

    const resposta = controller.listarPeriodos({ token: 'invalido' });

    expect(resposta).toEqual({
      success: false,
      error: { codigo: 'PF-01', mensagem: 'Sessão inválida ou expirada.' },
    });
  });

  test('verFinanceiro: projeta previsto/pago em envelope de sucesso', () => {
    const controller = montar({
      verFinanceiro: () => ({ previsto: 3500, pago: 500 }),
    });

    const resposta = controller.verFinanceiro({ token: 'tok', mesReferencia: '2026-07' });

    expect(resposta).toEqual({ success: true, data: { previsto: 3500, pago: 500 } });
  });

  test('verFinanceiro: erro com codigo PF-02 é propagado', () => {
    const controller = montar({
      verFinanceiro: () => {
        const erro = new Error("Período '2026-07' inexistente para a Parceira.");
        erro.codigo = 'PF-02';
        throw erro;
      },
    });

    const resposta = controller.verFinanceiro({ token: 'tok', mesReferencia: '2026-07' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('PF-02');
  });

  test('verHistorico: projeta itens de Conteúdo e Pagamento em envelope de sucesso (data AAAA-MM-DD)', () => {
    const controller = montar({
      verHistorico: () => [
        {
          tipo: 'Conteudo',
          referencia: 'Reels',
          estado: 'Publicado',
          dataArquivamento: new Date(2026, 6, 30),
          valor: null,
        },
        {
          tipo: 'Pagamento',
          referencia: 'Mensal',
          estado: 'Pago',
          dataArquivamento: new Date(2026, 6, 28),
          valor: 3500,
        },
      ],
    });

    const resposta = controller.verHistorico({ token: 'tok', mesReferencia: '2026-07' });

    expect(resposta).toEqual({
      success: true,
      data: [
        {
          tipo: 'Conteudo',
          referencia: 'Reels',
          estado: 'Publicado',
          dataArquivamento: '2026-07-30',
          valor: null,
        },
        {
          tipo: 'Pagamento',
          referencia: 'Mensal',
          estado: 'Pago',
          dataArquivamento: '2026-07-28',
          valor: 3500,
        },
      ],
    });
  });

  test('verHistorico: erro com codigo PF-01 é propagado', () => {
    const controller = montar({
      verHistorico: () => {
        const erro = new Error('Sessão inválida ou expirada.');
        erro.codigo = 'PF-01';
        throw erro;
      },
    });

    const resposta = controller.verHistorico({ token: 'invalido', mesReferencia: '2026-07' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('PF-01');
  });
});
