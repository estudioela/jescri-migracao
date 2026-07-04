/**
 * Tracking de postagem/entrega vs. briefing: pendências do mês, histórico
 * completo (ativações + pagamentos) e o fluxo de upload resumable do
 * material para o Drive.
 *
 * getHistorico() retorna ativações e pagamentos juntos (contrato original
 * do frontend); mantido aqui como uma unidade para não alterar a API
 * consumida pelo portal.
 */

function getPendencias(token, mesAno) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaAtivacoes = ss.getSheetByName(MAP.ATIVACOES.NOME_ABA);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let influKey, dados;
    try {
      influKey = getInfluKeyByCupom(ss, cupom);
      if (!influKey) return { ok: false, erro: "USUARIO_NAO_ENCONTRADO" };
      if (!abaAtivacoes) return { ok: true, itens: [] };
      dados = abaAtivacoes.getDataRange().getValues();
    } finally {
      lock.releaseLock();
    }

    const itens = [];

    for (let i = 1; i < dados.length; i++) {
      let rowInfluKey = (dados[i][MAP.ATIVACOES.INFLU_KEY - 1] || "").toString().trim().toUpperCase();
      let rowMes = (dados[i][MAP.ATIVACOES.MES - 1] || "").toString().trim().toUpperCase();

      // Filtra por influenciadora e mês (se fornecido)
      if (rowInfluKey === influKey && (!mesAno || rowMes === mesAno.toUpperCase())) {
        let statusBruto = (dados[i][MAP.ATIVACOES.STATUS - 1] || "").toString().toLowerCase();
        let statusNormalizado = normalizarStatusAtivacao(statusBruto);

        itens.push({
          idAtivacao: i + 1, // Usando o número da linha como ID
          formato: dados[i][MAP.ATIVACOES.FORMATO - 1],
          campanha: rowMes,
          dataEntrega: formatarData(dados[i][MAP.ATIVACOES.DATA_APROVACAO - 1]),
          dataAprovacao: formatarData(dados[i][MAP.ATIVACOES.DATA_ATIVACAO - 1]),
          status: statusNormalizado,
          temBriefing: true
        });
      }
    }

    return { ok: true, itens: itens };
  } catch (e) {
    Logger.log("getPendencias: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}

function getHistorico(token, mesAno) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaHistCont = ss.getSheetByName(MAP.HISTORICO_CONT.NOME_ABA);
    const abaHistPag = ss.getSheetByName(MAP.HISTORICO_PAG.NOME_ABA);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let influKey, dadosCont, dadosPag;
    try {
      influKey = getInfluKeyByCupom(ss, cupom);
      if (abaHistCont) dadosCont = abaHistCont.getDataRange().getValues();
      if (abaHistPag) dadosPag = abaHistPag.getDataRange().getValues();
    } finally {
      lock.releaseLock();
    }

    const ativacoes = [];
    const pagamentos = [];

    // Histórico de Conteúdos
    if (dadosCont) {
      for (let i = 1; i < dadosCont.length; i++) {
        let rowInfluKey = (dadosCont[i][MAP.HISTORICO_CONT.INFLU_KEY - 1] || "").toString().trim().toUpperCase();
        let rowMes = (dadosCont[i][MAP.HISTORICO_CONT.MES - 1] || "").toString().trim().toUpperCase();

        if (rowInfluKey === influKey && (!mesAno || rowMes === mesAno.toUpperCase())) {
          ativacoes.push({
            idAtivacao: "H" + (i + 1),
            formato: dadosCont[i][MAP.HISTORICO_CONT.FORMATO - 1],
            campanha: rowMes,
            dataEntrega: formatarData(dadosCont[i][MAP.HISTORICO_CONT.DATA_APROVACAO - 1]),
            dataAprovacao: formatarData(dadosCont[i][MAP.HISTORICO_CONT.DATA_ATIVACAO - 1]),
            status: "PUBLICADO",
            temBriefing: false
          });
        }
      }
    }

    // Histórico de Pagamentos
    if (dadosPag) {
      for (let i = 1; i < dadosPag.length; i++) {
        let rowInfluKey = (dadosPag[i][MAP.HISTORICO_PAG.INFLU_KEY - 1] || "").toString().trim().toUpperCase();
        let rowMes = (dadosPag[i][MAP.HISTORICO_PAG.MES - 1] || "").toString().trim().toUpperCase();

        if (rowInfluKey === influKey && (!mesAno || rowMes === mesAno.toUpperCase())) {
          pagamentos.push({
            idPagamento: "H" + (i + 1),
            referencia: rowMes,
            valor: dadosPag[i][MAP.HISTORICO_PAG.VALOR - 1],
            etapa: "PAGO",
            dataPrevista: "",
            dataPagamento: formatarData(dadosPag[i][MAP.HISTORICO_PAG.DATA_PAGAMENTO - 1])
          });
        }
      }
    }

    return { ok: true, ativacoes: ativacoes, pagamentos: pagamentos };
  } catch (e) {
    Logger.log("getHistorico: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}

function obterOuCriarPastaDestino(ss, cupom, abaAtivacoes, linhaAtivacao) {
  const abaBase = ss.getSheetByName(MAP.BASE.NOME_ABA);
  const dadosBase = abaBase.getDataRange().getValues();
  let pastaInfluenciadoraId = null, linhaInflu = -1, nomeInflu = cupom;
  for (let i = 1; i < dadosBase.length; i++) {
    if ((dadosBase[i][MAP.BASE.CUPOM - 1] || "").toString().trim().toUpperCase() === cupom) {
      linhaInflu = i + 1;
      pastaInfluenciadoraId = dadosBase[i][MAP.BASE.ID_PASTA_DRIVE - 1];
      nomeInflu = (dadosBase[i][MAP.BASE.NOME - 1] || cupom).toString().trim();
      break;
    }
  }
  if (linhaInflu === -1) throw new Error("USUARIO_NAO_ENCONTRADO");

  let pastaInfluenciadora;
  try {
    pastaInfluenciadora = pastaInfluenciadoraId ? DriveApp.getFolderById(pastaInfluenciadoraId) : null;
  } catch (e) {
    pastaInfluenciadora = null;
  }
  if (!pastaInfluenciadora) {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      // Re-checa após obter o lock: outra requisição concorrente pode já ter criado a pasta.
      const idRecente = abaBase.getRange(linhaInflu, MAP.BASE.ID_PASTA_DRIVE).getValue();
      try {
        pastaInfluenciadora = idRecente ? DriveApp.getFolderById(idRecente) : null;
      } catch (e) {
        pastaInfluenciadora = null;
      }

      if (!pastaInfluenciadora) {
        const propRaiz = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROP_PASTA_RAIZ);
        let pastaRaiz;
        try { pastaRaiz = DriveApp.getFolderById(propRaiz || PASTA_MAE_ID); }
        catch (e) { pastaRaiz = DriveApp.getFolderById(PASTA_MAE_ID); }
        pastaInfluenciadora = getOuCriarSubpasta(pastaRaiz, nomeInflu);
        pastaInfluenciadoraId = pastaInfluenciadora.getId();
        abaBase.getRange(linhaInflu, MAP.BASE.ID_PASTA_DRIVE).setValue(pastaInfluenciadoraId);
      }
    } finally {
      lock.releaseLock();
    }
  }

  const mesAtivacao = (abaAtivacoes.getRange(linhaAtivacao, MAP.ATIVACOES.MES).getValue() || "").toString().trim() || "SEM_MES";
  const formatoAtivacao = abaAtivacoes.getRange(linhaAtivacao, MAP.ATIVACOES.FORMATO).getValue();

  const pastaMes = getOuCriarSubpasta(pastaInfluenciadora, mesAtivacao);
  return getOuCriarSubpasta(pastaMes, nomeFormatoPasta(formatoAtivacao));
}

function iniciarEnvioResumable(token, idAtivacao, nomeArquivo, mimeType, tamanhoBytes) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const influKey = getInfluKeyByCupom(ss, cupom);

    const abaAtivacoes = ss.getSheetByName(MAP.ATIVACOES.NOME_ABA);
    const linhaAtivacao = parseInt(idAtivacao);
    if (linhaAtivacao < 2 || linhaAtivacao > abaAtivacoes.getLastRow()) {
      return { ok: false, erro: "ATIVACAO_NAO_ENCONTRADA" };
    }
    const rowInfluKey = (abaAtivacoes.getRange(linhaAtivacao, MAP.ATIVACOES.INFLU_KEY).getValue() || "").toString().trim().toUpperCase();
    if (rowInfluKey !== influKey) return { ok: false, erro: "ACESSO_NEGADO" };

    const pastaFormato = obterOuCriarPastaDestino(ss, cupom, abaAtivacoes, linhaAtivacao);

    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";
    const resposta = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
      payload: JSON.stringify({ name: nomeArquivo, parents: [pastaFormato.getId()] }),
      muteHttpExceptions: true
    });

    if (resposta.getResponseCode() !== 200) {
      return { ok: false, erro: "FALHA_INICIAR_UPLOAD", detalhes: resposta.getContentText() };
    }
    const headers = resposta.getHeaders();
    const uploadUrl = headers["Location"] || headers["location"];
    return { ok: true, uploadUrl: uploadUrl };
  } catch (e) {
    Logger.log("iniciarEnvioResumable: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}

function finalizarEnvioResumable(token, idAtivacao, fileId) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const influKey = getInfluKeyByCupom(ss, cupom);
    const abaAtivacoes = ss.getSheetByName(MAP.ATIVACOES.NOME_ABA);
    const linhaAtivacao = parseInt(idAtivacao);
    const rowInfluKey = (abaAtivacoes.getRange(linhaAtivacao, MAP.ATIVACOES.INFLU_KEY).getValue() || "").toString().trim().toUpperCase();
    if (rowInfluKey !== influKey) return { ok: false, erro: "ACESSO_NEGADO" };

    const linkArquivo = "https://drive.google.com/file/d/" + fileId + "/view";

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const linkAnterior = abaAtivacoes.getRange(linhaAtivacao, MAP.ATIVACOES.LINK_ARQUIVO).getValue();
      const novoLink = linkAnterior ? (linkAnterior + "\n" + linkArquivo) : linkArquivo;
      abaAtivacoes.getRange(linhaAtivacao, MAP.ATIVACOES.LINK_ARQUIVO).setValue(novoLink);
      abaAtivacoes.getRange(linhaAtivacao, MAP.ATIVACOES.STATUS).setValue("EM_APROVACAO");
    } finally {
      lock.releaseLock();
    }

    return { ok: true, link: linkArquivo };
  } catch (e) {
    Logger.log("finalizarEnvioResumable: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}
