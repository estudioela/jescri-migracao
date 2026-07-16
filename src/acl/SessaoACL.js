/**
 * ACL: SessaoACL — camada anticorrupção da aba física `SESSOES`.
 *
 * Único ponto que conhece as colunas físicas TOKEN | PARCEIRA_ID |
 * EXPIRA_EM. Acessa a planilha SEMPRE por cabeçalho, nunca por índice fixo.
 * Escrita: upsert reescreve a aba inteira num ÚNICO setValues (mesmo padrão
 * DocumentoACL). Datas persistidas em ISO-8601; leitura aceita Date ou
 * texto (coerção cru→canônico fail-fast).
 *
 * PII nunca em log (Contrato §5); o token é opaco e não é PII, mas é
 * segredo de acesso — nunca registrá-lo em log/evento (RN-04).
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues() e getRange(...).setValues(...)).
 */

this.SessaoACL = class SessaoACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Insere ou substitui a sessão do token (upsert por TOKEN).
   * @param {{token: string, parceiraId: string, expiraEm: Date}} sessao
   */
  upsert(sessao) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const nova = cabecalho.map(() => '');
    nova[coluna('TOKEN')] = sessao.token;
    nova[coluna('PARCEIRA_ID')] = sessao.parceiraId;
    nova[coluna('EXPIRA_EM')] = sessao.expiraEm.toISOString();
    const linhas = valores
      .slice(1)
      .filter((linha) => String(linha[coluna('TOKEN')]).trim() !== String(sessao.token).trim());
    linhas.push(nova);
    this.regravar(cabecalho, linhas);
  }

  /**
   * @param {string} token
   * @returns {{token: string, parceiraId: string, expiraEm: Date}|null}
   */
  obterPorToken(token) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const linha = valores
      .slice(1)
      .find((l) => String(l[coluna('TOKEN')]).trim() === String(token).trim());
    if (!linha) {
      return null;
    }
    return {
      token: String(linha[coluna('TOKEN')]).trim(),
      parceiraId: String(linha[coluna('PARCEIRA_ID')]).trim(),
      expiraEm: this.dataParaCanonico(linha[coluna('EXPIRA_EM')], 'EXPIRA_EM'),
    };
  }

  /**
   * Remove a sessão do token, se existir (logout/expiração).
   * @param {string} token
   */
  remover(token) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const linhas = valores
      .slice(1)
      .filter((linha) => String(linha[coluna('TOKEN')]).trim() !== String(token).trim());
    this.regravar(cabecalho, linhas);
  }

  /**
   * Coage o valor físico de data → Date canônico, fail-fast (ADR-001 §2).
   * @param {*} cru Date do Sheets ou texto ISO.
   * @param {string} colunaFisica nome da coluna, para o erro.
   * @returns {Date}
   */
  dataParaCanonico(cru, colunaFisica) {
    const data = cru && typeof cru.getTime === 'function' ? cru : new Date(String(cru));
    if (isNaN(data.getTime())) {
      throw new Error(
        colunaFisica + " inválida em 'SESSOES'." + colunaFisica + ": '" + cru + "'."
      );
    }
    return data;
  }

  /**
   * @param {Array} cabecalho
   * @returns {function(string): number} resolve nome → índice, fail-fast.
   */
  resolvedorDeColuna(cabecalho) {
    return criarResolvedorDeColuna(cabecalho, 'SESSOES');
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
