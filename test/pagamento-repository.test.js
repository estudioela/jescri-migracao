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
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Financeiro.js',
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

describe('PagamentoRepository.listarPorParceira (SPEC-030 RN-04: períodos com atividade)', () => {
  test('devolve as Obrigações da Parceira em TODAS as competências, inclusive Avulso sem competência (CB-01)', () => {
    const { gas, repository } = carregar();
    const jul = gas.MesReferencia.deTexto('2026-07');
    const ago = gas.MesReferencia.deTexto('2026-08');
    repository.materializarCompetencia(jul, [
      new gas.ObrigacaoFinanceira('m1', 'Maria', 'Mensal', jul, 3500),
      new gas.ObrigacaoFinanceira('m2', 'Ana', 'Mensal', jul, 3500),
    ]);
    repository.materializarCompetencia(ago, [
      new gas.ObrigacaoFinanceira('m3', 'Maria', 'Mensal', ago, 3500),
    ]);
    repository.salvar(new gas.ObrigacaoFinanceira('o1', 'Maria', 'Avulso', null, 500));

    const daMaria = repository.listarPorParceira('Maria');

    expect(daMaria).toHaveLength(3);
    expect(daMaria.every((o) => o.parceiraId === 'Maria')).toBe(true);
  });

  test('Parceira sem nenhuma Obrigação devolve lista vazia (CB-01)', () => {
    const { repository } = carregar();

    expect(repository.listarPorParceira('fantasma')).toEqual([]);
  });
});
