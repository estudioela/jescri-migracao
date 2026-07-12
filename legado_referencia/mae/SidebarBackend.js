/**
 * SidebarBackend.gs — RECUPERAÇÃO (Fase 1)
 * Backend de Sidebar.html e SidebarPagamento.html.
 *
 * Essas duas sidebars chamam, via google.script.run:
 *   getListaInfluenciadoras, getDadosInfluenciadora, salvarDadosSidebarV2,
 *   salvarPagamentoExtra
 * Nenhuma dessas funções existia no código-fonte (chamadas órfãs).
 * Reconstruídas aqui com lógica mínima, seguindo o mesmo padrão do
 * restante do ERP (SETUP.ABAS + getHeaderMap, definidos em Código.js).
 *
 * Colunas usadas: CUPOM, VALOR_TOTAL, REELS_TEXTO, CARROSSEL_TEXTO,
 * STORIES_TEXTO e INFLU_SHEET_URL já existem e são usadas em outras
 * funções de Código.js. LOOKS_QTD, CANAIS e PRAZO não têm nenhum uso
 * em outro lugar do código — são lidas/gravadas somente se a coluna
 * existir na aba (mesmo padrão defensivo "if (h['X'])" usado no resto
 * do arquivo), nunca assumidas ou inventadas.
 */

function abrirSidebarInflu() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Dados da Influenciadora');
  SpreadsheetApp.getUi().showSidebar(html);
}

function abrirSidebarPagamento() {
  const html = HtmlService.createHtmlOutputFromFile('SidebarPagamento').setTitle('Pagamento Extra (UGC)');
  SpreadsheetApp.getUi().showSidebar(html);
}

function getListaInfluenciadoras() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETUP.ABAS.BASE);
  if (!sh || sh.getLastRow() < 2) return [];
  const h = getHeaderMap(sh);
  const colNome = h['INFLU_KEY'] || 2;
  const dados = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();

  return dados
    .map(r => {
      const nome = r[colNome - 1];
      if (!nome) return null;
      const status = String(r[0]).toUpperCase().trim();
      const isON = (status === 'ON' || status === 'TRUE' || r[0] === true);
      return isON ? String(nome) : String(nome) + ' (OFF)';
    })
    .filter(Boolean)
    .sort();
}

function getDadosInfluenciadora(nome) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETUP.ABAS.BASE);
  if (!sh) return null;
  const h = getHeaderMap(sh);
  const colNome = h['INFLU_KEY'] || 2;
  const chave = String(nome).trim().toUpperCase();
  const dados = sh.getDataRange().getValues();

  const linha = dados.find((r, i) => i > 0 && String(r[colNome - 1]).trim().toUpperCase() === chave);
  if (!linha) return null;

  const val = campo => (h[campo] ? linha[h[campo] - 1] : "");

  return {
    cupom: val('CUPOM'),
    valor: val('VALOR_TOTAL'),
    qtd_reels: val('REELS_TEXTO'),
    qtd_carrossel: val('CARROSSEL_TEXTO'),
    qtd_stories: val('STORIES_TEXTO'),
    looks_qtd: val('LOOKS_QTD'),
    canais: val('CANAIS'),
    prazo: val('PRAZO'),
    looks: val('INFLU_SHEET_URL')
  };
}

function salvarDadosSidebarV2(obj) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETUP.ABAS.BASE);
  if (!sh) throw new Error('Aba ' + SETUP.ABAS.BASE + ' não encontrada.');
  const h = getHeaderMap(sh);
  const colNome = h['INFLU_KEY'] || 2;
  const chave = String(obj.nomeSelecionado).trim().toUpperCase();
  const dados = sh.getDataRange().getValues();

  const idx = dados.findIndex((r, i) => i > 0 && String(r[colNome - 1]).trim().toUpperCase() === chave);
  if (idx === -1) throw new Error('Influenciadora não encontrada: ' + obj.nomeSelecionado);
  const row = idx + 1;

  const set = (campo, valor) => { if (h[campo] && valor !== undefined) sh.getRange(row, h[campo]).setValue(valor); };

  set('CUPOM', obj.cupom);
  set('VALOR_TOTAL', obj.valor);
  set('REELS_TEXTO', obj.qtd_reels);
  set('CARROSSEL_TEXTO', obj.qtd_carrossel);
  set('STORIES_TEXTO', obj.qtd_stories);
  set('LOOKS_QTD', obj.looks_qtd);
  set('CANAIS', obj.canais);
  set('PRAZO', obj.prazo);
  set('INFLU_SHEET_URL', obj.looks);

  SpreadsheetApp.flush();
}

// FIN-01 (corrigido): esta função gravava MES_REFERENCIA mas NÃO ANO_REFERENCIA.
// A célula ficava vazia, e o efeito só aparecia na tela da parceira, três
// funções adiante: listarPeriodos() gerava a chave "AGOSTO|" (ano null),
// distinta de "AGOSTO|2026" — dois períodos no seletor do Portal para o mesmo
// mês. Pior: ao selecionar o período de ano null, getPagamentos() avalia
// `!anoFiltro` e DESLIGA o filtro de ano, somando todos os agostos de todos os
// anos; e o pagamento extra sumia do período correto.
//
// O ano vem de parseMesAno() (Código.js) sobre o mesmo texto livre digitado na
// sidebar ("Mês ou Campanha"): "AGOSTO 2026" → {AGOSTO, 2026}; "AGOSTO" → ano
// corrente (RN-09, o mesmo contrato que gerarNovoMesCompleto/
// lancarPagamentosDoMes já usam). MES_REFERENCIA passa a gravar o mês
// normalizado por parseMesAno, senão "AGOSTO 2026" viraria um mês literal que
// não casa com o "AGOSTO" das outras portas de entrada.
//
// obj.ano é respeitado se a sidebar passar a enviá-lo — hoje não envia.
function salvarPagamentoExtra(obj) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETUP.ABAS.PAGAMENTOS);
  if (!sh) throw new Error('Aba ' + SETUP.ABAS.PAGAMENTOS + ' não encontrada.');
  const h = getHeaderMap(sh);

  const periodo = parseMesAno(obj.mes);
  const ano = obj.ano ? parseInt(obj.ano, 10) : periodo.ano;

  const linha = new Array(sh.getLastColumn()).fill("");
  const set = (campo, valor) => { if (h[campo]) linha[h[campo] - 1] = valor; };

  set('INFLU_KEY', obj.influ);
  set('MES_REFERENCIA', periodo.mes);
  set('ANO_REFERENCIA', ano);
  set('VALOR_TOTAL', obj.valor);
  set('CHAVE_PIX', obj.pix);
  set('STATUS_PAGAMENTO', 'em aberto');

  sh.appendRow(linha);
  SpreadsheetApp.flush();
  Logger.log('salvarPagamentoExtra: influ=%s mes=%s ano=%s (bruto="%s")', obj.influ, periodo.mes, ano, obj.mes);
}
