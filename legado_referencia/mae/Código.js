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
      .addItem(" 8. Remover Triggers Órfãos", "limparTriggersOrfaos")
      .addItem(" 9. Adicionar Coluna ANO_REFERENCIA em Briefing", "garantirColunaAnoReferenciaBriefing")
      .addItem(" 10. Adicionar Colunas ID/ANO em Ativações", "garantirColunasIdAnoAtivacoes")
      .addItem(" 11. Preencher ANO_REFERENCIA em Pagamentos", "backfillAnoReferenciaPagamentos"))

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
    if (hBrief['ANO_REFERENCIA']) briefingSheet.getRange(rowBrief, hBrief['ANO_REFERENCIA']).setValue(anoTarget);

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
        colDestino = h['APROVACAO_REEL'];
      } else if (colHeader.includes("CARROSSEL") && !colHeader.includes("APROVACAO")) {
        colDestino = h['APROVACAO_CARROSSEL'];
      } else if ((colHeader.includes("STORIES_1") || (colHeader.includes("STORIES") && !colHeader.includes("2"))) && !colHeader.includes("APROVACAO")) {
        colDestino = h['APROVACAO_STORIES_1'] || h['APROVACAO_STORIES'];
      } else if (colHeader.includes("STORIES_2") && !colHeader.includes("APROVACAO")) {
        colDestino = h['APROVACAO_STORIES_2'];
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
          let anoRef = h['ANO_REFERENCIA'] ? String(sh.getRange(row, h['ANO_REFERENCIA']).getValue()).trim() : "";

          let briefSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETUP.ABAS.BRIEFING);
          if (briefSheet) {
            let hBrief = getHeaderMap(briefSheet);
            let dataBrief = briefSheet.getDataRange().getValues();

            // Casamento por MES + ANO_REFERENCIA (coluna nova em BRIEFING, ver
            // garantirColunaAnoReferenciaBriefing()) — duas campanhas do mesmo
            // MES em anos diferentes não podem colidir. Compatibilidade: se a
            // célula ANO_REFERENCIA da linha de BRIEFING estiver vazia (ou a
            // coluna ainda não existir), essa linha "casa com qualquer ano"
            // (comportamento legado preservado).
            let idxBrief = dataBrief.findIndex(rb => {
              let rowInflu = (hBrief['INFLU_KEY'] ? rb[hBrief['INFLU_KEY']-1] : "") || "";
              let rowMes = (hBrief['MES'] ? rb[hBrief['MES']-1] : "") || "";
              if (String(rowInflu).trim().toUpperCase() !== influKey || String(rowMes).trim().toUpperCase() !== mesRef) return false;
              let rowAnoBruto = hBrief['ANO_REFERENCIA'] ? rb[hBrief['ANO_REFERENCIA']-1] : "";
              let rowAno = (rowAnoBruto === null || rowAnoBruto === undefined) ? "" : String(rowAnoBruto).trim();
              if (rowAno === "") return true;
              return anoRef !== "" && rowAno === anoRef;
            });
            
            if (idxBrief !== -1) {
              let rowTargetBrief = idxBrief + 1;
              if (formato === 'STORIES') formato = 'STORIES_1'; 
              let nomeColBrief = 'APROVACAO_' + formato; 
              
              let colBriefDest = hBrief[nomeColBrief];

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
  } catch(err) {
    Logger.log('onEdit: erro nao tratado (aba=%s, linha=%s, coluna=%s): %s',
      e.range.getSheet().getName(), e.range.getRow(), e.range.getColumn(), (err && err.message) || err);
  }
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

  // Sem Session.getActiveUser().getEmail() aqui: o manifest usa oauthScopes
  // explícitos SEM userinfo.email, e a chamada lança erro de permissão.
  Logger.log('limparHistoricoOficial: %s linha(s) apagada(s) em "%s"/"%s"',
    totalLinhasApagadas, SETUP.ABAS.HISTORICO_CONT, SETUP.ABAS.HISTORICO_PAG);

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
  Logger.log('limparTriggersOrfaos: removido(s) %s trigger(s): %s', orfaos.length, nomes);
  ui.alert(orfaos.length + ' trigger(s) removido(s): ' + nomes);
}

// ======================================================
// 8d. GARANTIR COLUNA ANO_REFERENCIA EM BRIEFING (2026-07-07)
// ======================================================
// Necessária para o casamento de propagação de DATA_APROVACAO (onEdit(),
// bloco ATIVAÇÕES/DATA_ATIVACAO) distinguir campanhas do mesmo MES em anos
// diferentes na aba BRIEFING. Ação manual de menu, idempotente e
// não-destrutiva — se a coluna já existir, não faz nada; se não existir,
// pede confirmação (mesmo padrão de limparHistoricoOficial()/
// limparTriggersOrfaos()) e a adiciona como a última coluna do cabeçalho,
// sem apagar ou reordenar nenhum dado existente.
function garantirColunaAnoReferenciaBriefing() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SETUP.ABAS.BRIEFING);
  if (!sh) {
    ui.alert('Aba "' + SETUP.ABAS.BRIEFING + '" não encontrada — nenhuma coluna foi criada.');
    return;
  }

  const h = getHeaderMap(sh);
  if (h['ANO_REFERENCIA']) {
    ui.alert('A coluna ANO_REFERENCIA já existe em "' + SETUP.ABAS.BRIEFING + '" — nada a fazer.');
    return;
  }

  const resposta = ui.alert(
    'Adicionar Coluna ANO_REFERENCIA',
    'Isso vai adicionar a coluna ANO_REFERENCIA como a última coluna do cabeçalho de "' + SETUP.ABAS.BRIEFING + '", sem apagar ou reordenar nenhum dado existente. Confirma?',
    ui.ButtonSet.YES_NO
  );
  if (resposta !== ui.Button.YES) {
    ui.alert('Cancelado. Nenhuma coluna foi criada.');
    return;
  }

  const novaCol = sh.getLastColumn() + 1;
  sh.getRange(1, novaCol).setValue('ANO_REFERENCIA');
  Logger.log('garantirColunaAnoReferenciaBriefing: coluna ANO_REFERENCIA criada em "%s"', SETUP.ABAS.BRIEFING);
  ui.alert('Coluna ANO_REFERENCIA criada com sucesso em "' + SETUP.ABAS.BRIEFING + '".');
}

// Migração manual (menu, idempotente, não-destrutiva): cria as colunas ID e
// ANO_REFERENCIA em ATIVAÇÕES e HISTÓRICO DE CONTEÚDOS (se faltarem) e
// preenche APENAS células vazias — ID novo (UUID) por ativação, ano derivado
// das datas da própria linha. Sem essas colunas na planilha viva, dois
// mecanismos do código ficam inertes (caem em fallback): a resolução de linha
// por ID estável no upload (encontrarLinhaAtivacaoPorId cai no modo ROWn) e o
// casamento BRIEFING por MES+ANO_REFERENCIA. Mudança de estrutura da planilha
// não é sincronizável por clasp push — por isso é ação manual de menu.
function garantirColunasIdAnoAtivacoes() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shAtiv = ss.getSheetByName(SETUP.ABAS.ATIVACOES);
  if (!shAtiv) {
    ui.alert('Aba "' + SETUP.ABAS.ATIVACOES + '" não encontrada — nada foi alterado.');
    return;
  }
  const shHist = ss.getSheetByName(SETUP.ABAS.HISTORICO_CONT);

  const resposta = ui.alert(
    'Adicionar Colunas ID / ANO_REFERENCIA em Ativações',
    'Isso vai:\n' +
    '1) criar as colunas ID e ANO_REFERENCIA (se faltarem) em "' + SETUP.ABAS.ATIVACOES + '"' +
    (shHist ? ' e "' + SETUP.ABAS.HISTORICO_CONT + '"' : '') + ';\n' +
    '2) preencher APENAS células vazias dessas colunas (ID novo por ativação; ano derivado das datas da própria linha).\n\n' +
    'Nenhum dado existente é apagado ou sobrescrito. Confirma?',
    ui.ButtonSet.YES_NO
  );
  if (resposta !== ui.Button.YES) {
    ui.alert('Cancelado. Nada foi alterado.');
    return;
  }

  let criadas = garantirColunasNaAba_(shAtiv, ['ID', 'ANO_REFERENCIA']);
  if (shHist) criadas = criadas.concat(garantirColunasNaAba_(shHist, ['ID', 'ANO_REFERENCIA']));

  // Só ATIVAÇÕES ganha ID retroativo: é a chave estável usada pelo upload do
  // Portal. Linhas já arquivadas não são referenciadas por ID — ficam sem.
  const preenchidasAtiv = backfillIdAnoAba_(shAtiv, true);
  const preenchidasHist = shHist ? backfillIdAnoAba_(shHist, false) : 0;

  Logger.log('garantirColunasIdAnoAtivacoes: colunas criadas=[%s], backfill ativacoes=%s linhas, historico=%s linhas',
    criadas.join(', ') || 'nenhuma', preenchidasAtiv, preenchidasHist);
  ui.alert(
    'Migração concluída.\n\n' +
    'Colunas criadas: ' + (criadas.length ? criadas.join(', ') : 'nenhuma (já existiam)') + '.\n' +
    'Linhas preenchidas em "' + SETUP.ABAS.ATIVACOES + '": ' + preenchidasAtiv + '.\n' +
    (shHist ? 'Linhas preenchidas em "' + SETUP.ABAS.HISTORICO_CONT + '": ' + preenchidasHist + '.' : '')
  );
}

function garantirColunasNaAba_(sh, nomes) {
  const criadas = [];
  nomes.forEach(function (nome) {
    // Header map relido a cada coluna: getLastColumn muda após cada criação.
    const h = getHeaderMap(sh);
    if (!h[nome]) {
      sh.getRange(1, sh.getLastColumn() + 1).setValue(nome);
      criadas.push(sh.getName() + ':' + nome);
    }
  });
  return criadas;
}

function backfillIdAnoAba_(sh, gerarIdNovo) {
  const h = getHeaderMap(sh);
  if (sh.getLastRow() < 2) return 0;
  const dados = sh.getDataRange().getValues();
  let alteradas = 0;
  for (let i = 1; i < dados.length; i++) {
    let mudou = false;
    if (gerarIdNovo && h['ID'] && !dados[i][h['ID'] - 1]) {
      sh.getRange(i + 1, h['ID']).setValue(Utilities.getUuid());
      mudou = true;
    }
    if (h['ANO_REFERENCIA'] && !dados[i][h['ANO_REFERENCIA'] - 1]) {
      const ano = derivarAnoDaLinha_(dados[i], h);
      if (ano) {
        sh.getRange(i + 1, h['ANO_REFERENCIA']).setValue(ano);
        mudou = true;
      }
    }
    if (mudou) alteradas++;
  }
  return alteradas;
}

// Melhor sinal de data disponível na própria linha. Em abas históricas (têm
// DATA_ARQUIVAMENTO no cabeçalho), NÃO chuta ano corrente quando nenhuma data
// é aproveitável — deixa vazio (comportamento legado: casa com qualquer ano).
// Na aba viva, sem data preenchida = campanha corrente → ano corrente.
function derivarAnoDaLinha_(linha, h) {
  const ordem = ['DATA_ARQUIVAMENTO', 'DATA_APROVACAO', 'DATA_ATIVACAO'];
  for (let k = 0; k < ordem.length; k++) {
    if (h[ordem[k]]) {
      const v = linha[h[ordem[k]] - 1];
      if (v instanceof Date && !isNaN(v.getTime())) return v.getFullYear();
      if (typeof v === 'string') {
        const m = /(\d{4})/.exec(v);
        if (m) return parseInt(m[1], 10);
      }
    }
  }
  return h['DATA_ARQUIVAMENTO'] ? null : new Date().getFullYear();
}

// ======================================================
// BACKFILL DE ANO_REFERENCIA EM PAGAMENTOS (FIN-01)
// ======================================================

// Ação manual, idempotente e não-destrutiva. Corrige as linhas já gravadas por
// salvarPagamentoExtra() antes da correção de FIN-01, que ficaram com
// ANO_REFERENCIA vazio e produzem um período fantasma no seletor do Portal.
//
// Preenche APENAS células vazias. Nunca sobrescreve um ano já gravado.
function backfillAnoReferenciaPagamentos() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shPag = ss.getSheetByName(SETUP.ABAS.PAGAMENTOS);
  if (!shPag) {
    ui.alert('Aba "' + SETUP.ABAS.PAGAMENTOS + '" não encontrada — nada foi alterado.');
    return;
  }
  const shHist = ss.getSheetByName(SETUP.ABAS.HISTORICO_PAG);

  const resposta = ui.alert(
    'Preencher ANO_REFERENCIA em Pagamentos',
    'Isso vai:\n' +
    '1) criar a coluna ANO_REFERENCIA (se faltar) em "' + SETUP.ABAS.PAGAMENTOS + '"' +
    (shHist ? ' e "' + SETUP.ABAS.HISTORICO_PAG + '"' : '') + ';\n' +
    '2) preencher APENAS células vazias dessa coluna.\n\n' +
    'Em "' + SETUP.ABAS.PAGAMENTOS + '" (aba viva): usa o ano de DATA_PAGAMENTO; sem data, o ano corrente.\n' +
    (shHist ? 'Em "' + SETUP.ABAS.HISTORICO_PAG + '" (histórico): usa o ano de DATA_PAGAMENTO; sem data, DEIXA VAZIO — não se chuta ano em registro financeiro passado.\n' : '') +
    '\nNenhum dado existente é apagado ou sobrescrito. Confirma?',
    ui.ButtonSet.YES_NO
  );
  if (resposta !== ui.Button.YES) {
    ui.alert('Cancelado. Nada foi alterado.');
    return;
  }

  let criadas = garantirColunasNaAba_(shPag, ['ANO_REFERENCIA']);
  if (shHist) criadas = criadas.concat(garantirColunasNaAba_(shHist, ['ANO_REFERENCIA']));

  const resPag = backfillAnoPagamentosAba_(shPag);
  const resHist = shHist ? backfillAnoPagamentosAba_(shHist) : { preenchidas: 0, semSinal: 0 };

  Logger.log('backfillAnoReferenciaPagamentos: colunas criadas=[%s], pagamentos=%s preenchidas/%s sem sinal, historico=%s preenchidas/%s sem sinal',
    criadas.join(', ') || 'nenhuma', resPag.preenchidas, resPag.semSinal, resHist.preenchidas, resHist.semSinal);

  ui.alert(
    'Backfill concluído.\n\n' +
    'Colunas criadas: ' + (criadas.length ? criadas.join(', ') : 'nenhuma (já existiam)') + '.\n' +
    'Linhas preenchidas em "' + SETUP.ABAS.PAGAMENTOS + '": ' + resPag.preenchidas + '.\n' +
    (shHist
      ? 'Linhas preenchidas em "' + SETUP.ABAS.HISTORICO_PAG + '": ' + resHist.preenchidas + '.\n' +
        'Linhas deixadas VAZIAS no histórico (sem data aproveitável): ' + resHist.semSinal + '.\n' +
        (resHist.semSinal > 0
          ? '\nEssas linhas continuam casando com qualquer ano (comportamento legado) e ainda podem gerar um período sem ano no Portal. Preencher à mão, se souber o ano da campanha.'
          : '')
      : '')
  );
}

function backfillAnoPagamentosAba_(sh) {
  const h = getHeaderMap(sh);
  if (!h['ANO_REFERENCIA'] || sh.getLastRow() < 2) return { preenchidas: 0, semSinal: 0 };

  const dados = sh.getDataRange().getValues();
  let preenchidas = 0;
  let semSinal = 0;

  for (let i = 1; i < dados.length; i++) {
    if (dados[i][h['ANO_REFERENCIA'] - 1]) continue;        // nunca sobrescreve
    if (!temConteudoDeLinha_(dados[i])) continue;           // linha em branco no fim da aba

    const ano = derivarAnoPagamento_(dados[i], h);
    if (ano) {
      sh.getRange(i + 1, h['ANO_REFERENCIA']).setValue(ano);
      preenchidas++;
    } else {
      semSinal++;
    }
  }
  return { preenchidas: preenchidas, semSinal: semSinal };
}

// Deliberadamente NÃO reusa derivarAnoDaLinha_(): aquele prioriza
// DATA_ARQUIVAMENTO, que para pagamentos é a data em que a linha foi movida
// para o histórico — não o ano da campanha. Um pagamento de DEZEMBRO/2025 pago
// e arquivado em JANEIRO/2026 derivaria 2026, corrompendo o período.
//
// Aqui o único sinal aceito é DATA_PAGAMENTO. Se não houver:
//   - aba viva (sem DATA_ARQUIVAMENTO no cabeçalho) → ano corrente: a linha é
//     do ciclo em aberto, mesmo contrato de RN-09/parseMesAno;
//   - aba histórica → null. Não se chuta ano em registro financeiro passado
//     (CLAUDE.md §12.4.6). Vazio mantém o comportamento legado "casa com
//     qualquer ano", que é o de hoje — sem regressão.
function derivarAnoPagamento_(linha, h) {
  if (h['DATA_PAGAMENTO']) {
    const v = linha[h['DATA_PAGAMENTO'] - 1];
    if (v instanceof Date && !isNaN(v.getTime())) return v.getFullYear();
    if (typeof v === 'string') {
      const m = /(\d{4})/.exec(v);
      if (m) return parseInt(m[1], 10);
    }
  }
  return h['DATA_ARQUIVAMENTO'] ? null : new Date().getFullYear();
}

function temConteudoDeLinha_(linha) {
  return linha.some(function (c) { return c !== '' && c !== null && c !== undefined; });
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

  // Cópia por NOME de cabeçalho (origem→destino), não por posição: os pares
  // aba-viva/histórico divergem em colunas (ex.: ATIVAÇÕES tem LINK_ARQUIVO
  // na posição em que HISTÓRICO DE CONTEÚDOS tem DATA_ARQUIVAMENTO) — a cópia
  // posicional antiga gravava valores na coluna errada do destino nesses
  // casos. Colunas da origem sem correspondente no destino são descartadas;
  // colunas do destino sem correspondente na origem ficam vazias. Se o
  // destino não tiver cabeçalho (aba recém-criada, vazia), cai no
  // comportamento posicional antigo.
  const hD = getHeaderMap(shD);
  const temCabecalhoDestino = Object.keys(hD).length > 0;
  const numColsD = shD.getLastColumn();

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
      const carimbo = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");

      let destino;
      if (temCabecalhoDestino) {
        destino = new Array(numColsD).fill("");
        Object.keys(h).forEach(function (nomeCol) {
          if (hD[nomeCol]) destino[hD[nomeCol]-1] = linha[h[nomeCol]-1];
        });
        if (hD['DATA_ARQUIVAMENTO']) destino[hD['DATA_ARQUIVAMENTO']-1] = carimbo;
        else destino.push(carimbo);
      } else {
        destino = linha;
        destino.push(carimbo);
      }

      shD.appendRow(destino);
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
    
    // onFormSubmit roda por trigger INSTALÁVEL, que tem autorização para
    // UrlFetchApp — ao contrário do onEdit simples (ver V-03).
    const endereco = resolverEnderecoPorCep(normalizarCep(rawCep), 'onFormSubmit influ=' + vN);
    if (endereco) {
      if(hBase['RUA']) nova[hBase['RUA']-1] = endereco.rua;
      if(hBase['BAIRRO']) nova[hBase['BAIRRO']-1] = endereco.bairro;
      if(hBase['CIDADE']) nova[hBase['CIDADE']-1] = endereco.cidade;
      if(hBase['UF']) nova[hBase['UF']-1] = endereco.uf;

      if(hBase['INFLUENCIADORA_ENDERECO']) {
        nova[hBase['INFLUENCIADORA_ENDERECO']-1] = montarEnderecoCompleto({
          rua: endereco.rua, numero: vNum, complemento: vComp,
          bairro: endereco.bairro, cidade: endereco.cidade, uf: endereco.uf, cep: rawCep
        });
      }
    }
    nova[0] = "OFF";
    sheetBase.appendRow(nova);
    organizarEPintarBase();
  } catch(fatalError) {
    Logger.log('onFormSubmit: erro fatal nao tratado: %s', (fatalError && fatalError.message) || fatalError);
  }
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

// ======================================================
// ENDERECO SERVICE — única porta para a brasilapi (V-03)
// ======================================================
//
// A montagem do endereço estava DUPLICADA, com a mesma string de formatação
// escrita duas vezes, em onFormSubmit() e preencherEnderecoPorCEP(). Unificada
// aqui. updatePerfil() (WebApp.js) passa a usar as mesmas funções — no Apps
// Script todos os arquivos compartilham o namespace global, como getHeaderMap()
// já demonstra.

const CEP_API_URL = "https://brasilapi.com.br/api/cep/v1/";

function normalizarCep(cep) {
  const limpo = (cep === null || cep === undefined) ? "" : cep.toString().replace(/\D/g, "");
  return limpo.length === 8 ? limpo : "";
}

// Devolve {rua, bairro, cidade, uf} ou null. NUNCA lança e NUNCA escreve.
//
// Atenção: chamada a partir de onEdit() (trigger simples), UrlFetchApp lança
// erro de autorização — triggers simples não têm esse escopo. É a causa raiz de
// V-03. O erro cai no catch abaixo e agora aparece no Logger, em vez de sumir
// num catch vazio: a primeira evidência real do problema no Execution Log.
function resolverEnderecoPorCep(cepNormalizado, contexto) {
  if (!cepNormalizado) return null;
  try {
    const resp = UrlFetchApp.fetch(CEP_API_URL + cepNormalizado, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) {
      Logger.log('resolverEnderecoPorCep: HTTP %s para cep=%s (%s)', resp.getResponseCode(), cepNormalizado, contexto || '-');
      return null;
    }
    const res = JSON.parse(resp.getContentText());
    if (!res.city) return null;
    return {
      rua: (res.street || "").toUpperCase(),
      bairro: (res.neighborhood || "").toUpperCase(),
      cidade: (res.city || "").toUpperCase(),
      uf: (res.state || "").toUpperCase()
    };
  } catch (e) {
    Logger.log('resolverEnderecoPorCep: falha para cep=%s (%s): %s', cepNormalizado, contexto || '-', (e && e.message) || e);
    return null;
  }
}

// PURA. Formato preservado byte a byte do que as duas funções montavam antes.
function montarEnderecoCompleto(partes) {
  const cep = normalizarCep(partes.cep);
  const cepFormatado = cep ? (cep.substring(0, 5) + "-" + cep.substring(5)) : "";
  const numero = partes.numero ? partes.numero.toString() : "S/N";
  const complemento = partes.complemento ? ", " + partes.complemento : "";
  return `${partes.rua || ""}, ${numero}${complemento}, ${partes.bairro || ""} - ${partes.cidade || ""}/${partes.uf || ""}, ${cepFormatado}`.toUpperCase();
}

function preencherEnderecoPorCEP(sh, row, cep, h) {
  const cepNormalizado = normalizarCep(cep);
  if (!cepNormalizado) return;

  const endereco = resolverEnderecoPorCep(cepNormalizado, 'preencherEnderecoPorCEP row=' + row);
  if (!endereco) return;

  try {
    const numero = h['NUMERO'] ? sh.getRange(row, h['NUMERO']).getValue() : "";
    const complemento = h['COMPLEMENTO'] ? sh.getRange(row, h['COMPLEMENTO']).getValue() : "";

    if (h['RUA']) sh.getRange(row, h['RUA']).setValue(endereco.rua);
    if (h['BAIRRO']) sh.getRange(row, h['BAIRRO']).setValue(endereco.bairro);
    if (h['CIDADE']) sh.getRange(row, h['CIDADE']).setValue(endereco.cidade);
    if (h['UF']) sh.getRange(row, h['UF']).setValue(endereco.uf);
    if (h['INFLUENCIADORA_ENDERECO']) {
      sh.getRange(row, h['INFLUENCIADORA_ENDERECO']).setValue(montarEnderecoCompleto({
        rua: endereco.rua, numero: numero, complemento: complemento,
        bairro: endereco.bairro, cidade: endereco.cidade, uf: endereco.uf, cep: cepNormalizado
      }));
    }
  } catch (e) {
    // L-06: era `catch(e){}` vazio — um dos dois últimos de Código.js que
    // ficaram de fora do endurecimento de 2026-07-07.
    Logger.log('preencherEnderecoPorCEP: falha ao gravar endereço na linha %s: %s', row, (e && e.message) || e);
  }
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