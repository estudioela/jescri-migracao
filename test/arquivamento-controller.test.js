const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas(['src/modulos/Arquivamento.js']);
}

function fakeArquivamentoService(overrides) {
  return Object.assign(
    {
      selarCompetencia: () => ({ mesReferencia: '2026-07', jaSelada: false }),
      arquivarLote: () => ({ resultados: [] }),
    },
    overrides
  );
}

describe('ArquivamentoController — envelope padrão (§3.3)', () => {
  test('selarCompetencia devolve envelope de sucesso com o resultado do Service', () => {
    const gas = carregar();
    const controller = new gas.ArquivamentoController(fakeArquivamentoService());

    const resposta = controller.selarCompetencia({ mesReferencia: '2026-07' });

    expect(resposta).toEqual({
      success: true,
      data: { mesReferencia: '2026-07', jaSelada: false },
    });
  });

  test('selarCompetencia devolve envelope de falha quando o Service recusa (AR-02)', () => {
    const gas = carregar();
    const controller = new gas.ArquivamentoController(
      fakeArquivamentoService({
        selarCompetencia: () => {
          throw new Error(
            "AR-02: competência '2026-07' tem pendências operacionais — selagem recusada."
          );
        },
      })
    );

    const resposta = controller.selarCompetencia({ mesReferencia: '2026-07' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/AR-02/);
  });

  test('arquivarLote devolve envelope de sucesso com o resumo por competência', () => {
    const gas = carregar();
    const resumo = { resultados: [{ mesReferencia: '2026-07', selada: true }] };
    const controller = new gas.ArquivamentoController(
      fakeArquivamentoService({ arquivarLote: () => resumo })
    );

    const resposta = controller.arquivarLote();

    expect(resposta).toEqual({ success: true, data: resumo });
  });

  test('arquivarLote devolve envelope de falha quando o Service lança', () => {
    const gas = carregar();
    const controller = new gas.ArquivamentoController(
      fakeArquivamentoService({
        arquivarLote: () => {
          throw new Error('falha inesperada');
        },
      })
    );

    const resposta = controller.arquivarLote();

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toBe('falha inesperada');
  });
});
