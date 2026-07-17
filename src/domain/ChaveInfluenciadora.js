/**
 * VALUE OBJECT: ChaveInfluenciadora (SPEC-003 §6.1, D-02c)
 *
 * Grafia canônica única da identidade da Parceira (`INFLU_KEY`) usada pela
 * Importação Inicial da Base para normalizar chaves divergentes do legado
 * (CB-03) antes de curar/deduplicar (RN-02).
 *
 * Normalização: trim + colapso de espaços internos. A comparação de
 * identidade (`normalizada()`) é case-insensitive — resolve duplicidade por
 * grafia divergente (ex.: 'maria', 'MARIA', 'Maria ' → mesma Parceira) — mas
 * o valor persistido preserva a grafia original trimada (primeira ocorrência
 * vence, decisão do Service).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.ChaveInfluenciadora = class ChaveInfluenciadora {
  /**
   * @param {string} bruta valor lido de INFLU_KEY na base legada.
   */
  constructor(bruta) {
    const texto = String(bruta == null ? '' : bruta).trim().replace(/\s+/g, ' ');
    if (texto === '') {
      throw new Error('IM-02: chave ausente ou ambígua — registro sem INFLU_KEY (§17).');
    }
    this.valor = texto;
  }

  /**
   * @returns {string} forma normalizada (case-insensitive) para deduplicação.
   */
  normalizada() {
    return this.valor.toLowerCase();
  }

  /**
   * @returns {string} grafia canônica a persistir.
   */
  toString() {
    return this.valor;
  }
};
