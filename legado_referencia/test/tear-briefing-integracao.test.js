/**
 * Amarração do BRIEFING ao ciclo (TURBO): ao listar as ativações da parceira num
 * ciclo, o AtivacaoService lê a URL em `INFLU_SHEET_URL` da base principal, varre
 * a aba "LOOKS BRIEFING" da planilha individual e anexa os looks a cada ativação.
 * FAIL-SAFE: sem URL válida → looks vazios, sem derrubar a listagem.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

function montar() {
  return loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js', 'Services.js'].map(arquivo),
    { console: { warn() {} } },
    ['AtivacaoService', 'BriefingService', 'BriefingRepository', 'CAMPOS_ATIVACAO']
  );
}

const URL_VALIDA = 'https://docs.google.com/spreadsheets/d/ABC123/edit';

// EventDispatcher e AtivacaoRepository mínimos para o construtor.
const dispatcherFake = { dispatch() {} };

function ativacaoRepoFake(linhas) {
  return { findByCiclo: () => linhas };
}

function parceiroRepoFake(url) {
  return { getById: () => (url === undefined ? null : { INFLU_SHEET_URL: url }) };
}

function planilhaExterna(linhas) {
  return {
    getSheetByName: (nome) => (nome === 'LOOKS BRIEFING'
      ? { getDataRange: () => ({ getValues: () => linhas }) }
      : null),
    getSheets: () => [{ getDataRange: () => ({ getValues: () => linhas }) }]
  };
}

describe('AtivacaoService.listarDaInfluenciadoraNoCiclo — looks do briefing', () => {
  test('anexa os looks puxados de INFLU_SHEET_URL a cada ativação da parceira', () => {
    const ctx = montar();
    const C = ctx.CAMPOS_ATIVACAO;
    const linha = { [C.ID]: 'A1', [C.CICLO]: 'C1', [C.INFLUENCIADORA]: 'INF1', [C.ESTADO]: 'Planejamento' };

    const briefing = new ctx.BriefingService(
      new ctx.BriefingRepository(() => planilhaExterna([['LOOK_REEL', 'vestido floral']]))
    );
    const service = new ctx.AtivacaoService(
      dispatcherFake, ativacaoRepoFake([linha]), briefing, parceiroRepoFake(URL_VALIDA)
    );

    const [dto] = service.listarDaInfluenciadoraNoCiclo('C1', 'INF1');

    expect(dto.looksBriefing).toEqual({
      lookReel: 'Vestido Floral', lookCarrossel: '', lookStories1: '', lookStories2: ''
    });
  });

  test('fail-safe: parceira sem INFLU_SHEET_URL → looks vazios, listagem intacta', () => {
    const ctx = montar();
    const C = ctx.CAMPOS_ATIVACAO;
    const linha = { [C.ID]: 'A1', [C.CICLO]: 'C1', [C.INFLUENCIADORA]: 'INF1', [C.ESTADO]: 'Planejamento' };

    const service = new ctx.AtivacaoService(
      dispatcherFake, ativacaoRepoFake([linha]), new ctx.BriefingService(), parceiroRepoFake(undefined)
    );

    const [dto] = service.listarDaInfluenciadoraNoCiclo('C1', 'INF1');

    expect(dto.idAtivacao).toBe('A1');
    expect(dto.looksBriefing).toEqual({ lookReel: '', lookCarrossel: '', lookStories1: '', lookStories2: '' });
  });
});
