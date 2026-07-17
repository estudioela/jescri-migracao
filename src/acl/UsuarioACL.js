/**
 * ACL: UsuarioACL — camada anticorrupção da aba física `SIS_IDENTIDADES`
 * (SPEC-035 §10.2.1).
 *
 * Único ponto que conhece as colunas físicas SUB_PROVIDER | EMAIL_PERFIL |
 * PAPEL_ATOR | ESTADO_CONTA | DATA_CRIACAO | ULTIMO_ACESSO. Acessa a
 * planilha SEMPRE por cabeçalho (Contrato §7), nunca por índice fixo.
 * Escrita: upsert reescreve a aba inteira num único setValues, mesmo
 * padrão de SessaoACL (SPEC-025) — aba pequena e auxiliar, sem colunas
 * alheias a preservar.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API).
 */

this.UsuarioACL = class UsuarioACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Insere ou substitui o registro do Usuario (upsert por SUB_PROVIDER).
   * @param {{subProvider: string, email: string, papel: string,
   *   estado: string, dataCriacao: Date, ultimoAcesso: (Date|null)}} usuario
   */
  upsert(usuario) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const nova = cabecalho.map(() => '');
    nova[coluna('SUB_PROVIDER')] = usuario.subProvider;
    nova[coluna('EMAIL_PERFIL')] = usuario.email;
    nova[coluna('PAPEL_ATOR')] = usuario.papel;
    nova[coluna('ESTADO_CONTA')] = usuario.estado;
    nova[coluna('DATA_CRIACAO')] = usuario.dataCriacao.toISOString();
    nova[coluna('ULTIMO_ACESSO')] = usuario.ultimoAcesso ? usuario.ultimoAcesso.toISOString() : '';
    const linhas = valores
      .slice(1)
      .filter(
        (linha) =>
          String(linha[coluna('SUB_PROVIDER')]).trim() !== String(usuario.subProvider).trim()
      );
    linhas.push(nova);
    reescreverAba(this.sheet, cabecalho, linhas);
  }

  /**
   * @param {string} subProvider
   * @returns {{subProvider: string, email: string, papel: string,
   *   estado: string, dataCriacao: Date, ultimoAcesso: (Date|null)}|null}
   */
  buscarPorSub(subProvider) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const alvo = String(subProvider == null ? '' : subProvider).trim();
    const linha = valores.slice(1).find((l) => String(l[coluna('SUB_PROVIDER')]).trim() === alvo);
    if (!linha) {
      return null;
    }
    return this.projetar(linha, coluna);
  }

  /**
   * Porta do painel de moderação (§13.4): utilizadores num dado ESTADO_CONTA.
   * @param {string} estado PENDING|ACTIVE|INACTIVE|REJECTED.
   * @returns {Array<{subProvider: string, email: string, papel: string,
   *   estado: string, dataCriacao: Date, ultimoAcesso: (Date|null)}>}
   */
  listarPorEstado(estado) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    return valores
      .slice(1)
      .filter((l) => String(l[coluna('SUB_PROVIDER')]).trim() !== '')
      .filter((l) => String(l[coluna('ESTADO_CONTA')]).trim() === estado)
      .map((l) => this.projetar(l, coluna));
  }

  /**
   * @param {Array} linha
   * @param {function(string): number} coluna
   * @returns {{subProvider: string, email: string, papel: string,
   *   estado: string, dataCriacao: Date, ultimoAcesso: (Date|null)}}
   */
  projetar(linha, coluna) {
    return {
      subProvider: String(linha[coluna('SUB_PROVIDER')]).trim(),
      email: String(linha[coluna('EMAIL_PERFIL')] == null ? '' : linha[coluna('EMAIL_PERFIL')]).trim(),
      papel: String(linha[coluna('PAPEL_ATOR')]).trim(),
      estado: String(linha[coluna('ESTADO_CONTA')]).trim(),
      dataCriacao: celulaParaData(linha[coluna('DATA_CRIACAO')], 'DATA_CRIACAO', 'SIS_IDENTIDADES'),
      ultimoAcesso: celulaParaData(linha[coluna('ULTIMO_ACESSO')], 'ULTIMO_ACESSO', 'SIS_IDENTIDADES'),
    };
  }

  /**
   * @param {Array} cabecalho
   * @returns {function(string): number} resolve nome → índice, fail-fast.
   */
  resolvedorDeColuna(cabecalho) {
    return criarResolvedorDeColuna(cabecalho, 'SIS_IDENTIDADES');
  }
};
