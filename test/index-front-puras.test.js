/**
 * Testes das funções puras do front-end embutidas em mae/Index.html.
 * Carrega o <script> real via loadGasModule (nenhuma duplicação de lógica),
 * dentro de um sandbox com um shim mínimo de DOM — só o suficiente para o
 * script inteiro rodar sem lançar erro ao carregar (o próprio arquivo chama
 * document.body/getElementById/tentarRestaurarSessao() no final).
 *
 * Ver docs/AUDITORIA_TECNICA_2026-07-07.md seção 18.1 e
 * docs/PLANO_DE_TESTES_QA.md Fase 3.
 */
const path = require('path');
const { loadGasModule } = require('./helpers/loadGasModule');

const INDEX_PATH = path.join(__dirname, '..', 'mae', 'Index.html');

function elementoFalso() {
  return {
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    value: '',
    style: {},
    textContent: ''
  };
}

function carregarIndex() {
  const sandbox = {
    document: {
      body: { classList: { add() {}, remove() {}, toggle() {} } },
      getElementById() { return elementoFalso(); },
      querySelectorAll() { return []; },
      createElement() { return elementoFalso(); }
    },
    console,
    setTimeout,
    clearTimeout,
    google: { script: { run: {} } }
  };
  return loadGasModule(INDEX_PATH, sandbox);
}

describe('Index.html — formatarData (front-end)', () => {
  const { formatarData } = carregarIndex();

  test('vazio/nulo retorna "-"', () => {
    expect(formatarData(null)).toBe('-');
    expect(formatarData('')).toBe('-');
  });

  test('AUDITORIA 18.1: string "dd/MM/yyyy" do backend não pode trocar dia e mês (dia <= 12)', () => {
    // O backend (WebApp.js:formatarData) sempre envia datas já formatadas como
    // string "dd/MM/yyyy" (getPendencias/getBriefing/getPagamentos/getHistorico
    // nunca enviam um Date cru) — o bug era o front reprocessar essa string com
    // `new Date(valor)`, que o JS interpreta como M/D/YYYY (formato americano).
    expect(formatarData('05/07/2026')).toBe('05/07/2026'); // 5 de julho
    expect(formatarData('01/12/2026')).toBe('01/12/2026'); // 1 de dezembro
    expect(formatarData('12/01/2026')).toBe('12/01/2026'); // 12 de janeiro
  });

  test('dias > 12 (não regressão do comportamento já correto)', () => {
    expect(formatarData('25/07/2026')).toBe('25/07/2026');
    expect(formatarData('31/12/2026')).toBe('31/12/2026');
  });

  test('ano bissexto — 29 de fevereiro', () => {
    expect(formatarData('29/02/2024')).toBe('29/02/2024');
  });

  test('objeto Date direto continua funcionando (não passa pelo parse de string)', () => {
    expect(formatarData(new Date(2026, 6, 5))).toBe('05/07/2026');
  });
});
