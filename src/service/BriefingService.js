/**
 * SERVICE: BriefingService — casos de uso do Briefing da Colaboração
 * (SPEC-009 UC-009.01; RN-03).
 *
 * - Reage a `MesCompilado` (§14.1): recria os briefings da competência como
 *   rascunhos derivados do Snapshot de cada Colaboração (RN-03/CB-02 — o
 *   rascunho anterior é limpo pelo Repository num lote atômico).
 * - UC-009.01: preenche os blocos, o domínio deriva a data de aprovação
 *   (RN-01/INV-03), publica o agregado e SÓ APÓS a persistência publica o
 *   evento `BriefingPublicado` (§12) — falha na persistência nunca publica
 *   evento (mesma disciplina de SPEC-005 CB-03).
 * - BR-01 (§17): competência sem Colaboração compilada para a Parceira é
 *   recusada fail-fast.
 * - BR-02 (§17): datas externas chegam como texto 'AAAA-MM-DD' e são
 *   coagidas aqui, fail-fast.
 *
 * DÍVIDAS REGISTRADAS (aprovadas pelo PO em 2026-07-15):
 * - UC-009.02 (Importar Looks de planilha externa) FORA deste módulo —
 *   sem integração externa nesta etapa.
 * - BR-03 (autorização por papel, §13): o Portal ainda não possui camada de
 *   autenticação/papéis (chega com SPEC-025); até lá o acesso segue o
 *   modelo atual do Web App (operador único).
 *
 * Não pode: tocar SpreadsheetApp; conhecer coluna física; formatar envelope.
 *
 * @param {ColaboracaoMensalRepository} colaboracaoMensalRepository base
 *   factual de BR-01 (M2, congelado — somente leitura).
 * @param {BriefingRepository} briefingRepository persistência do agregado.
 * @param {object} publicadorDeEventos porta de eventos: publicar(evento).
 */

this.BriefingService = class BriefingService {
  constructor(colaboracaoMensalRepository, briefingRepository, publicadorDeEventos) {
    this.colaboracaoMensalRepository = colaboracaoMensalRepository;
    this.briefingRepository = briefingRepository;
    this.publicadorDeEventos = publicadorDeEventos;
  }

  /**
   * Reação a `MesCompilado` (RN-03): recria os briefings da competência,
   * um rascunho por Colaboração compilada, blocos derivados do Snapshot.
   * Idempotente por competência (achado F1/F2 da auditoria SPEC-012): se já
   * existe algum briefing desta competência, é no-op — nunca sobrescreve
   * (protege preenchimentos/publicações já feitos e permite reconciliar com
   * segurança uma compilação anterior que falhou parcialmente).
   * @param {string} mesReferenciaTexto competência 'AAAA-MM' (aceita o VO
   *   via toString).
   * @returns {Briefing[]} rascunhos recriados (vazio se já existia).
   */
  recriarParaCompetencia(mesReferenciaTexto) {
    const mesReferencia = MesReferencia.deTexto(String(mesReferenciaTexto));
    if (this.briefingRepository.existeParaCompetencia(mesReferencia)) {
      return [];
    }
    const colaboracoes = this.colaboracaoMensalRepository.listarPor(mesReferencia);
    const rascunhos = colaboracoes.map((colaboracao) =>
      Briefing.criarRascunho(
        colaboracao.parceiraId,
        colaboracao.mesReferencia,
        colaboracao.snapshot
      )
    );
    return this.briefingRepository.recriarCompetencia(mesReferencia, rascunhos);
  }

  /**
   * UC-009.01 · Preencher Briefing: preenche os blocos informados, publica
   * o agregado, persiste e publica `BriefingPublicado`.
   * @param {{mesReferencia: string, parceiraId: string,
   *          blocos: Array<{rotulo: string, look: string,
   *                         dataEntrega: string, dataPostagem: string,
   *                         orientacao: (string|undefined)}>}} comando
   * @returns {Briefing} o briefing publicado.
   * @throws {Error} BR-01 sem Colaboração compilada; BR-02 dados inválidos.
   */
  preencherEPublicar(comando) {
    if (comando == null || typeof comando !== 'object') {
      throw new Error('BR-02: comando de preenchimento ausente (UC-009.01).');
    }
    const mesReferencia = MesReferencia.deTexto(String(comando.mesReferencia));
    const parceiraId = comando.parceiraId;

    const colaboracoes = this.colaboracaoMensalRepository.listarPor(
      mesReferencia,
      parceiraId
    );
    if (colaboracoes.length === 0) {
      throw new Error(
        "BR-01: não existe Colaboração Mensal compilada para '" +
          parceiraId +
          "' na competência " +
          mesReferencia.toString() +
          '.'
      );
    }

    const briefing = this.briefingRepository.obterPor(mesReferencia, parceiraId);
    if (briefing === null) {
      throw new Error(
        'BR-01: briefing inexistente para a competência ' +
          mesReferencia.toString() +
          ' — recompile o mês (RN-03).'
      );
    }

    const blocos = Array.isArray(comando.blocos) ? comando.blocos : [];
    blocos.forEach((dados) => {
      briefing.preencherBloco(dados.rotulo, {
        look: dados.look,
        dataEntrega: this.paraData(dados.dataEntrega, 'data de entrega'),
        dataPostagem: this.paraData(dados.dataPostagem, 'data de postagem'),
        orientacao: dados.orientacao,
      });
    });
    briefing.publicar();
    this.briefingRepository.salvar(briefing);

    // §12: evento só após persistência bem-sucedida; payload sem PII.
    this.publicadorDeEventos.publicar({
      nome: 'BriefingPublicado',
      parceiraId: briefing.parceiraId,
      mesReferencia: briefing.mesReferencia.toString(),
      blocos: briefing.blocos.map((bloco) => bloco.rotulo),
    });
    return briefing;
  }

  /**
   * Query do briefing de uma Parceira na competência (SPEC-027/023; UI).
   * @param {string} mesReferenciaTexto 'AAAA-MM'.
   * @param {string} parceiraId
   * @returns {Briefing|null}
   */
  obterBriefing(mesReferenciaTexto, parceiraId) {
    return this.briefingRepository.obterPor(
      MesReferencia.deTexto(String(mesReferenciaTexto)),
      parceiraId
    );
  }

  /**
   * Coage texto externo 'AAAA-MM-DD' → Date local determinística (BR-02).
   * @param {string} texto
   * @param {string} rotulo para a mensagem de erro.
   * @returns {Date}
   */
  paraData(texto, rotulo) {
    const casamento = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto));
    if (!casamento) {
      throw new Error(
        'BR-02: ' + rotulo + " inválida — esperado 'AAAA-MM-DD' (recebido '" + texto + "')."
      );
    }
    return new Date(
      Number(casamento[1]),
      Number(casamento[2]) - 1,
      Number(casamento[3])
    );
  }
};
