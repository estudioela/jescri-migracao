/**
 * AGREGADO RAIZ: ObrigacaoFinanceira (SPEC-020 §6.2)
 *
 * Pagamento devido a uma Parceira — mensal (nasce da Colaboração Mensal
 * compilada, UC-020.01) ou avulso (extra/UGC, fora do mês padrão, RN-04).
 *
 * Invariantes preservadas:
 * - INV-01: toda Obrigação pertence a exatamente uma Parceira.
 * - INV-02: valor e estado sempre presentes; estado no Enum canônico.
 * - INV-03: Obrigação arquivada (`Pago`) é somente leitura.
 * - §9: máquina de estados fechada EmAberto → Aprovado → Pago (terminal,
 *   arquiva); transição inválida falha barulhento (PG-03).
 * - RN-04/CB-01: Obrigação `Avulso` pode não ter competência (período livre).
 *
 * A elegibilidade de `liberar()` (Q-04) NÃO pertence a este agregado — é
 * regra do Service (PagamentoService), que precisa consultar o estado do
 * conteúdo (Entrega, SPEC-012). Este domínio não conhece Entrega.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna
 * física, Entrega/Briefing (fronteira SPEC-012).
 */

this.ObrigacaoFinanceira = class ObrigacaoFinanceira {
  /**
   * @param {string} id identidade estável e opaca da Obrigação.
   * @param {string} parceiraId identidade da Parceira (INV-01).
   * @param {'Mensal'|'Avulso'} tipo tipo canônico fechado.
   * @param {MesReferencia|null} mesReferencia competência da Colaboração
   *   Mensal — obrigatória para `Mensal`; opcional para `Avulso` (CB-01).
   * @param {number} valor valor da Obrigação (INV-02).
   */
  constructor(id, parceiraId, tipo, mesReferencia, valor) {
    const idTexto = String(id == null ? '' : id).trim();
    if (idTexto === '') {
      throw new Error('INV-01: toda Obrigação Financeira exige identidade própria.');
    }
    const parceiraIdTexto = String(parceiraId == null ? '' : parceiraId).trim();
    if (parceiraIdTexto === '') {
      throw new Error('INV-01: toda Obrigação Financeira pertence a uma Parceira.');
    }
    if (tipo !== 'Mensal' && tipo !== 'Avulso') {
      throw new Error("Tipo de Obrigação Financeira desconhecido: '" + tipo + "'.");
    }
    if (tipo === 'Mensal' && !(mesReferencia instanceof MesReferencia)) {
      throw new Error('RN-01: Obrigação Mensal exige a competência da Colaboração (§9).');
    }
    if (mesReferencia !== null && !(mesReferencia instanceof MesReferencia)) {
      throw new Error('Competência inválida — esperado MesReferencia ou null (CB-01).');
    }
    if (typeof valor !== 'number' || !isFinite(valor)) {
      throw new Error("INV-02: valor da Obrigação Financeira inválido: '" + valor + "'.");
    }
    this.id = idTexto;
    this.parceiraId = parceiraIdTexto;
    this.tipo = tipo;
    this.mesReferencia = mesReferencia;
    this.valor = valor;
    // §9: nasce EmAberto (RN-01).
    this.estado = 'EmAberto';
    this.dataArquivamento = null;
  }

  /**
   * EmAberto → Aprovado (§9): a elegibilidade (Q-04) já foi verificada pelo
   * chamador (Service) antes de invocar esta transição.
   * @returns {ObrigacaoFinanceira}
   * @throws {Error} PG-03 fora de EmAberto.
   */
  liberar() {
    if (this.estado !== 'EmAberto') {
      throw new Error(
        "PG-03: transição inválida (§9) — liberar exige 'EmAberto', estado atual: '" +
          this.estado +
          "'."
      );
    }
    this.estado = 'Aprovado';
    return this;
  }

  /**
   * Aprovado → Pago (§9), terminal: arquiva automaticamente (RN-03).
   * @param {Date} dataArquivamento data do arquivamento (relógio injetado).
   * @returns {ObrigacaoFinanceira}
   * @throws {Error} PG-03 fora de Aprovado, ou já Pago (CB-02).
   */
  pagar(dataArquivamento) {
    if (this.estado === 'Pago') {
      throw new Error(
        "PG-03: transição inválida (§9/CB-02) — 'Pago' é terminal, a Obrigação '" +
          this.id +
          "' já foi paga."
      );
    }
    if (this.estado !== 'Aprovado') {
      throw new Error(
        "PG-03: transição inválida (§9) — pagar exige 'Aprovado', estado atual: '" +
          this.estado +
          "'."
      );
    }
    if (
      dataArquivamento == null ||
      typeof dataArquivamento.getTime !== 'function' ||
      isNaN(dataArquivamento.getTime())
    ) {
      throw new Error("RN-03: data de arquivamento inválida ao pagar '" + this.id + "'.");
    }
    this.estado = 'Pago';
    this.dataArquivamento = dataArquivamento;
    Object.freeze(this);
    return this;
  }

  /**
   * @returns {boolean}
   */
  estaPaga() {
    return this.estado === 'Pago';
  }
};
