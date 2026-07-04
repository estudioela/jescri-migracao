/**
 * Login simples da influenciadora (cupom + primeiros 5 dígitos do CNPJ) e
 * validação/renovação de sessão via CacheService (6h, renovação deslizante).
 *
 * A "senha" (prefixo do CNPJ) tem baixa entropia por não ser um segredo
 * gerado — o bloqueio por tentativas abaixo existe para tornar inviável
 * varrer as 10^5 combinações por cupom.
 */

var LOGIN_MAX_TENTATIVAS = 5;
var LOGIN_BLOQUEIO_SEGUNDOS = 900; // 15 minutos

function login(cupom, senha) {
  try {
    if (!cupom || !senha) return { ok: false, erro: "CREDENCIAIS_INVALIDAS" };

    const cupomLimpo = cupom.toString().trim().toUpperCase();
    const senhaLimpa = senha.toString().trim();

    const cache = CacheService.getScriptCache();
    const chaveTentativas = "tentativas_" + cupomLimpo;
    const tentativas = parseInt(cache.get(chaveTentativas) || "0", 10);
    if (tentativas >= LOGIN_MAX_TENTATIVAS) {
      return { ok: false, erro: "MUITAS_TENTATIVAS" };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaBase = ss.getSheetByName(MAP.BASE.NOME_ABA);
    if (!abaBase) return { ok: false, erro: "ERRO_INTERNO" };

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
      let cnpjPlanilha = (dados[i][MAP.BASE.CNPJ - 1] || "").toString().replace(/\D/g, "");

      if (cupomPlanilha === cupomLimpo) {
        let senhaCorreta = cnpjPlanilha.substring(0, 5);
        if (senhaLimpa === senhaCorreta) {
          // Login sucesso
          cache.remove(chaveTentativas);

          const token = Utilities.getUuid();
          cache.put(token, cupomLimpo, 21600); // 6 horas (21600 segundos)

          return {
            ok: true,
            token: token,
            nome: dados[i][MAP.BASE.NOME - 1]
          };
        }
      }
    }

    cache.put(chaveTentativas, String(tentativas + 1), LOGIN_BLOQUEIO_SEGUNDOS);
    return { ok: false, erro: "CREDENCIAIS_INVALIDAS" };
  } catch (e) {
    Logger.log("login: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}

function validarToken(token) {
  if (!token) return null;
  const cache = CacheService.getScriptCache();
  const cupom = cache.get(token);

  if (cupom) {
    // Renovação deslizante
    cache.put(token, cupom, 21600);
    return cupom;
  }
  return null;
}

function logout(token) {
  if (token) {
    CacheService.getScriptCache().remove(token);
  }
  return { ok: true };
}
