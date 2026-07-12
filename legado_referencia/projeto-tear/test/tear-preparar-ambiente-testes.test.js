const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

function criarAba(nome, linhas, colunas, eventos) {
  return {
    _nome: nome,
    _linhas: linhas,
    _colunas: colunas,
    getName() { return this._nome; },
    getLastRow() { return this._linhas; },
    getLastColumn() { return this._colunas; },
    getRange(linha, coluna, numLinhas, numColunas) {
      return {
        clearContent: () => {
          eventos.push({ aba: nome, linha, coluna, numLinhas, numColunas });
          if (linha === 2) {
            this._linhas = 1;
          }
        }
      };
    }
  };
}

function criarPlanilhaFake(abas) {
  const porNome = new Map();
  abas.forEach((aba) => porNome.set(aba.getName(), aba));

  return {
    getSheetByName(nome) {
      return porNome.get(nome) || null;
    },
    getSheets() {
      return Array.from(porNome.values());
    }
  };
}

describe('AmbienteTesteService', () => {
  function montarServico() {
    const limpezas = [];
    const abas = [
      criarAba('FORMS', 20, 5, limpezas),
      criarAba('CADASTROS', 12, 8, limpezas),
      criarAba('BASE', 30, 10, limpezas),
      criarAba('CICLOS', 7, 4, limpezas),
      criarAba('PLANO_COLABORACAO', 9, 5, limpezas),
      criarAba('BRIEFING', 11, 6, limpezas),
      criarAba('ATIVACOES', 21, 9, limpezas),
      criarAba('LOGISTICA', 10, 7, limpezas),
      criarAba('PAGAMENTOS', 8, 8, limpezas),
      criarAba('HISTÓRICO DE CONTEÚDOS', 4, 6, limpezas),
      criarAba('BRIEFING_2026_06', 5, 6, limpezas)
    ];

    const planilha = criarPlanilhaFake(abas);
    const lockEventos = [];
    const lock = {
      waitLock: () => lockEventos.push('wait'),
      releaseLock: () => lockEventos.push('release')
    };

    const ciclo = { chamadas: 0, ultimaReferencia: null };
    const cicloServiceFake = {
      gerarCicloMensal: (data) => {
        ciclo.chamadas += 1;
        ciclo.ultimaReferencia = data;
        return {
          idCiclo: '2026-07',
          resumoOperacional: {
            parceiros: 2,
            briefingsGerados: 2,
            ativacoesGeradas: 2,
            logisticaGerada: 2,
            pagamentosGerados: 2
          }
        };
      }
    };

    const ctx = loadGasFiles(
      ['Infra.js', 'Services.js'].map(arquivo),
      {
        SpreadsheetApp: { flush() {} },
        LockService: { getScriptLock: () => lock }
      },
      ['AmbienteTesteService']
    );

    const service = new ctx.AmbienteTesteService(cicloServiceFake, planilha, { getScriptLock: () => lock });

    return { service, limpezas, ciclo, lockEventos };
  }

  test('preserva FORMS/CADASTROS/BASE e limpa operacionais + derivadas', () => {
    const { service, limpezas, ciclo, lockEventos } = montarServico();

    const r = service.prepararAmbiente({ confirmarLimpezaHistorico: false, referencia: '2026-07-01T00:00:00.000Z' });

    expect(lockEventos).toEqual(['wait', 'release']);
    expect(ciclo.chamadas).toBe(1);

    const abasLimpas = limpezas.map((i) => i.aba).sort();
    expect(abasLimpas).toEqual([
      'ATIVACOES',
      'BRIEFING',
      'CICLOS',
      'LOGISTICA',
      'PAGAMENTOS',
      'PLANO_COLABORACAO'
    ]);

    expect(r.preservadas.map((p) => p.aba)).toEqual(expect.arrayContaining(['FORMS', 'CADASTROS', 'BASE']));
    expect(r.reconstruido.ciclo).toBe('2026-07');
  });

  test('histórico só limpa com confirmação explícita', () => {
    const { service, limpezas } = montarServico();

    service.prepararAmbiente({ confirmarLimpezaHistorico: true });

    const abasLimpas = limpezas.map((i) => i.aba);
    expect(abasLimpas).toEqual(expect.arrayContaining(['HISTÓRICO DE CONTEÚDOS', 'BRIEFING_2026_06']));
  });
});

describe('apiPrepararAmbienteTestes', () => {
  test('rejeita token admin inválido', () => {
    class AmbienteTesteServiceFake {
      prepararAmbiente() {
        return { ok: true };
      }
    }

    const sessao = {
      estaBloqueado: () => false,
      registrarTentativa: () => {},
      limparTentativas: () => {}
    };

    const ctx = loadGasFiles(
      ['Roteador.js'].map(arquivo),
      {
        SessaoRepository: function () { return sessao; },
        PropertiesService: {
          getScriptProperties: () => ({ getProperty: () => 'ADMIN-OK' })
        },
        _comparacaoEmTempoConstante: (a, b) => String(a) === String(b),
        AmbienteTesteService: AmbienteTesteServiceFake
      },
      ['apiPrepararAmbienteTestes']
    );

    const r = ctx.apiPrepararAmbienteTestes('ERRADO', {});
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/não autorizada/i);
  });
});
