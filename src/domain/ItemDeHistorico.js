/**
 * VALUE OBJECT: ItemDeHistorico (SPEC-030 §6.1)
 *
 * Projeção de leitura de um registro arquivado (Contrato §6.4) para o
 * Histórico do Portal (UC-030.02): uma Entrega `Publicado` (SPEC-012) ou uma
 * Obrigação Financeira `Pago` (SPEC-020). Nunca é persistido e nunca altera
 * a máquina de estados de origem — mesma natureza de ItemDePendencia
 * (SPEC-027).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.ItemDeHistorico = class ItemDeHistorico {
  /**
   * @param {'Conteudo'|'Pagamento'} tipo
   * @param {string} referencia rótulo do formato (Conteúdo) ou tipo da
   *   Obrigação (Pagamento).
   * @param {string} estado estado arquivado de origem ('Publicado'/'Pago').
   * @param {Date} dataArquivamento
   * @param {number|null} valor valor da Obrigação (Pagamento) ou null
   *   (Conteúdo não tem valor próprio).
   */
  constructor(tipo, referencia, estado, dataArquivamento, valor) {
    this.tipo = tipo;
    this.referencia = String(referencia);
    this.estado = String(estado);
    this.dataArquivamento = dataArquivamento;
    this.valor = valor == null ? null : Number(valor);
  }

  /**
   * Projeta uma Entrega arquivada (§9 SPEC-012, `Publicado`) num item de
   * histórico de Conteúdo.
   * @param {Entrega} entrega
   * @returns {ItemDeHistorico}
   */
  static deEntrega(entrega) {
    return new ItemDeHistorico(
      'Conteudo',
      entrega.rotulo,
      entrega.estado,
      entrega.dataArquivamento,
      null
    );
  }

  /**
   * Projeta uma Obrigação Financeira arquivada (§9 SPEC-020, `Pago`) num
   * item de histórico de Pagamento.
   * @param {ObrigacaoFinanceira} obrigacao
   * @returns {ItemDeHistorico}
   */
  static deObrigacao(obrigacao) {
    return new ItemDeHistorico(
      'Pagamento',
      obrigacao.tipo,
      obrigacao.estado,
      obrigacao.dataArquivamento,
      obrigacao.valor
    );
  }
};
