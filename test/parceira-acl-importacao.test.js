const { loadGas } = require('./helpers/gasHarness');

function fakeAbaGravavel(header) {
  let rows = [header.slice()];
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    appendRow: (arr) => rows.push(arr.slice()),
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

function novaAcl(sheet) {
  const gas = loadGas([, 'src/modulos/Parceira.js']);
  return { gas, acl: new gas.ParceiraACL(sheet) };
}

const CABECALHO = ['INFLU_KEY', 'STATUS', 'CHAVE_PIX', 'VALOR_TOTAL'];

describe('ParceiraACL — importarLote / listarChaves (SPEC-003 §6.3, RNF-03)', () => {
  test('importarLote grava em lote, sem tocar linhas existentes, coagindo STATUS', () => {
    const aba = fakeAbaGravavel(CABECALHO);
    aba.appendRow(['Existente', 'ON', 'pix@x', 100]);
    const { acl } = novaAcl(aba);

    acl.importarLote([
      { parceiraId: 'Maria', estado: 'Ativa', camposFisicos: { CHAVE_PIX: 'pix@maria' } },
      { parceiraId: 'Ana', estado: 'Inativa', camposFisicos: {} },
    ]);

    expect(aba._rows).toHaveLength(4);
    expect(aba._rows[1]).toEqual(['Existente', 'ON', 'pix@x', 100]);
    expect(aba._rows[2]).toEqual(['Maria', 'ON', 'pix@maria', '']);
    expect(aba._rows[3]).toEqual(['Ana', 'OFF', '', '']);
  });

  test('lote vazio é no-op', () => {
    const aba = fakeAbaGravavel(CABECALHO);
    const { acl } = novaAcl(aba);

    acl.importarLote([]);

    expect(aba._rows).toHaveLength(1);
  });

  test('listarChaves devolve INFLU_KEY existentes, ignorando linhas vazias', () => {
    const aba = fakeAbaGravavel(CABECALHO);
    aba.appendRow(['Maria', 'ON', '', '']);
    aba.appendRow(['', '', '', '']);
    const { acl } = novaAcl(aba);

    expect(acl.listarChaves()).toEqual(['Maria']);
  });
});
