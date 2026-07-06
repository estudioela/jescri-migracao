/**
 * ERP INFLUÊNCIA 360º - V 6.2 (SISTEMA DE GESTÃO INTEGRADA)
 * Módulos: Automação Baseada em Eventos, Espelhamento Ativações -> Briefing, Menu Otimizado, Inteligência de CEP, Rastreio.
 * Portal do Influenciador lê BASE DE DADOS diretamente (WebApp.gs) — não há mais sync/espelho com planilha externa.
 */

const SETUP = {
  ABAS: {
    CADASTROS: "CADASTROS",
    BASE: "BASE DE DADOS",
    BRIEFING: "BRIEFING",
    FLUXO: "FLUXO LOGÍSTICO",
    ATIVACOES: "ATIVAÇÕES", 
    PAGAMENTOS: "PAGAMENTOS",
    HISTORICO_CONT: "HISTÓRICO DE CONTEÚDOS",
    HISTORICO_PAG: "HISTÓRICO DE PAGAMENTOS",
    HISTORICO_FLUXO: "HISTÓRICO LOGÍSTICO"
  },
  CORES: { ON: "#D9EAD3", OFF: "#F4CCCC", CABECALHO: "#cd0005", TEXTO_CABECALHO: "#ffffff" }
};

// ======================================================
// 1. MENU DO SISTEMA (INTERFACES E LOGICA VISUAL CORRIGIDA)
// ======================================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  // Correção estrutural: encadeamento direto para evitar falha de variável 'menu' não declarada
  ui.createMenu(" ERP ELÃ 6.2")
    .addSubMenu(ui.createMenu(" Planejamento & Campanhas")
      .addItem(" 1. Iniciar Novo Mês (Gerar Rascunhos e Tarefas)", "gerarNovoMesCompleto")
      .addItem(" 2. Puxar Looks da Planilha Externa para Briefing", "sincronizarLooks"))
    
    .addSubMenu(ui.createMenu(" Financeiro & PIX")
      .addItem(" 1. Lançar Pagamentos Avulsos do Mês", "lancarPagamentosDoMes")
      .addItem(" 2. Copiar Mensagem de PIX (Aba Pagamentos)", "gerarSolicitacaoPagamento"))
    
    .addSubMenu(ui.createMenu(" Logística & Envios")
      .addItem(" 1. Atualizar Rastreios Automáticos (BRComerce)", "atualizarRastreiosBRComerce")
      .addItem(" 2. Copiar Dados de Confirmação (WhatsApp)", "gerarMensagemRevisao"))
    
    .addSeparator()
    
    .addSubMenu(ui.createMenu(" Cadastros & Configurações")
      .addItem(" 1. Abrir Formulário de Cadastro", "abrirPaginaCadastro")
      .addItem(" 2. Preencher Endereço por CEP (Aba Base)", "atualizarEnderecoLinhaSelecionada")
      .addItem(" 3. Executar Limpeza e Arquivamento Geral", "menuArquivarTudo")
      .addItem(" 4. Estruturar Planilha (Setup Inicial)", "setupERP")
      .addSeparator()
      .addItem(" 5. Editar Dados da Influenciadora (Sidebar)", "abrirSidebarInflu")
      .addItem(" 6. Lançar Pagamento Extra/UGC (Sidebar)", "abrirSidebarPagamento")
      .addSeparator()
      .addItem(" 7. ⚠️ Limpar Histórico Oficial (IRREVERSÍVEL)", "limparHistoricoOficial")
      .addItem(" 8. Remover Triggers Órfãos", "limparTriggersOrfaos"))

    .addSeparator()

    .addSubMenu(ui.createMenu(" 🖥️ Portal de Apoio")
      .addItem(" 1. Abrir Portal (Modal)", "abrirPortalModal")
    )

    .addSeparator()

    .addSubMenu(ui.createMenu(" 📄 Schema Vivo")
      .addItem(" 1. Exportar Schema Agora", "exportarSchemaCompleto")
      .addItem(" 2. Instalar Triggers Automáticos (rodar 1x)", "instalarTriggersSchemaExporter"))

    .addSubMenu(ui.createMenu(" 🧪 QA Shadow")
      .addItem(" 1. Rodar QA Shadow Agora", "rodarQaShadowAgora")
      .addItem(" 2. Gerar/Ver Token do Endpoint QA", "configurarTokenQA"))

    .addToUi();
}

function abrirPaginaCadastro() {
  const html = HtmlService.createHtmlOutput(`<script>window.open('https://estudioela.com/cliente/jescri-cadastro/', '_blank');google.script.host.close();</script>`);
  SpreadsheetApp.getUi().showModalDialog(html, 'Redirecionando para o Formulário...');
}

// ======================================================
// 2. MOTOR PRINCIPAL: CRIAÇÃO DO MÊS INTEGRADO
// ======================================================
function gerarNovoMesCompleto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const baseSheet = ss.getSheetByName(SETUP.ABAS.BASE);
  const briefingSheet = ss.getSheetByName(SETUP.ABAS.BRIEFING);
  const ativSheet = ss.getSheetByName(SETUP.ABAS.ATIVACOES);
  const fluxoSheet = ss.getSheetByName(SETUP.ABAS.FLUXO);
  const pagSheet = ss.getSheetByName(SETUP.ABAS.PAGAMENTOS);

  const res = ui.prompt(' Iniciar Planejamento Mensal', 'Digite o MÊS e o ANO da Nova Campanha (Ex: AGOSTO 2026)\nNota: O Briefing atual será limpo para o rascunho.', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() != ui.Button.OK) return;
  const { mes: mesTarget, ano: anoTarget } = parseMesAno(res.getResponseText());
  if (!mesTarget) return;

  const hBase = getHeaderMap(baseSheet);
  const hBrief = getHeaderMap(briefingSheet);
  const hAtiv = getHeaderMap(ativSheet);
  const hPag = getHeaderMap(pagSheet);
  let baseData = baseSheet.getDataRange().getValues();
  
  let influON = baseData.filter(r => r[0] === true || r[0].toString().toUpperCase() === 'ON').map(r => ({
    nome: r[hBase['INFLU_KEY']-1], 
    cupom: r[hBase['CUPOM']-1], 
    pasta: r[hBase['PASTA_DRIVE_LINK']-1],
    endereco: r[hBase['INFLUENCIADORA_ENDERECO']-1],
    valor: r[hBase['VALOR_TOTAL']-1],
    pix: r[hBase['CHAVE_PIX']-1],
    qReels: textToNumber(r[hBase['REELS_TEXTO']-1]),
    qCarrosel: textToNumber(r[hBase['CARROSSEL_TEXTO']-1]),
    qStories: textToNumber(r[hBase['STORIES_TEXTO']-1])
  }));

  if (!influON.length) return ui.alert('Aviso', 'Nenhuma influenciadora ativa (ON) encontrada na base.', ui.ButtonSet.OK);

  const lastRowBrief = briefingSheet.getLastRow();
  if (lastRowBrief > 1) {
    briefingSheet.getRange(2, 1, lastRowBrief - 1, briefingSheet.getLastColumn()).clearContent();
  }

  let listaAtiv = [], listaFluxo = [], listaPag = [];

  influON.forEach((inf, i) => {
    let rowBrief = i + 2;
    if (hBrief['INFLU_KEY']) briefingSheet.getRange(rowBrief, hBrief['INFLU_KEY']).setValue(inf.nome); 
    if (hBrief['CUPOM']) briefingSheet.getRange(rowBrief, hBrief['CUPOM']).setValue(inf.cupom);
    if (hBrief['MES']) briefingSheet.getRange(rowBrief, hBrief['MES']).setValue(mesTarget); 
    if (hBrief['PASTA_DRIVE_LINK']) briefingSheet.getRange(rowBrief, hBrief['PASTA_DRIVE_LINK']).setValue(inf.pasta);

    listaFluxo.push([inf.nome, inf.endereco || "", "Aguardando Confirmação", mesTarget, '', '', 'pendente']);
    listaPag.push(montarLinha(hPag, {
      INFLU_KEY: inf.nome, MES_REFERENCIA: mesTarget, ANO_REFERENCIA: anoTarget,
      VALOR_TOTAL: inf.valor, CHAVE_PIX: inf.pix, STATUS_PAGAMENTO: 'em aberto'
    }));

    for(let r=1; r<=inf.qReels; r++) listaAtiv.push(montarLinha(hAtiv, {
      ID: Utilities.getUuid(), INFLU_KEY: inf.nome, MES_REFERENCIA: mesTarget, ANO_REFERENCIA: anoTarget,
      FORMATO: 'REEL', STATUS_CONTEUDO: 'em aberto'
    }));
    for(let c=1; c<=inf.qCarrosel; c++) listaAtiv.push(montarLinha(hAtiv, {
      ID: Utilities.getUuid(), INFLU_KEY: inf.nome, MES_REFERENCIA: mesTarget, ANO_REFERENCIA: anoTarget,
      FORMATO: 'CARROSSEL', STATUS_CONTEUDO: 'em aberto'
    }));
    for(let s=1; s<=inf.qStories; s++) {
      let fmt = inf.qStories > 1 ? 'STORIES_'+s : 'STORIES';
      listaAtiv.push(montarLinha(hAtiv, {
        ID: Utilities.getUuid(), INFLU_KEY: inf.nome, MES_REFERENCIA: mesTarget, ANO_REFERENCIA: anoTarget,
        FORMATO: fmt, STATUS_CONTEUDO: 'em aberto'
      }));
    }
  });

  if(listaFluxo.length) fluxoSheet.getRange(fluxoSheet.getLastRow()+1, 1, listaFluxo.length, 7).setValues(listaFluxo);
  if(listaPag.length) pagSheet.getRange(pagSheet.getLastRow()+1, 1, listaPag.length, listaPag[0].length).setValues(listaPag);
  if(listaAtiv.length) ativSheet.getRange(ativSheet.getLastRow()+1, 1, listaAtiv.length, listaAtiv[0].length).setValues(listaAtiv);

  ordenarAbaAtivacoesCronologico();
  ui.alert('Sucesso!', `O planejamento de ${mesTarget}/${anoTarget} foi gerado!\n\n- Briefing limpo e preparado.\n- Linhas de Ativações, Fluxo e Pagamentos injetadas com sucesso!`, ui.ButtonSet.OK);
  exportarSchemaAoIniciarNovoMes();
}

// Cria um trigger instalável onOpen para garantir que o menu seja registrado
function createOnOpenTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Remove triggers onOpen existentes deste projeto para evitar duplicatas
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    try {
      if (t.getHandlerFunction && t.getHandlerFunction() === 'onOpen' && t.getEventType && t.getEventType() === ScriptApp.EventType.ON_OPEN) {
        ScriptApp.deleteTrigger(t);
      }
    } catch (e) {}
  });

  ScriptApp.newTrigger('onOpen').forSpreadsheet(ss).onOpen().create();
  SpreadsheetApp.getUi().alert('Trigger onOpen instalável criado. Recarregue a planilha para ver o menu.');
}


// ======================================================
// 3. EVENTOS EM TEMPO REAL (GATILHO ONEDIT INTEGRADO)
// ======================================================
function onEdit(e) {
  if (!e || !e.range) return;
  try {
    const sh = e.range.getSheet();
    const name = sh.getName();
    const row = e.range.getRow();
    const col = e.range.getColumn();
    if (row < 2) return;

    // Este trigger dispara para QUALQUER edição em QUALQUER aba da planilha
    // (CADASTROS, HISTÓRICO_*, abas legado, etc.) — sai cedo, antes de ler o
    // cabeçalho, se a aba editada não for uma das tratadas abaixo.
    const ABAS_TRATADAS = [SETUP.ABAS.BRIEFING, SETUP.ABAS.ATIVACOES, SETUP.ABAS.BASE, SETUP.ABAS.PAGAMENTOS, SETUP.ABAS.FLUXO];
    if (ABAS_TRATADAS.indexOf(name) === -1) return;

    const h = getHeaderMap(sh);

    if (name === SETUP.ABAS.BRIEFING) {
      let colHeader = sh.getRange(1, col).getValue().toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "_");
      let colDestino = null;
      
      if (colHeader.includes("REEL") && !colHeader.includes("APROVACAO")) {
        colDestino = h['APROVACAO_REEL'] || 17;
      } else if (colHeader.includes("CARROSSEL") && !colHeader.includes("APROVACAO")) {
        colDestino = h['APROVACAO_CARROSSEL'] || 18;
      } else if ((colHeader.includes("STORIES_1") || (colHeader.includes("STORIES") && !colHeader.includes("2"))) && !colHeader.includes("APROVACAO")) {
        colDestino = h['APROVACAO_STORIES_1'] || h['APROVACAO_STORIES'] || 19;
      } else if (colHeader.includes("STORIES_2") && !colHeader.includes("APROVACAO")) {
        colDestino = h['APROVACAO_STORIES_2'] || 20;
      }
      
      if (colDestino) {
        let valorCelula = sh.getRange(row, col).getValue();
        if (valorCelula instanceof Date || (typeof valorCelula === 'string' && valorCelula.trim() !== "")) {
          let calcAprovacao = calcularDataAprovacao(valorCelula);
          if (calcAprovacao !== "") sh.getRange(row, colDestino).setValue(calcAprovacao);
        } else if (valorCelula === "") {
          sh.getRange(row, colDestino).clearContent();
        }
      }
      return;
    }

    if (name === SETUP.ABAS.ATIVACOES) {
      if (col === h['STATUS_CONTEUDO'] && String(e.value).toLowerCase().includes("postado")) {
        arquivarGenerico(SETUP.ABAS.ATIVACOES, SETUP.ABAS.HISTORICO_CONT, 'STATUS_CONTEUDO', ['postado'], true);
        ordenarAbaAtivacoesCronologico();
        return;
      }
      
      if (col === h['DATA_ATIVACAO']) {
        let valorCelula = sh.getRange(row, col).getValue();
        
        if (valorCelula instanceof Date || (typeof valorCelula === 'string' && valorCelula.trim() !== "")) {
          let calcAprovacao = calcularDataAprovacao(valorCelula);
          if (calcAprovacao !== "") sh.getRange(row, h['DATA_APROVACAO']).setValue(calcAprovacao);
          
          let influKey = String(sh.getRange(row, h['INFLU_KEY']).getValue()).trim().toUpperCase();
          let mesRef = String(sh.getRange(row, h['MES_REFERENCIA']).getValue()).trim().toUpperCase();
          let formato = String(sh.getRange(row, h['FORMATO']).getValue()).trim().toUpperCase();
          
          let briefSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETUP.ABAS.BRIEFING);
          if (briefSheet) {
            let hBrief = getHeaderMap(briefSheet);
            let dataBrief = briefSheet.getDataRange().getValues();
            
            let idxBrief = dataBrief.findIndex(rb => {
              let rowInflu = (hBrief['INFLU_KEY'] ? rb[hBrief['INFLU_KEY']-1] : rb[0]) || "";
              let rowMes = (hBrief['MES'] ? rb[hBrief['MES']-1] : rb[2]) || "";
              return String(rowInflu).trim().toUpperCase() === influKey && String(rowMes).trim().toUpperCase() === mesRef;
            });
            
            if (idxBrief !== -1) {
              let rowTargetBrief = idxBrief + 1;
              if (formato === 'STORIES') formato = 'STORIES_1'; 
              let nomeColBrief = 'APROVACAO_' + formato; 
              
              let colBriefDest = hBrief[nomeColBrief];
              if (!colBriefDest) {
                if (formato.includes("REEL")) colBriefDest = 17;
                else if (formato.includes("CARROSSEL")) colBriefDest = 18;
                else if (formato.includes("STORIES_1") || formato === "STORIES") colBriefDest = 19;
                else if (formato.includes("STORIES_2")) colBriefDest = 20;
              }
              
              if (colBriefDest && calcAprovacao !== "") {
                briefSheet.getRange(rowTargetBrief, colBriefDest).setValue(calcAprovacao);
              }
            }
          }
        } else if (valorCelula === "") {
          sh.getRange(row, h['DATA_APROVACAO']).clearContent();
        }
        
        SpreadsheetApp.flush();
        ordenarAbaAtivacoesCronologico();
      }
    }
    
    if (name === SETUP.ABAS.BASE) {
      if (col === 1) organizarEPintarBase();
      if ((h['CEP'] && col === h['CEP']) || (h['NUMERO'] && col === h['NUMERO']) || (h['COMPLEMENTO'] && col === h['COMPLEMENTO'])) {
        preencherEnderecoPorCEP(sh, row, sh.getRange(row, h['CEP']).getValue(), h);
      }
    }
    
    if (name === SETUP.ABAS.PAGAMENTOS && col === h['STATUS_PAGAMENTO'] && String(e.value).toLowerCase().includes("pago")) {
      arquivarGenerico(SETUP.ABAS.PAGAMENTOS, SETUP.ABAS.HISTORICO_PAG, 'STATUS_PAGAMENTO', ['pago'], true);
    }
    
    if (name === SETUP.ABAS.FLUXO && h['RASTREIO'] && col === h['RASTREIO'] && String(e.value).includes("http")) {
      if(!sh.getRange(row, h['DATA_DE_ENVIO']).getValue()) {
        sh.getRange(row, h['DATA_DE_ENVIO']).setValue(Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy"));
      }
    }
  } catch(err) {}
}

// ======================================================
// 4. REGRAS DE DATA AUTOMÁTICA
// ======================================================
function calcularDataAprovacao(dataInput) {
  let d;
  if (dataInput instanceof Date) {
    d = new Date(dataInput.getTime());
  } else if (typeof dataInput === 'string' && dataInput.length >= 8) {
    let partes = dataInput.split(/[\/\-\s]/);
    if (partes.length >= 3 && partes[2].length >= 4) {
      d = new Date(partes[2].substring(0,4), parseInt(partes[1]) - 1, parseInt(partes[0]));
    } else {
      d = new Date(dataInput);
    }
  } else {
    return "";
  }
  if (isNaN(d.getTime())) return "";
  
  d.setDate(d.getDate() - 7);
  
  if (d.getDay() === 5) {
    d.setDate(d.getDate() + 3);
  } else if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1); 
  } else if (d.getDay() === 6) {
    d.setDate(d.getDate() + 2); 
  } 
  
  d.setHours(12, 0, 0, 0);
  return d;
}

function ordenarAbaAtivacoesCronologico() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETUP.ABAS.ATIVACOES);
  if (!sh || sh.getLastRow() < 2) return;
  const h = getHeaderMap(sh);
  if (h['DATA_ATIVACAO']) {
    sh.getRange(2, 1, sh.getLastRow()-1, sh.getLastColumn()).sort({column: h['DATA_ATIVACAO'], ascending: true});
  }
}

// ======================================================
// 5. FINANCEIRO: GERADOR DE LANÇAMENTOS ADICIONAIS
// ======================================================
function lancarPagamentosDoMes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const baseSheet = ss.getSheetByName(SETUP.ABAS.BASE);
  const pagSheet = ss.getSheetByName(SETUP.ABAS.PAGAMENTOS);

  const res = ui.prompt(' Pagamentos Avulsos', 'Qual o MÊS e ANO de referência para essa injeção de pagamentos? (Ex: AGOSTO 2026)', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() != ui.Button.OK) return;
  const { mes: mesTarget, ano: anoTarget } = parseMesAno(res.getResponseText());
  if (!mesTarget) return;

  const hBase = getHeaderMap(baseSheet);
  const hPag = getHeaderMap(pagSheet);
  const dataBase = baseSheet.getDataRange().getValues();
  let influON = dataBase.filter(r => r[0] === true || r[0].toString().toUpperCase() === 'ON');

  if (influON.length === 0) return ui.alert('Nenhuma influenciadora ativa (ON) para faturar.');

  let lPag = [];
  influON.forEach(r => {
    let nome = r[hBase['INFLU_KEY']-1];
    let valor = r[hBase['VALOR_TOTAL']-1];
    let pix = r[hBase['CHAVE_PIX']-1];
    if (nome) lPag.push(montarLinha(hPag, {
      INFLU_KEY: nome, MES_REFERENCIA: mesTarget, ANO_REFERENCIA: anoTarget,
      VALOR_TOTAL: valor, CHAVE_PIX: pix, STATUS_PAGAMENTO: 'em aberto'
    }));
  });

  if (lPag.length > 0) {
    pagSheet.getRange(pagSheet.getLastRow() + 1, 1, lPag.length, lPag[0].length).setValues(lPag);
    ui.alert('Concluído', `${lPag.length} pagamentos avulsos de ${mesTarget}/${anoTarget} foram lançados!`, ui.ButtonSet.OK);
  }
}

// ======================================================
// 6. ADOBE/WHATSAPP: MENSAGENS E RELATÓRIOS
// ======================================================
function gerarSolicitacaoPagamento() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sh.getName() !== SETUP.ABAS.PAGAMENTOS) { SpreadsheetApp.getUi().alert("Atenção", "Use esta função apenas dentro da aba PAGAMENTOS.", SpreadsheetApp.getUi().ButtonSet.OK); return; }
  const h = getHeaderMap(sh); 
  const r = sh.getActiveCell().getRow();
  if (r < 2) return;
  
  const valor = sh.getRange(r, h['VALOR_TOTAL']).getValue();
  const vF = (typeof valor === 'number') ? "R$ " + valor.toFixed(2).replace('.', ',') : valor;
  const msg = `*SOLICITAÇÃO DE PAGAMENTO*\n*Ref:* ${sh.getRange(r, h['MES_REFERENCIA']).getValue()}\n*Influ:* ${formatarTitleCase(sh.getRange(r, h['INFLU_KEY']).getValue())}\n*Valor:* ${vF}\n*PIX:* ${sh.getRange(r, h['CHAVE_PIX']).getValue()}`;
  
  sh.getRange(r, h['MENSAGEM_PIX']).setValue(msg);
  SpreadsheetApp.getUi().prompt('Copie a mensagem de cobrança (Ctrl+C ou Cmd+C):', msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

function gerarMensagemRevisao() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getActiveSheet();
  const ui = SpreadsheetApp.getUi();
  
  if (sh.getName() !== SETUP.ABAS.FLUXO) {
    ui.alert("Atenção", "Use esta função dentro da aba " + SETUP.ABAS.FLUXO + ".", ui.ButtonSet.OK);
    return;
  }
  
  const row = sh.getActiveCell().getRow();
  if (row < 2) return;
  const influName = sh.getRange(row, 1).getValue();
  if (!influName) return;
  
  const shBase = ss.getSheetByName(SETUP.ABAS.BASE);
  const hBase = getHeaderMap(shBase);
  const dataBase = shBase.getDataRange().getValues();
  const rowBase = dataBase.find(r => String(r[hBase['INFLU_KEY'] - 1]).toUpperCase().trim() === String(influName).toUpperCase().trim());
  
  if (!rowBase) return;
  
  const endereco = rowBase[hBase['INFLUENCIADORA_ENDERECO'] - 1] || "NÃO CADASTRADO";
  const pix = rowBase[hBase['CHAVE_PIX'] - 1] || "NÃO CADASTRADA";
  const msg = `*CONFIRMAÇÃO DE DADOS (ESTÚDIO ELÃ)*\n\nOi, linda! Tudo bem? Passando para confirmar seus dados para o envio dos looks e agendamento financeiro:\n\n *ENDEREÇO:* ${endereco}\n *CHAVE PIX:* ${pix}\n\nEstá certinho? Conseguir me dar o ok? `;
  
  ui.prompt('Copie a mensagem abaixo para enviar no WhatsApp:', msg, ui.ButtonSet.OK);
}

// ======================================================
// 7. INTEGRAÇÕES: LOOKS EXTERNOS & TRACKING DE LOGÍSTICA
// ======================================================
function sincronizarLooks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shBase = ss.getSheetByName(SETUP.ABAS.BASE);
  const shB = ss.getSheetByName(SETUP.ABAS.BRIEFING);
  if (!shBase || !shB) return;
  const hBase = getHeaderMap(shBase);
  const hB = getHeaderMap(shB);
  const dataBase = shBase.getDataRange().getValues();
  const dataB = shB.getDataRange().getValues();
  let contagemSucesso = 0;

  dataBase.forEach(r => {
    let url = r[hBase['INFLU_SHEET_URL']-1];
    if (url && url.toString().includes("docs.google.com") && (r[0] === true || r[0].toString().toUpperCase() === 'ON')) {
      try {
        let ssExterno = SpreadsheetApp.openByUrl(url.toString().trim());
        let shLooks = ssExterno.getSheetByName("LOOKS BRIEFING") || ssExterno.getSheets()[0];
        if (!shLooks) return;
        
        let dadosEx = shLooks.getDataRange().getValues();
        let looks = {};
        dadosEx.forEach(l => { if(l[0]) looks[l[0].toString().toUpperCase().trim()] = l[1]; });
        
        dataB.forEach((rb, idx) => {
          if (rb[0] === r[hBase['INFLU_KEY']-1]) {
            let row = idx + 1;
            if(hB['LOOK_REEL']) shB.getRange(row, hB['LOOK_REEL']).setValue(formatarTitleCase(looks['LOOK_REEL']));
            if(hB['LOOK_CARROSSEL']) shB.getRange(row, hB['LOOK_CARROSSEL']).setValue(formatarTitleCase(looks['LOOK_CARROSSEL']));
            if(hB['LOOK_STORIES_1']) shB.getRange(row, hB['LOOK_STORIES_1']).setValue(formatarTitleCase(looks['LOOK_STORIES_1']));
            if(hB['LOOK_STORIES_2']) shB.getRange(row, hB['LOOK_STORIES_2']).setValue(formatarTitleCase(looks['LOOK_STORIES_2']));
            contagemSucesso++;
          }
        });
      } catch(e){}
    }
  });
  ss.toast(` Sucesso: ${contagemSucesso} influenciadoras tiveram seus looks updated!`);
}

function atualizarRastreiosBRComerce() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SETUP.ABAS.FLUXO);
  if(!sh || sh.getLastRow() < 2) return;
  
  const h = getHeaderMap(sh);
  if(!h['RASTREIO'] || !h['STATUS_LOGISTICA']) return;
  
  const data = sh.getDataRange().getValues();
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    let link = data[i][h['RASTREIO']-1];
    if (!link || !String(link).includes("rastreio/")) continue;
    
    let codigo = String(link).split("rastreio/")[1].trim();
    try {
      let res = UrlFetchApp.fetch("https://api.brcomerce.com.br/tracking/" + codigo, {muteHttpExceptions: true});
      if (res.getResponseCode() === 200) {
        let json = JSON.parse(res.getContentText());
        if (json.correiosRastreio && json.correiosRastreio.length > 0) {
          let last = json.correiosRastreio[json.correiosRastreio.length - 1];
          let txtStatus = (last[0] === "OUTROS" || !last[0]) ? last[1].descricao.toUpperCase() : last[0].toUpperCase();
          
          sh.getRange(i+1, h['STATUS_LOGISTICA']).setValue(txtStatus);
          count++;
        }
      }
    } catch(e) {}
  }
  
  SpreadsheetApp.flush(); 
  arquivarFluxo(true); 
  const hF = getHeaderMap(sh);
  if (hF['DATA_DE_ENVIO']) sh.getRange(2, 1, sh.getLastRow()-1, sh.getLastColumn()).sort({column: hF['DATA_DE_ENVIO'], ascending: true});
  
  ss.toast(` API BRComerce: ${count} objetos rastreados.`, "Logística");
}

// ======================================================
// 8. MOTOR DE ARQUIVAMENTO E LIMPEZA (HISTÓRICOS)
// ======================================================
// ======================================================
// 8b. LIMPEZA DEFINITIVA DO HISTÓRICO OFICIAL (2026-07-06)
// ======================================================
// Decisão do usuário: abandonar o histórico legado — o histórico oficial
// passa a ser construído só a partir dos envios feitos daqui pra frente.
// Ação manual de menu (não roda sozinha, não é automática por onEdit/trigger),
// irreversível — exige confirmação explícita antes de apagar. Mantém o
// cabeçalho (linha 1) e a estrutura das duas abas intactos, só remove as
// linhas de dados. Não toca nenhuma outra aba (BASE DE DADOS, ATIVAÇÕES,
// PAGAMENTOS, abas legado de nome variável, etc. ficam intactas).
function limparHistoricoOficial() {
  const ui = SpreadsheetApp.getUi();
  const resposta = ui.alert(
    '⚠️ Limpar Histórico Oficial',
    'Isso vai APAGAR PERMANENTEMENTE todas as linhas de dados de "' + SETUP.ABAS.HISTORICO_CONT + '" e "' + SETUP.ABAS.HISTORICO_PAG + '" (mantém só o cabeçalho, linha 1). Nenhuma outra aba é afetada. Confirma?',
    ui.ButtonSet.YES_NO
  );
  if (resposta !== ui.Button.YES) {
    ui.alert('Cancelado. Nenhuma linha foi apagada.');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let totalLinhasApagadas = 0;
  [SETUP.ABAS.HISTORICO_CONT, SETUP.ABAS.HISTORICO_PAG].forEach(function (nomeAba) {
    const sh = ss.getSheetByName(nomeAba);
    if (!sh) return;
    const ultimaLinha = sh.getLastRow();
    if (ultimaLinha > 1) {
      totalLinhasApagadas += (ultimaLinha - 1);
      sh.deleteRows(2, ultimaLinha - 1);
    }
  });

  Logger.log('limparHistoricoOficial: %s linha(s) apagada(s) em "%s"/"%s" (executado por %s)',
    totalLinhasApagadas, SETUP.ABAS.HISTORICO_CONT, SETUP.ABAS.HISTORICO_PAG, Session.getActiveUser().getEmail());

  ss.toast(
    totalLinhasApagadas + ' linha(s) apagada(s). Histórico oficial zerado — os próximos envios já geram os novos registros.',
    'Limpeza de Histórico'
  );
}

// ======================================================
// 8c. LIMPEZA DE TRIGGERS ÓRFÃOS (2026-07-06)
// ======================================================
// Achado real via Execution Log (clasp logs): um trigger de tempo instalado
// dispara sincronizarBaseDeApoio() a cada ~10min — função que não existe mais
// no projeto (era do antigo mecanismo de "BASE DE APOIO", removido; ver
// CLAUDE.md seção 6, "Legado já removido"). Gera "Script function not found"
// recorrente há horas, sem nenhum efeito além de poluir o log/consumir cota.
// Ação manual de menu, com confirmação — remove qualquer trigger instalado
// apontando pra função que não existe mais no projeto atual (não é específico
// só de sincronizarBaseDeApoio, cobre qualquer órfão futuro do mesmo tipo).
function limparTriggersOrfaos() {
  const ui = SpreadsheetApp.getUi();
  const triggers = ScriptApp.getProjectTriggers();
  const orfaos = triggers.filter(function (t) {
    const nome = t.getHandlerFunction();
    return typeof globalThis[nome] !== 'function';
  });

  if (orfaos.length === 0) {
    ui.alert('Nenhum trigger órfão encontrado — todos os triggers instalados apontam pra funções que existem no projeto atual.');
    return;
  }

  const nomes = orfaos.map(function (t) { return t.getHandlerFunction(); }).join(', ');
  const resposta = ui.alert(
    'Remover Triggers Órfãos',
    'Encontrado(s) ' + orfaos.length + ' trigger(s) apontando pra função(ões) que não existe(m) mais no projeto: ' + nomes + '. Remover?',
    ui.ButtonSet.YES_NO
  );
  if (resposta !== ui.Button.YES) return;

  orfaos.forEach(function (t) { ScriptApp.deleteTrigger(t); });
  Logger.log('limparTriggersOrfaos: removido(s) %s trigger(s): %s (executado por %s)',
    orfaos.length, nomes, Session.getActiveUser().getEmail());
  ui.alert(orfaos.length + ' trigger(s) removido(s): ' + nomes);
}

function menuArquivarTudo() {
  let m1 = arquivarGenerico(SETUP.ABAS.ATIVACOES, SETUP.ABAS.HISTORICO_CONT, 'STATUS_CONTEUDO', ['postado'], false);
  let m2 = arquivarGenerico(SETUP.ABAS.PAGAMENTOS, SETUP.ABAS.HISTORICO_PAG, 'STATUS_PAGAMENTO', ['pago'], false);
  let m3 = arquivarGenerico(SETUP.ABAS.FLUXO, SETUP.ABAS.HISTORICO_FLUXO, 'STATUS_LOGISTICA', ['entregue', 'entrega realizada', 'objeto entregue'], false);

  let total = m1 + m2 + m3;
  if(total > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(` Faxina concluída! ${total} linhas arquivadas.`, "Limpeza");
  } else {
    SpreadsheetApp.getUi().alert("Nenhum item com status concluído foi encontrado para arquivamento.");
  }
}

function arquivarFluxo(silent) {
  arquivarGenerico(SETUP.ABAS.FLUXO, SETUP.ABAS.HISTORICO_FLUXO, 'STATUS_LOGISTICA', ['entregue', 'entrega realizada', 'objeto entregue'], silent);
}

function arquivarGenerico(orig, dest, colNome, chavesArray, silent) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shO = ss.getSheetByName(orig); const shD = ss.getSheetByName(dest);
  if(!shO || !shD || shO.getLastRow() < 2) return 0;
  
  SpreadsheetApp.flush(); 
  const h = getHeaderMap(shO);
  if(!h[colNome]) return 0; 
  
  const data = shO.getDataRange().getValues();
  let movidos = 0;

  for(let i = data.length - 1; i >= 1; i--) {
    let valorCelula = data[i][h[colNome]-1] ? String(data[i][h[colNome]-1]).toLowerCase() : "";
    let deveArquivar = chavesArray.some(k => valorCelula.includes(k.toLowerCase()));

    if(deveArquivar) {
      let linha = [...data[i]];
      if(h['DATA_PAGAMENTO'] && !linha[h['DATA_PAGAMENTO']-1]) {
        linha[h['DATA_PAGAMENTO']-1] = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
      }
      linha.push(Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm")); 
      
      shD.appendRow(linha); 
      shO.deleteRow(i + 1); 
      movidos++;
    }
  }
  if(movidos > 0 && !silent) ss.toast(`${movidos} itens salvos no histórico de ${orig}.`);
  return movidos;
}

// ======================================================
// 9. AUTOMATIZAÇÃO DE CADASTROS (WEBHOOK FORM / ONFORMSUBMIT)
// ======================================================
function onFormSubmit(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetBase = ss.getSheetByName(SETUP.ABAS.BASE); 
    const sheetCadastros = ss.getSheetByName(SETUP.ABAS.CADASTROS);
    if (!sheetBase || !sheetCadastros) return;
    
    const hBase = getHeaderMap(sheetBase); 
    const hCad = getHeaderMap(sheetCadastros);
    let rowData = (e && e.range) ? e.range.getValues()[0] : sheetCadastros.getRange(sheetCadastros.getLastRow(), 1, 1, sheetCadastros.getLastColumn()).getValues()[0];
    const nova = new Array(sheetBase.getLastColumn()).fill("");
    
    const getV = (str) => { for(let k in hCad) if(k.includes(str)) return rowData[hCad[k]-1] ? String(rowData[hCad[k]-1]).trim() : ""; return ""; };
    
    let [vN, vE, vP, vR, vC, vCep, vNum, vComp] = [getV("CHAMADA"), getV("MAIL"), getV("PIX"), getV("RAZAO"), getV("CNPJ"), getV("CEP"), getV("NUMERO"), getV("COMPLEMENTO")];
    
    if(hBase['INFLU_KEY']) nova[hBase['INFLU_KEY']-1] = vN.toUpperCase();
    if(hBase['EMAIL']) nova[hBase['EMAIL']-1] = vE.toLowerCase();
    if(hBase['INFLUENCIADORA_RAZAO_SOCIAL']) nova[hBase['INFLUENCIADORA_RAZAO_SOCIAL']-1] = vR.toUpperCase();
    if(hBase['INFLUENCIADORA_CNPJ']) nova[hBase['INFLUENCIADORA_CNPJ']-1] = vC ? "'" + vC : "";
    if(hBase['CHAVE_PIX']) nova[hBase['CHAVE_PIX']-1] = vP ? "'" + vP : "";
    
    let rawCep = vCep ? vCep.replace(/\D/g, "") : "";
    if(hBase['CEP']) nova[hBase['CEP']-1] = rawCep ? "'" + rawCep : "";
    if(hBase['NUMERO']) nova[hBase['NUMERO']-1] = vNum ? "'" + vNum : "";
    if(hBase['COMPLEMENTO']) nova[hBase['COMPLEMENTO']-1] = vComp;
    
    if (rawCep && rawCep.length === 8) {
      try {
        let resCep = JSON.parse(UrlFetchApp.fetch("https://brasilapi.com.br/api/cep/v1/" + rawCep, {muteHttpExceptions: true}).getContentText());
        if (resCep.city) {
          if(hBase['RUA']) nova[hBase['RUA']-1] = (resCep.street || "").toUpperCase();
          if(hBase['BAIRRO']) nova[hBase['BAIRRO']-1] = (resCep.neighborhood || "").toUpperCase();
          if(hBase['CIDADE']) nova[hBase['CIDADE']-1] = (resCep.city || "").toUpperCase();
          if(hBase['UF']) nova[hBase['UF']-1] = (resCep.state || "").toUpperCase();
          
          if(hBase['INFLUENCIADORA_ENDERECO']) {
            let cepF = rawCep.substring(0,5) + "-" + rawCep.substring(5);
            let compT = vComp ? ", " + vComp : "";
            nova[hBase['INFLUENCIADORA_ENDERECO']-1] = `${resCep.street || ""}, ${vNum || "S/N"}${compT}, ${resCep.neighborhood || ""} - ${resCep.city || ""}/${resCep.state || ""}, ${cepF}`.toUpperCase();
          }
        }
      } catch(err){}
    }
    nova[0] = "OFF"; 
    sheetBase.appendRow(nova);
    organizarEPintarBase();
  } catch(fatalError) {}
}

// ======================================================
// 11. NOVO MOTOR DE SINCRONIZAÇÃO REVERSA (PORTAL -> MÃE)
// ======================================================
// ======================================================
// 12. METODOS AUXILIARES (ENDEREÇOS, CORES E CONVERSÕES)
// ======================================================
function atualizarEnderecoLinhaSelecionada() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ui = SpreadsheetApp.getUi();
  if (sh.getName() !== SETUP.ABAS.BASE) { ui.alert('Use esta função apenas na aba BASE DE DADOS.'); return; }
  const row = sh.getActiveCell().getRow();
  if (row < 2) return;
  const h = getHeaderMap(sh);
  if(!h['CEP']) return;
  preencherEnderecoPorCEP(sh, row, sh.getRange(row, h['CEP']).getValue(), h);
  SpreadsheetApp.flush();
  ui.alert('Endereço atualizado com sucesso via BrasilAPI!');
}

function preencherEnderecoPorCEP(sh, row, cep, h) {
  if (!cep) return;
  let cleanCep = cep.toString().replace(/\D/g, "");
  if (cleanCep.length !== 8) return;

  try {
    let resp = UrlFetchApp.fetch("https://brasilapi.com.br/api/cep/v1/" + cleanCep, {muteHttpExceptions: true});
    if (resp.getResponseCode() === 200) {
      let res = JSON.parse(resp.getContentText());
      if (res.city) {
        let num = h['NUMERO'] ? sh.getRange(row, h['NUMERO']).getValue() : "S/N";
        if (!num) num = "S/N";
        let comp = h['COMPLEMENTO'] ? sh.getRange(row, h['COMPLEMENTO']).getValue() : "";

        if(h['RUA']) sh.getRange(row, h['RUA']).setValue((res.street || "").toUpperCase());
        if(h['BAIRRO']) sh.getRange(row, h['BAIRRO']).setValue((res.neighborhood || "").toUpperCase());
        if(h['CIDADE']) sh.getRange(row, h['CIDADE']).setValue((res.city || "").toUpperCase());
        if(h['UF']) sh.getRange(row, h['UF']).setValue((res.state || "").toUpperCase());

        let cepFormatado = cleanCep.substring(0,5) + "-" + cleanCep.substring(5);
        let compText = comp ? ", " + comp : "";
        let full = `${res.street || ""}, ${num}${compText}, ${res.neighborhood || ""} - ${res.city || ""}/${res.state || ""}, ${cepFormatado}`;

        if(h['INFLUENCIADORA_ENDERECO']) sh.getRange(row, h['INFLUENCIADORA_ENDERECO']).setValue(full.toUpperCase());
      }
    }
  } catch(e) {}
}

function organizarEPintarBase() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETUP.ABAS.BASE);
  if (!sh || sh.getLastRow() < 2) return; 
  const h = getHeaderMap(sh);
  
  // Ordenação: Status (ON no topo) e depois Nome da Influenciadora
  sh.getRange(2, 1, sh.getLastRow()-1, sh.getLastColumn()).sort([
    {column: 1, ascending: false}, 
    {column: h['INFLU_KEY'] || 2, ascending: true}
  ]);
  
  SpreadsheetApp.flush();
  
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  const data = sh.getRange(2, 1, lastRow - 1, 1).getValues(); // Pega a Coluna A (Status)
  
  // Mapeia as cores linha por linha
  const colors = data.map(r => {
    const status = String(r[0]).toUpperCase().trim();
    const isON = (status === 'ON' || status === 'TRUE' || r[0] === true);
    const color = isON ? SETUP.CORES.ON : SETUP.CORES.OFF;
    return new Array(lastCol).fill(color);
  });
  
  sh.getRange(2, 1, colors.length, lastCol).setBackgrounds(colors);
}

function getHeaderMap(sh) {
  const m = {};
  sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].forEach((v, i) => {
    if (v) m[v.toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "_")] = i + 1;
  });
  return m;
}

// Monta uma linha (array posicional) a partir de um mapa de cabe\u00e7alho e um objeto
// {NOME_CABECALHO: valor} \u2014 robusto \u00e0 ordem real das colunas na aba, evita
// listas literais posicionais que quebram quando a estrutura da aba muda.
function montarLinha(h, campos) {
  const maxCol = Math.max(0, ...Object.values(h));
  const linha = new Array(maxCol).fill('');
  Object.keys(campos).forEach(k => {
    if (h[k]) linha[h[k] - 1] = campos[k];
  });
  return linha;
}

// Extrai {mes, ano} de um texto livre "M\u00caS ANO" (ex: "AGOSTO 2026"). Se o ano
// n\u00e3o vier no texto, assume o ano corrente \u2014 mant\u00e9m compat\u00edvel com quem digitar
// s\u00f3 o nome do m\u00eas por h\u00e1bito.
function parseMesAno(textoBruto) {
  const bruto = (textoBruto || '').trim().toUpperCase();
  const partes = bruto.split(/\s+/);
  const ultimaParte = partes[partes.length - 1];
  if (/^\d{4}$/.test(ultimaParte)) {
    return { mes: partes.slice(0, -1).join(' '), ano: parseInt(ultimaParte, 10) };
  }
  return { mes: bruto, ano: new Date().getFullYear() };
}

function textToNumber(t) {
  if (t === "" || t === null || t === undefined) return 0;
  if (typeof t === 'number') return Math.floor(t);
  let s = String(t).toLowerCase().trim();
  let apenasNumeros = s.replace(/\D/g, "");
  if (apenasNumeros !== "") return parseInt(apenasNumeros, 10);
  if (s.includes("um")) return 1;
  if (s.includes("dois")) return 2;
  if (s.includes("tres") || s.includes("três")) return 3;
  if (s.includes("quatro")) return 4;
  if (s.includes("cinco")) return 5;
  return 0;
}

function formatarTitleCase(t) { 
  return (!t) ? "" : String(t).toLowerCase().split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : "").join(' '); 
}

function setupERP() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert("Setup Estrutural", "Deseja verificar e criar abas de histórico faltantes?", ui.ButtonSet.YES_NO);
  if(response !== ui.Button.YES) return;

  // ATIVACOES/HISTORICO_CONT ganharam ID (UUID estável, substitui número de linha
  // como idAtivacao — corrige corrida em finalizarEnvioResumable) e ANO_REFERENCIA
  // (MES_REFERENCIA sozinho não distingue campanhas do mesmo mês em anos diferentes).
  // PAGAMENTOS/HISTORICO_PAG ganharam só ANO_REFERENCIA (mesmo motivo, sem ID —
  // pagamentos não são resolvidos por ID estável neste momento).
  // Ordem de colunas dos pares live/histórico deve casar 1:1 (arquivarGenerico
  // copia a linha inteira por posição e só acrescenta DATA_ARQUIVAMENTO ao final).
  const estruturas = [
    { nome: SETUP.ABAS.FLUXO, colunas: ["INFLU_KEY", "ENDERECO", "STATUS_REVISAO", "MES_REFERENCIA", "RASTREIO", "DATA_DE_ENVIO", "STATUS_LOGISTICA"] },
    { nome: SETUP.ABAS.HISTORICO_FLUXO, colunas: ["INFLU_KEY", "ENDERECO", "STATUS_REVISAO", "MES_REFERENCIA", "RASTREIO", "DATA_DE_ENVIO", "STATUS_LOGISTICA", "DATA_ARQUIVAMENTO"] },
    { nome: SETUP.ABAS.ATIVACOES, colunas: ["ID", "INFLU_KEY", "MES_REFERENCIA", "ANO_REFERENCIA", "FORMATO", "DATA_APROVACAO", "DATA_ATIVACAO", "STATUS_CONTEUDO", "LINK_ARQUIVO"] },
    { nome: SETUP.ABAS.HISTORICO_CONT, colunas: ["ID", "INFLU_KEY", "MES_REFERENCIA", "ANO_REFERENCIA", "FORMATO", "DATA_APROVACAO", "DATA_ATIVACAO", "STATUS_CONTEUDO", "LINK_ARQUIVO", "DATA_ARQUIVAMENTO"] },
    { nome: SETUP.ABAS.PAGAMENTOS, colunas: ["INFLU_KEY", "MES_REFERENCIA", "ANO_REFERENCIA", "VALOR_TOTAL", "CHAVE_PIX", "STATUS_PAGAMENTO", "DATA_PAGAMENTO", "MENSAGEM_PIX"] },
    { nome: SETUP.ABAS.HISTORICO_PAG, colunas: ["INFLU_KEY", "MES_REFERENCIA", "ANO_REFERENCIA", "VALOR_TOTAL", "CHAVE_PIX", "STATUS_PAGAMENTO", "DATA_PAGAMENTO", "MENSAGEM_PIX", "DATA_ARQUIVAMENTO"] }
  ];

  estruturas.forEach(est => {
    let sheet = ss.getSheetByName(est.nome);
    if (!sheet) {
      sheet = ss.insertSheet(est.nome);
      sheet.getRange(1, 1, 1, est.colunas.length).setValues([est.colunas]).setBackground(SETUP.CORES.CABECALHO).setFontColor(SETUP.CORES.TEXTO_CABECALHO).setFontWeight("bold");
      sheet.setFrozenRows(1); 
    }
  });
  Logger.log("setupERP concluído: estrutura inicial criada");
  ui.alert("Sucesso", "Todas as abas operacionais e históricos mapeados foram verificados!", ui.ButtonSet.OK);
}