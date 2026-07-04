/**
 * Controle de cachê (valores devidos à influenciadora) e status de
 * pagamento por mês/campanha.
 */

function getPagamentos(token, mesAno) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaPagamentos = ss.getSheetByName(MAP.PAGAMENTOS.NOME_ABA);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let influKey, dados;
    try {
      influKey = getInfluKeyByCupom(ss, cupom);
      if (!abaPagamentos) return { ok: true, totalPrevisto: 0, totalPago: 0, itens: [] };
      dados = abaPagamentos.getDataRange().getValues();
    } finally {
      lock.releaseLock();
    }

    const itens = [];
    let totalPrevisto = 0;
    let totalPago = 0;

    for (let i = 1; i < dados.length; i++) {
      let rowInfluKey = (dados[i][MAP.PAGAMENTOS.INFLU_KEY - 1] || "").toString().trim().toUpperCase();
      let rowMes = (dados[i][MAP.PAGAMENTOS.MES - 1] || "").toString().trim().toUpperCase();

      if (rowInfluKey === influKey && (!mesAno || rowMes === mesAno.toUpperCase())) {
        let statusBruto = (dados[i][MAP.PAGAMENTOS.STATUS - 1] || "").toString().toLowerCase();
        let etapa = normalizarStatusPagamento(statusBruto);
        let valor = extrairValorNumerico(dados[i][MAP.PAGAMENTOS.VALOR - 1]);

        if (etapa === "PAGO") {
          totalPago += valor;
        } else {
          totalPrevisto += valor;
        }

        itens.push({
          idPagamento: i + 1,
          referencia: rowMes,
          valor: dados[i][MAP.PAGAMENTOS.VALOR - 1],
          etapa: etapa,
          dataPrevista: "",
          dataPagamento: formatarData(dados[i][MAP.PAGAMENTOS.DATA_PAGAMENTO - 1])
        });
      }
    }

    return {
      ok: true,
      totalPrevisto: totalPrevisto,
      totalPago: totalPago,
      itens: itens
    };
  } catch (e) {
    Logger.log("getPagamentos: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}
