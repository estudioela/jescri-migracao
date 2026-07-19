const { loadGas } = require('./helpers/gasHarness');
const { ADMIN_TOKEN, ARQUIVOS_IDENTIDADE, abasIdentidade } = require('./helpers/rbacFixture');

// Slice ponta a ponta do M4 (SPEC-012): compilarMes → MesCompilado →
// Entregas materializadas na aba ENTREGAS (RN-01) → preencherBriefing →
// BriefingPublicado → aprovação interna espelhada (§14.1) → enviarMaterial
// → aprovar → publicar (arquivamento RN-04) → listarEntregas lê a
// projeção. Pilha real (Portal → Controller → Service → Repository →
// EntregaACL) sobre fakes de planilha.
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
// competência (SPEC-016 RN-01), então o slice do M4 precisa da aba desde M5.
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
  const identidadeAbas = abasIdentidade();
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
  const entregasAba = fakeEntregasAba();
  const gas = montarPortal({
    'BASE DE DADOS': fakeBaseDeDados(),
    COLABORACOES: fakeColaboracoes(),
    BRIEFING: fakeBriefingAba(),
    ENTREGAS: entregasAba,
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
  return { gas, entregasAba };
}

describe('Entrypoint · Portal — slice da Entrega (SPEC-012 §20)', () => {
  test('materializa no compilar (RN-01), espelha aprovação (§14.1) e atravessa enviar → aprovar → publicar', () => {
    const { gas, entregasAba } = portalCompilado();

    // RN-01: Reels×1 + Stories×2 = 3 Entregas, uma por unidade contratada.
    const materializadas = gas.listarEntregas({ mesReferencia: '2026-07', token: ADMIN_TOKEN });
    expect(materializadas.success).toBe(true);
    expect(materializadas.data.map((e) => e.rotulo)).toEqual([
      'Reels',
      'Stories 1',
      'Stories 2',
    ]);
    expect(materializadas.data.every((e) => e.estado === 'AguardandoMaterial')).toBe(true);

    // §14.1: BriefingPublicado espelha a aprovação interna derivada (RN-01
    // do M3: postagem quarta 22/07 → 15/07) na Entrega de mesmo rótulo.
    const publicado = gas.preencherBriefing({
      mesReferencia: '2026-07',
      parceiraId: 'Maria',
      blocos: [
        {
          rotulo: 'Reels',
          look: 'Look 12',
          dataEntrega: '2026-07-10',
          dataPostagem: '2026-07-22',
        },
        { rotulo: 'Stories 1', look: 'Look 3', dataEntrega: '2026-07-10', dataPostagem: '2026-07-24' },
        { rotulo: 'Stories 2', look: 'Look 4', dataEntrega: '2026-07-10', dataPostagem: '2026-07-26' },
      ],
    });
    expect(publicado.success).toBe(true);
    const espelhadas = gas.listarEntregas({ mesReferencia: '2026-07', parceiraId: 'Maria', token: ADMIN_TOKEN });
    expect(espelhadas.data[0].dataAprovacaoInterna).toBe('2026-07-15');

    // UC-012.02/03: enviar → EmRevisao; aprovar → Aprovado; publicar →
    // Publicado com arquivamento automático do relógio (RN-04).
    const comando = { mesReferencia: '2026-07', parceiraId: 'Maria', rotulo: 'Reels', token: ADMIN_TOKEN };
    const enviada = gas.enviarMaterial(
      Object.assign({ link: 'https://drive.google.com/x' }, comando)
    );
    expect(enviada.success).toBe(true);
    expect(enviada.data.estado).toBe('EmRevisao');
    expect(enviada.data.material).toBe('https://drive.google.com/x');

    expect(gas.aprovarEntrega(comando).data.estado).toBe('Aprovado');

    const publicada = gas.publicarEntrega(comando);
    expect(publicada.success).toBe(true);
    expect(publicada.data.estado).toBe('Publicado');
    expect(publicada.data.dataArquivamento).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Persistência real na aba: estado cru gravado pela ACL.
    const linhaReels = entregasAba._rows.find((linha) => linha[3] === 'Reels');
    expect(linhaReels[4]).toBe('PUBLICADO');
  });

  test('CT-01: Entrega inexistente é recusada em envelope de falha', () => {
    const { gas } = portalCompilado();

    const resposta = gas.enviarMaterial({
      mesReferencia: '2026-07',
      parceiraId: 'Maria',
      rotulo: 'Carrossel',
      link: 'https://drive.google.com/x',
      token: ADMIN_TOKEN,
    });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/CT-01/);
  });

  test('§11/SPEC-012: sem sessão ADMINISTRADOR, enviarMaterial é recusado (RBAC)', () => {
    const { gas } = portalCompilado();

    const resposta = gas.enviarMaterial({
      mesReferencia: '2026-07',
      parceiraId: 'Maria',
      rotulo: 'Reels',
      link: 'https://drive.google.com/x',
      token: 'token-invalido',
    });

    expect(resposta.success).toBe(false);
  });

  test('aba ENTREGAS ausente vira envelope de falha (nunca exceção crua)', () => {
    const gas = montarPortal({
      'BASE DE DADOS': fakeBaseDeDados(),
      COLABORACOES: fakeColaboracoes(),
      BRIEFING: fakeBriefingAba(),
    });

    const resposta = gas.listarEntregas({ mesReferencia: '2026-07', token: ADMIN_TOKEN });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/ENTREGAS/);
  });
});
