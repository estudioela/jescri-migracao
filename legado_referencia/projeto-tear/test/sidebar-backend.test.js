/**
 * Primeira cobertura de mae/SidebarBackend.js.
 *
 * Até aqui, NENHUM teste carregava este arquivo (docs/auditoria/
 * 01_gestao_parceiros.md §5.4; 05_operacao_financeira.md §5.5) — e é
 * exatamente onde vivem FIN-01 (🔴 crítico) e V-05. Não é coincidência: as
 * áreas com os achados mais graves são as três sem rede de segurança.
 *
 * Este arquivo é `[Legado Compartilhado]`: dois bounded contexts convivendo
 * num arquivo só, sem funções misturadas. Gestão de Parceiros
 * (getListaInfluenciadoras, getDadosInfluenciadora, salvarDadosSidebarV2) e
 * Operação Financeira (salvarPagamentoExtra). A separação é a Onda 3.8; aqui
 * só se constrói a rede.
 *
 * SidebarBackend.js depende de SETUP e getHeaderMap, definidos em Código.js —
 * no Apps Script os dois compartilham o namespace global, então os dois são
 * carregados no mesmo contexto vm.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const { criarAbaFake, criarSpreadsheetAppFake } = require('./helpers/gasServiceMocks');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');
const SIDEBAR_PATH = path.join(__dirname, '..', 'mae', 'SidebarBackend.js');

function carregar(abasPorNome) {
  return loadGasFiles([CODIGO_PATH, SIDEBAR_PATH], {
    SpreadsheetApp: criarSpreadsheetAppFake(abasPorNome),
    Logger: { log() {} }
  });
}

const CAB_BASE = ['STATUS', 'INFLU_KEY', 'CUPOM', 'VALOR_TOTAL', 'CHAVE_PIX', 'REELS_TEXTO', 'CARROSSEL_TEXTO', 'STORIES_TEXTO', 'INFLU_SHEET_URL'];
const CAB_PAGAMENTOS = ['INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'VALOR_TOTAL', 'CHAVE_PIX', 'STATUS_PAGAMENTO', 'DATA_PAGAMENTO'];

const iAno = CAB_PAGAMENTOS.indexOf('ANO_REFERENCIA');
const iMes = CAB_PAGAMENTOS.indexOf('MES_REFERENCIA');
const iInflu = CAB_PAGAMENTOS.indexOf('INFLU_KEY');
const iStatus = CAB_PAGAMENTOS.indexOf('STATUS_PAGAMENTO');

function baseComDuas() {
  return criarAbaFake([
    CAB_BASE,
    ['ON', 'FULANA', 'CUPOM10', 1500, 'fulana@pix', '2', '1', '3', 'http://docs/1'],
    ['OFF', 'BELTRANA', 'CUPOM20', 900, 'beltrana@pix', '1', '0', '2', '']
  ]);
}

describe('SidebarBackend — getListaInfluenciadoras (Gestão de Parceiros)', () => {
  test('marca as inativas com sufixo " (OFF)" e ordena', () => {
    const { getListaInfluenciadoras } = carregar({ 'BASE DE DADOS': baseComDuas() });

    expect(getListaInfluenciadoras()).toEqual(['BELTRANA (OFF)', 'FULANA']);
  });

  test('flag ON aceita booleano true e a string "TRUE" (V-04: lida por posição, r[0])', () => {
    const aba = criarAbaFake([
      CAB_BASE,
      [true, 'BOOLEANA', '', '', '', '', '', '', ''],
      ['TRUE', 'STRINGONA', '', '', '', '', '', '', '']
    ]);
    const { getListaInfluenciadoras } = carregar({ 'BASE DE DADOS': aba });

    expect(getListaInfluenciadoras()).toEqual(['BOOLEANA', 'STRINGONA']);
  });

  test('aba ausente ou só com cabeçalho devolve lista vazia', () => {
    expect(carregar({}).getListaInfluenciadoras()).toEqual([]);
    expect(carregar({ 'BASE DE DADOS': criarAbaFake([CAB_BASE]) }).getListaInfluenciadoras()).toEqual([]);
  });
});

describe('SidebarBackend — getDadosInfluenciadora (Gestão de Parceiros)', () => {
  test('resolve por INFLU_KEY, case-insensitive, e devolve os campos por nome', () => {
    const { getDadosInfluenciadora } = carregar({ 'BASE DE DADOS': baseComDuas() });

    expect(getDadosInfluenciadora(' fulana ')).toMatchObject({
      cupom: 'CUPOM10',
      valor: 1500,
      qtd_reels: '2',
      looks: 'http://docs/1'
    });
  });

  test('coluna inexistente vira string vazia, nunca undefined', () => {
    const { getDadosInfluenciadora } = carregar({ 'BASE DE DADOS': baseComDuas() });

    // LOOKS_QTD / CANAIS / PRAZO não existem no cabeçalho — dados órfãos (L-05).
    expect(getDadosInfluenciadora('FULANA').looks_qtd).toBe('');
    expect(getDadosInfluenciadora('FULANA').canais).toBe('');
  });

  test('V-05: o sufixo " (OFF)" da lista NÃO é removido aqui — selecionar uma inativa devolve null', () => {
    // getListaInfluenciadoras() devolve 'BELTRANA (OFF)'; passar essa string de
    // volta para cá não casa com nenhuma INFLU_KEY. A string de apresentação
    // carrega o estado, e o backend não sabe disso. Comportamento atual,
    // caracterizado — não corrigido neste PR.
    const { getListaInfluenciadoras, getDadosInfluenciadora } = carregar({ 'BASE DE DADOS': baseComDuas() });
    const rotuloDaLista = getListaInfluenciadoras()[0];

    expect(rotuloDaLista).toBe('BELTRANA (OFF)');
    expect(getDadosInfluenciadora(rotuloDaLista)).toBeNull();
    expect(getDadosInfluenciadora('BELTRANA')).not.toBeNull();
  });
});

describe('SidebarBackend — salvarDadosSidebarV2 (Gestão de Parceiros)', () => {
  test('grava só os campos definidos, resolvendo coluna por nome', () => {
    const base = baseComDuas();
    const { salvarDadosSidebarV2 } = carregar({ 'BASE DE DADOS': base });

    salvarDadosSidebarV2({ nomeSelecionado: 'FULANA', cupom: 'NOVOCUPOM', valor: 2000 });

    expect(base._linhas[1][CAB_BASE.indexOf('CUPOM')]).toBe('NOVOCUPOM');
    expect(base._linhas[1][CAB_BASE.indexOf('VALOR_TOTAL')]).toBe(2000);
    expect(base._linhas[1][CAB_BASE.indexOf('CHAVE_PIX')]).toBe('fulana@pix'); // intacto
  });

  test('influenciadora inexistente lança, em vez de gravar na linha errada', () => {
    const { salvarDadosSidebarV2 } = carregar({ 'BASE DE DADOS': baseComDuas() });

    expect(() => salvarDadosSidebarV2({ nomeSelecionado: 'NINGUEM' })).toThrow(/não encontrada/i);
  });
});

describe('SidebarBackend — salvarPagamentoExtra (Operação Financeira)', () => {
  test('acrescenta uma linha em PAGAMENTOS, sempre com status "em aberto" (RN-25)', () => {
    const pagamentos = criarAbaFake([CAB_PAGAMENTOS]);
    const { salvarPagamentoExtra } = carregar({ PAGAMENTOS: pagamentos });

    salvarPagamentoExtra({ influ: 'FULANA', mes: 'AGOSTO', valor: 500, pix: 'fulana@pix' });

    expect(pagamentos._linhas).toHaveLength(2);
    const nova = pagamentos._linhas[1];
    expect(nova[iInflu]).toBe('FULANA');
    expect(nova[iMes]).toBe('AGOSTO');
    expect(nova[iStatus]).toBe('em aberto');
  });

  test('aba PAGAMENTOS ausente lança', () => {
    const { salvarPagamentoExtra } = carregar({});

    expect(() => salvarPagamentoExtra({ influ: 'X' })).toThrow(/não encontrada/i);
  });

  /**
   * FIN-01 (🔴 crítico) — CORRIGIDO neste PR.
   *
   * Antes, a célula ANO_REFERENCIA ficava vazia e o dado corrompido se
   * propagava até a tela da parceira:
   *
   *   listarPeriodos()  → chave "AGOSTO|"  → {mes:'AGOSTO', ano:null}
   *                       (distinta de "AGOSTO|2026")
   *   seletor do Portal → exibia "agosto" E "agosto/2026", dois períodos
   *   getPagamentos()   → com ano=null, `!anoFiltro` desliga o filtro de ano:
   *                       somava TODOS os agostos de TODOS os anos
   *   e o pagamento extra sumia do período correto.
   */
  test('FIN-01: mês sem ano no texto → ano corrente (RN-09, via parseMesAno)', () => {
    const pagamentos = criarAbaFake([CAB_PAGAMENTOS]);
    const { salvarPagamentoExtra } = carregar({ PAGAMENTOS: pagamentos });

    salvarPagamentoExtra({ influ: 'FULANA', mes: 'AGOSTO', valor: 500, pix: 'fulana@pix' });

    expect(pagamentos._linhas[1][iAno]).toBe(new Date().getFullYear());
    expect(pagamentos._linhas[1][iMes]).toBe('AGOSTO');
  });

  test('FIN-01: "AGOSTO 2026" separa mês e ano — MES_REFERENCIA não guarda o ano junto', () => {
    const pagamentos = criarAbaFake([CAB_PAGAMENTOS]);
    const { salvarPagamentoExtra } = carregar({ PAGAMENTOS: pagamentos });

    salvarPagamentoExtra({ influ: 'FULANA', mes: 'AGOSTO 2026', valor: 500, pix: 'p' });

    // Sem isto, MES_REFERENCIA viraria o literal "AGOSTO 2026", que não casa
    // com o "AGOSTO" gravado por gerarNovoMesCompleto/lancarPagamentosDoMes.
    expect(pagamentos._linhas[1][iMes]).toBe('AGOSTO');
    expect(pagamentos._linhas[1][iAno]).toBe(2026);
  });

  test('FIN-01: texto minúsculo/espaçado é normalizado', () => {
    const pagamentos = criarAbaFake([CAB_PAGAMENTOS]);
    const { salvarPagamentoExtra } = carregar({ PAGAMENTOS: pagamentos });

    salvarPagamentoExtra({ influ: 'FULANA', mes: '  dezembro 2025 ', valor: 1, pix: 'p' });

    expect(pagamentos._linhas[1][iMes]).toBe('DEZEMBRO');
    expect(pagamentos._linhas[1][iAno]).toBe(2025);
  });

  test('FIN-01: obj.ano explícito vence a derivação (se a sidebar passar a enviá-lo)', () => {
    const pagamentos = criarAbaFake([CAB_PAGAMENTOS]);
    const { salvarPagamentoExtra } = carregar({ PAGAMENTOS: pagamentos });

    salvarPagamentoExtra({ influ: 'FULANA', mes: 'AGOSTO', ano: 2024, valor: 1, pix: 'p' });

    expect(pagamentos._linhas[1][iAno]).toBe(2024);
  });

  test('FIN-01: aba sem a coluna ANO_REFERENCIA não quebra (grava o resto)', () => {
    const semAno = ['INFLU_KEY', 'MES_REFERENCIA', 'VALOR_TOTAL', 'CHAVE_PIX', 'STATUS_PAGAMENTO'];
    const pagamentos = criarAbaFake([semAno]);
    const { salvarPagamentoExtra } = carregar({ PAGAMENTOS: pagamentos });

    expect(() => salvarPagamentoExtra({ influ: 'FULANA', mes: 'AGOSTO', valor: 1, pix: 'p' })).not.toThrow();
    expect(pagamentos._linhas[1][0]).toBe('FULANA');
  });

  test('L-33: não valida obj.valor nem obj.influ — appendRow aceita vazio', () => {
    const pagamentos = criarAbaFake([CAB_PAGAMENTOS]);
    const { salvarPagamentoExtra } = carregar({ PAGAMENTOS: pagamentos });

    expect(() => salvarPagamentoExtra({})).not.toThrow();
    expect(pagamentos._linhas).toHaveLength(2);
  });
});
