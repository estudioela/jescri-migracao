/**
 * MÓDULO: Envio — fluxo logístico de envio e rastreio (SPEC-016/ADR-012)
 *
 * Fatia vertical (ADR-014): camadas como seções, na ordem
 * DOMAIN → ACL → REPOSITORY → SERVICE → CONTROLLER → ADAPTERS.
 * Os contratos de camada valem integralmente (docs/ARQUITETURA_CAMADAS.md).
 */

// ============================================================================
// DOMAIN — Envio.js (ex-src/domain/Envio.js)
// ============================================================================

/**
 * AGREGADO RAIZ: Envio (SPEC-016 §6.2)
 *
 * Registro do envio físico do produto de uma Colaboração Mensal para uma
 * Parceira (era "Fluxo Logístico"). Um Envio por Parceira Ativa por
 * competência (RN-01).
 *
 * Invariantes preservadas:
 * - INV-01: todo Envio referencia uma Colaboração Mensal compilada — a
 *   identidade é Parceira × competência (MesReferencia).
 * - RN-04 (ADR-001 §2.4): DUAS máquinas de estado INDEPENDENTES —
 *   Revisão de dados: AguardandoConfirmacao → Confirmado(terminal);
 *   Jornada física: Pendente → Expedido → Entregue(terminal→arquiva)
 *                                       └→ Cancelado(terminal).
 * - INV-02/RN-05: transição fora das máquinas falha barulhento (LG-02).
 * - RN-02/CB-02: registrar rastreio preenche a data de envio apenas se
 *   ainda vazia; re-registro substitui o código preservando a data.
 * - RN-03: ao ser entregue, arquiva automaticamente com data de
 *   arquivamento (fornecida pelo chamador — determinístico, RNF-02).
 * - INV-03: Envio arquivado (Entregue) é somente leitura.
 * - D-03: endereço/PIX NUNCA são persistidos no Envio (exceção da
 *   UC-016.01 vive no Service, não aqui).
 *
 * PORTA DE RASTREIO (§6.3, D-02): quem consulta a transportadora é um
 * adaptador que honra o contrato { consultar(codigoRastreio) →
 * { entregue: boolean } } — implementado fora do domínio (Bloco 2,
 * ManualTrackingAdapter); falha do adaptador é degradável (RNF-01) e
 * tratada no Service, nunca aqui.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna
 * física. Não conhece Entrega de conteúdo (SPEC-012) nem Pagamento
 * (SPEC-020).
 */

this.Envio = class Envio {
  /**
   * @param {string} parceiraId identidade estável da Parceira.
   * @param {MesReferencia} mesReferencia competência da colaboração (VO).
   */
  constructor(parceiraId, mesReferencia) {
    const id = String(parceiraId == null ? '' : parceiraId).trim();
    if (id === '') {
      throw new Error('Envio exige a identidade da Parceira (RN-01).');
    }
    if (!(mesReferencia instanceof MesReferencia)) {
      throw new Error('Envio exige a competência como MesReferencia (INV-01).');
    }
    this.parceiraId = id;
    this.mesReferencia = mesReferencia;
    // §9: nasce AguardandoConfirmacao + Pendente; demais estados só via transições.
    this.revisao = 'AguardandoConfirmacao';
    this.jornada = 'Pendente';
    this.rastreio = null;
    this.dataEnvio = null;
    this.dataArquivamento = null;
  }

  /**
   * Igualdade de entidade por Parceira × competência (RN-01).
   * @param {Envio} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return (
      outro instanceof Envio &&
      this.parceiraId === outro.parceiraId &&
      this.mesReferencia.igualA(outro.mesReferencia)
    );
  }

  /**
   * UC-016.01 · Confirmar endereço: AguardandoConfirmacao → Confirmado
   * (terminal). Máquina de Revisão de dados, independente da Jornada
   * (RN-04).
   * @returns {Envio}
   * @throws {Error} INV-03 se arquivado; LG-02 fora de AguardandoConfirmacao.
   */
  confirmarEndereco() {
    this.recusarSeArquivado();
    if (this.revisao !== 'AguardandoConfirmacao') {
      throw new Error(
        "LG-02: transição inválida (§9) — confirmar endereço exige 'AguardandoConfirmacao', estado atual: '" +
          this.revisao +
          "'."
      );
    }
    this.revisao = 'Confirmado';
    return this;
  }

  /**
   * UC-016.02 · Registrar rastreio: Pendente → Expedido. A data de envio é
   * preenchida apenas se ainda vazia (RN-02); re-registro substitui o
   * código preservando a data (CB-02).
   * @param {string} codigo código de rastreio.
   * @param {Date} dataEnvio data de envio, fornecida pelo chamador
   *   (determinística e testável).
   * @returns {Envio}
   * @throws {Error} INV-03 se arquivado; LG-02 fora de Pendente/Expedido;
   *   data de envio inválida.
   */
  registrarRastreio(codigo, dataEnvio) {
    this.recusarSeArquivado();
    if (this.jornada !== 'Pendente' && this.jornada !== 'Expedido') {
      throw new Error(
        "LG-02: transição inválida (§9) — registrar rastreio exige 'Pendente' ou 'Expedido', estado atual: '" +
          this.jornada +
          "'."
      );
    }
    // Duck-typing (não instanceof): Date pode vir de outro realm (vm).
    if (
      this.dataEnvio === null &&
      (dataEnvio == null || typeof dataEnvio.getTime !== 'function' || isNaN(dataEnvio.getTime()))
    ) {
      throw new Error(
        "RN-02: data de envio inválida no registro de rastreio do Envio de '" +
          this.parceiraId +
          "'."
      );
    }
    this.rastreio = new CodigoRastreio(codigo);
    if (this.dataEnvio === null) {
      this.dataEnvio = dataEnvio;
    }
    this.jornada = 'Expedido';
    return this;
  }

  /**
   * UC-016.03/RN-03 · Entrega detectada: Expedido → Entregue (terminal),
   * arquivando automaticamente com a data de arquivamento.
   * @param {Date} dataArquivamento fornecida pelo chamador (determinística).
   * @returns {Envio}
   * @throws {Error} INV-03 se já arquivado; LG-02 fora de Expedido; data
   *   de arquivamento inválida.
   */
  marcarEntregue(dataArquivamento) {
    this.recusarSeArquivado();
    if (this.jornada !== 'Expedido') {
      throw new Error(
        "LG-02: transição inválida (§9) — marcar entregue exige 'Expedido', estado atual: '" +
          this.jornada +
          "'."
      );
    }
    if (
      dataArquivamento == null ||
      typeof dataArquivamento.getTime !== 'function' ||
      isNaN(dataArquivamento.getTime())
    ) {
      throw new Error(
        "RN-03: data de arquivamento inválida na entrega do Envio de '" + this.parceiraId + "'."
      );
    }
    this.jornada = 'Entregue';
    this.dataArquivamento = dataArquivamento;
    Object.freeze(this);
    return this;
  }

  /**
   * Cancelamento: Expedido → Cancelado (terminal, §9).
   * @returns {Envio}
   * @throws {Error} INV-03 se arquivado; LG-02 fora de Expedido.
   */
  cancelar() {
    this.recusarSeArquivado();
    if (this.jornada !== 'Expedido') {
      throw new Error(
        "LG-02: transição inválida (§9) — cancelar exige 'Expedido', estado atual: '" +
          this.jornada +
          "'."
      );
    }
    this.jornada = 'Cancelado';
    return this;
  }

  /**
   * INV-03: Envio arquivado (Entregue) é somente leitura.
   * @throws {Error} INV-03 se a Jornada já é 'Entregue'.
   */
  recusarSeArquivado() {
    if (this.jornada === 'Entregue') {
      throw new Error('INV-03: Envio arquivado é somente leitura.');
    }
  }
};

// ============================================================================
// DOMAIN — EnderecoDeEntrega.js (ex-src/domain/EnderecoDeEntrega.js)
// ============================================================================

/**
 * VALUE OBJECT: EnderecoDeEntrega (SPEC-016 §6.1)
 *
 * Endereço físico de entrega da Parceira — PII (Contrato §5, INV-04).
 *
 * DECISÃO D-03 (aprovada pelo PO em 2026-07-15): exceção autorizada — o
 * módulo Logística acessa endereço/PIX EXCLUSIVAMENTE durante a UC-016.01;
 * o dado não é persistido no Envio, não vai a log e não é exposto fora do
 * caso de uso. RN-10 (SPEC-002) permanece válida.
 *
 * Invariantes preservadas:
 * - Imutável; endereço vazio falha barulhento.
 * - INV-04: `toString`/`toJSON` NUNCA revelam o valor — leitura só pelo
 *   acesso explícito a `valor`, dentro da UC-016.01.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, Logger.
 */

this.EnderecoDeEntrega = class EnderecoDeEntrega {
  /**
   * @param {string} endereco endereço completo de entrega (PII).
   */
  constructor(endereco) {
    const texto = String(endereco == null ? '' : endereco).trim();
    if (texto === '') {
      throw new Error('EnderecoDeEntrega exige o endereço de entrega da Parceira (UC-016.01).');
    }
    this.valor = texto;
    Object.freeze(this);
  }

  /**
   * Igualdade de VO pelo valor.
   * @param {EnderecoDeEntrega} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return outro instanceof EnderecoDeEntrega && this.valor === outro.valor;
  }

  /**
   * INV-04: interpolação/log acidental não vaza PII.
   * @returns {string} marcador protegido, nunca o endereço.
   */
  toString() {
    return '[ENDEREÇO PROTEGIDO — INV-04]';
  }

  /**
   * INV-04: serialização acidental (JSON.stringify) não vaza PII.
   * @returns {string} marcador protegido, nunca o endereço.
   */
  toJSON() {
    return '[ENDEREÇO PROTEGIDO — INV-04]';
  }
};

// ============================================================================
// DOMAIN — CodigoRastreio.js (ex-src/domain/CodigoRastreio.js)
// ============================================================================

/**
 * VALUE OBJECT: CodigoRastreio (SPEC-016 §6.1)
 *
 * Código de rastreio do Envio físico junto à transportadora (UC-016.02).
 *
 * Invariantes preservadas:
 * - Imutável após criação; código vazio falha barulhento (RN-05).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL,
 * UrlFetchApp (a consulta à transportadora é da porta de rastreio, §6.3).
 */

this.CodigoRastreio = class CodigoRastreio {
  /**
   * @param {string} codigo código informado pelo Operador (UC-016.02).
   */
  constructor(codigo) {
    const texto = String(codigo == null ? '' : codigo).trim();
    if (texto === '') {
      throw new Error('CodigoRastreio exige o código de rastreio do Envio (UC-016.02).');
    }
    this.valor = texto;
    Object.freeze(this);
  }

  /**
   * Igualdade de VO pelo valor.
   * @param {CodigoRastreio} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return outro instanceof CodigoRastreio && this.valor === outro.valor;
  }

  /**
   * @returns {string} o código de rastreio.
   */
  toString() {
    return this.valor;
  }
};

// ============================================================================
// ACL — EnvioACL.js (ex-src/acl/EnvioACL.js)
// ============================================================================

/**
 * ACL: EnvioACL — camada anticorrupção do Envio (SPEC-016; aba física
 * ENVIOS, nova, própria da V2 — legado ("FLUXO LOGÍSTICO") nunca é
 * normativo).
 *
 * DECISÃO LOCAL (rótulos crus — D-01, SPEC-016 §21, a confirmar por ADR):
 * como a aba ENVIOS é nova e não há seed legado a observar, os rótulos
 * crus adotados seguem a mesma convenção mecânica já usada em BriefingACL/
 * EntregaACL/ColaboracaoMensalACL (SCREAMING_SNAKE_CASE do nome canônico).
 * Pendência D-01 permanece aberta para confirmação do arquiteto.
 *
 * Uma ACL por aba (Contrato §7): único ponto que conhece as colunas físicas
 * da aba ENVIOS. Resolução SEMPRE por cabeçalho, nunca por índice fixo.
 *
 * Projeção física — uma linha por Envio:
 * - INFLU_KEY / ANO_REFERENCIA / MES_REFERENCIA ← identidade (Parceira ×
 *   competência, RN-01/INV-01 — sem rótulo, ao contrário da Entrega)
 * - STATUS_REVISAO / STATUS_LOGISTICA ← as DUAS máquinas independentes (§9,
 *   RN-04, ADR-001 §2.4)
 * - RASTREIO / DATA_ENVIO / DATA_ARQUIVAMENTO ← campos da Jornada física
 * Nenhuma coluna de endereço/PIX existe nesta aba — PII nunca persistida
 * no Envio (INV-04, D-03: o endereço só é lido, nunca gravado, na UC-016.01).
 *
 * Escrita: substituição/upsert reescrevem a aba inteira num ÚNICO setValues
 * (RN-01 — a competência é recriada no mesmo lote).
 *
 * A reidratação atravessa o domínio (confirmarEndereco/registrarRastreio/
 * marcarEntregue/cancelar) — nunca escreve estado por fora. A ordem importa:
 * a Revisão (confirmarEndereco) é aplicada ANTES de qualquer mutação de
 * Jornada, porque Entregue arquiva o Envio (INV-03) e bloqueia mutações
 * subsequentes, incluindo a de Revisão. Estado cru desconhecido (RN-05) ou
 * incoerente com as demais colunas falha barulhento.
 *
 * Não pode conter regra de negócio nem ser duplicada.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues(), clearContents() e
 *   getRange(...).setValues(...)).
 */

this.EnvioACL = class EnvioACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Coage a Revisão canônica → rótulo cru persistido (§9, D-01).
   * @param {string} canonico
   * @returns {string}
   */
  revisaoParaCru(canonico) {
    const mapa = { AguardandoConfirmacao: 'AGUARDANDO_CONFIRMACAO', Confirmado: 'CONFIRMADO' };
    if (!mapa[canonico]) {
      throw new Error("Revisão de Envio desconhecida: '" + canonico + "'.");
    }
    return mapa[canonico];
  }

  /**
   * Coage o STATUS_REVISAO físico cru → canônico do domínio (trim +
   * casefold). Valor desconhecido → erro de validação (RN-05).
   * @param {string} cru
   * @returns {string}
   */
  revisaoParaCanonico(cru) {
    const normalizado = String(cru == null ? '' : cru).trim().toLowerCase();
    const mapa = { aguardando_confirmacao: 'AguardandoConfirmacao', confirmado: 'Confirmado' };
    if (!mapa[normalizado]) {
      throw new Error("LG-02: STATUS_REVISAO desconhecido em 'ENVIOS'.STATUS_REVISAO: '" + cru + "'.");
    }
    return mapa[normalizado];
  }

  /**
   * Coage a Jornada canônica → rótulo cru persistido (§9, D-01).
   * @param {string} canonico
   * @returns {string}
   */
  jornadaParaCru(canonico) {
    const mapa = {
      Pendente: 'PENDENTE',
      Expedido: 'EXPEDIDO',
      Entregue: 'ENTREGUE',
      Cancelado: 'CANCELADO',
    };
    if (!mapa[canonico]) {
      throw new Error("Jornada de Envio desconhecida: '" + canonico + "'.");
    }
    return mapa[canonico];
  }

  /**
   * Coage o STATUS_LOGISTICA físico cru → canônico do domínio (trim +
   * casefold). Valor desconhecido → erro de validação (RN-05).
   * @param {string} cru
   * @returns {string}
   */
  jornadaParaCanonico(cru) {
    const normalizado = String(cru == null ? '' : cru).trim().toLowerCase();
    const mapa = {
      pendente: 'Pendente',
      expedido: 'Expedido',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
    };
    if (!mapa[normalizado]) {
      throw new Error("LG-02: STATUS_LOGISTICA desconhecido em 'ENVIOS'.STATUS_LOGISTICA: '" + cru + "'.");
    }
    return mapa[normalizado];
  }

  /**
   * Coage valor cru de célula de data → Date canônica (fail-fast).
   * @param {*} cru valor lido da célula.
   * @param {string} colunaNome para a mensagem de erro.
   * @returns {Date|null} null quando a célula está vazia.
   */
  dataParaCanonica(cru, colunaNome) {
    return celulaParaData(cru, colunaNome, 'ENVIOS');
  }

  /**
   * Substitui TODOS os Envios da competência num único lote (RN-01):
   * linhas de outras competências são preservadas.
   * @param {MesReferencia} mesReferencia
   * @param {Envio[]} envios
   */
  substituirCompetencia(mesReferencia, envios) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const mantidas = valores.slice(1).filter((linha) => {
      if (String(linha[coluna('INFLU_KEY')]).trim() === '') {
        return false;
      }
      return !(
        Number(linha[coluna('ANO_REFERENCIA')]) === mesReferencia.ano &&
        Number(linha[coluna('MES_REFERENCIA')]) === mesReferencia.mes
      );
    });
    this.reescrever(cabecalho, mantidas.concat(this.linhasDe(cabecalho, envios)));
  }

  /**
   * Upsert de um Envio pela identidade permanente (Parceira × competência).
   * @param {Envio} envio
   */
  salvar(envio) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const mantidas = valores.slice(1).filter((linha) => {
      if (String(linha[coluna('INFLU_KEY')]).trim() === '') {
        return false;
      }
      return !(
        String(linha[coluna('INFLU_KEY')]) === envio.parceiraId &&
        Number(linha[coluna('ANO_REFERENCIA')]) === envio.mesReferencia.ano &&
        Number(linha[coluna('MES_REFERENCIA')]) === envio.mesReferencia.mes
      );
    });
    this.reescrever(cabecalho, mantidas.concat(this.linhasDe(cabecalho, [envio])));
  }

  /**
   * Lê a aba inteira e reconstrói os agregados (uma linha por Envio).
   * Linhas sem INFLU_KEY são ignoradas.
   * @returns {Envio[]}
   */
  listarTodos() {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    return valores
      .slice(1)
      .filter((linha) => String(linha[coluna('INFLU_KEY')]).trim() !== '')
      .map((linha) => this.reidratar(linha, coluna));
  }

  /**
   * Reconstrói um Envio a partir da linha física, atravessando o domínio.
   * A Revisão é aplicada ANTES da Jornada: Entregue arquiva o Envio
   * (INV-03) e bloquearia a mutação de Revisão se aplicada depois.
   * @param {Array} linha linha física do Envio.
   * @param {function(string): number} coluna resolve nome → índice.
   * @returns {Envio}
   */
  reidratar(linha, coluna) {
    const envio = new Envio(
      String(linha[coluna('INFLU_KEY')]),
      new MesReferencia(
        Number(linha[coluna('ANO_REFERENCIA')]),
        Number(linha[coluna('MES_REFERENCIA')])
      )
    );

    const revisaoCanonica = this.revisaoParaCanonico(linha[coluna('STATUS_REVISAO')]);
    if (revisaoCanonica === 'Confirmado') {
      envio.confirmarEndereco();
    }

    const jornadaCanonica = this.jornadaParaCanonico(linha[coluna('STATUS_LOGISTICA')]);
    const rastreioCru = String(
      linha[coluna('RASTREIO')] == null ? '' : linha[coluna('RASTREIO')]
    ).trim();
    if (rastreioCru !== '') {
      envio.registrarRastreio(
        rastreioCru,
        this.dataParaCanonica(linha[coluna('DATA_ENVIO')], 'DATA_ENVIO')
      );
    }
    if (jornadaCanonica === 'Entregue') {
      envio.marcarEntregue(
        this.dataParaCanonica(linha[coluna('DATA_ARQUIVAMENTO')], 'DATA_ARQUIVAMENTO')
      );
    }
    if (jornadaCanonica === 'Cancelado') {
      envio.cancelar();
    }

    if (envio.revisao !== revisaoCanonica || envio.jornada !== jornadaCanonica) {
      throw new Error(
        "LG-02: linha incoerente em 'ENVIOS' — Revisão '" +
          revisaoCanonica +
          "' / Jornada '" +
          jornadaCanonica +
          "' não é alcançável com as colunas persistidas do Envio de '" +
          envio.parceiraId +
          "'."
      );
    }
    return envio;
  }

  /**
   * @param {Array} cabecalho
   * @returns {function(string): number} resolve nome → índice, fail-fast.
   */
  resolvedorDeColuna(cabecalho) {
    return criarResolvedorDeColuna(cabecalho, 'ENVIOS');
  }

  /**
   * Projeta Envios em linhas físicas (uma por Envio), posicionando cada
   * campo pela sua coluna.
   * @param {Array} cabecalho
   * @param {Envio[]} envios
   * @returns {Array[]}
   */
  linhasDe(cabecalho, envios) {
    return envios.map((envio) => {
      const fisico = {
        INFLU_KEY: envio.parceiraId,
        MES_REFERENCIA: envio.mesReferencia.mes,
        ANO_REFERENCIA: envio.mesReferencia.ano,
        STATUS_REVISAO: this.revisaoParaCru(envio.revisao),
        STATUS_LOGISTICA: this.jornadaParaCru(envio.jornada),
        RASTREIO: envio.rastreio ? envio.rastreio.toString() : '',
        DATA_ENVIO: envio.dataEnvio ? envio.dataEnvio : '',
        DATA_ARQUIVAMENTO: envio.dataArquivamento ? envio.dataArquivamento : '',
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
// REPOSITORY — EnvioRepository.js (ex-src/repository/EnvioRepository.js)
// ============================================================================

/**
 * REPOSITORY: EnvioRepository — persistência do Envio (SPEC-016).
 *
 * Único ponto (junto da ACL) que trata persistência do agregado. Fala
 * exclusivamente com a porta da ACL — nunca toca SpreadsheetApp nem conhece
 * coluna física (RNF-02).
 *
 * - RN-01: a materialização por compilação substitui TODOS os Envios da
 *   competência num único lote atômico da ACL (tudo ou nada; falha física
 *   propaga sem efeito parcial).
 * - salvar persiste transições de um Envio existente (upsert pela
 *   identidade permanente na ACL — Parceira × competência).
 * - obterPor/listarPor atendem UC-016.01/02/03 e a query do Portal.
 *
 * Não pode conter regra de negócio nem formatar envelope.
 *
 * @param {object} acl ACL do Envio (porta: substituirCompetencia, salvar,
 *   listarTodos).
 */

this.EnvioRepository = class EnvioRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Recria os Envios de uma competência num único lote atômico (RN-01).
   * @param {MesReferencia} mesReferencia
   * @param {Envio[]} envios recém-materializados da compilação.
   * @returns {Envio[]} os mesmos Envios persistidos.
   */
  recriarCompetencia(mesReferencia, envios) {
    this.acl.substituirCompetencia(mesReferencia, envios);
    return envios;
  }

  /**
   * Base factual para a reconciliação idempotente da compilação (achado F1
   * da auditoria SPEC-012, `docs/_workspace/auditorias/AUDITORIA_SPEC012.md`):
   * a decisão de (re)materializar ou pular pertence ao Service, não aqui.
   * @param {MesReferencia} mesReferencia
   * @returns {boolean}
   */
  existeParaCompetencia(mesReferencia) {
    return this.listarPor(mesReferencia).length > 0;
  }

  /**
   * Persiste o estado atual de um Envio (transições das máquinas §9).
   * @param {Envio} envio
   * @returns {Envio} o mesmo Envio persistido.
   */
  salvar(envio) {
    this.acl.salvar(envio);
    return envio;
  }

  /**
   * Busca um Envio pela identidade permanente (Parceira × competência).
   * @param {MesReferencia} mesReferencia
   * @param {string} parceiraId
   * @returns {Envio|null}
   */
  obterPor(mesReferencia, parceiraId) {
    return (
      this.acl
        .listarTodos()
        .find(
          (envio) => envio.mesReferencia.igualA(mesReferencia) && envio.parceiraId === parceiraId
        ) || null
    );
  }

  /**
   * Lista os Envios de uma competência, opcionalmente por Parceira.
   * @param {MesReferencia} mesReferencia
   * @param {string} [parceiraId]
   * @returns {Envio[]}
   */
  listarPor(mesReferencia, parceiraId) {
    return this.acl
      .listarTodos()
      .filter((envio) => envio.mesReferencia.igualA(mesReferencia))
      .filter((envio) => parceiraId === undefined || envio.parceiraId === parceiraId);
  }
};

// ============================================================================
// SERVICE — EnvioService.js (ex-src/service/EnvioService.js)
// ============================================================================

/**
 * SERVICE: EnvioService — casos de uso do Envio (SPEC-016 UC-016.01/02/03;
 * RN-01/RN-02/RN-03; RNF-01/CB-01 falha degradável do adaptador).
 *
 * - Reage a `MesCompilado` (§5/§14.1): materializa um Envio por Colaboração
 *   compilada (toda Parceira Ativa, RN-01), num lote atômico do Repository.
 * - UC-016.01/D-03: confirmarEndereco() transita a Revisão e, SÓ ENTÃO, lê
 *   endereço/PIX na porta do Cadastro EXCLUSIVAMENTE para compor a
 *   mensagem de confirmação manual — o dado nunca é persistido no Envio
 *   (INV-04) nem entra em log/evento.
 * - UC-016.02: registrar rastreio persiste antes de publicar `ProdutoDespachado`
 *   (mesma disciplina de CB-03 — falha na persistência nunca publica evento).
 * - UC-016.03/RNF-01/CB-01: consulta a porta de rastreio; falha do adaptador
 *   é degradável — a operação principal segue sem erro nem efeito.
 * - Datas de envio/arquivamento vêm do relógio injetado — determinístico e
 *   testável (RN-02/RNF-02).
 * - LG-01 (§17): Envio inexistente é recusado fail-fast.
 *
 * DÍVIDAS REGISTRADAS:
 * - D-01 (SPEC-016 §21): rótulos crus da EnvioACL são convenção provisória,
 *   pendente de confirmação por ADR.
 * - D-02 (SPEC-016 §21): provedor/contrato real da API de rastreio — o
 *   adaptador injetado aqui é a porta; a implementação concreta (HTTP) é
 *   dívida futura, mesma disciplina de D-02 (Entrega) e do publicador de log.
 *
 * Não pode: tocar SpreadsheetApp; conhecer coluna física; formatar envelope.
 *
 * @param {ColaboracaoMensalRepository} colaboracaoMensalRepository base da
 *   materialização (M2, congelado — somente leitura).
 * @param {object} cadastroDeParceiras porta do Cadastro (D-03):
 *   obterContatoDeEnvio(parceiraId) → {endereco, pix}|null.
 * @param {EnvioRepository} envioRepository persistência do agregado.
 * @param {object} adaptadorDeRastreio porta de rastreio (D-02):
 *   consultar(codigoRastreio) → {entregue: boolean}.
 * @param {object} publicadorDeEventos porta de eventos: publicar(evento).
 * @param {object} relogio porta de tempo: hoje() → Date.
 */

this.EnvioService = class EnvioService {
  constructor(
    colaboracaoMensalRepository,
    cadastroDeParceiras,
    envioRepository,
    adaptadorDeRastreio,
    publicadorDeEventos,
    relogio
  ) {
    this.colaboracaoMensalRepository = colaboracaoMensalRepository;
    this.cadastroDeParceiras = cadastroDeParceiras;
    this.envioRepository = envioRepository;
    this.adaptadorDeRastreio = adaptadorDeRastreio;
    this.publicadorDeEventos = publicadorDeEventos;
    this.relogio = relogio;
  }

  /**
   * Reação a `MesCompilado` (RN-01): materializa os Envios da competência,
   * um por Colaboração compilada (toda Parceira Ativa). Idempotente por
   * competência (achado F1/F2 da auditoria SPEC-012): se já existe algum
   * Envio desta competência, é no-op — nunca sobrescreve (protege
   * confirmações/rastreios/arquivamentos já feitos e permite reconciliar
   * com segurança uma compilação anterior que falhou parcialmente).
   * @param {string} mesReferenciaTexto competência 'AAAA-MM'.
   * @returns {Envio[]} Envios materializados (vazio se já existia).
   */
  materializarParaCompetencia(mesReferenciaTexto) {
    const mesReferencia = MesReferencia.deTexto(String(mesReferenciaTexto));
    if (this.envioRepository.existeParaCompetencia(mesReferencia)) {
      return [];
    }
    const colaboracoes = this.colaboracaoMensalRepository.listarPor(mesReferencia);
    const envios = colaboracoes.map(
      (colaboracao) => new Envio(colaboracao.parceiraId, colaboracao.mesReferencia)
    );
    return this.envioRepository.recriarCompetencia(mesReferencia, envios);
  }

  /**
   * UC-016.01 · Confirmar endereço: lê e valida endereço/PIX na porta do
   * Cadastro (D-03) ANTES de mutar e persistir — se o contato for inválido
   * (VO fail-fast), nada é persistido (mesma disciplina de "falha nunca
   * deixa efeito parcial" de RN-01/CB-03). Só então AguardandoConfirmacao
   * → Confirmado e persiste. O endereço/PIX nunca é persistido no Envio.
   * @param {{mesReferencia: string, parceiraId: string}} comando
   * @returns {{envio: Envio, mensagem: string}}
   * @throws {Error} LG-01 Envio inexistente; endereço ausente no cadastro
   *   (fail-fast do VO); LG-02 transição inválida.
   */
  confirmarEndereco(comando) {
    const { envio } = this.resolver(comando);

    const contato = this.cadastroDeParceiras.obterContatoDeEnvio(envio.parceiraId) || {
      endereco: '',
      pix: '',
    };
    const endereco = new EnderecoDeEntrega(contato.endereco);

    envio.confirmarEndereco();
    this.envioRepository.salvar(envio);

    return {
      envio,
      mensagem: 'Endereço de entrega: ' + endereco.valor + ' — Chave PIX: ' + contato.pix,
    };
  }

  /**
   * UC-016.02 · Registrar rastreio: Pendente/Expedido → Expedido (RN-02: a
   * data de envio é preenchida pelo relógio SÓ na primeira vez), persiste e
   * publica `ProdutoDespachado` — evento só após persistência (CB-03).
   * @param {{mesReferencia: string, parceiraId: string, codigo: string}} comando
   * @returns {Envio}
   * @throws {Error} LG-01 Envio inexistente; LG-02 transição inválida.
   */
  registrarRastreio(comando) {
    const { mesReferencia, envio } = this.resolver(comando);
    envio.registrarRastreio(comando.codigo, this.relogio.hoje());
    this.envioRepository.salvar(envio);

    this.publicadorDeEventos.publicar({
      nome: 'ProdutoDespachado',
      parceiraId: envio.parceiraId,
      mesReferencia: mesReferencia.toString(),
      rastreio: envio.rastreio.toString(),
    });
    return envio;
  }

  /**
   * UC-016.03 · Atualizar status: consulta a porta de rastreio; se indicar
   * entrega, arquiva automaticamente (Expedido → Entregue) com a data do
   * relógio e publica `ProdutoEntregue`. Falha do adaptador é degradável
   * (RNF-01/CB-01): a operação principal segue, sem erro nem evento.
   * @param {{mesReferencia: string, parceiraId: string}} comando
   * @returns {Envio} o Envio, atualizado ou inalterado.
   * @throws {Error} LG-01 Envio inexistente.
   */
  atualizarStatus(comando) {
    const { mesReferencia, envio } = this.resolver(comando);
    let resultado;
    try {
      resultado = this.adaptadorDeRastreio.consultar(
        envio.rastreio ? envio.rastreio.toString() : null
      );
    } catch {
      // CB-01/RNF-01: transportadora indisponível não bloqueia a operação.
      return envio;
    }
    if (!resultado || resultado.entregue !== true) {
      return envio;
    }

    envio.marcarEntregue(this.relogio.hoje());
    this.envioRepository.salvar(envio);

    this.publicadorDeEventos.publicar({
      nome: 'ProdutoEntregue',
      parceiraId: envio.parceiraId,
      mesReferencia: mesReferencia.toString(),
      dataArquivamento: envio.dataArquivamento,
    });
    return envio;
  }

  /**
   * Lista os Envios da competência, opcionalmente por Parceira.
   * @param {string} mesReferenciaTexto 'AAAA-MM'.
   * @param {string} [parceiraId]
   * @returns {Envio[]}
   */
  listarEnvios(mesReferenciaTexto, parceiraId) {
    return this.envioRepository.listarPor(
      MesReferencia.deTexto(String(mesReferenciaTexto)),
      parceiraId
    );
  }

  /**
   * Resolve o comando externo no Envio alvo (LG-01 fail-fast).
   * @param {{mesReferencia: string, parceiraId: string}} comando
   * @returns {{mesReferencia: MesReferencia, envio: Envio}}
   */
  resolver(comando) {
    if (comando == null || typeof comando !== 'object') {
      throw new Error('LG-01: comando ausente — identifique o Envio.');
    }
    const mesReferencia = MesReferencia.deTexto(String(comando.mesReferencia));
    return {
      mesReferencia,
      envio: this.obterOuFalhar(mesReferencia, comando.parceiraId),
    };
  }

  /**
   * @param {MesReferencia} mesReferencia
   * @param {string} parceiraId
   * @returns {Envio}
   * @throws {Error} LG-01 quando o Envio não existe.
   */
  obterOuFalhar(mesReferencia, parceiraId) {
    const envio = this.envioRepository.obterPor(mesReferencia, parceiraId);
    if (envio === null) {
      throw new Error(
        "LG-01: Envio inexistente — '" +
          parceiraId +
          "' × " +
          mesReferencia.toString() +
          ' (recompile o mês se a competência ainda não foi materializada).'
      );
    }
    return envio;
  }
};

// ============================================================================
// CONTROLLER — EnvioController.js (ex-src/controller/EnvioController.js)
// ============================================================================

/**
 * CONTROLLER: EnvioController — adapta o contrato externo do Envio
 * (SPEC-016 UC-016.01/02/03).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * EnvioService e devolve SEMPRE o envelope padrão {success,data}/
 * {success,error} (PROJECT_GOVERNANCE §3.3, via envelopeOk/envelopeFail).
 *
 * Expõe apenas uma projeção serializável do Envio — nunca a instância de
 * domínio; datas saem como 'AAAA-MM-DD'. A projeção NUNCA carrega endereço/
 * PIX (INV-04) — a única exceção autorizada é a `mensagem` de confirmação
 * devolvida por confirmarEndereco (D-03, UC-016.01), destinada ao Operador
 * que faz o envio manual.
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {EnvioService} envioService
 */

this.EnvioController = class EnvioController {
  constructor(envioService) {
    this.envioService = envioService;
  }

  /**
   * Adapta o comando ConfirmarEndereco (UC-016.01) ao contrato externo.
   * @param {{mesReferencia: string, parceiraId: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  confirmarEndereco(dados) {
    try {
      const resultado = this.envioService.confirmarEndereco(dados);
      const projecao = this.projetar(resultado.envio);
      projecao.mensagem = resultado.mensagem;
      return envelopeOk(projecao);
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando RegistrarRastreio (UC-016.02) ao contrato externo.
   * @param {{mesReferencia: string, parceiraId: string, codigo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  registrarRastreio(dados) {
    try {
      return envelopeOk(this.projetar(this.envioService.registrarRastreio(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando AtualizarStatus (UC-016.03) ao contrato externo.
   * @param {{mesReferencia: string, parceiraId: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  atualizarStatus(dados) {
    try {
      return envelopeOk(this.projetar(this.envioService.atualizarStatus(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta a query de Envios por competência/Parceira.
   * @param {{mesReferencia: string, parceiraId: (string|undefined)}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  listarEnvios(dados) {
    try {
      const envios = this.envioService.listarEnvios(
        dados && dados.mesReferencia,
        dados && dados.parceiraId === undefined ? undefined : dados.parceiraId
      );
      return envelopeOk(envios.map((envio) => this.projetar(envio)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Projeção serializável do agregado (datas 'AAAA-MM-DD', sem PII).
   * @param {Envio} envio
   * @returns {object}
   */
  projetar(envio) {
    return {
      parceiraId: envio.parceiraId,
      mesReferencia: envio.mesReferencia.toString(),
      revisao: envio.revisao,
      jornada: envio.jornada,
      rastreio: envio.rastreio === null ? null : envio.rastreio.toString(),
      dataEnvio: this.dataParaTexto(envio.dataEnvio),
      dataArquivamento: this.dataParaTexto(envio.dataArquivamento),
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
