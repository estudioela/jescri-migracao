const { loadGas } = require('./helpers/gasHarness');

// Smoke test do Entrypoint "Portal": prova que a função exposta a
// google.script.run (`compilarMes`) compõe a pilha real do Vertical Slice
// Colaboração Mensal — Controller -> CompiladorDoMes -> Repository ->
// ColaboracaoMensalACL (aba COLABORACOES) + ParceiraACL (BASE DE DADOS) —
// sobre planilha obtida de SpreadsheetApp/PropertiesService (aqui, fakes).
function fakeBaseDeDados() {
  const rows = [
    [
      'INFLU_KEY',
      'STATUS',
      'CHAVE_PIX',
      'VALOR_TOTAL',
      'REELS_TEXTO',
      'CARROSSEL_TEXTO',
      'STORIES_TEXTO',
      'LOOKS_QTD',
    ],
    ['Maria', 'ON', 'pix@maria', 3500, '2', '', '4', ''],
    ['Ana', 'OFF', 'pix@ana', 1200, '1', '', '', ''],
  ];
  return {
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
  };
}

function fakeColaboracoes() {
  const rows = [
    [
      'INFLU_KEY',
      'MES_REFERENCIA',
      'ANO_REFERENCIA',
      'ESTADO',
      'SNAPSHOT_VALOR',
      'SNAPSHOT_FORMATOS',
      'SNAPSHOT_QTD_POR_FORMATO',
    ],
  ];
  return {
    _rows: rows,
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

function montarPortal(abas, propriedade) {
  return loadGas(
    [
      'src/shared/Envelope.js',
      'src/shared/Config.js',
      'src/domain/Parceira.js',
      'src/domain/MesReferencia.js',
      'src/domain/CondicaoComercialSnapshot.js',
      'src/domain/ColaboracaoMensal.js',
      'src/acl/ParceiraACL.js',
      'src/acl/ColaboracaoMensalACL.js',
      'src/repository/ParceiraRepository.js',
      'src/repository/ColaboracaoMensalRepository.js',
      'src/service/CadastrarParceiraService.js',
      'src/service/CompiladorDoMes.js',
      'src/controller/ParceiraController.js',
      'src/controller/ColaboracaoMensalController.js',
      'src/entrypoint/Portal.js',
    ],
    {
      PropertiesService: {
        getScriptProperties: () => ({ getProperty: () => propriedade }),
      },
      SpreadsheetApp: {
        openById: () => ({ getSheetByName: (nome) => abas[nome] || null }),
      },
    }
  );
}

describe('Entrypoint · Portal.compilarMes (smoke)', () => {
  test('compila a competência das ativas na aba COLABORACOES e devolve envelope', () => {
    const colaboracoes = fakeColaboracoes();
    const gas = montarPortal(
      { 'BASE DE DADOS': fakeBaseDeDados(), COLABORACOES: colaboracoes },
      'fake-spreadsheet-id'
    );

    const resposta = gas.compilarMes({ mesReferencia: '2026-07' });

    expect(resposta.success).toBe(true);
    expect(resposta.data.jaCompilada).toBe(false);
    expect(resposta.data.colaboracoes).toEqual([
      {
        parceiraId: 'Maria',
        mesReferencia: '2026-07',
        estado: 'Ativa',
        snapshot: {
          valorMensal: 3500,
          formatosContratados: ['Reels', 'Stories'],
          quantidadePorFormato: { Reels: 2, Stories: 4 },
        },
      },
    ]);
    expect(colaboracoes._rows).toHaveLength(2);
    expect(colaboracoes._rows[1][0]).toBe('Maria');

    const segunda = gas.compilarMes({ mesReferencia: '2026-07' });
    expect(segunda.success).toBe(true);
    expect(segunda.data.jaCompilada).toBe(true);
    expect(colaboracoes._rows).toHaveLength(2);
  });

  test('aba COLABORACOES ausente vira envelope de falha (nunca exceção crua)', () => {
    const gas = montarPortal(
      { 'BASE DE DADOS': fakeBaseDeDados() },
      'fake-spreadsheet-id'
    );

    const resposta = gas.compilarMes({ mesReferencia: '2026-07' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/COLABORACOES/);
  });

  test('config ausente vira envelope de falha', () => {
    const gas = montarPortal(
      { 'BASE DE DADOS': fakeBaseDeDados(), COLABORACOES: fakeColaboracoes() },
      ''
    );

    const resposta = gas.compilarMes({ mesReferencia: '2026-07' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/config ausente/i);
  });
});
