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

// Aba BRIEFING fake (M3): a compilação recria os briefings da competência
// (SPEC-009 RN-03), então o smoke do Portal precisa da aba desde M3.
function fakeBriefingAba() {
  let rows = [
    [
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
    ],
  ];
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

// Aba ENTREGAS fake (M4): MesCompilado também materializa as Entregas da
// competência (SPEC-012 RN-01), então o smoke do Portal precisa da aba
// desde M4.
function fakeEntregasAba() {
  let rows = [
    [
      'INFLU_KEY',
      'ANO_REFERENCIA',
      'MES_REFERENCIA',
      'ROTULO',
      'ESTADO',
      'LINK_MATERIAL',
      'DATA_APROVACAO_INTERNA',
      'DATA_ARQUIVAMENTO',
    ],
  ];
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

// Aba PAGAMENTOS fake (M6): MesCompilado também materializa as Obrigações
// Financeiras mensais da competência (SPEC-020 RN-01), então o smoke do
// Portal precisa da aba desde M6.
function fakePagamentosAba() {
  let rows = [
    [
      'ID_OBRIGACAO',
      'INFLU_KEY',
      'TIPO_PAGAMENTO',
      'ANO_REFERENCIA',
      'MES_REFERENCIA',
      'VALOR',
      'ESTADO',
      'DATA_ARQUIVAMENTO',
    ],
  ];
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

// Aba ENVIOS fake (M5): MesCompilado também materializa os Envios da
// competência (SPEC-016 RN-01), então o smoke do Portal precisa da aba
// desde M5.
function fakeEnviosAba() {
  let rows = [
    [
      'INFLU_KEY',
      'ANO_REFERENCIA',
      'MES_REFERENCIA',
      'STATUS_REVISAO',
      'STATUS_LOGISTICA',
      'RASTREIO',
      'DATA_ENVIO',
      'DATA_ARQUIVAMENTO',
    ],
  ];
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

function montarPortal(abas, propriedade) {
  return loadGas(
    [
      'src/shared/Nucleo.js',
      'src/modulos/Parceira.js',
      'src/modulos/ColaboracaoMensal.js',
      'src/modulos/Briefing.js',
      'src/modulos/Entrega.js',
      'src/modulos/Envio.js',
      'src/modulos/Financeiro.js',
      'src/entrypoint/Portal.js',
    ],
    {
      PropertiesService: {
        getScriptProperties: () => ({ getProperty: () => propriedade }),
      },
      SpreadsheetApp: {
        openById: () => ({ getSheetByName: (nome) => abas[nome] || null }),
      },
      // SPEC-020: geradorDeTokenUuid() cumpre a identidade das Obrigações.
      Utilities: {
        getUuid: (() => {
          let contador = 0;
          return () => 'uuid-' + ++contador;
        })(),
      },
      LockService: {
        getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }),
      },
    }
  );
}

describe('Entrypoint · Portal.compilarMes (smoke)', () => {
  test('compila a competência das ativas na aba COLABORACOES e devolve envelope', () => {
    const colaboracoes = fakeColaboracoes();
    const briefing = fakeBriefingAba();
    const entregas = fakeEntregasAba();
    const envios = fakeEnviosAba();
    const pagamentos = fakePagamentosAba();
    const gas = montarPortal(
      {
        'BASE DE DADOS': fakeBaseDeDados(),
        COLABORACOES: colaboracoes,
        BRIEFING: briefing,
        ENTREGAS: entregas,
        ENVIOS: envios,
        PAGAMENTOS: pagamentos,
      },
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
    // M3 (SPEC-009 RN-03): MesCompilado recria o briefing como rascunho —
    // Maria: Reels×2 + Stories×4 = 6 blocos (uma linha por bloco).
    expect(briefing._rows).toHaveLength(7);
    expect(briefing._rows.slice(1).every((linha) => linha[3] === 'RASCUNHO')).toBe(true);
    // M4 (SPEC-012 RN-01): MesCompilado materializa uma Entrega por unidade
    // contratada — Maria: Reels×2 + Stories×4 = 6 linhas.
    expect(entregas._rows).toHaveLength(7);
    expect(entregas._rows.slice(1).every((linha) => linha[4] === 'AGUARDANDO_MATERIAL')).toBe(true);
    // M5 (SPEC-016 RN-01): MesCompilado materializa um Envio por Parceira
    // Ativa — Maria: 1 linha.
    expect(envios._rows).toHaveLength(2);
    expect(envios._rows[1][3]).toBe('AGUARDANDO_CONFIRMACAO');
    expect(envios._rows[1][4]).toBe('PENDENTE');
    // M6 (SPEC-020 RN-01): MesCompilado lança uma Obrigação Mensal EmAberto
    // por Parceira Ativa — Maria: 1 linha, valor da Condição Comercial.
    expect(pagamentos._rows).toHaveLength(2);
    expect(pagamentos._rows[1][1]).toBe('Maria');
    expect(pagamentos._rows[1][5]).toBe(3500);
    expect(pagamentos._rows[1][6]).toBe('EM_ABERTO');

    const segunda = gas.compilarMes({ mesReferencia: '2026-07' });
    expect(segunda.success).toBe(true);
    expect(segunda.data.jaCompilada).toBe(true);
    expect(colaboracoes._rows).toHaveLength(2);
    expect(briefing._rows).toHaveLength(7);
    expect(entregas._rows).toHaveLength(7);
    expect(envios._rows).toHaveLength(2);
    expect(pagamentos._rows).toHaveLength(2);
  });

  // Achado F1 da auditoria SPEC-012 (docs/_workspace/auditorias/AUDITORIA_SPEC012.md):
  // uma compilação anterior pode ter persistido as Colaborações e falhado
  // antes de materializar Briefing/Entrega/Envio. Sem reconciliação, o no-op
  // de `jaCompilada` selaria esse estado parcial para sempre.
  test('reconcilia materializações ausentes quando a competência já estava compilada (F1/F2)', () => {
    const colaboracoes = fakeColaboracoes();
    // Simula compilação anterior que persistiu a Colaboração mas falhou
    // antes de materializar Briefing/Entrega/Envio.
    colaboracoes._rows.push([
      'Maria',
      7,
      2026,
      'ATIVA',
      3500,
      'Reels, Stories',
      JSON.stringify({ Reels: 2, Stories: 4 }),
    ]);
    const briefing = fakeBriefingAba();
    const entregas = fakeEntregasAba();
    const envios = fakeEnviosAba();
    const pagamentos = fakePagamentosAba();
    const gas = montarPortal(
      {
        'BASE DE DADOS': fakeBaseDeDados(),
        COLABORACOES: colaboracoes,
        BRIEFING: briefing,
        ENTREGAS: entregas,
        ENVIOS: envios,
        PAGAMENTOS: pagamentos,
      },
      'fake-spreadsheet-id'
    );

    const resposta = gas.compilarMes({ mesReferencia: '2026-07' });

    expect(resposta.success).toBe(true);
    expect(resposta.data.jaCompilada).toBe(true);
    // As 4 materializações faltantes foram reconciliadas.
    expect(briefing._rows).toHaveLength(7);
    expect(entregas._rows).toHaveLength(7);
    expect(envios._rows).toHaveLength(2);
    expect(pagamentos._rows).toHaveLength(2);

    // Reconciliação é idempotente por sua vez: uma terceira chamada não
    // duplica o que já foi reconciliado.
    const terceira = gas.compilarMes({ mesReferencia: '2026-07' });
    expect(terceira.success).toBe(true);
    expect(briefing._rows).toHaveLength(7);
    expect(entregas._rows).toHaveLength(7);
    expect(envios._rows).toHaveLength(2);
    expect(pagamentos._rows).toHaveLength(2);
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
