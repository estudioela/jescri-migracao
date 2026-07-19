const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/shared/Nucleo.js',
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
    'src/modulos/Entrega.js',
  ]);
}

function entregaPadrao(gas) {
  const entrega = gas.Entrega.materializar(
    'maria',
    new gas.MesReferencia(2026, 7),
    new gas.CondicaoComercialSnapshot({
      valorMensal: 1000,
      formatosContratados: ['Reels'],
      quantidadePorFormato: { Reels: 1 },
    })
  )[0];
  entrega.espelharDataAprovacao(new Date(2026, 6, 15));
  entrega.enviarMaterial('https://drive.example.com/material/reel.mp4');
  return entrega;
}

describe('EntregaController — envelope padrão e projeção serializável (§3.3)', () => {
  test('sucesso devolve envelope ok com projeção (datas AAAA-MM-DD, sem instância de domínio)', () => {
    const gas = carregar();
    const entrega = entregaPadrao(gas);
    const controller = new gas.EntregaController({
      enviarMaterial: () => entrega,
    });

    const resposta = controller.enviarMaterial({});

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual({
      id: 'maria|2026-07|Reels',
      parceiraId: 'maria',
      mesReferencia: '2026-07',
      rotulo: 'Reels',
      estado: 'EmRevisao',
      material: 'https://drive.example.com/material/reel.mp4',
      dataAprovacaoInterna: '2026-07-15',
      dataArquivamento: null,
    });
  });

  test('listarEntregas projeta a lista da competência', () => {
    const gas = carregar();
    const controller = new gas.EntregaController({
      listarEntregas: () => [entregaPadrao(gas)],
    });

    const resposta = controller.listarEntregas({ mesReferencia: '2026-07' });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toHaveLength(1);
    expect(resposta.data[0].rotulo).toBe('Reels');
  });

  test('erro do service vira envelope de falha — exceção nunca vaza crua', () => {
    const gas = carregar();
    const controller = new gas.EntregaController({
      aprovar: () => {
        throw new Error('CT-01: Entrega inexistente.');
      },
      publicar: () => {
        throw new Error('CT-03: transição inválida.');
      },
    });

    const aprovacao = controller.aprovarEntrega({});
    const publicacao = controller.publicarEntrega({});

    expect(aprovacao.success).toBe(false);
    expect(aprovacao.error.mensagem).toMatch(/CT-01/);
    expect(publicacao.success).toBe(false);
    expect(publicacao.error.mensagem).toMatch(/CT-03/);
  });
});
