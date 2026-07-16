/**
 * AGREGADO RAIZ: Briefing da Colaboração (SPEC-009 §6.2)
 *
 * Conjunto de orientações e prazos, por formato, de uma Colaboração Mensal.
 * Identidade natural `(parceiraId, mesReferencia)` — INV-01: todo Briefing
 * pertence a exatamente uma Colaboração Mensal.
 *
 * Invariantes preservadas:
 * - INV-02/RN-02: todo bloco corresponde a um formato contratado da
 *   Parceira — os blocos são derivados exclusivamente do Snapshot Comercial
 *   da Colaboração (formatosContratados × quantidadePorFormato).
 * - CB-03: Parceira sem formato contratado → nenhum bloco criado.
 * - §9: máquina de estados fechada Rascunho → Publicado; publicar exige
 *   todos os blocos preenchidos; transição inválida falha barulhento.
 * - RN-03/CB-02: a recriação por compilação pertence ao Service/Repository —
 *   o agregado apenas nasce sempre como Rascunho vazio.
 *
 * DECISÃO LOCAL (vocabulário de blocos): a SPEC-009 enumera os blocos do
 * contrato padrão ('Reel, Carrossel, Stories 1, Stories 2'); o vocabulário
 * canônico de formatos do projeto (M1/SPEC-005) é 'Reels', 'Carrossel',
 * 'Stories' com `quantidadePorFormato`. A derivação aqui é genérica: um
 * bloco por unidade contratada, rotulado com índice quando a quantidade é
 * maior que 1 (ex.: Stories×2 → 'Stories 1', 'Stories 2'). O contrato
 * padrão produz exatamente os 4 blocos da SPEC.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna
 * física. Não conhece o estado da Entrega (SPEC-012) nem Envio/Pagamento.
 */

this.Briefing = class Briefing {
  /**
   * @param {string} parceiraId identidade estável da Parceira.
   * @param {MesReferencia} mesReferencia competência da colaboração (VO).
   * @param {BlocoDeFormato[]} blocos blocos derivados dos formatos contratados.
   */
  constructor(parceiraId, mesReferencia, blocos) {
    const parceiraIdTexto = String(parceiraId == null ? '' : parceiraId).trim();
    if (parceiraIdTexto === '') {
      throw new Error('Briefing exige a identidade da Parceira (INV-01).');
    }
    if (!(mesReferencia instanceof MesReferencia)) {
      throw new Error(
        'Briefing exige o Value Object MesReferencia como competência (INV-01).'
      );
    }
    if (!Array.isArray(blocos) || blocos.some((b) => !(b instanceof BlocoDeFormato))) {
      throw new Error('Briefing exige uma lista de BlocoDeFormato (RN-02).');
    }
    this.parceiraId = parceiraId;
    this.mesReferencia = mesReferencia;
    this.blocos = blocos;
    // §9: nasce Rascunho; Publicado só via publicar().
    this.estado = 'Rascunho';
  }

  /**
   * Fábrica do rascunho: deriva os blocos do Snapshot Comercial da
   * Colaboração (INV-02/RN-02; CB-03 quando não há formato contratado).
   * @param {string} parceiraId
   * @param {MesReferencia} mesReferencia
   * @param {CondicaoComercialSnapshot} snapshot fotografia comercial da
   *   Colaboração Mensal compilada (SPEC-005).
   * @returns {Briefing} rascunho com um bloco por unidade contratada.
   */
  static criarRascunho(parceiraId, mesReferencia, snapshot) {
    if (!(snapshot instanceof CondicaoComercialSnapshot)) {
      throw new Error(
        'Briefing exige o Snapshot Comercial da Colaboração para derivar os blocos (INV-02).'
      );
    }
    const blocos = [];
    snapshot.formatosContratados.forEach((formato) => {
      const quantidade = snapshot.quantidadePorFormato[formato] || 1;
      for (let indice = 1; indice <= quantidade; indice++) {
        const rotulo = quantidade > 1 ? formato + ' ' + indice : formato;
        blocos.push(new BlocoDeFormato(rotulo));
      }
    });
    return new Briefing(parceiraId, mesReferencia, blocos);
  }

  /**
   * Igualdade de entidade pela chave natural (Parceira × MesReferencia).
   * @param {Briefing} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return (
      outro instanceof Briefing &&
      this.parceiraId === outro.parceiraId &&
      this.mesReferencia.igualA(outro.mesReferencia)
    );
  }

  /**
   * Preenche um bloco pelo rótulo (UC-009.01). Só em Rascunho.
   * @param {string} rotulo rótulo do bloco (ex.: 'Stories 1').
   * @param {{look: string, dataEntrega: Date, dataPostagem: Date,
   *          orientacao: (string|undefined)}} dados
   * @returns {BlocoDeFormato} o bloco preenchido.
   * @throws {Error} bloco fora dos formatos contratados (INV-02) ou
   *   briefing já publicado (§9).
   */
  preencherBloco(rotulo, dados) {
    if (this.estado !== 'Rascunho') {
      throw new Error(
        "Transição inválida (§9): preencher exige 'Rascunho', estado atual: '" +
          this.estado +
          "'."
      );
    }
    const bloco = this.blocos.find((b) => b.rotulo === rotulo);
    if (!bloco) {
      throw new Error(
        "INV-02: bloco '" +
          rotulo +
          "' não corresponde a formato contratado da Parceira '" +
          this.parceiraId +
          "'."
      );
    }
    return bloco.preencher(dados);
  }

  /**
   * Rascunho → Publicado (§9). Exige todos os blocos preenchidos
   * (UC-009.01: o preenchimento completo precede a publicação).
   * @returns {Briefing}
   */
  publicar() {
    if (this.estado !== 'Rascunho') {
      throw new Error(
        "Transição inválida (§9): publicar exige 'Rascunho', estado atual: '" +
          this.estado +
          "'."
      );
    }
    const pendente = this.blocos.find((b) => !b.estaPreenchido());
    if (pendente) {
      throw new Error(
        "BR-02: publicação recusada — bloco '" +
          pendente.rotulo +
          "' ainda não preenchido (UC-009.01)."
      );
    }
    this.estado = 'Publicado';
    return this;
  }
};
