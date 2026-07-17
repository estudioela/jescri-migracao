/**
 * ACL: AdministradorACL — camada anticorrupção da aba física
 * `BASE_ADMINISTRADORES` (SPEC-035 §10.2.2).
 *
 * Único ponto que conhece as colunas físicas SUB_PROVIDER | NOME_COMPLETO |
 * AREA_RESPONSABILIDADE. Acessa a planilha SEMPRE por cabeçalho (Contrato
 * §7). Escrita por append (mesmo padrão de ParceiraACL.inserir) — dados
 * complementares gravados uma vez, no onboarding.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues() e appendRow(array)).
 */

this.AdministradorACL = class AdministradorACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Insere os dados complementares do Administrador (UC-035.03).
   * @param {{subProvider: string, nomeCompleto: string,
   *   areaResponsabilidade: (string|undefined)}} administrador
   */
  inserir(administrador) {
    const cabecalho = this.sheet.getDataRange().getValues()[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const linha = cabecalho.map(() => '');
    linha[coluna('SUB_PROVIDER')] = administrador.subProvider;
    linha[coluna('NOME_COMPLETO')] = administrador.nomeCompleto;
    linha[coluna('AREA_RESPONSABILIDADE')] = administrador.areaResponsabilidade || '';
    this.sheet.appendRow(linha);
  }

  /**
   * @param {string} subProvider
   * @returns {{subProvider: string, nomeCompleto: string,
   *   areaResponsabilidade: string}|null}
   */
  buscarPorSub(subProvider) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const alvo = String(subProvider == null ? '' : subProvider).trim();
    const linha = valores.slice(1).find((l) => String(l[coluna('SUB_PROVIDER')]).trim() === alvo);
    if (!linha) {
      return null;
    }
    return {
      subProvider: String(linha[coluna('SUB_PROVIDER')]).trim(),
      nomeCompleto: String(linha[coluna('NOME_COMPLETO')] == null ? '' : linha[coluna('NOME_COMPLETO')]).trim(),
      areaResponsabilidade: String(
        linha[coluna('AREA_RESPONSABILIDADE')] == null ? '' : linha[coluna('AREA_RESPONSABILIDADE')]
      ).trim(),
    };
  }

  /**
   * @param {Array} cabecalho
   * @returns {function(string): number} resolve nome → índice, fail-fast.
   */
  resolvedorDeColuna(cabecalho) {
    return criarResolvedorDeColuna(cabecalho, 'BASE_ADMINISTRADORES');
  }
};
