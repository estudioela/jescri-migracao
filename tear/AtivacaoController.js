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
