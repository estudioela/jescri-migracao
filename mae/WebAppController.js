const ACOES_ATIVACAO = Object.freeze({
  CHANGE_STATE: 'CHANGE_STATE'
});

class WebAppController {
  constructor(ativacaoService) {
    if (!ativacaoService) {
      throw new TypeError('WebAppController exige uma instância de AtivacaoService.');
    }

    this.ativacaoService = ativacaoService;
  }

  handleAtivacaoUpdate(payload) {
    try {
      this._validarPayload(payload);

      const ativacao = this.ativacaoService.alterarEstado(payload.idAtivacao, payload.newState);

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

  _validarPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Requisição inválida: payload ausente.');
    }

    if (payload.action !== ACOES_ATIVACAO.CHANGE_STATE) {
      throw new Error(`Requisição inválida: ação "${payload.action}" não é suportada.`);
    }

    if (!payload.idAtivacao) {
      throw new Error('Requisição inválida: "idAtivacao" é obrigatório.');
    }

    if (!payload.newState) {
      throw new Error('Requisição inválida: "newState" é obrigatório.');
    }
  }
}
