/* ═══════════════════════════════════════════════════════════════
   services/AtivacaoService.js
   ═══════════════════════════════════════════════════════════════ */

const EVENTO_ATIVACAO_ESTADO_ALTERADO = 'AtivacaoEstadoAlterado';

/** Prazo de aprovação = 7 dias corridos antes da entrega (regra do briefing). */
const DIAS_ANTECEDENCIA_APROVACAO = 7;

/** Coluna da base principal com o link da planilha individual (legado, V1). */
const CAMPO_SHEET_URL_PARCEIRO = 'INFLU_SHEET_URL';

/** Looks vazios: forma neutra usada quando não há planilha/looks a puxar. */
const LOOKS_BRIEFING_VAZIO = Object.freeze({ lookReel: '', lookCarrossel: '', lookStories1: '', lookStories2: '' });

class AtivacaoService {
  constructor(eventDispatcher, repository, briefingService, parceiroRepository) {
    if (!eventDispatcher) {
      throw new TypeError('AtivacaoService exige um EventDispatcher.');
    }

    this.eventDispatcher = eventDispatcher;
    this.repository = repository || new AtivacaoRepository();
    // Resolvidos preguiçosamente em `_looksDoBriefing`: instanciar
    // `ParceiroRepository`/`BriefingService` aqui tocaria `SpreadsheetApp` já na
    // construção, mas nem todo fluxo de ativação puxa looks.
    this.briefingService = briefingService || null;
    this.parceiroRepository = parceiroRepository || null;
  }

  /**
   * Leitura de todas as ativações de um ciclo, já em DTO.
   *
   * O Service nunca devolve a linha crua do Repository: a UI não pode depender
   * do nome das colunas da planilha, senão trocar Sheets por um banco na V3
   * quebraria o front-end — que é exatamente o que a camada existe para evitar.
   */
  listarPorCiclo(idCiclo) {
    if (!idCiclo) {
      throw new Error('É obrigatório informar o ciclo.');
    }

    return this.repository.findByCiclo(idCiclo).map(linha => this._paraDto(linha));
  }

  /**
   * Escopo por parceira. Sem isto, uma influenciadora autenticada veria as
   * entregas de todas as outras do mesmo ciclo.
   */
  listarDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora) {
    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    const ativacoes = this.listarPorCiclo(idCiclo)
      .filter(dto => dto.idInfluenciadora === String(idInfluenciadora));

    // Looks do BRIEFING vêm da planilha INDIVIDUAL da parceira (INFLU_SHEET_URL),
    // varrida uma única vez por ciclo e anexada a cada ativação — mesma origem da
    // V1 (`sincronizarLooks`).
    const looks = this._looksDoBriefing(idInfluenciadora);

    return ativacoes.map(dto => Object.assign({}, dto, { looksBriefing: looks }));
  }

  /**
   * Puxa os looks da planilha individual da parceira. FAIL-SAFE TOTAL: sem
   * parceira, sem `INFLU_SHEET_URL`, URL inválida ou acesso negado → looks
   * vazios. Nada aqui pode derrubar a montagem do ciclo (o `puxarLooks` já é
   * fail-safe; este `try` cobre também a leitura da parceira).
   */
  _looksDoBriefing(idInfluenciadora) {
    try {
      const parceiroRepository = this.parceiroRepository || (this.parceiroRepository = new ParceiroRepository());
      const briefingService = this.briefingService || (this.briefingService = new BriefingService());

      const parceiro = parceiroRepository.getById(idInfluenciadora);
      const url = parceiro ? parceiro[CAMPO_SHEET_URL_PARCEIRO] : '';

      return briefingService.puxarLooks(url);
    } catch (erro) {
      console.warn(`AtivacaoService._looksDoBriefing: ignorado (fail-safe) — ${erro.message}`);

      return LOOKS_BRIEFING_VAZIO;
    }
  }

  /**
   * O histórico da V2 não é uma aba: é o próprio ciclo de vida da ativação.
   * `Arquivada` é o estado terminal (docs/spec/SCHEMA_V2.md) — nada sai de lá.
   */
  listarArquivadasDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora) {
    return this.listarDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora)
      .filter(dto => dto.estado === ESTADOS_ATIVACAO.ARQUIVADA);
  }

  obter(idAtivacao, idInfluenciadora) {
    return this._paraDto(this._exigirPropria(idAtivacao, idInfluenciadora));
  }

  /**
   * Posse, antes de qualquer leitura ou escrita de UMA ativação.
   *
   * `listarDaInfluenciadoraNoCiclo` já filtrava por parceira, mas `obter` e
   * `alterarEstado` recebiam só o id da ativação: bastava trocar o argumento
   * para ler — e alterar o estado — a entrega de outra influenciadora.
   *
   * "Não é sua" e "não existe" devolvem a MESMA mensagem: distinguir as duas
   * revelaria quais ids existem na planilha.
   */
  _exigirPropria(idAtivacao, idInfluenciadora) {
    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    const dados = this.repository.getById(idAtivacao);
    const propria = dados &&
      String(dados[CAMPOS_ATIVACAO.INFLUENCIADORA]) === String(idInfluenciadora);

    if (!propria) {
      throw new Error(`Ativação "${idAtivacao}" não encontrada.`);
    }

    return dados;
  }

  /**
   * A planilha devolve `Date` para colunas de data e `''` para célula vazia.
   * Serializar aqui evita que cada tela invente seu próprio tratamento — e
   * `google.script.run` não preserva `Date` de forma confiável.
   */
  _paraDto(linha) {
    const C = CAMPOS_ATIVACAO;

    return {
      idAtivacao: textoDeCelula(linha[C.ID]),
      idCiclo: textoDeCelula(linha[C.CICLO]),
      idInfluenciadora: textoDeCelula(linha[C.INFLUENCIADORA]),
      tipoConteudo: textoDeCelula(linha[C.TIPO_CONTEUDO]),
      estado: textoDeCelula(linha[C.ESTADO]),
      lookReferencia: textoDeCelula(linha[C.LOOK]),
      entregaPrevista: dataIsoDeCelula(linha[C.ENTREGA_PREVISTA]),
      // Derivado, não persistido: 7 dias corridos antes da entrega (regra do
      // briefing). A parceira precisa aprovar o conteúdo até aqui.
      prazoAprovacao: dataMenosDiasCorridos(dataIsoDeCelula(linha[C.ENTREGA_PREVISTA]), DIAS_ANTECEDENCIA_APROVACAO),
      linkBriefing: textoDeCelula(linha[C.LINK_BRIEFING]),
      linkUploadHd: textoDeCelula(linha[C.LINK_UPLOAD_HD])
    };
  }

  alterarEstado(idAtivacao, novoEstado, idInfluenciadora) {
    return this._transicionarEstado(this._exigirPropria(idAtivacao, idInfluenciadora), novoEstado);
  }

  /**
   * Caminho administrativo: transiciona sem checar posse. A autoridade é o
   * ADMIN_TOKEN, validado no entrypoint (`_exigirAdmin`), não a influenciadora.
   * Mesma decisão de `LogisticaService.alterarStatusComoAdmin`.
   */
  alterarEstadoComoAdmin(idAtivacao, novoEstado) {
    const dados = this.repository.getById(idAtivacao);
    if (!dados) {
      throw new Error(`Ativação "${idAtivacao}" não encontrada.`);
    }
    return this._transicionarEstado(dados, novoEstado);
  }

  _transicionarEstado(dados, novoEstado) {
    const ativacao = new Ativacao(dados);
    ativacao.validateStateTransition(novoEstado);

    const estadoAnterior = ativacao.estadoAtual;

    const atualizado = Object.assign({}, dados);
    atualizado[CAMPOS_ATIVACAO.ESTADO] = novoEstado;

    const salvo = this.repository.save(atualizado);

    const dto = {
      idAtivacao: salvo[CAMPOS_ATIVACAO.ID],
      estadoAnterior: estadoAnterior,
      novoEstado: novoEstado,
      atualizadoEm: new Date().toISOString()
    };

    this.eventDispatcher.dispatch(EVENTO_ATIVACAO_ESTADO_ALTERADO, dto);

    return dto;
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/CicloService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Orquestra a leitura de ciclos. Devolve DTO, nunca a linha crua do Repository:
 * a UI não pode depender do nome das colunas da planilha.
 *
 * Ciclo não tem invariante de negócio hoje (nenhuma transição, nenhuma regra),
 * então não existe Entity `Ciclo`. Criar uma classe vazia só para simetria com
 * `Ativacao` seria abstração antecipada — CLAUDE.md §12.3.
 */
/** Meses em pt-BR para nomear o ciclo de exibição (ex.: "Julho 2026"). */
const MESES_PT_BR = Object.freeze([
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]);

/** Coluna da parceira com a URL da subpasta do ciclo corrente no Drive. */
const CAMPO_DRIVE_CICLO_PARCEIRO = 'DRIVE_CICLO';

class CicloService {
  constructor(
    repository,
    driveService,
    parceiroRepository,
    cadastroRepository,
    briefingRepository,
    ativacaoRepository,
    logisticaRepository,
    pagamentoRepository,
    baseRepository,
    planoRepository,
    cicloCompilerService
  ) {
    this.repository = repository || new CicloRepository();
    // Preguiçoso: só toca DriveApp quando a subpasta é realmente criada.
    this.driveService = driveService || null;
    // Preguiçoso: só instancia (e toca SpreadsheetApp) quando a geração do ciclo
    // varre as parceiras para criar as subpastas do mês.
    this.parceiroRepository = parceiroRepository || null;
    this.cadastroRepository = cadastroRepository || null;
    this.briefingRepository = briefingRepository || null;
    this.ativacaoRepository = ativacaoRepository || null;
    this.logisticaRepository = logisticaRepository || null;
    this.pagamentoRepository = pagamentoRepository || null;
    this.baseRepository = baseRepository || null;
    this.planoRepository = planoRepository || null;
    this.cicloCompilerService = cicloCompilerService || null;
  }

  listar() {
    return this.repository.listarTodos().map(linha => this._paraDto(linha));
  }

  /**
   * Gatilho de geração do ciclo mensal. Cria (idempotente) o registro do ciclo
   * do mês na aba `Ciclos` e, para cada parceira ATIVA (com pasta raiz no Drive),
   * provisiona a subpasta mensal dentro de `[TEAR] {Nome}` e persiste a URL na
   * coluna `DRIVE_CICLO` da parceira.
   *
   * FAIL-SAFE em três camadas — o registro do ciclo, a varredura das parceiras e
   * cada parceira individualmente são protegidos: uma falha de Drive/planilha
   * numa parceira não derruba as demais nem o registro do ciclo. A pasta é
   * acessório; o ciclo é gerado de qualquer forma.
   *
   * `referencia` (Date, opcional) define o mês; ausente → mês corrente.
   */
  gerarCicloMensal(referencia) {
    const data = referencia instanceof Date ? referencia : new Date();
    const idCiclo = this._idCicloDe(data);
    const nomeCiclo = this._nomeCicloDe(data);
    const ciclo = { idCiclo: idCiclo, nomeCiclo: nomeCiclo };

    let cicloCriado = false;
    try {
      const registro = this.repository.criar({
        [CAMPOS_CICLO.ID]: idCiclo,
        [CAMPOS_CICLO.NOME]: nomeCiclo
      });
      cicloCriado = !!(registro && registro.criado);
    } catch (erro) {
      console.warn(`CicloService.gerarCicloMensal: registro do ciclo ignorado (fail-safe) — ${erro.message}`);
    }

    const pastas = this._provisionarPastasDoCiclo(nomeCiclo);

    const resumoOperacional =
      this._gerarEstruturasOperacionais(ciclo);

    return {
      idCiclo: idCiclo,
      nomeCiclo: nomeCiclo,
      cicloCriado: cicloCriado,
      resumoOperacional: resumoOperacional,
      pastasProvisionadas: pastas.length,
      parceiras: pastas
    };
  }

  _gerarEstruturasOperacionais(ciclo) {
    try {
      const compiler = this._compiler();
      const compilado = compiler.compilar({ ciclo: ciclo });
      const persistencia = compiler.persistirCompilacao(compilado);

      return {
        briefings: compilado.briefings.length,
        ativacoes: compilado.ativacoes.length,
        logistica: compilado.logistica.length,
        pagamentos: compilado.pagamentos.length,
        parceiros: compilado.briefings.length,
        briefingsGerados: compilado.briefings.length,
        ativacoesGeradas: compilado.ativacoes.length,
        logisticaGerada: compilado.logistica.length,
        pagamentosGerados: compilado.pagamentos.length,
        briefingsSalvos: persistencia.briefingsSalvos,
        ativacoesSalvas: persistencia.ativacoesSalvas,
        logisticaSalva: persistencia.logisticaSalva,
        pagamentosSalvos: persistencia.pagamentosSalvos
      };
    } catch (erro) {
      console.warn(`CicloService._gerarEstruturasOperacionais: compilação ignorada (fail-safe) — ${erro.message}`);
      return {
        briefings: 0,
        ativacoes: 0,
        logistica: 0,
        pagamentos: 0,
        parceiros: 0,
        briefingsGerados: 0,
        ativacoesGeradas: 0,
        logisticaGerada: 0,
        pagamentosGerados: 0,
        briefingsSalvos: 0,
        ativacoesSalvas: 0,
        logisticaSalva: 0,
        pagamentosSalvos: 0
      };
    }
  }

  _compiler() {
    return this.cicloCompilerService || (this.cicloCompilerService = new CicloCompilerService(
      this.baseRepository,
      this.planoRepository,
      this.briefingRepository,
      this.ativacaoRepository,
      this.logisticaRepository,
      this.pagamentoRepository
    ));
  }

  /**
   * Varre as parceiras ativas (com pasta raiz `DRIVE`) e cria, para cada uma, a
   * subpasta do mês, persistindo a URL na coluna `DRIVE_CICLO`. FAIL-SAFE por
   * parceira: erro de Drive/planilha numa não impede as outras. Devolve a lista
   * de `{ chave, url }` efetivamente provisionadas.
   */
  _provisionarPastasDoCiclo(nomeCiclo) {
    const provisionadas = [];
    let parceiras;

    try {
      parceiras = this._parceiros().listarTodas();
    } catch (erro) {
      console.warn(`CicloService._provisionarPastasDoCiclo: varredura ignorada (fail-safe) — ${erro.message}`);
      return provisionadas;
    }

    (parceiras || []).forEach(parceira => {
      try {
        const raiz = String(parceira[CAMPO_DRIVE_PARCEIRO] || '').trim();
        if (!raiz) {
          return; // parceira ainda sem pasta raiz: nada a subdividir
        }

        const url = this.provisionarPastaMensal(raiz, nomeCiclo);
        if (!url) {
          return;
        }

        const chave = parceira[CHAVE_PARCEIRO] || parceira[CAMPOS_PARCEIRO.ID];
        this._parceiros().definirCampoPorChave(CHAVE_PARCEIRO, chave, CAMPO_DRIVE_CICLO_PARCEIRO, url);

        provisionadas.push({ chave: chave, url: url });
      } catch (erro) {
        console.warn(`CicloService._provisionarPastasDoCiclo: parceira ignorada (fail-safe) — ${erro.message}`);
      }
    });

    return provisionadas;
  }

  /** ParceiroRepository preguiçoso: só toca SpreadsheetApp quando é preciso. */
  _parceiros() {
    return this.parceiroRepository || (this.parceiroRepository = new ParceiroRepository());
  }

  /** ID técnico do ciclo do mês: `AAAA-MM` (ex.: "2026-07"). PURO. */
  _idCicloDe(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  }

  /** Nome de exibição do ciclo: "Mês AAAA" em pt-BR (ex.: "Julho 2026"). PURO. */
  _nomeCicloDe(data) {
    return `${MESES_PT_BR[data.getMonth()]} ${data.getFullYear()}`;
  }

  /**
   * Cria a subpasta mensal do ciclo dentro da pasta raiz da parceira e devolve
   * sua URL (ex.: "Julho 2026" dentro de `[TEAR] {Nome}`). Pensada para o momento
   * em que o ciclo do mês é gerado para a parceira.
   *
   * FAIL-SAFE: sem URL raiz, sem nome, sem DriveApp ou erro → '' (o ciclo é
   * gerado do mesmo jeito; a pasta é acessório, não pode travar a operação).
   */
  provisionarPastaMensal(urlRaizParceira, nomeCiclo) {
    try {
      return this._drive().garantirSubpasta(urlRaizParceira, nomeCiclo);
    } catch (erro) {
      console.warn(`CicloService.provisionarPastaMensal: ignorado (fail-safe) — ${erro.message}`);
      return '';
    }
  }

  /** DriveService preguiçoso: só instancia (e toca DriveApp) quando é preciso. */
  _drive() {
    return this.driveService || (this.driveService = new DriveService());
  }

  _paraDto(linha) {
    const C = CAMPOS_CICLO;

    return {
      idCiclo: textoDeCelula(linha[C.ID]),
      nome: textoDeCelula(linha[C.NOME]) || textoDeCelula(linha[C.ID]),
      inicioLogistica: dataIsoDeCelula(linha[C.INICIO_LOGISTICA]),
      fimOperacao: dataIsoDeCelula(linha[C.FIM_OPERACAO])
    };
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/AmbienteTesteService.js
   ═══════════════════════════════════════════════════════════════ */

const NOME_ABA_FORMS = 'FORMS';
const REGEX_ABA_BRIEFING_ARQUIVADA = /^BRIEFING_\d{4}_\d{2}$/i;

const ABAS_HISTORICO_FIXAS = Object.freeze([
  'HISTÓRICO DE CONTEÚDOS',
  'HISTORICO DE CONTEUDOS',
  'HISTÓRICO DE PAGAMENTOS',
  'HISTORICO DE PAGAMENTOS',
  'HISTÓRICO LOGÍSTICO',
  'HISTORICO LOGISTICO'
]);

/**
 * Ferramenta administrativa para HOMOLOGAÇÃO/DEV.
 * Não é reset de fábrica: preserva FORMS/CADASTRO(BASE/CADASTROS) e recria as
 * estruturas derivadas via geração mensal já existente.
 */
class AmbienteTesteService {
  constructor(cicloService, spreadsheet, lockService) {
    this.cicloService = cicloService || new CicloService(new CicloRepository());
    this.spreadsheet = spreadsheet || null;
    this.lockService = lockService || (typeof LockService !== 'undefined' ? LockService : null);
  }

  prepararAmbiente(opcoes) {
    const cfg = opcoes && typeof opcoes === 'object' ? opcoes : {};
    const limparHistorico = !!cfg.confirmarLimpezaHistorico;
    const referencia = this._normalizarReferencia(cfg.referencia);
    const lock = this._obterLock();

    if (lock && typeof lock.waitLock === 'function') {
      lock.waitLock(30000);
    }

    try {
      const planilha = this._planilha();
      const resumo = {
        ambiente: 'teste',
        confirmarLimpezaHistorico: limparHistorico,
        preservadas: [],
        limpas: [],
        ausentes: [],
        reconstruido: null
      };

      this._registrarPreservada(planilha, NOME_ABA_FORMS, resumo);
      this._registrarPreservada(planilha, PLANILHAS.CADASTROS, resumo);
      this._registrarPreservada(planilha, PLANILHAS.BASE, resumo);

      this._limparSeExistir(planilha, PLANILHAS.CICLOS, 'OPERACIONAL', resumo);

      [
        PLANILHAS.PLANO_COLABORACAO,
        PLANILHAS.BRIEFING,
        PLANILHAS.ATIVACOES,
        PLANILHAS.LOGISTICA,
        PLANILHAS.PAGAMENTOS
      ].forEach((nomeAba) => this._limparSeExistir(planilha, nomeAba, 'DERIVADA', resumo));

      const historicas = this._abasHistoricasDaPlanilha(planilha);
      historicas.forEach((nomeAba) => {
        if (limparHistorico) {
          this._limparSeExistir(planilha, nomeAba, 'HISTORICO', resumo);
        } else {
          this._registrarPreservada(planilha, nomeAba, resumo, 'HISTORICO');
        }
      });

      if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.flush) {
        SpreadsheetApp.flush();
      }

      const gerado = this.cicloService.gerarCicloMensal(referencia);
      const resumoOperacional = gerado && gerado.resumoOperacional ? gerado.resumoOperacional : {};

      resumo.reconstruido = {
        ciclo: gerado && (gerado.idCiclo || gerado.nomeCiclo || ''),
        parceirosProcessados: resumoOperacional.parceiros || 0,
        briefingsGerados: resumoOperacional.briefingsGerados || resumoOperacional.briefings || 0,
        ativacoesGeradas: resumoOperacional.ativacoesGeradas || resumoOperacional.ativacoes || 0,
        logisticaGerada: resumoOperacional.logisticaGerada || resumoOperacional.logistica || 0,
        pagamentosGerados: resumoOperacional.pagamentosGerados || resumoOperacional.pagamentos || 0
      };

      return resumo;
    } finally {
      if (lock && typeof lock.releaseLock === 'function') {
        lock.releaseLock();
      }
    }
  }

  _normalizarReferencia(referencia) {
    const data = referencia ? new Date(referencia) : new Date();
    return isNaN(data.getTime()) ? new Date() : data;
  }

  _planilha() {
    return this.spreadsheet || SpreadsheetApp.getActive();
  }

  _obterLock() {
    if (!this.lockService || typeof this.lockService.getScriptLock !== 'function') {
      return null;
    }
    return this.lockService.getScriptLock();
  }

  _registrarPreservada(planilha, nomeAba, resumo, categoria) {
    const aba = planilha.getSheetByName(nomeAba);
    if (!aba) {
      resumo.ausentes.push({ aba: nomeAba, categoria: categoria || 'PERMANENTE' });
      return;
    }
    resumo.preservadas.push({ aba: nomeAba, categoria: categoria || 'PERMANENTE' });
  }

  _limparSeExistir(planilha, nomeAba, categoria, resumo) {
    const aba = planilha.getSheetByName(nomeAba);
    if (!aba) {
      resumo.ausentes.push({ aba: nomeAba, categoria: categoria });
      return;
    }

    const linhasLimpas = this._limparDadosDaAba(aba);
    resumo.limpas.push({ aba: nomeAba, categoria: categoria, linhasLimpas: linhasLimpas });
  }

  _limparDadosDaAba(aba) {
    const totalLinhas = typeof aba.getLastRow === 'function' ? aba.getLastRow() : 0;
    const totalColunas = typeof aba.getLastColumn === 'function' ? aba.getLastColumn() : 0;

    if (totalLinhas <= 1 || totalColunas <= 0) {
      return 0;
    }

    const linhasDeDados = totalLinhas - 1;
    aba.getRange(2, 1, linhasDeDados, totalColunas).clearContent();
    return linhasDeDados;
  }

  _abasHistoricasDaPlanilha(planilha) {
    const nomes = (typeof planilha.getSheets === 'function' ? planilha.getSheets() : [])
      .map((aba) => (aba && typeof aba.getName === 'function' ? aba.getName() : ''))
      .filter((nome) => !!nome);

    const historicas = nomes.filter((nome) => {
      if (ABAS_HISTORICO_FIXAS.indexOf(nome) !== -1) {
        return true;
      }
      return REGEX_ABA_BRIEFING_ARQUIVADA.test(nome);
    });

    return historicas.filter((nome, i) => historicas.indexOf(nome) === i);
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/CicloCompilerService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Núcleo do compilador do ciclo em memória (sem I/O). Só transforma entradas
 * já carregadas em entidades de saída, preservando o ciclo informado.
 */
class CicloCompilerService {
  constructor(
    baseRepository,
    planoRepository,
    briefingRepository,
    ativacaoRepository,
    logisticaRepository,
    pagamentoRepository
  ) {
    this.baseRepository = baseRepository || null;
    this.planoRepository = planoRepository || null;
    this.briefingRepository = briefingRepository || null;
    this.ativacaoRepository = ativacaoRepository || null;
    this.logisticaRepository = logisticaRepository || null;
    this.pagamentoRepository = pagamentoRepository || null;
  }

  compilar(entrada) {
    const payload = entrada && typeof entrada === 'object' ? entrada : {};
    const ciclo = payload.ciclo || {};
    const cicloId = this._idCiclo(ciclo);
    const bases = Array.isArray(payload.bases)
      ? payload.bases
      : this._carregarBasesAtivas();
    const planos = Array.isArray(payload.planos)
      ? payload.planos
      : this._carregarPlanosDoCiclo(cicloId);

    const ativas = bases
      .map(base => this._normalizarBase(base))
      .filter(base => this._baseAtiva(base));
    const planosNormalizados = planos
      .map(plano => this._normalizarPlano(plano))
      .filter(plano => !!plano);

    const resultado = {
      briefings: [],
      ativacoes: [],
      logistica: [],
      pagamentos: []
    };

    ativas.forEach(base => {
      const idInfluenciadora = this._idInfluenciadora(base);
      if (!idInfluenciadora) {
        return;
      }

      const plano = this._planoDa(base, cicloId, planosNormalizados);

      resultado.briefings.push(this._novoBriefing(idInfluenciadora));
      resultado.ativacoes.push(this._novaAtivacao(idInfluenciadora, cicloId));
      resultado.logistica.push(this._novaLogistica(base, idInfluenciadora, cicloId));
      resultado.pagamentos.push(this._novoPagamento(base, plano, idInfluenciadora, cicloId));
    });

    return resultado;
  }

  persistirCompilacao(resultado) {
    const compilado = resultado && typeof resultado === 'object' ? resultado : {};
    const briefings = Array.isArray(compilado.briefings) ? compilado.briefings : [];
    const ativacoes = Array.isArray(compilado.ativacoes) ? compilado.ativacoes : [];
    const logistica = Array.isArray(compilado.logistica) ? compilado.logistica : [];
    const pagamentos = Array.isArray(compilado.pagamentos) ? compilado.pagamentos : [];

    const briefingRepo = this.briefingRepository || (this.briefingRepository = new BriefingRepository());
    const ativacaoRepo = this.ativacaoRepository || (this.ativacaoRepository = new AtivacaoRepository());
    const logisticaRepo = this.logisticaRepository || (this.logisticaRepository = new LogisticaRepository());
    const pagamentoRepo = this.pagamentoRepository || (this.pagamentoRepository = new PagamentoRepository());

    briefings.forEach((briefing) => {
      const dados = briefing instanceof Briefing ? briefing.dados : briefing;
      if (!dados) return;
      briefingRepo.save(dados);
    });

    ativacoes.forEach((ativacao) => {
      const dados = ativacao instanceof Ativacao ? Object.assign({}, ativacao.dados) : Object.assign({}, ativacao);
      if (!dados) return;

      const cicloId = textoDeCelula(dados[CAMPOS_ATIVACAO.CICLO]);
      const influenciadora = textoDeCelula(dados[CAMPOS_ATIVACAO.INFLUENCIADORA]);

      const existente = ativacaoRepo.findByCiclo(cicloId).find((linha) =>
        textoDeCelula(linha[CAMPOS_ATIVACAO.INFLUENCIADORA]) === influenciadora
      );

      if (existente && existente[CAMPOS_ATIVACAO.ID]) {
        dados[CAMPOS_ATIVACAO.ID] = existente[CAMPOS_ATIVACAO.ID];
      }

      ativacaoRepo.save(dados);
    });

    logistica.forEach((registro) => {
      const dados = registro instanceof Logistica ? Object.assign({}, registro.dados) : Object.assign({}, registro);
      if (!dados) return;

      const cicloId = textoDeCelula(dados[CAMPOS_LOGISTICA.CICLO]);
      const influenciadora = textoDeCelula(dados[CAMPOS_LOGISTICA.INFLUENCIADORA]);

      const existente = logisticaRepo.findByCiclo(cicloId).find((linha) =>
        textoDeCelula(linha[CAMPOS_LOGISTICA.INFLUENCIADORA]) === influenciadora
      );

      if (existente && existente[CAMPOS_LOGISTICA.ID]) {
        dados[CAMPOS_LOGISTICA.ID] = existente[CAMPOS_LOGISTICA.ID];
      }

      logisticaRepo.save(dados);
    });

    pagamentos.forEach((pagamento) => {
      const dados = pagamento instanceof Pagamento ? Object.assign({}, pagamento.dados) : Object.assign({}, pagamento);
      if (!dados) return;

      const cicloId = textoDeCelula(dados[CAMPOS_PAGAMENTO.CICLO]);
      const influenciadora = textoDeCelula(dados[CAMPOS_PAGAMENTO.INFLUENCIADORA]);

      const existente = pagamentoRepo.findByCiclo(cicloId).find((linha) =>
        textoDeCelula(linha[CAMPOS_PAGAMENTO.INFLUENCIADORA]) === influenciadora
      );

      if (existente && existente[CAMPOS_PAGAMENTO.ID]) {
        dados[CAMPOS_PAGAMENTO.ID] = existente[CAMPOS_PAGAMENTO.ID];
      }

      pagamentoRepo.save(dados);
    });

    return {
      briefingsSalvos: briefings.length,
      ativacoesSalvas: ativacoes.length,
      logisticaSalva: logistica.length,
      pagamentosSalvos: pagamentos.length
    };
  }

  _carregarBasesAtivas() {
    const repo = this.baseRepository || (this.baseRepository = new BaseRepository());
    if (!repo || typeof repo.listarAtivas !== 'function') {
      return [];
    }

    return repo.listarAtivas();
  }

  _carregarPlanosDoCiclo(cicloId) {
    const repo = this.planoRepository || (this.planoRepository = new PlanoRepository());
    if (!repo || typeof repo.findByCiclo !== 'function') {
      return [];
    }

    return repo.findByCiclo(cicloId);
  }

  _idCiclo(ciclo) {
    if (!ciclo || typeof ciclo !== 'object') {
      return '';
    }

    return textoDeCelula(
      ciclo.idCiclo || ciclo.id || (typeof CAMPOS_CICLO !== 'undefined' ? ciclo[CAMPOS_CICLO.ID] : '')
    );
  }

  _idInfluenciadora(base) {
    if (!base || typeof base !== 'object') {
      return '';
    }

    const dados = base.dados || {};
    return textoDeCelula(
      dados.id ||
      dados[CAMPOS_PARCEIRO.ID] ||
      dados[CAMPOS_BASE.INFLUENCER] ||
      base.id ||
      base.influenciadora
    );
  }

  _normalizarBase(base) {
    if (!base || typeof base !== 'object') {
      return null;
    }

    if (base instanceof Base) {
      return base;
    }

    return new Base(base);
  }

  _normalizarPlano(plano) {
    if (!plano || typeof plano !== 'object') {
      return null;
    }

    if (plano instanceof PlanoColaboracao) {
      return plano;
    }

    return new PlanoColaboracao(plano);
  }

  _baseAtiva(base) {
    if (!base || typeof base !== 'object') {
      return false;
    }

    const status = String(base.status || '').trim().toUpperCase();
    return status === 'ATIVO' || status === 'ON';
  }

  _planoDa(base, cicloId, planos) {
    const idInfluenciadora = this._idInfluenciadora(base);

    return planos.find((plano) => {
      if (!plano || typeof plano !== 'object') {
        return false;
      }

      const mesmoCiclo = textoDeCelula(plano.ciclo) === textoDeCelula(cicloId);
      const mesmaInfluenciadora = textoDeCelula(plano.influenciadora) === textoDeCelula(idInfluenciadora);

      return mesmoCiclo && mesmaInfluenciadora;
    }) || null;
  }

  _novoBriefing(idInfluenciadora) {
    return new Briefing({
      [CAMPOS_BRIEFING.INFLUENCIADORA]: idInfluenciadora,
      [CAMPOS_BRIEFING.RESUMO_DO_MES]: '',
      [CAMPOS_BRIEFING.LOOK_REEL]: '',
      [CAMPOS_BRIEFING.LOOK_CARROSSEL]: '',
      [CAMPOS_BRIEFING.LOOK_STORIES_1]: '',
      [CAMPOS_BRIEFING.LOOK_STORIES_2]: '',
      [CAMPOS_BRIEFING.DATA_REEL]: '',
      [CAMPOS_BRIEFING.DATA_CARROSSEL]: '',
      [CAMPOS_BRIEFING.DATA_STORIES_1]: '',
      [CAMPOS_BRIEFING.DATA_STORIES_2]: '',
      [CAMPOS_BRIEFING.SOBRE_REEL]: '',
      [CAMPOS_BRIEFING.SOBRE_CARROSSEL]: '',
      [CAMPOS_BRIEFING.SOBRE_STORIES_1]: '',
      [CAMPOS_BRIEFING.SOBRE_STORIES_2]: '',
      [CAMPOS_BRIEFING.APROVACAO_REEL]: '',
      [CAMPOS_BRIEFING.APROVACAO_CARROSSEL]: '',
      [CAMPOS_BRIEFING.APROVACAO_STORIES_1]: '',
      [CAMPOS_BRIEFING.APROVACAO_STORIES_2]: ''
    });
  }

  _novaAtivacao(idInfluenciadora, cicloId) {
    return new Ativacao({
      [CAMPOS_ATIVACAO.ID]: '',
      [CAMPOS_ATIVACAO.CICLO]: cicloId,
      [CAMPOS_ATIVACAO.INFLUENCIADORA]: idInfluenciadora,
      [CAMPOS_ATIVACAO.TIPO_CONTEUDO]: '',
      [CAMPOS_ATIVACAO.ESTADO]: ESTADOS_ATIVACAO.PLANEJAMENTO,
      [CAMPOS_ATIVACAO.LOOK]: '',
      [CAMPOS_ATIVACAO.ENTREGA_PREVISTA]: '',
      [CAMPOS_ATIVACAO.LINK_BRIEFING]: '',
      [CAMPOS_ATIVACAO.LINK_UPLOAD_HD]: ''
    });
  }

  _novaLogistica(base, idInfluenciadora, cicloId) {
    return new Logistica({
      [CAMPOS_LOGISTICA.ID]: '',
      [CAMPOS_LOGISTICA.CICLO]: cicloId,
      [CAMPOS_LOGISTICA.INFLUENCIADORA]: idInfluenciadora,
      [CAMPOS_LOGISTICA.ENDERECO]: textoDeCelula(base.endereco),
      [CAMPOS_LOGISTICA.RASTREIO]: '',
      [CAMPOS_LOGISTICA.DATA_ENVIO]: '',
      [CAMPOS_LOGISTICA.STATUS]: ESTADOS_LOGISTICA.PENDENTE
    });
  }

  _novoPagamento(base, plano, idInfluenciadora, cicloId) {
    return new Pagamento({
      [CAMPOS_PAGAMENTO.ID]: '',
      [CAMPOS_PAGAMENTO.CICLO]: cicloId,
      [CAMPOS_PAGAMENTO.INFLUENCIADORA]: idInfluenciadora,
      [CAMPOS_PAGAMENTO.VALOR]: plano ? plano.valorCache : '',
      [CAMPOS_PAGAMENTO.PIX]: textoDeCelula(base.pix),
      [CAMPOS_PAGAMENTO.STATUS]: 'em aberto',
      [CAMPOS_PAGAMENTO.DATA_PAGAMENTO]: '',
      [CAMPOS_PAGAMENTO.MENSAGEM]: ''
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/PagamentoService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Pagamento é um MODELO DE LEITURA derivado, não uma entidade persistida.
 * A V2 não tem aba de pagamentos: a informação já existe em
 * `Planos_Colaboracao` (o quanto foi acordado) cruzada com `Ativacoes`
 * (o que de fato foi entregue).
 *
 * ⚠️ A regra de elegibilidade abaixo foi DERIVADA da máquina de estados, não
 * extraída de uma especificação de negócio — mesma ressalva que
 * `docs/spec/SCHEMA_V2.md` faz sobre o grafo de transições. Confirmar com o
 * usuário antes de tratar como definitiva.
 */
class PagamentoService {
  constructor(planoRepository, ativacaoRepository) {
    if (!planoRepository || !ativacaoRepository) {
      throw new TypeError('PagamentoService exige PlanoRepository e AtivacaoRepository.');
    }

    this.planoRepository = planoRepository;
    this.ativacaoRepository = ativacaoRepository;
  }

  /** Escopo por parceira: ninguém vê o cachê acordado com outra influenciadora. */
  listarPorCiclo(idCiclo, idInfluenciadora) {
    if (!idCiclo) {
      throw new Error('É obrigatório informar o ciclo.');
    }

    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    const ativacoesPorInfluenciadora = this._agruparPorInfluenciadora(
      this.ativacaoRepository.findByCiclo(idCiclo)
    );

    const planos = this.planoRepository
      .findByCiclo(idCiclo)
      .filter(plano => String(plano[CAMPOS_PLANO.INFLUENCIADORA]) === String(idInfluenciadora));

    return planos.map(plano => {
      const ativacoes = ativacoesPorInfluenciadora[plano[CAMPOS_PLANO.INFLUENCIADORA]] || [];

      return {
        idPlano: textoDeCelula(plano[CAMPOS_PLANO.ID]),
        idInfluenciadora: textoDeCelula(plano[CAMPOS_PLANO.INFLUENCIADORA]),
        idCiclo: textoDeCelula(plano[CAMPOS_PLANO.CICLO]),
        valorCache: textoDeCelula(plano[CAMPOS_PLANO.VALOR_CACHE]),
        entregaveisAcordados: textoDeCelula(plano[CAMPOS_PLANO.QTD_ENTREGAVEIS]),
        entregaveisConcluidos: this._contarConcluidas(ativacoes),
        estado: this._estadoDoPagamento(ativacoes)
      };
    });
  }

  _agruparPorInfluenciadora(ativacoes) {
    return ativacoes.reduce((mapa, ativacao) => {
      const chave = ativacao[CAMPOS_ATIVACAO.INFLUENCIADORA];

      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(ativacao);

      return mapa;
    }, {});
  }

  _contarConcluidas(ativacoes) {
    const finais = [
      ESTADOS_ATIVACAO.CONCLUIDA,
      ESTADOS_ATIVACAO.ELEGIVEL_PARA_PAGAMENTO,
      ESTADOS_ATIVACAO.ARQUIVADA
    ];

    return ativacoes.filter(a => finais.indexOf(a[CAMPOS_ATIVACAO.ESTADO]) !== -1).length;
  }

  /**
   * Elegível só quando NENHUMA entrega do ciclo está pendente. Um plano sem
   * ativação nenhuma é `Pendente`, nunca elegível — senão um cadastro
   * incompleto pareceria pronto para pagar.
   */
  _estadoDoPagamento(ativacoes) {
    if (!ativacoes.length) {
      return 'Pendente';
    }

    const liberadas = [ESTADOS_ATIVACAO.ELEGIVEL_PARA_PAGAMENTO, ESTADOS_ATIVACAO.ARQUIVADA];
    const todasLiberadas = ativacoes.every(a => liberadas.indexOf(a[CAMPOS_ATIVACAO.ESTADO]) !== -1);

    return todasLiberadas ? 'Elegível para Pagamento' : 'Pendente';
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/AuthService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Autenticação da V2.
 *
 * Nenhum DTO daqui carrega `Senha_Hash`. Nenhuma mensagem de erro distingue
 * "cupom não existe" de "senha errada": a diferença permitiria enumerar
 * parceiras cadastradas.
 */
/** Formato `salt$hash` válido, senha nenhuma. Só existe para gastar o mesmo tempo. */
const HASH_FICTICIO_PARA_TEMPO_CONSTANTE =
  '00000000-0000-0000-0000-000000000000$' +
  '0000000000000000000000000000000000000000000000000000000000000000';

class AuthService {
  constructor(parceiroRepository, sessaoRepository) {
    if (!parceiroRepository || !sessaoRepository) {
      throw new TypeError('AuthService exige ParceiroRepository e SessaoRepository.');
    }

    this.parceiroRepository = parceiroRepository;
    this.sessaoRepository = sessaoRepository;
  }

  login(cupom, senha) {
    if (!cupom || !senha) {
      throw new Error('Informe o cupom e a senha.');
    }

    if (this.sessaoRepository.estaBloqueado(cupom)) {
      throw new Error('Muitas tentativas. Tente novamente em alguns minutos.');
    }

    const parceiro = this.parceiroRepository.findByCupom(cupom);

    // Hash fictício, com formato válido, para cupom inexistente: sem ele, o
    // caminho "não existe" não calcularia SHA-256 e responderia mais rápido que
    // "senha errada" — um oráculo de tempo que permite enumerar cupons apesar
    // de as mensagens serem idênticas.
    const armazenado = parceiro
      ? parceiro[CAMPOS_PARCEIRO.SENHA_HASH]
      : HASH_FICTICIO_PARA_TEMPO_CONSTANTE;

    const senhaCorreta = senhaConfere(senha, armazenado);

    // Uma parceira sem senha definida não loga — a aba nasce sem credencial.
    if (!parceiro || !senhaCorreta) {
      this.sessaoRepository.registrarTentativa(cupom);
      throw new Error('Cupom ou senha inválidos.');
    }

    this.sessaoRepository.limparTentativas(cupom);

    return {
      token: this.sessaoRepository.criar(parceiro[CAMPOS_PARCEIRO.ID]),
      perfil: this._paraDto(parceiro)
    };
  }

  sessaoAtual(token) {
    const idInfluenciadora = this.sessaoRepository.resolver(token);

    if (!idInfluenciadora) {
      throw new Error('Sessão expirada. Entre novamente.');
    }

    const parceiro = this.parceiroRepository.getById(idInfluenciadora);

    if (!parceiro) {
      throw new Error('Sessão expirada. Entre novamente.');
    }

    return this._paraDto(parceiro);
  }

  logout(token) {
    this.sessaoRepository.destruir(token);

    return { encerrada: true };
  }

  /** `Senha_Hash` e `Cupom` não saem daqui. */
  _paraDto(parceiro) {
    return {
      idInfluenciadora: textoDeCelula(parceiro[CAMPOS_PARCEIRO.ID]),
      nome: textoDeCelula(parceiro[CAMPOS_PARCEIRO.NOME]),
      statusContrato: textoDeCelula(parceiro[CAMPOS_PARCEIRO.STATUS_CONTRATO]),
      categoria: textoDeCelula(parceiro[CAMPOS_PARCEIRO.CATEGORIA])
    };
  }
}


/* ═══════════════════════════════════════════════════════════════
   services/ParceiroService.js
   ═══════════════════════════════════════════════════════════════ */

/** Chave de identidade do cadastro (upsert casa por ela). */
const CHAVE_PARCEIRO = 'INFLU_KEY';

/** Mínimo para um cadastro fazer sentido: quem é, razão social e cupom. */
const CAMPOS_OBRIGATORIOS_PARCEIRO = Object.freeze(['INFLU_KEY', 'INFLUENCIADORA_RAZAO_SOCIAL', 'CUPOM']);

/** Só e-mail e CNPJ são chaves de busca: não se varre a base por coluna arbitrária. */
const CAMPOS_BUSCAVEIS_PARCEIRO = Object.freeze(['EMAIL', 'INFLUENCIADORA_CNPJ']);

/** Coluna da base principal que guarda a URL da pasta raiz da parceira (BASE). */
const CAMPO_DRIVE_PARCEIRO = 'DRIVE';

/**
 * Conjunto FECHADO de status de participação usados pelo toggle administrativo
 * (a "exclusão" do CRUD é DESATIVAR, nunca apagar — CLAUDE.md "não apagar dados"
 * e SCHEMA_V2 "inativos não são descartados"). `PENDENTE` (nascimento do cadastro)
 * não entra aqui: é estado do funil, não uma escolha do admin.
 */
const STATUS_PARCEIRA = Object.freeze({ ATIVO: 'ATIVO', INATIVO: 'INATIVO' });

class ParceiroService {
  constructor(parceiroRepository, cadastroRepository, driveService) {
    if (!parceiroRepository) {
      throw new TypeError('ParceiroService exige uma instância de ParceiroRepository.');
    }

    this.repository = parceiroRepository;
    // Fonte do CNPJ para a senha padrão. Construção preguiçosa: só toca a
    // planilha quando o provisionamento realmente roda (ver CadastroRepository).
    this.cadastroRepository = cadastroRepository || new CadastroRepository();
    // Resolvido preguiçosamente em `_drive()`: instanciar aqui tocaria `DriveApp`
    // já na construção, mas nem todo salvar cria pasta.
    this.driveService = driveService || null;
  }

  /** Preenchimento inteligente: devolve o cadastro por e-mail/CNPJ, ou null. */
  buscar(campo, valor) {
    if (CAMPOS_BUSCAVEIS_PARCEIRO.indexOf(campo) === -1) {
      throw new Error('Busca permitida apenas por e-mail ou CNPJ.');
    }

    return this.repository.buscarPorCampo(campo, valor);
  }

  salvar(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new Error('Dados da parceira ausentes.');
    }

    // O wizard legado usa INFLU_KEY; a base canônica lista/atualiza por
    // ID_Influenciadora. Sincronizamos as duas chaves para o fluxo admin
    // (listar/editar/ativar-desativar) funcionar de ponta a ponta.
    const dadosNormalizados = Object.assign({}, dados);
    const chaveCanonica = String(
      dadosNormalizados[CHAVE_PARCEIRO] || dadosNormalizados[CAMPOS_PARCEIRO.ID] || ''
    ).trim();

    if (chaveCanonica) {
      if (!dadosNormalizados[CHAVE_PARCEIRO]) {
        dadosNormalizados[CHAVE_PARCEIRO] = chaveCanonica;
      }
      if (!dadosNormalizados[CAMPOS_PARCEIRO.ID]) {
        dadosNormalizados[CAMPOS_PARCEIRO.ID] = chaveCanonica;
      }
    }

    CAMPOS_OBRIGATORIOS_PARCEIRO.forEach(function (campo) {
      if (!dadosNormalizados[campo] || String(dadosNormalizados[campo]).trim() === '') {
        throw new Error(`É obrigatório informar "${campo}".`);
      }
    });

    const resultado = this.repository.upsert(dadosNormalizados, CHAVE_PARCEIRO);

    // Ativação da parceira: com o cupom preenchido, provisiona a senha padrão
    // (5 primeiros dígitos do CNPJ vindo do CADASTROS). FAIL-SAFE — nunca
    // derruba o salvamento (ver `provisionarSenhaPadrao`).
    const senha = this.provisionarSenhaPadrao(dadosNormalizados);

    // Mesma ativação: se a coluna DRIVE está vazia, cria a pasta raiz `[TEAR]
    // {Nome}` e grava a URL. FAIL-SAFE — nunca derruba o salvamento.
    const pasta = this.provisionarPastaDrive(dadosNormalizados);

    return Object.assign({}, resultado, {
      senhaProvisionada: senha.provisionada,
      pastaProvisionada: pasta.provisionada
    });
  }

  /**
   * Provisiona a pasta raiz da parceira no Drive no fluxo de salvar (regra da
   * BASE: pasta `[TEAR] {Nome}`). Só age quando há cupom (parceira ativada) e a
   * coluna DRIVE ainda está vazia — nunca sobrescreve uma pasta já registrada.
   *
   * FAIL-SAFE por contrato: qualquer ausência (sem cupom, sem DriveApp) ou erro
   * devolve `{ provisionada: false, motivo }` e NUNCA lança.
   */
  provisionarPastaDrive(dados) {
    try {
      const cupom = dados.CUPOM || dados[CAMPOS_PARCEIRO.CUPOM];
      if (!cupom || String(cupom).trim() === '') {
        return { provisionada: false, motivo: 'SEM_CUPOM' };
      }

      const chave = dados[CHAVE_PARCEIRO] || dados[CAMPOS_PARCEIRO.ID];

      const noPayload = String(dados[CAMPO_DRIVE_PARCEIRO] || '').trim() !== '';
      const atual = this.repository.buscarPorCampo(CHAVE_PARCEIRO, chave) || this.repository.getById(chave);
      const jaTem = atual && String(atual[CAMPO_DRIVE_PARCEIRO] || '').trim() !== '';
      if (noPayload || jaTem) {
        return { provisionada: false, motivo: 'JA_TEM_PASTA' };
      }

      const nome = dados.INFLUENCIADORA_RAZAO_SOCIAL || dados.APELIDO || chave;
      const url = this._drive().garantirPastaRaiz(nome);
      if (!url) {
        return { provisionada: false, motivo: 'FALHA_DRIVE' };
      }

      this.repository.definirCampoPorChave(CHAVE_PARCEIRO, chave, CAMPO_DRIVE_PARCEIRO, url);

      return { provisionada: true, motivo: 'OK', url: url };
    } catch (erro) {
      console.warn(`provisionarPastaDrive: ignorado (fail-safe) — ${erro.message}`);
      return { provisionada: false, motivo: 'ERRO' };
    }
  }

  /** DriveService preguiçoso: só instancia (e toca DriveApp) quando é preciso. */
  _drive() {
    return this.driveService || (this.driveService = new DriveService());
  }

  /**
   * Provisionamento automático da senha padrão no fluxo de salvar (regra da V1,
   * BASE.csv: "padrão sempre será 5 primeiros dígitos do CNPJ, depois ela pode
   * mudar se quiser"). Só age quando há cupom (parceira ativada) e ela ainda não
   * tem senha — nunca sobrescreve uma senha já trocada. O CNPJ vem do CADASTROS,
   * casado pelo apelido (a identidade da V1), pois a base canônica não o guarda.
   *
   * FAIL-SAFE por contrato: qualquer ausência (sem cupom, sem CNPJ válido) ou
   * erro devolve `{ provisionada: false, motivo }` e NUNCA lança — o cadastro da
   * parceira não pode se perder porque o CNPJ não foi encontrado.
   */
  provisionarSenhaPadrao(dados) {
    try {
      const cupom = dados.CUPOM || dados[CAMPOS_PARCEIRO.CUPOM];
      if (!cupom || String(cupom).trim() === '') {
        return { provisionada: false, motivo: 'SEM_CUPOM' };
      }

      const chave = dados[CHAVE_PARCEIRO] || dados[CAMPOS_PARCEIRO.ID];

      const atual = this.repository.buscarPorCampo(CHAVE_PARCEIRO, chave) || this.repository.getById(chave);
      if (atual && String(atual[CAMPOS_PARCEIRO.SENHA_HASH] || '').trim() !== '') {
        return { provisionada: false, motivo: 'JA_TEM_SENHA' };
      }

      const cnpj = this._cnpjDoCadastroPorChave(chave);
      if (!cnpj) {
        return { provisionada: false, motivo: 'SEM_CNPJ' };
      }

      this.repository.definirSenhaHashPorChave(CHAVE_PARCEIRO, chave, criarSenhaHash(senhaPadraoDeCnpj(cnpj)));

      return { provisionada: true, motivo: 'OK' };
    } catch (erro) {
      console.warn(`provisionarSenhaPadrao: ignorado (fail-safe) — ${erro.message}`);
      return { provisionada: false, motivo: 'ERRO' };
    }
  }

  /**
   * Localiza no CADASTROS a linha cuja pergunta de apelido casa com a chave da
   * parceira (apelido `.trim().toUpperCase()` = ID, mesma regra do funil) e
   * devolve os dígitos do CNPJ válido, ou '' se não achar. Mesma lógica de
   * varredura da V1: identidade pelo apelido.
   */
  _cnpjDoCadastroPorChave(chave) {
    const alvo = String(chave === null || chave === undefined ? '' : chave).trim().toUpperCase();
    if (!alvo) {
      return '';
    }

    const linhas = this.cadastroRepository.linhas();

    for (let i = 0; i < linhas.length; i++) {
      const get = _leitorDeCadastro_(linhas[i]);
      const id = get(CANDIDATOS_CADASTRO.APELIDO).trim().toUpperCase();

      if (id === alvo) {
        return _cnpjDeCadastroValido_(linhas[i]);
      }
    }

    return '';
  }

  /**
   * Funil de cadastro (Google Forms → aba CADASTROS → Parceiros_Influenciadoras).
   *
   * Escreve no cabeçalho CANÔNICO (`CAMPOS_PARCEIRO`), diferente do `salvar()`
   * legado (vocabulário físico do wizard). Upsert SEGURO por `ID_Influenciadora`:
   * - registro NOVO   → grava dados cadastrais + Status_Contrato = PENDENTE;
   *                     Cupom, Autocrat e Senha_Hash nascem vazios.
   * - registro EXISTE → atualiza SÓ os dados cadastrais (Nome, Endereço);
   *                     jamais toca Cupom, Status_Contrato, Autocrat ou Senha_Hash.
   *
   * `valoresPorColuna`: mapa título-da-pergunta → resposta (ex.: `e.namedValues`
   * achatado). Devolve `{ ignorado, criado?, chave? }`.
   */
  registrarCadastro(valoresPorColuna) {
    // Resolve Rua/Bairro/Cidade a partir do CEP (o Forms não pergunta a Rua).
    // Se todas as APIs falharem, `enderecoApi` vem null e o endereço degrada
    // graciosamente — o cadastro nunca se perde por causa do CEP.
    const cep = _cepDoCadastro_(valoresPorColuna);
    const enderecoApi = cep ? buscarCepMultiAPI(cep) : null;
    const base = parceiroDeCadastro_(valoresPorColuna, enderecoApi);

    if (!base) {
      return { ignorado: true, motivo: 'SEM_APELIDO' };
    }

    const id = base[CAMPOS_PARCEIRO.ID];
    const jaExiste = !!this.repository.getById(id);

    // Novo: acrescenta o status inicial. Existente: só os campos cadastrais de
    // `base` — o upsert preserva toda coluna não presente no payload.
    const dados = jaExiste
      ? base
      : Object.assign({}, base, { [CAMPOS_PARCEIRO.STATUS_CONTRATO]: STATUS_CADASTRO_PADRAO });

    const resultado = this.repository.upsert(dados, CAMPOS_PARCEIRO.ID);

    return { ignorado: false, criado: resultado.criado, chave: resultado.chave };
  }

  /**
   * Índice administrativo: todas as parceiras cadastradas, em DTO enxuto para a
   * tela de listagem (id, nome, cupom, status). Reusa `repository.listarTodas()`;
   * a tradução para DTO é responsabilidade do Service, como nas demais telas.
   */
  listarTodas() {
    return this.repository.listarTodas().map(linha => this._paraDtoDeLista(linha));
  }

  /**
   * Projeção canônica (`CAMPOS_PARCEIRO`) com fallback tolerante para linhas que
   * o wizard legado (`salvar`) gravou no vocabulário físico — assim uma parceira
   * salva por qualquer um dos caminhos aparece na lista sem quebrar.
   */
  _paraDtoDeLista(dados) {
    const d = dados || {};
    const id = d[CAMPOS_PARCEIRO.ID] || d[CHAVE_PARCEIRO] || '';

    return {
      id: id,
      nome: d[CAMPOS_PARCEIRO.NOME] || d.INFLUENCIADORA_RAZAO_SOCIAL || d['RAZÃO SOCIAL'] || id || '',
      cupom: d[CAMPOS_PARCEIRO.CUPOM] || d.CUPOM || '',
      status: d[CAMPOS_PARCEIRO.STATUS_CONTRATO] || d.STATUS || ''
    };
  }

  /** Leitura por identidade (para prefill de edição). Devolve a linha crua ou null. */
  obterPorId(id) {
    const alvo = String(id === null || id === undefined ? '' : id).trim();
    if (!alvo) {
      throw new Error('É obrigatório informar a parceira.');
    }

    return this.repository.getById(alvo);
  }

  /**
   * "Exclusão" do CRUD = DESATIVAÇÃO (soft-delete): grava `Status_Contrato` sem
   * remover a linha. `status` é validado contra o conjunto fechado `STATUS_PARCEIRA`
   * (ATIVO/INATIVO) — nenhum outro valor passa. Reusa `definirCampoPorChave`.
   */
  definirStatus(chave, status) {
    const alvo = String(chave === null || chave === undefined ? '' : chave).trim();
    if (!alvo) {
      throw new Error('É obrigatório informar a parceira.');
    }

    const normalizado = String(status === null || status === undefined ? '' : status).trim().toUpperCase();
    if (normalizado !== STATUS_PARCEIRA.ATIVO && normalizado !== STATUS_PARCEIRA.INATIVO) {
      throw new Error('Status inválido: use ATIVO ou INATIVO.');
    }

    this.repository.definirCampoPorChave(CAMPOS_PARCEIRO.ID, alvo, CAMPOS_PARCEIRO.STATUS_CONTRATO, normalizado);

    return { chave: alvo, status: normalizado };
  }
}

/* ── Funil de cadastro: transform puro (Forms → cadastro canônico) ─────────── */

const STATUS_CADASTRO_PADRAO = 'PENDENTE';

// Títulos candidatos por campo do formulário (a comparação normaliza acentos,
// caixa e pontuação). O 1º de cada lista é o título LITERAL da pergunta no Google
// Forms; os demais são fallbacks tolerantes. Ajuste aqui se os títulos mudarem.
const CANDIDATOS_CADASTRO = Object.freeze({
  APELIDO: [
    'como prefere ser chamada (pode ser apelido + sobrenome, por exemplo)',
    'como prefere ser chamada', 'como prefere ser chamado', 'apelido', 'como gostaria de ser chamada'
  ],
  RAZAO: ['razão social', 'razao social', 'nome completo', 'nome', 'razao social ou nome completo'],
  RUA: ['rua', 'logradouro', 'endereco'],
  NUMERO: ['número (prédio, casa, condomínio...)', 'numero', 'nº', 'no', 'n'],
  COMPLEMENTO: ['complemento (se houver: bloco, torre, apto...)', 'complemento'],
  // No Forms o CEP veio rotulado ora como "CEP", ora como "CNPJ" (título trocado
  // na origem). Tentamos "cep" primeiro; "cnpj" é o fallback observado.
  CEP: ['cep', 'cnpj'],
  // CNPJ da parceira — fonte da senha padrão (5 primeiros dígitos, regra da V1).
  CNPJ: ['cnpj', 'cnpj (apenas números)', 'cnpj (somente números)', 'cnpj/cpf', 'cpf/cnpj', 'documento']
});

/**
 * Dígitos de um CNPJ válido o bastante para virar senha, ou '' se não houver.
 *
 * O guard de 11 dígitos existe por causa da colisão conhecida no Forms: a
 * pergunta de CEP às vezes veio rotulada "CNPJ" (ver `CANDIDATOS_CADASTRO.CEP`).
 * Um CEP tem 8 dígitos; exigir ao menos 11 (CPF/CNPJ) impede provisionar uma
 * senha a partir de um CEP mascarado de CNPJ. PURA.
 */
function _cnpjDeCadastroValido_(valores) {
  const bruto = _leitorDeCadastro_(valores)(CANDIDATOS_CADASTRO.CNPJ);
  const digitos = String(bruto === null || bruto === undefined ? '' : bruto).replace(/\D/g, '');

  return digitos.length >= 11 ? digitos : '';
}

function _textoCadastro_(valor) {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

// Normaliza uma chave de cabeçalho/pergunta: sem acento, minúscula, pontuação
// vira espaço, espaços colapsados. "Como prefere ser chamada?" → "como prefere ser chamada".
function _normalizarChaveCadastro_(texto) {
  return String(texto === null || texto === undefined ? '' : texto)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Devolve um leitor que resolve o primeiro título candidato presente no mapa.
function _leitorDeCadastro_(valoresPorColuna) {
  const normalizado = {};
  Object.keys(valoresPorColuna || {}).forEach(chave => {
    normalizado[_normalizarChaveCadastro_(chave)] = valoresPorColuna[chave];
  });

  return function (candidatos) {
    for (let i = 0; i < candidatos.length; i++) {
      const chave = _normalizarChaveCadastro_(candidatos[i]);
      if (chave in normalizado) {
        return _textoCadastro_(normalizado[chave]);
      }
    }
    return '';
  };
}

// Lê o CEP cru do formulário (título candidato), para alimentar a busca multi-API.
function _cepDoCadastro_(valoresPorColuna) {
  return _leitorDeCadastro_(valoresPorColuna)(CANDIDATOS_CADASTRO.CEP);
}

// Formata 8 dígitos como CEP brasileiro (XXXXX-XXX); devolve o texto original
// trimado se não tiver 8 dígitos. PURA.
function _formatarCep_(cep) {
  const digitos = String(cep === null || cep === undefined ? '' : cep).replace(/\D/g, '');
  return digitos.length === 8
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : _textoCadastro_(cep);
}

/**
 * Monta o Endereço_Formatado no padrão EXATO exigido pelo Autocrat:
 *   "RUA, NÚMERO, COMPLEMENTO, BAIRRO - CIDADE/UF, CEP"  (tudo em caixa alta)
 * Ex.: "RUA QUELUZ, 450, APTO 202, BOM PASTOR - DIVINÓPOLIS/MG, 35500-166".
 * Segmentos vazios são omitidos junto do separador (sem complemento não deixa
 * vírgula solta; sem bairro/cidade não deixa " - " órfão). PURA.
 */
function _montarEnderecoFormatado_(partes) {
  const rua = _textoCadastro_(partes.rua);
  const numero = _textoCadastro_(partes.numero);
  const complemento = _textoCadastro_(partes.complemento);
  const bairro = _textoCadastro_(partes.bairro);
  const cidade = _textoCadastro_(partes.cidade);
  const uf = _textoCadastro_(partes.uf);
  const cep = _formatarCep_(partes.cep);

  const cidadeUf = cidade ? (uf ? `${cidade}/${uf}` : cidade) : '';
  const local = [bairro, cidadeUf].filter(Boolean).join(' - ');

  return [rua, numero, complemento, local, cep].filter(Boolean).join(', ').toUpperCase();
}

/* ── Resolução de CEP: varredura multi-API com fallback sequencial ─────────── */

// Cada provedor devolve um shape diferente; normalizamos todos para
// { logradouro, bairro, localidade, uf }. Funções PURAS (testáveis no Jest).
function _normViaCep_(j) {
  if (!j || j.erro) return null;
  return { logradouro: j.logradouro, bairro: j.bairro, localidade: j.localidade, uf: j.uf };
}
function _normBrasilApi_(j) {
  if (!j || !j.city) return null;
  return { logradouro: j.street, bairro: j.neighborhood, localidade: j.city, uf: j.state };
}
function _normAwesomeApi_(j) {
  if (!j || !j.city) return null;
  return { logradouro: j.address, bairro: j.district, localidade: j.city, uf: j.state };
}
function _normOpenCep_(j) {
  if (!j || j.erro) return null;
  return { logradouro: j.logradouro, bairro: j.bairro, localidade: j.localidade, uf: j.uf };
}

// Ordem de tentativa: ViaCEP → BrasilAPI → AwesomeAPI → OpenCEP.
const PROVEDORES_CEP = Object.freeze([
  { nome: 'ViaCEP',     url: (c) => `https://viacep.com.br/ws/${c}/json/`,        norm: _normViaCep_ },
  { nome: 'BrasilAPI',  url: (c) => `https://brasilapi.com.br/api/cep/v1/${c}`,   norm: _normBrasilApi_ },
  { nome: 'AwesomeAPI', url: (c) => `https://cep.awesomeapi.com.br/json/${c}`,    norm: _normAwesomeApi_ },
  { nome: 'OpenCEP',    url: (c) => `https://opencep.com/v1/${c}`,                norm: _normOpenCep_ }
]);

// Um resultado só vale se trouxe ao menos a localidade (cidade sempre presente
// quando o CEP existe). Sem isso, cai para o próximo provedor.
function _cepValido_(dados) {
  return !!(dados && String(dados.localidade || '').trim());
}

/**
 * Varre os provedores de CEP em ORDEM; devolve { logradouro, bairro, localidade,
 * uf } do primeiro que responder 200 com dados válidos, ou `null` se todos
 * falharem/estiverem fora do ar ou o CEP for inválido. NUNCA lança — a
 * indisponibilidade do CEP degrada o endereço, não derruba o gatilho.
 */
function buscarCepMultiAPI(cep) {
  const digitos = String(cep === null || cep === undefined ? '' : cep).replace(/\D/g, '');
  if (digitos.length !== 8) return null;
  if (typeof UrlFetchApp === 'undefined') return null; // ambiente sem rede (Jest)

  for (let i = 0; i < PROVEDORES_CEP.length; i++) {
    const provedor = PROVEDORES_CEP[i];
    try {
      const resposta = UrlFetchApp.fetch(provedor.url(digitos), {
        muteHttpExceptions: true,
        followRedirects: true
      });
      if (resposta.getResponseCode() !== 200) continue;
      const dados = provedor.norm(JSON.parse(resposta.getContentText()));
      if (_cepValido_(dados)) return dados;
    } catch (erro) {
      console.warn(`buscarCepMultiAPI: ${provedor.nome} falhou (${erro.message}); tentando o próximo.`);
    }
  }
  return null;
}

/**
 * Transform PURO da resposta bruta do formulário para o cadastro canônico.
 * `enderecoApi` (opcional) traz { logradouro, bairro, localidade, uf } resolvidos
 * pelo CEP; quando ausente, o endereço degrada para o que veio no formulário.
 * Devolve `null` quando falta o apelido (sem chave primária não há registro).
 * `Nome` cai para o apelido quando a razão social vem vazia — nunca fica vazio.
 */
function parceiroDeCadastro_(valoresPorColuna, enderecoApi) {
  const get = _leitorDeCadastro_(valoresPorColuna);
  const id = get(CANDIDATOS_CADASTRO.APELIDO).trim().toUpperCase();

  if (!id) {
    return null;
  }

  const api = enderecoApi || {};
  const parceiro = {};
  parceiro[CAMPOS_PARCEIRO.ID] = id;
  parceiro[CAMPOS_PARCEIRO.NOME] = get(CANDIDATOS_CADASTRO.RAZAO) || id;
  parceiro['Endereço_Formatado'] = _montarEnderecoFormatado_({
    rua: api.logradouro || get(CANDIDATOS_CADASTRO.RUA),
    numero: get(CANDIDATOS_CADASTRO.NUMERO),
    complemento: get(CANDIDATOS_CADASTRO.COMPLEMENTO),
    bairro: api.bairro,
    cidade: api.localidade,
    uf: api.uf,
    cep: get(CANDIDATOS_CADASTRO.CEP)
  });

  return parceiro;
}

/* ═══════════════════════════════════════════════════════════════
   services/LogisticaService.js
   ═══════════════════════════════════════════════════════════════ */

const EVENTO_LOGISTICA_ENVIADA = 'LogisticaEnviada';
const EVENTO_LOGISTICA_STATUS_ALTERADO = 'LogisticaStatusAlterado';

/**
 * Orquestra a logística de envios. Devolve DTO, nunca a linha crua — a UI não
 * pode depender do nome das colunas da planilha (mesma razão de `AtivacaoService`).
 *
 * A "automação" da V1 (avisar a influenciadora quando o envio sai) é modelada
 * como EVENTO (`EVENTO_LOGISTICA_ENVIADA`), não como chamada direta a `MailApp`
 * dentro do Service: quem quiser notificar assina o evento. Nenhum listener de
 * e-mail é registrado aqui — disparo real de e-mail é efeito externo e exige
 * autorização explícita (CLAUDE.md §12.4).
 */
class LogisticaService {
  constructor(eventDispatcher, repository) {
    if (!eventDispatcher) {
      throw new TypeError('LogisticaService exige um EventDispatcher.');
    }

    this.eventDispatcher = eventDispatcher;
    this.repository = repository || new LogisticaRepository();
  }

  listarPorCiclo(idCiclo) {
    if (!idCiclo) {
      throw new Error('É obrigatório informar o ciclo.');
    }

    return this.repository.findByCiclo(idCiclo).map(linha => this._paraDto(linha));
  }

  /**
   * Escopo por parceira: uma influenciadora só vê os próprios envios (endereço,
   * rastreio), nunca os das outras do mesmo ciclo.
   */
  listarDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora) {
    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    return this.listarPorCiclo(idCiclo)
      .filter(dto => dto.idInfluenciadora === String(idInfluenciadora));
  }

  obter(idLogistica, idInfluenciadora) {
    return this._paraDto(this._exigirPropria(idLogistica, idInfluenciadora));
  }

  /**
   * Automação de envio: grava o rastreio e transiciona para "Enviado" numa
   * operação só, disparando `EVENTO_LOGISTICA_ENVIADA`.
   */
  registrarEnvio(idLogistica, codigoRastreio, idInfluenciadora) {
    if (!codigoRastreio || String(codigoRastreio).trim() === '') {
      throw new Error('É obrigatório informar o código de rastreio.');
    }

    const dados = this._exigirPropria(idLogistica, idInfluenciadora);

    const logistica = new Logistica(dados);
    logistica.validateStateTransition(ESTADOS_LOGISTICA.ENVIADO);

    const atualizado = Object.assign({}, dados);
    atualizado[CAMPOS_LOGISTICA.STATUS] = ESTADOS_LOGISTICA.ENVIADO;
    atualizado[CAMPOS_LOGISTICA.RASTREIO] = String(codigoRastreio).trim();
    atualizado[CAMPOS_LOGISTICA.DATA_ENVIO] = new Date().toISOString();

    const salvo = this.repository.save(atualizado);

    const dto = {
      idLogistica: salvo[CAMPOS_LOGISTICA.ID],
      idInfluenciadora: String(idInfluenciadora),
      codigoRastreio: atualizado[CAMPOS_LOGISTICA.RASTREIO],
      status: ESTADOS_LOGISTICA.ENVIADO,
      enviadoEm: atualizado[CAMPOS_LOGISTICA.DATA_ENVIO]
    };

    this.eventDispatcher.dispatch(EVENTO_LOGISTICA_ENVIADA, dto);

    return dto;
  }

  alterarStatus(idLogistica, novoStatus, idInfluenciadora) {
    return this._transicionarStatus(this._exigirPropria(idLogistica, idInfluenciadora), novoStatus);
  }

  /**
   * Alteração de status pelo Painel Admin. A autoridade é o ADMIN_TOKEN validado
   * no entrypoint (`_exigirAdmin` em Roteador.js), não a posse por parceira — por
   * isso NÃO passa por `_exigirPropria`. Mesma transição/evento de `alterarStatus`.
   */
  alterarStatusComoAdmin(idLogistica, novoStatus) {
    const dados = this.repository.getById(idLogistica);

    if (!dados) {
      throw new Error(`Logística "${idLogistica}" não encontrada.`);
    }

    return this._transicionarStatus(dados, novoStatus);
  }

  _transicionarStatus(dados, novoStatus) {
    const logistica = new Logistica(dados);
    logistica.validateStateTransition(novoStatus);

    const statusAnterior = logistica.statusAtual;

    const atualizado = Object.assign({}, dados);
    atualizado[CAMPOS_LOGISTICA.STATUS] = novoStatus;

    const salvo = this.repository.save(atualizado);

    const dto = {
      idLogistica: salvo[CAMPOS_LOGISTICA.ID],
      statusAnterior: statusAnterior,
      novoStatus: novoStatus,
      atualizadoEm: new Date().toISOString()
    };

    this.eventDispatcher.dispatch(EVENTO_LOGISTICA_STATUS_ALTERADO, dto);

    return dto;
  }

  /**
   * Posse antes de qualquer leitura/escrita de UM envio. "Não é sua" e "não
   * existe" devolvem a MESMA mensagem — distinguir revelaria ids existentes
   * (mesma decisão de `AtivacaoService._exigirPropria`).
   */
  _exigirPropria(idLogistica, idInfluenciadora) {
    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    const dados = this.repository.getById(idLogistica);
    const propria = dados &&
      String(dados[CAMPOS_LOGISTICA.INFLUENCIADORA]) === String(idInfluenciadora);

    if (!propria) {
      throw new Error(`Logística "${idLogistica}" não encontrada.`);
    }

    return dados;
  }

  _paraDto(linha) {
    const C = CAMPOS_LOGISTICA;

    return {
      idLogistica: textoDeCelula(linha[C.ID]),
      idCiclo: textoDeCelula(linha[C.CICLO]),
      idInfluenciadora: textoDeCelula(linha[C.INFLUENCIADORA]),
      enderecoEntrega: textoDeCelula(linha[C.ENDERECO]),
      codigoRastreio: textoDeCelula(linha[C.RASTREIO]),
      dataEnvio: dataIsoDeCelula(linha[C.DATA_ENVIO]),
      status: textoDeCelula(linha[C.STATUS])
    };
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/BriefingService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Chaves dos looks na planilha INDIVIDUAL da influenciadora (col A, em maiúsculo)
 * — exatamente as que o script antigo (`sincronizarLooks`) lia. LOOK REEL /
 * CARROSSEL / STORIES 1 e 2 do BRIEFING (ver briefing CSV, linha 0: "puxado da
 * planilha ... da aba INFLUENCIADORA, mesmo esquema do script antigo").
 */
const CHAVES_LOOK_BRIEFING = Object.freeze({
  REEL: 'LOOK_REEL',
  CARROSSEL: 'LOOK_CARROSSEL',
  STORIES_1: 'LOOK_STORIES_1',
  STORIES_2: 'LOOK_STORIES_2'
});

/**
 * Centraliza a varredura de looks do BRIEFING herdando o esquema da V1
 * (`mae/Código.js sincronizarLooks`): abre a planilha individual da parceira,
 * lê a aba "LOOKS BRIEFING" como pares col A→col B (chave em MAIÚSCULA, trim) e
 * projeta os 4 formatos em Title Case. Toda a lógica de interpretação vive aqui;
 * o BriefingRepository só faz o I/O externo (a camada nunca se inverte).
 */
class BriefingService {
  constructor(briefingRepository) {
    this.repository = briefingRepository || new BriefingRepository();
  }

  /**
   * Mesma montagem do mapa da V1: `dadosEx.forEach(l => if(l[0]) looks[l[0]
   * .toString().toUpperCase().trim()] = l[1])`. Linhas sem chave são ignoradas.
   */
  _mapaDeLooks(linhas) {
    const mapa = {};

    (linhas || []).forEach(function (linha) {
      if (linha && linha[0]) {
        mapa[String(linha[0]).toUpperCase().trim()] = linha[1];
      }
    });

    return mapa;
  }

  /**
   * Puxa os looks da planilha individual (`url`) e devolve os 4 formatos em
   * Title Case, como a V1 gravava no BRIEFING. FAIL-SAFE: URL inválida ou
   * planilha inacessível → looks vazios, nunca lança (a sincronia de um look
   * não pode derrubar a montagem do briefing).
   */
  puxarLooks(url) {
    const K = CHAVES_LOOK_BRIEFING;
    const vazio = { lookReel: '', lookCarrossel: '', lookStories1: '', lookStories2: '' };

    try {
      const linhas = this.repository.lerLooksExternos(url);
      if (!linhas) {
        return vazio;
      }

      const looks = this._mapaDeLooks(linhas);

      return {
        lookReel: formatarTitleCase(looks[K.REEL]),
        lookCarrossel: formatarTitleCase(looks[K.CARROSSEL]),
        lookStories1: formatarTitleCase(looks[K.STORIES_1]),
        lookStories2: formatarTitleCase(looks[K.STORIES_2])
      };
    } catch (erro) {
      console.warn(`BriefingService.puxarLooks: ignorado (fail-safe) — ${erro.message}`);
      return vazio;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/DriveService.js
   ═══════════════════════════════════════════════════════════════ */

/** Prefixo da pasta raiz da parceira no Drive (regra da BASE: `[TEAR] {nome}`). */
const PREFIXO_PASTA_PARCEIRA = '[TEAR] ';

/**
 * Automação de pastas no Google Drive. Toda operação é FAIL-SAFE: sem `DriveApp`
 * (fora do Apps Script), erro de permissão ou de rede devolve `''`, nunca lança —
 * criar uma pasta não pode derrubar o salvamento da parceira nem a geração do
 * ciclo. `DriveApp` é injetável para teste; em produção usa o global.
 */
class DriveService {
  constructor(drive) {
    this._drive = drive || (typeof DriveApp !== 'undefined' ? DriveApp : null);
  }

  /**
   * Cria a pasta raiz `[TEAR] {nome}` e devolve sua URL. Nome vazio ou ausência
   * de DriveApp → '' (o chamador decide o que fazer sem pasta).
   */
  garantirPastaRaiz(nome) {
    try {
      if (!this._drive) {
        return '';
      }

      const rotulo = String(nome === null || nome === undefined ? '' : nome).trim();
      if (!rotulo) {
        return '';
      }

      return this._drive.createFolder(PREFIXO_PASTA_PARCEIRA + rotulo).getUrl();
    } catch (erro) {
      console.warn(`DriveService.garantirPastaRaiz: ignorado (fail-safe) — ${erro.message}`);
      return '';
    }
  }

  /**
   * Cria (ou reaproveita) a subpasta `nomeSubpasta` dentro da pasta raiz apontada
   * por `urlRaiz` e devolve sua URL. Idempotente: se já existir uma subpasta com
   * o mesmo nome, reusa em vez de duplicar (mesma intenção do resto do
   * provisionamento). Qualquer entrada faltante/erro → ''.
   */
  garantirSubpasta(urlRaiz, nomeSubpasta) {
    try {
      if (!this._drive) {
        return '';
      }

      const url = String(urlRaiz === null || urlRaiz === undefined ? '' : urlRaiz).trim();
      const rotulo = String(nomeSubpasta === null || nomeSubpasta === undefined ? '' : nomeSubpasta).trim();
      if (!url || !rotulo) {
        return '';
      }

      const raiz = this._pastaPorUrl(url);
      if (!raiz) {
        return '';
      }

      const existentes = raiz.getFoldersByName(rotulo);
      if (existentes && existentes.hasNext()) {
        return existentes.next().getUrl();
      }

      return raiz.createFolder(rotulo).getUrl();
    } catch (erro) {
      console.warn(`DriveService.garantirSubpasta: ignorado (fail-safe) — ${erro.message}`);
      return '';
    }
  }

  /** A URL de pasta do Drive é `.../folders/{ID}`; extrai o ID e resolve. */
  _pastaPorUrl(url) {
    const casamento = String(url).match(/[-\w]{25,}/);
    if (!casamento) {
      return null;
    }

    return this._drive.getFolderById(casamento[0]);
  }
}
