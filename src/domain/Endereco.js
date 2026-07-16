/**
 * VALUE OBJECT: Endereco (SPEC-032 §6.1)
 *
 * Endereço de perfil da Parceira — PII (Contrato §5). Estruturado (CEP +
 * partes), diferente de EnderecoDeEntrega (SPEC-016), que é um texto opaco
 * de uso único e mascarado (INV-04 daquela VO). Aqui o destino é a própria
 * tela da Parceira (UC-032.01) — por isso NÃO mascara toString/toJSON.
 *
 * RN-01: rua/bairro/cidade/uf são recompostos a partir do CEP pelo Service
 * (via porta adaptadorDeCep); esta VO só representa o resultado, nunca
 * resolve o CEP sozinha.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, Logger.
 */

this.Endereco = class Endereco {
  /**
   * @param {{cep: string, numero: string, complemento: string, rua: string,
   *   bairro: string, cidade: string, uf: string}} dados
   */
  constructor(dados) {
    const seguro = dados || {};
    const cep = String(seguro.cep == null ? '' : seguro.cep).trim();
    if (cep === '') {
      throw new Error('Endereco exige CEP.');
    }
    this.cep = cep;
    this.numero = String(seguro.numero == null ? '' : seguro.numero).trim();
    this.complemento = String(seguro.complemento == null ? '' : seguro.complemento).trim();
    this.rua = String(seguro.rua == null ? '' : seguro.rua).trim();
    this.bairro = String(seguro.bairro == null ? '' : seguro.bairro).trim();
    this.cidade = String(seguro.cidade == null ? '' : seguro.cidade).trim();
    this.uf = String(seguro.uf == null ? '' : seguro.uf).trim();
    Object.freeze(this);
  }

  /**
   * CB-01: falha do serviço de CEP pode deixar o endereço incompleto —
   * dados principais (CEP/número/complemento) continuam salvos (RN-02).
   * @returns {boolean} true só se rua/bairro/cidade/uf estiverem todos preenchidos.
   */
  completo() {
    return this.rua !== '' && this.bairro !== '' && this.cidade !== '' && this.uf !== '';
  }
};
