/**
 * CONTROLLER: PortalFinanceiroController — adapta o contrato externo do
 * Financeiro e Histórico no Portal (SPEC-030 UC-030.01/02/03).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * PortalFinanceiroService e devolve SEMPRE o envelope padrão
 * {success,data}/{success,error} (PROJECT_GOVERNANCE §3.3). Erros do
 * contrato (§17: PF-01/PF-02) carregam o código, mesmo padrão de
 * PortalDeConteudoController/PerfilPortalController. Expõe apenas projeções
 * serializáveis — nunca a instância de domínio; datas saem como
 * 'AAAA-MM-DD'.
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {PortalFinanceiroService} portalFinanceiroService
 */

this.PortalFinanceiroController = class PortalFinanceiroController {
  constructor(portalFinanceiroService) {
    this.portalFinanceiroService = portalFinanceiroService;
  }

  /**
   * UC-030.03: lista as competências (períodos) selecionáveis pela Parceira
   * autenticada.
   * @param {{token: string}} dados
   * @returns {{success: true, data: string[]}|{success: false, error: object}}
   */
  listarPeriodos(dados) {
    try {
      const periodos = this.portalFinanceiroService.listarPeriodos(dados);
      return envelopeOk(periodos.map((periodo) => periodo.toString()));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-030.01: total previsto x pago do período selecionado.
   * @param {{token: string, mesReferencia: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  verFinanceiro(dados) {
    try {
      const resumo = this.portalFinanceiroService.verFinanceiro(dados);
      return envelopeOk({ previsto: resumo.previsto, pago: resumo.pago });
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-030.02: histórico de conteúdo e pagamentos arquivados do período.
   * @param {{token: string, mesReferencia: string}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  verHistorico(dados) {
    try {
      const itens = this.portalFinanceiroService.verHistorico(dados);
      return envelopeOk(itens.map((item) => this.projetarItem(item)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * Projeção serializável de um ItemDeHistorico.
   * @param {ItemDeHistorico} item
   * @returns {object}
   */
  projetarItem(item) {
    return {
      tipo: item.tipo,
      referencia: item.referencia,
      estado: item.estado,
      dataArquivamento: this.dataParaTexto(item.dataArquivamento),
      valor: item.valor,
    };
  }

  /**
   * @param {Date|null} data
   * @returns {string|null} 'AAAA-MM-DD' (calendário local) ou null.
   */
  dataParaTexto(data) {
    if (data == null) {
      return null;
    }
    const mes = data.getMonth() + 1;
    const dia = data.getDate();
    return (
      data.getFullYear() +
      '-' +
      (mes < 10 ? '0' + mes : String(mes)) +
      '-' +
      (dia < 10 ? '0' + dia : String(dia))
    );
  }
};
