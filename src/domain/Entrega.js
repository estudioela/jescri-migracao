/**
 * AGREGADO RAIZ: Entrega (SPEC-012 §6.2)
 *
 * Unidade de conteúdo contratada num formato, de uma Colaboração Mensal
 * (era "Ativação"). Rastreada do estado inicial até a publicação, com
 * arquivamento automático ao publicar.
 *
 * Invariantes preservadas:
 * - INV-01: toda Entrega referencia uma Colaboração Mensal compilada — a
 *   materialização deriva exclusivamente do Snapshot Comercial (RN-01);
 *   Parceira sem formato contratado → nenhuma Entrega.
 * - INV-02/RNF-01: identificador único e permanente (IdentificadorDeEntrega).
 * - INV-03/RN-02 (§9): máquina de estados fechada com 4 estados canônicos
 *   AguardandoMaterial → EmRevisao → Aprovado → Publicado; transição
 *   inválida falha barulhento (CT-03).
 * - RN-03: concluir o upload leva a EmRevisao; CB-01: upload repetido
 *   substitui o material mantendo identidade e estado.
 * - RN-04: publicar arquiva automaticamente com data de arquivamento
 *   (fornecida pelo chamador — cálculo determinístico e testável, RNF-03).
 * - CB-03: Publicado é terminal — republicar é recusado.
 * - INV-04: Entrega arquivada é somente leitura.
 * - A data de aprovação interna é ESPELHADA do Briefing (SPEC-009 RN-04 /
 *   §14.1) — nunca calculada aqui.
 *
 * Os rótulos de formato são idênticos aos blocos do Briefing (mesma
 * derivação de SPEC-009: um por unidade contratada, com índice quando a
 * quantidade é maior que 1 — ex.: Stories×2 → 'Stories 1', 'Stories 2'),
 * garantindo o espelhamento bloco ↔ Entrega.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna
 * física. Não conhece Briefing (SPEC-009), Envio físico (SPEC-016) nem
 * Pagamento (SPEC-020).
 */

this.Entrega = class Entrega {
  /**
   * @param {string} parceiraId identidade estável da Parceira.
   * @param {MesReferencia} mesReferencia competência da colaboração (VO).
   * @param {string} rotulo rótulo do formato (ex.: 'Stories 1').
   */
  constructor(parceiraId, mesReferencia, rotulo) {
    // O VO valida a composição completa fail-fast (RNF-01).
    this.id = new IdentificadorDeEntrega(parceiraId, mesReferencia, rotulo);
    this.parceiraId = String(parceiraId);
    this.mesReferencia = mesReferencia;
    this.rotulo = String(rotulo);
    // §9: nasce AguardandoMaterial; demais estados só via transições.
    this.estado = 'AguardandoMaterial';
    this.material = null;
    this.dataAprovacaoInterna = null;
    this.dataArquivamento = null;
  }

  /**
   * Materialização (RN-01): uma Entrega por unidade contratada de cada
   * formato do Snapshot Comercial da Colaboração compilada (INV-01).
   * @param {string} parceiraId
   * @param {MesReferencia} mesReferencia
   * @param {CondicaoComercialSnapshot} snapshot fotografia comercial da
   *   Colaboração Mensal compilada (SPEC-005).
   * @returns {Entrega[]} uma Entrega por unidade contratada.
   */
  static materializar(parceiraId, mesReferencia, snapshot) {
    if (!(snapshot instanceof CondicaoComercialSnapshot)) {
      throw new Error(
        'Entrega exige o Snapshot Comercial da Colaboração compilada para materializar (INV-01).'
      );
    }
    const entregas = [];
    snapshot.formatosContratados.forEach((formato) => {
      const quantidade = snapshot.quantidadePorFormato[formato] || 1;
      for (let indice = 1; indice <= quantidade; indice++) {
        const rotulo = quantidade > 1 ? formato + ' ' + indice : formato;
        entregas.push(new Entrega(parceiraId, mesReferencia, rotulo));
      }
    });
    return entregas;
  }

  /**
   * Igualdade de entidade pelo identificador permanente (RNF-01).
   * @param {Entrega} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return outro instanceof Entrega && this.id.igualA(outro.id);
  }

  /**
   * UC-012.02 · Enviar material: AguardandoMaterial → EmRevisao (RN-03).
   * Upload repetido substitui o material mantendo identidade e estado
   * (CB-01).
   * @param {string} url referência ao material enviado.
   * @returns {Entrega}
   * @throws {Error} CT-03 fora de AguardandoMaterial/EmRevisao; INV-04 se
   *   arquivada.
   */
  enviarMaterial(url) {
    if (this.estado === 'Publicado') {
      throw new Error('INV-04: Entrega arquivada é somente leitura.');
    }
    if (this.estado !== 'AguardandoMaterial' && this.estado !== 'EmRevisao') {
      throw new Error(
        "CT-03: transição inválida (§9) — enviar material exige 'AguardandoMaterial' ou 'EmRevisao', estado atual: '" +
          this.estado +
          "'."
      );
    }
    this.material = new LinkDoMaterial(url);
    this.estado = 'EmRevisao';
    return this;
  }

  /**
   * UC-012.03 · Aprovar: EmRevisao → Aprovado.
   * @returns {Entrega}
   * @throws {Error} CT-03 fora de EmRevisao.
   */
  aprovar() {
    if (this.estado !== 'EmRevisao') {
      throw new Error(
        "CT-03: transição inválida (§9) — aprovar exige 'EmRevisao', estado atual: '" +
          this.estado +
          "'."
      );
    }
    this.estado = 'Aprovado';
    return this;
  }

  /**
   * UC-012.03 · Publicar: Aprovado → Publicado (terminal), arquivando
   * automaticamente com a data de arquivamento (RN-04/RNF-03).
   * @param {Date} dataArquivamento data do arquivamento, fornecida pelo
   *   chamador (determinística e testável).
   * @returns {Entrega}
   * @throws {Error} CB-03 se já publicada; CT-03 fora de Aprovado; data de
   *   arquivamento inválida.
   */
  publicar(dataArquivamento) {
    if (this.estado === 'Publicado') {
      throw new Error(
        "CB-03: publicação recusada — 'Publicado' é terminal (§9), a Entrega '" +
          this.id.toString() +
          "' já foi arquivada."
      );
    }
    if (this.estado !== 'Aprovado') {
      throw new Error(
        "CT-03: transição inválida (§9) — publicar exige 'Aprovado', estado atual: '" +
          this.estado +
          "'."
      );
    }
    // Duck-typing (não instanceof): Date pode vir de outro realm (vm).
    if (
      dataArquivamento == null ||
      typeof dataArquivamento.getTime !== 'function' ||
      isNaN(dataArquivamento.getTime())
    ) {
      throw new Error(
        "RN-04: data de arquivamento inválida na publicação da Entrega '" +
          this.id.toString() +
          "'."
      );
    }
    this.estado = 'Publicado';
    this.dataArquivamento = dataArquivamento;
    Object.freeze(this);
    return this;
  }

  /**
   * Espelha a data de aprovação interna derivada no Briefing (SPEC-009
   * RN-04 / §14.1) — a Entrega nunca a calcula.
   * @param {Date} dataAprovacaoInterna
   * @returns {Entrega}
   * @throws {Error} INV-04 se arquivada; data inválida.
   */
  espelharDataAprovacao(dataAprovacaoInterna) {
    if (this.estado === 'Publicado') {
      throw new Error('INV-04: Entrega arquivada é somente leitura.');
    }
    if (
      dataAprovacaoInterna == null ||
      typeof dataAprovacaoInterna.getTime !== 'function' ||
      isNaN(dataAprovacaoInterna.getTime())
    ) {
      throw new Error(
        "Data de aprovação espelhada inválida na Entrega '" + this.id.toString() + "' (§14.1)."
      );
    }
    this.dataAprovacaoInterna = dataAprovacaoInterna;
    return this;
  }
};
