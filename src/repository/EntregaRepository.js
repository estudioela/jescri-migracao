/**
 * REPOSITORY: EntregaRepository — persistência da Entrega (SPEC-012).
 *
 * Único ponto (junto da ACL) que trata persistência do agregado. Fala
 * exclusivamente com a porta da ACL — nunca toca SpreadsheetApp nem conhece
 * coluna física (RNF-02).
 *
 * - RN-01: a materialização por compilação substitui TODAS as Entregas da
 *   competência num único lote atômico da ACL (tudo ou nada; falha física
 *   propaga sem efeito parcial).
 * - salvar persiste transições de uma Entrega existente (upsert pela
 *   identidade permanente na ACL — RNF-01).
 * - obterPor/listarPor atendem UC-012.01/02/03 e as queries de SPEC-027.
 *
 * Não pode conter regra de negócio nem formatar envelope.
 *
 * @param {object} acl ACL da Entrega (porta: substituirCompetencia,
 *   salvar, listarTodos).
 */

this.EntregaRepository = class EntregaRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Recria as Entregas de uma competência num único lote atômico (RN-01).
   * @param {MesReferencia} mesReferencia
   * @param {Entrega[]} entregas recém-materializadas da compilação.
   * @returns {Entrega[]} as mesmas Entregas persistidas.
   */
  recriarCompetencia(mesReferencia, entregas) {
    this.acl.substituirCompetencia(mesReferencia, entregas);
    return entregas;
  }

  /**
   * Persiste o estado atual de uma Entrega (transições da máquina §9).
   * @param {Entrega} entrega
   * @returns {Entrega} a mesma Entrega persistida.
   */
  salvar(entrega) {
    this.acl.salvar(entrega);
    return entrega;
  }

  /**
   * Busca uma Entrega pela identidade permanente (parceira × competência ×
   * rótulo — RNF-01).
   * @param {MesReferencia} mesReferencia
   * @param {string} parceiraId
   * @param {string} rotulo
   * @returns {Entrega|null}
   */
  obterPor(mesReferencia, parceiraId, rotulo) {
    return (
      this.acl
        .listarTodos()
        .find(
          (entrega) =>
            entrega.mesReferencia.igualA(mesReferencia) &&
            entrega.parceiraId === parceiraId &&
            entrega.rotulo === rotulo
        ) || null
    );
  }

  /**
   * Lista as Entregas de uma competência, opcionalmente por Parceira
   * (UC-012.01; query de SPEC-027).
   * @param {MesReferencia} mesReferencia
   * @param {string} [parceiraId]
   * @returns {Entrega[]}
   */
  listarPor(mesReferencia, parceiraId) {
    return this.acl
      .listarTodos()
      .filter((entrega) => entrega.mesReferencia.igualA(mesReferencia))
      .filter(
        (entrega) => parceiraId === undefined || entrega.parceiraId === parceiraId
      );
  }
};
