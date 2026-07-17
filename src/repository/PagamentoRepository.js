/**
 * REPOSITORY: PagamentoRepository — persistência da Obrigação Financeira
 * (SPEC-020).
 *
 * Único ponto (junto da ACL) que trata persistência do agregado. Fala
 * exclusivamente com a porta da ACL — nunca toca SpreadsheetApp nem conhece
 * coluna física.
 *
 * Não pode conter regra de negócio nem formatar envelope.
 *
 * @param {PagamentoACL} acl ACL única da Obrigação Financeira.
 */

this.PagamentoRepository = class PagamentoRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Materializa as Obrigações Mensais da competência num único lote (RN-01).
   * @param {MesReferencia} mesReferencia
   * @param {ObrigacaoFinanceira[]} obrigacoes
   * @returns {ObrigacaoFinanceira[]} as mesmas Obrigações persistidas.
   */
  materializarCompetencia(mesReferencia, obrigacoes) {
    this.acl.substituirCompetencia(mesReferencia, obrigacoes);
    return obrigacoes;
  }

  /**
   * Base factual para a idempotência da materialização mensal (mesmo padrão
   * de EntregaRepository/EnvioRepository — achado F1/F2 da auditoria
   * SPEC-012): existe alguma Obrigação Mensal já lançada nesta competência?
   * @param {MesReferencia} mesReferencia
   * @returns {boolean}
   */
  existeParaCompetencia(mesReferencia) {
    return this.listarPor(mesReferencia).some((obrigacao) => obrigacao.tipo === 'Mensal');
  }

  /**
   * Persiste uma Obrigação (lançamento avulso individual ou transição de
   * uma existente).
   * @param {ObrigacaoFinanceira} obrigacao
   * @returns {ObrigacaoFinanceira} a mesma Obrigação persistida.
   */
  salvar(obrigacao) {
    this.acl.salvar(obrigacao);
    return obrigacao;
  }

  /**
   * Busca uma Obrigação pela identidade (PG-01).
   * @param {string} id
   * @returns {ObrigacaoFinanceira|null}
   */
  obterPor(id) {
    return this.acl.listarTodos().find((obrigacao) => obrigacao.id === String(id).trim()) || null;
  }

  /**
   * Lista as Obrigações da competência, opcionalmente por Parceira.
   * @param {MesReferencia} mesReferencia
   * @param {string} [parceiraId]
   * @returns {ObrigacaoFinanceira[]}
   */
  listarPor(mesReferencia, parceiraId) {
    return this.acl
      .listarTodos()
      .filter(
        (obrigacao) => obrigacao.mesReferencia !== null && obrigacao.mesReferencia.igualA(mesReferencia)
      )
      .filter((obrigacao) => parceiraId === undefined || obrigacao.parceiraId === parceiraId);
  }
};
