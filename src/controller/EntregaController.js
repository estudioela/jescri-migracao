/**
 * CONTROLLER: EntregaController — adapta o contrato externo da Entrega
 * (SPEC-012 UC-012.01/02/03).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * EntregaService e devolve SEMPRE o envelope padrão {success,data}/
 * {success,error} (PROJECT_GOVERNANCE §3.3, via envelopeOk/envelopeFail).
 *
 * Expõe apenas uma projeção serializável da Entrega — nunca a instância de
 * domínio; datas saem como 'AAAA-MM-DD'. A projeção não carrega PII.
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {EntregaService} entregaService
 */

this.EntregaController = class EntregaController {
  constructor(entregaService) {
    this.entregaService = entregaService;
  }

  /**
   * Adapta o comando EnviarMaterial (UC-012.02) ao contrato externo.
   * @param {{mesReferencia: string, parceiraId: string, rotulo: string,
   *          link: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  enviarMaterial(dados) {
    try {
      return envelopeOk(this.projetar(this.entregaService.enviarMaterial(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando Aprovar (UC-012.03) ao contrato externo.
   * @param {{mesReferencia: string, parceiraId: string, rotulo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  aprovarEntrega(dados) {
    try {
      return envelopeOk(this.projetar(this.entregaService.aprovar(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando Publicar (UC-012.03) ao contrato externo.
   * @param {{mesReferencia: string, parceiraId: string, rotulo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  publicarEntrega(dados) {
    try {
      return envelopeOk(this.projetar(this.entregaService.publicar(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta a query de Entregas por competência/Parceira (UC-012.01).
   * @param {{mesReferencia: string, parceiraId: (string|undefined)}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  listarEntregas(dados) {
    try {
      const entregas = this.entregaService.listarEntregas(
        dados && dados.mesReferencia,
        dados && dados.parceiraId === undefined ? undefined : dados.parceiraId
      );
      return envelopeOk(entregas.map((entrega) => this.projetar(entrega)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Projeção serializável do agregado (datas 'AAAA-MM-DD', sem PII).
   * @param {Entrega} entrega
   * @returns {object}
   */
  projetar(entrega) {
    return {
      id: entrega.id.toString(),
      parceiraId: entrega.parceiraId,
      mesReferencia: entrega.mesReferencia.toString(),
      rotulo: entrega.rotulo,
      estado: entrega.estado,
      material: entrega.material === null ? null : entrega.material.toString(),
      dataAprovacaoInterna: this.dataParaTexto(entrega.dataAprovacaoInterna),
      dataArquivamento: this.dataParaTexto(entrega.dataArquivamento),
    };
  }

  /**
   * @param {Date|null} data
   * @returns {string|null} 'AAAA-MM-DD' (calendário local) ou null.
   */
  dataParaTexto(data) {
    if (data == null) {
      return null;
    }
    const mes = data.getMonth() + 1;
    const dia = data.getDate();
    return (
      data.getFullYear() +
      '-' +
      (mes < 10 ? '0' + mes : String(mes)) +
      '-' +
      (dia < 10 ? '0' + dia : String(dia))
    );
  }
};
