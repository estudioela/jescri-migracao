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
