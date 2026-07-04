/**
 * Helpers compartilhados entre os domínios do ERP (contratos, entregas,
 * pagamentos). Depende das constantes definidas em config.gs (mesmo escopo
 * global do Apps Script).
 */

function getInfluKeyByCupom(ss, cupom) {
  const abaBase = ss.getSheetByName(MAP.BASE.NOME_ABA);
  const dados = abaBase.getDataRange().getValues();

  for (let i = 1; i < dados.length; i++) {
    if ((dados[i][MAP.BASE.CUPOM - 1] || "").toString().trim().toUpperCase() === cupom) {
      return (dados[i][MAP.BASE.INFLU_KEY - 1] || "").toString().trim().toUpperCase();
    }
  }
  return null;
}

function normalizarStatusAtivacao(statusBruto) {
  if (statusBruto.includes("falta") || statusBruto.includes("aberto")) return "AGUARDANDO_MATERIAL";
  if (statusBruto.includes("aprova") || statusBruto.includes("revis")) return "EM_APROVACAO";
  if (statusBruto.includes("aprovado")) return "APROVADO";
  if (statusBruto.includes("postado") || statusBruto.includes("publicado")) return "PUBLICADO";
  return "AGUARDANDO_MATERIAL";
}

function normalizarStatusPagamento(statusBruto) {
  if (statusBruto.includes("pago")) return "PAGO";
  if (statusBruto.includes("nota")) return "NOTA_FISCAL";
  return "MATERIAL_ENVIADO";
}

function formatarData(data) {
  if (!data) return "";
  if (data instanceof Date) {
    return Utilities.formatDate(data, "GMT-3", "dd/MM/yyyy");
  }
  return data.toString();
}

function extrairValorNumerico(valorStr) {
  if (typeof valorStr === 'number') return valorStr;
  if (!valorStr) return 0;
  let limpo = valorStr.toString().replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  let num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

function getOuCriarSubpasta(pastaPai, nome) {
  var it = pastaPai.getFoldersByName(nome);
  if (it.hasNext()) return it.next();
  return pastaPai.createFolder(nome);
}

function nomeFormatoPasta(formato) {
  var f = (formato || "").toString().trim().toUpperCase();
  if (f.includes("STORIES_1") || f === "STORIES 1") return "STORIES 1";
  if (f.includes("STORIES_2") || f === "STORIES 2") return "STORIES 2";
  if (f.includes("STORIES")) return "STORIES 1";
  if (f.includes("REEL")) return "REEL";
  if (f.includes("CARROSSEL")) return "CARROSSEL";
  return f || "OUTROS";
}
