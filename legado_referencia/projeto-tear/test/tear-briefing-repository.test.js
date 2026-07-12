/**
 * BriefingRepository (F1.2) — fundação de persistência do BRIEFING.
 *
 * Escopo mecânico:
 * - leitura por INFLUENCIADORA;
 * - mapeamento por cabeçalho do contrato CAMPOS_BRIEFING;
 * - persistência básica (insert/update), sem regra de negócio.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

function criarAbaFalsa(cabecalho, linhasIniciais, formulasPorLinha) {
  const linhas = (linhasIniciais || []).map((linha) => linha.slice());
  const formulas = (formulasPorLinha || []).map((linha) => linha.slice());

  return {
    getDataRange: () => ({
      getValues: () => [cabecalho.slice()].concat(linhas.map((l) => l.slice()))
    }),
    appendRow: (valores) => {
      linhas.push(valores.slice());
      formulas.push(cabecalho.map(() => ''));
    },
    getRange: (row, col, numRows, numCols) => {
      if (col !== 1 || numRows !== 1 || numCols !== cabecalho.length) {
        throw new Error('getRange inesperado no teste de briefing repository');
      }

      const idx = row - 2;
      return {
        getFormulas: () => [
          (formulas[idx] || cabecalho.map(() => '')).slice()
        ],
        setValues: (values) => {
          linhas[idx] = values[0].slice();
        }
      };
    },
    _linhas: linhas
  };
}

function criarPlanilhaFalsa(aba) {
  return {
    getSheetByName: (nome) => (nome === 'Briefings' ? aba : null)
  };
}

function montarComAba(aba) {
  const ctx = loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js'].map(arquivo),
    { console: { warn() {} } },
    ['BriefingRepository', 'Briefing', 'CAMPOS_BRIEFING']
  );

  return {
    ...ctx,
    repo: new ctx.BriefingRepository(criarPlanilhaFalsa(aba))
  };
}

describe('BriefingRepository', () => {
  test('lê por INFLUENCIADORA e mapeia para entidade Briefing', () => {
    const { CAMPOS_BRIEFING } = montarComAba(criarAbaFalsa([], []));
    const cabecalho = Object.values(CAMPOS_BRIEFING);

    const aba = criarAbaFalsa(cabecalho, [
      [
        'ANA', 'Resumo A', 'Look A', 'Look B', 'Look C1', 'Look C2',
        '2026-07-10', '2026-07-12', '2026-07-14', '2026-07-15',
        'Sobre Reel', 'Sobre Carrossel', 'Sobre 1', 'Sobre 2',
        '2026-07-03', '2026-07-05', '2026-07-07', '2026-07-08'
      ]
    ]);

    const { repo, Briefing } = montarComAba(aba);

    const registro = repo.getByInfluenciadora('ANA');

    expect(registro instanceof Briefing).toBe(true);
    expect(registro.influenciadora).toBe('ANA');
    expect(registro.lookReel).toBe('Look A');
    expect(registro.aprovacaoStories2).toBe('2026-07-08');
  });

  test('save cria linha nova usando os nomes de campo do contrato', () => {
    const base = montarComAba(criarAbaFalsa([], []));
    const cabecalho = Object.values(base.CAMPOS_BRIEFING);
    const aba = criarAbaFalsa(cabecalho, []);
    const { repo, Briefing, CAMPOS_BRIEFING } = montarComAba(aba);

    const salvo = repo.save({
      [CAMPOS_BRIEFING.INFLUENCIADORA]: 'BIA',
      [CAMPOS_BRIEFING.RESUMO_DO_MES]: 'Resumo B'
    });

    expect(salvo instanceof Briefing).toBe(true);
    expect(aba._linhas).toHaveLength(1);
    expect(aba._linhas[0][0]).toBe('BIA');
    expect(aba._linhas[0][1]).toBe('Resumo B');
    expect(aba._linhas[0][2]).toBe('');
  });

  test('save atualiza linha existente por INFLUENCIADORA preservando fórmula', () => {
    const { CAMPOS_BRIEFING } = montarComAba(criarAbaFalsa([], []));
    const cabecalho = Object.values(CAMPOS_BRIEFING);
    const idxLookCarrossel = cabecalho.indexOf(CAMPOS_BRIEFING.LOOK_CARROSSEL);

    const linha = cabecalho.map(() => '');
    linha[cabecalho.indexOf(CAMPOS_BRIEFING.INFLUENCIADORA)] = 'ANA';
    linha[cabecalho.indexOf(CAMPOS_BRIEFING.RESUMO_DO_MES)] = 'Resumo antigo';

    const formula = cabecalho.map(() => '');
    formula[idxLookCarrossel] = '=FORMULA_MANTER';

    const aba = criarAbaFalsa(cabecalho, [linha], [formula]);
    const { repo } = montarComAba(aba);

    const salvo = repo.save({
      [CAMPOS_BRIEFING.INFLUENCIADORA]: 'ANA',
      [CAMPOS_BRIEFING.RESUMO_DO_MES]: 'Resumo novo',
      [CAMPOS_BRIEFING.LOOK_CARROSSEL]: 'Nao deve sobrescrever formula'
    });

    expect(salvo.resumoDoMes).toBe('Resumo novo');
    expect(aba._linhas[0][cabecalho.indexOf(CAMPOS_BRIEFING.RESUMO_DO_MES)]).toBe('Resumo novo');
    expect(aba._linhas[0][idxLookCarrossel]).toBe('=FORMULA_MANTER');
  });
});
