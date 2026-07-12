const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

describe('apiGerarCicloMensal (acionamento admin)', () => {
  function montarComServiceFake(opcoes) {
    const estado = {
      chamadas: 0,
      datas: []
    };

    const retorno = (opcoes && opcoes.retorno) || {
      idCiclo: '2026-07',
      resumoOperacional: {
        parceiros: 2,
        briefingsGerados: 2,
        ativacoesGeradas: 2,
        logisticaGerada: 2,
        pagamentosGerados: 2
      }
    };

    class CicloServiceFake {
      gerarCicloMensal(data) {
        estado.chamadas += 1;
        estado.datas.push(data);
        return typeof retorno === 'function' ? retorno(estado.chamadas) : retorno;
      }
    }

    class CicloRepositoryFake {}

    const sessao = {
      estaBloqueado: () => false,
      registrarTentativa: () => {},
      limparTentativas: () => {}
    };

    const ctx = loadGasFiles(
      ['Roteador.js'].map(arquivo),
      {
        console: { log() {} },
        CicloService: CicloServiceFake,
        CicloRepository: CicloRepositoryFake,
        SessaoRepository: function () { return sessao; },
        PropertiesService: {
          getScriptProperties: () => ({ getProperty: () => 'ADMIN-OK' })
        },
        _comparacaoEmTempoConstante: (a, b) => String(a) === String(b)
      },
      ['apiGerarCicloMensal']
    );

    return { ctx, estado };
  }

  test('acionamento chama geração mensal no CicloService', () => {
    const { ctx, estado } = montarComServiceFake();

    const r = ctx.apiGerarCicloMensal('ADMIN-OK', '2026-07-10T00:00:00.000Z');

    expect(estado.chamadas).toBe(1);
    expect(estado.datas[0] instanceof Date).toBe(true);
    expect(r.ciclo).toBe('2026-07');
  });

  test('retorno possui resumo operacional no contrato do acionamento', () => {
    const { ctx } = montarComServiceFake({
      retorno: {
        idCiclo: '2026-08',
        resumoOperacional: {
          parceiros: 3,
          briefingsGerados: 3,
          ativacoesGeradas: 3,
          logisticaGerada: 3,
          pagamentosGerados: 3
        }
      }
    });

    expect(ctx.apiGerarCicloMensal('ADMIN-OK', '2026-08-01T00:00:00.000Z')).toEqual({
      ciclo: '2026-08',
      parceirosProcessados: 3,
      briefingsGerados: 3,
      ativacoesGeradas: 3,
      logisticaGerada: 3,
      pagamentosGerados: 3
    });
  });

  test('segunda execução mantém idempotência do fluxo (sem duplicidade no resumo)', () => {
    const { ctx } = montarComServiceFake({
      retorno: {
        idCiclo: '2026-09',
        resumoOperacional: {
          parceiros: 2,
          briefingsGerados: 2,
          ativacoesGeradas: 2,
          logisticaGerada: 2,
          pagamentosGerados: 2
        }
      }
    });

    const r1 = ctx.apiGerarCicloMensal('ADMIN-OK', '2026-09-01T00:00:00.000Z');
    const r2 = ctx.apiGerarCicloMensal('ADMIN-OK', '2026-09-15T00:00:00.000Z');

    expect(r1).toEqual(r2);
    expect(r1.parceirosProcessados).toBe(2);
  });

  test('acionador não duplica regra de negócio: somente propaga resumo do service', () => {
    const { ctx } = montarComServiceFake({
      retorno: {
        idCiclo: '2030-01',
        resumoOperacional: {
          parceiros: 1,
          briefings: 7,
          ativacoes: 9,
          logistica: 5,
          pagamentos: 4
        }
      }
    });

    const r = ctx.apiGerarCicloMensal('ADMIN-OK', '2030-01-01T00:00:00.000Z');

    expect(r).toEqual({
      ciclo: '2030-01',
      parceirosProcessados: 1,
      briefingsGerados: 7,
      ativacoesGeradas: 9,
      logisticaGerada: 5,
      pagamentosGerados: 4
    });
  });
});
