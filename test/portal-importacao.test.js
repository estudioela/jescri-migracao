const { loadGas } = require('./helpers/gasHarness');
const { ADMIN_TOKEN, ARQUIVOS_IDENTIDADE, abasIdentidade } = require('./helpers/rbacFixture');

// Slice adjacente (SPEC-003): Portal -> ImportacaoController ->
// ImportadorService -> LegadoACL (planilha legada, SOMENTE LEITURA) +
// ParceiraACL (planilha nova) sobre fakes de DUAS planilhas distintas —
// exercita abrirBaseDeDadosLegada() e a resolução por CONFIG_KEYS
// separada de SPREADSHEET_ID/SPREADSHEET_ID_LEGADO.
//
// `importarBaseLegada` exige papel ADMINISTRADOR (SPEC-003 §13/IM-03,
// gap fechado em 2026-07-18 — auditoria de apoio, mesmo mecanismo de §11
// do TASK_ROUTER) — abas de identidade seedadas via rbacFixture, sempre
// resolvidas pelo SPREADSHEET_ID (nova), nunca pelo legado.
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
  const identidadeAbas = abasIdentidade();
  return loadGas(
    [
      'src/shared/Nucleo.js',
      'src/modulos/Parceira.js',
      'src/entrypoint/Portal.js',
      ...ARQUIVOS_IDENTIDADE,
    ],
    {
      PropertiesService: {
        getScriptProperties: () => ({ getProperty: (chave) => propriedades[chave] || null }),
      },
      SpreadsheetApp: {
        openById: (id) => ({
          getSheetByName: (nome) => {
            if (id === 'id-legada') return nome === 'BASE DE DADOS' ? baseLegada : null;
            if (id === 'id-nova') {
              if (nome === 'BASE DE DADOS') return baseNova;
              return identidadeAbas[nome] || null;
            }
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
      propriedades: {
        SPREADSHEET_ID: 'id-nova',
        SPREADSHEET_ID_LEGADO: 'id-legada',
        GOOGLE_CLIENT_ID: 'fake-client-id',
        GOOGLE_CLIENT_SECRET: 'fake-client-secret',
      },
    });

    const resposta = gas.importarBaseLegada({ token: ADMIN_TOKEN });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual({ totalImportado: 1 });
    expect(baseNova._rows).toHaveLength(2);
    expect(baseNova._rows[1]).toEqual(['Maria', 'ON', 'pix@maria']);
  });

  test('SPREADSHEET_ID_LEGADO ausente vira envelope de falha (nunca exceção crua)', () => {
    const gas = montarPortal({
      baseLegada: fakeBaseLegada(),
      baseNova: fakeBaseNova(),
      propriedades: {
        SPREADSHEET_ID: 'id-nova',
        GOOGLE_CLIENT_ID: 'fake-client-id',
        GOOGLE_CLIENT_SECRET: 'fake-client-secret',
      },
    });

    const resposta = gas.importarBaseLegada({ token: ADMIN_TOKEN });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/SPREADSHEET_ID_LEGADO/);
  });

  test('SPEC-003 §13/IM-03: sem sessão ADMINISTRADOR, a importação é recusada (RBAC)', () => {
    const baseNova = fakeBaseNova();
    const gas = montarPortal({
      baseLegada: fakeBaseLegada(),
      baseNova,
      propriedades: {
        SPREADSHEET_ID: 'id-nova',
        SPREADSHEET_ID_LEGADO: 'id-legada',
        GOOGLE_CLIENT_ID: 'fake-client-id',
        GOOGLE_CLIENT_SECRET: 'fake-client-secret',
      },
    });

    const resposta = gas.importarBaseLegada({ token: 'token-invalido' });

    expect(resposta.success).toBe(false);
    expect(baseNova._rows).toHaveLength(1);
  });
});
