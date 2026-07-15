/**
 * REPOSITORY: ColaboracaoMensalRepository — persistência da Colaboração
 * Mensal (SPEC-005).
 *
 * Único ponto (junto da ACL) que trata persistência do agregado. Fala
 * exclusivamente com a porta da ACL — nunca toca SpreadsheetApp nem conhece
 * coluna física (RNF-06).
 *
 * - RN-03/CB-03: a competência é persistida num ÚNICO lote da ACL
 *   (tudo ou nada); falha física propaga sem efeito parcial.
 * - existeCompetencia é a base factual da idempotência (RN-09/CB-01) —
 *   a decisão de recusar/no-op pertence ao Service, não a esta camada.
 * - listarPor atende UC-005.03 (consulta por competência e/ou parceira).
 *
 * Não pode conter regra de negócio nem formatar envelope.
 *
 * @param {object} acl ACL da Colaboração Mensal (porta: inserirEmLote,
 *   listarTodas).
 */

this.ColaboracaoMensalRepository = class ColaboracaoMensalRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Persiste todas as Colaborações de uma competência num único lote
   * atômico (RN-03).
   * @param {ColaboracaoMensal[]} colaboracoes
   * @returns {ColaboracaoMensal[]} as mesmas colaborações persistidas.
   */
  salvarTodas(colaboracoes) {
    this.acl.inserirEmLote(colaboracoes);
    return colaboracoes;
  }

  /**
   * Responde se a competência já possui Colaborações compiladas.
   * @param {MesReferencia} mesReferencia
   * @returns {boolean}
   */
  existeCompetencia(mesReferencia) {
    return this.acl
      .listarTodas()
      .some((colaboracao) => colaboracao.mesReferencia.igualA(mesReferencia));
  }

  /**
   * Lista as Colaborações de uma competência, opcionalmente restritas a
   * uma Parceira (UC-005.03).
   * @param {MesReferencia} mesReferencia
   * @param {string} [parceiraId]
   * @returns {ColaboracaoMensal[]}
   */
  listarPor(mesReferencia, parceiraId) {
    return this.acl
      .listarTodas()
      .filter((colaboracao) => colaboracao.mesReferencia.igualA(mesReferencia))
      .filter(
        (colaboracao) =>
          parceiraId === undefined || colaboracao.parceiraId === parceiraId
      );
  }
};
