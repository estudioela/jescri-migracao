const { loadGas } = require('./helpers/gasHarness');

// Slice adjacente (SPEC-003): Portal -> ImportacaoController ->
// ImportadorService -> LegadoACL (planilha legada, SOMENTE LEITURA) +
// ParceiraACL (planilha nova) sobre fakes de DUAS planilhas distintas —
// exercita abrirBaseDeDadosLegada() e a resolução por CONFIG_KEYS
// separada de SPREADSHEET_ID/SPREADSHEET_ID_LEGADO.
function fakeBaseLegada() {
  const rows = [
    ['STATUS', 'INFLU_KEY', 'CHAVE_PIX'],
    ['ON', 'Maria', 'pix@maria'],
    ['OFF', '  ', 'sem-chave-descartado'],
  ];
  return { getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }) };
}

function fakeBaseNova() {
  let rows = [['INFLU_KEY', 'STATUS', 'CHAVE_PIX']];
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
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

function montarPortal({ baseLegada, baseNova, propriedades }) {
  return loadGas(
    [
      'src/shared/Envelope.js',
      'src/shared/Config.js',
      'src/domain/Parceira.js',
      'src/domain/ChaveInfluenciadora.js',
      'src/acl/ParceiraACL.js',
      'src/acl/LegadoACL.js',
      'src/service/ImportadorService.js',
      'src/controller/ImportacaoController.js',
      'src/entrypoint/Portal.js',
    ],
    {
      PropertiesService: {
        getScriptProperties: () => ({ getProperty: (chave) => propriedades[chave] || null }),
      },
      SpreadsheetApp: {
        openById: (id) => ({
          getSheetByName: (nome) => {
            if (nome !== 'BASE DE DADOS') return null;
            if (id === 'id-nova') return baseNova;
            if (id === 'id-legada') return baseLegada;
            return null;
          },
        }),
      },
      LockService: {
        getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }),
      },
    }
  );
}

describe('Entrypoint · Portal — Importação Inicial da Base (SPEC-003)', () => {
  test('importarBaseLegada cura e grava na base nova, sem tocar a legada (RN-01/RN-05/CB-01)', () => {
    const baseNova = fakeBaseNova();
    const gas = montarPortal({
      baseLegada: fakeBaseLegada(),
      baseNova,
      propriedades: { SPREADSHEET_ID: 'id-nova', SPREADSHEET_ID_LEGADO: 'id-legada' },
    });

    const resposta = gas.importarBaseLegada();

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual({ totalImportado: 1 });
    expect(baseNova._rows).toHaveLength(2);
    expect(baseNova._rows[1]).toEqual(['Maria', 'ON', 'pix@maria']);
  });

  test('SPREADSHEET_ID_LEGADO ausente vira envelope de falha (nunca exceção crua)', () => {
    const gas = montarPortal({
      baseLegada: fakeBaseLegada(),
      baseNova: fakeBaseNova(),
      propriedades: { SPREADSHEET_ID: 'id-nova' },
    });

    const resposta = gas.importarBaseLegada();

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/SPREADSHEET_ID_LEGADO/);
  });
});
