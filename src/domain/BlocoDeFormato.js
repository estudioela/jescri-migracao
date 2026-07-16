/**
 * ENTIDADE (interna ao agregado): BlocoDeFormato (SPEC-009 §4/§6.2)
 *
 * Unidade do Briefing para um formato contratado: look, data de entrega,
 * data de postagem e orientação criativa. Nasce vazio (rascunho) e é
 * preenchido pela equipe (UC-009.01).
 *
 * Invariantes preservadas:
 * - INV-03: `dataAprovacaoInterna` é sempre derivada pela
 *   CalculadoraDeAprovacao no ato do preenchimento — não existe caminho
 *   para informá-la manualmente.
 * - BR-02 (§17): datas inválidas falham fail-fast.
 *
 * Só o agregado Briefing cria e manipula blocos — nenhuma camada externa
 * instancia BlocoDeFormato diretamente.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.BlocoDeFormato = class BlocoDeFormato {
  /**
   * @param {string} rotulo rótulo do bloco (ex.: 'Reels', 'Stories 1').
   */
  constructor(rotulo) {
    const rotuloTexto = String(rotulo == null ? '' : rotulo).trim();
    if (rotuloTexto === '') {
      throw new Error('BlocoDeFormato exige um rótulo de formato (RN-02).');
    }
    this.rotulo = String(rotulo);
    this.look = null;
    this.dataEntrega = null;
    this.dataPostagem = null;
    this.orientacao = null;
    this.dataAprovacaoInterna = null;
  }

  /**
   * Preenche o bloco (UC-009.01) e deriva a data de aprovação interna
   * (RN-01 via CalculadoraDeAprovacao — INV-03).
   * @param {{look: string, dataEntrega: Date, dataPostagem: Date,
   *          orientacao: (string|undefined)}} dados
   * @returns {BlocoDeFormato}
   * @throws {Error} BR-02 quando look ausente ou datas inválidas.
   */
  preencher(dados) {
    if (dados == null || typeof dados !== 'object') {
      throw new Error(
        "BR-02: preenchimento inválido — dados ausentes para o bloco '" +
          this.rotulo +
          "'."
      );
    }
    const lookTexto = String(dados.look == null ? '' : dados.look).trim();
    if (lookTexto === '') {
      throw new Error(
        "BR-02: preenchimento inválido — look/peça é obrigatório no bloco '" +
          this.rotulo +
          "'."
      );
    }
    // Duck-typing (não instanceof): Date pode vir de outro realm (vm).
    if (
      dados.dataEntrega == null ||
      typeof dados.dataEntrega.getTime !== 'function' ||
      isNaN(dados.dataEntrega.getTime())
    ) {
      throw new Error(
        "BR-02: data de entrega inválida no bloco '" + this.rotulo + "'."
      );
    }

    // BR-02 de postagem é validado dentro da Calculadora (fonte única).
    this.dataAprovacaoInterna = CalculadoraDeAprovacao.calcular(dados.dataPostagem);
    this.look = String(dados.look);
    this.dataEntrega = dados.dataEntrega;
    this.dataPostagem = dados.dataPostagem;
    this.orientacao = dados.orientacao == null ? '' : String(dados.orientacao);
    return this;
  }

  /**
   * @returns {boolean} true quando o bloco já foi preenchido (UC-009.01).
   */
  estaPreenchido() {
    return this.dataAprovacaoInterna !== null;
  }
};
