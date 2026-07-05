/**
 * Backend do Portal de Influenciadoras Jescri
 * Arquivo: WebApp.gs
 * Publicado como Web App na Planilha de Apoio
 */

const SCRIPT_PROP_PASTA_RAIZ = "PASTA_RAIZ_ENTREGAS";

// Bloqueio por tentativas no login: a "senha" é o prefixo do CNPJ (baixa
// entropia, não é um segredo gerado) — sem isso, seria viável varrer as 10^5
// combinações por cupom.
const LOGIN_MAX_TENTATIVAS = 5;
const LOGIN_BLOQUEIO_SEGUNDOS = 900; // 15 minutos

// ======================================================
// CONFIGURAÇÕES E MAPEAMENTO DE COLUNAS
// ======================================================
// BASE DE DADOS é agora a fonte única de leitura do Portal (login, perfil,
// briefing, pagamentos, histórico) — BASE DE APOIO saiu do fluxo. As colunas
// fixas abaixo continuam válidas porque BASE DE APOIO sempre foi um espelho
// posicional de BASE DE DADOS (ver mae/Sincronizador.js, agora desativado).
// ID_PASTA_DRIVE deixou de ser uma coluna (era exclusiva do Portal, gravada
// só em BASE DE APOIO) e virou PropertiesService, chave por cupom — ver
// getIdPastaDriveCupom/setIdPastaDriveCupom.
// ATIVACOES/PAGAMENTOS/HISTORICO_* usam getHeaderMap() (nomes de cabeçalho,
// não posição fixa) porque ganharam colunas novas (ID, ANO_REFERENCIA) e
// porque o resto do projeto (Código.js) já resolve essas abas por nome.
const MAP = {
  BASE: {
    NOME_ABA: "BASE DE DADOS",
    INFLU_KEY: 2, // B
    CUPOM: 3, // C
    NOME: 4, // D
    EMAIL: 5, // E
    CHAVE_PIX: 6, // F
    CNPJ: 7, // G
    CEP: 8, // H
    RUA: 9, // I
    NUMERO: 10, // J
    COMPLEMENTO: 11, // K
    CIDADE: 13, // M
    UF: 14, // N
    VALOR: 16 // P - VALOR_TOTAL
  },
  ATIVACOES: { NOME_ABA: "ATIVAÇÕES" },
  PAGAMENTOS: { NOME_ABA: "PAGAMENTOS" },
  BRIEFING: {
    NOME_ABA: "BRIEFING",
    INFLU_KEY: 1, // A
    CUPOM: 2, // B
    MES: 3, // C
    RESUMO: 4, // D
    // Mapeamento dinâmico baseado no formato
  },
  HISTORICO_CONT: { NOME_ABA: "HISTÓRICO DE CONTEÚDOS" },
  HISTORICO_PAG: { NOME_ABA: "HISTÓRICO DE PAGAMENTOS" }
};

// Ordem cronológica dos meses (nomes em maiúsculo, como gravados nas abas)
// para ordenar períodos no seletor do portal.
const ORDEM_MESES = {
  "JANEIRO": 1, "FEVEREIRO": 2, "MARÇO": 3, "MARCO": 3, "ABRIL": 4,
  "MAIO": 5, "JUNHO": 6, "JULHO": 7, "AGOSTO": 8, "SETEMBRO": 9,
  "OUTUBRO": 10, "NOVEMBRO": 11, "DEZEMBRO": 12
};

// Abas de ativações/pagamentos anteriores à consolidação em HISTORICO_CONT/
// HISTORICO_PAG — inclusive as atualmente ocultas/desativadas na planilha —
// não seguem um nome fixo, então são descobertas pela assinatura do
// cabeçalho (INFLU_KEY + MES_REFERENCIA), não pelo nome da aba. Reused por
// getHistorico() e listarPeriodos() para não duplicar a descoberta.
function listarAbasHistoricoLegado(ss) {
  const nomesConhecidos = {};
  [MAP.ATIVACOES.NOME_ABA, MAP.PAGAMENTOS.NOME_ABA, MAP.HISTORICO_CONT.NOME_ABA,
   MAP.HISTORICO_PAG.NOME_ABA, MAP.BASE.NOME_ABA, MAP.BRIEFING.NOME_ABA].forEach(function (n) {
    nomesConhecidos[n] = true;
  });
  if (typeof SETUP !== 'undefined' && SETUP.ABAS) {
    Object.keys(SETUP.ABAS).forEach(function (k) { nomesConhecidos[SETUP.ABAS[k]] = true; });
  }

  const abasLegado = [];
  ss.getSheets().forEach(function (sheet) {
    const nome = sheet.getName();
    if (nomesConhecidos[nome] || sheet.getLastRow() < 2) return;
    const h = getHeaderMap(sheet);
    if (!h['INFLU_KEY'] || !h['MES_REFERENCIA']) return;
    const tipo = h['STATUS_CONTEUDO'] ? 'CONTEUDO' : (h['STATUS_PAGAMENTO'] ? 'PAGAMENTO' : null);
    if (!tipo) return;
    abasLegado.push({ sheet: sheet, h: h, tipo: tipo });
  });
  return abasLegado;
}

// ======================================================
// FUNÇÕES PRINCIPAIS DO WEB APP
// ======================================================

function doGet(e) {
  // QA_SHADOW: só ativa com token correto (PropertiesService, gerado via menu
  // "Gerar/Ver Token QA"). Sem token ou com token errado, cai no Portal normal
  // abaixo — nenhuma mudança de comportamento para usuário real (ver QaShadow.js).
  if (e && e.parameter && e.parameter.mode === 'qa') {
    const tokenEsperado = PropertiesService.getScriptProperties().getProperty(QA_TOKEN_PROP);
    if (tokenEsperado && e.parameter.token === tokenEsperado) {
      return ContentService.createTextOutput(JSON.stringify(runQA_E2E(), null, 2)).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Alterado de 'test' para 'Index' conforme solicitado
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Portal Influenciadoras Jescri')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ======================================================
// API JSON (para o SPA hospedado separadamente)
// ======================================================
// Shim aditivo: expõe as mesmas funções já usadas via google.script.run
// (login, getPendencias, etc.) como um endpoint JSON, sem alterar nenhuma
// delas. O corpo da requisição deve ser enviado como texto puro
// (Content-Type: text/plain) para evitar preflight de CORS; o conteúdo em
// si é sempre JSON: {"action": "...", ...params}.
var API_ACOES = {
  login: function (p) { return login(p.cupom, p.senha); },
  getPendencias: function (p) { return getPendencias(p.token, p.mes, p.ano); },
  getBriefing: function (p) { return getBriefing(p.token, p.idAtivacao); },
  getPagamentos: function (p) { return getPagamentos(p.token, p.mes, p.ano); },
  getHistorico: function (p) { return getHistorico(p.token, p.mes, p.ano); },
  getPerfil: function (p) { return getPerfil(p.token); },
  updatePerfil: function (p) { return updatePerfil(p.token, p.dadosAtualizados); },
  listarPeriodos: function (p) { return listarPeriodos(p.token); },
  logout: function (p) { return logout(p.token); }
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
    resposta = { ok: false, erro: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(resposta))
    .setMimeType(ContentService.MimeType.JSON);
}

// ======================================================
// AUTENTICAÇÃO E SESSÃO
// ======================================================

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

// ======================================================
// FUNÇÕES DE DADOS (CONTRATOS)
// ======================================================

function getPendencias(token, mes, ano) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaAtivacoes = ss.getSheetByName(MAP.ATIVACOES.NOME_ABA);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let influKey, dados, h;
    try {
      influKey = getInfluKeyByCupom(ss, cupom);
      if (!influKey) return { ok: false, erro: "USUARIO_NAO_ENCONTRADO" };
      if (!abaAtivacoes) return { ok: true, itens: [] };
      h = getHeaderMap(abaAtivacoes);
      dados = abaAtivacoes.getDataRange().getValues();
    } finally {
      lock.releaseLock();
    }

    const mesFiltro = mes ? mes.toString().trim().toUpperCase() : null;
    const anoFiltro = ano ? parseInt(ano, 10) : null;
    const itens = [];

    for (let i = 1; i < dados.length; i++) {
      let rowInfluKey = (dados[i][h['INFLU_KEY'] - 1] || "").toString().trim().toUpperCase();
      let rowMes = (dados[i][h['MES_REFERENCIA'] - 1] || "").toString().trim().toUpperCase();
      let rowAno = h['ANO_REFERENCIA'] ? parseInt(dados[i][h['ANO_REFERENCIA'] - 1], 10) : null;

      // Filtra por influenciadora e período (mês/ano, cada um opcional)
      if (rowInfluKey === influKey && (!mesFiltro || rowMes === mesFiltro) && (!anoFiltro || rowAno === anoFiltro)) {
        let statusBruto = (dados[i][h['STATUS_CONTEUDO'] - 1] || "").toString().toLowerCase();
        let statusNormalizado = normalizarStatusAtivacao(statusBruto);
        let idLinha = h['ID'] ? dados[i][h['ID'] - 1] : "";

        itens.push({
          idAtivacao: idLinha || ("ROW" + (i + 1)), // fallback transitório se a coluna ID ainda não existir
          formato: dados[i][h['FORMATO'] - 1],
          campanha: rowMes + (rowAno ? " " + rowAno : ""),
          dataEntrega: formatarData(dados[i][h['DATA_APROVACAO'] - 1]),
          dataAprovacao: formatarData(dados[i][h['DATA_ATIVACAO'] - 1]),
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

function getBriefing(token, idAtivacao) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaAtivacoes = ss.getSheetByName(MAP.ATIVACOES.NOME_ABA);
    const abaBriefing = ss.getSheetByName(MAP.BRIEFING.NOME_ABA);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let influKey, dadosAtivacao, rowInfluKey, mes, formato, dadosBriefing, h;
    try {
      influKey = getInfluKeyByCupom(ss, cupom);

      // 1. Buscar detalhes da ativação, resolvendo pelo ID estável (não mais
      // pelo número da linha — evita corrida se a aba for editada entre a
      // listagem de pendências e a abertura do briefing).
      h = getHeaderMap(abaAtivacoes);
      const linhaAtivacao = encontrarLinhaAtivacaoPorId(abaAtivacoes, h, idAtivacao);

      if (linhaAtivacao < 2) {
        return { ok: false, erro: "ATIVACAO_NAO_ENCONTRADA" };
      }

      dadosAtivacao = abaAtivacoes.getRange(linhaAtivacao, 1, 1, abaAtivacoes.getLastColumn()).getValues()[0];
      rowInfluKey = (dadosAtivacao[h['INFLU_KEY'] - 1] || "").toString().trim().toUpperCase();

      if (rowInfluKey !== influKey) {
        return { ok: false, erro: "ACESSO_NEGADO" };
      }

      mes = (dadosAtivacao[h['MES_REFERENCIA'] - 1] || "").toString().trim().toUpperCase();
      formato = (dadosAtivacao[h['FORMATO'] - 1] || "").toString().trim().toUpperCase();

      // 2. Buscar o briefing correspondente (só por MES — BRIEFING não ganhou
      // ANO_REFERENCIA neste momento; ver ressalva no relatório final)
      if (!abaBriefing) return { ok: false, erro: "ABA_BRIEFING_NAO_ENCONTRADA" };

      dadosBriefing = abaBriefing.getDataRange().getValues();
    } finally {
      lock.releaseLock();
    }

    let textoBriefing = "Briefing não encontrado para este formato/mês.";
    let resumoMes = "";
    // Cabeçalho real da aba BRIEFING pode variar ("Resumo", "Resumo do Mês"...)
    // — resolve por nome, com o índice fixo (coluna D) só como último recurso.
    const hBrief = getHeaderMap(abaBriefing);
    const colResumo = hBrief['RESUMO'] || hBrief['RESUMO_DO_MES'] || hBrief['RESUMO_MES'] || MAP.BRIEFING.RESUMO;

    for (let i = 1; i < dadosBriefing.length; i++) {
      let bInfluKey = (dadosBriefing[i][MAP.BRIEFING.INFLU_KEY - 1] || "").toString().trim().toUpperCase();
      let bMes = (dadosBriefing[i][MAP.BRIEFING.MES - 1] || "").toString().trim().toUpperCase();

      if (bInfluKey === influKey && bMes === mes) {
        resumoMes = (dadosBriefing[i][colResumo - 1] || "").toString().trim();

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
      dataEntrega: formatarData(dadosAtivacao[h['DATA_APROVACAO'] - 1]),
      dataAprovacao: formatarData(dadosAtivacao[h['DATA_ATIVACAO'] - 1]),
      textoBriefing: textoBriefing,
      resumoMes: resumoMes
    };
  } catch (e) {
    Logger.log("getBriefing: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}

function getPagamentos(token, mes, ano) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaPagamentos = ss.getSheetByName(MAP.PAGAMENTOS.NOME_ABA);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let influKey, dados, h;
    try {
      influKey = getInfluKeyByCupom(ss, cupom);
      if (!abaPagamentos) return { ok: true, totalPrevisto: 0, totalPago: 0, itens: [] };
      h = getHeaderMap(abaPagamentos);
      dados = abaPagamentos.getDataRange().getValues();
    } finally {
      lock.releaseLock();
    }

    const mesFiltro = mes ? mes.toString().trim().toUpperCase() : null;
    const anoFiltro = ano ? parseInt(ano, 10) : null;
    const itens = [];
    let totalPrevisto = 0;
    let totalPago = 0;

    for (let i = 1; i < dados.length; i++) {
      let rowInfluKey = (dados[i][h['INFLU_KEY'] - 1] || "").toString().trim().toUpperCase();
      let rowMes = (dados[i][h['MES_REFERENCIA'] - 1] || "").toString().trim().toUpperCase();
      let rowAno = h['ANO_REFERENCIA'] ? parseInt(dados[i][h['ANO_REFERENCIA'] - 1], 10) : null;

      if (rowInfluKey === influKey && (!mesFiltro || rowMes === mesFiltro) && (!anoFiltro || rowAno === anoFiltro)) {
        let statusBruto = (dados[i][h['STATUS_PAGAMENTO'] - 1] || "").toString().toLowerCase();
        let etapa = normalizarStatusPagamento(statusBruto);
        let valor = extrairValorNumerico(dados[i][h['VALOR_TOTAL'] - 1]);

        if (etapa === "PAGO") {
          totalPago += valor;
        } else {
          totalPrevisto += valor;
        }

        itens.push({
          idPagamento: i + 1,
          referencia: rowMes + (rowAno ? " " + rowAno : ""),
          valor: dados[i][h['VALOR_TOTAL'] - 1],
          etapa: etapa,
          dataPrevista: "",
          dataPagamento: formatarData(dados[i][h['DATA_PAGAMENTO'] - 1])
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

function getHistorico(token, mes, ano) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaHistCont = ss.getSheetByName(MAP.HISTORICO_CONT.NOME_ABA);
    const abaHistPag = ss.getSheetByName(MAP.HISTORICO_PAG.NOME_ABA);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let influKey, dadosCont, dadosPag, hCont, hPag, abasLegado;
    try {
      influKey = getInfluKeyByCupom(ss, cupom);
      if (abaHistCont) { hCont = getHeaderMap(abaHistCont); dadosCont = abaHistCont.getDataRange().getValues(); }
      if (abaHistPag) { hPag = getHeaderMap(abaHistPag); dadosPag = abaHistPag.getDataRange().getValues(); }
      // Abas de histórico anteriores à consolidação (inclusive ocultas/desativadas)
      abasLegado = listarAbasHistoricoLegado(ss).map(function (a) {
        return { tipo: a.tipo, h: a.h, dados: a.sheet.getDataRange().getValues() };
      });
    } finally {
      lock.releaseLock();
    }

    const mesFiltro = mes ? mes.toString().trim().toUpperCase() : null;
    const anoFiltro = ano ? parseInt(ano, 10) : null;
    const ativacoes = [];
    const pagamentos = [];

    function extrairAtivacoes(dados, h) {
      for (let i = 1; i < dados.length; i++) {
        let rowInfluKey = (dados[i][h['INFLU_KEY'] - 1] || "").toString().trim().toUpperCase();
        let rowMes = (dados[i][h['MES_REFERENCIA'] - 1] || "").toString().trim().toUpperCase();
        let rowAno = h['ANO_REFERENCIA'] ? parseInt(dados[i][h['ANO_REFERENCIA'] - 1], 10) : null;

        if (rowInfluKey === influKey && (!mesFiltro || rowMes === mesFiltro) && (!anoFiltro || rowAno === anoFiltro)) {
          let idLinha = h['ID'] ? dados[i][h['ID'] - 1] : "";
          ativacoes.push({
            idAtivacao: "H" + (idLinha || (i + 1)),
            formato: h['FORMATO'] ? dados[i][h['FORMATO'] - 1] : "",
            campanha: rowMes + (rowAno ? " " + rowAno : ""),
            dataEntrega: h['DATA_APROVACAO'] ? formatarData(dados[i][h['DATA_APROVACAO'] - 1]) : "",
            dataAprovacao: h['DATA_ATIVACAO'] ? formatarData(dados[i][h['DATA_ATIVACAO'] - 1]) : "",
            status: "PUBLICADO",
            temBriefing: false
          });
        }
      }
    }

    function extrairPagamentos(dados, h) {
      for (let i = 1; i < dados.length; i++) {
        let rowInfluKey = (dados[i][h['INFLU_KEY'] - 1] || "").toString().trim().toUpperCase();
        let rowMes = (dados[i][h['MES_REFERENCIA'] - 1] || "").toString().trim().toUpperCase();
        let rowAno = h['ANO_REFERENCIA'] ? parseInt(dados[i][h['ANO_REFERENCIA'] - 1], 10) : null;

        if (rowInfluKey === influKey && (!mesFiltro || rowMes === mesFiltro) && (!anoFiltro || rowAno === anoFiltro)) {
          pagamentos.push({
            idPagamento: "H" + (i + 1),
            referencia: rowMes + (rowAno ? " " + rowAno : ""),
            valor: h['VALOR_TOTAL'] ? dados[i][h['VALOR_TOTAL'] - 1] : "",
            etapa: "PAGO",
            dataPrevista: "",
            dataPagamento: h['DATA_PAGAMENTO'] ? formatarData(dados[i][h['DATA_PAGAMENTO'] - 1]) : ""
          });
        }
      }
    }

    if (dadosCont) extrairAtivacoes(dadosCont, hCont);
    if (dadosPag) extrairPagamentos(dadosPag, hPag);
    abasLegado.forEach(function (a) {
      if (a.tipo === 'CONTEUDO') extrairAtivacoes(a.dados, a.h);
      else extrairPagamentos(a.dados, a.h);
    });

    return { ok: true, ativacoes: ativacoes, pagamentos: pagamentos };
  } catch (e) {
    Logger.log("getHistorico: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}

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

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

// ID_PASTA_DRIVE migrou de coluna (exclusiva de BASE DE APOIO) para
// PropertiesService, chave por cupom — evita que BASE DE DADOS precise de
// uma coluna de uso exclusivo do Portal.
function getIdPastaDriveCupom(cupom) {
  return PropertiesService.getScriptProperties().getProperty("PASTA_DRIVE_" + cupom);
}

function setIdPastaDriveCupom(cupom, id) {
  PropertiesService.getScriptProperties().setProperty("PASTA_DRIVE_" + cupom, id);
}

// Resolve a linha real de uma ativação a partir do ID estável (UUID, coluna
// ID) em vez do número de linha — corrige a corrida em que uma edição na aba
// (inserção/remoção de linha) entre a listagem de pendências e o envio de
// material desalinhava idAtivacao do restante do fluxo.
// Fallback "ROWn": aceita o número de linha literal só na transição, para
// abas que ainda não tenham a coluna ID preenchida.
function encontrarLinhaAtivacaoPorId(abaAtivacoes, h, idAtivacao) {
  const idStr = (idAtivacao || "").toString().trim();
  if (idStr.indexOf("ROW") === 0) {
    const linha = parseInt(idStr.substring(3), 10);
    return (linha >= 2 && linha <= abaAtivacoes.getLastRow()) ? linha : -1;
  }
  if (!h['ID'] || abaAtivacoes.getLastRow() < 2) return -1;
  const idsColuna = abaAtivacoes.getRange(2, h['ID'], abaAtivacoes.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < idsColuna.length; i++) {
    if ((idsColuna[i][0] || "").toString().trim() === idStr) return i + 2;
  }
  return -1;
}

// Lista os períodos (mês/ano) com dados para a influenciadora logada, para o
// seletor de período do portal navegar por campanha real em vez de um índice
// fixo 0-11 sem ano.
function listarPeriodos(token) {
  try {
    const cupom = validarToken(token);
    if (!cupom) return { ok: false, erro: "SESSAO_EXPIRADA" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const influKey = getInfluKeyByCupom(ss, cupom);
    if (!influKey) return { ok: false, erro: "USUARIO_NAO_ENCONTRADO" };

    const nomesAbas = [
      MAP.ATIVACOES.NOME_ABA,
      MAP.PAGAMENTOS.NOME_ABA,
      MAP.HISTORICO_CONT.NOME_ABA,
      MAP.HISTORICO_PAG.NOME_ABA
    ];
    const abas = nomesAbas.map(function (nome) { return ss.getSheetByName(nome); }).filter(Boolean);
    // Abas de histórico anteriores à consolidação, inclusive ocultas/desativadas
    listarAbasHistoricoLegado(ss).forEach(function (a) { abas.push(a.sheet); });

    const periodos = {}; // chave "MES|ANO" -> {mes, ano}
    abas.forEach(function (aba) {
      if (!aba || aba.getLastRow() < 2) return;
      const h = getHeaderMap(aba);
      if (!h['MES_REFERENCIA'] || !h['INFLU_KEY']) return;
      const dados = aba.getDataRange().getValues();
      for (let i = 1; i < dados.length; i++) {
        const rowInfluKey = (dados[i][h['INFLU_KEY'] - 1] || "").toString().trim().toUpperCase();
        if (rowInfluKey !== influKey) continue;
        const mes = (dados[i][h['MES_REFERENCIA'] - 1] || "").toString().trim().toUpperCase();
        if (!mes) continue;
        const ano = h['ANO_REFERENCIA'] ? (parseInt(dados[i][h['ANO_REFERENCIA'] - 1], 10) || null) : null;
        const chave = mes + "|" + (ano || "");
        if (!periodos[chave]) periodos[chave] = { mes: mes, ano: ano };
      }
    });

    const lista = Object.keys(periodos).map(function (k) { return periodos[k]; });
    lista.sort(function (a, b) {
      if (a.ano !== b.ano) return (b.ano || 0) - (a.ano || 0);
      return (ORDEM_MESES[b.mes] || 0) - (ORDEM_MESES[a.mes] || 0);
    });

    return { ok: true, periodos: lista };
  } catch (e) {
    Logger.log("listarPeriodos: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}

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
  // Ordem importa: "aprovado" e "postado/publicado" são estados terminais e
  // precisam ser checados antes de "aprova"/"revis" (em andamento), já que
  // "aprovado".includes("aprova") é true — checar na ordem antiga fazia toda
  // ativação aprovada cair sempre em EM_APROVACAO, nunca em APROVADO.
  if (statusBruto.includes("aprovado")) return "APROVADO";
  if (statusBruto.includes("postado") || statusBruto.includes("publicado")) return "PUBLICADO";
  if (statusBruto.includes("aprova") || statusBruto.includes("revis")) return "EM_APROVACAO";
  if (statusBruto.includes("falta") || statusBruto.includes("aberto")) return "AGUARDANDO_MATERIAL";
  return "AGUARDANDO_MATERIAL";
}

function normalizarStatusPagamento(statusBruto) {
  // A barra de progresso só avança com aprovação confirmada na planilha-mãe:
  // "pago" é terminal (checado primeiro), "aprovado" avança um passo: tudo
  // o mais (pendente, em análise, enviado, em aberto...) fica em PENDENTE.
  if (statusBruto.includes("pago")) return "PAGO";
  if (statusBruto.includes("aprovado")) return "APROVADO";
  return "PENDENTE";
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

const PASTA_MAE_ID = "1X7BSY9R7dUUNYXgYnmnCIACVMFcqBUPH";

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

function obterOuCriarPastaDestino(ss, cupom, abaAtivacoes, linhaAtivacao, hAtiv) {
  const abaBase = ss.getSheetByName(MAP.BASE.NOME_ABA);
  const dadosBase = abaBase.getDataRange().getValues();
  let encontrouInflu = false, nomeInflu = cupom;
  for (let i = 1; i < dadosBase.length; i++) {
    if ((dadosBase[i][MAP.BASE.CUPOM - 1] || "").toString().trim().toUpperCase() === cupom) {
      encontrouInflu = true;
      nomeInflu = (dadosBase[i][MAP.BASE.NOME - 1] || cupom).toString().trim();
      break;
    }
  }
  if (!encontrouInflu) throw new Error("USUARIO_NAO_ENCONTRADO");

  let pastaInfluenciadoraId = getIdPastaDriveCupom(cupom);
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
      const idRecente = getIdPastaDriveCupom(cupom);
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
        setIdPastaDriveCupom(cupom, pastaInfluenciadoraId);
      }
    } finally {
      lock.releaseLock();
    }
  }

  const mesAtivacao = (abaAtivacoes.getRange(linhaAtivacao, hAtiv['MES_REFERENCIA']).getValue() || "").toString().trim() || "SEM_MES";
  const formatoAtivacao = abaAtivacoes.getRange(linhaAtivacao, hAtiv['FORMATO']).getValue();

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
    const hAtiv = getHeaderMap(abaAtivacoes);
    const linhaAtivacao = encontrarLinhaAtivacaoPorId(abaAtivacoes, hAtiv, idAtivacao);
    if (linhaAtivacao < 2) {
      return { ok: false, erro: "ATIVACAO_NAO_ENCONTRADA" };
    }
    const rowInfluKey = (abaAtivacoes.getRange(linhaAtivacao, hAtiv['INFLU_KEY']).getValue() || "").toString().trim().toUpperCase();
    if (rowInfluKey !== influKey) return { ok: false, erro: "ACESSO_NEGADO" };

    const pastaFormato = obterOuCriarPastaDestino(ss, cupom, abaAtivacoes, linhaAtivacao, hAtiv);

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
    const linkArquivo = "https://drive.google.com/file/d/" + fileId + "/view";

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      // Re-resolve a linha dentro do lock: blinda contra edição concorrente da
      // aba (inserção/remoção de linha) entre o upload e esta gravação — é o
      // ponto frágil identificado para o "some após logout" (idAtivacao antes
      // era o número de linha; agora é o ID estável, verificado de novo aqui).
      const hAtiv = getHeaderMap(abaAtivacoes);
      const linhaAtivacao = encontrarLinhaAtivacaoPorId(abaAtivacoes, hAtiv, idAtivacao);
      if (linhaAtivacao < 2) return { ok: false, erro: "ATIVACAO_NAO_ENCONTRADA" };

      const rowInfluKey = (abaAtivacoes.getRange(linhaAtivacao, hAtiv['INFLU_KEY']).getValue() || "").toString().trim().toUpperCase();
      if (rowInfluKey !== influKey) return { ok: false, erro: "ACESSO_NEGADO" };

      const linkAnterior = abaAtivacoes.getRange(linhaAtivacao, hAtiv['LINK_ARQUIVO']).getValue();
      const novoLink = linkAnterior ? (linkAnterior + "\n" + linkArquivo) : linkArquivo;
      abaAtivacoes.getRange(linhaAtivacao, hAtiv['LINK_ARQUIVO']).setValue(novoLink);
      abaAtivacoes.getRange(linhaAtivacao, hAtiv['STATUS_CONTEUDO']).setValue("EM_APROVACAO");
    } finally {
      lock.releaseLock();
    }

    return { ok: true, link: linkArquivo };
  } catch (e) {
    Logger.log("finalizarEnvioResumable: EXCEPTION message=%s stack=%s", e.message, e.stack);
    return { ok: false, erro: "ERRO_INTERNO" };
  }
}