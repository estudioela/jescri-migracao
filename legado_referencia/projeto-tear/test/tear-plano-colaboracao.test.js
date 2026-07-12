/**
 * Modelo de domínio PLANO_COLABORAÇÃO (F0.1.2). Entidade de leitura pura que
 * representa exclusivamente o contrato `Planos_Colaboracao` (`CAMPOS_PLANO`):
 * getters pelo vocabulário do contrato, sem I/O, sem regra de negócio e SEM
 * interpretar `Valor_Cache`/`Qtd_Entregaveis` (valores devolvidos crus).
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

function montar() {
  return loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js'].map(arquivo),
    { console: { warn() {} } },
    ['PlanoColaboracao', 'CAMPOS_PLANO']
  );
}

describe('Modelo PlanoColaboracao', () => {
  test('construtor lança TypeError sem objeto de dados', () => {
    const { PlanoColaboracao } = montar();

    expect(() => new PlanoColaboracao()).toThrow(/exige um objeto de dados/);
    expect(() => new PlanoColaboracao(null)).toThrow(/exige um objeto de dados/);
    expect(() => new PlanoColaboracao('plano')).toThrow(/exige um objeto de dados/);
  });

  test('getters devolvem os valores do dicionário pelos nomes de contrato', () => {
    const { PlanoColaboracao, CAMPOS_PLANO } = montar();

    const plano = new PlanoColaboracao({
      [CAMPOS_PLANO.ID]: 'PLN-001',
      [CAMPOS_PLANO.INFLUENCIADORA]: 'INF-042',
      [CAMPOS_PLANO.CICLO]: '2026-07',
      [CAMPOS_PLANO.QTD_ENTREGAVEIS]: 3,
      [CAMPOS_PLANO.VALOR_CACHE]: 720
    });

    expect(plano.id).toBe('PLN-001');
    expect(plano.influenciadora).toBe('INF-042');
    expect(plano.ciclo).toBe('2026-07');
    expect(plano.qtdEntregaveis).toBe(3);
    expect(plano.valorCache).toBe(720);
  });

  test('valorCache e qtdEntregaveis são devolvidos crus, sem interpretação', () => {
    const { PlanoColaboracao, CAMPOS_PLANO } = montar();

    const plano = new PlanoColaboracao({
      [CAMPOS_PLANO.QTD_ENTREGAVEIS]: 'Três',
      [CAMPOS_PLANO.VALOR_CACHE]: 'R$ 720,00'
    });

    // Prova de não-interpretação: nenhum parse numérico/financeiro ocorre no modelo.
    expect(plano.qtdEntregaveis).toBe('Três');
    expect(plano.valorCache).toBe('R$ 720,00');
  });

  test('campo ausente resulta em undefined (leitura pura, não quebra)', () => {
    const { PlanoColaboracao, CAMPOS_PLANO } = montar();

    const plano = new PlanoColaboracao({ [CAMPOS_PLANO.ID]: 'PLN-001' });

    expect(plano.id).toBe('PLN-001');
    expect(plano.influenciadora).toBeUndefined();
    expect(plano.ciclo).toBeUndefined();
    expect(plano.qtdEntregaveis).toBeUndefined();
    expect(plano.valorCache).toBeUndefined();
  });
});
