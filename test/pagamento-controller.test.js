const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas(['src/shared/Nucleo.js', 'src/modulos/Financeiro.js']);
}

const obrigacaoStub = {
  id: 'o1',
  parceiraId: 'Maria',
  tipo: 'Avulso',
  mesReferencia: null,
  valor: 500,
  estado: 'Aprovado',
  dataArquivamento: null,
};

describe('PagamentoController — envelope padrão (§3.3)', () => {
  test('liberar com sucesso devolve envelope ok com a projeção + mensagem de cobrança', () => {
    const gas = carregar();
    const controller = new gas.PagamentoController({
      liberar: () => ({ obrigacao: obrigacaoStub, mensagem: 'Cobrança de R$ 500.00 — Chave PIX: x' }),
    });

    const resposta = controller.liberar({ id: 'o1' });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual(
      Object.assign({}, obrigacaoStub, { mensagem: 'Cobrança de R$ 500.00 — Chave PIX: x' })
    );
  });

  test('erro do service (PG-05) vira envelope de falha com a mensagem (nunca exceção crua)', () => {
    const gas = carregar();
    const controller = new gas.PagamentoController({
      liberar: () => {
        throw new Error("PG-05: liberação recusada — conteúdo de 'Maria' ainda não aprovado.");
      },
    });

    const resposta = controller.liberar({ id: 'o1' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/PG-05/);
  });

  test('listarPagamentos devolve a lista projetada', () => {
    const gas = carregar();
    const controller = new gas.PagamentoController({
      listarPagamentos: () => [obrigacaoStub],
    });

    const resposta = controller.listarPagamentos({ mesReferencia: '2026-07' });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual([obrigacaoStub]);
  });
});
