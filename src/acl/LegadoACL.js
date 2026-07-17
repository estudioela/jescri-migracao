/**
 * ACL: LegadoACL — leitura da base legada (SPEC-003; aba física
 * `BASE DE DADOS` da planilha legada, `PLANILHA_TEAR_2.0_MAPA.md` §3).
 *
 * SOMENTE LEITURA (RN-01/INV-01): esta classe não tem nenhum método de
 * escrita — estruturalmente impossível gravar na base legada por aqui.
 *
 * DECISÃO LOCAL: o esquema físico da aba `BASE DE DADOS` legada já é
 * idêntico ao da `BASE DE DADOS` nova (mesmos nomes de coluna — confirmado
 * em `PLANILHA_TEAR_2.0_MAPA.md` §3 e no docstring de `ParceiraACL.
 * atualizarPerfil`, que cita as mesmas 961 linhas). Por isso esta ACL não
 * faz nenhuma tradução de coluna: devolve cada linha como um objeto cru
 * `{NOME_DA_COLUNA: valor}`, exatamente como lida — a curadoria (RN-02/
 * RN-05, quais campos são válidos) é regra de negócio e pertence ao
 * Service (`ImportadorService`), nunca à ACL.
 *
 * Não pode conter regra de negócio nem ser duplicada.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues()).
 */

this.LegadoACL = class LegadoACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Lê a aba legada inteira e devolve um objeto cru por linha, ignorando
   * linhas totalmente vazias. Nenhuma validação/curadoria acontece aqui.
   * @returns {Object<string, *>[]}
   */
  listarRegistros() {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    return valores
      .slice(1)
      .filter((linha) => linha.some((celula) => String(celula == null ? '' : celula).trim() !== ''))
      .map((linha) => {
        const registro = {};
        cabecalho.forEach((nome, indice) => {
          registro[nome] = linha[indice];
        });
        return registro;
      });
  }
};
