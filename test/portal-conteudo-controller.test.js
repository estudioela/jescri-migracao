const { loadGas } = require('./helpers/gasHarness');

function montar(servicoFake) {
  const gas = loadGas([
    'src/shared/Nucleo.js',
    'src/modulos/PortalConteudo.js',
  ]);
  return new gas.PortalDeConteudoController(servicoFake);
}

describe('PortalDeConteudoController', () => {
  test('verPendencias: projeta itens em envelope de sucesso (datas AAAA-MM-DD)', () => {
    const controller = montar({
      listarPendencias: () => [
        {
          entregaId: 'Maria|2026-07|Reels',
          rotulo: 'Reels',
          estado: 'AguardandoMaterial',
          briefing: {
            look: 'Look 1',
            dataEntrega: new Date(2026, 6, 10),
            dataPostagem: new Date(2026, 6, 22),
          },
        },
      ],
    });

    const resposta = controller.verPendencias({ token: 'tok' });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual([
      {
        entregaId: 'Maria|2026-07|Reels',
        rotulo: 'Reels',
        estado: 'AguardandoMaterial',
        briefing: { look: 'Look 1', dataEntrega: '2026-07-10', dataPostagem: '2026-07-22' },
      },
    ]);
  });

  test('verPendencias: erro com codigo PC-01 é propagado no envelope de falha', () => {
    const controller = montar({
      listarPendencias: () => {
        const erro = new Error('Sessão inválida ou expirada.');
        erro.codigo = 'PC-01';
        throw erro;
      },
    });

    const resposta = controller.verPendencias({ token: 'invalido' });

    expect(resposta).toEqual({
      success: false,
      error: { codigo: 'PC-01', mensagem: 'Sessão inválida ou expirada.' },
    });
  });

  test('lerBriefingDoItem: projeta o bloco em envelope de sucesso', () => {
    const controller = montar({
      lerBriefingDoItem: () => ({
        rotulo: 'Reels',
        look: 'Look 1',
        dataEntrega: new Date(2026, 6, 10),
        dataPostagem: new Date(2026, 6, 22),
        orientacao: 'Luz natural.',
      }),
    });

    const resposta = controller.lerBriefingDoItem({ token: 'tok', rotulo: 'Reels' });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual({
      rotulo: 'Reels',
      look: 'Look 1',
      dataEntrega: '2026-07-10',
      dataPostagem: '2026-07-22',
      orientacao: 'Luz natural.',
    });
  });

  test('enviarMaterialDoPortal: projeta a Entrega resultante', () => {
    const controller = montar({
      enviarMaterial: () => ({
        id: { toString: () => 'Maria|2026-07|Reels' },
        rotulo: 'Reels',
        estado: 'EmRevisao',
      }),
    });

    const resposta = controller.enviarMaterialDoPortal({
      token: 'tok',
      rotulo: 'Reels',
      link: 'https://drive/x',
    });

    expect(resposta).toEqual({
      success: true,
      data: { id: 'Maria|2026-07|Reels', rotulo: 'Reels', estado: 'EmRevisao' },
    });
  });

  test('enviarMaterialDoPortal: erro com codigo PC-02 é propagado', () => {
    const controller = montar({
      enviarMaterial: () => {
        const erro = new Error("Entrega 'Reels' não pertence à Parceira ou não existe.");
        erro.codigo = 'PC-02';
        throw erro;
      },
    });

    const resposta = controller.enviarMaterialDoPortal({
      token: 'tok',
      rotulo: 'Reels',
      link: 'x',
    });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('PC-02');
  });
});
