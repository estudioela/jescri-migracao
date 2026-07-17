/**
 * CONTROLLER: UsuarioController — adapta o contrato externo de Identidade
 * e Acesso (SPEC-035). Recebe a chamada do Entrypoint, invoca o Service e
 * devolve SEMPRE o envelope padrão {success,data}/{success,error}
 * (`src/shared/Envelope.js`, via envelopeOk/falharComCodigo).
 *
 * Não existe um AuthController separado (§9.2-A) — renovação/encerramento
 * de sessão continuam servidos pelo `AcessoController` já existente
 * (SPEC-025). Este controller cobre exclusivamente login federado,
 * onboarding, vinculação, moderação e RBAC.
 *
 * Erros do contrato (§14.3) carregam o código; erros de infraestrutura
 * seguem o padrão dos pares (envelope só com mensagem). Expõe apenas
 * projeções serializáveis — nunca a instância de domínio (`Usuario`) nem
 * `Sessao`.
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer
 * coluna física.
 *
 * @param {UsuarioService} usuarioService
 */

this.UsuarioController = class UsuarioController {
  constructor(usuarioService) {
    this.usuarioService = usuarioService;
  }

  /**
   * @param {Usuario} usuario
   * @returns {{subProvider: string, email: string, papel: string, estado: string}}
   */
  projetarUsuario(usuario) {
    return {
      subProvider: usuario.subProvider,
      email: usuario.email,
      papel: usuario.papel,
      estado: usuario.estado,
    };
  }

  /**
   * @param {{status: string, sessao: (Sessao|undefined)}} resultado devolvido por UsuarioService.entrar.
   * @returns {object} projeção serializável — nunca a instância de Sessao.
   */
  projetarResultadoDeEntrada(resultado) {
    if (resultado.status !== 'AUTENTICADO') {
      return resultado;
    }
    return {
      status: 'AUTENTICADO',
      token: resultado.sessao.token.valor,
      parceiraId: resultado.sessao.parceiraId,
      expiraEm: resultado.sessao.expiraEm.toISOString(),
    };
  }

  /**
   * UC-035.01/02: autentica via Google (§9.2).
   * @param {{idToken: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  entrar(dados) {
    try {
      return envelopeOk(this.projetarResultadoDeEntrada(this.usuarioService.entrar(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-035.02 (§5.1-A): confirma a vinculação a uma Parceira pré-existente.
   * @param {{idToken: string, parceiraId: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  confirmarVinculacao(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.confirmarVinculacao(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-035.03 (§5.3): completa o onboarding de um utilizador novo.
   * @param {{idToken: string, papel: string, dadosComplementares: object}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  completarCadastro(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.completarCadastro(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * Painel de moderação (§13.4) — exclusivo do papel Administrador.
   * @param {{token: string}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  listarPendentes(dados) {
    try {
      return envelopeOk(this.usuarioService.listarPendentes(dados).map((u) => this.projetarUsuario(u)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-035.04 (RN-04/§12.3): aprova um registo pendente.
   * @param {{token: string, subAlvo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  aprovarUsuario(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.aprovarUsuario(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-035.04 (RN-04/§12.3): rejeita um registo pendente.
   * @param {{token: string, subAlvo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  rejeitarUsuario(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.rejeitarUsuario(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * §3.1.3/§4.1/§7.2: suspende uma conta ACTIVE.
   * @param {{token: string, subAlvo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  inativarUsuario(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.inativarUsuario(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * §7.2 "Reativação Operacional": reativa uma conta INACTIVE.
   * @param {{token: string, subAlvo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  reativarUsuario(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.reativarUsuario(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }
};
