const { loadGas } = require('./helpers/gasHarness');

// Smoke test do Entrypoint "Portal": prova que a função exposta a
// google.script.run (`cadastrarParceira`) compõe a pilha real do Vertical
// Slice — Controller -> Service -> Domínio + Repository -> ACL — sobre uma
// planilha real obtida de SpreadsheetApp/PropertiesService (aqui, fakes).
// Não reimplementa regra de negócio; valida apenas o wiring do entrypoint.
function fakeSheet(header) {
  const rows = [header.slice()];
  return {
    _rows: rows,
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    appendRow: (arr) => rows.push(arr.slice()),
  };
}

function montarPortal(sheet, propriedade) {
  return loadGas(
    [
      'src/shared/Nucleo.js',
      'src/modulos/Parceira.js',
      'src/entrypoint/Portal.js',
    ],
    {
      PropertiesService: {
        getScriptProperties: () => ({ getProperty: () => propriedade }),
      },
      SpreadsheetApp: {
        openById: () => ({
          getSheetByName: (nome) => (nome === 'BASE DE DADOS' ? sheet : null),
        }),
      },
    },
  );
}

describe('Entrypoint · Portal.cadastrarParceira (smoke)', () => {
  test('persiste a Parceira como OFF em BASE DE DADOS e devolve envelope de sucesso', () => {
    const sheet = fakeSheet(['INFLU_KEY', 'STATUS']);
    const gas = montarPortal(sheet, 'fake-spreadsheet-id');

    const resposta = gas.cadastrarParceira({ nome: 'Maria' });

    expect(resposta).toEqual({
      success: true,
      data: { nome: 'Maria', estado: 'Inativa' },
    });
    expect(sheet._rows[sheet._rows.length - 1]).toEqual(['Maria', 'OFF']);
  });

  test('config ausente vira envelope de falha (nunca vaza exceção ao cliente)', () => {
    const sheet = fakeSheet(['INFLU_KEY', 'STATUS']);
    const gas = montarPortal(sheet, ''); // SPREADSHEET_ID não provisionado

    const resposta = gas.cadastrarParceira({ nome: 'Maria' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/config ausente/i);
  });
});
