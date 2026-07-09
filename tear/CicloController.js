const ACOES_CICLO = Object.freeze({
  LIST_ALL: 'LIST_ALL'
});

/**
 * Fronteira de dados da entidade Ciclo. Mesmo contrato da Ativação:
 * `{ success, data?, error? }`, erro de domínio em pt-BR.
 *
 * Proibido tocar `SpreadsheetApp`/`DriveApp`/`PropertiesService` (CLAUDE.md §13).
 */
class CicloController {
  constructor(cicloService) {
    if (!cicloService) {
      throw new TypeError('CicloController exige uma instância de CicloService.');
    }

    this.cicloService = cicloService;
  }

  handleCicloQuery(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Requisição inválida: payload ausente.');
      }

      if (payload.action !== ACOES_CICLO.LIST_ALL) {
        throw new Error(`Requisição inválida: ação "${payload.action}" não é suportada.`);
      }

      return { success: true, data: this.cicloService.listar() };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
