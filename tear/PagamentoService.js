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
        idPlano: this._texto(plano[CAMPOS_PLANO.ID]),
        idInfluenciadora: this._texto(plano[CAMPOS_PLANO.INFLUENCIADORA]),
        idCiclo: this._texto(plano[CAMPOS_PLANO.CICLO]),
        valorCache: this._texto(plano[CAMPOS_PLANO.VALOR_CACHE]),
        entregaveisAcordados: this._texto(plano[CAMPOS_PLANO.QTD_ENTREGAVEIS]),
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

  _texto(valor) {
    return valor === null || valor === undefined ? '' : String(valor);
  }
}
