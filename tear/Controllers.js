/* ═══════════════════════════════════════════════════════════════
   controllers/AtivacaoController.js
   ═══════════════════════════════════════════════════════════════ */

const ACOES_ATIVACAO = Object.freeze({
  CHANGE_STATE: 'CHANGE_STATE',
  LIST_BY_CYCLE: 'LIST_BY_CYCLE',
  LIST_ARCHIVED_BY_CYCLE: 'LIST_ARCHIVED_BY_CYCLE',
  GET_BY_ID: 'GET_BY_ID'
});

class AtivacaoController {
  constructor(ativacaoService) {
    if (!ativacaoService) {
      throw new TypeError('AtivacaoController exige uma instância de AtivacaoService.');
    }

    this.ativacaoService = ativacaoService;
  }

  handleAtivacaoUpdate(payload) {
    try {
      this._validarPayload(payload);

      const ativacao = this.ativacaoService.alterarEstado(
        payload.idAtivacao,
        payload.newState,
        payload.idInfluenciadora
      );

      return {
        success: true,
        data: ativacao,
        message: 'Estado atualizado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fronteira de LEITURA. Mesmo envelope da escrita — a UI trata sucesso e erro
   * de um jeito só. Entity, Service e Repository propagam exceção; só aqui ela
   * vira `{success:false, error}`.
   */
  handleAtivacaoQuery(payload) {
    try {
      this._exigirPayload(payload);

      if (payload.action === ACOES_ATIVACAO.LIST_BY_CYCLE) {
        this._exigirCampo(payload, 'idCiclo');
        this._exigirCampo(payload, 'idInfluenciadora');

        return {
          success: true,
          data: this.ativacaoService.listarDaInfluenciadoraNoCiclo(payload.idCiclo, payload.idInfluenciadora)
        };
      }

      if (payload.action === ACOES_ATIVACAO.LIST_ARCHIVED_BY_CYCLE) {
        this._exigirCampo(payload, 'idCiclo');
        this._exigirCampo(payload, 'idInfluenciadora');

        return {
          success: true,
          data: this.ativacaoService.listarArquivadasDaInfluenciadoraNoCiclo(payload.idCiclo, payload.idInfluenciadora)
        };
      }

      if (payload.action === ACOES_ATIVACAO.GET_BY_ID) {
        this._exigirCampo(payload, 'idAtivacao');
        this._exigirCampo(payload, 'idInfluenciadora');

        return {
          success: true,
          data: this.ativacaoService.obter(payload.idAtivacao, payload.idInfluenciadora)
        };
      }

      throw new Error(`Requisição inválida: ação "${payload.action}" não é suportada.`);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  _validarPayload(payload) {
    this._exigirPayload(payload);

    if (payload.action !== ACOES_ATIVACAO.CHANGE_STATE) {
      throw new Error(`Requisição inválida: ação "${payload.action}" não é suportada.`);
    }

    this._exigirCampo(payload, 'idAtivacao');
    this._exigirCampo(payload, 'newState');
    this._exigirCampo(payload, 'idInfluenciadora');
  }

  _exigirPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Requisição inválida: payload ausente.');
    }
  }

  _exigirCampo(payload, campo) {
    if (!payload[campo]) {
      throw new Error(`Requisição inválida: "${campo}" é obrigatório.`);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   controllers/CicloController.js
   ═══════════════════════════════════════════════════════════════ */

const ACOES_CICLO = Object.freeze({
  LIST_ALL: 'LIST_ALL'
});

/**
 * Fronteira de dados da entidade Ciclo. Mesmo contrato da Ativação:
 * `{ success, data?, error? }`, erro de domínio em pt-BR.
 *
 * Proibido tocar `SpreadsheetApp`/`DriveApp`/`PropertiesService` (CLAUDE.md §13).
 */
class CicloController {
  constructor(cicloService) {
    if (!cicloService) {
      throw new TypeError('CicloController exige uma instância de CicloService.');
    }

    this.cicloService = cicloService;
  }

  handleCicloQuery(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Requisição inválida: payload ausente.');
      }

      if (payload.action !== ACOES_CICLO.LIST_ALL) {
        throw new Error(`Requisição inválida: ação "${payload.action}" não é suportada.`);
      }

      return { success: true, data: this.cicloService.listar() };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   controllers/PagamentoController.js
   ═══════════════════════════════════════════════════════════════ */

const ACOES_PAGAMENTO = Object.freeze({
  LIST_BY_CYCLE: 'LIST_BY_CYCLE'
});

/**
 * Fronteira de dados do modelo de leitura Pagamento. Mesmo contrato das demais:
 * `{ success, data?, error? }`. Proibido tocar `SpreadsheetApp` (CLAUDE.md §13).
 */
class PagamentoController {
  constructor(pagamentoService) {
    if (!pagamentoService) {
      throw new TypeError('PagamentoController exige uma instância de PagamentoService.');
    }

    this.pagamentoService = pagamentoService;
  }

  handlePagamentoQuery(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Requisição inválida: payload ausente.');
      }

      if (payload.action !== ACOES_PAGAMENTO.LIST_BY_CYCLE) {
        throw new Error(`Requisição inválida: ação "${payload.action}" não é suportada.`);
      }

      if (!payload.idCiclo) {
        throw new Error('Requisição inválida: "idCiclo" é obrigatório.');
      }

      if (!payload.idInfluenciadora) {
        throw new Error('Requisição inválida: "idInfluenciadora" é obrigatório.');
      }

      return {
        success: true,
        data: this.pagamentoService.listarPorCiclo(payload.idCiclo, payload.idInfluenciadora)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   controllers/AuthController.js
   ═══════════════════════════════════════════════════════════════ */

const ACOES_AUTH = Object.freeze({
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  ME: 'ME'
});

/**
 * Fronteira de autenticação. Mesmo contrato das demais:
 * `{ success, data?, error? }`. Proibido tocar infraestrutura (CLAUDE.md §13).
 */
class AuthController {
  constructor(authService) {
    if (!authService) {
      throw new TypeError('AuthController exige uma instância de AuthService.');
    }

    this.authService = authService;
  }

  handleAuth(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Requisição inválida: payload ausente.');
      }

      if (payload.action === ACOES_AUTH.LOGIN) {
        return { success: true, data: this.authService.login(payload.cupom, payload.senha) };
      }

      if (payload.action === ACOES_AUTH.ME) {
        return { success: true, data: this.authService.sessaoAtual(payload.token) };
      }

      if (payload.action === ACOES_AUTH.LOGOUT) {
        return { success: true, data: this.authService.logout(payload.token) };
      }

      throw new Error(`Requisição inválida: ação "${payload.action}" não é suportada.`);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

