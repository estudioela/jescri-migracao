const { loadGas } = require('./helpers/gasHarness');
const { ADMIN_TOKEN, ARQUIVOS_IDENTIDADE, abasIdentidade } = require('./helpers/rbacFixture');

// Slice do M7 (SPEC-023): Portal → Controller → Service → Repository →
// DocumentoACL/ParceiraACL sobre fakes de planilha. O cenário de sucesso
// exercita gerarContrato (UC-023.01), que mescla apenas dados da BASE DE
// DADOS — o briefing formal depende da aba BRIEFING e é coberto no teste
// de service.
function fakeBaseDeDados() {
  const rows = [
    [
      'INFLU_KEY',
      'STATUS',
      'INFLUENCIADORA_RAZAO_SOCIAL',
      'INFLUENCIADORA_CNPJ',
      'INFLUENCIADORA_ENDERECO',
      'VALOR_TOTAL',
      'VALOR_TOTAL_EXTENSO',
      'REELS_TEXTO',
      'CARROSSEL_TEXTO',
      'STORIES_TEXTO',
      'LOOKS_QTD_TEXTO',
      'CANAIS_USO_IMAGEM',
      'PRAZO_USO_IMAGEM',
      'CIDADE_ASSINATURA',
      'DATA_ASSINATURA',
      'SIM/NÃO',
    ],
    [
      'Maria',
      'ON',
      'Maria Conteúdo LTDA',
      '12.345.678/0001-99',
      'Rua das Flores, 123 — São Paulo/SP',
      3500,
      'três mil e quinhentos reais',
      '2 reels',
      '',
      '4 stories',
      '',
      'Instagram e site da marca',
      '12 meses',
      'São Paulo',
      '2026-07-16',
      'SIM',
    ],
  ];
  return {
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
  };
}

function fakeAbaGravavel(cabecalho) {
  let rows = [cabecalho.slice()];
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

function fakeDocumentosAba() {
  return fakeAbaGravavel(['INFLU_KEY', 'TIPO_DOCUMENTO', 'MES_REFERENCIA', 'REFERENCIA']);
}

function fakeBriefingAba() {
  return fakeAbaGravavel([
    'INFLU_KEY',
    'MES_REFERENCIA',
    'ANO_REFERENCIA',
    'ESTADO',
    'BLOCO_ROTULO',
    'LOOK',
    'DATA_ENTREGA',
    'DATA_POSTAGEM',
    'ORIENTACAO',
    'DATA_APROVACAO_INTERNA',
  ]);
}

function montarPortal(abas) {
  const identidadeAbas = abasIdentidade();
  return loadGas(
    [
      'src/shared/Nucleo.js',
      'src/modulos/ColaboracaoMensal.js',
      'src/modulos/Parceira.js',
      'src/modulos/Briefing.js',
      'src/modulos/Documento.js',
      'src/entrypoint/Portal.js',
      ...ARQUIVOS_IDENTIDADE,
    ],
    {
      PropertiesService: {
        getScriptProperties: () => ({ getProperty: () => 'fake-spreadsheet-id' }),
      },
      SpreadsheetApp: {
        openById: () => ({
          getSheetByName: (nome) => abas[nome] || identidadeAbas[nome] || null,
        }),
      },
      Utilities: {
        getUuid: (() => {
          let contador = 0;
          return () => 'uuid-' + ++contador;
        })(),
      },
    }
  );
}

describe('Entrypoint · Portal — slice de Documentos (SPEC-023)', () => {
  test('gerarContrato para Parceira Ativa persiste a referência na aba DOCUMENTOS (UC-023.01)', () => {
    const documentosAba = fakeDocumentosAba();
    const gas = montarPortal({
      'BASE DE DADOS': fakeBaseDeDados(),
      BRIEFING: fakeBriefingAba(),
      DOCUMENTOS: documentosAba,
    });

    const resposta = gas.gerarContrato({ parceiraId: 'Maria', token: ADMIN_TOKEN });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toMatchObject({
      parceiraId: 'Maria',
      tipo: 'Contrato',
      estado: 'Gerado',
    });
    // O conteúdo mesclado volta ao operador; a aba persiste só a referência
    // opaca — nunca o conteúdo nem PII (RNF-01).
    expect(resposta.data.conteudo).toContain('Maria Conteúdo LTDA');
    const linhaMaria = documentosAba._rows.find((linha) => linha[0] === 'Maria');
    expect(linhaMaria[1]).toBe('CONTRATO');
    expect(String(linhaMaria[3])).not.toBe('');
    expect(String(linhaMaria[3])).not.toContain('12.345.678');
    expect(String(linhaMaria[3])).not.toContain('Rua das Flores');
  });

  test('aba DOCUMENTOS ausente vira envelope de falha (nunca exceção crua)', () => {
    const gas = montarPortal({
      'BASE DE DADOS': fakeBaseDeDados(),
      BRIEFING: fakeBriefingAba(),
    });

    const resposta = gas.gerarContrato({ parceiraId: 'Maria', token: ADMIN_TOKEN });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/DOCUMENTOS/);
  });
});
