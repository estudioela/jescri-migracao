const { loadGas } = require('./helpers/gasHarness');

// Slice ponta a ponta do M3 (SPEC-009): compilarMes → MesCompilado →
// briefings recriados na aba BRIEFING (RN-03) → preencherBriefing →
// Publicado persistido → obterBriefing lê a projeção. Pilha real
// (Portal → Controller → Service → Repository → BriefingACL) sobre fakes
// de planilha.
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
    ['Maria', 'ON', 'pix@maria', 3500, '1', '', '2', ''],
    ['Ana', 'OFF', 'pix@ana', 1200, '1', '', '', ''],
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

function fakeColaboracoes() {
  return fakeAbaGravavel([
    'INFLU_KEY',
    'MES_REFERENCIA',
    'ANO_REFERENCIA',
    'ESTADO',
    'SNAPSHOT_VALOR',
    'SNAPSHOT_FORMATOS',
    'SNAPSHOT_QTD_POR_FORMATO',
  ]);
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

// Aba ENTREGAS fake (M4): compilar materializa Entregas (SPEC-012 RN-01) e
// publicar o briefing espelha aprovações (§14.1), então o slice do M3
// precisa da aba desde M4.
function fakeEntregasAba() {
  return fakeAbaGravavel([
    'INFLU_KEY',
    'ANO_REFERENCIA',
    'MES_REFERENCIA',
    'ROTULO',
    'ESTADO',
    'LINK_MATERIAL',
    'DATA_APROVACAO_INTERNA',
    'DATA_ARQUIVAMENTO',
  ]);
}

// Aba ENVIOS fake (M5): compilar também materializa os Envios da
// competência (SPEC-016 RN-01), então o slice do M3 precisa da aba desde M5.
function fakeEnviosAba() {
  return fakeAbaGravavel([
    'INFLU_KEY',
    'ANO_REFERENCIA',
    'MES_REFERENCIA',
    'STATUS_REVISAO',
    'STATUS_LOGISTICA',
    'RASTREIO',
    'DATA_ENVIO',
    'DATA_ARQUIVAMENTO',
  ]);
}

function montarPortal(abas) {
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
        getScriptProperties: () => ({ getProperty: () => 'fake-spreadsheet-id' }),
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

function portalCompilado() {
  const briefingAba = fakeBriefingAba();
  const gas = montarPortal({
    'BASE DE DADOS': fakeBaseDeDados(),
    COLABORACOES: fakeColaboracoes(),
    BRIEFING: briefingAba,
    ENTREGAS: fakeEntregasAba(),
    ENVIOS: fakeEnviosAba(),
    PAGAMENTOS: fakeAbaGravavel([
      'ID_OBRIGACAO',
      'INFLU_KEY',
      'TIPO_PAGAMENTO',
      'ANO_REFERENCIA',
      'MES_REFERENCIA',
      'VALOR',
      'ESTADO',
      'DATA_ARQUIVAMENTO',
    ]),
  });
  expect(gas.compilarMes({ mesReferencia: '2026-07' }).success).toBe(true);
  return { gas, briefingAba };
}

const blocosDeMaria = [
  {
    rotulo: 'Reels',
    look: 'Look 12 — vestido linho',
    dataEntrega: '2026-07-10',
    dataPostagem: '2026-07-22',
    orientacao: 'Luz natural.',
  },
  { rotulo: 'Stories 1', look: 'Look 3', dataEntrega: '2026-07-10', dataPostagem: '2026-07-24' },
  { rotulo: 'Stories 2', look: 'Look 4', dataEntrega: '2026-07-10', dataPostagem: '2026-07-26' },
];

describe('Entrypoint · Portal — slice do Briefing (SPEC-009 §20)', () => {
  test('compilar recria rascunho; preencher publica com aprovação derivada (RN-01); leitura persiste', () => {
    const { gas, briefingAba } = portalCompilado();

    const rascunho = gas.obterBriefing({ mesReferencia: '2026-07', parceiraId: 'Maria' });
    expect(rascunho.success).toBe(true);
    expect(rascunho.data.estado).toBe('Rascunho');
    expect(rascunho.data.blocos.map((b) => b.rotulo)).toEqual([
      'Reels',
      'Stories 1',
      'Stories 2',
    ]);

    const publicado = gas.preencherBriefing({
      mesReferencia: '2026-07',
      parceiraId: 'Maria',
      blocos: blocosDeMaria,
    });
    expect(publicado.success).toBe(true);
    expect(publicado.data.estado).toBe('Publicado');
    // RN-01: postagem quarta 22/07 → −7 = 15/07 (quarta, sem ajuste);
    // sexta 24/07 → 17/07 (sexta) +3 = 20/07; domingo 26/07 → 19/07 +1 = 20/07.
    expect(publicado.data.blocos.map((b) => b.dataAprovacaoInterna)).toEqual([
      '2026-07-15',
      '2026-07-20',
      '2026-07-20',
    ]);

    const relido = gas.obterBriefing({ mesReferencia: '2026-07', parceiraId: 'Maria' });
    expect(relido.data.estado).toBe('Publicado');
    expect(relido.data.blocos[0].look).toBe('Look 12 — vestido linho');
    expect(briefingAba._rows.slice(1).every((linha) => linha[3] === 'PUBLICADO')).toBe(true);
  });

  test('BR-01: parceira sem Colaboração compilada é recusada em envelope de falha', () => {
    const { gas } = portalCompilado();

    const resposta = gas.preencherBriefing({
      mesReferencia: '2026-07',
      parceiraId: 'Ana',
      blocos: [],
    });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/BR-01/);
  });

  test('bloco pendente impede publicação (UC-009.01) e o rascunho permanece', () => {
    const { gas } = portalCompilado();

    const resposta = gas.preencherBriefing({
      mesReferencia: '2026-07',
      parceiraId: 'Maria',
      blocos: blocosDeMaria.slice(0, 1),
    });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/não preenchido/);
    const relido = gas.obterBriefing({ mesReferencia: '2026-07', parceiraId: 'Maria' });
    expect(relido.data.estado).toBe('Rascunho');
  });

  test('aba BRIEFING ausente vira envelope de falha (nunca exceção crua)', () => {
    const gas = montarPortal({
      'BASE DE DADOS': fakeBaseDeDados(),
      COLABORACOES: fakeColaboracoes(),
    });

    const resposta = gas.preencherBriefing({
      mesReferencia: '2026-07',
      parceiraId: 'Maria',
      blocos: [],
    });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/BRIEFING/);
  });
});
