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
    if (cru == null || cru === '') {
      return null;
    }
    const data =
      typeof cru.getTime === 'function' ? new Date(cru.getTime()) : new Date(cru);
    if (isNaN(data.getTime())) {
      throw new Error(
        "Valor de data inválido em 'ENTREGAS'." + colunaNome + ": '" + cru + "'."
      );
    }
    return data;
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
    return (nome) => {
      const indice = cabecalho.indexOf(nome);
      if (indice === -1) {
        throw new Error("Coluna '" + nome + "' ausente em 'ENTREGAS'.");
      }
      return indice;
    };
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
    const matriz = [cabecalho].concat(linhas);
    this.sheet.clearContents();
    this.sheet.getRange(1, 1, matriz.length, cabecalho.length).setValues(matriz);
  }
};
