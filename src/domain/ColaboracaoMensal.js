/**
 * AGREGADO RAIZ: ColaboracaoMensal (SPEC-005 §6.2)
 *
 * Participação de uma Parceira em uma MesReferencia. Identidade natural
 * `(parceiraId, mesReferencia)` — INV-01/RN-07: pertence a exatamente uma
 * Parceira e uma competência.
 *
 * Invariantes preservadas:
 * - INV-02/INV-03: contém exatamente um Snapshot Comercial (obrigatório,
 *   imutável — a imutabilidade mora no próprio VO).
 * - §9: nasce 'Ativa' (sem Rascunho — a compilação é atômica);
 *   máquina de estados fechada Ativa → Concluída → Arquivada.
 * - CM-06 (§17): transição de estado inválida falha barulhento.
 * - RN-08: 'Arquivada' é terminal e imutável (agregado congelado).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna
 * física. Não cria agregados vizinhos (§6.4) — apenas o evento MesCompilado
 * os aciona, fora deste agregado.
 */

this.ColaboracaoMensal = class ColaboracaoMensal {
  /**
   * @param {string} parceiraId identidade estável da Parceira (INFLU_KEY canônica).
   * @param {MesReferencia} mesReferencia competência da colaboração (VO).
   * @param {CondicaoComercialSnapshot} snapshot fotografia comercial congelada.
   */
  constructor(parceiraId, mesReferencia, snapshot) {
    const parceiraIdTexto = String(parceiraId == null ? '' : parceiraId).trim();
    if (parceiraIdTexto === '') {
      throw new Error('ColaboracaoMensal exige a identidade da Parceira (RN-07).');
    }
    if (!(mesReferencia instanceof MesReferencia)) {
      throw new Error(
        'CM-02: MesReferencia inválida — ColaboracaoMensal exige o Value Object MesReferencia.'
      );
    }
    if (!(snapshot instanceof CondicaoComercialSnapshot)) {
      throw new Error(
        'CM-04: Snapshot inconsistente — ColaboracaoMensal exige exatamente um CondicaoComercialSnapshot (INV-02).'
      );
    }
    this.parceiraId = parceiraId;
    this.mesReferencia = mesReferencia;
    this.snapshot = snapshot;
    // §9: nasce Ativa; não existe Rascunho (compilação atômica).
    this.estado = 'Ativa';
  }

  /**
   * Igualdade de entidade pela chave natural (Parceira × MesReferencia).
   * O Snapshot não participa da identidade.
   * @param {ColaboracaoMensal} outra
   * @returns {boolean}
   */
  igualA(outra) {
    return (
      outra instanceof ColaboracaoMensal &&
      this.parceiraId === outra.parceiraId &&
      this.mesReferencia.igualA(outra.mesReferencia)
    );
  }

  /**
   * Ativa → Concluída (todas as obrigações concluídas em módulos vizinhos).
   * @returns {ColaboracaoMensal}
   */
  concluir() {
    if (this.estado !== 'Ativa') {
      throw new Error(
        "CM-06: transição de estado inválida — concluir exige 'Ativa', estado atual: '" +
          this.estado +
          "'."
      );
    }
    this.estado = 'Concluída';
    return this;
  }

  /**
   * Concluída → Arquivada (arquivamento explícito). Terminal: congela o
   * agregado inteiro (RN-08 — competência arquivada é imutável).
   * @returns {ColaboracaoMensal}
   */
  arquivar() {
    if (this.estado !== 'Concluída') {
      throw new Error(
        "CM-06: transição de estado inválida — arquivar exige 'Concluída', estado atual: '" +
          this.estado +
          "'."
      );
    }
    this.estado = 'Arquivada';
    Object.freeze(this);
    return this;
  }
};
