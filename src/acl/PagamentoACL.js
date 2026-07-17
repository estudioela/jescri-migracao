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
