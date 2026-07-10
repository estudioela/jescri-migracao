const ACOES_PAGAMENTO = Object.freeze({
  LIST_BY_CYCLE: 'LIST_BY_CYCLE'
});

/**
 * Fronteira de dados do modelo de leitura Pagamento. Mesmo contrato das demais:
 * `{ success, data?, error? }`. Proibido tocar `SpreadsheetApp` (CLAUDE.md §13).
 */
class PagamentoController {
  constructor(pagamentoService) {
    if (!pagamentoService) {
      throw new TypeError('PagamentoController exige uma instância de PagamentoService.');
    }

    this.pagamentoService = pagamentoService;
  }

  handlePagamentoQuery(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Requisição inválida: payload ausente.');
      }

      if (payload.action !== ACOES_PAGAMENTO.LIST_BY_CYCLE) {
        throw new Error(`Requisição inválida: ação "${payload.action}" não é suportada.`);
      }

      if (!payload.idCiclo) {
        throw new Error('Requisição inválida: "idCiclo" é obrigatório.');
      }

      if (!payload.idInfluenciadora) {
        throw new Error('Requisição inválida: "idInfluenciadora" é obrigatório.');
      }

      return {
        success: true,
        data: this.pagamentoService.listarPorCiclo(payload.idCiclo, payload.idInfluenciadora)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
