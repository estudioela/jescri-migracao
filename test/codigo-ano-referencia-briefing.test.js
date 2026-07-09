/**
 * garantirColunaAnoReferenciaBriefing() — mae/Código.js. Mecanismo de menu
 * (" ERP ELÃ 6.2 → Cadastros & Configurações → 9. Adicionar Coluna
 * ANO_REFERENCIA em Briefing") que cria a coluna ANO_REFERENCIA em BRIEFING
 * quando ela ainda não existe — adicionar/remover coluna é mudança de
 * ESTRUTURA da planilha viva, não é sincronizada por `clasp push` (só
 * código), por isso é uma ação manual, idempotente e não-destrutiva. Ver
 * CLAUDE.md seção 3 ("Briefing") e docs/AUDITORIA_TECNICA_2026-07-07.md
 * seções 16.5/16.6/18.5.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const { criarUtilitiesFake, criarLoggerFake, criarAbaFake, criarSpreadsheetAppFake } = require('./helpers/gasServiceMocks');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

function montarAmbienteColuna({ headerBriefing, dadosBriefing = [], respostaConfirmacao = 'YES', semAbaBriefing = false }) {
  const abas = {};
  if (!semAbaBriefing) {
    abas['BRIEFING'] = criarAbaFake([headerBriefing, ...dadosBriefing]);
  }

  // Fake mínimo de Ui: alert(msg) informativo (1 argumento) sempre "confirma"
  // (não há escolha); alert(titulo, msg, buttonSet) é a confirmação real —
  // devolve Button.YES/Button.NO conforme respostaConfirmacao, simulando o
  // clique do usuário no diálogo.
  const uiFake = {
    _alertas: [],
    alert: (...args) => {
      uiFake._alertas.push(args);
      if (args.length >= 3) return respostaConfirmacao === 'YES' ? uiFake.Button.YES : uiFake.Button.NO;
      return uiFake.Button.OK;
    },
    ButtonSet: { YES_NO: 'YES_NO', OK: 'OK' },
    Button: { YES: 'YES', NO: 'NO', OK: 'OK' }
  };

  const spreadsheetAppFake = criarSpreadsheetAppFake(abas);
  spreadsheetAppFake.getUi = () => uiFake;

  const sandbox = {
    SpreadsheetApp: spreadsheetAppFake,
    Utilities: criarUtilitiesFake(),
    Logger: criarLoggerFake(),
    Session: { getActiveUser: () => ({ getEmail: () => 'teste@estudioela.com' }) }
  };
  const modulo = loadGasFiles([CODIGO_PATH], sandbox);
  return { modulo, abas, uiFake };
}

describe('Código.js — garantirColunaAnoReferenciaBriefing()', () => {
  test('coluna ausente + usuário confirma: cria ANO_REFERENCIA como última coluna, sem apagar/reordenar dados existentes', () => {
    const headerSemAno = ['INFLU_KEY', 'CUPOM', 'MES', 'RESUMO'];
    const linhaExistente = ['MARIA INFLUENCER', 'MARIA10', 'JULHO', 'Resumo julho'];
    const { modulo, abas, uiFake } = montarAmbienteColuna({
      headerBriefing: headerSemAno,
      dadosBriefing: [linhaExistente],
      respostaConfirmacao: 'YES'
    });

    modulo.garantirColunaAnoReferenciaBriefing();

    const sh = abas['BRIEFING'];
    expect(sh._linhas[0]).toEqual(['INFLU_KEY', 'CUPOM', 'MES', 'RESUMO', 'ANO_REFERENCIA']);
    expect(sh._linhas[1]).toEqual(linhaExistente); // dado existente intacto
    expect(uiFake._alertas.some((a) => typeof a[0] === 'string' && a[0].includes('criada'))).toBe(true);
  });

  test('coluna ausente + usuário cancela: nenhuma coluna é adicionada', () => {
    const headerSemAno = ['INFLU_KEY', 'CUPOM', 'MES', 'RESUMO'];
    const linhaExistente = ['MARIA INFLUENCER', 'MARIA10', 'JULHO', 'Resumo julho'];
    const { modulo, abas } = montarAmbienteColuna({
      headerBriefing: headerSemAno,
      dadosBriefing: [linhaExistente],
      respostaConfirmacao: 'NO'
    });

    modulo.garantirColunaAnoReferenciaBriefing();

    const sh = abas['BRIEFING'];
    expect(sh._linhas[0]).toEqual(headerSemAno);
    expect(sh._linhas[1]).toEqual(linhaExistente);
  });

  test('coluna já existe: não duplica a coluna nem altera os dados (idempotente)', () => {
    const headerComAno = ['INFLU_KEY', 'CUPOM', 'MES', 'RESUMO', 'ANO_REFERENCIA'];
    const linhaExistente = ['MARIA INFLUENCER', 'MARIA10', 'JULHO', 'Resumo julho', 2026];
    const { modulo, abas, uiFake } = montarAmbienteColuna({
      headerBriefing: headerComAno,
      dadosBriefing: [linhaExistente]
    });

    modulo.garantirColunaAnoReferenciaBriefing();

    const sh = abas['BRIEFING'];
    expect(sh._linhas[0]).toEqual(headerComAno); // sem coluna duplicada
    expect(sh._linhas[1]).toEqual(linhaExistente); // sem alteração
    expect(uiFake._alertas.some((a) => typeof a[0] === 'string' && a[0].includes('já existe'))).toBe(true);
  });

  test('aba BRIEFING ausente: não quebra, só alerta', () => {
    const { modulo, uiFake } = montarAmbienteColuna({ semAbaBriefing: true, headerBriefing: [], dadosBriefing: [] });
    expect(() => modulo.garantirColunaAnoReferenciaBriefing()).not.toThrow();
    expect(uiFake._alertas.some((a) => typeof a[0] === 'string' && a[0].includes('não encontrada'))).toBe(true);
  });
});
