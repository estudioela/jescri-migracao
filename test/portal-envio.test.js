const { loadGas } = require('./helpers/gasHarness');
const { ADMIN_TOKEN, ARQUIVOS_IDENTIDADE, abasIdentidade } = require('./helpers/rbacFixture');

// Slice ponta a ponta do M5 (SPEC-016): compilarMes → MesCompilado →
// Envios materializados na aba ENVIOS (RN-01) → confirmarEndereco (D-03,
// lê ENDERECO/PIX só da BASE DE DADOS) → registrarRastreio (RN-02) →
// atualizarStatus (RNF-01, adaptador manual degradável) → listarEnvios lê a
// projeção. Pilha real (Portal → Controller → Service → Repository →
// EnvioACL/ParceiraACL) sobre fakes de planilha.
function fakeBaseDeDados() {
  const rows = [
    [
      'INFLU_KEY',
      'STATUS',
      'CHAVE_PIX',
      'INFLUENCIADORA_ENDERECO',
      'VALOR_TOTAL',
      'REELS_TEXTO',
      'CARROSSEL_TEXTO',
      'STORIES_TEXTO',
      'LOOKS_QTD',
    ],
    ['Maria', 'ON', 'pix@maria', 'Rua das Flores, 123 — São Paulo/SP', 3500, '1', '', '2', ''],
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
  const enviosAba = fakeEnviosAba();
  const gas = montarPortal({
    'BASE DE DADOS': fakeBaseDeDados(),
    COLABORACOES: fakeColaboracoes(),
    BRIEFING: fakeBriefingAba(),
    ENTREGAS: fakeEntregasAba(),
    ENVIOS: enviosAba,
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
  return { gas, enviosAba };
}

describe('Entrypoint · Portal — slice do Envio (SPEC-016)', () => {
  test('materializa no compilar (RN-01) e atravessa confirmar endereço → registrar rastreio → atualizar status', () => {
    const { gas, enviosAba } = portalCompilado();

    // RN-01: uma Parceira ativa (Maria) → um Envio, AguardandoConfirmacao/Pendente.
    const materializados = gas.listarEnvios({ mesReferencia: '2026-07', token: ADMIN_TOKEN });
    expect(materializados.success).toBe(true);
    expect(materializados.data).toHaveLength(1);
    expect(materializados.data[0]).toMatchObject({
      parceiraId: 'Maria',
      revisao: 'AguardandoConfirmacao',
      jornada: 'Pendente',
    });

    // UC-016.01/D-03: confirma o endereço e devolve a mensagem manual com
    // endereço e PIX lidos exclusivamente da BASE DE DADOS via ParceiraACL.
    const confirmado = gas.confirmarEndereco({ mesReferencia: '2026-07', parceiraId: 'Maria', token: ADMIN_TOKEN });
    expect(confirmado.success).toBe(true);
    expect(confirmado.data.revisao).toBe('Confirmado');
    expect(confirmado.data.mensagem).toContain('Rua das Flores, 123');
    expect(confirmado.data.mensagem).toContain('pix@maria');
    // A projeção do Envio nunca carrega PII, mesmo com a mensagem presente.
    expect(confirmado.data.endereco).toBeUndefined();

    // UC-016.02/RN-02: registra o rastreio, preenchendo a data de envio.
    const registrado = gas.registrarRastreio({
      mesReferencia: '2026-07',
      parceiraId: 'Maria',
      codigo: 'BR123456789XX',
      token: ADMIN_TOKEN,
    });
    expect(registrado.success).toBe(true);
    expect(registrado.data.jornada).toBe('Expedido');
    expect(registrado.data.rastreio).toBe('BR123456789XX');
    expect(registrado.data.dataEnvio).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // UC-016.03/RNF-01: o adaptador manual (D-02, dívida) nunca indica
    // entrega sozinho — a operação segue sem erro, jornada inalterada.
    const statusAtualizado = gas.atualizarStatus({
      mesReferencia: '2026-07',
      parceiraId: 'Maria',
      token: ADMIN_TOKEN,
    });
    expect(statusAtualizado.success).toBe(true);
    expect(statusAtualizado.data.jornada).toBe('Expedido');

    // Persistência real na aba: estado cru gravado pela ACL.
    const linhaMaria = enviosAba._rows.find((linha) => linha[0] === 'Maria');
    expect(linhaMaria[3]).toBe('CONFIRMADO');
    expect(linhaMaria[4]).toBe('EXPEDIDO');
    expect(linhaMaria[5]).toBe('BR123456789XX');
  });

  test('LG-01: Envio inexistente é recusado em envelope de falha', () => {
    const { gas } = portalCompilado();

    const resposta = gas.registrarRastreio({
      mesReferencia: '2026-07',
      parceiraId: 'Ana',
      codigo: 'BR123',
      token: ADMIN_TOKEN,
    });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/LG-01/);
  });

  test('aba ENVIOS ausente vira envelope de falha (nunca exceção crua)', () => {
    const gas = montarPortal({
      'BASE DE DADOS': fakeBaseDeDados(),
      COLABORACOES: fakeColaboracoes(),
      BRIEFING: fakeBriefingAba(),
      ENTREGAS: fakeEntregasAba(),
    });

    const resposta = gas.listarEnvios({ mesReferencia: '2026-07', token: ADMIN_TOKEN });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/ENVIOS/);
  });
});
