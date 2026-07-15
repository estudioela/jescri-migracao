/**
 * REPOSITORY: ParceiraRepository — persistência da Parceira.
 *
 * Único ponto (junto da ACL) que trata persistência. Define a projeção
 * explícita de campos e acessa a planilha SEMPRE por cabeçalho e SEMPRE via
 * ACL — nunca toca SpreadsheetApp diretamente nem lê por índice físico.
 *
 * Não pode conter regra de negócio nem formatar envelope.
 *
 * @param {ParceiraACL} acl ACL única da Parceira.
 */

this.ParceiraRepository = class ParceiraRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Persiste uma Parceira recém-cadastrada.
   * @param {Parceira} parceira
   * @returns {Parceira} a mesma Parceira persistida.
   */
  salvar(parceira) {
    this.acl.inserir(parceira);
    return parceira;
  }
};
