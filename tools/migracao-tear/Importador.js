function importarDadosDaV1() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (typeof DADOS_IMPORTACAO !== 'undefined' && DADOS_IMPORTACAO.parceiros) {
    const abaParceiros = ss.getSheetByName('Parceiros_Influenciadoras');
    const dadosParceiros = DADOS_IMPORTACAO.parceiros.map(p => [p.ID, p.Nome]);
    if (dadosParceiros.length > 0) {
      abaParceiros.getRange(2, 1, dadosParceiros.length, 2).setValues(dadosParceiros);
      Logger.log("Sucesso: " + dadosParceiros.length + " parceiros importados.");
    }
  }
}
