/**
 * Centralização dos looks do BRIEFING (Task 3). O BriefingService herda a
 * varredura EXATA da V1 (`mae/Código.js sincronizarLooks`): abre a planilha
 * individual da parceira, lê a aba "LOOKS BRIEFING" como pares col A→col B
 * (chave em MAIÚSCULA/trim) e projeta LOOK REEL/CARROSSEL/STORIES 1 e 2 em
 * Title Case. Fail-safe: URL inválida → looks vazios.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

// Planilha externa fake: uma aba nomeada "LOOKS BRIEFING" com linhas [chave, valor].
function planilhaExterna(linhasPorAba) {
  return {
    getSheetByName: (nome) => linhasPorAba[nome]
      ? { getDataRange: () => ({ getValues: () => linhasPorAba[nome] }) }
      : null,
    getSheets: () => [{ getDataRange: () => ({ getValues: () => linhasPorAba[Object.keys(linhasPorAba)[0]] || [] }) }]
  };
}

function montar(sandboxExtra) {
  const ctx = loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js', 'Services.js'].map(arquivo),
    Object.assign({ console: { warn() {} } }, sandboxExtra || {}),
    ['BriefingService', 'BriefingRepository', 'formatarTitleCase']
  );
  return ctx;
}

const URL_VALIDA = 'https://docs.google.com/spreadsheets/d/ABC123/edit';

describe('BriefingService.puxarLooks — varredura herdada da V1', () => {
  test('lê a aba "LOOKS BRIEFING" (col A→B) e projeta os 4 formatos em Title Case', () => {
    const ctx = montar();
    const externa = planilhaExterna({
      'LOOKS BRIEFING': [
        ['LOOK_REEL', 'vestido floral longo'],
        ['LOOK_CARROSSEL', 'CONJUNTO ALFAIATARIA'],
        ['LOOK_STORIES_1', 'saia midi'],
        ['LOOK_STORIES_2', 'blazer OVERSIZED']
      ]
    });

    const repo = new ctx.BriefingRepository(() => externa);
    const looks = new ctx.BriefingService(repo).puxarLooks(URL_VALIDA);

    expect(looks).toEqual({
      lookReel: 'Vestido Floral Longo',
      lookCarrossel: 'Conjunto Alfaiataria',
      lookStories1: 'Saia Midi',
      lookStories2: 'Blazer Oversized'
    });
  });

  test('chave com caixa/espaços diferentes é normalizada (maiúscula + trim), como na V1', () => {
    const ctx = montar();
    const externa = planilhaExterna({ 'LOOKS BRIEFING': [['  look_reel  ', 'top cropped']] });

    const repo = new ctx.BriefingRepository(() => externa);
    const looks = new ctx.BriefingService(repo).puxarLooks(URL_VALIDA);

    expect(looks.lookReel).toBe('Top Cropped');
    expect(looks.lookCarrossel).toBe(''); // ausente → vazio
  });

  test('sem a aba "LOOKS BRIEFING", cai na primeira aba (mesmo fallback da V1)', () => {
    const ctx = montar();
    const externa = planilhaExterna({ 'Página1': [['LOOK_REEL', 'macacão preto']] });

    const repo = new ctx.BriefingRepository(() => externa);
    expect(new ctx.BriefingService(repo).puxarLooks(URL_VALIDA).lookReel).toBe('Macacão Preto');
  });

  test('fail-safe: URL que não é do Google Docs devolve looks vazios, sem abrir nada', () => {
    const ctx = montar();
    let abriu = false;
    const repo = new ctx.BriefingRepository(() => { abriu = true; return null; });

    expect(new ctx.BriefingService(repo).puxarLooks('http://exemplo.com/planilha')).toEqual({
      lookReel: '', lookCarrossel: '', lookStories1: '', lookStories2: ''
    });
    expect(abriu).toBe(false);
  });

  test('fail-safe: erro ao abrir a planilha externa não propaga — looks vazios', () => {
    const ctx = montar();
    const repo = new ctx.BriefingRepository(() => { throw new Error('sem permissão'); });

    expect(new ctx.BriefingService(repo).puxarLooks(URL_VALIDA)).toEqual({
      lookReel: '', lookCarrossel: '', lookStories1: '', lookStories2: ''
    });
  });
});
