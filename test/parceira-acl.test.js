const { loadGas } = require('./helpers/gasHarness');

// Fake mínimo da API de Sheet exercida pela ACL (getDataRange/appendRow).
// Mantém a ACL como único ponto que fala com a planilha, sem depender de
// SpreadsheetApp real no teste.
function fakeSheet(header) {
  const rows = [header.slice()];
  return {
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    appendRow: (arr) => rows.push(arr.slice()),
  };
}

function novaAcl(sheet) {
  const gas = loadGas(['src/domain/Parceira.js', 'src/acl/ParceiraACL.js']);
  return { gas, acl: new gas.ParceiraACL(sheet) };
}

describe('ParceiraACL — coerção de STATUS (ADR-001 §2.1)', () => {
  test('cru → canônico é case/espaço-insensível', () => {
    const { acl } = novaAcl(fakeSheet(['INFLU_KEY', 'STATUS']));

    expect(acl.statusParaCanonico('on')).toBe('Ativa');
    expect(acl.statusParaCanonico(' OFF ')).toBe('Inativa');
  });

  test('valor cru desconhecido falha barulhento (fail-fast)', () => {
    const { acl } = novaAcl(fakeSheet(['INFLU_KEY', 'STATUS']));

    expect(() => acl.statusParaCanonico('desligada')).toThrow();
  });

  test('canônico → cru persiste ON/OFF', () => {
    const { acl } = novaAcl(fakeSheet(['INFLU_KEY', 'STATUS']));

    expect(acl.statusParaCru('Ativa')).toBe('ON');
    expect(acl.statusParaCru('Inativa')).toBe('OFF');
  });
});

describe('ParceiraACL — inserir por cabeçalho', () => {
  test('escreve linha posicionada pelo cabeçalho, com STATUS cru', () => {
    const sheet = fakeSheet(['INFLU_KEY', 'STATUS']);
    const { gas, acl } = novaAcl(sheet);

    acl.inserir(new gas.Parceira('Maria')); // nasce Inativa → OFF

    const values = sheet.getDataRange().getValues();
    expect(values[values.length - 1]).toEqual(['Maria', 'OFF']);
  });

  test('resolve colunas pelo cabeçalho, nunca por índice fixo', () => {
    // Cabeçalho em ordem invertida: prova que o mapeamento é por nome.
    const sheet = fakeSheet(['STATUS', 'INFLU_KEY']);
    const { gas, acl } = novaAcl(sheet);

    acl.inserir(new gas.Parceira('Maria'));

    const values = sheet.getDataRange().getValues();
    expect(values[values.length - 1]).toEqual(['OFF', 'Maria']);
  });
});
