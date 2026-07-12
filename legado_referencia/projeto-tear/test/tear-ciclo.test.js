/**
 * Modelo de domínio CICLO (F0.1.1). Entidade de leitura pura: getters pelo
 * vocabulário do contrato `CAMPOS_CICLO`, sem I/O e sem regra de negócio.
 * CICLO é entidade auxiliar não-CSV do Core Domain — o contrato é `CAMPOS_CICLO`
 * (docs/CORE_DOMAIN.md), não um `Ciclos.csv` (inexistente).
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

function montar() {
  return loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js'].map(arquivo),
    { console: { warn() {} } },
    ['Ciclo', 'CAMPOS_CICLO']
  );
}

describe('Modelo Ciclo', () => {
  test('construtor lança TypeError sem objeto de dados', () => {
    const { Ciclo } = montar();

    expect(() => new Ciclo()).toThrow(/exige um objeto de dados/);
    expect(() => new Ciclo(null)).toThrow(/exige um objeto de dados/);
    expect(() => new Ciclo('2026-07')).toThrow(/exige um objeto de dados/);
  });

  test('getters devolvem os valores do dicionário pelos nomes de contrato', () => {
    const { Ciclo, CAMPOS_CICLO } = montar();

    const ciclo = new Ciclo({
      [CAMPOS_CICLO.ID]: '2026-07',
      [CAMPOS_CICLO.NOME]: 'Julho/2026',
      [CAMPOS_CICLO.INICIO_LOGISTICA]: '2026-07-01',
      [CAMPOS_CICLO.FIM_OPERACAO]: '2026-07-31'
    });

    expect(ciclo.id).toBe('2026-07');
    expect(ciclo.nome).toBe('Julho/2026');
    expect(ciclo.inicioLogistica).toBe('2026-07-01');
    expect(ciclo.fimOperacao).toBe('2026-07-31');
  });

  test('campo ausente resulta em undefined (leitura pura, não quebra)', () => {
    const { Ciclo, CAMPOS_CICLO } = montar();

    const ciclo = new Ciclo({ [CAMPOS_CICLO.ID]: '2026-07' });

    expect(ciclo.id).toBe('2026-07');
    expect(ciclo.nome).toBeUndefined();
    expect(ciclo.inicioLogistica).toBeUndefined();
    expect(ciclo.fimOperacao).toBeUndefined();
  });
});
