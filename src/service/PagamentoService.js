/**
 * SERVICE: PagamentoService — casos de uso da Gestão de Pagamentos
 * (SPEC-020 UC-020.01/02/03).
 *
 * - UC-020.01: reage a `MesCompilado`, materializando uma Obrigação `Mensal`
 *   `EmAberto` por Parceira Ativa (RN-01), idempotente por competência
 *   (mesmo padrão F1/F2 de EntregaService/EnvioService — nunca sobrescreve
 *   liberações/pagamentos já feitos).
 * - UC-020.02: lança uma Obrigação `Avulso` individual (RN-04/CB-01 —
 *   competência opcional).
 * - UC-020.03: gera a mensagem de cobrança (PIX lido ao vivo na porta do
 *   Cadastro, nunca persistido — RNF-01) e libera (`EmAberto` → `Aprovado`,
 *   `PagamentoLiberado`); depois, paga (`Aprovado` → `Pago`, arquiva,
 *   `PagamentoConfirmado`).
 *
 * ✅ Q-04 (PO 2026-07-17, opção B, SPEC-020 §9): `liberar()` de uma
 * Obrigação `Mensal` exige que TODAS as Entregas da Parceira na mesma
 * competência estejam `Aprovado` ou `Publicado` (SPEC-012 §9) — nenhuma em
 * `AguardandoMaterial`/`EmRevisao`. Publicação NÃO é requisito (`Aprovado`
 * já habilita). Sem Entregas na competência é vacuamente elegível. Este
 * gate NÃO se aplica a Obrigação `Avulso` (sem ligação 1:1 com o mês
 * padrão) — liberação manual do Admin, como o MVP original recomendava.
 * Violação → PG-05.
 *
 * §12: eventos publicados SÓ APÓS persistência bem-sucedida — falha na
 * persistência nunca publica evento (mesma disciplina de SPEC-005/009/012).
 * §17: PG-01 Obrigação inexistente; PG-03 transição inválida (domínio);
 * PG-05 conteúdo ainda não aprovado (Q-04).
 *
 * DÍVIDA REGISTRADA: autorização por papel (§13, PG-04) — o Portal ainda
 * não possui camada de papéis (Q-08), mesma dívida das demais SPECs.
 *
 * Não pode: tocar SpreadsheetApp; conhecer coluna física; formatar envelope.
 *
 * @param {object} cadastroDeParceiras porta do Cadastro (ParceiraACL):
 *   listarAtivasComCondicoes() e obterContatoDeEnvio(parceiraId) → {pix}.
 * @param {EntregaRepository} entregaRepository leitura do conteúdo da
 *   competência, para o gate de elegibilidade (Q-04). Somente leitura.
 * @param {PagamentoRepository} pagamentoRepository persistência do agregado.
 * @param {object} geradorDeId porta de identidade opaca: gerar() → string.
 * @param {object} publicadorDeEventos porta de eventos: publicar(evento).
 * @param {object} relogio porta de tempo: hoje() → Date (RN-03).
 */

this.PagamentoService = class PagamentoService {
  constructor(
    cadastroDeParceiras,
    entregaRepository,
    pagamentoRepository,
    geradorDeId,
    publicadorDeEventos,
    relogio
  ) {
    this.cadastroDeParceiras = cadastroDeParceiras;
    this.entregaRepository = entregaRepository;
    this.pagamentoRepository = pagamentoRepository;
    this.geradorDeId = geradorDeId;
    this.publicadorDeEventos = publicadorDeEventos;
    this.relogio = relogio;
  }

  /**
   * UC-020.01 · Reação a `MesCompilado`: lança uma Obrigação `Mensal`
   * `EmAberto` por Parceira Ativa, com o valor das Condições Comerciais
   * (§14.1). Idempotente por competência (F1/F2).
   * @param {string} mesReferenciaTexto competência 'AAAA-MM'.
   * @returns {ObrigacaoFinanceira[]} Obrigações materializadas (vazio se já existia).
   */
  materializarParaCompetencia(mesReferenciaTexto) {
    const mesReferencia = MesReferencia.deTexto(String(mesReferenciaTexto));
    if (this.pagamentoRepository.existeParaCompetencia(mesReferencia)) {
      return [];
    }
    const ativas = this.cadastroDeParceiras.listarAtivasComCondicoes();
    const obrigacoes = ativas.map(
      (parceira) =>
        new ObrigacaoFinanceira(
          this.geradorDeId.gerar(),
          parceira.parceiraId,
          'Mensal',
          mesReferencia,
          parceira.condicoes.valorMensal
        )
    );
    return this.pagamentoRepository.materializarCompetencia(mesReferencia, obrigacoes);
  }

  /**
   * UC-020.02 · Lançar Obrigação Avulsa (RN-04/CB-01 — competência opcional).
   * @param {{parceiraId: string, valor: number, mesReferencia: (string|undefined)}} comando
   * @returns {ObrigacaoFinanceira}
   */
  lancarAvulso(comando) {
    const mesReferencia =
      comando && comando.mesReferencia
        ? MesReferencia.deTexto(String(comando.mesReferencia))
        : null;
    const obrigacao = new ObrigacaoFinanceira(
      this.geradorDeId.gerar(),
      comando ? comando.parceiraId : undefined,
      'Avulso',
      mesReferencia,
      comando ? comando.valor : undefined
    );
    return this.pagamentoRepository.salvar(obrigacao);
  }

  /**
   * UC-020.03 (1ª parte) · Gera a mensagem de cobrança (PIX ao vivo,
   * RNF-01) e libera `EmAberto` → `Aprovado` (Q-04: gate de elegibilidade
   * só para `Mensal`), persiste e publica `PagamentoLiberado` (§12).
   * @param {{id: string}} comando
   * @returns {{obrigacao: ObrigacaoFinanceira, mensagem: string}}
   * @throws {Error} PG-01 inexistente; PG-05 conteúdo ainda não aprovado;
   *   PG-03 transição inválida.
   */
  liberar(comando) {
    const obrigacao = this.obterOuFalhar(comando);
    if (obrigacao.tipo === 'Mensal') {
      this.exigirConteudoAprovado(obrigacao);
    }
    obrigacao.liberar();
    this.pagamentoRepository.salvar(obrigacao);

    this.publicadorDeEventos.publicar({
      nome: 'PagamentoLiberado',
      obrigacaoId: obrigacao.id,
      parceiraId: obrigacao.parceiraId,
      mesReferencia: obrigacao.mesReferencia ? obrigacao.mesReferencia.toString() : null,
    });

    const contato = this.cadastroDeParceiras.obterContatoDeEnvio(obrigacao.parceiraId) || {
      pix: '',
    };
    return {
      obrigacao,
      mensagem:
        'Cobrança de R$ ' + obrigacao.valor.toFixed(2) + ' — Chave PIX: ' + contato.pix,
    };
  }

  /**
   * UC-020.03 (2ª parte) · Paga `Aprovado` → `Pago`, arquivando com a data
   * do relógio (RN-03), persiste e publica `PagamentoConfirmado` (§12, sem
   * PII — consumidor futuro: SPEC-034).
   * @param {{id: string}} comando
   * @returns {ObrigacaoFinanceira}
   * @throws {Error} PG-01 inexistente; PG-03 transição inválida.
   */
  pagar(comando) {
    const obrigacao = this.obterOuFalhar(comando);
    obrigacao.pagar(this.relogio.hoje());
    this.pagamentoRepository.salvar(obrigacao);

    this.publicadorDeEventos.publicar({
      nome: 'PagamentoConfirmado',
      obrigacaoId: obrigacao.id,
      dataArquivamento: obrigacao.dataArquivamento,
    });
    return obrigacao;
  }

  /**
   * Lista as Obrigações da competência, opcionalmente por Parceira.
   * @param {string} mesReferenciaTexto 'AAAA-MM'.
   * @param {string} [parceiraId]
   * @returns {ObrigacaoFinanceira[]}
   */
  listarPagamentos(mesReferenciaTexto, parceiraId) {
    return this.pagamentoRepository.listarPor(
      MesReferencia.deTexto(String(mesReferenciaTexto)),
      parceiraId
    );
  }

  /**
   * Q-04 (opção B): todas as Entregas da Parceira na competência da
   * Obrigação devem estar `Aprovado` ou `Publicado`. Sem Entregas é
   * vacuamente elegível.
   * @param {ObrigacaoFinanceira} obrigacao Obrigação `Mensal`.
   * @throws {Error} PG-05 quando alguma Entrega ainda não está aprovada.
   */
  exigirConteudoAprovado(obrigacao) {
    const entregas = this.entregaRepository.listarPor(
      obrigacao.mesReferencia,
      obrigacao.parceiraId
    );
    const pendente = entregas.find(
      (entrega) => entrega.estado !== 'Aprovado' && entrega.estado !== 'Publicado'
    );
    if (pendente) {
      throw new Error(
        "PG-05: liberação recusada — conteúdo de '" +
          obrigacao.parceiraId +
          "' ainda não aprovado na competência " +
          obrigacao.mesReferencia.toString() +
          " (Entrega '" +
          pendente.rotulo +
          "' está '" +
          pendente.estado +
          "', Q-04)."
      );
    }
  }

  /**
   * Resolve o comando externo na Obrigação alvo (PG-01 fail-fast).
   * @param {{id: string}} comando
   * @returns {ObrigacaoFinanceira}
   */
  obterOuFalhar(comando) {
    if (comando == null || typeof comando !== 'object' || !comando.id) {
      throw new Error('PG-01: comando ausente — identifique a Obrigação Financeira.');
    }
    const obrigacao = this.pagamentoRepository.obterPor(comando.id);
    if (obrigacao === null) {
      throw new Error("PG-01: Obrigação Financeira inexistente — '" + comando.id + "'.");
    }
    return obrigacao;
  }
};
