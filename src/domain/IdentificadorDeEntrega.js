/**
 * VALUE OBJECT: IdentificadorDeEntrega (SPEC-012 §6.1)
 *
 * Identificador único e permanente de uma Entrega (RNF-01/INV-02),
 * determinístico pela composição `parceiraId × competência × rótulo do
 * formato` (decisão aprovada pelo PO em 2026-07-15) — estável entre
 * leituras, sem sorteio de UUID.
 *
 * Invariantes preservadas:
 * - INV-02: único dentro da competência (um rótulo por unidade contratada)
 *   e permanente (a composição nunca muda após a materialização).
 * - Imutável após criação; composição incompleta falha barulhento.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.IdentificadorDeEntrega = class IdentificadorDeEntrega {
  /**
   * @param {string} parceiraId identidade estável da Parceira.
   * @param {MesReferencia} mesReferencia competência da colaboração (VO).
   * @param {string} rotulo rótulo do formato (ex.: 'Stories 1').
   */
  constructor(parceiraId, mesReferencia, rotulo) {
    const parceiraIdTexto = String(parceiraId == null ? '' : parceiraId).trim();
    if (parceiraIdTexto === '') {
      throw new Error('IdentificadorDeEntrega exige a identidade da Parceira (RNF-01).');
    }
    if (!(mesReferencia instanceof MesReferencia)) {
      throw new Error(
        'IdentificadorDeEntrega exige o Value Object MesReferencia como competência (RNF-01).'
      );
    }
    const rotuloTexto = String(rotulo == null ? '' : rotulo).trim();
    if (rotuloTexto === '') {
      throw new Error('IdentificadorDeEntrega exige o rótulo do formato (RNF-01).');
    }
    this.valor =
      String(parceiraId) + '|' + mesReferencia.toString() + '|' + String(rotulo);
    Object.freeze(this);
  }

  /**
   * Igualdade de VO pelo valor composto.
   * @param {IdentificadorDeEntrega} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return outro instanceof IdentificadorDeEntrega && this.valor === outro.valor;
  }

  /**
   * @returns {string} o valor canônico do identificador.
   */
  toString() {
    return this.valor;
  }
};
