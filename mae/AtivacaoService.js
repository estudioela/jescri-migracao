const EVENTO_ATIVACAO_ESTADO_ALTERADO = 'AtivacaoEstadoAlterado';

class AtivacaoService {
  constructor(eventDispatcher, repository) {
    if (!eventDispatcher) {
      throw new TypeError('AtivacaoService exige um EventDispatcher.');
    }

    this.eventDispatcher = eventDispatcher;
    this.repository = repository || new AtivacaoRepository();
  }

  alterarEstado(idAtivacao, novoEstado) {
    const dados = this.repository.getById(idAtivacao);

    if (!dados) {
      throw new Error(`Ativação "${idAtivacao}" não encontrada.`);
    }

    const ativacao = new Ativacao(dados);
    ativacao.validateStateTransition(novoEstado);

    const estadoAnterior = ativacao.estadoAtual;

    const atualizado = Object.assign({}, dados);
    atualizado[CAMPOS_ATIVACAO.ESTADO] = novoEstado;

    const salvo = this.repository.save(atualizado);

    const dto = {
      idAtivacao: salvo[CAMPOS_ATIVACAO.ID],
      estadoAnterior: estadoAnterior,
      novoEstado: novoEstado,
      atualizadoEm: new Date().toISOString()
    };

    this.eventDispatcher.dispatch(EVENTO_ATIVACAO_ESTADO_ALTERADO, dto);

    return dto;
  }
}
