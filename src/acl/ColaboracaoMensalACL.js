/**
 * ACL: ColaboracaoMensalACL — camada anticorrupção da Colaboração Mensal
 * (SPEC-005; ADR-005: aba física COLABORACOES).
 *
 * Uma ACL por aba (Contrato §7): único ponto que conhece as colunas físicas
 * da aba COLABORACOES. Resolução SEMPRE por cabeçalho, nunca por índice
 * fixo. Coerção cru↔canônico com fail-fast (ADR-001 §2/§2.1).
 *
 * Projeções físicas (ADR-005):
 * - INFLU_KEY               ← parceiraId
 * - MES_REFERENCIA (1..12)  ← mesReferencia.mes   (Contrato §7.2)
 * - ANO_REFERENCIA          ← mesReferencia.ano   (Contrato §7.2)
 * - ESTADO                  ← estado canônico como ATIVA|CONCLUIDA|ARQUIVADA
 * - SNAPSHOT_VALOR          ← snapshot.valorMensal
 * - SNAPSHOT_FORMATOS       ← lista separada por vírgula (legível na planilha)
 * - SNAPSHOT_QTD_POR_FORMATO← JSON formato→quantidade (estrutura sem perda)
 *
 * A projeção é fechada: nenhuma coluna PII existe nesta aba e colunas
 * desconhecidas ficam em branco (RN-10, Contrato §5).
 *
 * A reidratação atravessa a máquina de estados do domínio (concluir/
 * arquivar) — nunca escreve estado por fora, preservando invariantes.
 *
 * Não pode conter regra de negócio nem ser duplicada.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues() e getRange(...).setValues(...)).
 */

this.ColaboracaoMensalACL = class ColaboracaoMensalACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Coage o estado canônico → cru persistido na aba (ADR-001 §2.1).
   * @param {'Ativa'|'Concluída'|'Arquivada'} canonico
   * @returns {'ATIVA'|'CONCLUIDA'|'ARQUIVADA'}
   */
  estadoParaCru(canonico) {
    if (canonico === 'Ativa') return 'ATIVA';
    if (canonico === 'Concluída') return 'CONCLUIDA';
    if (canonico === 'Arquivada') return 'ARQUIVADA';
    throw new Error(
      "Estado de Colaboração Mensal desconhecido: '" + canonico + "'."
    );
  }

  /**
   * Coage o ESTADO físico cru → canônico do domínio.
   * Normalização (ADR-001 §2): trim + casefold. Desconhecido → erro.
   * @param {string} cru valor lido da coluna ESTADO.
   * @returns {'Ativa'|'Concluída'|'Arquivada'}
   */
  estadoParaCanonico(cru) {
    const normalizado = String(cru == null ? '' : cru).trim().toLowerCase();
    if (normalizado === 'ativa') return 'Ativa';
    if (normalizado === 'concluida') return 'Concluída';
    if (normalizado === 'arquivada') return 'Arquivada';
    throw new Error(
      "ESTADO desconhecido em 'COLABORACOES'.ESTADO: '" + cru + "'."
    );
  }

  /**
   * Insere todas as Colaborações da competência num ÚNICO setValues,
   * posicionando cada campo pela sua coluna no cabeçalho (RN-03: lote
   * atômico; nunca linha a linha).
   * @param {ColaboracaoMensal[]} colaboracoes
   */
  inserirEmLote(colaboracoes) {
    if (!colaboracoes || colaboracoes.length === 0) {
      return;
    }
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const linhas = colaboracoes.map((colaboracao) => {
      const fisico = {
        INFLU_KEY: colaboracao.parceiraId,
        MES_REFERENCIA: colaboracao.mesReferencia.mes,
        ANO_REFERENCIA: colaboracao.mesReferencia.ano,
        ESTADO: this.estadoParaCru(colaboracao.estado),
        SNAPSHOT_VALOR: colaboracao.snapshot.valorMensal,
        SNAPSHOT_FORMATOS: colaboracao.snapshot.formatosContratados.join(', '),
        SNAPSHOT_QTD_POR_FORMATO: JSON.stringify(
          colaboracao.snapshot.quantidadePorFormato
        ),
      };
      return cabecalho.map((coluna) =>
        Object.prototype.hasOwnProperty.call(fisico, coluna) ? fisico[coluna] : ''
      );
    });
    this.sheet
      .getRange(valores.length + 1, 1, linhas.length, cabecalho.length)
      .setValues(linhas);
  }

  /**
   * Lê a aba inteira e reconstrói os agregados. Linhas sem INFLU_KEY não
   * são registros e são ignoradas.
   * @returns {ColaboracaoMensal[]}
   */
  listarTodas() {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = (nome) => {
      const indice = cabecalho.indexOf(nome);
      if (indice === -1) {
        throw new Error("Coluna '" + nome + "' ausente em 'COLABORACOES'.");
      }
      return indice;
    };
    return valores
      .slice(1)
      .filter((linha) => String(linha[coluna('INFLU_KEY')]).trim() !== '')
      .map((linha) => this.reidratar(linha, coluna));
  }

  /**
   * Reconstrói um agregado a partir da linha física, atravessando a
   * máquina de estados do domínio para estados avançados.
   * @param {Array} linha
   * @param {function(string): number} coluna resolve nome → índice.
   * @returns {ColaboracaoMensal}
   */
  reidratar(linha, coluna) {
    const mesReferencia = new MesReferencia(
      Number(linha[coluna('ANO_REFERENCIA')]),
      Number(linha[coluna('MES_REFERENCIA')])
    );
    const snapshot = new CondicaoComercialSnapshot({
      valorMensal: Number(linha[coluna('SNAPSHOT_VALOR')]),
      formatosContratados: String(linha[coluna('SNAPSHOT_FORMATOS')])
        .split(',')
        .map((formato) => formato.trim())
        .filter((formato) => formato !== ''),
      quantidadePorFormato: JSON.parse(linha[coluna('SNAPSHOT_QTD_POR_FORMATO')]),
    });
    const colaboracao = new ColaboracaoMensal(
      String(linha[coluna('INFLU_KEY')]),
      mesReferencia,
      snapshot
    );
    const estado = this.estadoParaCanonico(linha[coluna('ESTADO')]);
    if (estado === 'Concluída' || estado === 'Arquivada') {
      colaboracao.concluir();
    }
    if (estado === 'Arquivada') {
      colaboracao.arquivar();
    }
    return colaboracao;
  }
};
