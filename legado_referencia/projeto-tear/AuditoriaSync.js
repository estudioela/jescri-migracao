function auditarSincronizacao() {
  // IDs das Planilhas
  const idElas = "1Z_Y39SBCb1zwkX02iV7r-rjBTzEwLlhNb-OnpHLmftw"; // [ELÃ] PROJETO TEAR 1.0
  const idJescri = "1ZKqrmz80oOaU70gcHeIgr-yK9zeJ_5YkE8b5CKkuRdM"; // [JESCRI] INFLUÊNCIA 360º

  const abaElas = SpreadsheetApp.openById(idElas).getSheetByName("Respostas ao formulário 1");
  const abaJescri = SpreadsheetApp.openById(idJescri).getSheetByName("BASE DE DADOS");

  const dadosElas = abaElas.getDataRange().getValues();
  const dadosJescri = abaJescri.getDataRange().getValues();

  // Mapear emails já existentes na JESCRI (Coluna E, índice 4)[cite: 2]
  const emailsJescri = dadosJescri.slice(1).map(row => row[4].toString().toLowerCase().trim());

  Logger.log("--- INICIANDO AUDITORIA DE PENDÊNCIAS ---");

  // Percorrer Respostas do Formulário (Coluna C, índice 2)[cite: 1]
  for (let i = 1; i < dadosElas.length; i++) {
    const row = dadosElas[i];
    const emailElas = row[2].toString().toLowerCase().trim(); // Email
    const nomeElas = row[1]; // Apelido[cite: 1]

    if (emailElas && !emailsJescri.includes(emailElas)) {
      Logger.log("PENDENTE: " + nomeElas + " (" + emailElas + ") não encontrada na base JESCRI.");
    } else if (emailElas) {
      Logger.log("OK: " + nomeElas + " já consta na base.");
    }
  }
  Logger.log("--- FIM DA AUDITORIA ---");
}
