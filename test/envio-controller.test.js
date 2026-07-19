const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/shared/Nucleo.js',
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Envio.js',
  ]);
}

function envioPadrao(gas) {
  const envio = new gas.Envio('maria', new gas.MesReferencia(2026, 7));
  envio.registrarRastreio('BR123', new Date(2026, 6, 16));
  return envio;
}

describe('EnvioController — envelope padrão e projeção serializável (§3.3)', () => {
  test('registrarRastreio devolve envelope ok com projeção (datas AAAA-MM-DD, sem PII, sem instância de domínio)', () => {
    const gas = carregar();
    const envio = envioPadrao(gas);
    const controller = new gas.EnvioController({
      registrarRastreio: () => envio,
    });

    const resposta = controller.registrarRastreio({});

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual({
      parceiraId: 'maria',
      mesReferencia: '2026-07',
      revisao: 'AguardandoConfirmacao',
      jornada: 'Expedido',
      rastreio: 'BR123',
      dataEnvio: '2026-07-16',
      dataArquivamento: null,
    });
  });

  test('confirmarEndereco projeta o Envio e inclui a mensagem de confirmação manual (D-03/UC-016.01)', () => {
    const gas = carregar();
    const envio = new gas.Envio('maria', new gas.MesReferencia(2026, 7));
    envio.confirmarEndereco();
    const controller = new gas.EnvioController({
      confirmarEndereco: () => ({
        envio,
        mensagem: 'Endereço de entrega: Rua X — Chave PIX: pix@maria',
      }),
    });

    const resposta = controller.confirmarEndereco({});

    expect(resposta.success).toBe(true);
    expect(resposta.data.revisao).toBe('Confirmado');
    expect(resposta.data.mensagem).toBe('Endereço de entrega: Rua X — Chave PIX: pix@maria');
  });

  test('atualizarStatus projeta o Envio após a jornada avançar', () => {
    const gas = carregar();
    const envio = envioPadrao(gas);
    envio.marcarEntregue(new Date(2026, 6, 25));
    const controller = new gas.EnvioController({
      atualizarStatus: () => envio,
    });

    const resposta = controller.atualizarStatus({});

    expect(resposta.success).toBe(true);
    expect(resposta.data.jornada).toBe('Entregue');
    expect(resposta.data.dataArquivamento).toBe('2026-07-25');
  });

  test('listarEnvios projeta a lista da competência', () => {
    const gas = carregar();
    const controller = new gas.EnvioController({
      listarEnvios: () => [envioPadrao(gas)],
    });

    const resposta = controller.listarEnvios({ mesReferencia: '2026-07' });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toHaveLength(1);
    expect(resposta.data[0].parceiraId).toBe('maria');
  });

  test('erro do service vira envelope de falha — exceção nunca vaza crua', () => {
    const gas = carregar();
    const controller = new gas.EnvioController({
      registrarRastreio: () => {
        throw new Error('LG-01: Envio inexistente.');
      },
      confirmarEndereco: () => {
        throw new Error('LG-02: transição inválida.');
      },
    });

    const registro = controller.registrarRastreio({});
    const confirmacao = controller.confirmarEndereco({});

    expect(registro.success).toBe(false);
    expect(registro.error.mensagem).toMatch(/LG-01/);
    expect(confirmacao.success).toBe(false);
    expect(confirmacao.error.mensagem).toMatch(/LG-02/);
  });
});
