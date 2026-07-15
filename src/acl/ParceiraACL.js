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
};
