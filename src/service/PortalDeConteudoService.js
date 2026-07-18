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
