/**
 * VALUE OBJECT: CondicaoComercialSnapshot (SPEC-005 §6.1)
 *
 * Fotografia imutável das Condições Comerciais no instante da compilação:
 * `valorMensal`, `formatosContratados`, `quantidadePorFormato`.
 *
 * Invariantes preservadas:
 * - RN-04: reflete exatamente as condições vigentes no instante da compilação
 *   (cópia defensiva — mutações na origem não retroagem, RN-06).
 * - RN-05 / INV-04 / CB-05: imutável após criação — nasce Congelado, sem
 *   transições (§9); congelamento profundo de todas as estruturas.
 * - RN-10 (Contrato §5): PII (`PIX`, `CNPJ`, `Endereco`) NUNCA faz parte do
 *   Snapshot; presença de campo PII nas condições é recusada fail-fast.
 * - Construção inconsistente falha barulhento com código CM-04 (§17).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna física.
 */

this.CondicaoComercialSnapshot = class CondicaoComercialSnapshot {
  /**
   * @param {{valorMensal: number,
   *          formatosContratados: string[],
   *          quantidadePorFormato: Object<string, number>}} condicoes
   *   condições comerciais vigentes no instante da compilação.
   * @throws {Error} CM-04 quando as condições são inconsistentes ou contêm PII.
   */
  constructor(condicoes) {
    if (condicoes == null || typeof condicoes !== 'object') {
      throw new Error('CM-04: Snapshot inconsistente — condições comerciais ausentes.');
    }

    const chavePII = Object.keys(condicoes).find((chave) =>
      /pix|cnpj|endereco/i.test(chave)
    );
    if (chavePII) {
      throw new Error(
        "CM-04: Snapshot inconsistente — campo PII '" +
          chavePII +
          "' é banido do Snapshot Comercial (RN-10, Contrato §5)."
      );
    }

    const valorMensal = condicoes.valorMensal;
    if (typeof valorMensal !== 'number' || !isFinite(valorMensal) || valorMensal < 0) {
      throw new Error(
        "CM-04: Snapshot inconsistente — valorMensal inválido: '" + valorMensal + "'."
      );
    }

    if (!Array.isArray(condicoes.formatosContratados)) {
      throw new Error(
        'CM-04: Snapshot inconsistente — formatosContratados deve ser uma lista.'
      );
    }

    const quantidadePorFormato = condicoes.quantidadePorFormato;
    if (
      quantidadePorFormato == null ||
      typeof quantidadePorFormato !== 'object' ||
      Array.isArray(quantidadePorFormato)
    ) {
      throw new Error(
        'CM-04: Snapshot inconsistente — quantidadePorFormato deve ser um objeto formato→quantidade.'
      );
    }

    this.valorMensal = valorMensal;
    this.formatosContratados = Object.freeze(condicoes.formatosContratados.slice());
    this.quantidadePorFormato = Object.freeze(
      Object.assign({}, quantidadePorFormato)
    );
    Object.freeze(this);
  }
};
