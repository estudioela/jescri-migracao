/**
 * F2.0 — CicloCompilerService (fundação em memória, sem I/O).
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

function montar() {
  return loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js', 'Services.js'].map(arquivo),
    {
      console: { warn() {} },
      SpreadsheetApp: {
        getActive: () => {
          throw new Error('SpreadsheetApp não deve ser usado no compilador em memória.');
        }
      }
    },
    [
      'CicloCompilerService',
      'Base',
      'PlanoColaboracao',
      'Briefing',
      'Ativacao',
      'Logistica',
      'Pagamento',
      'CAMPOS_BASE',
      'CAMPOS_PLANO',
      'CAMPOS_ATIVACAO',
      'CAMPOS_LOGISTICA',
      'CAMPOS_PAGAMENTO',
      'ESTADOS_ATIVACAO'
    ]
  );
}

describe('CicloCompilerService', () => {
  function criarReposSaidaFake() {
    const db = {
      briefings: new Map(),
      ativacoes: [],
      logistica: [],
      pagamentos: []
    };

    let seqA = 1;
    let seqL = 1;
    let seqP = 1;

    return {
      db,
      briefingRepo: {
        salvos: [],
        save(dados) {
          const chave = String(dados.INFLUENCIADORA || '').trim();
          db.briefings.set(chave, Object.assign({}, dados));
          this.salvos.push(Object.assign({}, dados));
          return dados;
        }
      },
      ativacaoRepo: {
        salvos: [],
        findByCiclo(cicloId) {
          return db.ativacoes.filter((a) => String(a.ID_Ciclo) === String(cicloId));
        },
        save(dados) {
          const clone = Object.assign({}, dados);
          if (!clone.ID_Ativacao) {
            clone.ID_Ativacao = `ativ-${seqA++}`;
          }
          const idx = db.ativacoes.findIndex((a) => a.ID_Ativacao === clone.ID_Ativacao);
          if (idx === -1) db.ativacoes.push(clone);
          else db.ativacoes[idx] = clone;
          this.salvos.push(clone);
          return clone;
        }
      },
      logisticaRepo: {
        salvos: [],
        findByCiclo(cicloId) {
          return db.logistica.filter((l) => String(l.ID_Ciclo) === String(cicloId));
        },
        save(dados) {
          const clone = Object.assign({}, dados);
          if (!clone.ID_Logistica) {
            clone.ID_Logistica = `log-${seqL++}`;
          }
          const idx = db.logistica.findIndex((l) => l.ID_Logistica === clone.ID_Logistica);
          if (idx === -1) db.logistica.push(clone);
          else db.logistica[idx] = clone;
          this.salvos.push(clone);
          return clone;
        }
      },
      pagamentoRepo: {
        salvos: [],
        findByCiclo(cicloId) {
          return db.pagamentos.filter((p) => String(p.ID_Ciclo) === String(cicloId));
        },
        save(dados) {
          const clone = Object.assign({}, dados);
          if (!clone.ID_Pagamento) {
            clone.ID_Pagamento = `pag-${seqP++}`;
          }
          const idx = db.pagamentos.findIndex((p) => p.ID_Pagamento === clone.ID_Pagamento);
          if (idx === -1) db.pagamentos.push(clone);
          else db.pagamentos[idx] = clone;
          this.salvos.push(clone);
          return clone;
        }
      }
    };
  }

  test('integra com repositories: duas bases ativas geram saída, inativa é ignorada e plano do ciclo é usado', () => {
    const ctx = montar();

    const bases = [
      new ctx.Base({
        id: 'INF-001',
        [ctx.CAMPOS_BASE.INFLUENCER]: 'ANA',
        [ctx.CAMPOS_BASE.STATUS]: 'ATIVO',
        [ctx.CAMPOS_BASE.PIX]: 'ana@pix'
      }),
      new ctx.Base({
        id: 'INF-002',
        [ctx.CAMPOS_BASE.INFLUENCER]: 'BIA',
        [ctx.CAMPOS_BASE.STATUS]: 'ON',
        [ctx.CAMPOS_BASE.PIX]: 'bia@pix'
      }),
      new ctx.Base({
        id: 'INF-003',
        [ctx.CAMPOS_BASE.INFLUENCER]: 'CARLA',
        [ctx.CAMPOS_BASE.STATUS]: 'INATIVO',
        [ctx.CAMPOS_BASE.PIX]: 'carla@pix'
      })
    ];

    const baseRepo = {
      listarAtivas: () => bases.filter((b) => ['ATIVO', 'ON'].includes(String(b.status).toUpperCase()))
    };

    const planoRepo = {
      findByCiclo: (idCiclo) => {
        if (idCiclo !== '2026-07') return [];
        return [
          {
            [ctx.CAMPOS_PLANO.ID]: 'PLN-001',
            [ctx.CAMPOS_PLANO.INFLUENCIADORA]: 'INF-001',
            [ctx.CAMPOS_PLANO.CICLO]: '2026-07',
            [ctx.CAMPOS_PLANO.QTD_ENTREGAVEIS]: 3,
            [ctx.CAMPOS_PLANO.VALOR_CACHE]: 720
          },
          {
            [ctx.CAMPOS_PLANO.ID]: 'PLN-002',
            [ctx.CAMPOS_PLANO.INFLUENCIADORA]: 'INF-002',
            [ctx.CAMPOS_PLANO.CICLO]: '2026-07',
            [ctx.CAMPOS_PLANO.QTD_ENTREGAVEIS]: 2,
            [ctx.CAMPOS_PLANO.VALOR_CACHE]: 500
          }
        ];
      }
    };

    const compiler = new ctx.CicloCompilerService(baseRepo, planoRepo);
    const out = compiler.compilar({ ciclo: { idCiclo: '2026-07' } });

    expect(out.briefings).toHaveLength(2);
    expect(out.ativacoes).toHaveLength(2);
    expect(out.logistica).toHaveLength(2);
    expect(out.pagamentos).toHaveLength(2);

    const valoresPorInflu = out.pagamentos.reduce((mapa, p) => {
      mapa[p.influenciadora] = p.valor;
      return mapa;
    }, {});

    expect(valoresPorInflu['INF-001']).toBe(720);
    expect(valoresPorInflu['INF-002']).toBe(500);
    expect(valoresPorInflu['INF-003']).toBeUndefined();
  });

  test('uma BASE ativa gera saída em memória para todas as entidades de saída', () => {
    const ctx = montar();

    const base = new ctx.Base({
      id: 'INF-001',
      [ctx.CAMPOS_BASE.INFLUENCER]: 'ANA',
      [ctx.CAMPOS_BASE.STATUS]: 'ATIVO',
      [ctx.CAMPOS_BASE.ENDERECO]: 'Rua X',
      [ctx.CAMPOS_BASE.PIX]: 'ana@pix'
    });

    const plano = new ctx.PlanoColaboracao({
      [ctx.CAMPOS_PLANO.ID]: 'PLN-001',
      [ctx.CAMPOS_PLANO.INFLUENCIADORA]: 'INF-001',
      [ctx.CAMPOS_PLANO.CICLO]: '2026-07',
      [ctx.CAMPOS_PLANO.QTD_ENTREGAVEIS]: 3,
      [ctx.CAMPOS_PLANO.VALOR_CACHE]: 720
    });

    const compiler = new ctx.CicloCompilerService();
    const out = compiler.compilar({
      ciclo: { idCiclo: '2026-07' },
      bases: [base],
      planos: [plano]
    });

    expect(out.briefings).toHaveLength(1);
    expect(out.ativacoes).toHaveLength(1);
    expect(out.logistica).toHaveLength(1);
    expect(out.pagamentos).toHaveLength(1);

    expect(out.briefings[0] instanceof ctx.Briefing).toBe(true);
    expect(out.ativacoes[0] instanceof ctx.Ativacao).toBe(true);
    expect(out.logistica[0] instanceof ctx.Logistica).toBe(true);
    expect(out.pagamentos[0] instanceof ctx.Pagamento).toBe(true);

    expect(out.pagamentos[0].influenciadora).toBe('INF-001');
    expect(out.pagamentos[0].valor).toBe(720);
  });

  test('BASE inativa não gera saída', () => {
    const ctx = montar();

    const baseInativa = new ctx.Base({
      id: 'INF-002',
      [ctx.CAMPOS_BASE.INFLUENCER]: 'BIA',
      [ctx.CAMPOS_BASE.STATUS]: 'INATIVO'
    });

    const compiler = new ctx.CicloCompilerService();
    const out = compiler.compilar({
      ciclo: { idCiclo: '2026-07' },
      bases: [baseInativa],
      planos: []
    });

    expect(out.briefings).toHaveLength(0);
    expect(out.ativacoes).toHaveLength(0);
    expect(out.logistica).toHaveLength(0);
    expect(out.pagamentos).toHaveLength(0);
  });

  test('preserva o ciclo informado nas entidades compiladas', () => {
    const ctx = montar();

    const base = new ctx.Base({
      id: 'INF-003',
      [ctx.CAMPOS_BASE.INFLUENCER]: 'CARLA',
      [ctx.CAMPOS_BASE.STATUS]: 'ON'
    });

    const compiler = new ctx.CicloCompilerService();
    const out = compiler.compilar({
      ciclo: { idCiclo: '2030-01' },
      bases: [base],
      planos: []
    });

    expect(out.ativacoes[0].dados[ctx.CAMPOS_ATIVACAO.CICLO]).toBe('2030-01');
    expect(out.logistica[0].dados[ctx.CAMPOS_LOGISTICA.CICLO]).toBe('2030-01');
    expect(out.pagamentos[0].ciclo).toBe('2030-01');
    expect(out.ativacoes[0].estadoAtual).toBe(ctx.ESTADOS_ATIVACAO.PLANEJAMENTO);
  });

  test('não acessa SpreadsheetApp durante compilação em memória', () => {
    const ctx = montar();

    const base = new ctx.Base({
      id: 'INF-004',
      [ctx.CAMPOS_BASE.INFLUENCER]: 'DEBORA',
      [ctx.CAMPOS_BASE.STATUS]: 'ATIVO'
    });

    const compiler = new ctx.CicloCompilerService();

    expect(() => compiler.compilar({
      ciclo: { idCiclo: '2027-03' },
      bases: [base],
      planos: []
    })).not.toThrow();
  });

  test('não acessa SpreadsheetApp quando usa repositories injetados', () => {
    const ctx = montar();

    const baseRepo = {
      listarAtivas: () => [new ctx.Base({
        id: 'INF-010',
        [ctx.CAMPOS_BASE.INFLUENCER]: 'ERIKA',
        [ctx.CAMPOS_BASE.STATUS]: 'ATIVO'
      })]
    };

    const planoRepo = {
      findByCiclo: () => []
    };

    const compiler = new ctx.CicloCompilerService(baseRepo, planoRepo);

    expect(() => compiler.compilar({ ciclo: { idCiclo: '2028-11' } })).not.toThrow();
  });

  test('persiste uma compilação e retorna resumo', () => {
    const ctx = montar();
    const repos = criarReposSaidaFake();

    const baseRepo = {
      listarAtivas: () => [
        new ctx.Base({
          id: 'INF-100',
          [ctx.CAMPOS_BASE.INFLUENCER]: 'ANA',
          [ctx.CAMPOS_BASE.STATUS]: 'ATIVO',
          [ctx.CAMPOS_BASE.PIX]: 'ana@pix'
        })
      ]
    };

    const planoRepo = {
      findByCiclo: () => [
        {
          [ctx.CAMPOS_PLANO.ID]: 'PLN-100',
          [ctx.CAMPOS_PLANO.INFLUENCIADORA]: 'INF-100',
          [ctx.CAMPOS_PLANO.CICLO]: '2026-07',
          [ctx.CAMPOS_PLANO.QTD_ENTREGAVEIS]: 1,
          [ctx.CAMPOS_PLANO.VALOR_CACHE]: 900
        }
      ]
    };

    const compiler = new ctx.CicloCompilerService(
      baseRepo,
      planoRepo,
      repos.briefingRepo,
      repos.ativacaoRepo,
      repos.logisticaRepo,
      repos.pagamentoRepo
    );

    const compilado = compiler.compilar({ ciclo: { idCiclo: '2026-07' } });
    const resumo = compiler.persistirCompilacao(compilado);

    expect(resumo).toEqual({
      briefingsSalvos: 1,
      ativacoesSalvas: 1,
      logisticaSalva: 1,
      pagamentosSalvos: 1
    });

    expect(repos.db.briefings.size).toBe(1);
    expect(repos.db.ativacoes).toHaveLength(1);
    expect(repos.db.logistica).toHaveLength(1);
    expect(repos.db.pagamentos).toHaveLength(1);
  });

  test('segunda execução do mesmo ciclo/parceira não duplica', () => {
    const ctx = montar();
    const repos = criarReposSaidaFake();

    const baseRepo = {
      listarAtivas: () => [
        new ctx.Base({
          id: 'INF-200',
          [ctx.CAMPOS_BASE.INFLUENCER]: 'BIA',
          [ctx.CAMPOS_BASE.STATUS]: 'ATIVO'
        })
      ]
    };

    const planoRepo = {
      findByCiclo: () => [
        {
          [ctx.CAMPOS_PLANO.ID]: 'PLN-200',
          [ctx.CAMPOS_PLANO.INFLUENCIADORA]: 'INF-200',
          [ctx.CAMPOS_PLANO.CICLO]: '2026-08',
          [ctx.CAMPOS_PLANO.QTD_ENTREGAVEIS]: 2,
          [ctx.CAMPOS_PLANO.VALOR_CACHE]: 500
        }
      ]
    };

    const compiler = new ctx.CicloCompilerService(
      baseRepo,
      planoRepo,
      repos.briefingRepo,
      repos.ativacaoRepo,
      repos.logisticaRepo,
      repos.pagamentoRepo
    );

    const compilado1 = compiler.compilar({ ciclo: { idCiclo: '2026-08' } });
    compiler.persistirCompilacao(compilado1);

    const compilado2 = compiler.compilar({ ciclo: { idCiclo: '2026-08' } });
    compiler.persistirCompilacao(compilado2);

    expect(repos.db.briefings.size).toBe(1);
    expect(repos.db.ativacoes).toHaveLength(1);
    expect(repos.db.logistica).toHaveLength(1);
    expect(repos.db.pagamentos).toHaveLength(1);
  });

  test('repositories de saída recebem entidades corretas do compilado', () => {
    const ctx = montar();
    const repos = criarReposSaidaFake();

    const compiler = new ctx.CicloCompilerService(
      null,
      null,
      repos.briefingRepo,
      repos.ativacaoRepo,
      repos.logisticaRepo,
      repos.pagamentoRepo
    );

    const compilado = {
      briefings: [new ctx.Briefing({ [ctx.CAMPOS_BASE.INFLUENCER]: '', INFLUENCIADORA: 'INF-500' })],
      ativacoes: [new ctx.Ativacao({
        [ctx.CAMPOS_ATIVACAO.ID]: '',
        [ctx.CAMPOS_ATIVACAO.CICLO]: '2031-01',
        [ctx.CAMPOS_ATIVACAO.INFLUENCIADORA]: 'INF-500',
        [ctx.CAMPOS_ATIVACAO.TIPO_CONTEUDO]: '',
        [ctx.CAMPOS_ATIVACAO.ESTADO]: ctx.ESTADOS_ATIVACAO.PLANEJAMENTO,
        [ctx.CAMPOS_ATIVACAO.LOOK]: '',
        [ctx.CAMPOS_ATIVACAO.ENTREGA_PREVISTA]: '',
        [ctx.CAMPOS_ATIVACAO.LINK_BRIEFING]: '',
        [ctx.CAMPOS_ATIVACAO.LINK_UPLOAD_HD]: ''
      })],
      logistica: [new ctx.Logistica({
        [ctx.CAMPOS_LOGISTICA.ID]: '',
        [ctx.CAMPOS_LOGISTICA.CICLO]: '2031-01',
        [ctx.CAMPOS_LOGISTICA.INFLUENCIADORA]: 'INF-500',
        [ctx.CAMPOS_LOGISTICA.ENDERECO]: '',
        [ctx.CAMPOS_LOGISTICA.RASTREIO]: '',
        [ctx.CAMPOS_LOGISTICA.DATA_ENVIO]: '',
        [ctx.CAMPOS_LOGISTICA.STATUS]: 'Pendente'
      })],
      pagamentos: [new ctx.Pagamento({
        [ctx.CAMPOS_PAGAMENTO.ID]: '',
        [ctx.CAMPOS_PAGAMENTO.CICLO]: '2031-01',
        [ctx.CAMPOS_PAGAMENTO.INFLUENCIADORA]: 'INF-500',
        [ctx.CAMPOS_PAGAMENTO.VALOR]: 100,
        [ctx.CAMPOS_PAGAMENTO.PIX]: '',
        [ctx.CAMPOS_PAGAMENTO.STATUS]: 'em aberto',
        [ctx.CAMPOS_PAGAMENTO.DATA_PAGAMENTO]: '',
        [ctx.CAMPOS_PAGAMENTO.MENSAGEM]: ''
      })]
    };

    compiler.persistirCompilacao(compilado);

    expect(repos.briefingRepo.salvos[0].INFLUENCIADORA).toBe('INF-500');
    expect(repos.ativacaoRepo.salvos[0][ctx.CAMPOS_ATIVACAO.INFLUENCIADORA]).toBe('INF-500');
    expect(repos.logisticaRepo.salvos[0][ctx.CAMPOS_LOGISTICA.INFLUENCIADORA]).toBe('INF-500');
    expect(repos.pagamentoRepo.salvos[0][ctx.CAMPOS_PAGAMENTO.INFLUENCIADORA]).toBe('INF-500');
  });
});
