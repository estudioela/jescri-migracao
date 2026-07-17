/**
 * CONTROLLER: ArquivamentoController — adapta o contrato externo do
 * Arquivamento (SPEC-034 UC-034.01/UC-034.02).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * ArquivamentoService e devolve SEMPRE o envelope padrão
 * {success,data}/{success,error} (PROJECT_GOVERNANCE §3.3).
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {ArquivamentoService} arquivamentoService
 */

this.ArquivamentoController = class ArquivamentoController {
  constructor(arquivamentoService) {
    this.arquivamentoService = arquivamentoService;
  }

  /**
   * Adapta o comando SelarCompetencia ao contrato externo (UC-034.02).
   * @param {{mesReferencia: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  selarCompetencia(dados) {
    try {
      const resultado = this.arquivamentoService.selarCompetencia(dados && dados.mesReferencia);
      return envelopeOk(resultado);
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando ArquivarLote ao contrato externo (UC-034.01).
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  arquivarLote() {
    try {
      const resultado = this.arquivamentoService.arquivarLote();
      return envelopeOk(resultado);
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }
};
