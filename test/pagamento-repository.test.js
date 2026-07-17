const { loadGas } = require('./helpers/gasHarness');

const CABECALHO = [
  'ID_OBRIGACAO',
  'INFLU_KEY',
  'TIPO_PAGAMENTO',
  'ANO_REFERENCIA',
  'MES_REFERENCIA',
  'VALOR',
  'ESTADO',
  'DATA_ARQUIVAMENTO',
];

function fakeAba() {
  let rows = [CABECALHO.slice()];
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    clearContents() {
      rows = [];
    },
    getRange(linha) {
      return {
        setValues(valores) {
          valores.forEach((v, i) => {
            rows[linha - 1 + i] = v.slice();
          });
        },
      };
    },
  };
}

function carregar() {
  const gas = loadGas([
    'src/domain/MesReferencia.js',
    'src/domain/ObrigacaoFinanceira.js',
    'src/acl/PagamentoACL.js',
    'src/repository/PagamentoRepository.js',
  ]);
  const acl = new gas.PagamentoACL(fakeAba());
  return { gas, repository: new gas.PagamentoRepository(acl) };
}

describe('PagamentoRepository — idempotência da materialização mensal (F1/F2, mesmo padrão de EntregaRepository)', () => {
  test('existeParaCompetencia só é true após a primeira materialização Mensal', () => {
    const { gas, repository } = carregar();
    const mes = gas.MesReferencia.deTexto('2026-07');
    expect(repository.existeParaCompetencia(mes)).toBe(false);

    repository.materializarCompetencia(mes, [
      new gas.ObrigacaoFinanceira('m1', 'Maria', 'Mensal', mes, 3500),
    ]);

    expect(repository.existeParaCompetencia(mes)).toBe(true);
    expect(repository.listarPor(mes)).toHaveLength(1);
  });

  test('obterPor localiza pela identidade; inexistente devolve null (PG-01)', () => {
    const { gas, repository } = carregar();
    repository.salvar(new gas.ObrigacaoFinanceira('o1', 'Maria', 'Avulso', null, 500));

    expect(repository.obterPor('o1').parceiraId).toBe('Maria');
    expect(repository.obterPor('fantasma')).toBeNull();
  });
});
