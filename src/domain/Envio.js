/**
 * AGREGADO RAIZ: Envio (SPEC-016 §6.2)
 *
 * Registro do envio físico do produto de uma Colaboração Mensal para uma
 * Parceira (era "Fluxo Logístico"). Um Envio por Parceira Ativa por
 * competência (RN-01).
 *
 * Invariantes preservadas:
 * - INV-01: todo Envio referencia uma Colaboração Mensal compilada — a
 *   identidade é Parceira × competência (MesReferencia).
 * - RN-04 (ADR-001 §2.4): DUAS máquinas de estado INDEPENDENTES —
 *   Revisão de dados: AguardandoConfirmacao → Confirmado(terminal);
 *   Jornada física: Pendente → Expedido → Entregue(terminal→arquiva)
 *                                       └→ Cancelado(terminal).
 * - INV-02/RN-05: transição fora das máquinas falha barulhento (LG-02).
 * - RN-02/CB-02: registrar rastreio preenche a data de envio apenas se
 *   ainda vazia; re-registro substitui o código preservando a data.
 * - RN-03: ao ser entregue, arquiva automaticamente com data de
 *   arquivamento (fornecida pelo chamador — determinístico, RNF-02).
 * - INV-03: Envio arquivado (Entregue) é somente leitura.
 * - D-03: endereço/PIX NUNCA são persistidos no Envio (exceção da
 *   UC-016.01 vive no Service, não aqui).
 *
 * PORTA DE RASTREIO (§6.3, D-02): quem consulta a transportadora é um
 * adaptador que honra o contrato { consultar(codigoRastreio) →
 * { entregue: boolean } } — implementado fora do domínio (Bloco 2,
 * ManualTrackingAdapter); falha do adaptador é degradável (RNF-01) e
 * tratada no Service, nunca aqui.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna
 * física. Não conhece Entrega de conteúdo (SPEC-012) nem Pagamento
 * (SPEC-020).
 */

this.Envio = class Envio {
  /**
   * @param {string} parceiraId identidade estável da Parceira.
   * @param {MesReferencia} mesReferencia competência da colaboração (VO).
   */
  constructor(parceiraId, mesReferencia) {
    const id = String(parceiraId == null ? '' : parceiraId).trim();
    if (id === '') {
      throw new Error('Envio exige a identidade da Parceira (RN-01).');
    }
    if (!(mesReferencia instanceof MesReferencia)) {
      throw new Error('Envio exige a competência como MesReferencia (INV-01).');
    }
    this.parceiraId = id;
    this.mesReferencia = mesReferencia;
    // §9: nasce AguardandoConfirmacao + Pendente; demais estados só via transições.
    this.revisao = 'AguardandoConfirmacao';
    this.jornada = 'Pendente';
    this.rastreio = null;
    this.dataEnvio = null;
    this.dataArquivamento = null;
  }

  /**
   * Igualdade de entidade por Parceira × competência (RN-01).
   * @param {Envio} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return (
      outro instanceof Envio &&
      this.parceiraId === outro.parceiraId &&
      this.mesReferencia.igualA(outro.mesReferencia)
    );
  }

  /**
   * UC-016.01 · Confirmar endereço: AguardandoConfirmacao → Confirmado
   * (terminal). Máquina de Revisão de dados, independente da Jornada
   * (RN-04).
   * @returns {Envio}
   * @throws {Error} INV-03 se arquivado; LG-02 fora de AguardandoConfirmacao.
   */
  confirmarEndereco() {
    this.recusarSeArquivado();
    if (this.revisao !== 'AguardandoConfirmacao') {
      throw new Error(
        "LG-02: transição inválida (§9) — confirmar endereço exige 'AguardandoConfirmacao', estado atual: '" +
          this.revisao +
          "'."
      );
    }
    this.revisao = 'Confirmado';
    return this;
  }

  /**
   * UC-016.02 · Registrar rastreio: Pendente → Expedido. A data de envio é
   * preenchida apenas se ainda vazia (RN-02); re-registro substitui o
   * código preservando a data (CB-02).
   * @param {string} codigo código de rastreio.
   * @param {Date} dataEnvio data de envio, fornecida pelo chamador
   *   (determinística e testável).
   * @returns {Envio}
   * @throws {Error} INV-03 se arquivado; LG-02 fora de Pendente/Expedido;
   *   data de envio inválida.
   */
  registrarRastreio(codigo, dataEnvio) {
    this.recusarSeArquivado();
    if (this.jornada !== 'Pendente' && this.jornada !== 'Expedido') {
      throw new Error(
        "LG-02: transição inválida (§9) — registrar rastreio exige 'Pendente' ou 'Expedido', estado atual: '" +
          this.jornada +
          "'."
      );
    }
    // Duck-typing (não instanceof): Date pode vir de outro realm (vm).
    if (
      this.dataEnvio === null &&
      (dataEnvio == null || typeof dataEnvio.getTime !== 'function' || isNaN(dataEnvio.getTime()))
    ) {
      throw new Error(
        "RN-02: data de envio inválida no registro de rastreio do Envio de '" +
          this.parceiraId +
          "'."
      );
    }
    this.rastreio = new CodigoRastreio(codigo);
    if (this.dataEnvio === null) {
      this.dataEnvio = dataEnvio;
    }
    this.jornada = 'Expedido';
    return this;
  }

  /**
   * UC-016.03/RN-03 · Entrega detectada: Expedido → Entregue (terminal),
   * arquivando automaticamente com a data de arquivamento.
   * @param {Date} dataArquivamento fornecida pelo chamador (determinística).
   * @returns {Envio}
   * @throws {Error} INV-03 se já arquivado; LG-02 fora de Expedido; data
   *   de arquivamento inválida.
   */
  marcarEntregue(dataArquivamento) {
    this.recusarSeArquivado();
    if (this.jornada !== 'Expedido') {
      throw new Error(
        "LG-02: transição inválida (§9) — marcar entregue exige 'Expedido', estado atual: '" +
          this.jornada +
          "'."
      );
    }
    if (
      dataArquivamento == null ||
      typeof dataArquivamento.getTime !== 'function' ||
      isNaN(dataArquivamento.getTime())
    ) {
      throw new Error(
        "RN-03: data de arquivamento inválida na entrega do Envio de '" + this.parceiraId + "'."
      );
    }
    this.jornada = 'Entregue';
    this.dataArquivamento = dataArquivamento;
    Object.freeze(this);
    return this;
  }

  /**
   * Cancelamento: Expedido → Cancelado (terminal, §9).
   * @returns {Envio}
   * @throws {Error} INV-03 se arquivado; LG-02 fora de Expedido.
   */
  cancelar() {
    this.recusarSeArquivado();
    if (this.jornada !== 'Expedido') {
      throw new Error(
        "LG-02: transição inválida (§9) — cancelar exige 'Expedido', estado atual: '" +
          this.jornada +
          "'."
      );
    }
    this.jornada = 'Cancelado';
    return this;
  }

  /**
   * INV-03: Envio arquivado (Entregue) é somente leitura.
   * @throws {Error} INV-03 se a Jornada já é 'Entregue'.
   */
  recusarSeArquivado() {
    if (this.jornada === 'Entregue') {
      throw new Error('INV-03: Envio arquivado é somente leitura.');
    }
  }
};
