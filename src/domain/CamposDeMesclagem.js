/**
 * VALUE OBJECT: CamposDeMesclagem (SPEC-023 §6.1)
 *
 * Conjunto dos dados cadastrais/comerciais mesclados nos documentos:
 * razão social, CNPJ, endereço, quantidades por formato, valor (número e
 * por extenso), escopo/prazo de uso de imagem e cidade/data de assinatura.
 *
 * Invariantes preservadas:
 * - DC-02 (§17): campo de mesclagem ausente ou inválido falha barulhento
 *   identificando o campo — nenhum documento é gerado com lacunas.
 * - RN-03: o VO fotografa os termos vigentes no instante da geração —
 *   imutável após criação (congelamento profundo).
 * - Diferente do Snapshot Comercial (SPEC-005), este VO CONTÉM PII
 *   (CNPJ, endereço) legitimamente: o destino é o documento do
 *   destinatário (RNF-01). PII nunca sai daqui para log/evento.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna
 * física.
 */

this.CamposDeMesclagem = class CamposDeMesclagem {
  /**
   * @param {{razaoSocial: string, cnpj: string, endereco: string,
   *          quantidades: Object<string, string>, valorNumero: number,
   *          valorExtenso: string, canaisUsoImagem: string,
   *          prazoUsoImagem: string, cidadeAssinatura: string,
   *          dataAssinatura: string}} campos dados vigentes da Parceira.
   * @throws {Error} DC-02 quando qualquer campo está ausente ou inválido.
   */
  constructor(campos) {
    if (campos == null || typeof campos !== 'object') {
      throw new Error('DC-02: campos de mesclagem ausentes (§17).');
    }

    const textos = [
      'razaoSocial',
      'cnpj',
      'endereco',
      'valorExtenso',
      'canaisUsoImagem',
      'prazoUsoImagem',
      'cidadeAssinatura',
      'dataAssinatura',
    ];
    textos.forEach((nome) => {
      const texto = String(campos[nome] == null ? '' : campos[nome]).trim();
      if (texto === '') {
        throw new Error("DC-02: campo de mesclagem ausente — '" + nome + "' (§17).");
      }
    });

    const valorNumero = campos.valorNumero;
    if (typeof valorNumero !== 'number' || !isFinite(valorNumero) || valorNumero < 0) {
      throw new Error("DC-02: campo de mesclagem ausente — 'valorNumero' (§17).");
    }

    const quantidades = campos.quantidades;
    if (
      quantidades == null ||
      typeof quantidades !== 'object' ||
      Array.isArray(quantidades) ||
      Object.keys(quantidades).length === 0
    ) {
      throw new Error("DC-02: campo de mesclagem ausente — 'quantidades' (§17).");
    }

    textos.forEach((nome) => {
      this[nome] = String(campos[nome]).trim();
    });
    this.valorNumero = valorNumero;
    this.quantidades = Object.freeze(Object.assign({}, quantidades));
    Object.freeze(this);
  }
};
