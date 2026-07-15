/**
 * ACL: ParceiraACL — camada anticorrupção da Parceira.
 *
 * ACL única do sistema (invariante Freeze §4): único ponto que conhece a
 * coluna física da planilha e faz a coerção cru↔canônico com fail-fast
 * (ADR-001 §2/§2.1: valor desconhecido = erro barulhento identificando a
 * coluna e o valor).
 *
 * Acessa a planilha SEMPRE por cabeçalho, nunca por índice fixo.
 * PII nunca é registrada em log/evento.
 *
 * Não pode conter regra de negócio nem ser duplicada.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues() e appendRow(array)).
 */

this.ParceiraACL = class ParceiraACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Coage o STATUS físico cru → canônico do domínio.
   * Normalização (ADR-001 §2): trim + casefold. Desconhecido → erro.
   * @param {string} cru valor lido da coluna STATUS.
   * @returns {'Ativa'|'Inativa'}
   */
  statusParaCanonico(cru) {
    const normalizado = String(cru == null ? '' : cru).trim().toLowerCase();
    if (normalizado === 'on') return 'Ativa';
    if (normalizado === 'off') return 'Inativa';
    throw new Error(
      "STATUS desconhecido em 'BASE DE DADOS'.STATUS: '" + cru + "'."
    );
  }

  /**
   * Coage o estado canônico → cru persistido na planilha (ADR-001 §2.1).
   * @param {'Ativa'|'Inativa'} canonico
   * @returns {'ON'|'OFF'}
   */
  statusParaCru(canonico) {
    if (canonico === 'Ativa') return 'ON';
    if (canonico === 'Inativa') return 'OFF';
    throw new Error("Estado de vínculo desconhecido: '" + canonico + "'.");
  }

  /**
   * Insere uma Parceira como nova linha, posicionando cada campo pela sua
   * coluna no cabeçalho (nunca por índice fixo).
   * Projeção do cadastro: INFLU_KEY (identidade) e STATUS (vínculo).
   * @param {{nome: string, estado: string}} parceira
   */
  inserir(parceira) {
    const cabecalho = this.sheet.getDataRange().getValues()[0];
    const fisico = {
      INFLU_KEY: parceira.nome,
      STATUS: this.statusParaCru(parceira.estado),
    };
    const linha = cabecalho.map((coluna) =>
      Object.prototype.hasOwnProperty.call(fisico, coluna) ? fisico[coluna] : ''
    );
    this.sheet.appendRow(linha);
  }

  /**
   * Porta do Cadastro para a compilação (SPEC-005 §14.1): Parceiras ativas
   * com a projeção curada das Condições Comerciais (Contrato §7.3).
   * PII (CHAVE_PIX, CNPJ, ENDERECO) NUNCA entra na projeção (RN-10).
   * @returns {{parceiraId: string, condicoes: {
   *   valorMensal: number,
   *   formatosContratados: string[],
   *   quantidadePorFormato: Object<string, number>}}[]}
   */
  listarAtivasComCondicoes() {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = (nome) => {
      const indice = cabecalho.indexOf(nome);
      if (indice === -1) {
        throw new Error("Coluna '" + nome + "' ausente em 'BASE DE DADOS'.");
      }
      return indice;
    };
    return valores
      .slice(1)
      .filter((linha) => String(linha[coluna('INFLU_KEY')]).trim() !== '')
      .filter(
        (linha) => this.statusParaCanonico(linha[coluna('STATUS')]) === 'Ativa'
      )
      .map((linha) => ({
        parceiraId: String(linha[coluna('INFLU_KEY')]).trim(),
        condicoes: this.condicoesDaLinha(linha, coluna),
      }));
  }

  /**
   * Coage a linha física → condições comerciais canônicas.
   * Formatos canônicos fechados: Reels, Carrossel, Stories, Looks
   * (Contrato §7.3: entregáveis da BASE DE DADOS).
   * @param {Array} linha linha crua da aba.
   * @param {function(string): number} coluna resolve nome → índice.
   * @returns {{valorMensal: number, formatosContratados: string[],
   *   quantidadePorFormato: Object<string, number>}}
   */
  condicoesDaLinha(linha, coluna) {
    const entregaveis = {
      Reels: 'REELS_TEXTO',
      Carrossel: 'CARROSSEL_TEXTO',
      Stories: 'STORIES_TEXTO',
      Looks: 'LOOKS_QTD',
    };
    const quantidadePorFormato = {};
    Object.keys(entregaveis).forEach((formato) => {
      const quantidade = this.quantidadeContratada(
        linha[coluna(entregaveis[formato])],
        entregaveis[formato]
      );
      if (quantidade > 0) {
        quantidadePorFormato[formato] = quantidade;
      }
    });
    return {
      valorMensal: this.valorMensalDe(linha[coluna('VALOR_TOTAL')]),
      formatosContratados: Object.keys(quantidadePorFormato),
      quantidadePorFormato: quantidadePorFormato,
    };
  }

  /**
   * Coage VALOR_TOTAL cru → número. Desconhecido → erro barulhento.
   * @param {*} cru
   * @returns {number}
   */
  valorMensalDe(cru) {
    const texto = String(cru == null ? '' : cru).trim();
    const valor = Number(texto);
    if (texto === '' || isNaN(valor)) {
      throw new Error(
        "VALOR_TOTAL inválido em 'BASE DE DADOS'.VALOR_TOTAL: '" + cru + "'."
      );
    }
    return valor;
  }

  /**
   * Coage o texto de um entregável → quantidade contratada.
   * Vazio → 0 (não contratado); prefixo numérico ('2 reels') → 2;
   * texto sem número à frente → erro barulhento (ADR-001 §2).
   * @param {*} cru valor lido da coluna do entregável.
   * @param {string} colunaFisica nome da coluna, para o erro.
   * @returns {number}
   */
  quantidadeContratada(cru, colunaFisica) {
    const texto = String(cru == null ? '' : cru).trim();
    if (texto === '') {
      return 0;
    }
    const prefixo = texto.match(/^(\d+)/);
    if (!prefixo) {
      throw new Error(
        colunaFisica + " inválido em 'BASE DE DADOS'." + colunaFisica + ": '" + cru + "'."
      );
    }
    return parseInt(prefixo[1], 10);
  }
};
