/**
 * Entidade Ciclo (Etapa 5) e a garantia de envelope de tear/Api.js.
 *
 * O teste mais importante aqui é o último: se `SpreadsheetApp.getActive()`
 * lançar, o throw acontece ANTES de qualquer try do Controller — o Apps Script
 * devolveria uma página de erro no lugar do JSON, e o front-end veria HTML onde
 * esperava um envelope. É o modo de falha que a V1 manifestou como
 * "Failed to fetch".
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

const ARQUIVOS = [
  'Config.js', 'Ativacao.js', 'AtivacaoRepository.js', 'EventDispatcher.js',
  'AtivacaoService.js', 'WebAppController.js',
  'CicloRepository.js', 'CicloService.js', 'CicloController.js', 'Api.js'
];

const EXPORTS = ['apiListarCiclos', 'apiListarAtivacoesDoCiclo', 'CicloService', 'CicloRepository', 'CicloController'];

const CABECALHO = ['ID_Ciclo', 'Nome_Ciclo', 'Data_Inicio_Logistica', 'Data_Fim_Operacao'];
const INICIO = new Date('2026-07-01T00:00:00.000Z');

function abaFalsa(cabecalho, linhas) {
  return { getDataRange: () => ({ getValues: () => [cabecalho.slice()].concat(linhas.map((l) => l.slice())) }) };
}

function carregar(spreadsheetApp) {
  return loadGasFiles(ARQUIVOS.map(arquivo), { SpreadsheetApp: spreadsheetApp, console: { error() {} } }, EXPORTS);
}

function comAba(aba) {
  return carregar({ getActive: () => ({ getSheetByName: (nome) => (nome === 'Ciclos' ? aba : null) }) });
}

describe('apiListarCiclos', () => {
  test('devolve os ciclos em DTO, com data em ISO', () => {
    const api = comAba(abaFalsa(CABECALHO, [['c-1', 'julho', INICIO, '']]));

    expect(api.apiListarCiclos()).toEqual({
      success: true,
      data: [{ idCiclo: 'c-1', nome: 'julho', inicioLogistica: INICIO.toISOString(), fimOperacao: '' }]
    });
  });

  // getDataRange() devolve as linhas em branco que o Sheets mantém abaixo dos
  // dados. Sem o filtro, o seletor de ciclo ganharia opções vazias.
  test('ignora as linhas sem ID que o Sheets devolve depois dos dados', () => {
    const api = comAba(abaFalsa(CABECALHO, [['c-1', 'julho', '', ''], ['', '', '', ''], ['  ', '', '', '']]));

    expect(api.apiListarCiclos().data.map((c) => c.idCiclo)).toEqual(['c-1']);
  });

  test('ciclo sem nome cai no id, para o seletor nunca exibir opção em branco', () => {
    const api = comAba(abaFalsa(CABECALHO, [['c-9', '', '', '']]));

    expect(api.apiListarCiclos().data[0].nome).toBe('c-9');
  });

  test('aba ausente vira {success:false}, sem lançar', () => {
    const api = comAba(null);

    expect(api.apiListarCiclos()).toEqual({
      success: false,
      error: expect.stringMatching(/Aba "Ciclos" não encontrada/)
    });
  });

  test('coluna ausente vira {success:false}', () => {
    const api = comAba(abaFalsa(['Nome_Ciclo'], [['julho']]));

    expect(api.apiListarCiclos().success).toBe(false);
    expect(api.apiListarCiclos().error).toMatch(/Coluna "ID_Ciclo" ausente/);
  });
});

describe('tear/Api.js — nenhuma exceção escapa como página de erro', () => {
  // A montagem das dependências acontece fora do try do Controller.
  test('falha ao abrir a planilha vira envelope, não exceção', () => {
    const api = carregar({
      getActive: () => {
        throw new Error('You do not have permission to access the requested document.');
      }
    });

    expect(() => api.apiListarCiclos()).not.toThrow();
    expect(api.apiListarCiclos()).toEqual({
      success: false,
      error: expect.stringMatching(/do not have permission/)
    });

    expect(api.apiListarAtivacoesDoCiclo('c-1')).toEqual({
      success: false,
      error: expect.stringMatching(/do not have permission/)
    });
  });

  test('um throw sem .message ainda vira envelope legível', () => {
    const api = carregar({
      getActive: () => {
        throw 'falha crua';
      }
    });

    expect(api.apiListarCiclos()).toEqual({ success: false, error: 'falha crua' });
  });
});

describe('CicloController', () => {
  test('exige o Service', () => {
    const { CicloController } = comAba(abaFalsa(CABECALHO, []));

    expect(() => new CicloController()).toThrow(/exige uma instância/);
  });

  test.each([
    [{ action: 'APAGAR' }, /não é suportada/],
    [null, /payload ausente/]
  ])('rejeita %p com envelope de erro', (payload, mensagem) => {
    const { CicloController, CicloService, CicloRepository } = comAba(abaFalsa(CABECALHO, []));
    const controller = new CicloController(new CicloService(new CicloRepository({ getSheetByName: () => abaFalsa(CABECALHO, []) })));

    const resposta = controller.handleCicloQuery(payload);

    expect(resposta.success).toBe(false);
    expect(resposta.error).toMatch(mensagem);
  });
});
