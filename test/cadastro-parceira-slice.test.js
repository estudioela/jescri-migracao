const { loadGas } = require('./helpers/gasHarness');

// Integração do Vertical Slice "Cadastro de Parceira": exercita a pilha real
// Controller -> Service -> Domínio + Repository -> ACL sobre uma planilha fake,
// verificando o comportamento composto (não coberto pelos testes de unidade,
// que usam fakes em cada fronteira).
function fakeSheet(header) {
  const rows = [header.slice()];
  return {
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    appendRow: (arr) => rows.push(arr.slice()),
  };
}

function montarSlice(sheet) {
  const gas = loadGas([
    'src/shared/Nucleo.js',
    'src/modulos/Parceira.js',
  ]);
  const acl = new gas.ParceiraACL(sheet);
  const repo = new gas.ParceiraRepository(acl);
  const service = new gas.CadastrarParceiraService(repo);
  return new gas.ParceiraController(service);
}

describe('Vertical Slice · Cadastro de Parceira (integração)', () => {
  test('cadastrar persiste a Parceira como OFF e devolve envelope de sucesso', () => {
    const sheet = fakeSheet(['INFLU_KEY', 'STATUS']);
    const controller = montarSlice(sheet);

    const resposta = controller.cadastrar({ nome: 'Maria' });

    // Contrato externo: envelope de sucesso com projeção Inativa (RN-01).
    expect(resposta).toEqual({
      success: true,
      data: { nome: 'Maria', estado: 'Inativa' },
    });

    // Persistência física: linha gravada por cabeçalho, STATUS cru OFF.
    const values = sheet.getDataRange().getValues();
    expect(values[values.length - 1]).toEqual(['Maria', 'OFF']);
  });
});
