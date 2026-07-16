/**
 * VALUE OBJECT: PIX (SPEC-032 §6.1)
 *
 * Chave PIX da Parceira — PII (Contrato §5). Diferente de EnderecoDeEntrega
 * (SPEC-016, INV-04): ali o valor nunca sai do caso de uso interno; aqui o
 * destino é a própria tela da Parceira (UC-032.01 "Ver perfil") — por isso
 * NÃO mascara toString/toJSON. "PII nunca em log" (INV-02) é responsabilidade
 * de quem loga (publicadorDeLog só registra nome do evento), não desta VO.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, Logger.
 */

this.PIX = class PIX {
  /**
   * @param {string} chave chave PIX (PII).
   */
  constructor(chave) {
    const texto = String(chave == null ? '' : chave).trim();
    if (texto === '') {
      throw new Error('PIX exige uma chave não vazia.');
    }
    this.valor = texto;
    Object.freeze(this);
  }

  /**
   * Igualdade de VO pelo valor.
   * @param {PIX} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return outro instanceof PIX && this.valor === outro.valor;
  }
};
