/**
 * Colunas da aba `Ciclos` (docs/spec/SCHEMA_V2.md).
 */
const CAMPOS_CICLO = Object.freeze({
  ID: 'ID_Ciclo',
  NOME: 'Nome_Ciclo',
  INICIO_LOGISTICA: 'Data_Inicio_Logistica',
  FIM_OPERACAO: 'Data_Fim_Operacao'
});

/**
 * Única camada autorizada a tocar `SpreadsheetApp` para a entidade Ciclo.
 * Resolve coluna por nome de cabeçalho, nunca por índice — inserir uma coluna
 * na planilha não pode quebrar a leitura em silêncio.
 */
class CicloRepository {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActive();
  }

  listarTodos() {
    const { cabecalho, linhas } = this._lerDados();

    return linhas
      .filter(linha => this._temId(cabecalho, linha))
      .map(linha => this._paraObjeto(cabecalho, linha));
  }

  _temId(cabecalho, linha) {
    const idIdx = this._indiceDe(cabecalho, CAMPOS_CICLO.ID);

    return String(linha[idIdx]).trim() !== '';
  }

  _getAba() {
    const nome = PLANILHAS.CICLOS;
    const aba = this.spreadsheet.getSheetByName(nome);

    if (!aba) {
      throw new Error(`Aba "${nome}" não encontrada na planilha.`);
    }

    return aba;
  }

  _lerDados() {
    const aba = this._getAba();
    const valores = aba.getDataRange().getValues();
    const cabecalho = valores.shift() || [];

    return { aba, cabecalho, linhas: valores };
  }

  _indiceDe(cabecalho, campo) {
    const indice = cabecalho.indexOf(campo);

    if (indice === -1) {
      throw new Error(`Coluna "${campo}" ausente em "${PLANILHAS.CICLOS}".`);
    }

    return indice;
  }

  _paraObjeto(cabecalho, linha) {
    return cabecalho.reduce((obj, coluna, i) => {
      if (coluna) {
        obj[coluna] = linha[i];
      }
      return obj;
    }, {});
  }
}
