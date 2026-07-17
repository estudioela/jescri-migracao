/**
 * REPOSITORY: EnvioRepository — persistência do Envio (SPEC-016).
 *
 * Único ponto (junto da ACL) que trata persistência do agregado. Fala
 * exclusivamente com a porta da ACL — nunca toca SpreadsheetApp nem conhece
 * coluna física (RNF-02).
 *
 * - RN-01: a materialização por compilação substitui TODOS os Envios da
 *   competência num único lote atômico da ACL (tudo ou nada; falha física
 *   propaga sem efeito parcial).
 * - salvar persiste transições de um Envio existente (upsert pela
 *   identidade permanente na ACL — Parceira × competência).
 * - obterPor/listarPor atendem UC-016.01/02/03 e a query do Portal.
 *
 * Não pode conter regra de negócio nem formatar envelope.
 *
 * @param {object} acl ACL do Envio (porta: substituirCompetencia, salvar,
 *   listarTodos).
 */

this.EnvioRepository = class EnvioRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Recria os Envios de uma competência num único lote atômico (RN-01).
   * @param {MesReferencia} mesReferencia
   * @param {Envio[]} envios recém-materializados da compilação.
   * @returns {Envio[]} os mesmos Envios persistidos.
   */
  recriarCompetencia(mesReferencia, envios) {
    this.acl.substituirCompetencia(mesReferencia, envios);
    return envios;
  }

  /**
   * Base factual para a reconciliação idempotente da compilação (achado F1
   * da auditoria SPEC-012, `docs/_workspace/auditorias/AUDITORIA_SPEC012.md`):
   * a decisão de (re)materializar ou pular pertence ao Service, não aqui.
   * @param {MesReferencia} mesReferencia
   * @returns {boolean}
   */
  existeParaCompetencia(mesReferencia) {
    return this.listarPor(mesReferencia).length > 0;
  }

  /**
   * Persiste o estado atual de um Envio (transições das máquinas §9).
   * @param {Envio} envio
   * @returns {Envio} o mesmo Envio persistido.
   */
  salvar(envio) {
    this.acl.salvar(envio);
    return envio;
  }

  /**
   * Busca um Envio pela identidade permanente (Parceira × competência).
   * @param {MesReferencia} mesReferencia
   * @param {string} parceiraId
   * @returns {Envio|null}
   */
  obterPor(mesReferencia, parceiraId) {
    return (
      this.acl
        .listarTodos()
        .find(
          (envio) => envio.mesReferencia.igualA(mesReferencia) && envio.parceiraId === parceiraId
        ) || null
    );
  }

  /**
   * Lista os Envios de uma competência, opcionalmente por Parceira.
   * @param {MesReferencia} mesReferencia
   * @param {string} [parceiraId]
   * @returns {Envio[]}
   */
  listarPor(mesReferencia, parceiraId) {
    return this.acl
      .listarTodos()
      .filter((envio) => envio.mesReferencia.igualA(mesReferencia))
      .filter((envio) => parceiraId === undefined || envio.parceiraId === parceiraId);
  }
};
