/**
 * CONTROLLER: PagamentoController — adapta o contrato externo da Gestão de
 * Pagamentos (SPEC-020 UC-020.01/02/03).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * PagamentoService e devolve SEMPRE o envelope padrão {success,data}/
 * {success,error} (§3.3) — mesmo padrão de DocumentoController/
 * EntregaController (SPECs internas de operação): código do contrato
 * (PG-01/02/03/05) embutido na mensagem, sem campo `codigo` estruturado
 * (esse padrão é exclusivo das SPECs de acesso do Portal — 025/027/032).
 *
 * Expõe apenas uma projeção serializável da Obrigação Financeira — nunca a
 * instância de domínio. A mensagem de cobrança (com PIX) vai no envelope de
 * `liberar` porque o operador é o ator autorizado (§13) que entrega a
 * cobrança à Parceira; nunca é persistida nem logada por esta camada.
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {PagamentoService} pagamentoService
 */

this.PagamentoController = class PagamentoController {
  constructor(pagamentoService) {
    this.pagamentoService = pagamentoService;
  }

  /**
   * Adapta o comando LancarAvulso (UC-020.02) ao contrato externo.
   * @param {{parceiraId: string, valor: number, mesReferencia: (string|undefined)}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  lancarAvulso(dados) {
    try {
      return envelopeOk(this.projetar(this.pagamentoService.lancarAvulso(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando Liberar (UC-020.03, 1ª parte) ao contrato externo.
   * @param {{id: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  liberar(dados) {
    try {
      const resultado = this.pagamentoService.liberar(dados);
      return envelopeOk(
        Object.assign(this.projetar(resultado.obrigacao), { mensagem: resultado.mensagem })
      );
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando Pagar (UC-020.03, 2ª parte) ao contrato externo.
   * @param {{id: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  pagar(dados) {
    try {
      return envelopeOk(this.projetar(this.pagamentoService.pagar(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Lista as Obrigações da competência, opcionalmente por Parceira.
   * @param {{mesReferencia: string, parceiraId: (string|undefined)}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  listarPagamentos(dados) {
    try {
      const obrigacoes = this.pagamentoService.listarPagamentos(
        dados.mesReferencia,
        dados.parceiraId
      );
      return envelopeOk(obrigacoes.map((obrigacao) => this.projetar(obrigacao)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Projeção serializável da Obrigação Financeira.
   * @param {ObrigacaoFinanceira} obrigacao
   * @returns {object}
   */
  projetar(obrigacao) {
    return {
      id: obrigacao.id,
      parceiraId: obrigacao.parceiraId,
      tipo: obrigacao.tipo,
      mesReferencia: obrigacao.mesReferencia ? obrigacao.mesReferencia.toString() : null,
      valor: obrigacao.valor,
      estado: obrigacao.estado,
      dataArquivamento: obrigacao.dataArquivamento,
    };
  }
};
