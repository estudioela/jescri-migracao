/**
 * SERVICE: CompiladorDoMes — única entrada para o comando CompilarMes
 * (SPEC-005 §6.3, UC-005.01).
 *
 * Orquestra a compilação da competência: valida a MesReferencia, garante
 * idempotência pela chave da competência (RN-09/C-02 — segunda chamada é
 * no-op sem efeito colateral), obtém as Parceiras ativas com suas Condições
 * Comerciais na porta do Cadastro (§14.1), congela um Snapshot por Parceira
 * (RN-04), persiste tudo num lote atômico (RN-03) e só então publica
 * `MesCompilado` (§12) — falha na persistência nunca publica evento (CB-03).
 *
 * Os agregados vizinhos (Briefing, Ativação, Logística, Pagamento) NÃO são
 * criados aqui (§6.4): reagem ao evento em seus próprios módulos.
 *
 * Não pode: falar HTTP/HTML; formatar envelope (Controller); conhecer
 * coluna física (ACL).
 *
 * @param {object} cadastroDeParceiras porta do Cadastro:
 *   listarAtivasComCondicoes() → [{parceiraId, condicoes}].
 * @param {ColaboracaoMensalRepository} colaboracaoMensalRepository
 * @param {object} publicadorDeEventos porta de eventos: publicar(evento).
 */

this.CompiladorDoMes = class CompiladorDoMes {
  constructor(cadastroDeParceiras, colaboracaoMensalRepository, publicadorDeEventos) {
    this.cadastroDeParceiras = cadastroDeParceiras;
    this.colaboracaoMensalRepository = colaboracaoMensalRepository;
    this.publicadorDeEventos = publicadorDeEventos;
  }

  /**
   * Comando CompilarMes(MesReferencia).
   * @param {string} mesReferenciaTexto competência no formato canônico 'AAAA-MM'.
   * @returns {{mesReferencia: string,
   *            colaboracoes: ColaboracaoMensal[],
   *            jaCompilada: boolean}}
   */
  executar(mesReferenciaTexto) {
    const mesReferencia = MesReferencia.deTexto(mesReferenciaTexto);

    // RN-09/CB-01: competência já compilada — no-op idempotente, zero efeitos.
    if (this.colaboracaoMensalRepository.existeCompetencia(mesReferencia)) {
      return {
        mesReferencia: mesReferencia.toString(),
        colaboracoes: this.colaboracaoMensalRepository.listarPor(mesReferencia),
        jaCompilada: true,
      };
    }

    const ativas = this.cadastroDeParceiras.listarAtivasComCondicoes();
    if (!ativas || ativas.length === 0) {
      throw new Error(
        'CM-03: nenhuma Parceira ativa — compilação de ' +
          mesReferencia.toString() +
          ' recusada, nada foi criado.'
      );
    }

    const colaboracoes = ativas.map(
      (parceira) =>
        new ColaboracaoMensal(
          parceira.parceiraId,
          mesReferencia,
          new CondicaoComercialSnapshot(parceira.condicoes)
        )
    );

    this.colaboracaoMensalRepository.salvarTodas(colaboracoes);

    this.publicadorDeEventos.publicar({
      nome: 'MesCompilado',
      mesReferencia: mesReferencia.toString(),
      colaboracoes: colaboracoes,
    });

    return {
      mesReferencia: mesReferencia.toString(),
      colaboracoes: colaboracoes,
      jaCompilada: false,
    };
  }
};
