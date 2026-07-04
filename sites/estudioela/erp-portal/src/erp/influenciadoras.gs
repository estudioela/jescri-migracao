/**
 * Cadastro de influenciadoras: leitura e atualização do perfil (contato,
 * dados cadastrais, chave Pix). Endpoints chamados via google.script.run
 * pelo frontend do portal.
 */

function getPerfil(token) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaBase = ss.getSheetByName(MAP.BASE.NOME_ABA);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let dados;
    try {
      dados = abaBase.getDataRange().getValues();
    } finally {
      lock.releaseLock();
    }

    for (let i = 1; i < dados.length; i++) {
      let cupomPlanilha = (dados[i][MAP.BASE.CUPOM - 1] || "").toString().trim().toUpperCase();

      if (cupomPlanilha === cupom) {
        return {
          ok: true,
          dados: {
            nome: dados[i][MAP.BASE.NOME - 1],
            cnpj: dados[i][MAP.BASE.CNPJ - 1],
            chavePix: dados[i][MAP.BASE.CHAVE_PIX - 1],
            email: dados[i][MAP.BASE.EMAIL - 1],
            telefone: "",
            cep: dados[i][MAP.BASE.CEP - 1],
            rua: dados[i][MAP.BASE.RUA - 1],
            numero: dados[i][MAP.BASE.NUMERO - 1],
            complemento: dados[i][MAP.BASE.COMPLEMENTO - 1],
            cidade: dados[i][MAP.BASE.CIDADE - 1],
            estado: dados[i][MAP.BASE.UF - 1]
          },
          somenteLeitura: {
            cupom: cupom,
            valorTotal: dados[i][MAP.BASE.VALOR - 1]
          }
        };
      }
    }

    return { ok: false, erro: "PERFIL_NAO_ENCONTRADO" };
  } catch (e) {
    Logger.log("getPerfil: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}

function updatePerfil(token, dadosAtualizados) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaBase = ss.getSheetByName(MAP.BASE.NOME_ABA);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const dados = abaBase.getDataRange().getValues();

      for (let i = 1; i < dados.length; i++) {
        let cupomPlanilha = (dados[i][MAP.BASE.CUPOM - 1] || "").toString().trim().toUpperCase();

        if (cupomPlanilha === cupom) {
          const linha = i + 1;

          // Atualiza apenas os campos permitidos
          if (dadosAtualizados.chavePix !== undefined) abaBase.getRange(linha, MAP.BASE.CHAVE_PIX).setValue(dadosAtualizados.chavePix);
          if (dadosAtualizados.email !== undefined) abaBase.getRange(linha, MAP.BASE.EMAIL).setValue(dadosAtualizados.email);
          if (dadosAtualizados.cep !== undefined) abaBase.getRange(linha, MAP.BASE.CEP).setValue(dadosAtualizados.cep);
          if (dadosAtualizados.numero !== undefined) abaBase.getRange(linha, MAP.BASE.NUMERO).setValue(dadosAtualizados.numero);
          if (dadosAtualizados.complemento !== undefined) abaBase.getRange(linha, MAP.BASE.COMPLEMENTO).setValue(dadosAtualizados.complemento);

          return { ok: true };
        }
      }

      return { ok: false, erro: "PERFIL_NAO_ENCONTRADO" };
    } finally {
      lock.releaseLock();
    }
  } catch (e) {
    Logger.log("updatePerfil: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}
