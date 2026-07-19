/**
 * MÓDULO: PortalConteudo — conteúdo, pendências e histórico no Portal (SPEC-027/030)
 *
 * Fatia vertical (ADR-014): camadas como seções, na ordem
 * DOMAIN → ACL → REPOSITORY → SERVICE → CONTROLLER → ADAPTERS.
 * Os contratos de camada valem integralmente (docs/ARQUITETURA_CAMADAS.md).
 */

// ============================================================================
// DOMAIN — ItemDePendencia.js (ex-src/domain/ItemDePendencia.js)
// ============================================================================

/**
 * VALUE OBJECT: ItemDePendencia (SPEC-027 §6.1)
 *
 * Projeção de leitura de uma Entrega para o Portal da Parceira: expõe o
 * essencial para "ver pendências" (UC-027.01) e "ler briefing do item"
 * (UC-027.02). Nunca é persistido e nunca altera a máquina de estados da
 * Entrega — essa pertence a SPEC-012 (§6.4, "o que NÃO pertence" à SPEC-027).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.ItemDePendencia = class ItemDePendencia {
  /**
   * @param {string} entregaId identificador permanente da Entrega (RNF-01).
   * @param {string} rotulo rótulo do formato (ex.: 'Stories 1').
   * @param {string} estado estado atual da Entrega (§9, SPEC-012).
   * @param {{look: string, dataEntrega: Date, dataPostagem: Date}|null} briefing
   *   projeção do bloco correspondente do Briefing, ou null quando ainda
   *   não há bloco espelhável (RN-03).
   */
  constructor(entregaId, rotulo, estado, briefing) {
    this.entregaId = String(entregaId);
    this.rotulo = String(rotulo);
    this.estado = String(estado);
    this.briefing = briefing || null;
  }

  /**
   * Projeta uma Entrega (+ bloco de Briefing correspondente, se houver) num
   * ItemDePendencia (UC-027.01/02).
   * @param {Entrega} entrega
   * @param {BlocoDeFormato|null} bloco bloco do Briefing de mesmo rótulo.
   * @returns {ItemDePendencia}
   */
  static de(entrega, bloco) {
    return new ItemDePendencia(
      entrega.id.toString(),
      entrega.rotulo,
      entrega.estado,
      bloco
        ? {
            look: bloco.look,
            dataEntrega: bloco.dataEntrega,
            dataPostagem: bloco.dataPostagem,
          }
        : null
    );
  }
};

// ============================================================================
// DOMAIN — ItemDeHistorico.js (ex-src/domain/ItemDeHistorico.js)
// ============================================================================

/**
 * VALUE OBJECT: ItemDeHistorico (SPEC-030 §6.1)
 *
 * Projeção de leitura de um registro arquivado (Contrato §6.4) para o
 * Histórico do Portal (UC-030.02): uma Entrega `Publicado` (SPEC-012) ou uma
 * Obrigação Financeira `Pago` (SPEC-020). Nunca é persistido e nunca altera
 * a máquina de estados de origem — mesma natureza de ItemDePendencia
 * (SPEC-027).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.ItemDeHistorico = class ItemDeHistorico {
  /**
   * @param {'Conteudo'|'Pagamento'} tipo
   * @param {string} referencia rótulo do formato (Conteúdo) ou tipo da
   *   Obrigação (Pagamento).
   * @param {string} estado estado arquivado de origem ('Publicado'/'Pago').
   * @param {Date} dataArquivamento
   * @param {number|null} valor valor da Obrigação (Pagamento) ou null
   *   (Conteúdo não tem valor próprio).
   */
  constructor(tipo, referencia, estado, dataArquivamento, valor) {
    this.tipo = tipo;
    this.referencia = String(referencia);
    this.estado = String(estado);
    this.dataArquivamento = dataArquivamento;
    this.valor = valor == null ? null : Number(valor);
  }

  /**
   * Projeta uma Entrega arquivada (§9 SPEC-012, `Publicado`) num item de
   * histórico de Conteúdo.
   * @param {Entrega} entrega
   * @returns {ItemDeHistorico}
   */
  static deEntrega(entrega) {
    return new ItemDeHistorico(
      'Conteudo',
      entrega.rotulo,
      entrega.estado,
      entrega.dataArquivamento,
      null
    );
  }

  /**
   * Projeta uma Obrigação Financeira arquivada (§9 SPEC-020, `Pago`) num
   * item de histórico de Pagamento.
   * @param {ObrigacaoFinanceira} obrigacao
   * @returns {ItemDeHistorico}
   */
  static deObrigacao(obrigacao) {
    return new ItemDeHistorico(
      'Pagamento',
      obrigacao.tipo,
      obrigacao.estado,
      obrigacao.dataArquivamento,
      obrigacao.valor
    );
  }
};

// ============================================================================
// SERVICE — PortalDeConteudoService.js (ex-src/service/PortalDeConteudoService.js)
// ============================================================================

/**
 * SERVICE: PortalDeConteudoService — fachada do Conteúdo no Portal
 * (SPEC-027 UC-027.01/02/03).
 *
 * "Sem agregado próprio; é camada de leitura/escrita sobre SPEC-012/009"
 * (§6.2/§6.4): consulta Entregas via EntregaService, lê o bloco de Briefing
 * correspondente via BriefingService, e DELEGA o envio de material ao
 * EntregaService — nunca reimplementa a máquina de estados da Entrega.
 *
 * RN-01/INV-01/Q-09 (isolamento estrito): a Parceira nunca informa o
 * próprio `parceiraId` — ele vem SEMPRE da Sessão resolvida a partir do
 * `token` (AcessoPortalService.renovar, que também desliza a expiração —
 * SPEC-025 RN-03). Reaproveitar `EntregaService.listarEntregas` filtrado
 * pelo parceiraId da sessão é o que garante PC-02 (Entrega alheia recusada)
 * "de graça": a query nunca devolve Entrega de outra Parceira.
 *
 * Não pode: tocar SpreadsheetApp; conhecer coluna física; formatar envelope.
 *
 * @param {AcessoPortalService} acessoPortalService resolve token → Sessão
 *   (SPEC-025).
 * @param {EntregaService} entregaService consulta e delega o envio de
 *   material (SPEC-012).
 * @param {BriefingService} briefingService lê o Briefing publicado/rascunho
 *   da competência (SPEC-009).
 * @param {object} relogio porta de tempo: hoje() → Date (competência
 *   corrente, UC-027.01).
 */

this.PortalDeConteudoService = class PortalDeConteudoService {
  constructor(acessoPortalService, entregaService, briefingService, relogio) {
    this.acessoPortalService = acessoPortalService;
    this.entregaService = entregaService;
    this.briefingService = briefingService;
    this.relogio = relogio;
  }

  /**
   * Resolve o token na Sessão ativa (RN-01: única fonte do parceiraId).
   * @param {string} token
   * @returns {Sessao}
   * @throws {Error} PC-01 sessão inválida/expirada (§17).
   */
  resolverSessao(token) {
    try {
      return this.acessoPortalService.renovar({ token: token });
    } catch {
      throw erroComCodigo('PC-01', 'Sessão inválida ou expirada.');
    }
  }

  /**
   * @returns {MesReferencia} competência corrente, derivada do relógio.
   */
  competenciaAtual() {
    const agora = this.relogio.hoje();
    const mes = agora.getMonth() + 1;
    return MesReferencia.deTexto(
      agora.getFullYear() + '-' + (mes < 10 ? '0' + mes : String(mes))
    );
  }

  /**
   * UC-027.01 · Ver pendências: Entregas da Parceira na competência
   * corrente, exceto as já `Publicado` (arquivadas — RF-015, histórico é
   * escopo de SPEC-030, fora desta SPEC §2).
   * @param {{token: string}} dados
   * @returns {ItemDePendencia[]}
   * @throws {Error} PC-01 sessão inválida/expirada.
   */
  listarPendencias(dados) {
    const sessao = this.resolverSessao(dados && dados.token);
    const mesReferencia = this.competenciaAtual();
    const briefing = this.briefingService.obterBriefing(
      mesReferencia.toString(),
      sessao.parceiraId
    );
    const itens = this.entregaService
      .listarEntregas(mesReferencia.toString(), sessao.parceiraId)
      .filter((entrega) => entrega.estado !== 'Publicado')
      .map((entrega) => ItemDePendencia.de(entrega, this.blocoDe(briefing, entrega.rotulo)));
    return this.ordenarPorDataDeEntrega(itens);
  }

  /**
   * UC-012.01/UC-027.01 (ordem cronológica) — achado F6 da auditoria
   * SPEC-012 (`docs/_workspace/auditorias/AUDITORIA_SPEC012.md`): a Entrega
   * não carrega chave cronológica própria (a data de entrega vive no bloco
   * do Briefing, SPEC-009), então só esta fachada — que já faz o join com o
   * bloco para projetar `briefing.dataEntrega` (`ItemDePendencia.de`) — pode
   * cumprir o requisito, sem duplicar a data na Entrega (duplicaria fonte de
   * verdade). Itens sem bloco preenchido (RN-03, sem data conhecida) vão por
   * último, preservando a ordem relativa original entre si (sort estável).
   * @param {ItemDePendencia[]} itens
   * @returns {ItemDePendencia[]}
   */
  ordenarPorDataDeEntrega(itens) {
    return itens
      .map((item, indice) => ({ item, indice }))
      .sort((a, b) => {
        const dataA = a.item.briefing && a.item.briefing.dataEntrega;
        const dataB = b.item.briefing && b.item.briefing.dataEntrega;
        if (!dataA && !dataB) return a.indice - b.indice;
        if (!dataA) return 1;
        if (!dataB) return -1;
        const diferenca = dataA.getTime() - dataB.getTime();
        return diferenca !== 0 ? diferenca : a.indice - b.indice;
      })
      .map((par) => par.item);
  }

  /**
   * UC-027.02 · Ler briefing do item correspondente à Entrega.
   * @param {{token: string, rotulo: string}} dados
   * @returns {BlocoDeFormato}
   * @throws {Error} PC-01 sessão inválida; PC-02 Entrega alheia/inexistente
   *   ou sem briefing correspondente.
   */
  lerBriefingDoItem(dados) {
    const sessao = this.resolverSessao(dados && dados.token);
    const mesReferencia = this.competenciaAtual();
    const entrega = this.entregaDaParceiraOuFalhar(
      mesReferencia,
      sessao.parceiraId,
      dados && dados.rotulo
    );
    const briefing = this.briefingService.obterBriefing(
      mesReferencia.toString(),
      sessao.parceiraId
    );
    const bloco = this.blocoDe(briefing, entrega.rotulo);
    if (!bloco) {
      throw erroComCodigo(
        'PC-02',
        "Briefing indisponível para o item '" + entrega.rotulo + "'."
      );
    }
    return bloco;
  }

  /**
   * UC-027.03 · Enviar material: delega integralmente à SPEC-012 (§6.3) —
   * o `parceiraId` vem da Sessão, nunca do comando externo (RN-01).
   * @param {{token: string, rotulo: string, link: string}} dados
   * @returns {Entrega}
   * @throws {Error} PC-01 sessão inválida; PC-02 Entrega alheia/inexistente;
   *   demais erros de transição (CT-01/CT-03/INV-04) propagam da SPEC-012.
   */
  enviarMaterial(dados) {
    const sessao = this.resolverSessao(dados && dados.token);
    const mesReferencia = this.competenciaAtual();
    this.entregaDaParceiraOuFalhar(mesReferencia, sessao.parceiraId, dados && dados.rotulo);
    return this.entregaService.enviarMaterial({
      mesReferencia: mesReferencia.toString(),
      parceiraId: sessao.parceiraId,
      rotulo: dados && dados.rotulo,
      link: dados && dados.link,
    });
  }

  /**
   * PC-02 (§17/INV-01): a Entrega só é resolvida dentro do escopo da própria
   * Parceira — inexistente ali (mesmo que exista para outra) é recusada.
   * @param {MesReferencia} mesReferencia
   * @param {string} parceiraId
   * @param {string} rotulo
   * @returns {Entrega}
   * @throws {Error} PC-02.
   */
  entregaDaParceiraOuFalhar(mesReferencia, parceiraId, rotulo) {
    const entrega = this.entregaService
      .listarEntregas(mesReferencia.toString(), parceiraId)
      .find((candidata) => candidata.rotulo === rotulo);
    if (!entrega) {
      throw erroComCodigo(
        'PC-02',
        "Entrega '" + rotulo + "' não pertence à Parceira ou não existe."
      );
    }
    return entrega;
  }

  /**
   * Bloco de Briefing correspondente, só quando já preenchido (RN-03). Um
   * bloco existe desde o rascunho (um por formato contratado — SPEC-009
   * §6.2), mas nasce vazio (`look`/datas nulos) até a equipe preencher; um
   * bloco vazio não é briefing utilizável para a Parceira.
   * @param {Briefing|null} briefing
   * @param {string} rotulo
   * @returns {BlocoDeFormato|null}
   */
  blocoDe(briefing, rotulo) {
    if (!briefing) {
      return null;
    }
    const bloco = briefing.blocos.find((candidato) => candidato.rotulo === rotulo);
    return bloco && bloco.estaPreenchido() ? bloco : null;
  }
};

// ============================================================================
// CONTROLLER — PortalDeConteudoController.js (ex-src/controller/PortalDeConteudoController.js)
// ============================================================================

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
   * UC-027.01: lista as pendências de conteúdo da Parceira autenticada.
   * @param {{token: string}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  verPendencias(dados) {
    try {
      const itens = this.portalDeConteudoService.listarPendencias(dados);
      return envelopeOk(itens.map((item) => this.projetarItem(item)));
    } catch (erro) {
      return falharComCodigo(erro);
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
      return falharComCodigo(erro);
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
      return falharComCodigo(erro);
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
