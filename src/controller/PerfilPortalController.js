/**
 * CONTROLLER: PerfilPortalController — adapta o contrato externo do Perfil
 * no Portal (SPEC-032 UC-032.01/02/03).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o Service e
 * devolve SEMPRE o envelope padrão {success,data}/{success,error}
 * (PROJECT_GOVERNANCE §3.3). Nunca devolve a instância de domínio crua —
 * projeta PIX/Endereco em campos serializáveis (mesmo padrão de
 * PortalDeConteudoController.projetarItem).
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {PerfilPortalService} perfilPortalService
 */

this.PerfilPortalController = class PerfilPortalController {
  constructor(perfilPortalService) {
    this.perfilPortalService = perfilPortalService;
  }

  /**
   * UC-032.01 · Ver perfil da Parceira autenticada.
   * @param {{token: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  verPerfil(dados) {
    try {
      return envelopeOk(this.projetarPerfil(this.perfilPortalService.verPerfil(dados)));
    } catch (erro) {
      return this.falhar(erro);
    }
  }

  /**
   * UC-032.02/03 · Editar PIX/e-mail/endereço da Parceira autenticada.
   * @param {{token: string, pix: (string|undefined), email: (string|undefined),
   *   cep: (string|undefined), numero: (string|undefined),
   *   complemento: (string|undefined)}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  editarPerfil(dados) {
    try {
      return envelopeOk(this.projetarPerfil(this.perfilPortalService.editarPerfil(dados)));
    } catch (erro) {
      return this.falhar(erro);
    }
  }

  /**
   * Projeta o perfil (VOs de domínio) em campos serializáveis para o envelope.
   * @param {{email: (string|null), pix: (PIX|null), endereco: (Endereco|null)}} perfil
   * @returns {{email: (string|null), pix: (string|null), endereco: (object|null)}}
   */
  projetarPerfil(perfil) {
    return {
      email: perfil.email,
      pix: perfil.pix ? perfil.pix.valor : null,
      endereco: perfil.endereco
        ? {
            cep: perfil.endereco.cep,
            numero: perfil.endereco.numero,
            complemento: perfil.endereco.complemento,
            rua: perfil.endereco.rua,
            bairro: perfil.endereco.bairro,
            cidade: perfil.endereco.cidade,
            uf: perfil.endereco.uf,
            completo: perfil.endereco.completo(),
          }
        : null,
    };
  }

  /**
   * Converte erro de domínio/serviço em envelope de falha, preservando o
   * código do contrato (PP-01/02, §17) quando presente — mesmo padrão de
   * AcessoController/PortalDeConteudoController.
   * @param {Error} erro
   * @returns {{success: false, error: object}}
   */
  falhar(erro) {
    return envelopeFail(
      erro.codigo ? { codigo: erro.codigo, mensagem: erro.message } : { mensagem: erro.message }
    );
  }
};
