/**
 * ENTIDADE: Parceira (agregado raiz)
 *
 * Primeira entidade de domínio do TEAR V2. Representa uma parceira do programa
 * de colaboração.
 *
 * Invariantes preservadas:
 * - RN-01 (SPEC-001 §4 / SPEC-002 §9): nasce Inativa; ativação é sempre manual.
 * - INV-01 (SPEC-002 §11): sempre um e apenas um estado de vínculo.
 * - INV-02: inativar preserva a identidade e os dados cadastrais.
 *
 * Estados canônicos fechados (ADR-001 §2.1): 'Ativa' | 'Inativa'.
 * A coerção cru↔canônico (ON/OFF) pertence à ACL, nunca a esta entidade.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.Parceira = class Parceira {
  constructor(nome) {
    const nomeTexto = String(nome == null ? '' : nome).trim();
    if (nomeTexto === '') {
      throw new Error('Parceira exige nome (identidade INFLU_KEY).');
    }
    this.nome = nome;
    // RN-01: toda Parceira nasce Inativa; nunca ativada automaticamente.
    this.estado = 'Inativa';
  }

  ativar() {
    this.estado = 'Ativa';
    return this;
  }

  inativar() {
    this.estado = 'Inativa';
    return this;
  }

  estaAtiva() {
    return this.estado === 'Ativa';
  }
};
