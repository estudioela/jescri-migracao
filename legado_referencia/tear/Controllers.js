/* ═══════════════════════════════════════════════════════════════
   controllers/AtivacaoController.js
   ═══════════════════════════════════════════════════════════════ */

const ACOES_ATIVACAO = Object.freeze({
  CHANGE_STATE: 'CHANGE_STATE',
  CHANGE_STATE_ADMIN: 'CHANGE_STATE_ADMIN',
  LIST_BY_CYCLE: 'LIST_BY_CYCLE',
  LIST_ALL_BY_CYCLE: 'LIST_ALL_BY_CYCLE',
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
      this._exigirPayload(payload);

      let ativacao;

      if (payload.action === ACOES_ATIVACAO.CHANGE_STATE) {
        this._exigirCampo(payload, 'idAtivacao');
        this._exigirCampo(payload, 'newState');
        this._exigirCampo(payload, 'idInfluenciadora');
        ativacao = this.ativacaoService.alterarEstado(
          payload.idAtivacao,
          payload.newState,
          payload.idInfluenciadora
        );
      } else if (payload.action === ACOES_ATIVACAO.CHANGE_STATE_ADMIN) {
        this._exigirCampo(payload, 'idAtivacao');
        this._exigirCampo(payload, 'newState');
        ativacao = this.ativacaoService.alterarEstadoComoAdmin(
          payload.idAtivacao,
          payload.newState
        );
      } else {
        throw new Error(`Requisição inválida: ação "${payload.action}" não é suportada.`);
      }

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

      if (payload.action === ACOES_ATIVACAO.LIST_ALL_BY_CYCLE) {
        this._exigirCampo(payload, 'idCiclo');

        return {
          success: true,
          data: this.ativacaoService.listarPorCiclo(payload.idCiclo)
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
   controllers/LogisticaController.js
   ═══════════════════════════════════════════════════════════════ */

const ACOES_LOGISTICA = Object.freeze({
  LIST_BY_CYCLE: 'LIST_BY_CYCLE',
  GET_BY_ID: 'GET_BY_ID',
  REGISTER_SHIPMENT: 'REGISTER_SHIPMENT',
  CHANGE_STATUS: 'CHANGE_STATUS',
  // Ações do Painel Admin: autoridade é o ADMIN_TOKEN no entrypoint, não a
  // sessão de parceira — por isso não exigem `idInfluenciadora`.
  LIST_ALL_BY_CYCLE: 'LIST_ALL_BY_CYCLE',
  CHANGE_STATUS_ADMIN: 'CHANGE_STATUS_ADMIN'
});

/**
 * Fronteira da logística. Mesmo envelope das demais: `{ success, data?, error? }`.
 * Só aqui a exceção de domínio vira `{success:false}`. Proibido tocar
 * `SpreadsheetApp` (CLAUDE.md §13).
 */
class LogisticaController {
  constructor(logisticaService) {
    if (!logisticaService) {
      throw new TypeError('LogisticaController exige uma instância de LogisticaService.');
    }

    this.logisticaService = logisticaService;
  }

  handleLogisticaQuery(payload) {
    try {
      this._exigirPayload(payload);

      if (payload.action === ACOES_LOGISTICA.LIST_BY_CYCLE) {
        this._exigirCampo(payload, 'idCiclo');
        this._exigirCampo(payload, 'idInfluenciadora');

        return {
          success: true,
          data: this.logisticaService.listarDaInfluenciadoraNoCiclo(payload.idCiclo, payload.idInfluenciadora)
        };
      }

      if (payload.action === ACOES_LOGISTICA.GET_BY_ID) {
        this._exigirCampo(payload, 'idLogistica');
        this._exigirCampo(payload, 'idInfluenciadora');

        return {
          success: true,
          data: this.logisticaService.obter(payload.idLogistica, payload.idInfluenciadora)
        };
      }

      // Painel Admin: lista TODOS os envios do ciclo, sem escopo de parceira.
      if (payload.action === ACOES_LOGISTICA.LIST_ALL_BY_CYCLE) {
        this._exigirCampo(payload, 'idCiclo');

        return {
          success: true,
          data: this.logisticaService.listarPorCiclo(payload.idCiclo)
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

  handleLogisticaUpdate(payload) {
    try {
      this._exigirPayload(payload);

      if (payload.action === ACOES_LOGISTICA.REGISTER_SHIPMENT) {
        this._exigirCampo(payload, 'idLogistica');
        this._exigirCampo(payload, 'codigoRastreio');
        this._exigirCampo(payload, 'idInfluenciadora');

        return {
          success: true,
          data: this.logisticaService.registrarEnvio(payload.idLogistica, payload.codigoRastreio, payload.idInfluenciadora),
          message: 'Envio registrado com sucesso'
        };
      }

      if (payload.action === ACOES_LOGISTICA.CHANGE_STATUS) {
        this._exigirCampo(payload, 'idLogistica');
        this._exigirCampo(payload, 'newStatus');
        this._exigirCampo(payload, 'idInfluenciadora');

        return {
          success: true,
          data: this.logisticaService.alterarStatus(payload.idLogistica, payload.newStatus, payload.idInfluenciadora),
          message: 'Status atualizado com sucesso'
        };
      }

      // Painel Admin: altera o status de qualquer envio, sem escopo de parceira.
      if (payload.action === ACOES_LOGISTICA.CHANGE_STATUS_ADMIN) {
        this._exigirCampo(payload, 'idLogistica');
        this._exigirCampo(payload, 'newStatus');

        return {
          success: true,
          data: this.logisticaService.alterarStatusComoAdmin(payload.idLogistica, payload.newStatus),
          message: 'Status atualizado com sucesso'
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


/* ═══════════════════════════════════════════════════════════════
   controllers/ParceiroController.js
   ═══════════════════════════════════════════════════════════════ */

const ACOES_PARCEIRO = Object.freeze({
  FIND_BY_FIELD: 'FIND_BY_FIELD',
  LIST_ALL: 'LIST_ALL',
  GET_BY_ID: 'GET_BY_ID',
  UPSERT: 'UPSERT',
  SET_STATUS: 'SET_STATUS'
});

class ParceiroController {
  constructor(parceiroService) {
    if (!parceiroService) {
      throw new TypeError('ParceiroController exige uma instância de ParceiroService.');
    }

    this.parceiroService = parceiroService;
  }

  /**
   * Consulta: preenchimento inteligente (FIND_BY_FIELD), índice administrativo
   * (LIST_ALL) e leitura por identidade para prefill (GET_BY_ID). Mesmo envelope
   * de leitura das demais.
   */
  handleParceiroQuery(payload) {
    try {
      if (!payload) {
        throw new Error('Ação de consulta de parceira inválida.');
      }

      switch (payload.action) {
        case ACOES_PARCEIRO.FIND_BY_FIELD:
          return { success: true, data: this.parceiroService.buscar(payload.campo, payload.valor) };
        case ACOES_PARCEIRO.LIST_ALL:
          return { success: true, data: this.parceiroService.listarTodas() };
        case ACOES_PARCEIRO.GET_BY_ID:
          return { success: true, data: this.parceiroService.obterPorId(payload.id) };
        default:
          throw new Error('Ação de consulta de parceira inválida.');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Escrita: upsert (UPSERT) e desativação/reativação (SET_STATUS — o "delete"
   * do CRUD, soft-delete). Exceção de domínio vira envelope aqui, como no resto.
   */
  handleParceiroCommand(payload) {
    try {
      if (!payload) {
        throw new Error('Ação de escrita de parceira inválida.');
      }

      switch (payload.action) {
        case ACOES_PARCEIRO.UPSERT:
          return { success: true, data: this.parceiroService.salvar(payload.dados), message: 'Cadastro salvo.' };
        case ACOES_PARCEIRO.SET_STATUS:
          return {
            success: true,
            data: this.parceiroService.definirStatus(payload.chave, payload.status),
            message: 'Status atualizado.'
          };
        default:
          throw new Error('Ação de escrita de parceira inválida.');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
/* ─────────────────────────────────────────────────────────────────────────────
   Os entrypoints globais `apiBuscarParceira`/`apiSalvarParceira` vivem em
   Roteador.js — únicos e protegidos por `_exigirAdmin`. As cópias legadas que
   existiam aqui acessavam o Repository direto, SEM gate de admin nem validação
   de Service; como todo arquivo do Apps Script divide o mesmo escopo global,
   elas sobrescreviam silenciosamente as versões seguras. Removidas.
   ───────────────────────────────────────────────────────────────────────────── */