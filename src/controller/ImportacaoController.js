/**
 * CONTROLLER: ImportacaoController — adapta o contrato externo da
 * Importação Inicial da Base (SPEC-003 UC-003.01).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * ImportadorService e devolve SEMPRE o envelope padrão {success,data}/
 * {success,error} (§3.3) — mesmo padrão de DocumentoController/
 * EntregaController. O payload de sucesso é só `{totalImportado}` — sem
 * PII (RNF-02/INV-03).
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {ImportadorService} importadorService
 */

this.ImportacaoController = class ImportacaoController {
  constructor(importadorService) {
    this.importadorService = importadorService;
  }

  /**
   * Adapta o comando ImportarBase (UC-003.01) ao contrato externo.
   * @returns {{success: true, data: {totalImportado: number}}|{success: false, error: object}}
   */
  importarBase() {
    try {
      return envelopeOk(this.importadorService.importarBase());
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }
};
