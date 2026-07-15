/**
 * REPOSITORY: BriefingRepository — persistência do Briefing da Colaboração
 * (SPEC-009).
 *
 * Único ponto (junto da ACL) que trata persistência do agregado. Fala
 * exclusivamente com a porta da ACL — nunca toca SpreadsheetApp nem conhece
 * coluna física (RNF-02).
 *
 * - RN-03/CB-02: a recriação por compilação substitui TODOS os briefings da
 *   competência num único lote atômico da ACL (o rascunho anterior é limpo
 *   antes do novo — tudo ou nada; falha física propaga sem efeito parcial).
 * - salvar persiste preenchimento/publicação de um briefing existente
 *   (upsert por identidade natural na ACL).
 * - obterPor/listarPor atendem UC-009.01 e as queries de SPEC-027/023.
 *
 * Não pode conter regra de negócio nem formatar envelope.
 *
 * @param {object} acl ACL do Briefing (porta: substituirCompetencia,
 *   salvar, listarTodos).
 */

this.BriefingRepository = class BriefingRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Recria os briefings de uma competência num único lote atômico:
   * remove os anteriores e grava os novos (RN-03/CB-02).
   * @param {MesReferencia} mesReferencia
   * @param {Briefing[]} briefings rascunhos recém-derivados da compilação.
   * @returns {Briefing[]} os mesmos briefings persistidos.
   */
  recriarCompetencia(mesReferencia, briefings) {
    this.acl.substituirCompetencia(mesReferencia, briefings);
    return briefings;
  }

  /**
   * Persiste o estado atual de um briefing (preenchimento/publicação).
   * @param {Briefing} briefing
   * @returns {Briefing} o mesmo briefing persistido.
   */
  salvar(briefing) {
    this.acl.salvar(briefing);
    return briefing;
  }

  /**
   * Busca o briefing de uma Parceira numa competência (identidade natural).
   * @param {MesReferencia} mesReferencia
   * @param {string} parceiraId
   * @returns {Briefing|null}
   */
  obterPor(mesReferencia, parceiraId) {
    return (
      this.acl
        .listarTodos()
        .find(
          (briefing) =>
            briefing.mesReferencia.igualA(mesReferencia) &&
            briefing.parceiraId === parceiraId
        ) || null
    );
  }

  /**
   * Lista os briefings de uma competência (query de SPEC-027/023).
   * @param {MesReferencia} mesReferencia
   * @returns {Briefing[]}
   */
  listarPor(mesReferencia) {
    return this.acl
      .listarTodos()
      .filter((briefing) => briefing.mesReferencia.igualA(mesReferencia));
  }
};
