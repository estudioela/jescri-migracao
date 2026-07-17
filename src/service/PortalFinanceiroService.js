/**
 * SERVICE: PortalFinanceiroService — fachada do Financeiro e Histórico no
 * Portal (SPEC-030 UC-030.01/02/03).
 *
 * "Sem agregado próprio; camada de leitura sobre SPEC-012/020" (§6.2): não
 * reimplementa a máquina de estados de Entrega nem de Obrigação Financeira
 * — consulta EntregaService/PagamentoService, mesmo padrão de isolamento de
 * PortalDeConteudoService/PerfilPortalService (SPEC-027/032): o parceiraId
 * NUNCA vem do comando externo, sempre da Sessão resolvida pelo token
 * (RN-05/INV-01, Q-09).
 *
 * RN-02/CB-02: "previsto" é toda Obrigação ainda não `Pago`
 * (`EmAberto`/`Aprovado`); só `Pago` conta em "pago" (ResumoFinanceiro.de).
 * RN-03: Histórico é somente leitura (Contrato §6.4) — Entregas `Publicado`
 * e Obrigações `Pago` (registro arquivado).
 * RN-04/CB-01: período selecionável = competências em que a Parceira teve
 * QUALQUER atividade (Entrega OU Obrigação, inclusive Avulso com
 * competência); Avulso sem competência (CB-01 de SPEC-020) nunca aparece na
 * seleção, por não ter `MesReferencia`.
 *
 * Não pode: tocar SpreadsheetApp; conhecer coluna física; formatar envelope.
 *
 * @param {AcessoPortalService} acessoPortalService resolve token → Sessão
 *   (SPEC-025).
 * @param {EntregaService} entregaService consulta Entregas (SPEC-012).
 * @param {PagamentoService} pagamentoService consulta Obrigações Financeiras
 *   (SPEC-020).
 */

this.PortalFinanceiroService = class PortalFinanceiroService {
  constructor(acessoPortalService, entregaService, pagamentoService) {
    this.acessoPortalService = acessoPortalService;
    this.entregaService = entregaService;
    this.pagamentoService = pagamentoService;
  }

  /**
   * Resolve o token na Sessão ativa (RN-05: única fonte do parceiraId).
   * @param {string} token
   * @returns {Sessao}
   * @throws {Error} PF-01 sessão inválida/expirada (§17).
   */
  resolverSessao(token) {
    try {
      return this.acessoPortalService.renovar({ token: token });
    } catch {
      throw erroComCodigo('PF-01', 'Sessão inválida ou expirada.');
    }
  }

  /**
   * RN-04/CB-01: competências em que a Parceira teve atividade (Entrega OU
   * Obrigação com competência), sem duplicar, em ordem cronológica.
   * @param {string} parceiraId
   * @returns {MesReferencia[]}
   */
  competenciasComAtividade(parceiraId) {
    const competencias = [];
    const adicionar = (mesReferencia) => {
      if (mesReferencia && !competencias.some((c) => c.igualA(mesReferencia))) {
        competencias.push(mesReferencia);
      }
    };
    this.entregaService
      .listarPorParceira(parceiraId)
      .forEach((entrega) => adicionar(entrega.mesReferencia));
    this.pagamentoService
      .listarPorParceira(parceiraId)
      .forEach((obrigacao) => adicionar(obrigacao.mesReferencia));
    return competencias.sort((a, b) => a.comparadoCom(b));
  }

  /**
   * RN-04: recusa um período fora das competências com atividade da
   * Parceira (PF-02).
   * @param {MesReferencia} mesReferencia
   * @param {string} parceiraId
   * @throws {Error} PF-02.
   */
  validarPeriodo(mesReferencia, parceiraId) {
    const disponivel = this.competenciasComAtividade(parceiraId).some((c) =>
      c.igualA(mesReferencia)
    );
    if (!disponivel) {
      throw erroComCodigo(
        'PF-02',
        "Período '" + mesReferencia.toString() + "' inexistente para a Parceira."
      );
    }
  }

  /**
   * UC-030.03 · Selecionar período: competências disponíveis para a
   * Parceira autenticada.
   * @param {{token: string}} dados
   * @returns {MesReferencia[]}
   * @throws {Error} PF-01 sessão inválida/expirada.
   */
  listarPeriodos(dados) {
    const sessao = this.resolverSessao(dados && dados.token);
    return this.competenciasComAtividade(sessao.parceiraId);
  }

  /**
   * UC-030.01 · Ver financeiro do período: total previsto x pago da
   * Parceira autenticada.
   * @param {{token: string, mesReferencia: string}} dados
   * @returns {ResumoFinanceiro}
   * @throws {Error} PF-01 sessão inválida; PF-02 período inexistente.
   */
  verFinanceiro(dados) {
    const sessao = this.resolverSessao(dados && dados.token);
    const mesReferencia = MesReferencia.deTexto(String(dados && dados.mesReferencia));
    this.validarPeriodo(mesReferencia, sessao.parceiraId);
    const obrigacoes = this.pagamentoService.listarPagamentos(
      mesReferencia.toString(),
      sessao.parceiraId
    );
    return ResumoFinanceiro.de(obrigacoes);
  }

  /**
   * UC-030.02 · Consultar histórico: Entregas `Publicado` e Obrigações
   * `Pago` (registro arquivado, INV-02) do período, da Parceira autenticada.
   * @param {{token: string, mesReferencia: string}} dados
   * @returns {ItemDeHistorico[]}
   * @throws {Error} PF-01 sessão inválida; PF-02 período inexistente.
   */
  verHistorico(dados) {
    const sessao = this.resolverSessao(dados && dados.token);
    const mesReferencia = MesReferencia.deTexto(String(dados && dados.mesReferencia));
    this.validarPeriodo(mesReferencia, sessao.parceiraId);
    const conteudo = this.entregaService
      .listarEntregas(mesReferencia.toString(), sessao.parceiraId)
      .filter((entrega) => entrega.estado === 'Publicado')
      .map((entrega) => ItemDeHistorico.deEntrega(entrega));
    const pagamentos = this.pagamentoService
      .listarPagamentos(mesReferencia.toString(), sessao.parceiraId)
      .filter((obrigacao) => obrigacao.estado === 'Pago')
      .map((obrigacao) => ItemDeHistorico.deObrigacao(obrigacao));
    return conteudo.concat(pagamentos);
  }
};
