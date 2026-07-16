/**
 * CONTROLLER: PortalDeConteudoController — adapta o contrato externo do
 * Conteúdo no Portal (SPEC-027 UC-027.01/02/03).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * PortalDeConteudoService e devolve SEMPRE o envelope padrão
 * {success,data}/{success,error} (PROJECT_GOVERNANCE §3.3).
 *
 * Erros do contrato (§17: PC-01/PC-02/PC-03) carregam o código, no mesmo
 * padrão do AcessoController — erros sem `codigo` (ex.: CT-03 propagado da
 * SPEC-012) seguem o padrão dos pares (envelope só com mensagem). Expõe
 * apenas projeções serializáveis — nunca a instância de domínio; datas
 * saem como 'AAAA-MM-DD'.
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {PortalDeConteudoService} portalDeConteudoService
 */

this.PortalDeConteudoController = class PortalDeConteudoController {
  constructor(portalDeConteudoService) {
    this.portalDeConteudoService = portalDeConteudoService;
  }

  /**
   * @param {Error} erro
   * @returns {{success: false, error: {codigo: (string|undefined), mensagem: string}}}
   */
  falhar(erro) {
    return envelopeFail(
      erro.codigo ? { codigo: erro.codigo, mensagem: erro.message } : { mensagem: erro.message }
    );
  }

  /**
   * UC-027.01: lista as pendências de conteúdo da Parceira autenticada.
   * @param {{token: string}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  verPendencias(dados) {
    try {
      const itens = this.portalDeConteudoService.listarPendencias(dados);
      return envelopeOk(itens.map((item) => this.projetarItem(item)));
    } catch (erro) {
      return this.falhar(erro);
    }
  }

  /**
   * UC-027.02: lê o briefing do item correspondente à Entrega.
   * @param {{token: string, rotulo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  lerBriefingDoItem(dados) {
    try {
      return envelopeOk(this.projetarBloco(this.portalDeConteudoService.lerBriefingDoItem(dados)));
    } catch (erro) {
      return this.falhar(erro);
    }
  }

  /**
   * UC-027.03: envia o material de uma Entrega da Parceira autenticada.
   * @param {{token: string, rotulo: string, link: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  enviarMaterialDoPortal(dados) {
    try {
      const entrega = this.portalDeConteudoService.enviarMaterial(dados);
      return envelopeOk({
        id: entrega.id.toString(),
        rotulo: entrega.rotulo,
        estado: entrega.estado,
      });
    } catch (erro) {
      return this.falhar(erro);
    }
  }

  /**
   * Projeção serializável de um ItemDePendencia (sem PII).
   * @param {ItemDePendencia} item
   * @returns {object}
   */
  projetarItem(item) {
    return {
      entregaId: item.entregaId,
      rotulo: item.rotulo,
      estado: item.estado,
      briefing: item.briefing
        ? {
            look: item.briefing.look,
            dataEntrega: this.dataParaTexto(item.briefing.dataEntrega),
            dataPostagem: this.dataParaTexto(item.briefing.dataPostagem),
          }
        : null,
    };
  }

  /**
   * Projeção serializável de um BlocoDeFormato.
   * @param {BlocoDeFormato} bloco
   * @returns {object}
   */
  projetarBloco(bloco) {
    return {
      rotulo: bloco.rotulo,
      look: bloco.look,
      dataEntrega: this.dataParaTexto(bloco.dataEntrega),
      dataPostagem: this.dataParaTexto(bloco.dataPostagem),
      orientacao: bloco.orientacao,
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
