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
    getRange(linha, _coluna, numLinhas, numColunas) {
      return {
        setValues(valores) {
          if (valores.length !== numLinhas || valores[0].length !== numColunas) {
            throw new Error('fake: range incompatível.');
          }
          valores.forEach((v, i) => {
            rows[linha - 1 + i] = v.slice();
          });
        },
      };
    },
  };
}

function carregar(sheet) {
  const gas = loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Financeiro.js',
  ]);
  return { gas, acl: new gas.PagamentoACL(sheet) };
}

describe('PagamentoACL — materialização, upsert e reidratação (SPEC-020 §9)', () => {
  test('substituirCompetencia grava as Obrigações Mensais e preserva Avulsos de outras linhas', () => {
    const aba = fakeAba();
    const { gas, acl } = carregar(aba);
    const mes = gas.MesReferencia.deTexto('2026-07');
    acl.salvar(new gas.ObrigacaoFinanceira('avulso-1', 'Ana', 'Avulso', null, 100));

    acl.substituirCompetencia(mes, [
      new gas.ObrigacaoFinanceira('m1', 'Maria', 'Mensal', mes, 3500),
    ]);

    const obrigacoes = acl.listarTodos();
    expect(obrigacoes).toHaveLength(2);
    expect(obrigacoes.find((o) => o.id === 'avulso-1')).toBeTruthy();
    const mensal = obrigacoes.find((o) => o.id === 'm1');
    expect(mensal.parceiraId).toBe('Maria');
    expect(mensal.estado).toBe('EmAberto');
  });

  test('salvar faz upsert por identidade e reidrata transições (liberar/pagar)', () => {
    const aba = fakeAba();
    const { gas, acl } = carregar(aba);
    const obrigacao = new gas.ObrigacaoFinanceira('o1', 'Maria', 'Avulso', null, 500);
    acl.salvar(obrigacao);

    obrigacao.liberar().pagar(new Date('2026-07-20'));
    acl.salvar(obrigacao);

    const linhas = aba._rows.slice(1);
    expect(linhas).toHaveLength(1);
    const [reidratada] = acl.listarTodos();
    expect(reidratada.estado).toBe('Pago');
    expect(reidratada.estaPaga()).toBe(true);
  });

  test('ESTADO cru desconhecido falha barulhento (PG-02)', () => {
    const aba = fakeAba();
    const { acl } = carregar(aba);
    aba
      .getRange(2, 1, 1, 8)
      .setValues([['o1', 'Maria', 'MENSAL', 2026, 7, 3500, 'CANCELADO', '']]);

    expect(() => acl.listarTodos()).toThrow(/PG-02/);
  });
});
