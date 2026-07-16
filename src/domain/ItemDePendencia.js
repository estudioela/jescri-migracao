/**
 * VALUE OBJECT: ItemDePendencia (SPEC-027 §6.1)
 *
 * Projeção de leitura de uma Entrega para o Portal da Parceira: expõe o
 * essencial para "ver pendências" (UC-027.01) e "ler briefing do item"
 * (UC-027.02). Nunca é persistido e nunca altera a máquina de estados da
 * Entrega — essa pertence a SPEC-012 (§6.4, "o que NÃO pertence" à SPEC-027).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.ItemDePendencia = class ItemDePendencia {
  /**
   * @param {string} entregaId identificador permanente da Entrega (RNF-01).
   * @param {string} rotulo rótulo do formato (ex.: 'Stories 1').
   * @param {string} estado estado atual da Entrega (§9, SPEC-012).
   * @param {{look: string, dataEntrega: Date, dataPostagem: Date}|null} briefing
   *   projeção do bloco correspondente do Briefing, ou null quando ainda
   *   não há bloco espelhável (RN-03).
   */
  constructor(entregaId, rotulo, estado, briefing) {
    this.entregaId = String(entregaId);
    this.rotulo = String(rotulo);
    this.estado = String(estado);
    this.briefing = briefing || null;
  }

  /**
   * Projeta uma Entrega (+ bloco de Briefing correspondente, se houver) num
   * ItemDePendencia (UC-027.01/02).
   * @param {Entrega} entrega
   * @param {BlocoDeFormato|null} bloco bloco do Briefing de mesmo rótulo.
   * @returns {ItemDePendencia}
   */
  static de(entrega, bloco) {
    return new ItemDePendencia(
      entrega.id.toString(),
      entrega.rotulo,
      entrega.estado,
      bloco
        ? {
            look: bloco.look,
            dataEntrega: bloco.dataEntrega,
            dataPostagem: bloco.dataPostagem,
          }
        : null
    );
  }
};
