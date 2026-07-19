/**
 * MÓDULO: Entrega — entrega de material e aprovação (SPEC-012)
 *
 * Fatia vertical (ADR-014): camadas como seções, na ordem
 * DOMAIN → ACL → REPOSITORY → SERVICE → CONTROLLER → ADAPTERS.
 * Os contratos de camada valem integralmente (docs/ARQUITETURA_CAMADAS.md).
 */

// ============================================================================
// DOMAIN — Entrega.js (ex-src/domain/Entrega.js)
// ============================================================================

/**
 * AGREGADO RAIZ: Entrega (SPEC-012 §6.2)
 *
 * Unidade de conteúdo contratada num formato, de uma Colaboração Mensal
 * (era "Ativação"). Rastreada do estado inicial até a publicação, com
 * arquivamento automático ao publicar.
 *
 * Invariantes preservadas:
 * - INV-01: toda Entrega referencia uma Colaboração Mensal compilada — a
 *   materialização deriva exclusivamente do Snapshot Comercial (RN-01);
 *   Parceira sem formato contratado → nenhuma Entrega.
 * - INV-02/RNF-01: identificador único e permanente (IdentificadorDeEntrega).
 * - INV-03/RN-02 (§9): máquina de estados fechada com 4 estados canônicos
 *   AguardandoMaterial → EmRevisao → Aprovado → Publicado; transição
 *   inválida falha barulhento (CT-03).
 * - RN-03: concluir o upload leva a EmRevisao; CB-01: upload repetido
 *   substitui o material mantendo identidade e estado.
 * - RN-04: publicar arquiva automaticamente com data de arquivamento
 *   (fornecida pelo chamador — cálculo determinístico e testável, RNF-03).
 * - CB-03: Publicado é terminal — republicar é recusado.
 * - INV-04: Entrega arquivada é somente leitura.
 * - A data de aprovação interna é ESPELHADA do Briefing (SPEC-009 RN-04 /
 *   §14.1) — nunca calculada aqui.
 *
 * Os rótulos de formato são idênticos aos blocos do Briefing (mesma
 * derivação de SPEC-009: um por unidade contratada, com índice quando a
 * quantidade é maior que 1 — ex.: Stories×2 → 'Stories 1', 'Stories 2'),
 * garantindo o espelhamento bloco ↔ Entrega.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna
 * física. Não conhece Briefing (SPEC-009), Envio físico (SPEC-016) nem
 * Pagamento (SPEC-020).
 */

this.Entrega = class Entrega {
  /**
   * @param {string} parceiraId identidade estável da Parceira.
   * @param {MesReferencia} mesReferencia competência da colaboração (VO).
   * @param {string} rotulo rótulo do formato (ex.: 'Stories 1').
   */
  constructor(parceiraId, mesReferencia, rotulo) {
    // O VO valida a composição completa fail-fast (RNF-01).
    this.id = new IdentificadorDeEntrega(parceiraId, mesReferencia, rotulo);
    this.parceiraId = String(parceiraId);
    this.mesReferencia = mesReferencia;
    this.rotulo = String(rotulo);
    // §9: nasce AguardandoMaterial; demais estados só via transições.
    this.estado = 'AguardandoMaterial';
    this.material = null;
    this.dataAprovacaoInterna = null;
    this.dataArquivamento = null;
  }

  /**
   * Materialização (RN-01): uma Entrega por unidade contratada de cada
   * formato do Snapshot Comercial da Colaboração compilada (INV-01).
   * @param {string} parceiraId
   * @param {MesReferencia} mesReferencia
   * @param {CondicaoComercialSnapshot} snapshot fotografia comercial da
   *   Colaboração Mensal compilada (SPEC-005).
   * @returns {Entrega[]} uma Entrega por unidade contratada.
   */
  static materializar(parceiraId, mesReferencia, snapshot) {
    if (!(snapshot instanceof CondicaoComercialSnapshot)) {
      throw new Error(
        'Entrega exige o Snapshot Comercial da Colaboração compilada para materializar (INV-01).'
      );
    }
    const entregas = [];
    snapshot.formatosContratados.forEach((formato) => {
      const quantidade = snapshot.quantidadePorFormato[formato] || 1;
      for (let indice = 1; indice <= quantidade; indice++) {
        const rotulo = quantidade > 1 ? formato + ' ' + indice : formato;
        entregas.push(new Entrega(parceiraId, mesReferencia, rotulo));
      }
    });
    return entregas;
  }

  /**
   * Igualdade de entidade pelo identificador permanente (RNF-01).
   * @param {Entrega} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return outro instanceof Entrega && this.id.igualA(outro.id);
  }

  /**
   * UC-012.02 · Enviar material: AguardandoMaterial → EmRevisao (RN-03).
   * Upload repetido substitui o material mantendo identidade e estado
   * (CB-01).
   * @param {string} url referência ao material enviado.
   * @returns {Entrega}
   * @throws {Error} CT-03 fora de AguardandoMaterial/EmRevisao; INV-04 se
   *   arquivada.
   */
  enviarMaterial(url) {
    if (this.estado === 'Publicado') {
      throw new Error('INV-04: Entrega arquivada é somente leitura.');
    }
    if (this.estado !== 'AguardandoMaterial' && this.estado !== 'EmRevisao') {
      throw new Error(
        "CT-03: transição inválida (§9) — enviar material exige 'AguardandoMaterial' ou 'EmRevisao', estado atual: '" +
          this.estado +
          "'."
      );
    }
    this.material = new LinkDoMaterial(url);
    this.estado = 'EmRevisao';
    return this;
  }

  /**
   * UC-012.03 · Aprovar: EmRevisao → Aprovado.
   * @returns {Entrega}
   * @throws {Error} CT-03 fora de EmRevisao.
   */
  aprovar() {
    if (this.estado !== 'EmRevisao') {
      throw new Error(
        "CT-03: transição inválida (§9) — aprovar exige 'EmRevisao', estado atual: '" +
          this.estado +
          "'."
      );
    }
    this.estado = 'Aprovado';
    return this;
  }

  /**
   * UC-012.03 · Publicar: Aprovado → Publicado (terminal), arquivando
   * automaticamente com a data de arquivamento (RN-04/RNF-03).
   * @param {Date} dataArquivamento data do arquivamento, fornecida pelo
   *   chamador (determinística e testável).
   * @returns {Entrega}
   * @throws {Error} CB-03 se já publicada; CT-03 fora de Aprovado; data de
   *   arquivamento inválida.
   */
  publicar(dataArquivamento) {
    if (this.estado === 'Publicado') {
      throw new Error(
        "CB-03: publicação recusada — 'Publicado' é terminal (§9), a Entrega '" +
          this.id.toString() +
          "' já foi arquivada."
      );
    }
    if (this.estado !== 'Aprovado') {
      throw new Error(
        "CT-03: transição inválida (§9) — publicar exige 'Aprovado', estado atual: '" +
          this.estado +
          "'."
      );
    }
    // Duck-typing (não instanceof): Date pode vir de outro realm (vm).
    if (
      dataArquivamento == null ||
      typeof dataArquivamento.getTime !== 'function' ||
      isNaN(dataArquivamento.getTime())
    ) {
      throw new Error(
        "RN-04: data de arquivamento inválida na publicação da Entrega '" +
          this.id.toString() +
          "'."
      );
    }
    this.estado = 'Publicado';
    this.dataArquivamento = dataArquivamento;
    Object.freeze(this);
    return this;
  }

  /**
   * Espelha a data de aprovação interna derivada no Briefing (SPEC-009
   * RN-04 / §14.1) — a Entrega nunca a calcula.
   * @param {Date} dataAprovacaoInterna
   * @returns {Entrega}
   * @throws {Error} INV-04 se arquivada; data inválida.
   */
  espelharDataAprovacao(dataAprovacaoInterna) {
    if (this.estado === 'Publicado') {
      throw new Error('INV-04: Entrega arquivada é somente leitura.');
    }
    if (
      dataAprovacaoInterna == null ||
      typeof dataAprovacaoInterna.getTime !== 'function' ||
      isNaN(dataAprovacaoInterna.getTime())
    ) {
      throw new Error(
        "Data de aprovação espelhada inválida na Entrega '" + this.id.toString() + "' (§14.1)."
      );
    }
    this.dataAprovacaoInterna = dataAprovacaoInterna;
    return this;
  }
};

// ============================================================================
// DOMAIN — LinkDoMaterial.js (ex-src/domain/LinkDoMaterial.js)
// ============================================================================

/**
 * VALUE OBJECT: LinkDoMaterial (SPEC-012 §6.1)
 *
 * Referência ao arquivo (imagem/vídeo) que a Parceira envia para uma
 * Entrega (Material Enviado, §4).
 *
 * DECISÃO LOCAL (D-02, aprovada pelo PO em 2026-07-15): nesta etapa o
 * material é persistido apenas como URL informada pela Parceira — upload
 * físico ao Drive é dívida registrada com ADR futuro (RNF-02: o domínio
 * independe do armazenamento).
 *
 * Invariantes preservadas:
 * - Imutável após criação; link vazio ou fora de http(s) falha barulhento.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, DriveApp.
 */

this.LinkDoMaterial = class LinkDoMaterial {
  /**
   * @param {string} url referência ao material enviado.
   */
  constructor(url) {
    const texto = String(url == null ? '' : url).trim();
    if (texto === '') {
      throw new Error('LinkDoMaterial exige a referência ao material enviado (UC-012.02).');
    }
    if (!/^https?:\/\/\S+$/i.test(texto)) {
      throw new Error(
        "LinkDoMaterial exige uma URL http(s) válida (recebido '" + url + "')."
      );
    }
    this.valor = texto;
    Object.freeze(this);
  }

  /**
   * Igualdade de VO pelo valor.
   * @param {LinkDoMaterial} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return outro instanceof LinkDoMaterial && this.valor === outro.valor;
  }

  /**
   * @returns {string} a URL do material.
   */
  toString() {
    return this.valor;
  }
};

// ============================================================================
// DOMAIN — IdentificadorDeEntrega.js (ex-src/domain/IdentificadorDeEntrega.js)
// ============================================================================

/**
 * VALUE OBJECT: IdentificadorDeEntrega (SPEC-012 §6.1)
 *
 * Identificador único e permanente de uma Entrega (RNF-01/INV-02),
 * determinístico pela composição `parceiraId × competência × rótulo do
 * formato` (decisão aprovada pelo PO em 2026-07-15) — estável entre
 * leituras, sem sorteio de UUID.
 *
 * Invariantes preservadas:
 * - INV-02: único dentro da competência (um rótulo por unidade contratada)
 *   e permanente (a composição nunca muda após a materialização).
 * - Imutável após criação; composição incompleta falha barulhento.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.IdentificadorDeEntrega = class IdentificadorDeEntrega {
  /**
   * @param {string} parceiraId identidade estável da Parceira.
   * @param {MesReferencia} mesReferencia competência da colaboração (VO).
   * @param {string} rotulo rótulo do formato (ex.: 'Stories 1').
   */
  constructor(parceiraId, mesReferencia, rotulo) {
    const parceiraIdTexto = String(parceiraId == null ? '' : parceiraId).trim();
    if (parceiraIdTexto === '') {
      throw new Error('IdentificadorDeEntrega exige a identidade da Parceira (RNF-01).');
    }
    if (!(mesReferencia instanceof MesReferencia)) {
      throw new Error(
        'IdentificadorDeEntrega exige o Value Object MesReferencia como competência (RNF-01).'
      );
    }
    const rotuloTexto = String(rotulo == null ? '' : rotulo).trim();
    if (rotuloTexto === '') {
      throw new Error('IdentificadorDeEntrega exige o rótulo do formato (RNF-01).');
    }
    this.valor =
      String(parceiraId) + '|' + mesReferencia.toString() + '|' + String(rotulo);
    Object.freeze(this);
  }

  /**
   * Igualdade de VO pelo valor composto.
   * @param {IdentificadorDeEntrega} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return outro instanceof IdentificadorDeEntrega && this.valor === outro.valor;
  }

  /**
   * @returns {string} o valor canônico do identificador.
   */
  toString() {
    return this.valor;
  }
};

// ============================================================================
// ACL — EntregaACL.js (ex-src/acl/EntregaACL.js)
// ============================================================================

/**
 * ACL: EntregaACL — camada anticorrupção da Entrega (SPEC-012; aba física
 * ENTREGAS).
 *
 * DECISÕES LOCAIS (aprovadas pelo PO em 2026-07-15):
 * - Aba ENTREGAS é nova, própria da V2, com carimbo de competência
 *   (MES_REFERENCIA + ANO_REFERENCIA, Contrato §7.2) — legado nunca é
 *   normativo ("ATIVAÇÕES" é termo do legado).
 * - Q-03: rótulos crus persistidos são AGUARDANDO_MATERIAL | EM_REVISAO |
 *   APROVADO | PUBLICADO.
 *
 * Uma ACL por aba (Contrato §7): único ponto que conhece as colunas físicas
 * da aba ENTREGAS. Resolução SEMPRE por cabeçalho, nunca por índice fixo.
 *
 * Projeção física — uma linha por Entrega:
 * - INFLU_KEY / ANO_REFERENCIA / MES_REFERENCIA / ROTULO ← identidade
 *   (a composição do IdentificadorDeEntrega, RNF-01)
 * - ESTADO                 ← rótulo cru canônico (Q-03)
 * - LINK_MATERIAL          ← URL do Material Enviado (D-02)
 * - DATA_APROVACAO_INTERNA ← espelho persistido (a origem é o Briefing)
 * - DATA_ARQUIVAMENTO      ← preservada (RNF-03)
 * Nenhuma coluna PII existe nesta aba (Contrato §5).
 *
 * Escrita: substituição/upsert reescrevem a aba inteira num ÚNICO setValues
 * (RN-01 — a competência é recriada no mesmo lote).
 *
 * A reidratação atravessa o domínio (enviarMaterial/aprovar/publicar/
 * espelharDataAprovacao) — nunca escreve estado por fora; ESTADO cru
 * desconhecido (RN-05/CB-02) ou incoerente com as demais colunas falha
 * barulhento (CT-02).
 *
 * Não pode conter regra de negócio nem ser duplicada.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues(), clearContents() e
 *   getRange(...).setValues(...)).
 */

this.EntregaACL = class EntregaACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Coage o estado canônico → cru persistido na aba (Q-03; ADR-001 §2.2).
   * @param {string} canonico estado canônico do domínio (§9).
   * @returns {string} rótulo cru.
   */
  estadoParaCru(canonico) {
    const mapa = {
      AguardandoMaterial: 'AGUARDANDO_MATERIAL',
      EmRevisao: 'EM_REVISAO',
      Aprovado: 'APROVADO',
      Publicado: 'PUBLICADO',
    };
    if (!mapa[canonico]) {
      throw new Error("Estado de Entrega desconhecido: '" + canonico + "'.");
    }
    return mapa[canonico];
  }

  /**
   * Coage o ESTADO físico cru → canônico do domínio (trim + casefold).
   * Valor desconhecido → erro de validação (RN-05/CB-02, CT-02).
   * @param {string} cru
   * @returns {string} estado canônico (§9).
   */
  estadoParaCanonico(cru) {
    const normalizado = String(cru == null ? '' : cru).trim().toLowerCase();
    const mapa = {
      aguardando_material: 'AguardandoMaterial',
      em_revisao: 'EmRevisao',
      aprovado: 'Aprovado',
      publicado: 'Publicado',
    };
    if (!mapa[normalizado]) {
      throw new Error("CT-02: ESTADO desconhecido em 'ENTREGAS'.ESTADO: '" + cru + "'.");
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
    return celulaParaData(cru, colunaNome, 'ENTREGAS');
  }

  /**
   * Substitui TODAS as Entregas da competência num único lote (RN-01):
   * linhas de outras competências são preservadas.
   * @param {MesReferencia} mesReferencia
   * @param {Entrega[]} entregas
   */
  substituirCompetencia(mesReferencia, entregas) {
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
    this.reescrever(cabecalho, mantidas.concat(this.linhasDe(cabecalho, entregas)));
  }

  /**
   * Upsert de uma Entrega pela identidade permanente (parceira ×
   * competência × rótulo — RNF-01).
   * @param {Entrega} entrega
   */
  salvar(entrega) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const mantidas = valores.slice(1).filter((linha) => {
      if (String(linha[coluna('INFLU_KEY')]).trim() === '') {
        return false;
      }
      return !(
        String(linha[coluna('INFLU_KEY')]) === entrega.parceiraId &&
        Number(linha[coluna('ANO_REFERENCIA')]) === entrega.mesReferencia.ano &&
        Number(linha[coluna('MES_REFERENCIA')]) === entrega.mesReferencia.mes &&
        String(linha[coluna('ROTULO')]) === entrega.rotulo
      );
    });
    this.reescrever(cabecalho, mantidas.concat(this.linhasDe(cabecalho, [entrega])));
  }

  /**
   * Lê a aba inteira e reconstrói os agregados (uma linha por Entrega).
   * Linhas sem INFLU_KEY são ignoradas.
   * @returns {Entrega[]}
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
   * Reconstrói uma Entrega a partir da linha física, atravessando o
   * domínio: material via enviarMaterial(), APROVADO via aprovar(),
   * PUBLICADO via publicar() (INV-03/INV-04 preservadas). Estado persistido
   * que o domínio não alcança com as colunas presentes falha barulhento.
   * @param {Array} linha linha física da Entrega.
   * @param {function(string): number} coluna resolve nome → índice.
   * @returns {Entrega}
   */
  reidratar(linha, coluna) {
    const entrega = new Entrega(
      String(linha[coluna('INFLU_KEY')]),
      new MesReferencia(
        Number(linha[coluna('ANO_REFERENCIA')]),
        Number(linha[coluna('MES_REFERENCIA')])
      ),
      String(linha[coluna('ROTULO')])
    );
    const dataAprovacao = this.dataParaCanonica(
      linha[coluna('DATA_APROVACAO_INTERNA')],
      'DATA_APROVACAO_INTERNA'
    );
    if (dataAprovacao !== null) {
      entrega.espelharDataAprovacao(dataAprovacao);
    }

    const canonico = this.estadoParaCanonico(linha[coluna('ESTADO')]);
    const link = String(
      linha[coluna('LINK_MATERIAL')] == null ? '' : linha[coluna('LINK_MATERIAL')]
    );
    if (link.trim() !== '') {
      entrega.enviarMaterial(link);
    }
    if (canonico === 'Aprovado' || canonico === 'Publicado') {
      entrega.aprovar();
    }
    if (canonico === 'Publicado') {
      entrega.publicar(
        this.dataParaCanonica(linha[coluna('DATA_ARQUIVAMENTO')], 'DATA_ARQUIVAMENTO')
      );
    }
    if (entrega.estado !== canonico) {
      throw new Error(
        "CT-02: linha incoerente em 'ENTREGAS' — ESTADO '" +
          canonico +
          "' não é alcançável com as colunas persistidas da Entrega '" +
          entrega.id.toString() +
          "'."
      );
    }
    return entrega;
  }

  /**
   * @param {Array} cabecalho
   * @returns {function(string): number} resolve nome → índice, fail-fast.
   */
  resolvedorDeColuna(cabecalho) {
    return criarResolvedorDeColuna(cabecalho, 'ENTREGAS');
  }

  /**
   * Projeta Entregas em linhas físicas (uma por Entrega), posicionando cada
   * campo pela sua coluna.
   * @param {Array} cabecalho
   * @param {Entrega[]} entregas
   * @returns {Array[]}
   */
  linhasDe(cabecalho, entregas) {
    return entregas.map((entrega) => {
      const fisico = {
        INFLU_KEY: entrega.parceiraId,
        MES_REFERENCIA: entrega.mesReferencia.mes,
        ANO_REFERENCIA: entrega.mesReferencia.ano,
        ROTULO: entrega.rotulo,
        ESTADO: this.estadoParaCru(entrega.estado),
        LINK_MATERIAL: entrega.material ? entrega.material.toString() : '',
        DATA_APROVACAO_INTERNA: entrega.dataAprovacaoInterna
          ? entrega.dataAprovacaoInterna
          : '',
        DATA_ARQUIVAMENTO: entrega.dataArquivamento ? entrega.dataArquivamento : '',
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
// REPOSITORY — EntregaRepository.js (ex-src/repository/EntregaRepository.js)
// ============================================================================

/**
 * REPOSITORY: EntregaRepository — persistência da Entrega (SPEC-012).
 *
 * Único ponto (junto da ACL) que trata persistência do agregado. Fala
 * exclusivamente com a porta da ACL — nunca toca SpreadsheetApp nem conhece
 * coluna física (RNF-02).
 *
 * - RN-01: a materialização por compilação substitui TODAS as Entregas da
 *   competência num único lote atômico da ACL (tudo ou nada; falha física
 *   propaga sem efeito parcial).
 * - salvar persiste transições de uma Entrega existente (upsert pela
 *   identidade permanente na ACL — RNF-01).
 * - obterPor/listarPor atendem UC-012.01/02/03 e as queries de SPEC-027.
 *
 * Não pode conter regra de negócio nem formatar envelope.
 *
 * @param {object} acl ACL da Entrega (porta: substituirCompetencia,
 *   salvar, listarTodos).
 */

this.EntregaRepository = class EntregaRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Recria as Entregas de uma competência num único lote atômico (RN-01).
   * @param {MesReferencia} mesReferencia
   * @param {Entrega[]} entregas recém-materializadas da compilação.
   * @returns {Entrega[]} as mesmas Entregas persistidas.
   */
  recriarCompetencia(mesReferencia, entregas) {
    this.acl.substituirCompetencia(mesReferencia, entregas);
    return entregas;
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
   * Persiste o estado atual de uma Entrega (transições da máquina §9).
   * @param {Entrega} entrega
   * @returns {Entrega} a mesma Entrega persistida.
   */
  salvar(entrega) {
    this.acl.salvar(entrega);
    return entrega;
  }

  /**
   * Busca uma Entrega pela identidade permanente (parceira × competência ×
   * rótulo — RNF-01).
   * @param {MesReferencia} mesReferencia
   * @param {string} parceiraId
   * @param {string} rotulo
   * @returns {Entrega|null}
   */
  obterPor(mesReferencia, parceiraId, rotulo) {
    return (
      this.acl
        .listarTodos()
        .find(
          (entrega) =>
            entrega.mesReferencia.igualA(mesReferencia) &&
            entrega.parceiraId === parceiraId &&
            entrega.rotulo === rotulo
        ) || null
    );
  }

  /**
   * Lista as Entregas de uma competência, opcionalmente por Parceira
   * (UC-012.01; query de SPEC-027).
   * @param {MesReferencia} mesReferencia
   * @param {string} [parceiraId]
   * @returns {Entrega[]}
   */
  listarPor(mesReferencia, parceiraId) {
    return this.acl
      .listarTodos()
      .filter((entrega) => entrega.mesReferencia.igualA(mesReferencia))
      .filter(
        (entrega) => parceiraId === undefined || entrega.parceiraId === parceiraId
      );
  }

  /**
   * Lista as Entregas de uma Parceira em TODAS as competências (query de
   * SPEC-030, RN-04: períodos selecionáveis = competências com atividade).
   * @param {string} parceiraId
   * @returns {Entrega[]}
   */
  listarPorParceira(parceiraId) {
    return this.acl.listarTodos().filter((entrega) => entrega.parceiraId === parceiraId);
  }
};

// ============================================================================
// SERVICE — EntregaService.js (ex-src/service/EntregaService.js)
// ============================================================================

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
   * Idempotente por competência (achado F1/F2 da auditoria SPEC-012): se já
   * existe alguma Entrega desta competência, é no-op — nunca sobrescreve
   * (protege uploads/aprovações/arquivamentos já feitos e permite
   * reconciliar com segurança uma compilação anterior que falhou
   * parcialmente).
   * @param {string} mesReferenciaTexto competência 'AAAA-MM'.
   * @returns {Entrega[]} Entregas materializadas (vazio se já existia).
   */
  materializarParaCompetencia(mesReferenciaTexto) {
    const mesReferencia = MesReferencia.deTexto(String(mesReferenciaTexto));
    if (this.entregaRepository.existeParaCompetencia(mesReferencia)) {
      return [];
    }
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
   * interna de cada bloco preenchido na Entrega de mesmo rótulo. Entregas
   * já `Publicado` (arquivadas, INV-04) são puladas em vez de abortar o
   * lote inteiro (achado F3 da auditoria SPEC-012,
   * `docs/_workspace/auditorias/AUDITORIA_SPEC012.md`): nada impede
   * publicar uma Entrega antes de o Briefing publicar, e sem este pulo o
   * espelhamento lançava no meio do lote sem possibilidade de retry (o
   * Briefing já teria sido persistido como `Publicado`).
   * @param {string} mesReferenciaTexto competência 'AAAA-MM'.
   * @param {string} parceiraId
   * @returns {Entrega[]} Entregas espelhadas e persistidas (exclui as já
   *   arquivadas).
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
      .map((bloco) => ({
        bloco: bloco,
        entrega: this.obterOuFalhar(mesReferencia, parceiraId, bloco.rotulo),
      }))
      .filter((par) => par.entrega.estado !== 'Publicado')
      .map((par) => {
        par.entrega.espelharDataAprovacao(par.bloco.dataAprovacaoInterna);
        return this.entregaRepository.salvar(par.entrega);
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
   * Lista as Entregas de uma Parceira em TODAS as competências (query de
   * SPEC-030, RN-04).
   * @param {string} parceiraId
   * @returns {Entrega[]}
   */
  listarPorParceira(parceiraId) {
    return this.entregaRepository.listarPorParceira(parceiraId);
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

// ============================================================================
// CONTROLLER — EntregaController.js (ex-src/controller/EntregaController.js)
// ============================================================================

/**
 * CONTROLLER: EntregaController — adapta o contrato externo da Entrega
 * (SPEC-012 UC-012.01/02/03).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * EntregaService e devolve SEMPRE o envelope padrão {success,data}/
 * {success,error} (PROJECT_GOVERNANCE §3.3, via envelopeOk/envelopeFail).
 *
 * Expõe apenas uma projeção serializável da Entrega — nunca a instância de
 * domínio; datas saem como 'AAAA-MM-DD'. A projeção não carrega PII.
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {EntregaService} entregaService
 */

this.EntregaController = class EntregaController {
  constructor(entregaService) {
    this.entregaService = entregaService;
  }

  /**
   * Adapta o comando EnviarMaterial (UC-012.02) ao contrato externo.
   * @param {{mesReferencia: string, parceiraId: string, rotulo: string,
   *          link: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  enviarMaterial(dados) {
    try {
      return envelopeOk(this.projetar(this.entregaService.enviarMaterial(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando Aprovar (UC-012.03) ao contrato externo.
   * @param {{mesReferencia: string, parceiraId: string, rotulo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  aprovarEntrega(dados) {
    try {
      return envelopeOk(this.projetar(this.entregaService.aprovar(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta o comando Publicar (UC-012.03) ao contrato externo.
   * @param {{mesReferencia: string, parceiraId: string, rotulo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  publicarEntrega(dados) {
    try {
      return envelopeOk(this.projetar(this.entregaService.publicar(dados)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Adapta a query de Entregas por competência/Parceira (UC-012.01).
   * @param {{mesReferencia: string, parceiraId: (string|undefined)}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  listarEntregas(dados) {
    try {
      const entregas = this.entregaService.listarEntregas(
        dados && dados.mesReferencia,
        dados && dados.parceiraId === undefined ? undefined : dados.parceiraId
      );
      return envelopeOk(entregas.map((entrega) => this.projetar(entrega)));
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }

  /**
   * Projeção serializável do agregado (datas 'AAAA-MM-DD', sem PII).
   * @param {Entrega} entrega
   * @returns {object}
   */
  projetar(entrega) {
    return {
      id: entrega.id.toString(),
      parceiraId: entrega.parceiraId,
      mesReferencia: entrega.mesReferencia.toString(),
      rotulo: entrega.rotulo,
      estado: entrega.estado,
      material: entrega.material === null ? null : entrega.material.toString(),
      dataAprovacaoInterna: this.dataParaTexto(entrega.dataAprovacaoInterna),
      dataArquivamento: this.dataParaTexto(entrega.dataArquivamento),
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
