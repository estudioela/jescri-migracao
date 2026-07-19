const { loadGas } = require('./helpers/gasHarness');

// Slice ponta a ponta do M8 · Conteúdo (SPEC-027): compilarMes → Entregas
// materializadas (SPEC-012) + Briefing publicado com aprovação espelhada
// (SPEC-009) → entrarNoPortal (SPEC-025) → verPendencias/lerBriefingDoItem/
// enviarMaterialDoPortal (SPEC-027), tudo sobre a pilha real de fakes de
// planilha. O relógio é o real do sistema (relogioDoSistema) — a
// competência corrente derivada dele precisa coincidir com '2026-07'
// (data real do ambiente de teste).

// Aba BASE DE DADOS: colunas do Cadastro (compilarMes) + do acesso legado
// (CUPOM/INFLUENCIADORA_CNPJ, RN-16).
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
      'CUPOM',
      'INFLUENCIADORA_CNPJ',
    ],
    ['Maria', 'ON', 'pix@maria', 3500, '1', '', '2', '', 'CUPOMMARIA', '12.345.678/0001-90'],
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

function fakeSessoesAba() {
  return fakeAbaGravavel(['TOKEN', 'PARCEIRA_ID', 'EXPIRA_EM']);
}

function fakeBloqueiosAba() {
  return fakeAbaGravavel(['IDENTIFICADOR', 'TENTATIVAS', 'BLOQUEIO_INICIO']);
}

function montarPortal(abas) {
  let uuid = 0;
  return loadGas(
    [
      'src/shared/Nucleo.js',
      'src/modulos/Parceira.js',
      'src/modulos/ColaboracaoMensal.js',
      'src/modulos/Briefing.js',
      'src/modulos/Entrega.js',
      'src/modulos/Envio.js',
      'src/modulos/Financeiro.js',
      'src/modulos/Autenticacao.js',
      'src/modulos/Arquivamento.js',
      'src/modulos/PortalConteudo.js',
      'src/entrypoint/Portal.js',
    ],
    {
      PropertiesService: {
        getScriptProperties: () => ({ getProperty: () => 'fake-spreadsheet-id' }),
      },
      SpreadsheetApp: {
        openById: () => ({ getSheetByName: (nome) => abas[nome] || null }),
      },
      Utilities: {
        getUuid: () => 'uuid-' + ++uuid,
      },
      // Trava de exclusão mútua do acesso (multiusuário) — no-op no teste.
      LockService: {
        getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }),
      },
    }
  );
}

function portalPronto() {
  const entregasAba = fakeEntregasAba();
  const gas = montarPortal({
    'BASE DE DADOS': fakeBaseDeDados(),
    COLABORACOES: fakeColaboracoes(),
    BRIEFING: fakeBriefingAba(),
    ENTREGAS: entregasAba,
    ENVIOS: fakeEnviosAba(),
    SESSOES: fakeSessoesAba(),
    BLOQUEIOS: fakeBloqueiosAba(),
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
  expect(
    gas.preencherBriefing({
      mesReferencia: '2026-07',
      parceiraId: 'Maria',
      blocos: [
        { rotulo: 'Reels', look: 'Look 12', dataEntrega: '2026-07-10', dataPostagem: '2026-07-22' },
        {
          rotulo: 'Stories 1',
          look: 'Look 3',
          dataEntrega: '2026-07-10',
          dataPostagem: '2026-07-24',
        },
        {
          rotulo: 'Stories 2',
          look: 'Look 4',
          dataEntrega: '2026-07-10',
          dataPostagem: '2026-07-26',
        },
      ],
    }).success
  ).toBe(true);
  const login = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '12345' });
  expect(login.success).toBe(true);
  return { gas, entregasAba, token: login.data.token };
}

describe('Entrypoint · Portal — slice do Conteúdo (SPEC-027 §20)', () => {
  test('verPendencias lista as 3 Entregas da Parceira com o briefing correspondente (UC-027.01)', () => {
    const { gas, token } = portalPronto();

    const resposta = gas.verPendencias({ token });

    expect(resposta.success).toBe(true);
    expect(resposta.data.map((i) => i.rotulo)).toEqual(['Reels', 'Stories 1', 'Stories 2']);
    expect(resposta.data.every((i) => i.estado === 'AguardandoMaterial')).toBe(true);
    expect(resposta.data[0].briefing).toEqual({
      look: 'Look 12',
      dataEntrega: '2026-07-10',
      dataPostagem: '2026-07-22',
    });
  });

  test('RN-03: antes de preencherBriefing, o rascunho existe mas não é exposto como briefing', () => {
    const entregasAba = fakeEntregasAba();
    const gas = montarPortal({
      'BASE DE DADOS': fakeBaseDeDados(),
      COLABORACOES: fakeColaboracoes(),
      BRIEFING: fakeBriefingAba(),
      ENTREGAS: entregasAba,
      ENVIOS: fakeEnviosAba(),
      SESSOES: fakeSessoesAba(),
      BLOQUEIOS: fakeBloqueiosAba(),
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
    const login = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '12345' });
    const token = login.data.token;

    // Entregas já materializadas (RN-01 de SPEC-012), mas o Briefing segue
    // Rascunho — a equipe ainda não chamou preencherBriefing.
    const pendencias = gas.verPendencias({ token });
    expect(pendencias.success).toBe(true);
    expect(pendencias.data.map((i) => i.rotulo)).toEqual(['Reels', 'Stories 1', 'Stories 2']);
    expect(pendencias.data.every((i) => i.briefing === null)).toBe(true);

    const leitura = gas.lerBriefingDoItem({ token, rotulo: 'Reels' });
    expect(leitura.success).toBe(false);
    expect(leitura.error.codigo).toBe('PC-02');
  });

  test('lerBriefingDoItem devolve o bloco do item pedido (UC-027.02)', () => {
    const { gas, token } = portalPronto();

    const resposta = gas.lerBriefingDoItem({ token, rotulo: 'Stories 1' });

    expect(resposta.success).toBe(true);
    expect(resposta.data.look).toBe('Look 3');
    expect(resposta.data.dataPostagem).toBe('2026-07-24');
  });

  test('enviarMaterialDoPortal move a Entrega a EmRevisao e ela some das Publicadas, mas segue em pendências (UC-027.03/RN-02)', () => {
    const { gas, entregasAba, token } = portalPronto();

    const enviado = gas.enviarMaterialDoPortal({
      token,
      rotulo: 'Reels',
      link: 'https://drive.google.com/x',
    });

    expect(enviado.success).toBe(true);
    expect(enviado.data.estado).toBe('EmRevisao');
    // Persistência real na aba ENTREGAS.
    const linha = entregasAba._rows.find((l) => l[3] === 'Reels');
    expect(linha[4]).toBe('EM_REVISAO');

    const pendencias = gas.verPendencias({ token });
    const reels = pendencias.data.find((i) => i.rotulo === 'Reels');
    expect(reels.estado).toBe('EmRevisao');
  });

  test('PC-02: Entrega/rótulo que não pertence à Parceira é recusado (isolamento RN-01/Q-09)', () => {
    const { gas, token } = portalPronto();

    const resposta = gas.lerBriefingDoItem({ token, rotulo: 'Carrossel' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('PC-02');
  });

  test('PC-01: token inválido/expirado é recusado em qualquer ação (CB-01)', () => {
    const { gas } = portalPronto();

    const resposta = gas.verPendencias({ token: 'token-fantasma' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('PC-01');
  });

  test('CB-02: Parceira sem pendências no mês recebe lista vazia', () => {
    const gas = montarPortal({
      'BASE DE DADOS': fakeBaseDeDados(),
      COLABORACOES: fakeColaboracoes(),
      BRIEFING: fakeBriefingAba(),
      ENTREGAS: fakeEntregasAba(),
      ENVIOS: fakeEnviosAba(),
      SESSOES: fakeSessoesAba(),
      BLOQUEIOS: fakeBloqueiosAba(),
    });
    // Sem compilarMes: nenhuma Entrega materializada para a competência.
    const login = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '12345' });
    expect(login.success).toBe(true);

    const resposta = gas.verPendencias({ token: login.data.token });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual([]);
  });
});
