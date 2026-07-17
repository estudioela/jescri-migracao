/**
 * VALUE OBJECT: ResumoFinanceiro (SPEC-030 §6.1)
 *
 * Total previsto x total pago de uma Parceira num período (UC-030.01).
 * "Previsto" é tudo que ainda não chegou a `Pago` (`EmAberto`/`Aprovado`,
 * RN-02/CB-02: uma Obrigação `EmAberto` conta em previsto, nunca em pago).
 * Projeção pura de leitura sobre `ObrigacaoFinanceira` (SPEC-020) — nunca
 * persistido, nunca altera a máquina de estados da Obrigação.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.ResumoFinanceiro = class ResumoFinanceiro {
  /**
   * @param {number} previsto soma das Obrigações ainda não pagas.
   * @param {number} pago soma das Obrigações já pagas.
   */
  constructor(previsto, pago) {
    this.previsto = Number(previsto);
    this.pago = Number(pago);
  }

  /**
   * Agrega as Obrigações Financeiras de um período em previsto x pago
   * (RN-02/CB-02).
   * @param {ObrigacaoFinanceira[]} obrigacoes
   * @returns {ResumoFinanceiro}
   */
  static de(obrigacoes) {
    const previsto = obrigacoes
      .filter((obrigacao) => obrigacao.estado !== 'Pago')
      .reduce((soma, obrigacao) => soma + obrigacao.valor, 0);
    const pago = obrigacoes
      .filter((obrigacao) => obrigacao.estado === 'Pago')
      .reduce((soma, obrigacao) => soma + obrigacao.valor, 0);
    return new ResumoFinanceiro(previsto, pago);
  }
};
