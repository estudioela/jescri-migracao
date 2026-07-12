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
          throw new Error('SpreadsheetApp não deve ser usado neste teste de orquestração.');
        }
      }
    },
    ['CicloService', 'Base', 'CAMPOS_BASE', 'CAMPOS_PLANO']
  );
}

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
      save(dados) {
        const chave = String(dados.INFLUENCIADORA || '').trim();
        db.briefings.set(chave, Object.assign({}, dados));
        return dados;
      }
    },
    ativacaoRepo: {
      findByCiclo(cicloId) {
        return db.ativacoes.filter((a) => String(a.ID_Ciclo) === String(cicloId));
      },
      save(dados) {
        const clone = Object.assign({}, dados);
        if (!clone.ID_Ativacao) clone.ID_Ativacao = `ativ-${seqA++}`;
        const idx = db.ativacoes.findIndex((a) => a.ID_Ativacao === clone.ID_Ativacao);
        if (idx === -1) db.ativacoes.push(clone);
        else db.ativacoes[idx] = clone;
        return clone;
      }
    },
    logisticaRepo: {
      findByCiclo(cicloId) {
        return db.logistica.filter((l) => String(l.ID_Ciclo) === String(cicloId));
      },
      save(dados) {
        const clone = Object.assign({}, dados);
        if (!clone.ID_Logistica) clone.ID_Logistica = `log-${seqL++}`;
        const idx = db.logistica.findIndex((l) => l.ID_Logistica === clone.ID_Logistica);
        if (idx === -1) db.logistica.push(clone);
        else db.logistica[idx] = clone;
        return clone;
      }
    },
    pagamentoRepo: {
      findByCiclo(cicloId) {
        return db.pagamentos.filter((p) => String(p.ID_Ciclo) === String(cicloId));
      },
      save(dados) {
        const clone = Object.assign({}, dados);
        if (!clone.ID_Pagamento) clone.ID_Pagamento = `pag-${seqP++}`;
        const idx = db.pagamentos.findIndex((p) => p.ID_Pagamento === clone.ID_Pagamento);
        if (idx === -1) db.pagamentos.push(clone);
        else db.pagamentos[idx] = clone;
        return clone;
      }
    }
  };
}

describe('CicloService + CicloCompilerService (F2.3)', () => {
  test('geração mensal com parceira ativa cria entidades e retorna resumo real', () => {
    const ctx = montar();
    const reposSaida = criarReposSaidaFake();

    const cicloRepo = {
      criar: () => ({ chave: '2026-07', criado: true }),
      listarTodos: () => []
    };

    const parceiroRepo = {
      listarTodas: () => [],
      definirCampoPorChave: () => {}
    };

    const baseRepo = {
      listarAtivas: () => [
        new ctx.Base({
          id: 'INF-001',
          [ctx.CAMPOS_BASE.INFLUENCER]: 'ANA',
          [ctx.CAMPOS_BASE.STATUS]: 'ATIVO',
          [ctx.CAMPOS_BASE.PIX]: 'ana@pix'
        })
      ]
    };

    const planoRepo = {
      findByCiclo: () => [
        {
          [ctx.CAMPOS_PLANO.ID]: 'PLN-001',
          [ctx.CAMPOS_PLANO.INFLUENCIADORA]: 'INF-001',
          [ctx.CAMPOS_PLANO.CICLO]: '2026-07',
          [ctx.CAMPOS_PLANO.QTD_ENTREGAVEIS]: 3,
          [ctx.CAMPOS_PLANO.VALOR_CACHE]: 720
        }
      ]
    };

    const service = new ctx.CicloService(
      cicloRepo,
      null,
      parceiroRepo,
      null,
      reposSaida.briefingRepo,
      reposSaida.ativacaoRepo,
      reposSaida.logisticaRepo,
      reposSaida.pagamentoRepo,
      baseRepo,
      planoRepo
    );

    const r = service.gerarCicloMensal(new Date(2026, 6, 1));

    expect(r.resumoOperacional.briefingsGerados).toBe(1);
    expect(r.resumoOperacional.ativacoesGeradas).toBe(1);
    expect(r.resumoOperacional.logisticaGerada).toBe(1);
    expect(r.resumoOperacional.pagamentosGerados).toBe(1);

    expect(reposSaida.db.briefings.size).toBe(1);
    expect(reposSaida.db.ativacoes).toHaveLength(1);
    expect(reposSaida.db.logistica).toHaveLength(1);
    expect(reposSaida.db.pagamentos).toHaveLength(1);
  });

  test('base inativa é ignorada e execução duplicada não duplica registros', () => {
    const ctx = montar();
    const reposSaida = criarReposSaidaFake();

    const cicloRepo = {
      _ids: new Set(),
      criar(dados) {
        const id = dados.ID_Ciclo;
        if (this._ids.has(id)) return { chave: id, criado: false };
        this._ids.add(id);
        return { chave: id, criado: true };
      },
      listarTodos: () => []
    };

    const parceiroRepo = {
      listarTodas: () => [],
      definirCampoPorChave: () => {}
    };

    const baseRepo = {
      listarAtivas: () => [
        new ctx.Base({ id: 'INF-A', [ctx.CAMPOS_BASE.INFLUENCER]: 'ANA', [ctx.CAMPOS_BASE.STATUS]: 'ATIVO' }),
        new ctx.Base({ id: 'INF-B', [ctx.CAMPOS_BASE.INFLUENCER]: 'BIA', [ctx.CAMPOS_BASE.STATUS]: 'ON' }),
        new ctx.Base({ id: 'INF-C', [ctx.CAMPOS_BASE.INFLUENCER]: 'CARLA', [ctx.CAMPOS_BASE.STATUS]: 'INATIVO' })
      ]
    };

    const planoRepo = {
      findByCiclo: () => [
        {
          [ctx.CAMPOS_PLANO.ID]: 'PLN-A',
          [ctx.CAMPOS_PLANO.INFLUENCIADORA]: 'INF-A',
          [ctx.CAMPOS_PLANO.CICLO]: '2026-09',
          [ctx.CAMPOS_PLANO.QTD_ENTREGAVEIS]: 2,
          [ctx.CAMPOS_PLANO.VALOR_CACHE]: 300
        },
        {
          [ctx.CAMPOS_PLANO.ID]: 'PLN-B',
          [ctx.CAMPOS_PLANO.INFLUENCIADORA]: 'INF-B',
          [ctx.CAMPOS_PLANO.CICLO]: '2026-09',
          [ctx.CAMPOS_PLANO.QTD_ENTREGAVEIS]: 2,
          [ctx.CAMPOS_PLANO.VALOR_CACHE]: 500
        }
      ]
    };

    const service = new ctx.CicloService(
      cicloRepo,
      null,
      parceiroRepo,
      null,
      reposSaida.briefingRepo,
      reposSaida.ativacaoRepo,
      reposSaida.logisticaRepo,
      reposSaida.pagamentoRepo,
      baseRepo,
      planoRepo
    );

    const r1 = service.gerarCicloMensal(new Date(2026, 8, 10));
    const r2 = service.gerarCicloMensal(new Date(2026, 8, 11));

    expect(r1.resumoOperacional.parceiros).toBe(2);
    expect(r2.resumoOperacional.parceiros).toBe(2);

    expect(reposSaida.db.briefings.size).toBe(2);
    expect(reposSaida.db.ativacoes).toHaveLength(2);
    expect(reposSaida.db.logistica).toHaveLength(2);
    expect(reposSaida.db.pagamentos).toHaveLength(2);
  });
});
