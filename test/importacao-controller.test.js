const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas(['src/shared/Nucleo.js', 'src/modulos/Parceira.js']);
}

describe('ImportacaoController — envelope padrão (§3.3)', () => {
  test('sucesso devolve envelope ok com totalImportado', () => {
    const gas = carregar();
    const controller = new gas.ImportacaoController({
      importarBase: () => ({ totalImportado: 3 }),
    });

    const resposta = controller.importarBase();

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual({ totalImportado: 3 });
  });

  test('erro do service vira envelope de falha com a mensagem (nunca exceção crua)', () => {
    const gas = carregar();
    const controller = new gas.ImportacaoController({
      importarBase: () => {
        throw new Error('Config ausente: "SPREADSHEET_ID_LEGADO".');
      },
    });

    const resposta = controller.importarBase();

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/SPREADSHEET_ID_LEGADO/);
  });
});
