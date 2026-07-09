class Ativacao {
  constructor(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new TypeError('Ativacao exige um objeto de dados da ativação.');
    }

    this.dados = dados;
  }

  get id() {
    return this.dados[CAMPOS_ATIVACAO.ID];
  }

  get estadoAtual() {
    return this.dados[CAMPOS_ATIVACAO.ESTADO];
  }

  static get TRANSICOES_PERMITIDAS() {
    const E = ESTADOS_ATIVACAO;

    return Object.freeze({
      [E.PLANEJAMENTO]: [E.PRONTA_PARA_ENVIO, E.ARQUIVADA],
      [E.PRONTA_PARA_ENVIO]: [E.AGUARDANDO_RECEBIMENTO, E.ARQUIVADA],
      [E.AGUARDANDO_RECEBIMENTO]: [E.EM_PRODUCAO, E.ARQUIVADA],
      [E.EM_PRODUCAO]: [E.AGUARDANDO_APROVACAO, E.ARQUIVADA],
      [E.AGUARDANDO_APROVACAO]: [E.APROVADA, E.EM_AJUSTES, E.ARQUIVADA],
      [E.EM_AJUSTES]: [E.AGUARDANDO_APROVACAO, E.ARQUIVADA],
      [E.APROVADA]: [E.AGENDADA, E.ARQUIVADA],
      [E.AGENDADA]: [E.PUBLICADA, E.ARQUIVADA],
      [E.PUBLICADA]: [E.AGUARDANDO_UPLOAD_HD, E.ARQUIVADA],
      [E.AGUARDANDO_UPLOAD_HD]: [E.CONCLUIDA, E.ARQUIVADA],
      [E.CONCLUIDA]: [E.ELEGIVEL_PARA_PAGAMENTO, E.ARQUIVADA],
      [E.ELEGIVEL_PARA_PAGAMENTO]: [E.ARQUIVADA],
      [E.ARQUIVADA]: []
    });
  }

  validateStateTransition(nextState) {
    const conhecidos = Object.values(ESTADOS_ATIVACAO);
    const atual = this.estadoAtual;

    if (!conhecidos.includes(nextState)) {
      throw new Error(`Estado de destino inválido: "${nextState}" não pertence a ESTADOS_ATIVACAO.`);
    }

    if (!conhecidos.includes(atual)) {
      throw new Error(`Ativação ${this.id} está em um estado desconhecido: "${atual}".`);
    }

    if (atual === nextState) {
      throw new Error(`Ativação ${this.id} já está no estado "${atual}".`);
    }

    const permitidas = Ativacao.TRANSICOES_PERMITIDAS[atual];

    if (!permitidas.includes(nextState)) {
      const alternativas = permitidas.length
        ? permitidas.join('", "')
        : 'nenhuma, é um estado terminal';

      throw new Error(
        `Transição proibida na ativação ${this.id}: "${atual}" → "${nextState}". ` +
        `A partir de "${atual}" só é permitido ir para: "${alternativas}".`
      );
    }

    return true;
  }
}
