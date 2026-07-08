/**
 * garantirColunasIdAnoAtivacoes() + arquivarGenerico() name-based —
 * mae/Código.js. A planilha viva (SYSTEM_SCHEMA de 2026-07-07) tem ATIVAÇÕES
 * com 7 colunas (sem ID/ANO_REFERENCIA) e HISTÓRICO DE CONTEÚDOS com
 * DATA_ARQUIVAMENTO na mesma posição em que ATIVAÇÕES tem LINK_ARQUIVO — a
 * cópia posicional antiga de arquivarGenerico gravava o link na coluna de
 * carimbo do histórico. A migração cria ID/ANO_REFERENCIA nos dois lados
 * (idempotente, só preenche células vazias) e o arquivamento passou a mapear
 * origem→destino por nome de cabeçalho.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const { criarUtilitiesFake, criarLoggerFake, criarAbaFake, criarSpreadsheetAppFake } = require('./helpers/gasServiceMocks');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

// Cabeçalhos REAIS da planilha viva (7 colunas cada, divergentes na 7ª).
const HEADER_ATIV_REAL = ['INFLU_KEY', 'MES_REFERENCIA', 'FORMATO', 'DATA_APROVACAO', 'DATA_ATIVACAO', 'STATUS_CONTEUDO', 'LINK_ARQUIVO'];
const HEADER_HIST_REAL = ['INFLU_KEY', 'MES_REFERENCIA', 'FORMATO', 'DATA_APROVACAO', 'DATA_ATIVACAO', 'STATUS_CONTEUDO', 'DATA_ARQUIVAMENTO'];

function montarAmbiente({ ativacoes = [], historico = [], semHistorico = false, respostaConfirmacao = 'YES' }) {
  const abas = { 'ATIVAÇÕES': criarAbaFake([HEADER_ATIV_REAL.slice(), ...ativacoes]) };
  if (!semHistorico) abas['HISTÓRICO DE CONTEÚDOS'] = criarAbaFake([HEADER_HIST_REAL.slice(), ...historico]);

  const uiFake = {
    _alertas: [],
    alert: (...args) => {
      uiFake._alertas.push(args);
      if (args.length >= 3) return respostaConfirmacao === 'YES' ? uiFake.Button.YES : uiFake.Button.NO;
      return uiFake.Button.OK;
    },
    ButtonSet: { YES_NO: 'YES_NO', OK: 'OK' },
    Button: { YES: 'YES', NO: 'NO', OK: 'OK' }
  };

  const spreadsheetAppFake = criarSpreadsheetAppFake(abas);
  spreadsheetAppFake.getUi = () => uiFake;

  const sandbox = {
    SpreadsheetApp: spreadsheetAppFake,
    Utilities: criarUtilitiesFake(),
    Logger: criarLoggerFake(),
    Session: { getActiveUser: () => ({ getEmail: () => 'teste@estudioela.com' }) }
  };
  const modulo = loadGasFiles([CODIGO_PATH], sandbox);
  return { modulo, abas, uiFake };
}

function col(header, nome) { return header.indexOf(nome); }

describe('Código.js — garantirColunasIdAnoAtivacoes() — migração', () => {
  test('cria ID e ANO_REFERENCIA nos dois lados e faz backfill só das células vazias', () => {
    const dataAprov = new Date(2026, 6, 3); // 03/07/2026
    const dataArq = new Date(2026, 2, 12); // 12/03/2026
    const { modulo, abas } = montarAmbiente({
      ativacoes: [
        ['MARIA INFLUENCER', 'JULHO', 'REEL', dataAprov, '', 'em aberto', ''],
        ['MARIA INFLUENCER', 'JULHO', 'CARROSSEL', '', '', 'em aberto', ''] // sem data → ano corrente
      ],
      historico: [
        ['MARIA INFLUENCER', 'ABRIL', 'REEL', '', '', 'postado', dataArq],
        ['MARIA INFLUENCER', 'MARÇO', 'REEL', '', '', 'postado', ''] // sem nenhuma data → ano fica vazio
      ]
    });

    modulo.garantirColunasIdAnoAtivacoes();

    const ativ = abas['ATIVAÇÕES'];
    expect(ativ._linhas[0]).toEqual([...HEADER_ATIV_REAL, 'ID', 'ANO_REFERENCIA']);
    const cId = 7, cAno = 8; // novas colunas, 0-based
    expect(ativ._linhas[1][cId]).toMatch(/^uuid-teste-/);
    expect(ativ._linhas[1][cAno]).toBe(2026); // derivado de DATA_APROVACAO
    expect(ativ._linhas[2][cId]).toMatch(/^uuid-teste-/);
    expect(ativ._linhas[2][cId]).not.toBe(ativ._linhas[1][cId]); // IDs distintos
    expect(ativ._linhas[2][cAno]).toBe(new Date().getFullYear()); // aba viva sem data → ano corrente

    const hist = abas['HISTÓRICO DE CONTEÚDOS'];
    expect(hist._linhas[0]).toEqual([...HEADER_HIST_REAL, 'ID', 'ANO_REFERENCIA']);
    expect(hist._linhas[1][7] || '').toBe(''); // histórico NÃO ganha ID retroativo
    expect(hist._linhas[1][8]).toBe(2026); // derivado de DATA_ARQUIVAMENTO
    expect(hist._linhas[2][8] || '').toBe(''); // sem data aproveitável → não chuta ano
  });

  test('é idempotente: segunda execução não duplica colunas nem troca IDs já preenchidos', () => {
    const { modulo, abas } = montarAmbiente({
      ativacoes: [['MARIA INFLUENCER', 'JULHO', 'REEL', '', '', 'em aberto', '']]
    });
    modulo.garantirColunasIdAnoAtivacoes();
    const headerApos1a = abas['ATIVAÇÕES']._linhas[0].slice();
    const idApos1a = abas['ATIVAÇÕES']._linhas[1][7];

    modulo.garantirColunasIdAnoAtivacoes();

    expect(abas['ATIVAÇÕES']._linhas[0]).toEqual(headerApos1a); // sem coluna duplicada
    expect(abas['ATIVAÇÕES']._linhas[1][7]).toBe(idApos1a); // ID preservado
  });

  test('cancelar na confirmação não altera nada', () => {
    const { modulo, abas } = montarAmbiente({
      ativacoes: [['MARIA INFLUENCER', 'JULHO', 'REEL', '', '', 'em aberto', '']],
      respostaConfirmacao: 'NO'
    });
    modulo.garantirColunasIdAnoAtivacoes();
    expect(abas['ATIVAÇÕES']._linhas[0]).toEqual(HEADER_ATIV_REAL);
  });

  test('aba HISTÓRICO ausente: migra só ATIVAÇÕES, sem quebrar', () => {
    const { modulo, abas } = montarAmbiente({
      ativacoes: [['MARIA INFLUENCER', 'JULHO', 'REEL', '', '', 'em aberto', '']],
      semHistorico: true
    });
    expect(() => modulo.garantirColunasIdAnoAtivacoes()).not.toThrow();
    expect(abas['ATIVAÇÕES']._linhas[0]).toEqual([...HEADER_ATIV_REAL, 'ID', 'ANO_REFERENCIA']);
  });
});

describe('Código.js — arquivarGenerico() — cópia por nome com par divergente (cabeçalhos reais)', () => {
  test('LINK_ARQUIVO não vaza para DATA_ARQUIVAMENTO; carimbo cai na coluna certa; coluna sem correspondente no destino é descartada', () => {
    const { modulo, abas } = montarAmbiente({
      ativacoes: [['MARIA INFLUENCER', 'JULHO', 'REEL', '', '', 'postado', 'https://drive.google.com/file/d/abc/view']]
    });

    const movidos = modulo.arquivarGenerico('ATIVAÇÕES', 'HISTÓRICO DE CONTEÚDOS', 'STATUS_CONTEUDO', ['postado'], true);

    expect(movidos).toBe(1);
    const hist = abas['HISTÓRICO DE CONTEÚDOS'];
    expect(hist._linhas).toHaveLength(2);
    const linha = hist._linhas[1];
    expect(linha[col(HEADER_HIST_REAL, 'INFLU_KEY')]).toBe('MARIA INFLUENCER');
    expect(linha[col(HEADER_HIST_REAL, 'STATUS_CONTEUDO')]).toBe('postado');
    // Coluna 7 do destino é DATA_ARQUIVAMENTO: recebe o carimbo, não o link.
    expect(linha[col(HEADER_HIST_REAL, 'DATA_ARQUIVAMENTO')]).toMatch(/^\d{2}\/\d{2}\/\d{4}/);
    // LINK_ARQUIVO não existe no destino → valor descartado, sem coluna 8 fantasma.
    expect(linha).toHaveLength(HEADER_HIST_REAL.length);
  });

  test('após a migração (ID/ANO nos dois lados), ID e ANO_REFERENCIA são carregados para o histórico', () => {
    const { modulo, abas } = montarAmbiente({
      ativacoes: [['MARIA INFLUENCER', 'JULHO', 'REEL', '', '', 'em aberto', '']]
    });
    modulo.garantirColunasIdAnoAtivacoes();
    const ativ = abas['ATIVAÇÕES'];
    const idGerado = ativ._linhas[1][7];
    ativ._linhas[1][col(HEADER_ATIV_REAL, 'STATUS_CONTEUDO')] = 'postado';

    modulo.arquivarGenerico('ATIVAÇÕES', 'HISTÓRICO DE CONTEÚDOS', 'STATUS_CONTEUDO', ['postado'], true);

    const hist = abas['HISTÓRICO DE CONTEÚDOS'];
    const hHist = hist._linhas[0];
    expect(hist._linhas[1][hHist.indexOf('ID')]).toBe(idGerado);
    expect(hist._linhas[1][hHist.indexOf('ANO_REFERENCIA')]).toBe(new Date().getFullYear());
    expect(hist._linhas[1][hHist.indexOf('DATA_ARQUIVAMENTO')]).toMatch(/^\d{2}\/\d{2}\/\d{4}/);
  });
});
