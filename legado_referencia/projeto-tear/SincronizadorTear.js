function processarMigracaoTear() {
  const idElas = "1Z_Y39SBCb1zwkX02iV7r-rjBTzEwLlhNb-OnpHLmftw"; // [ELÃ] PROJETO TEAR 1.0[cite: 1]
  const idJescri = "1stzgS9TFgedP0nR9Ncla4bX72JCQ8apE2k0RcsbrXl4"; // [ELÃ] PROJETO TEAR 2.0 - CORE

  const abaElas = SpreadsheetApp.openById(idElas).getSheetByName("Respostas ao formulário 1");
  const abaJescri = SpreadsheetApp.openById(idJescri).getSheetByName("BASE DE DADOS");

  const dadosElas = abaElas.getDataRange().getValues();
  const dadosJescri = abaJescri.getDataRange().getValues();
  const emailsJescri = dadosJescri.slice(1).map(row => row[4].toString().toLowerCase().trim());

  Logger.log("--- INICIANDO CICLO DE MIGRAÇÃO ---");

  for (let i = 1; i < dadosElas.length; i++) {
    const row = dadosElas[i];
    const emailElas = row[2].toString().toLowerCase().trim();
    
    if (emailElas && !emailsJescri.includes(emailElas)) {
      // 1. Auditoria (Log)
      Logger.log("Migrando: " + row[1]); 

      // 2. Sincronização (Regra V2 conforme planejado)
      const novaLinha = [
        "OFF",                // STATUS
        row[1].toUpperCase(), // INFLU_KEY
        "",                   // CUPOM
        row[4],               // RAZAO_SOCIAL
        row[2],               // EMAIL
        row[3],               // CHAVE_PIX
        row[5],               // CNPJ
        row[6],               // CEP
        "",                   // RUA (Enriquecimento via CEP pende no Services.js)
        row[7],               // NUMERO
        row[8]                // COMPLEMENTO
      ];
      abaJescri.appendRow(novaLinha);
    }
  }
  Logger.log("--- MIGRAÇÃO CONCLUÍDA ---");
}