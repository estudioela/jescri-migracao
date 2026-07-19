const { loadGas } = require('./helpers/gasHarness');
const { ADMIN_TOKEN, ARQUIVOS_IDENTIDADE, abasIdentidade } = require('./helpers/rbacFixture');

// Smoke test do Entrypoint "Portal": prova que `selarCompetencia`/
// `arquivarLote` (SPEC-034) compõem a pilha real — Controller ->
// ArquivamentoService -> ColaboracaoMensalRepository/ACL (aba COLABORACOES)
// + EntregaService/EnvioService/PagamentoService (reaproveitados) — sob
// trava global (mesmo padrão de `compilarMes`).

function fakeSheet(rows) {
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    clearContents() {
      rows.length = 0;
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

function fakeColaboracoesAba() {
  return fakeSheet([
    [
      'INFLU_KEY',
      'MES_REFERENCIA',
      'ANO_REFERENCIA',
      'ESTADO',
      'SNAPSHOT_VALOR',
      'SNAPSHOT_FORMATOS',
      'SNAPSHOT_QTD_POR_FORMATO',
    ],
    ['Maria', 7, 2026, 'CONCLUIDA', 3500, 'Reels', JSON.stringify({ Reels: 1 })],
  ]);
}

function fakeBriefingAba() {
  return fakeSheet([
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
  ]);
}

function fakeEntregasAba(estado) {
  return fakeSheet([
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
    ['Maria', 2026, 7, 'Reels', estado.entrega, 'http://material', '', estado.dataArquivamento || ''],
  ]);
}

function fakeEnviosAba(estado) {
  return fakeSheet([
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
    [
      'Maria',
      2026,
      7,
      'AGUARDANDO_CONFIRMACAO',
      estado.envio,
      estado.envio === 'ENTREGUE' ? 'COD-123' : '',
      estado.envio === 'ENTREGUE' ? new Date('2026-07-20') : '',
      estado.dataArquivamento || '',
    ],
  ]);
}

function fakePagamentosAba(estado) {
  return fakeSheet([
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
    ['m1', 'Maria', 'MENSAL', 2026, 7, 3500, estado.pagamento, estado.dataArquivamento || ''],
  ]);
}

function fakeBaseDeDados() {
  const rows = [
    ['INFLU_KEY', 'STATUS', 'CHAVE_PIX', 'VALOR_TOTAL', 'REELS_TEXTO', 'CARROSSEL_TEXTO', 'STORIES_TEXTO', 'LOOKS_QTD'],
    ['Maria', 'ON', 'pix@maria', 3500, '1', '', '', ''],
  ];
  return { getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }) };
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
      'src/modulos/Arquivamento.js',
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
      LockService: {
        getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }),
      },
    }
  );
}

describe('Entrypoint · Portal.selarCompetencia (smoke, SPEC-034 UC-034.02)', () => {
  test('todos os itens terminais → sela a competência inteira e devolve envelope', () => {
    const abas = {
      'BASE DE DADOS': fakeBaseDeDados(),
      COLABORACOES: fakeColaboracoesAba(),
      BRIEFING: fakeBriefingAba(),
      ENTREGAS: fakeEntregasAba({ entrega: 'PUBLICADO', dataArquivamento: new Date('2026-07-25') }),
      ENVIOS: fakeEnviosAba({ envio: 'ENTREGUE', dataArquivamento: new Date('2026-07-25') }),
      PAGAMENTOS: fakePagamentosAba({ pagamento: 'PAGO', dataArquivamento: new Date('2026-07-25') }),
    };
    const gas = montarPortal(abas);

    const resposta = gas.selarCompetencia({ mesReferencia: '2026-07', token: ADMIN_TOKEN });

    expect(resposta).toEqual({
      success: true,
      data: { mesReferencia: '2026-07', jaSelada: false },
    });
    expect(abas.COLABORACOES._rows[1][3]).toBe('ARQUIVADA');
  });

  test('pendência operacional (Entrega ainda não Publicado) → envelope de falha AR-02', () => {
    const abas = {
      'BASE DE DADOS': fakeBaseDeDados(),
      COLABORACOES: fakeColaboracoesAba(),
      BRIEFING: fakeBriefingAba(),
      ENTREGAS: fakeEntregasAba({ entrega: 'EM_REVISAO' }),
      ENVIOS: fakeEnviosAba({ envio: 'ENTREGUE', dataArquivamento: new Date('2026-07-25') }),
      PAGAMENTOS: fakePagamentosAba({ pagamento: 'PAGO', dataArquivamento: new Date('2026-07-25') }),
    };
    const gas = montarPortal(abas);

    const resposta = gas.selarCompetencia({ mesReferencia: '2026-07', token: ADMIN_TOKEN });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/AR-02/);
    expect(abas.COLABORACOES._rows[1][3]).toBe('CONCLUIDA');
  });

  test('competência inexistente vira envelope de falha (nunca exceção crua)', () => {
    const abas = {
      'BASE DE DADOS': fakeBaseDeDados(),
      COLABORACOES: fakeColaboracoesAba(),
      BRIEFING: fakeBriefingAba(),
      ENTREGAS: fakeEntregasAba({ entrega: 'PUBLICADO', dataArquivamento: new Date('2026-07-25') }),
      ENVIOS: fakeEnviosAba({ envio: 'ENTREGUE', dataArquivamento: new Date('2026-07-25') }),
      PAGAMENTOS: fakePagamentosAba({ pagamento: 'PAGO', dataArquivamento: new Date('2026-07-25') }),
    };
    const gas = montarPortal(abas);

    const resposta = gas.selarCompetencia({ mesReferencia: '2099-01', token: ADMIN_TOKEN });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/AR-02/);
  });
});

describe('Entrypoint · Portal.arquivarLote (smoke, SPEC-034 UC-034.01)', () => {
  test('sela a competência elegível e devolve o resumo em envelope', () => {
    const abas = {
      'BASE DE DADOS': fakeBaseDeDados(),
      COLABORACOES: fakeColaboracoesAba(),
      BRIEFING: fakeBriefingAba(),
      ENTREGAS: fakeEntregasAba({ entrega: 'PUBLICADO', dataArquivamento: new Date('2026-07-25') }),
      ENVIOS: fakeEnviosAba({ envio: 'ENTREGUE', dataArquivamento: new Date('2026-07-25') }),
      PAGAMENTOS: fakePagamentosAba({ pagamento: 'PAGO', dataArquivamento: new Date('2026-07-25') }),
    };
    const gas = montarPortal(abas);

    const resposta = gas.arquivarLote({ token: ADMIN_TOKEN });

    expect(resposta).toEqual({
      success: true,
      data: { resultados: [{ mesReferencia: '2026-07', selada: true }] },
    });
    expect(abas.COLABORACOES._rows[1][3]).toBe('ARQUIVADA');
  });
});
