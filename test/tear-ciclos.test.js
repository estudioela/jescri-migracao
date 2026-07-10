/**
 * Entidade Ciclo e a garantia de envelope de tear/Api.js.
 *
 * O teste mais importante é o último: se `SpreadsheetApp.getActive()` lançar, o
 * throw acontece ANTES de qualquer try do Controller — o Apps Script devolveria
 * uma página de erro no lugar do JSON, e o front-end veria HTML onde esperava um
 * envelope. É o modo de falha que a V1 manifestou como "Failed to fetch".
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const { montarTear, autenticar } = require('./helpers/tearContexto');

const RAIZ = path.join(__dirname, '..');

const PARCEIRAS = [['i-1', 'Ana', 'Ativo', 'Moda', 'ANA10', '']];
const INICIO = new Date('2026-07-01T00:00:00.000Z');

function comCiclos(ciclos) {
  const tear = montarTear({ Parceiros_Influenciadoras: PARCEIRAS, Ciclos: ciclos });

  return { tear, token: autenticar(tear, 'ANA10') };
}

describe('apiListarCiclos', () => {
  test('devolve os ciclos em DTO, com data em ISO', () => {
    const { tear, token } = comCiclos([['c-1', 'julho', INICIO, '']]);

    expect(tear.ctx.apiListarCiclos(token)).toEqual({
      success: true,
      data: [{ idCiclo: 'c-1', nome: 'julho', inicioLogistica: INICIO.toISOString(), fimOperacao: '' }]
    });
  });

  // getDataRange() devolve as linhas em branco que o Sheets mantém abaixo dos
  // dados. Sem o filtro, o seletor de ciclo ganharia opções vazias.
  test('ignora as linhas sem ID que o Sheets devolve depois dos dados', () => {
    const { tear, token } = comCiclos([['c-1', 'julho', '', ''], ['', '', '', ''], ['  ', '', '', '']]);

    expect(tear.ctx.apiListarCiclos(token).data.map((c) => c.idCiclo)).toEqual(['c-1']);
  });

  test('ciclo sem nome cai no id, para o seletor nunca exibir opção em branco', () => {
    const { tear, token } = comCiclos([['c-9', '', '', '']]);

    expect(tear.ctx.apiListarCiclos(token).data[0].nome).toBe('c-9');
  });

  test('exige sessão válida', () => {
    const { tear } = comCiclos([['c-1', 'julho', '', '']]);

    expect(tear.ctx.apiListarCiclos('token-falso').success).toBe(false);
    expect(tear.ctx.apiListarCiclos().error).toMatch(/Sessão expirada/);
  });

  test('aba de ciclos ausente vira {success:false}, sem lançar', () => {
    const tear = montarTear({ Parceiros_Influenciadoras: PARCEIRAS });
    const token = autenticar(tear, 'ANA10');

    expect(tear.ctx.apiListarCiclos(token)).toEqual({
      success: false,
      error: expect.stringMatching(/Aba "Ciclos" não encontrada/)
    });
  });
});

describe('tear/Api.js — nenhuma exceção escapa como página de erro', () => {
  // A montagem das dependências acontece fora do try do Controller.
  function comPlanilhaQueFalha(erro) {
    const arquivos = [
      'Config.js', 'PlanilhaHelpers.js', 'Senha.js', 'Dto.js', 'Ativacao.js', 'AtivacaoRepository.js',
      'EventDispatcher.js', 'AtivacaoService.js', 'AtivacaoController.js',
      'CicloRepository.js', 'CicloService.js', 'CicloController.js',
      'PlanoRepository.js', 'PagamentoService.js', 'PagamentoController.js',
      'ParceiroRepository.js', 'SessaoRepository.js', 'AuthService.js', 'AuthController.js', 'Entrypoints.js'
    ].map((n) => path.join(RAIZ, 'tear', n));

    return loadGasFiles(
      arquivos,
      {
        SpreadsheetApp: { getActive: () => { throw erro; } },
        CacheService: { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) },
        Utilities: { getUuid: () => 'uuid' },
        console: { error() {} }
      },
      ['apiListarCiclos', 'apiListarAtivacoesDoCiclo']
    );
  }

  test('falha ao abrir a planilha vira envelope, não exceção', () => {
    const api = comPlanilhaQueFalha(new Error('You do not have permission to access the requested document.'));

    expect(() => api.apiListarCiclos('tok')).not.toThrow();
    expect(api.apiListarCiclos('tok').error).toMatch(/do not have permission/);
    expect(api.apiListarAtivacoesDoCiclo('tok', 'c-1').error).toMatch(/do not have permission/);
  });

  test('um throw sem .message ainda vira envelope legível', () => {
    const api = comPlanilhaQueFalha('falha crua');

    expect(api.apiListarCiclos('tok')).toEqual({ success: false, error: 'falha crua' });
  });
});
