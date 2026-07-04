/**
 * API JSON (para o SPA hospedado separadamente em portal.estudioela.com).
 *
 * Shim aditivo: expõe as mesmas funções já usadas via google.script.run
 * (login, getPendencias, etc.) como um endpoint JSON, sem alterar nenhuma
 * delas. O corpo da requisição é enviado como texto puro
 * (Content-Type: text/plain) para evitar preflight de CORS; o conteúdo em
 * si é sempre JSON: {"action": "...", ...params}.
 */
var API_ACOES = {
  login: function (p) { return login(p.cupom, p.senha); },
  logout: function (p) { return logout(p.token); },
  getPendencias: function (p) { return getPendencias(p.token, p.mesAno); },
  getBriefing: function (p) { return getBriefing(p.token, p.idAtivacao); },
  getPagamentos: function (p) { return getPagamentos(p.token, p.mesAno); },
  getHistorico: function (p) { return getHistorico(p.token, p.mesAno); },
  getPerfil: function (p) { return getPerfil(p.token); },
  updatePerfil: function (p) { return updatePerfil(p.token, p.dadosAtualizados); },
  iniciarEnvioResumable: function (p) { return iniciarEnvioResumable(p.token, p.idAtivacao, p.nomeArquivo, p.mimeType, p.tamanhoBytes); },
  finalizarEnvioResumable: function (p) { return finalizarEnvioResumable(p.token, p.idAtivacao, p.fileId); }
};

function doPost(e) {
  var resposta;
  try {
    var corpo = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var acao = corpo.action;
    if (!acao || !API_ACOES[acao]) {
      resposta = { ok: false, erro: "ACAO_INVALIDA" };
    } else {
      resposta = API_ACOES[acao](corpo);
    }
  } catch (err) {
    Logger.log("doPost: EXCEPTION action=%s message=%s stack=%s", (e && e.postData && e.postData.contents) || "", err.message, err.stack);
    resposta = { ok: false, erro: "ERRO_INTERNO" };
  }
  return ContentService.createTextOutput(JSON.stringify(resposta))
    .setMimeType(ContentService.MimeType.JSON);
}
