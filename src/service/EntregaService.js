/**
 * SERVICE: EntregaService — casos de uso da Entrega (SPEC-012
 * UC-012.01/02/03; RN-01/RN-03/RN-04).
 *
 * - Reage a `MesCompilado` (§14.1): materializa uma Entrega por unidade
 *   contratada de cada Colaboração compilada (RN-01), num lote atômico do
 *   Repository.
 * - Reage a `BriefingPublicado` (§14.1): espelha a data de aprovação
 *   interna do bloco na Entrega de mesmo rótulo (SPEC-009 RN-04).
 * - UC-012.02/03: transições atravessam o domínio; o evento é publicado SÓ
 *   APÓS a persistência — falha na persistência nunca publica evento
 *   (mesma disciplina de SPEC-005 CB-03).
 * - RN-04/RNF-03: a data de arquivamento vem do relógio injetado —
 *   determinística e testável.
 * - CT-01 (§17): Entrega inexistente é recusada fail-fast.
 *
 * DECISÕES/DÍVIDAS REGISTRADAS (aprovadas pelo PO em 2026-07-15):
 * - D-02: material persiste como URL (LinkDoMaterial); upload físico é
 *   dívida com ADR futuro.
 * - CT-04 (autorização por papel, §13): o Portal ainda não possui camada de
 *   autenticação/papéis (chega com SPEC-025) — mesma dívida do M3.
 * - §12: o evento de publicação→arquivamento não tem nome no catálogo da
 *   SPEC-012; adotado `ConteudoPublicado` (payload entregaId +
 *   dataArquivamento) até o catálogo do Contrato §8 nomeá-lo.
 *
 * Não pode: tocar SpreadsheetApp; conhecer coluna física; formatar envelope.
 *
 * @param {ColaboracaoMensalRepository} colaboracaoMensalRepository base da
 *   materialização (M2, congelado — somente leitura).
 * @param {BriefingRepository} briefingRepository fonte do espelhamento
 *   (M3, congelado — somente leitura).
 * @param {EntregaRepository} entregaRepository persistência do agregado.
 * @param {object} publicadorDeEventos porta de eventos: publicar(evento).
 * @param {object} relogio porta de tempo: hoje() → Date (RN-04/RNF-03).
 */

this.EntregaService = class EntregaService {
  constructor(
    colaboracaoMensalRepository,
    briefingRepository,
    entregaRepository,
    publicadorDeEventos,
    relogio
  ) {
    this.colaboracaoMensalRepository = colaboracaoMensalRepository;
    this.briefingRepository = briefingRepository;
    this.entregaRepository = entregaRepository;
    this.publicadorDeEventos = publicadorDeEventos;
    this.relogio = relogio;
  }

  /**
   * Reação a `MesCompilado` (RN-01): materializa as Entregas da
   * competência, uma por unidade contratada de cada Colaboração compilada.
   * @param {string} mesReferenciaTexto competência 'AAAA-MM'.
   * @returns {Entrega[]} Entregas materializadas.
   */
  materializarParaCompetencia(mesReferenciaTexto) {
    const mesReferencia = MesReferencia.deTexto(String(mesReferenciaTexto));
    const colaboracoes = this.colaboracaoMensalRepository.listarPor(mesReferencia);
    const entregas = [];
    colaboracoes.forEach((colaboracao) => {
      Entrega.materializar(
        colaboracao.parceiraId,
        colaboracao.mesReferencia,
        colaboracao.snapshot
      ).forEach((entrega) => entregas.push(entrega));
    });
    return this.entregaRepository.recriarCompetencia(mesReferencia, entregas);
  }

  /**
   * Reação a `BriefingPublicado` (§14.1): espelha a data de aprovação
   * interna de cada bloco preenchido na Entrega de mesmo rótulo.
   * @param {string} mesReferenciaTexto competência 'AAAA-MM'.
   * @param {string} parceiraId
   * @returns {Entrega[]} Entregas espelhadas e persistidas.
   */
  espelharAprovacoes(mesReferenciaTexto, parceiraId) {
    const mesReferencia = MesReferencia.deTexto(String(mesReferenciaTexto));
    const briefing = this.briefingRepository.obterPor(mesReferencia, parceiraId);
    if (briefing === null) {
      throw new Error(
        "Espelhamento recusado — briefing inexistente para '" +
          parceiraId +
          "' na competência " +
          mesReferencia.toString() +
          ' (§14.1).'
      );
    }
    return briefing.blocos
      .filter((bloco) => bloco.estaPreenchido())
      .map((bloco) => {
        const entrega = this.obterOuFalhar(mesReferencia, parceiraId, bloco.rotulo);
        entrega.espelharDataAprovacao(bloco.dataAprovacaoInterna);
        return this.entregaRepository.salvar(entrega);
      });
  }

  /**
   * UC-012.02 · Enviar material: upload leva a EmRevisao (RN-03), persiste
   * e publica `ConteudoEnviado` (§12).
   * @param {{mesReferencia: string, parceiraId: string, rotulo: string,
   *          link: string}} comando
   * @returns {Entrega}
   * @throws {Error} CT-01 Entrega inexistente; CT-03 transição inválida.
   */
  enviarMaterial(comando) {
    const { mesReferencia, entrega } = this.resolver(comando);
    entrega.enviarMaterial(comando.link);
    this.entregaRepository.salvar(entrega);

    // §12: evento só após persistência bem-sucedida; payload sem PII.
    this.publicadorDeEventos.publicar({
      nome: 'ConteudoEnviado',
      entregaId: entrega.id.toString(),
      parceiraId: entrega.parceiraId,
      mesReferencia: mesReferencia.toString(),
    });
    return entrega;
  }

  /**
   * UC-012.03 · Aprovar: EmRevisao → Aprovado, persiste e publica
   * `ConteudoAprovado` (§12).
   * @param {{mesReferencia: string, parceiraId: string, rotulo: string}} comando
   * @returns {Entrega}
   * @throws {Error} CT-01 Entrega inexistente; CT-03 transição inválida.
   */
  aprovar(comando) {
    const { entrega } = this.resolver(comando);
    entrega.aprovar();
    this.entregaRepository.salvar(entrega);

    this.publicadorDeEventos.publicar({
      nome: 'ConteudoAprovado',
      entregaId: entrega.id.toString(),
    });
    return entrega;
  }

  /**
   * UC-012.03 · Publicar: Aprovado → Publicado, arquivando automaticamente
   * com a data do relógio injetado (RN-04); persiste e publica
   * `ConteudoPublicado` (§12 — consumidor: SPEC-034).
   * @param {{mesReferencia: string, parceiraId: string, rotulo: string}} comando
   * @returns {Entrega}
   * @throws {Error} CT-01 inexistente; CT-03 transição; CB-03 já publicada.
   */
  publicar(comando) {
    const { entrega } = this.resolver(comando);
    entrega.publicar(this.relogio.hoje());
    this.entregaRepository.salvar(entrega);

    this.publicadorDeEventos.publicar({
      nome: 'ConteudoPublicado',
      entregaId: entrega.id.toString(),
      dataArquivamento: entrega.dataArquivamento,
    });
    return entrega;
  }

  /**
   * UC-012.01 · Listar Entregas da competência, opcionalmente por Parceira.
   * @param {string} mesReferenciaTexto 'AAAA-MM'.
   * @param {string} [parceiraId]
   * @returns {Entrega[]}
   */
  listarEntregas(mesReferenciaTexto, parceiraId) {
    return this.entregaRepository.listarPor(
      MesReferencia.deTexto(String(mesReferenciaTexto)),
      parceiraId
    );
  }

  /**
   * Resolve o comando externo na Entrega alvo (CT-01 fail-fast).
   * @param {{mesReferencia: string, parceiraId: string, rotulo: string}} comando
   * @returns {{mesReferencia: MesReferencia, entrega: Entrega}}
   */
  resolver(comando) {
    if (comando == null || typeof comando !== 'object') {
      throw new Error('CT-01: comando ausente — identifique a Entrega.');
    }
    const mesReferencia = MesReferencia.deTexto(String(comando.mesReferencia));
    return {
      mesReferencia,
      entrega: this.obterOuFalhar(mesReferencia, comando.parceiraId, comando.rotulo),
    };
  }

  /**
   * @param {MesReferencia} mesReferencia
   * @param {string} parceiraId
   * @param {string} rotulo
   * @returns {Entrega}
   * @throws {Error} CT-01 quando a Entrega não existe.
   */
  obterOuFalhar(mesReferencia, parceiraId, rotulo) {
    const entrega = this.entregaRepository.obterPor(mesReferencia, parceiraId, rotulo);
    if (entrega === null) {
      throw new Error(
        "CT-01: Entrega inexistente — '" +
          parceiraId +
          "' × " +
          mesReferencia.toString() +
          " × '" +
          rotulo +
          "' (recompile o mês se a competência ainda não foi materializada)."
      );
    }
    return entrega;
  }
};
