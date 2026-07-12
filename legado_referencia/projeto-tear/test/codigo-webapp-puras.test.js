/**
 * Testes unitários das funções puras (sem dependência de planilha real) de
 * mae/Código.js e mae/WebApp.js. Carregam o arquivo-fonte real via
 * test/helpers/loadGasModule.js — não há reimplementação/duplicação da
 * lógica aqui, então não há risco de o teste divergir do código real.
 *
 * Ver docs/PLANO_DE_TESTES_QA.md, Fase 2.
 */
const path = require('path');
const { loadGasModule } = require('./helpers/loadGasModule');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');
const WEBAPP_PATH = path.join(__dirname, '..', 'mae', 'WebApp.js');

describe('Código.js — calcularDataAprovacao', () => {
  const { calcularDataAprovacao } = loadGasModule(CODIGO_PATH);

  // Âncora de fato histórico: 2024-01-01 é uma segunda-feira. Usado para
  // construir datas com dia-da-semana conhecido, sem depender do relógio
  // do ambiente de teste.
  test('dia útil (terça) não é empurrado — só recua 7 dias e fixa 12h', () => {
    const resultado = calcularDataAprovacao(new Date(2024, 0, 9)); // terça
    expect(resultado.getFullYear()).toBe(2024);
    expect(resultado.getMonth()).toBe(0);
    expect(resultado.getDate()).toBe(2); // terça anterior
    expect(resultado.getHours()).toBe(12);
  });

  test('recuo cai numa sexta-feira → empurra para a segunda seguinte', () => {
    const resultado = calcularDataAprovacao(new Date(2024, 0, 12)); // sexta
    expect(resultado.getDate()).toBe(8); // segunda seguinte
    expect(resultado.getDay()).toBe(1);
  });

  test('recuo cai num sábado → empurra para a segunda seguinte', () => {
    const resultado = calcularDataAprovacao(new Date(2024, 0, 13)); // sábado
    expect(resultado.getDate()).toBe(8);
    expect(resultado.getDay()).toBe(1);
  });

  test('recuo cai num domingo → empurra para a segunda seguinte', () => {
    const resultado = calcularDataAprovacao(new Date(2024, 0, 14)); // domingo
    expect(resultado.getDate()).toBe(8);
    expect(resultado.getDay()).toBe(1);
  });

  test('aceita string "dd/MM/yyyy" e produz o mesmo resultado que o Date equivalente', () => {
    const viaString = calcularDataAprovacao('12/01/2024');
    const viaData = calcularDataAprovacao(new Date(2024, 0, 12));
    expect(viaString.getTime()).toBe(viaData.getTime());
  });

  test('entrada inválida (nem Date, nem string longa) retorna string vazia', () => {
    expect(calcularDataAprovacao(123)).toBe('');
    expect(calcularDataAprovacao('curta')).toBe('');
    expect(calcularDataAprovacao('abcdefgh')).toBe('');
  });
});

describe('Código.js — getHeaderMap', () => {
  const { getHeaderMap } = loadGasModule(CODIGO_PATH);

  test('normaliza acentos, espaços e ignora colunas vazias', () => {
    const shFake = {
      getLastColumn: () => 4,
      getRange: () => ({ getValues: () => [['Nome ', 'É-mail', '', 'Status Pagamento']] })
    };
    expect(getHeaderMap(shFake)).toEqual({
      NOME: 1,
      'E-MAIL': 2,
      STATUS_PAGAMENTO: 4
    });
  });
});

describe('Código.js — montarLinha', () => {
  const { montarLinha } = loadGasModule(CODIGO_PATH);

  test('posiciona valores pelo índice do cabeçalho e ignora campos desconhecidos', () => {
    const h = { A: 1, B: 2, C: 3 };
    expect(montarLinha(h, { B: 'x', D: 'ignorado' })).toEqual(['', 'x', '']);
  });
});

describe('Código.js — parseMesAno', () => {
  const { parseMesAno } = loadGasModule(CODIGO_PATH);

  test('extrai mês e ano quando o ano está presente', () => {
    expect(parseMesAno('agosto 2026')).toEqual({ mes: 'AGOSTO', ano: 2026 });
  });

  test('assume o ano corrente quando o texto não traz ano', () => {
    const anoAtual = new Date().getFullYear();
    expect(parseMesAno('  agosto  ')).toEqual({ mes: 'AGOSTO', ano: anoAtual });
  });
});

describe('Código.js — textToNumber', () => {
  const { textToNumber } = loadGasModule(CODIGO_PATH);

  test('vazio/nulo/indefinido é zero', () => {
    expect(textToNumber('')).toBe(0);
    expect(textToNumber(null)).toBe(0);
    expect(textToNumber(undefined)).toBe(0);
  });

  test('número é arredondado para baixo', () => {
    expect(textToNumber(3.7)).toBe(3);
  });

  test('dígitos em texto livre são extraídos', () => {
    expect(textToNumber('2 reels')).toBe(2);
  });

  test('por extenso (sem dígitos) é reconhecido', () => {
    expect(textToNumber('cinco')).toBe(5);
    expect(textToNumber('dois')).toBe(2);
  });

  test('comportamento real (não necessariamente desejável): "nenhum" contém a substring "um" e é lido como 1', () => {
    // Achado durante a escrita deste teste, não da auditoria original — string.includes("um")
    // casa com o final de "nenhum". Documentado aqui como comportamento real do código,
    // não como uma correção — decisão de tratar (ou não) fica para uma tarefa futura.
    expect(textToNumber('nenhum')).toBe(1);
  });
});

describe('Código.js — formatarTitleCase', () => {
  const { formatarTitleCase } = loadGasModule(CODIGO_PATH);

  test('vazio/nulo retorna string vazia', () => {
    expect(formatarTitleCase('')).toBe('');
    expect(formatarTitleCase(null)).toBe('');
  });

  test('capitaliza a primeira letra de cada palavra', () => {
    expect(formatarTitleCase('MARIA DA SILVA')).toBe('Maria Da Silva');
  });
});

describe('WebApp.js — normalizarStatusAtivacao', () => {
  const { normalizarStatusAtivacao } = loadGasModule(WEBAPP_PATH, { Utilities: {} });

  test.each([
    ['aprovado', 'APROVADO'],
    ['postado', 'PUBLICADO'],
    ['publicado', 'PUBLICADO'],
    ['ajustes', 'EM_APROVACAO'],
    ['em revisão', 'EM_APROVACAO'],
    ['em aberto', 'AGUARDANDO_MATERIAL'],
    ['falta drive', 'AGUARDANDO_MATERIAL'],
    ['', 'AGUARDANDO_MATERIAL'],
    ['status desconhecido', 'AGUARDANDO_MATERIAL']
  ])('%s -> %s', (bruto, esperado) => {
    expect(normalizarStatusAtivacao(bruto)).toBe(esperado);
  });
});

describe('WebApp.js — normalizarStatusPagamento', () => {
  const { normalizarStatusPagamento } = loadGasModule(WEBAPP_PATH, { Utilities: {} });

  test.each([
    ['pago', 'PAGO'],
    ['aprovado', 'APROVADO'],
    ['em aberto', 'PENDENTE'],
    ['', 'PENDENTE']
  ])('%s -> %s', (bruto, esperado) => {
    expect(normalizarStatusPagamento(bruto)).toBe(esperado);
  });
});

describe('WebApp.js — extrairValorNumerico', () => {
  const { extrairValorNumerico } = loadGasModule(WEBAPP_PATH, { Utilities: {} });

  test('número passa direto', () => {
    expect(extrairValorNumerico(1234.56)).toBe(1234.56);
  });

  test('vazio/nulo é zero', () => {
    expect(extrairValorNumerico('')).toBe(0);
    expect(extrairValorNumerico(null)).toBe(0);
  });

  test('valor formatado em real (BR) é convertido corretamente', () => {
    expect(extrairValorNumerico('R$ 1.234,56')).toBe(1234.56);
  });

  test('texto sem número vira zero', () => {
    expect(extrairValorNumerico('abc')).toBe(0);
  });
});

describe('WebApp.js — nomeFormatoPasta', () => {
  const { nomeFormatoPasta } = loadGasModule(WEBAPP_PATH, { Utilities: {} });

  test.each([
    ['REEL', 'REEL'],
    ['carrossel', 'CARROSSEL'],
    ['STORIES_1', 'STORIES 1'],
    ['STORIES_2', 'STORIES 2'],
    ['STORIES', 'STORIES 1']
  ])('%s -> %s', (formato, esperado) => {
    expect(nomeFormatoPasta(formato)).toBe(esperado);
  });

  test('vazio vira OUTROS', () => {
    expect(nomeFormatoPasta('')).toBe('OUTROS');
  });

  test('formato desconhecido não vazio retorna o próprio valor (maiúsculo) — não "OUTROS"', () => {
    expect(nomeFormatoPasta('algo_esquisito')).toBe('ALGO_ESQUISITO');
  });
});

describe('WebApp.js — formatarData (backend)', () => {
  const UtilitiesMock = {
    formatDate(date) {
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
  };
  const { formatarData } = loadGasModule(WEBAPP_PATH, { Utilities: UtilitiesMock });

  test('vazio/nulo retorna string vazia', () => {
    expect(formatarData(null)).toBe('');
    expect(formatarData('')).toBe('');
  });

  test('Date é formatada via Utilities.formatDate (dd/MM/yyyy)', () => {
    expect(formatarData(new Date(2026, 6, 5))).toBe('05/07/2026');
  });

  test('valor que não é Date é apenas convertido para string', () => {
    expect(formatarData('já é texto')).toBe('já é texto');
    expect(formatarData(123)).toBe('123');
  });
});
