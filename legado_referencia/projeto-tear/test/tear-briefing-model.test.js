/**
 * Modelo de domínio BRIEFING (F1.1). Entidade de leitura pura que representa
 * integralmente o contrato BRIEFING (`CAMPOS_BRIEFING`, 18 campos), sem I/O e
 * sem regra de negócio (valores devolvidos crus).
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

function montar() {
  return loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js'].map(arquivo),
    { console: { warn() {} } },
    ['Briefing', 'CAMPOS_BRIEFING']
  );
}

describe('Modelo Briefing', () => {
  test('construtor lança TypeError sem objeto de dados', () => {
    const { Briefing } = montar();

    expect(() => new Briefing()).toThrow(/exige um objeto de dados/);
    expect(() => new Briefing(null)).toThrow(/exige um objeto de dados/);
    expect(() => new Briefing('briefing')).toThrow(/exige um objeto de dados/);
  });

  test('CAMPOS_BRIEFING cobre os 18 campos do contrato na ordem do CSV', () => {
    const { CAMPOS_BRIEFING } = montar();

    expect(Object.values(CAMPOS_BRIEFING)).toEqual([
      'INFLUENCIADORA',
      'RESUMO DO MÊS',
      'LOOK REEL',
      'LOOK CARROSSEL',
      'LOOK STORIES 1',
      'LOOK STORIES 2',
      'DATA REEL',
      'DATA CARROSSEL',
      'DATA STORIES 1',
      'DATA STORIES 2',
      'SOBRE REEL',
      'SOBRE CARROSSEL',
      'SOBRE STORIES 1',
      'SOBRE STORIES 2',
      'APROVACAO REEL',
      'APROVACAO CARROSSEL',
      'APROVACAO STORIES 1',
      'APROVACAO STORIES 2'
    ]);
  });

  test('getters devolvem os valores do dicionário pelos nomes de contrato', () => {
    const { Briefing, CAMPOS_BRIEFING } = montar();

    const briefing = new Briefing({
      [CAMPOS_BRIEFING.INFLUENCIADORA]: 'ANA',
      [CAMPOS_BRIEFING.RESUMO_DO_MES]: 'Resumo Julho',
      [CAMPOS_BRIEFING.LOOK_REEL]: 'Look A',
      [CAMPOS_BRIEFING.LOOK_CARROSSEL]: 'Look B',
      [CAMPOS_BRIEFING.LOOK_STORIES_1]: 'Look C1',
      [CAMPOS_BRIEFING.LOOK_STORIES_2]: 'Look C2',
      [CAMPOS_BRIEFING.DATA_REEL]: '2026-07-10',
      [CAMPOS_BRIEFING.DATA_CARROSSEL]: '2026-07-12',
      [CAMPOS_BRIEFING.DATA_STORIES_1]: '2026-07-14',
      [CAMPOS_BRIEFING.DATA_STORIES_2]: '2026-07-15',
      [CAMPOS_BRIEFING.SOBRE_REEL]: 'Sobre Reel',
      [CAMPOS_BRIEFING.SOBRE_CARROSSEL]: 'Sobre Carrossel',
      [CAMPOS_BRIEFING.SOBRE_STORIES_1]: 'Sobre Stories 1',
      [CAMPOS_BRIEFING.SOBRE_STORIES_2]: 'Sobre Stories 2',
      [CAMPOS_BRIEFING.APROVACAO_REEL]: '2026-07-03',
      [CAMPOS_BRIEFING.APROVACAO_CARROSSEL]: '2026-07-05',
      [CAMPOS_BRIEFING.APROVACAO_STORIES_1]: '2026-07-07',
      [CAMPOS_BRIEFING.APROVACAO_STORIES_2]: '2026-07-08'
    });

    expect(briefing.influenciadora).toBe('ANA');
    expect(briefing.resumoDoMes).toBe('Resumo Julho');
    expect(briefing.lookReel).toBe('Look A');
    expect(briefing.lookCarrossel).toBe('Look B');
    expect(briefing.lookStories1).toBe('Look C1');
    expect(briefing.lookStories2).toBe('Look C2');
    expect(briefing.dataReel).toBe('2026-07-10');
    expect(briefing.dataCarrossel).toBe('2026-07-12');
    expect(briefing.dataStories1).toBe('2026-07-14');
    expect(briefing.dataStories2).toBe('2026-07-15');
    expect(briefing.sobreReel).toBe('Sobre Reel');
    expect(briefing.sobreCarrossel).toBe('Sobre Carrossel');
    expect(briefing.sobreStories1).toBe('Sobre Stories 1');
    expect(briefing.sobreStories2).toBe('Sobre Stories 2');
    expect(briefing.aprovacaoReel).toBe('2026-07-03');
    expect(briefing.aprovacaoCarrossel).toBe('2026-07-05');
    expect(briefing.aprovacaoStories1).toBe('2026-07-07');
    expect(briefing.aprovacaoStories2).toBe('2026-07-08');
  });

  test('campo ausente resulta em undefined (leitura pura, não quebra)', () => {
    const { Briefing, CAMPOS_BRIEFING } = montar();

    const briefing = new Briefing({
      [CAMPOS_BRIEFING.INFLUENCIADORA]: 'ANA'
    });

    expect(briefing.influenciadora).toBe('ANA');
    expect(briefing.resumoDoMes).toBeUndefined();
    expect(briefing.lookReel).toBeUndefined();
    expect(briefing.aprovacaoStories2).toBeUndefined();
  });
});
