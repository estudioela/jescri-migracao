const EVENTO_ATIVACAO_ESTADO_ALTERADO = 'AtivacaoEstadoAlterado';

class AtivacaoService {
  constructor(eventDispatcher, repository) {
    if (!eventDispatcher) {
      throw new TypeError('AtivacaoService exige um EventDispatcher.');
    }

    this.eventDispatcher = eventDispatcher;
    this.repository = repository || new AtivacaoRepository();
  }

  /**
   * Leitura de todas as ativações de um ciclo, já em DTO.
   *
   * O Service nunca devolve a linha crua do Repository: a UI não pode depender
   * do nome das colunas da planilha, senão trocar Sheets por um banco na V3
   * quebraria o front-end — que é exatamente o que a camada existe para evitar.
   */
  listarPorCiclo(idCiclo) {
    if (!idCiclo) {
      throw new Error('É obrigatório informar o ciclo.');
    }

    return this.repository.findByCiclo(idCiclo).map(linha => this._paraDto(linha));
  }

  /**
   * Escopo por parceira. Sem isto, uma influenciadora autenticada veria as
   * entregas de todas as outras do mesmo ciclo.
   */
  listarDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora) {
    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    return this.listarPorCiclo(idCiclo)
      .filter(dto => dto.idInfluenciadora === String(idInfluenciadora));
  }

  /**
   * O histórico da V2 não é uma aba: é o próprio ciclo de vida da ativação.
   * `Arquivada` é o estado terminal (docs/spec/SCHEMA_V2.md) — nada sai de lá.
   */
  listarArquivadasDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora) {
    return this.listarDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora)
      .filter(dto => dto.estado === ESTADOS_ATIVACAO.ARQUIVADA);
  }

  obter(idAtivacao) {
    const dados = this.repository.getById(idAtivacao);

    if (!dados) {
      throw new Error(`Ativação "${idAtivacao}" não encontrada.`);
    }

    return this._paraDto(dados);
  }

  /**
   * A planilha devolve `Date` para colunas de data e `''` para célula vazia.
   * Serializar aqui evita que cada tela invente seu próprio tratamento — e
   * `google.script.run` não preserva `Date` de forma confiável.
   */
  _paraDto(linha) {
    const C = CAMPOS_ATIVACAO;

    return {
      idAtivacao: this._texto(linha[C.ID]),
      idCiclo: this._texto(linha[C.CICLO]),
      idInfluenciadora: this._texto(linha[C.INFLUENCIADORA]),
      tipoConteudo: this._texto(linha[C.TIPO_CONTEUDO]),
      estado: this._texto(linha[C.ESTADO]),
      lookReferencia: this._texto(linha[C.LOOK]),
      entregaPrevista: this._data(linha[C.ENTREGA_PREVISTA]),
      linkBriefing: this._texto(linha[C.LINK_BRIEFING]),
      linkUploadHd: this._texto(linha[C.LINK_UPLOAD_HD])
    };
  }

  _texto(valor) {
    return valor === null || valor === undefined ? '' : String(valor);
  }

  _data(valor) {
    if (valor instanceof Date) {
      return valor.toISOString();
    }

    return this._texto(valor);
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
