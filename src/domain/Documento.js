/**
 * ENTIDADE: Documento (SPEC-023 §6.2)
 *
 * Documento formal gerado por Parceira: o Contrato individual (Parceiras
 * Ativas, UC-023.01) ou o Briefing formal (Parceiras sinalizadas,
 * UC-023.02), a partir dos dados cadastrais/comerciais e do briefing.
 *
 * Invariantes preservadas:
 * - INV-02: todo documento referencia uma Parceira (identidade obrigatória;
 *   a existência da Parceira é verificada pelo Service, DC-01).
 * - §9: máquina de estados fechada NaoGerado → Gerado, transição única —
 *   regeneração NÃO reabre o estado: cria-se um novo Documento e o
 *   Repository substitui o anterior (CB-03).
 * - Tipos canônicos fechados (ADR-001 §2.1): 'Contrato' | 'BriefingFormal';
 *   desconhecido = erro barulhento. Briefing formal existe por
 *   Parceira × competência; Contrato é individual, sem competência.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna
 * física, motor documental (a mesclagem é da porta Gerador de Documentos).
 */

this.Documento = class Documento {
  /**
   * @param {string} parceiraId identidade estável da Parceira (INV-02).
   * @param {'Contrato'|'BriefingFormal'} tipo tipo canônico fechado.
   * @param {string|null} mesReferencia competência 'AAAA-MM' — obrigatória
   *   para BriefingFormal; null para Contrato.
   */
  constructor(parceiraId, tipo, mesReferencia) {
    const parceiraIdTexto = String(parceiraId == null ? '' : parceiraId).trim();
    if (parceiraIdTexto === '') {
      throw new Error('INV-02: todo documento referencia uma Parceira existente.');
    }
    if (tipo !== 'Contrato' && tipo !== 'BriefingFormal') {
      throw new Error("Tipo de documento desconhecido: '" + tipo + "'.");
    }
    if (tipo === 'BriefingFormal' && (!mesReferencia || !String(mesReferencia).trim())) {
      throw new Error(
        'Briefing formal exige a competência da colaboração (Parceira × mês).'
      );
    }
    this.parceiraId = parceiraId;
    this.tipo = tipo;
    this.mesReferencia = tipo === 'BriefingFormal' ? String(mesReferencia).trim() : null;
    // §9: nasce NaoGerado; Gerado só via gerar().
    this.estado = 'NaoGerado';
    this.referencia = null;
  }

  /**
   * NaoGerado → Gerado (§9): anexa a referência produzida pela porta
   * Gerador de Documentos (§14.2 fornece o documento por referência).
   * @param {string} referencia referência do documento gerado.
   * @returns {Documento}
   */
  gerar(referencia) {
    if (this.estado !== 'NaoGerado') {
      throw new Error(
        "Transição inválida (§9): gerar exige 'NaoGerado', estado atual: '" +
          this.estado +
          "' — regeneração cria um novo Documento (CB-03)."
      );
    }
    const referenciaTexto = String(referencia == null ? '' : referencia).trim();
    if (referenciaTexto === '') {
      throw new Error('Documento não pode ser Gerado sem referência (§14.2).');
    }
    this.referencia = String(referencia);
    this.estado = 'Gerado';
    return this;
  }

  /**
   * @returns {boolean}
   */
  estaGerado() {
    return this.estado === 'Gerado';
  }
};
