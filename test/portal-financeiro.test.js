const { loadGas } = require('./helpers/gasHarness');
const { ADMIN_TOKEN, ADMIN_SUB, ARQUIVOS_IDENTIDADE } = require('./helpers/rbacFixture');

// Slice ponta a ponta do M8 · Financeiro e Histórico no Portal (SPEC-030),
// no mesmo molde de test/portal-conteudo.test.js (SPEC-027) e
// test/perfil-portal.test.js (SPEC-032): login real via AcessoPortalService
// + compilarMes (materializa Entrega/Obrigação Mensal, SPEC-012/020) +
// lancarPagamentoAvulso, depois as três funções do Portal
// (listarPeriodosDoPortal/verFinanceiroDoPortal/verHistoricoDoPortal),
// tudo sobre a pilha real de fakes de planilha.

function fakeBaseDeDados() {
  const cabecalho = [
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
    'INFLUENCIADORA_ENDERECO',
  ];
  const rows = [
    cabecalho.slice(),
    ['Maria', 'ON', 'pix@maria', 3500, '1', '', '2', '', 'CUPOMMARIA', '12.345.678/0001-90', ''],
    // Segunda Parceira Ativa (RN-05/Q-09: isolamento) — também materializada
    // pelo mesmo compilarMes (todas as Ativas), mas nunca deve aparecer nas
    // consultas de Maria nem vice-versa.
    ['Ana', 'ON', 'pix@ana', 2000, '1', '', '', '', 'CUPOMANA', '98.765.432/0001-10', ''],
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

function fakePagamentosAba() {
  return fakeAbaGravavel([
    'ID_OBRIGACAO',
    'INFLU_KEY',
    'TIPO_PAGAMENTO',
    'ANO_REFERENCIA',
    'MES_REFERENCIA',
    'VALOR',
    'ESTADO',
    'DATA_ARQUIVAMENTO',
  ]);
}

function fakeSessoesAba() {
  return fakeAbaGravavel(['TOKEN', 'PARCEIRA_ID', 'EXPIRA_EM']);
}

function fakeBloqueiosAba() {
  return fakeAbaGravavel(['IDENTIFICADOR', 'TENTATIVAS', 'BLOQUEIO_INICIO']);
}

function fakeIdentidadesAba() {
  return fakeAbaGravavel([
    'SUB_PROVIDER',
    'EMAIL_PERFIL',
    'PAPEL_ATOR',
    'ESTADO_CONTA',
    'DATA_CRIACAO',
    'ULTIMO_ACESSO',
  ]);
}

function fakeAdministradoresAba() {
  return fakeAbaGravavel(['SUB_PROVIDER', 'NOME_COMPLETO', 'AREA_RESPONSABILIDADE']);
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
      ...ARQUIVOS_IDENTIDADE,
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
      LockService: {
        getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }),
      },
    }
  );
}

function portalPronto() {
  const sessoesAba = fakeSessoesAba();
  const identidadesAba = fakeIdentidadesAba();
  const gas = montarPortal({
    'BASE DE DADOS': fakeBaseDeDados(),
    COLABORACOES: fakeColaboracoes(),
    BRIEFING: fakeBriefingAba(),
    ENTREGAS: fakeEntregasAba(),
    ENVIOS: fakeEnviosAba(),
    PAGAMENTOS: fakePagamentosAba(),
    SESSOES: sessoesAba,
    BLOQUEIOS: fakeBloqueiosAba(),
    SIS_IDENTIDADES: identidadesAba,
    BASE_ADMINISTRADORES: fakeAdministradoresAba(),
  });

  const login = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '12345' });
  expect(login.success).toBe(true);
  const token = login.data.token;

  // Seed direto de uma Sessão + Usuario ADMINISTRADOR ACTIVE (RBAC, dívida
  // Q-08 fechada por SPEC-035 §8.3) — evita repetir aqui o fluxo completo
  // de login Google, já coberto em test/portal-usuario.test.js.
  identidadesAba._rows.push([
    ADMIN_SUB,
    'admin@estudioela.com',
    'ADMINISTRADOR',
    'ACTIVE',
    new Date().toISOString(),
    '',
  ]);
  sessoesAba._rows.push([
    ADMIN_TOKEN,
    ADMIN_SUB,
    new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  ]);

  // Materializa 3 Entregas (Reels×1 + Stories×2, RN-01 SPEC-012) e a
  // Obrigação Mensal EmAberto (RN-01 SPEC-020) da competência 2026-07.
  expect(gas.compilarMes({ mesReferencia: '2026-07' }).success).toBe(true);

  // Aprova as 3 Entregas (Q-04: liberar exige TODAS Aprovado/Publicado) e
  // publica só a Reels — Stories ficam Aprovado (também elegível ao gate).
  ['Reels', 'Stories 1', 'Stories 2'].forEach((rotulo) => {
    const comando = { mesReferencia: '2026-07', parceiraId: 'Maria', rotulo };
    expect(
      gas.enviarMaterial(Object.assign({ link: 'https://drive/x', token: ADMIN_TOKEN }, comando)).success
    ).toBe(true);
    expect(gas.aprovarEntrega(Object.assign({ token: ADMIN_TOKEN }, comando)).success).toBe(true);
  });
  expect(
    gas.publicarEntrega({
      mesReferencia: '2026-07',
      parceiraId: 'Maria',
      rotulo: 'Reels',
      token: ADMIN_TOKEN,
    }).success
  ).toBe(true);

  // Libera e paga a Obrigação Mensal (Q-04 satisfeito acima) → Pago.
  const obrigacoes = gas.listarPagamentos({
    mesReferencia: '2026-07',
    parceiraId: 'Maria',
    token: ADMIN_TOKEN,
  });
  const mensal = obrigacoes.data.find((o) => o.tipo === 'Mensal');
  expect(gas.liberarPagamento({ id: mensal.id, token: ADMIN_TOKEN }).success).toBe(true);
  expect(gas.confirmarPagamento({ id: mensal.id, token: ADMIN_TOKEN }).success).toBe(true);

  // Obrigação Avulsa da mesma competência, deixada EmAberto (RN-04/CB-01):
  // conta em "previsto", nunca em "pago" (RN-02/CB-02).
  expect(
    gas.lancarPagamentoAvulso({
      parceiraId: 'Maria',
      valor: 500,
      mesReferencia: '2026-07',
      token: ADMIN_TOKEN,
    }).success
  ).toBe(true);

  return { gas, token };
}

describe('Entrypoint · Portal — slice do Financeiro/Histórico (SPEC-030)', () => {
  test('listarPeriodosDoPortal: só a competência com atividade (UC-030.03/RN-04)', () => {
    const { gas, token } = portalPronto();

    const resposta = gas.listarPeriodosDoPortal({ token: token });

    expect(resposta).toEqual({ success: true, data: ['2026-07'] });
  });

  test('verFinanceiroDoPortal: previsto (Avulso EmAberto) x pago (Mensal Pago) (UC-030.01/RN-02/CB-02)', () => {
    const { gas, token } = portalPronto();

    const resposta = gas.verFinanceiroDoPortal({ token: token, mesReferencia: '2026-07' });

    expect(resposta).toEqual({ success: true, data: { previsto: 500, pago: 3500 } });
  });

  test('verHistoricoDoPortal: Entrega Publicada + Obrigação Paga, exclui as ainda ativas (UC-030.02)', () => {
    const { gas, token } = portalPronto();

    const resposta = gas.verHistoricoDoPortal({ token: token, mesReferencia: '2026-07' });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toHaveLength(2);
    const conteudo = resposta.data.find((i) => i.tipo === 'Conteudo');
    expect(conteudo).toMatchObject({ referencia: 'Reels', estado: 'Publicado', valor: null });
    expect(conteudo.dataArquivamento).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const pagamento = resposta.data.find((i) => i.tipo === 'Pagamento');
    expect(pagamento).toMatchObject({ referencia: 'Mensal', estado: 'Pago', valor: 3500 });
  });

  test('PF-02: período sem atividade da Parceira é recusado', () => {
    const { gas, token } = portalPronto();

    const resposta = gas.verFinanceiroDoPortal({ token: token, mesReferencia: '2026-08' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('PF-02');
  });

  test('isolamento (RN-05/Q-09): Ana não vê financeiro/histórico de Maria, nem o contrário', () => {
    const { gas, token } = portalPronto();
    const loginAna = gas.entrarNoPortal({ identificador: 'CUPOMANA', segredo: '98765' });
    expect(loginAna.success).toBe(true);
    const tokenAna = loginAna.data.token;

    // Ana também tem atividade em 2026-07 (materializada pelo mesmo
    // compilarMes), mas com valores/estado próprios — nada aprovado/pago.
    const financeiroAna = gas.verFinanceiroDoPortal({
      token: tokenAna,
      mesReferencia: '2026-07',
    });
    expect(financeiroAna).toEqual({ success: true, data: { previsto: 2000, pago: 0 } });
    expect(gas.verHistoricoDoPortal({ token: tokenAna, mesReferencia: '2026-07' }).data).toEqual(
      []
    );

    // Financeiro de Maria não muda por Ana também ter atividade no mês.
    const financeiroMaria = gas.verFinanceiroDoPortal({ token: token, mesReferencia: '2026-07' });
    expect(financeiroMaria).toEqual({ success: true, data: { previsto: 500, pago: 3500 } });
  });

  test('PF-01: sessão inválida é recusada em qualquer ação', () => {
    const { gas } = portalPronto();

    const periodos = gas.listarPeriodosDoPortal({ token: 'token-fantasma' });
    expect(periodos.success).toBe(false);
    expect(periodos.error.codigo).toBe('PF-01');

    const financeiro = gas.verFinanceiroDoPortal({
      token: 'token-fantasma',
      mesReferencia: '2026-07',
    });
    expect(financeiro.success).toBe(false);
    expect(financeiro.error.codigo).toBe('PF-01');

    const historico = gas.verHistoricoDoPortal({
      token: 'token-fantasma',
      mesReferencia: '2026-07',
    });
    expect(historico.success).toBe(false);
    expect(historico.error.codigo).toBe('PF-01');
  });
});
