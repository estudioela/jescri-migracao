/**
 * MÓDULO: Arquivamento — selamento de competência, arquivamento e trava global (SPEC-034/ADR-011)
 *
 * Fatia vertical (ADR-014): camadas como seções, na ordem
 * DOMAIN → ACL → REPOSITORY → SERVICE → CONTROLLER → ADAPTERS.
 * Os contratos de camada valem integralmente (docs/ARQUITETURA_CAMADAS.md).
 */

// ============================================================================
// DOMAIN — JanelaDeBloqueio.js (ex-src/domain/JanelaDeBloqueio.js)
// ============================================================================

/**
 * VO: JanelaDeBloqueio (SPEC-025 §6.1, RN-02) — suspensão temporária do
 * acesso após tentativas malsucedidas: 15 minutos a partir do início.
 *
 * INV-02: enquanto a janela está ativa, nenhuma autenticação é aceita
 * (CB-03); após o fim, o acesso volta a NaoAutenticada (§9).
 */

this.JanelaDeBloqueio = class JanelaDeBloqueio {
  /** Duração canônica do bloqueio (RN-02: PRD §7 RN-17). */
  static get DURACAO_MINUTOS() {
    return 15;
  }

  /** @param {Date} inicio instante da falha que disparou o bloqueio. */
  constructor(inicio) {
    if (!inicio || typeof inicio.getTime !== 'function' || isNaN(inicio.getTime())) {
      throw new Error('JanelaDeBloqueio exige início válido.');
    }
    this.inicio = new Date(inicio.getTime());
    this.fim = new Date(
      inicio.getTime() + JanelaDeBloqueio.DURACAO_MINUTOS * 60 * 1000
    );
  }

  /**
   * @param {Date} instante
   * @returns {boolean} true enquanto o bloqueio impede autenticação (INV-02).
   */
  ativaEm(instante) {
    return instante.getTime() < this.fim.getTime();
  }
};

// ============================================================================
// ACL — BloqueioACL.js (ex-src/acl/BloqueioACL.js)
// ============================================================================

/**
 * ACL: BloqueioACL — camada anticorrupção da aba física `BLOQUEIOS`.
 *
 * Único ponto que conhece as colunas físicas IDENTIFICADOR | TENTATIVAS |
 * BLOQUEIO_INICIO. Acessa a planilha SEMPRE por cabeçalho, nunca por índice
 * fixo. Escrita: upsert reescreve a aba inteira num ÚNICO setValues (mesmo
 * padrão DocumentoACL). BLOQUEIO_INICIO vazio = sem janela ativa; datas em
 * ISO-8601, leitura aceita Date ou texto (fail-fast).
 *
 * O identificador é o apresentado na credencial — nunca registrá-lo em
 * log/evento com PII associada (RN-04, Contrato §5).
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues() e getRange(...).setValues(...)).
 */

this.BloqueioACL = class BloqueioACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * @param {string} identificador
   * @returns {{tentativas: number, inicio: (Date|null)}|null}
   */
  obter(identificador) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const linha = valores
      .slice(1)
      .find(
        (l) =>
          String(l[coluna('IDENTIFICADOR')]).trim() === String(identificador).trim()
      );
    if (!linha) {
      return null;
    }
    return {
      tentativas: this.tentativasParaCanonico(linha[coluna('TENTATIVAS')]),
      inicio: this.inicioParaCanonico(linha[coluna('BLOQUEIO_INICIO')]),
    };
  }

  /**
   * Insere ou substitui o registro do identificador (upsert).
   * @param {string} identificador
   * @param {number} tentativas
   * @param {Date|null} inicio início da janela de bloqueio, ou null.
   */
  salvar(identificador, tentativas, inicio) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const nova = cabecalho.map(() => '');
    nova[coluna('IDENTIFICADOR')] = String(identificador).trim();
    nova[coluna('TENTATIVAS')] = tentativas;
    nova[coluna('BLOQUEIO_INICIO')] = inicio ? inicio.toISOString() : '';
    const linhas = valores
      .slice(1)
      .filter(
        (linha) =>
          String(linha[coluna('IDENTIFICADOR')]).trim() !== String(identificador).trim()
      );
    linhas.push(nova);
    this.regravar(cabecalho, linhas);
  }

  /**
   * Remove o registro do identificador (fim da janela / autenticação ok).
   * @param {string} identificador
   */
  remover(identificador) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const linhas = valores
      .slice(1)
      .filter(
        (linha) =>
          String(linha[coluna('IDENTIFICADOR')]).trim() !== String(identificador).trim()
      );
    this.regravar(cabecalho, linhas);
  }

  /**
   * Coage TENTATIVAS cru → inteiro ≥ 0, fail-fast (ADR-001 §2).
   * @param {*} cru
   * @returns {number}
   */
  tentativasParaCanonico(cru) {
    const texto = String(cru == null ? '' : cru).trim();
    const valor = texto === '' ? 0 : Number(texto);
    if (isNaN(valor) || valor < 0) {
      throw new Error(
        "TENTATIVAS inválida em 'BLOQUEIOS'.TENTATIVAS: '" + cru + "'."
      );
    }
    return valor;
  }

  /**
   * Coage BLOQUEIO_INICIO cru → Date ou null (vazio), fail-fast.
   * @param {*} cru Date do Sheets, texto ISO ou vazio.
   * @returns {Date|null}
   */
  inicioParaCanonico(cru) {
    if (cru == null || String(cru).trim() === '') {
      return null;
    }
    const data = typeof cru.getTime === 'function' ? cru : new Date(String(cru));
    if (isNaN(data.getTime())) {
      throw new Error(
        "BLOQUEIO_INICIO inválido em 'BLOQUEIOS'.BLOQUEIO_INICIO: '" + cru + "'."
      );
    }
    return data;
  }

  /**
   * @param {Array} cabecalho
   * @returns {function(string): number} resolve nome → índice, fail-fast.
   */
  resolvedorDeColuna(cabecalho) {
    return criarResolvedorDeColuna(cabecalho, 'BLOQUEIOS');
  }

  /**
   * Regrava a aba inteira (cabeçalho + linhas) num único setValues.
   * @param {Array} cabecalho
   * @param {Array<Array>} linhas
   */
  regravar(cabecalho, linhas) {
    reescreverAba(this.sheet, cabecalho, linhas);
  }
};

// ============================================================================
// REPOSITORY — BloqueioRepository.js (ex-src/repository/BloqueioRepository.js)
// ============================================================================

/**
 * REPOSITORY: BloqueioRepository — persistência do estado de tentativas e
 * da Janela de Bloqueio por identificador (SPEC-025 RN-02).
 *
 * Projeção explícita (§3.5): identificador (chave), tentativas, início da
 * janela. Acessa a aba SEMPRE via ACL. A política (limite/duração) é do
 * domínio (Autenticador/JanelaDeBloqueio) — aqui só estado.
 *
 * @param {BloqueioACL} acl ACL única da aba BLOQUEIOS.
 */

this.BloqueioRepository = class BloqueioRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * @param {string} identificador
   * @returns {number} falhas acumuladas (0 se não houver registro).
   */
  contarFalhas(identificador) {
    const registro = this.acl.obter(identificador);
    return registro ? registro.tentativas : 0;
  }

  /**
   * Persiste o total de falhas do identificador (sem janela).
   * @param {string} identificador
   * @param {number} falhas
   */
  salvarFalhas(identificador, falhas) {
    this.acl.salvar(identificador, falhas, null);
  }

  /**
   * @param {string} identificador
   * @returns {JanelaDeBloqueio|null} janela persistida, se houver.
   */
  obterJanela(identificador) {
    const registro = this.acl.obter(identificador);
    if (!registro || !registro.inicio) {
      return null;
    }
    return new JanelaDeBloqueio(registro.inicio);
  }

  /**
   * Persiste a Janela de Bloqueio aplicada ao identificador (CB-01).
   * @param {string} identificador
   * @param {JanelaDeBloqueio} janela
   * @param {number} falhas total de falhas que disparou o bloqueio.
   */
  bloquear(identificador, janela, falhas) {
    this.acl.salvar(identificador, falhas, janela.inicio);
  }

  /**
   * Zera o estado do identificador (janela vencida ou autenticação ok — §9).
   * @param {string} identificador
   */
  limpar(identificador) {
    this.acl.remover(identificador);
  }
};

// ============================================================================
// SERVICE — ArquivamentoService.js (ex-src/service/ArquivamentoService.js)
// ============================================================================

/**
 * SERVICE: ArquivamentoService — única entrada para os comandos de
 * Arquivamento (SPEC-034, UC-034.01/UC-034.02).
 *
 * RN-07 (resolve D-01, §21 da SPEC): a competência é elegível para selagem
 * quando TODO item existente das 3 origens (Entrega/SPEC-012 `Publicado`,
 * Envio/SPEC-016 `Entregue`, Obrigação `Mensal`/SPEC-020 `Pago`) já está em
 * estado terminal. Ausência de itens de um módulo é vacuamente satisfeita
 * (CB-03) — nunca bloqueia. Obrigação `Avulso` não tem competência
 * (`mesReferencia === null`) e já fica fora de `listarPagamentos`.
 *
 * A transição de domínio (Concluída -> Arquivada, CM-06) é validada aqui
 * sobre os agregados reidratados antes de qualquer escrita — falha fail-fast
 * se a competência não estiver no estado que o domínio exige, sem persistir
 * nada (CB-01/AR-02/AR-03).
 *
 * Depende só de Services de outros módulos (EntregaService/EnvioService/
 * PagamentoService) para as checagens de elegibilidade — nunca de
 * ACL/Repository alheios (mesmo princípio de SPEC-027/030/032). O único
 * Repository próprio é o da Colaboração Mensal, porque selar a competência
 * É a responsabilidade deste Service sobre o seu próprio agregado.
 *
 * Não pode: falar HTTP/HTML; formatar envelope (Controller); conhecer
 * coluna física (ACL); checar papel/autorização (Q-08, dívida registrada).
 *
 * @param {EntregaService} entregaService
 * @param {EnvioService} envioService
 * @param {PagamentoService} pagamentoService
 * @param {ColaboracaoMensalRepository} colaboracaoMensalRepository
 * @param {object} publicadorDeEventos porta de eventos: publicar(evento).
 */

this.ArquivamentoService = class ArquivamentoService {
  constructor(
    entregaService,
    envioService,
    pagamentoService,
    colaboracaoMensalRepository,
    publicadorDeEventos
  ) {
    this.entregaService = entregaService;
    this.envioService = envioService;
    this.pagamentoService = pagamentoService;
    this.colaboracaoMensalRepository = colaboracaoMensalRepository;
    this.publicadorDeEventos = publicadorDeEventos;
  }

  /**
   * Comando SelarCompetencia(MesReferencia) — UC-034.02.
   * @param {string} mesReferenciaTexto competência no formato canônico 'AAAA-MM'.
   * @returns {{mesReferencia: string, jaSelada: boolean}}
   * @throws {Error} AR-02 se a competência não foi compilada ou tem
   *   pendências operacionais; erro do domínio (CM-06) se a transição de
   *   estado for inválida.
   */
  selarCompetencia(mesReferenciaTexto) {
    const mesReferencia = MesReferencia.deTexto(mesReferenciaTexto);
    const colaboracoes = this.colaboracaoMensalRepository.listarPor(mesReferencia);

    if (colaboracoes.length === 0) {
      throw new Error(
        "AR-02: competência '" + mesReferencia.toString() + "' não foi compilada — nada para selar."
      );
    }
    if (colaboracoes.every((colaboracao) => colaboracao.estado === 'Arquivada')) {
      return { mesReferencia: mesReferencia.toString(), jaSelada: true };
    }

    const entregas = this.entregaService.listarEntregas(mesReferenciaTexto);
    const envios = this.envioService.listarEnvios(mesReferenciaTexto);
    const obrigacoes = this.pagamentoService.listarPagamentos(mesReferenciaTexto);
    const pendente =
      entregas.some((entrega) => entrega.estado !== 'Publicado') ||
      envios.some((envio) => envio.jornada !== 'Entregue') ||
      obrigacoes.some((obrigacao) => obrigacao.estado !== 'Pago');
    if (pendente) {
      throw new Error(
        "AR-02: competência '" + mesReferencia.toString() + "' tem pendências operacionais — selagem recusada."
      );
    }

    colaboracoes.forEach((colaboracao) => {
      if (colaboracao.estado === 'Ativa') {
        colaboracao.concluir();
      }
      colaboracao.arquivar();
    });
    this.colaboracaoMensalRepository.arquivarCompetencia(mesReferencia);
    this.publicadorDeEventos.publicar({
      nome: 'CompetenciaArquivada',
      mesReferencia: mesReferencia.toString(),
    });

    return { mesReferencia: mesReferencia.toString(), jaSelada: false };
  }

  /**
   * Comando ArquivarLote() — UC-034.01: varre todas as competências ainda
   * não seladas por inteiro e sela as que estão elegíveis (RN-07); as
   * demais são reportadas com o motivo da recusa, sem interromper o lote.
   * Sem candidatas → no-op (CB-03).
   * @returns {{resultados: Array<{mesReferencia: string, selada: boolean, motivo: (string|undefined)}>}}
   */
  arquivarLote() {
    const candidatas = [];
    this.colaboracaoMensalRepository.listarTodas().forEach((colaboracao) => {
      if (colaboracao.estado === 'Arquivada') {
        return;
      }
      if (!candidatas.some((mes) => mes.igualA(colaboracao.mesReferencia))) {
        candidatas.push(colaboracao.mesReferencia);
      }
    });

    const resultados = candidatas.map((mesReferencia) => {
      try {
        const selagem = this.selarCompetencia(mesReferencia.toString());
        return { mesReferencia: selagem.mesReferencia, selada: !selagem.jaSelada };
      } catch (erro) {
        return { mesReferencia: mesReferencia.toString(), selada: false, motivo: erro.message };
      }
    });

    return { resultados: resultados };
  }
};

// ============================================================================
// CONTROLLER — ArquivamentoController.js (ex-src/controller/ArquivamentoController.js)
// ============================================================================

/**
 * CONTROLLER: ArquivamentoController — adapta o contrato externo do
 * Arquivamento (SPEC-034 UC-034.01/UC-034.02).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * ArquivamentoService e devolve SEMPRE o envelope padrão
 * {success,data}/{success,error} (PROJECT_GOVERNANCE §3.3).
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {ArquivamentoService} arquivamentoService
 */

this.ArquivamentoController = class ArquivamentoController {
  constructor(arquivamentoService) {
    this.arquivamentoService = arquivamentoService;
  }

  /**
   * Adapta o comando SelarCompetencia ao contrato externo (UC-034.02).
   * @param {{mesReferencia: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  selarCompetencia(dados) {
    try {
      const resultado = this.arquivamentoService.selarCompetencia(dados && dados.mesReferencia);
      return envelopeOk(resultado);
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando ArquivarLote ao contrato externo (UC-034.01).
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  arquivarLote() {
    try {
      const resultado = this.arquivamentoService.arquivarLote();
      return envelopeOk(resultado);
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }
};
