/* ═══════════════════════════════════════════════════════════════
   services/AtivacaoService.js
   ═══════════════════════════════════════════════════════════════ */

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

  obter(idAtivacao, idInfluenciadora) {
    return this._paraDto(this._exigirPropria(idAtivacao, idInfluenciadora));
  }

  /**
   * Posse, antes de qualquer leitura ou escrita de UMA ativação.
   *
   * `listarDaInfluenciadoraNoCiclo` já filtrava por parceira, mas `obter` e
   * `alterarEstado` recebiam só o id da ativação: bastava trocar o argumento
   * para ler — e alterar o estado — a entrega de outra influenciadora.
   *
   * "Não é sua" e "não existe" devolvem a MESMA mensagem: distinguir as duas
   * revelaria quais ids existem na planilha.
   */
  _exigirPropria(idAtivacao, idInfluenciadora) {
    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    const dados = this.repository.getById(idAtivacao);
    const propria = dados &&
      String(dados[CAMPOS_ATIVACAO.INFLUENCIADORA]) === String(idInfluenciadora);

    if (!propria) {
      throw new Error(`Ativação "${idAtivacao}" não encontrada.`);
    }

    return dados;
  }

  /**
   * A planilha devolve `Date` para colunas de data e `''` para célula vazia.
   * Serializar aqui evita que cada tela invente seu próprio tratamento — e
   * `google.script.run` não preserva `Date` de forma confiável.
   */
  _paraDto(linha) {
    const C = CAMPOS_ATIVACAO;

    return {
      idAtivacao: textoDeCelula(linha[C.ID]),
      idCiclo: textoDeCelula(linha[C.CICLO]),
      idInfluenciadora: textoDeCelula(linha[C.INFLUENCIADORA]),
      tipoConteudo: textoDeCelula(linha[C.TIPO_CONTEUDO]),
      estado: textoDeCelula(linha[C.ESTADO]),
      lookReferencia: textoDeCelula(linha[C.LOOK]),
      entregaPrevista: dataIsoDeCelula(linha[C.ENTREGA_PREVISTA]),
      linkBriefing: textoDeCelula(linha[C.LINK_BRIEFING]),
      linkUploadHd: textoDeCelula(linha[C.LINK_UPLOAD_HD])
    };
  }

  alterarEstado(idAtivacao, novoEstado, idInfluenciadora) {
    const dados = this._exigirPropria(idAtivacao, idInfluenciadora);

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

/* ═══════════════════════════════════════════════════════════════
   services/CicloService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Orquestra a leitura de ciclos. Devolve DTO, nunca a linha crua do Repository:
 * a UI não pode depender do nome das colunas da planilha.
 *
 * Ciclo não tem invariante de negócio hoje (nenhuma transição, nenhuma regra),
 * então não existe Entity `Ciclo`. Criar uma classe vazia só para simetria com
 * `Ativacao` seria abstração antecipada — CLAUDE.md §12.3.
 */
class CicloService {
  constructor(repository) {
    this.repository = repository || new CicloRepository();
  }

  listar() {
    return this.repository.listarTodos().map(linha => this._paraDto(linha));
  }

  _paraDto(linha) {
    const C = CAMPOS_CICLO;

    return {
      idCiclo: textoDeCelula(linha[C.ID]),
      nome: textoDeCelula(linha[C.NOME]) || textoDeCelula(linha[C.ID]),
      inicioLogistica: dataIsoDeCelula(linha[C.INICIO_LOGISTICA]),
      fimOperacao: dataIsoDeCelula(linha[C.FIM_OPERACAO])
    };
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/PagamentoService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Pagamento é um MODELO DE LEITURA derivado, não uma entidade persistida.
 * A V2 não tem aba de pagamentos: a informação já existe em
 * `Planos_Colaboracao` (o quanto foi acordado) cruzada com `Ativacoes`
 * (o que de fato foi entregue).
 *
 * ⚠️ A regra de elegibilidade abaixo foi DERIVADA da máquina de estados, não
 * extraída de uma especificação de negócio — mesma ressalva que
 * `docs/spec/SCHEMA_V2.md` faz sobre o grafo de transições. Confirmar com o
 * usuário antes de tratar como definitiva.
 */
class PagamentoService {
  constructor(planoRepository, ativacaoRepository) {
    if (!planoRepository || !ativacaoRepository) {
      throw new TypeError('PagamentoService exige PlanoRepository e AtivacaoRepository.');
    }

    this.planoRepository = planoRepository;
    this.ativacaoRepository = ativacaoRepository;
  }

  /** Escopo por parceira: ninguém vê o cachê acordado com outra influenciadora. */
  listarPorCiclo(idCiclo, idInfluenciadora) {
    if (!idCiclo) {
      throw new Error('É obrigatório informar o ciclo.');
    }

    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    const ativacoesPorInfluenciadora = this._agruparPorInfluenciadora(
      this.ativacaoRepository.findByCiclo(idCiclo)
    );

    const planos = this.planoRepository
      .findByCiclo(idCiclo)
      .filter(plano => String(plano[CAMPOS_PLANO.INFLUENCIADORA]) === String(idInfluenciadora));

    return planos.map(plano => {
      const ativacoes = ativacoesPorInfluenciadora[plano[CAMPOS_PLANO.INFLUENCIADORA]] || [];

      return {
        idPlano: textoDeCelula(plano[CAMPOS_PLANO.ID]),
        idInfluenciadora: textoDeCelula(plano[CAMPOS_PLANO.INFLUENCIADORA]),
        idCiclo: textoDeCelula(plano[CAMPOS_PLANO.CICLO]),
        valorCache: textoDeCelula(plano[CAMPOS_PLANO.VALOR_CACHE]),
        entregaveisAcordados: textoDeCelula(plano[CAMPOS_PLANO.QTD_ENTREGAVEIS]),
        entregaveisConcluidos: this._contarConcluidas(ativacoes),
        estado: this._estadoDoPagamento(ativacoes)
      };
    });
  }

  _agruparPorInfluenciadora(ativacoes) {
    return ativacoes.reduce((mapa, ativacao) => {
      const chave = ativacao[CAMPOS_ATIVACAO.INFLUENCIADORA];

      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(ativacao);

      return mapa;
    }, {});
  }

  _contarConcluidas(ativacoes) {
    const finais = [
      ESTADOS_ATIVACAO.CONCLUIDA,
      ESTADOS_ATIVACAO.ELEGIVEL_PARA_PAGAMENTO,
      ESTADOS_ATIVACAO.ARQUIVADA
    ];

    return ativacoes.filter(a => finais.indexOf(a[CAMPOS_ATIVACAO.ESTADO]) !== -1).length;
  }

  /**
   * Elegível só quando NENHUMA entrega do ciclo está pendente. Um plano sem
   * ativação nenhuma é `Pendente`, nunca elegível — senão um cadastro
   * incompleto pareceria pronto para pagar.
   */
  _estadoDoPagamento(ativacoes) {
    if (!ativacoes.length) {
      return 'Pendente';
    }

    const liberadas = [ESTADOS_ATIVACAO.ELEGIVEL_PARA_PAGAMENTO, ESTADOS_ATIVACAO.ARQUIVADA];
    const todasLiberadas = ativacoes.every(a => liberadas.indexOf(a[CAMPOS_ATIVACAO.ESTADO]) !== -1);

    return todasLiberadas ? 'Elegível para Pagamento' : 'Pendente';
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/AuthService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Autenticação da V2.
 *
 * Nenhum DTO daqui carrega `Senha_Hash`. Nenhuma mensagem de erro distingue
 * "cupom não existe" de "senha errada": a diferença permitiria enumerar
 * parceiras cadastradas.
 */
/** Formato `salt$hash` válido, senha nenhuma. Só existe para gastar o mesmo tempo. */
const HASH_FICTICIO_PARA_TEMPO_CONSTANTE =
  '00000000-0000-0000-0000-000000000000$' +
  '0000000000000000000000000000000000000000000000000000000000000000';

class AuthService {
  constructor(parceiroRepository, sessaoRepository) {
    if (!parceiroRepository || !sessaoRepository) {
      throw new TypeError('AuthService exige ParceiroRepository e SessaoRepository.');
    }

    this.parceiroRepository = parceiroRepository;
    this.sessaoRepository = sessaoRepository;
  }

  login(cupom, senha) {
    if (!cupom || !senha) {
      throw new Error('Informe o cupom e a senha.');
    }

    if (this.sessaoRepository.estaBloqueado(cupom)) {
      throw new Error('Muitas tentativas. Tente novamente em alguns minutos.');
    }

    const parceiro = this.parceiroRepository.findByCupom(cupom);

    // Hash fictício, com formato válido, para cupom inexistente: sem ele, o
    // caminho "não existe" não calcularia SHA-256 e responderia mais rápido que
    // "senha errada" — um oráculo de tempo que permite enumerar cupons apesar
    // de as mensagens serem idênticas.
    const armazenado = parceiro
      ? parceiro[CAMPOS_PARCEIRO.SENHA_HASH]
      : HASH_FICTICIO_PARA_TEMPO_CONSTANTE;

    const senhaCorreta = senhaConfere(senha, armazenado);

    // Uma parceira sem senha definida não loga — a aba nasce sem credencial.
    if (!parceiro || !senhaCorreta) {
      this.sessaoRepository.registrarTentativa(cupom);
      throw new Error('Cupom ou senha inválidos.');
    }

    this.sessaoRepository.limparTentativas(cupom);

    return {
      token: this.sessaoRepository.criar(parceiro[CAMPOS_PARCEIRO.ID]),
      perfil: this._paraDto(parceiro)
    };
  }

  sessaoAtual(token) {
    const idInfluenciadora = this.sessaoRepository.resolver(token);

    if (!idInfluenciadora) {
      throw new Error('Sessão expirada. Entre novamente.');
    }

    const parceiro = this.parceiroRepository.getById(idInfluenciadora);

    if (!parceiro) {
      throw new Error('Sessão expirada. Entre novamente.');
    }

    return this._paraDto(parceiro);
  }

  logout(token) {
    this.sessaoRepository.destruir(token);

    return { encerrada: true };
  }

  /** `Senha_Hash` e `Cupom` não saem daqui. */
  _paraDto(parceiro) {
    return {
      idInfluenciadora: textoDeCelula(parceiro[CAMPOS_PARCEIRO.ID]),
      nome: textoDeCelula(parceiro[CAMPOS_PARCEIRO.NOME]),
      statusContrato: textoDeCelula(parceiro[CAMPOS_PARCEIRO.STATUS_CONTRATO]),
      categoria: textoDeCelula(parceiro[CAMPOS_PARCEIRO.CATEGORIA])
    };
  }
}

