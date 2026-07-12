/**
 * backfillAnoReferenciaPagamentos() — correção de DADO para FIN-01.
 *
 * Corrigir salvarPagamentoExtra() (SidebarBackend.js) impede novas linhas
 * corrompidas. As linhas já gravadas continuam com ANO_REFERENCIA vazio, e
 * continuam produzindo o período fantasma no seletor do Portal. Este backfill
 * é a outra metade do hotfix.
 *
 * Duas invariantes que os testes travam:
 *   1. Nunca sobrescreve um ano já preenchido (idempotente, não-destrutivo).
 *   2. Em aba HISTÓRICA sem DATA_PAGAMENTO, deixa VAZIO — não chuta ano em
 *      registro financeiro passado (CLAUDE.md §12.4.6). Em particular, NÃO usa
 *      DATA_ARQUIVAMENTO como sinal: um pagamento de dezembro arquivado em
 *      janeiro derivaria o ano seguinte.
 *
 * Ref: docs/auditoria/05_operacao_financeira.md FIN-01
 */
const path = require('path');
const { loadGasModule } = require('./helpers/loadGasModule');
const { criarAbaFake, criarSpreadsheetAppFake, criarUtilitiesFake } = require('./helpers/gasServiceMocks');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

const ANO_CORRENTE = new Date().getFullYear();

// Aba viva: não tem DATA_ARQUIVAMENTO.
const CAB_PAG = ['INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'VALOR_TOTAL', 'STATUS_PAGAMENTO', 'DATA_PAGAMENTO'];
// Aba histórica: tem DATA_ARQUIVAMENTO — é o que marca "não chute o ano".
const CAB_HIST = ['INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'VALOR_TOTAL', 'STATUS_PAGAMENTO', 'DATA_PAGAMENTO', 'DATA_ARQUIVAMENTO'];

const iAnoPag = CAB_PAG.indexOf('ANO_REFERENCIA');
const iAnoHist = CAB_HIST.indexOf('ANO_REFERENCIA');

function carregar(abasPorNome, respostaUi) {
  const spreadsheetApp = criarSpreadsheetAppFake(abasPorNome);
  const alertas = [];
  spreadsheetApp.getUi = () => ({
    Button: { YES: 'YES', NO: 'NO' },
    ButtonSet: { YES_NO: 'YES_NO' },
    alert(...args) {
      alertas.push(args.join(' | '));
      return args.length > 1 ? (respostaUi || 'YES') : undefined;
    }
  });

  const sandbox = loadGasModule(CODIGO_PATH, {
    SpreadsheetApp: spreadsheetApp,
    Utilities: criarUtilitiesFake(),
    Logger: { log() {} }
  });
  return { sandbox, alertas };
}

describe('derivarAnoPagamento_ — de onde o ano pode vir', () => {
  const { sandbox } = carregar({});
  const hPag = { INFLU_KEY: 1, DATA_PAGAMENTO: 6 };
  const hHist = { INFLU_KEY: 1, DATA_PAGAMENTO: 6, DATA_ARQUIVAMENTO: 7 };

  test('string dd/MM/yyyy HH:mm em DATA_PAGAMENTO', () => {
    const linha = ['FULANA', '', '', '', '', '01/08/2026 14:30'];
    expect(sandbox.derivarAnoPagamento_(linha, hPag)).toBe(2026);
  });

  test('objeto Date em DATA_PAGAMENTO', () => {
    const linha = ['FULANA', '', '', '', '', new Date(2024, 11, 31)];
    expect(sandbox.derivarAnoPagamento_(linha, hPag)).toBe(2024);
  });

  test('aba VIVA sem DATA_PAGAMENTO → ano corrente (linha do ciclo em aberto)', () => {
    const linha = ['FULANA', '', '', '', 'em aberto', ''];
    expect(sandbox.derivarAnoPagamento_(linha, hPag)).toBe(ANO_CORRENTE);
  });

  test('aba HISTÓRICA sem DATA_PAGAMENTO → null (não chuta ano de registro passado)', () => {
    const linha = ['FULANA', '', '', '', 'pago', '', '05/01/2026 09:00'];
    expect(sandbox.derivarAnoPagamento_(linha, hHist)).toBeNull();
  });

  test('DATA_ARQUIVAMENTO NÃO é usada como sinal — dezembro arquivado em janeiro não vira o ano seguinte', () => {
    // O pagamento é de DEZEMBRO/2025; foi arquivado em 05/01/2026.
    // derivarAnoDaLinha_ (o helper das ativações) devolveria 2026 aqui — por
    // isso este derivador existe separado.
    const linha = ['FULANA', 'DEZEMBRO', '', '', 'pago', '20/12/2025 10:00', '05/01/2026 09:00'];
    expect(sandbox.derivarAnoPagamento_(linha, hHist)).toBe(2025);

    const semDataPagamento = ['FULANA', 'DEZEMBRO', '', '', 'pago', '', '05/01/2026 09:00'];
    expect(sandbox.derivarAnoPagamento_(semDataPagamento, hHist)).not.toBe(2026);
  });
});

describe('backfillAnoPagamentosAba_ — aba viva (PAGAMENTOS)', () => {
  test('preenche vazios, preserva preenchidos', () => {
    const aba = criarAbaFake([
      CAB_PAG,
      ['FULANA', 'AGOSTO', '', 500, 'em aberto', ''],              // vazio → ano corrente
      ['BELTRANA', 'JULHO', 2023, 900, 'pago', '10/07/2023'],      // já tem → intacto
      ['CICLANA', 'JUNHO', '', 100, 'pago', '15/06/2022 08:00']    // vazio → 2022
    ]);
    const { sandbox } = carregar({ PAGAMENTOS: aba });

    const res = sandbox.backfillAnoPagamentosAba_(aba);

    expect(res).toEqual({ preenchidas: 2, semSinal: 0 });
    expect(aba._linhas[1][iAnoPag]).toBe(ANO_CORRENTE);
    expect(aba._linhas[2][iAnoPag]).toBe(2023);
    expect(aba._linhas[3][iAnoPag]).toBe(2022);
  });

  test('é idempotente — a segunda execução não toca em nada', () => {
    const aba = criarAbaFake([CAB_PAG, ['FULANA', 'AGOSTO', '', 500, 'em aberto', '']]);
    const { sandbox } = carregar({ PAGAMENTOS: aba });

    expect(sandbox.backfillAnoPagamentosAba_(aba).preenchidas).toBe(1);
    expect(sandbox.backfillAnoPagamentosAba_(aba)).toEqual({ preenchidas: 0, semSinal: 0 });
  });

  test('linha totalmente em branco no fim da aba é ignorada', () => {
    const aba = criarAbaFake([CAB_PAG, ['', '', '', '', '', '']]);
    const { sandbox } = carregar({ PAGAMENTOS: aba });

    expect(sandbox.backfillAnoPagamentosAba_(aba)).toEqual({ preenchidas: 0, semSinal: 0 });
    expect(aba._linhas[1][iAnoPag]).toBe('');
  });

  test('sem a coluna ANO_REFERENCIA, não faz nada', () => {
    const aba = criarAbaFake([['INFLU_KEY', 'MES_REFERENCIA'], ['FULANA', 'AGOSTO']]);
    const { sandbox } = carregar({ PAGAMENTOS: aba });

    expect(sandbox.backfillAnoPagamentosAba_(aba)).toEqual({ preenchidas: 0, semSinal: 0 });
  });
});

describe('backfillAnoPagamentosAba_ — aba histórica (HISTÓRICO DE PAGAMENTOS)', () => {
  test('sem DATA_PAGAMENTO, deixa vazio e conta como semSinal', () => {
    const aba = criarAbaFake([
      CAB_HIST,
      ['FULANA', 'AGOSTO', '', 500, 'pago', '', '01/09/2026 10:00'],
      ['BELTRANA', 'JULHO', '', 900, 'pago', '20/07/2026 11:00', '01/09/2026 10:00']
    ]);
    const { sandbox } = carregar({ 'HISTÓRICO DE PAGAMENTOS': aba });

    const res = sandbox.backfillAnoPagamentosAba_(aba);

    expect(res).toEqual({ preenchidas: 1, semSinal: 1 });
    expect(aba._linhas[1][iAnoHist]).toBe('');   // continua vazio: casa com qualquer ano (legado)
    expect(aba._linhas[2][iAnoHist]).toBe(2026);
  });
});

describe('backfillAnoReferenciaPagamentos — função de menu', () => {
  test('cria a coluna se faltar, preenche e reporta', () => {
    const pag = criarAbaFake([['INFLU_KEY', 'MES_REFERENCIA', 'DATA_PAGAMENTO'], ['FULANA', 'AGOSTO', '10/08/2026']]);
    const { sandbox, alertas } = carregar({ PAGAMENTOS: pag }, 'YES');

    sandbox.backfillAnoReferenciaPagamentos();

    const h = sandbox.getHeaderMap(pag);
    expect(h['ANO_REFERENCIA']).toBeDefined();
    expect(pag._linhas[1][h['ANO_REFERENCIA'] - 1]).toBe(2026);
    expect(alertas.join(' ')).toContain('Backfill concluído');
  });

  test('resposta NO cancela sem tocar em nada', () => {
    const pag = criarAbaFake([CAB_PAG, ['FULANA', 'AGOSTO', '', 500, 'em aberto', '']]);
    const { sandbox, alertas } = carregar({ PAGAMENTOS: pag }, 'NO');

    sandbox.backfillAnoReferenciaPagamentos();

    expect(pag._linhas[1][iAnoPag]).toBe('');
    expect(alertas.join(' ')).toContain('Cancelado');
  });

  test('aba PAGAMENTOS ausente avisa e sai', () => {
    const { sandbox, alertas } = carregar({}, 'YES');

    expect(() => sandbox.backfillAnoReferenciaPagamentos()).not.toThrow();
    expect(alertas.join(' ')).toContain('não encontrada');
  });

  test('avisa quando sobraram linhas de histórico sem ano', () => {
    const pag = criarAbaFake([CAB_PAG]);
    const hist = criarAbaFake([CAB_HIST, ['FULANA', 'AGOSTO', '', 500, 'pago', '', '01/09/2026 10:00']]);
    const { sandbox, alertas } = carregar({ PAGAMENTOS: pag, 'HISTÓRICO DE PAGAMENTOS': hist }, 'YES');

    sandbox.backfillAnoReferenciaPagamentos();

    expect(alertas.join(' ')).toContain('Linhas deixadas VAZIAS no histórico');
    expect(alertas.join(' ')).toContain('Preencher à mão');
  });
});
