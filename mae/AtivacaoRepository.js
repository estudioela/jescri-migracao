const CAMPOS_ATIVACAO = Object.freeze({
  ID: 'ID_Ativacao',
  CICLO: 'ID_Ciclo',
  ESTADO: 'Estado_Principal'
});

class AtivacaoRepository {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActive();
  }

  getById(id) {
    if (!id) {
      return null;
    }

    const { cabecalho, linhas } = this._lerDados();
    const idIdx = this._indiceDe(cabecalho, CAMPOS_ATIVACAO.ID);
    const linha = linhas.find(l => this._mesmoId(l[idIdx], id));

    return linha ? this._paraObjeto(cabecalho, linha) : null;
  }

  findByCiclo(cicloId) {
    if (!cicloId) {
      return [];
    }

    const { cabecalho, linhas } = this._lerDados();
    const cicloIdx = this._indiceDe(cabecalho, CAMPOS_ATIVACAO.CICLO);

    return linhas
      .filter(l => this._mesmoId(l[cicloIdx], cicloId))
      .map(l => this._paraObjeto(cabecalho, l));
  }

  save(ativacaoData) {
    if (!ativacaoData || typeof ativacaoData !== 'object') {
      throw new TypeError('save() espera um objeto de ativação.');
    }

    const { aba, cabecalho, linhas } = this._lerDados();
    const idIdx = this._indiceDe(cabecalho, CAMPOS_ATIVACAO.ID);
    const id = ativacaoData[CAMPOS_ATIVACAO.ID];
    const posicao = id ? linhas.findIndex(l => this._mesmoId(l[idIdx], id)) : -1;

    if (posicao === -1) {
      const novo = Object.assign({}, ativacaoData);
      novo[CAMPOS_ATIVACAO.ID] = id || Utilities.getUuid();
      aba.appendRow(cabecalho.map(coluna => (coluna in novo ? novo[coluna] : '')));
      return novo;
    }

    const linhaAtual = linhas[posicao];
    const intervalo = aba.getRange(posicao + 2, 1, 1, cabecalho.length);
    const formulas = intervalo.getFormulas()[0];

    const atualizada = cabecalho.map((coluna, i) =>
      coluna && Object.prototype.hasOwnProperty.call(ativacaoData, coluna)
        ? ativacaoData[coluna]
        : linhaAtual[i]
    );

    const paraGravar = atualizada.map((valor, i) => (formulas[i] ? formulas[i] : valor));

    intervalo.setValues([paraGravar]);
    return this._paraObjeto(cabecalho, atualizada);
  }

  _getAba() {
    const nome = PLANILHAS.ATIVACOES;
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
      throw new Error(`Coluna "${campo}" ausente em "${PLANILHAS.ATIVACOES}".`);
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

  _mesmoId(valorCelula, valorBusca) {
    return String(valorCelula).trim() === String(valorBusca).trim();
  }
}
