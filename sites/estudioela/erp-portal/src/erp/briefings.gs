/**
 * Briefing de campanha por creator: texto do briefing correspondente ao
 * formato (REEL / CARROSSEL / STORIES) de cada ativação.
 */

function getBriefing(token, idAtivacao) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaAtivacoes = ss.getSheetByName(MAP.ATIVACOES.NOME_ABA);
    const abaBriefing = ss.getSheetByName(MAP.BRIEFING.NOME_ABA);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let influKey, dadosAtivacao, rowInfluKey, mes, formato, dadosBriefing;
    try {
      influKey = getInfluKeyByCupom(ss, cupom);

      // 1. Buscar detalhes da ativação
      const linhaAtivacao = parseInt(idAtivacao);

      if (linhaAtivacao < 2 || linhaAtivacao > abaAtivacoes.getLastRow()) {
        return { ok: false, erro: "ATIVACAO_NAO_ENCONTRADA" };
      }

      dadosAtivacao = abaAtivacoes.getRange(linhaAtivacao, 1, 1, abaAtivacoes.getLastColumn()).getValues()[0];
      rowInfluKey = (dadosAtivacao[MAP.ATIVACOES.INFLU_KEY - 1] || "").toString().trim().toUpperCase();

      if (rowInfluKey !== influKey) {
        return { ok: false, erro: "ACESSO_NEGADO" };
      }

      mes = (dadosAtivacao[MAP.ATIVACOES.MES - 1] || "").toString().trim().toUpperCase();
      formato = (dadosAtivacao[MAP.ATIVACOES.FORMATO - 1] || "").toString().trim().toUpperCase();

      // 2. Buscar o briefing correspondente
      if (!abaBriefing) return { ok: false, erro: "ABA_BRIEFING_NAO_ENCONTRADA" };

      dadosBriefing = abaBriefing.getDataRange().getValues();
    } finally {
      lock.releaseLock();
    }

    let textoBriefing = "Briefing não encontrado para este formato/mês.";

    for (let i = 1; i < dadosBriefing.length; i++) {
      let bInfluKey = (dadosBriefing[i][MAP.BRIEFING.INFLU_KEY - 1] || "").toString().trim().toUpperCase();
      let bMes = (dadosBriefing[i][MAP.BRIEFING.MES - 1] || "").toString().trim().toUpperCase();

      if (bInfluKey === influKey && bMes === mes) {
        // Encontrou a linha do briefing, agora extrai o texto baseado no formato
        if (formato.includes("REEL")) {
          textoBriefing = dadosBriefing[i][12]; // M - SOBRE_REEL
        } else if (formato.includes("CARROSSEL")) {
          textoBriefing = dadosBriefing[i][13]; // N - SOBRE_CARROSSEL
        } else if (formato.includes("STORIES_1") || formato === "STORIES") {
          textoBriefing = dadosBriefing[i][14]; // O - SOBRE_STORIES_1
        } else if (formato.includes("STORIES_2")) {
          textoBriefing = dadosBriefing[i][15]; // P - SOBRE_STORIES_2
        }
        break;
      }
    }

    return {
      ok: true,
      campanha: mes,
      formato: formato,
      dataEntrega: formatarData(dadosAtivacao[MAP.ATIVACOES.DATA_APROVACAO - 1]),
      dataAprovacao: formatarData(dadosAtivacao[MAP.ATIVACOES.DATA_ATIVACAO - 1]),
      textoBriefing: textoBriefing
    };
  } catch (e) {
    Logger.log("getBriefing: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}
