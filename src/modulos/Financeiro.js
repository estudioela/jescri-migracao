/**
 * MÓDULO: Financeiro — gestão de pagamentos (SPEC-020) e financeiro no Portal (SPEC-030)
 *
 * Fatia vertical (ADR-014): camadas como seções, na ordem
 * DOMAIN → ACL → REPOSITORY → SERVICE → CONTROLLER → ADAPTERS.
 * Os contratos de camada valem integralmente (docs/ARQUITETURA_CAMADAS.md).
 */

// ============================================================================
// DOMAIN — ObrigacaoFinanceira.js (ex-src/domain/ObrigacaoFinanceira.js)
// ============================================================================

/**
 * AGREGADO RAIZ: ObrigacaoFinanceira (SPEC-020 §6.2)
 *
 * Pagamento devido a uma Parceira — mensal (nasce da Colaboração Mensal
 * compilada, UC-020.01) ou avulso (extra/UGC, fora do mês padrão, RN-04).
 *
 * Invariantes preservadas:
 * - INV-01: toda Obrigação pertence a exatamente uma Parceira.
 * - INV-02: valor e estado sempre presentes; estado no Enum canônico.
 * - INV-03: Obrigação arquivada (`Pago`) é somente leitura.
 * - §9: máquina de estados fechada EmAberto → Aprovado → Pago (terminal,
 *   arquiva); transição inválida falha barulhento (PG-03).
 * - RN-04/CB-01: Obrigação `Avulso` pode não ter competência (período livre).
 *
 * A elegibilidade de `liberar()` (Q-04) NÃO pertence a este agregado — é
 * regra do Service (PagamentoService), que precisa consultar o estado do
 * conteúdo (Entrega, SPEC-012). Este domínio não conhece Entrega.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna
 * física, Entrega/Briefing (fronteira SPEC-012).
 */

this.ObrigacaoFinanceira = class ObrigacaoFinanceira {
  /**
   * @param {string} id identidade estável e opaca da Obrigação.
   * @param {string} parceiraId identidade da Parceira (INV-01).
   * @param {'Mensal'|'Avulso'} tipo tipo canônico fechado.
   * @param {MesReferencia|null} mesReferencia competência da Colaboração
   *   Mensal — obrigatória para `Mensal`; opcional para `Avulso` (CB-01).
   * @param {number} valor valor da Obrigação (INV-02).
   */
  constructor(id, parceiraId, tipo, mesReferencia, valor) {
    const idTexto = String(id == null ? '' : id).trim();
    if (idTexto === '') {
      throw new Error('INV-01: toda Obrigação Financeira exige identidade própria.');
    }
    const parceiraIdTexto = String(parceiraId == null ? '' : parceiraId).trim();
    if (parceiraIdTexto === '') {
      throw new Error('INV-01: toda Obrigação Financeira pertence a uma Parceira.');
    }
    if (tipo !== 'Mensal' && tipo !== 'Avulso') {
      throw new Error("Tipo de Obrigação Financeira desconhecido: '" + tipo + "'.");
    }
    if (tipo === 'Mensal' && !(mesReferencia instanceof MesReferencia)) {
      throw new Error('RN-01: Obrigação Mensal exige a competência da Colaboração (§9).');
    }
    if (mesReferencia !== null && !(mesReferencia instanceof MesReferencia)) {
      throw new Error('Competência inválida — esperado MesReferencia ou null (CB-01).');
    }
    if (typeof valor !== 'number' || !isFinite(valor)) {
      throw new Error("INV-02: valor da Obrigação Financeira inválido: '" + valor + "'.");
    }
    this.id = idTexto;
    this.parceiraId = parceiraIdTexto;
    this.tipo = tipo;
    this.mesReferencia = mesReferencia;
    this.valor = valor;
    // §9: nasce EmAberto (RN-01).
    this.estado = 'EmAberto';
    this.dataArquivamento = null;
  }

  /**
   * EmAberto → Aprovado (§9): a elegibilidade (Q-04) já foi verificada pelo
   * chamador (Service) antes de invocar esta transição.
   * @returns {ObrigacaoFinanceira}
   * @throws {Error} PG-03 fora de EmAberto.
   */
  liberar() {
    if (this.estado !== 'EmAberto') {
      throw new Error(
        "PG-03: transição inválida (§9) — liberar exige 'EmAberto', estado atual: '" +
          this.estado +
          "'."
      );
    }
    this.estado = 'Aprovado';
    return this;
  }

  /**
   * Aprovado → Pago (§9), terminal: arquiva automaticamente (RN-03).
   * @param {Date} dataArquivamento data do arquivamento (relógio injetado).
   * @returns {ObrigacaoFinanceira}
   * @throws {Error} PG-03 fora de Aprovado, ou já Pago (CB-02).
   */
  pagar(dataArquivamento) {
    if (this.estado === 'Pago') {
      throw new Error(
        "PG-03: transição inválida (§9/CB-02) — 'Pago' é terminal, a Obrigação '" +
          this.id +
          "' já foi paga."
      );
    }
    if (this.estado !== 'Aprovado') {
      throw new Error(
        "PG-03: transição inválida (§9) — pagar exige 'Aprovado', estado atual: '" +
          this.estado +
          "'."
      );
    }
    if (
      dataArquivamento == null ||
      typeof dataArquivamento.getTime !== 'function' ||
      isNaN(dataArquivamento.getTime())
    ) {
      throw new Error("RN-03: data de arquivamento inválida ao pagar '" + this.id + "'.");
    }
    this.estado = 'Pago';
    this.dataArquivamento = dataArquivamento;
    Object.freeze(this);
    return this;
  }

  /**
   * @returns {boolean}
   */
  estaPaga() {
    return this.estado === 'Pago';
  }
};

// ============================================================================
// DOMAIN — ResumoFinanceiro.js (ex-src/domain/ResumoFinanceiro.js)
// ============================================================================

/**
 * VALUE OBJECT: ResumoFinanceiro (SPEC-030 §6.1)
 *
 * Total previsto x total pago de uma Parceira num período (UC-030.01).
 * "Previsto" é tudo que ainda não chegou a `Pago` (`EmAberto`/`Aprovado`,
 * RN-02/CB-02: uma Obrigação `EmAberto` conta em previsto, nunca em pago).
 * Projeção pura de leitura sobre `ObrigacaoFinanceira` (SPEC-020) — nunca
 * persistido, nunca altera a máquina de estados da Obrigação.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.ResumoFinanceiro = class ResumoFinanceiro {
  /**
   * @param {number} previsto soma das Obrigações ainda não pagas.
   * @param {number} pago soma das Obrigações já pagas.
   */
  constructor(previsto, pago) {
    this.previsto = Number(previsto);
    this.pago = Number(pago);
  }

  /**
   * Agrega as Obrigações Financeiras de um período em previsto x pago
   * (RN-02/CB-02).
   * @param {ObrigacaoFinanceira[]} obrigacoes
   * @returns {ResumoFinanceiro}
   */
  static de(obrigacoes) {
    const previsto = obrigacoes
      .filter((obrigacao) => obrigacao.estado !== 'Pago')
      .reduce((soma, obrigacao) => soma + obrigacao.valor, 0);
    const pago = obrigacoes
      .filter((obrigacao) => obrigacao.estado === 'Pago')
      .reduce((soma, obrigacao) => soma + obrigacao.valor, 0);
    return new ResumoFinanceiro(previsto, pago);
  }
};

// ============================================================================
// ACL — PagamentoACL.js (ex-src/acl/PagamentoACL.js)
// ============================================================================

/**
 * ACL: PagamentoACL — camada anticorrupção da Obrigação Financeira
 * (SPEC-020; aba física PAGAMENTOS, nova, própria da V2).
 *
 * DECISÃO LOCAL (D-02 resolvido na implementação — mesma convenção
 * mecânica de EntregaACL/EnvioACL/DocumentoACL, SCREAMING_SNAKE_CASE do
 * nome canônico): a SPEC-020 não define persistência física (§1).
 *
 * Uma ACL por aba (Contrato §7): único ponto que conhece as colunas
 * físicas da aba PAGAMENTOS. Resolução SEMPRE por cabeçalho.
 *
 * Projeção física — uma linha por Obrigação:
 * - ID_OBRIGACAO ← identidade opaca (INV-01).
 * - INFLU_KEY / TIPO_PAGAMENTO / ANO_REFERENCIA / MES_REFERENCIA ← origem
 *   (competência vazia para Avulso sem período, CB-01).
 * - VALOR / ESTADO / DATA_ARQUIVAMENTO ← estado da máquina (§9).
 * Nenhum PIX/dado de contato é persistido aqui — RNF-01 (a chave PIX é lida
 * ao vivo na porta do Cadastro, ParceiraACL.obterContatoDeEnvio, só para
 * compor a mensagem de cobrança — nunca persistida no Pagamento).
 *
 * Escrita: `substituirCompetencia` upsert em lote (materialização mensal,
 * RN-01); `salvar` upsert de uma Obrigação pela identidade (transições
 * liberar/pagar e lançamento avulso individual).
 *
 * A reidratação atravessa o domínio (liberar/pagar) — nunca escreve estado
 * por fora; ESTADO cru desconhecido ou incoerente falha barulhento (PG-02).
 *
 * Não pode conter regra de negócio nem ser duplicada.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues(), clearContents() e
 *   getRange(...).setValues(...)).
 */

this.PagamentoACL = class PagamentoACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Coage o tipo canônico → rótulo cru persistido.
   * @param {'Mensal'|'Avulso'} canonico
   * @returns {string}
   */
  tipoParaCru(canonico) {
    const mapa = { Mensal: 'MENSAL', Avulso: 'AVULSO' };
    if (!mapa[canonico]) {
      throw new Error("Tipo de Obrigação Financeira desconhecido: '" + canonico + "'.");
    }
    return mapa[canonico];
  }

  /**
   * Coage o TIPO_PAGAMENTO físico cru → canônico do domínio.
   * @param {string} cru
   * @returns {'Mensal'|'Avulso'}
   */
  tipoParaCanonico(cru) {
    const normalizado = String(cru == null ? '' : cru).trim().toLowerCase();
    const mapa = { mensal: 'Mensal', avulso: 'Avulso' };
    if (!mapa[normalizado]) {
      throw new Error(
        "PG-02: TIPO_PAGAMENTO desconhecido em 'PAGAMENTOS'.TIPO_PAGAMENTO: '" + cru + "'."
      );
    }
    return mapa[normalizado];
  }

  /**
   * Coage o estado canônico → cru persistido na aba (§9).
   * @param {string} canonico
   * @returns {string}
   */
  estadoParaCru(canonico) {
    const mapa = { EmAberto: 'EM_ABERTO', Aprovado: 'APROVADO', Pago: 'PAGO' };
    if (!mapa[canonico]) {
      throw new Error("Estado de Obrigação Financeira desconhecido: '" + canonico + "'.");
    }
    return mapa[canonico];
  }

  /**
   * Coage o ESTADO físico cru → canônico do domínio (RN-05/PG-02).
   * @param {string} cru
   * @returns {string}
   */
  estadoParaCanonico(cru) {
    const normalizado = String(cru == null ? '' : cru).trim().toLowerCase();
    const mapa = { em_aberto: 'EmAberto', aprovado: 'Aprovado', pago: 'Pago' };
    if (!mapa[normalizado]) {
      throw new Error("PG-02: ESTADO desconhecido em 'PAGAMENTOS'.ESTADO: '" + cru + "'.");
    }
    return mapa[normalizado];
  }

  /**
   * Substitui as Obrigações Mensais da competência num único lote (RN-01):
   * linhas de Obrigações Avulsas e de outras competências são preservadas.
   * @param {MesReferencia} mesReferencia
   * @param {ObrigacaoFinanceira[]} obrigacoes
   */
  substituirCompetencia(mesReferencia, obrigacoes) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const mantidas = valores.slice(1).filter((linha) => {
      if (String(linha[coluna('ID_OBRIGACAO')]).trim() === '') {
        return false;
      }
      const ehMensalDaCompetencia =
        this.tipoParaCanonico(linha[coluna('TIPO_PAGAMENTO')]) === 'Mensal' &&
        Number(linha[coluna('ANO_REFERENCIA')]) === mesReferencia.ano &&
        Number(linha[coluna('MES_REFERENCIA')]) === mesReferencia.mes;
      return !ehMensalDaCompetencia;
    });
    this.reescrever(cabecalho, mantidas.concat(this.linhasDe(cabecalho, obrigacoes)));
  }

  /**
   * Upsert de uma Obrigação pela identidade (ID_OBRIGACAO).
   * @param {ObrigacaoFinanceira} obrigacao
   */
  salvar(obrigacao) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const mantidas = valores.slice(1).filter((linha) => {
      if (String(linha[coluna('ID_OBRIGACAO')]).trim() === '') {
        return false;
      }
      return String(linha[coluna('ID_OBRIGACAO')]).trim() !== obrigacao.id;
    });
    this.reescrever(cabecalho, mantidas.concat(this.linhasDe(cabecalho, [obrigacao])));
  }

  /**
   * Lê a aba inteira e reconstrói as Obrigações, atravessando o domínio
   * (liberar/pagar — PG-03 nunca deveria disparar aqui; incoerência é
   * PG-02). Linhas sem ID_OBRIGACAO são ignoradas.
   * @returns {ObrigacaoFinanceira[]}
   */
  listarTodos() {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    return valores
      .slice(1)
      .filter((linha) => String(linha[coluna('ID_OBRIGACAO')]).trim() !== '')
      .map((linha) => this.reidratar(linha, coluna));
  }

  /**
   * @param {Array} linha linha física da Obrigação.
   * @param {function(string): number} coluna resolve nome → índice.
   * @returns {ObrigacaoFinanceira}
   */
  reidratar(linha, coluna) {
    const tipo = this.tipoParaCanonico(linha[coluna('TIPO_PAGAMENTO')]);
    const ano = linha[coluna('ANO_REFERENCIA')];
    const mes = linha[coluna('MES_REFERENCIA')];
    const mesReferencia =
      String(ano == null ? '' : ano).trim() === '' || String(mes == null ? '' : mes).trim() === ''
        ? null
        : new MesReferencia(Number(ano), Number(mes));
    const obrigacao = new ObrigacaoFinanceira(
      String(linha[coluna('ID_OBRIGACAO')]).trim(),
      String(linha[coluna('INFLU_KEY')]).trim(),
      tipo,
      mesReferencia,
      Number(linha[coluna('VALOR')])
    );
    const canonico = this.estadoParaCanonico(linha[coluna('ESTADO')]);
    if (canonico === 'Aprovado' || canonico === 'Pago') {
      obrigacao.liberar();
    }
    if (canonico === 'Pago') {
      obrigacao.pagar(
        celulaParaData(linha[coluna('DATA_ARQUIVAMENTO')], 'DATA_ARQUIVAMENTO', 'PAGAMENTOS')
      );
    }
    if (obrigacao.estado !== canonico) {
      throw new Error(
        "PG-02: linha incoerente em 'PAGAMENTOS' — ESTADO '" +
          canonico +
          "' não é alcançável com as colunas persistidas da Obrigação '" +
          obrigacao.id +
          "'."
      );
    }
    return obrigacao;
  }

  /**
   * @param {Array} cabecalho
   * @returns {function(string): number} resolve nome → índice, fail-fast.
   */
  resolvedorDeColuna(cabecalho) {
    return criarResolvedorDeColuna(cabecalho, 'PAGAMENTOS');
  }

  /**
   * Projeta Obrigações em linhas físicas.
   * @param {Array} cabecalho
   * @param {ObrigacaoFinanceira[]} obrigacoes
   * @returns {Array[]}
   */
  linhasDe(cabecalho, obrigacoes) {
    return obrigacoes.map((obrigacao) => {
      const fisico = {
        ID_OBRIGACAO: obrigacao.id,
        INFLU_KEY: obrigacao.parceiraId,
        TIPO_PAGAMENTO: this.tipoParaCru(obrigacao.tipo),
        ANO_REFERENCIA: obrigacao.mesReferencia ? obrigacao.mesReferencia.ano : '',
        MES_REFERENCIA: obrigacao.mesReferencia ? obrigacao.mesReferencia.mes : '',
        VALOR: obrigacao.valor,
        ESTADO: this.estadoParaCru(obrigacao.estado),
        DATA_ARQUIVAMENTO: obrigacao.dataArquivamento ? obrigacao.dataArquivamento : '',
      };
      return cabecalho.map((nome) =>
        Object.prototype.hasOwnProperty.call(fisico, nome) ? fisico[nome] : ''
      );
    });
  }

  /**
   * Regrava a aba inteira (cabeçalho + linhas) num único setValues.
   * @param {Array} cabecalho
   * @param {Array[]} linhas
   */
  reescrever(cabecalho, linhas) {
    reescreverAba(this.sheet, cabecalho, linhas);
  }
};

// ============================================================================
// REPOSITORY — PagamentoRepository.js (ex-src/repository/PagamentoRepository.js)
// ============================================================================

/**
 * REPOSITORY: PagamentoRepository — persistência da Obrigação Financeira
 * (SPEC-020).
 *
 * Único ponto (junto da ACL) que trata persistência do agregado. Fala
 * exclusivamente com a porta da ACL — nunca toca SpreadsheetApp nem conhece
 * coluna física.
 *
 * Não pode conter regra de negócio nem formatar envelope.
 *
 * @param {PagamentoACL} acl ACL única da Obrigação Financeira.
 */

this.PagamentoRepository = class PagamentoRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Materializa as Obrigações Mensais da competência num único lote (RN-01).
   * @param {MesReferencia} mesReferencia
   * @param {ObrigacaoFinanceira[]} obrigacoes
   * @returns {ObrigacaoFinanceira[]} as mesmas Obrigações persistidas.
   */
  materializarCompetencia(mesReferencia, obrigacoes) {
    this.acl.substituirCompetencia(mesReferencia, obrigacoes);
    return obrigacoes;
  }

  /**
   * Base factual para a idempotência da materialização mensal (mesmo padrão
   * de EntregaRepository/EnvioRepository — achado F1/F2 da auditoria
   * SPEC-012): existe alguma Obrigação Mensal já lançada nesta competência?
   * @param {MesReferencia} mesReferencia
   * @returns {boolean}
   */
  existeParaCompetencia(mesReferencia) {
    return this.listarPor(mesReferencia).some((obrigacao) => obrigacao.tipo === 'Mensal');
  }

  /**
   * Persiste uma Obrigação (lançamento avulso individual ou transição de
   * uma existente).
   * @param {ObrigacaoFinanceira} obrigacao
   * @returns {ObrigacaoFinanceira} a mesma Obrigação persistida.
   */
  salvar(obrigacao) {
    this.acl.salvar(obrigacao);
    return obrigacao;
  }

  /**
   * Busca uma Obrigação pela identidade (PG-01).
   * @param {string} id
   * @returns {ObrigacaoFinanceira|null}
   */
  obterPor(id) {
    return this.acl.listarTodos().find((obrigacao) => obrigacao.id === String(id).trim()) || null;
  }

  /**
   * Lista as Obrigações da competência, opcionalmente por Parceira.
   * @param {MesReferencia} mesReferencia
   * @param {string} [parceiraId]
   * @returns {ObrigacaoFinanceira[]}
   */
  listarPor(mesReferencia, parceiraId) {
    return this.acl
      .listarTodos()
      .filter(
        (obrigacao) => obrigacao.mesReferencia !== null && obrigacao.mesReferencia.igualA(mesReferencia)
      )
      .filter((obrigacao) => parceiraId === undefined || obrigacao.parceiraId === parceiraId);
  }

  /**
   * Lista as Obrigações Financeiras de uma Parceira em TODAS as competências,
   * inclusive Avulsas sem competência (query de SPEC-030, RN-04: períodos
   * selecionáveis = competências com atividade).
   * @param {string} parceiraId
   * @returns {ObrigacaoFinanceira[]}
   */
  listarPorParceira(parceiraId) {
    return this.acl.listarTodos().filter((obrigacao) => obrigacao.parceiraId === parceiraId);
  }
};

// ============================================================================
// SERVICE — PagamentoService.js (ex-src/service/PagamentoService.js)
// ============================================================================

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
   * Lista as Obrigações Financeiras de uma Parceira em TODAS as
   * competências, inclusive Avulsas sem competência (query de SPEC-030,
   * RN-04).
   * @param {string} parceiraId
   * @returns {ObrigacaoFinanceira[]}
   */
  listarPorParceira(parceiraId) {
    return this.pagamentoRepository.listarPorParceira(parceiraId);
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

// ============================================================================
// CONTROLLER — PagamentoController.js (ex-src/controller/PagamentoController.js)
// ============================================================================

/**
 * CONTROLLER: PagamentoController — adapta o contrato externo da Gestão de
 * Pagamentos (SPEC-020 UC-020.01/02/03).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * PagamentoService e devolve SEMPRE o envelope padrão {success,data}/
 * {success,error} (§3.3) — mesmo padrão de DocumentoController/
 * EntregaController (SPECs internas de operação): código do contrato
 * (PG-01/02/03/05) embutido na mensagem, sem campo `codigo` estruturado
 * (esse padrão é exclusivo das SPECs de acesso do Portal — 025/027/032).
 *
 * Expõe apenas uma projeção serializável da Obrigação Financeira — nunca a
 * instância de domínio. A mensagem de cobrança (com PIX) vai no envelope de
 * `liberar` porque o operador é o ator autorizado (§13) que entrega a
 * cobrança à Parceira; nunca é persistida nem logada por esta camada.
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {PagamentoService} pagamentoService
 */

this.PagamentoController = class PagamentoController {
  constructor(pagamentoService) {
    this.pagamentoService = pagamentoService;
  }

  /**
   * Adapta o comando LancarAvulso (UC-020.02) ao contrato externo.
   * @param {{parceiraId: string, valor: number, mesReferencia: (string|undefined)}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  lancarAvulso(dados) {
    try {
      return envelopeOk(this.projetar(this.pagamentoService.lancarAvulso(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando Liberar (UC-020.03, 1ª parte) ao contrato externo.
   * @param {{id: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  liberar(dados) {
    try {
      const resultado = this.pagamentoService.liberar(dados);
      return envelopeOk(
        Object.assign(this.projetar(resultado.obrigacao), { mensagem: resultado.mensagem })
      );
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando Pagar (UC-020.03, 2ª parte) ao contrato externo.
   * @param {{id: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  pagar(dados) {
    try {
      return envelopeOk(this.projetar(this.pagamentoService.pagar(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Lista as Obrigações da competência, opcionalmente por Parceira.
   * @param {{mesReferencia: string, parceiraId: (string|undefined)}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  listarPagamentos(dados) {
    try {
      const obrigacoes = this.pagamentoService.listarPagamentos(
        dados.mesReferencia,
        dados.parceiraId
      );
      return envelopeOk(obrigacoes.map((obrigacao) => this.projetar(obrigacao)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Projeção serializável da Obrigação Financeira.
   * @param {ObrigacaoFinanceira} obrigacao
   * @returns {object}
   */
  projetar(obrigacao) {
    return {
      id: obrigacao.id,
      parceiraId: obrigacao.parceiraId,
      tipo: obrigacao.tipo,
      mesReferencia: obrigacao.mesReferencia ? obrigacao.mesReferencia.toString() : null,
      valor: obrigacao.valor,
      estado: obrigacao.estado,
      dataArquivamento: obrigacao.dataArquivamento,
    };
  }
};

// ============================================================================
// SERVICE — PortalFinanceiroService.js (ex-src/service/PortalFinanceiroService.js)
// ============================================================================

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

// ============================================================================
// CONTROLLER — PortalFinanceiroController.js (ex-src/controller/PortalFinanceiroController.js)
// ============================================================================

/**
 * CONTROLLER: PortalFinanceiroController — adapta o contrato externo do
 * Financeiro e Histórico no Portal (SPEC-030 UC-030.01/02/03).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * PortalFinanceiroService e devolve SEMPRE o envelope padrão
 * {success,data}/{success,error} (PROJECT_GOVERNANCE §3.3). Erros do
 * contrato (§17: PF-01/PF-02) carregam o código, mesmo padrão de
 * PortalDeConteudoController/PerfilPortalController. Expõe apenas projeções
 * serializáveis — nunca a instância de domínio; datas saem como
 * 'AAAA-MM-DD'.
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {PortalFinanceiroService} portalFinanceiroService
 */

this.PortalFinanceiroController = class PortalFinanceiroController {
  constructor(portalFinanceiroService) {
    this.portalFinanceiroService = portalFinanceiroService;
  }

  /**
   * UC-030.03: lista as competências (períodos) selecionáveis pela Parceira
   * autenticada.
   * @param {{token: string}} dados
   * @returns {{success: true, data: string[]}|{success: false, error: object}}
   */
  listarPeriodos(dados) {
    try {
      const periodos = this.portalFinanceiroService.listarPeriodos(dados);
      return envelopeOk(periodos.map((periodo) => periodo.toString()));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-030.01: total previsto x pago do período selecionado.
   * @param {{token: string, mesReferencia: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  verFinanceiro(dados) {
    try {
      const resumo = this.portalFinanceiroService.verFinanceiro(dados);
      return envelopeOk({ previsto: resumo.previsto, pago: resumo.pago });
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-030.02: histórico de conteúdo e pagamentos arquivados do período.
   * @param {{token: string, mesReferencia: string}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  verHistorico(dados) {
    try {
      const itens = this.portalFinanceiroService.verHistorico(dados);
      return envelopeOk(itens.map((item) => this.projetarItem(item)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * Projeção serializável de um ItemDeHistorico.
   * @param {ItemDeHistorico} item
   * @returns {object}
   */
  projetarItem(item) {
    return {
      tipo: item.tipo,
      referencia: item.referencia,
      estado: item.estado,
      dataArquivamento: this.dataParaTexto(item.dataArquivamento),
      valor: item.valor,
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
