/**
 * Auditoria técnica 2026-07-07 (docs/AUDITORIA_TECNICA_2026-07-07.md, seções
 * 16.3/18.4, recomendação 20.4): onEdit() e onFormSubmit() (mae/Código.js)
 * tinham blocos catch que engoliam qualquer exceção silenciosamente, sem
 * Logger.log — um bug futuro nessas automações falharia sem deixar rastro
 * no Execution Log. Corrigido adicionando Logger.log(...) dentro de cada
 * catch, sem mudar nenhum outro comportamento (não relança erro, não
 * adiciona validação nova).
 *
 * Estes testes só provam que "o catch agora loga algo diagnosticável quando
 * uma exceção real acontece" — não recobrem toda automação já coberta em
 * test/codigo-onedit-aprovacao.test.js.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const { criarLoggerFake, criarAbaFake, criarSpreadsheetAppFake } = require('./helpers/gasServiceMocks');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

describe('Código.js — onEdit() — catch silencioso agora loga o erro', () => {
  test('exceção dentro do bloco tratado (ATIVAÇÕES) é logada via Logger.log, não engolida', () => {
    const logger = criarLoggerFake({ registrarChamadas: true });
    const modulo = loadGasFiles([CODIGO_PATH], { Logger: logger });

    // Sheet fake cujo getLastColumn() explode — simula uma aba corrompida
    // no meio de getHeaderMap(), bem depois do início do try.
    const sheetFake = {
      getName: () => 'ATIVAÇÕES',
      getLastColumn: () => { throw new Error('cabeçalho corrompido (simulado)'); }
    };
    const evento = {
      range: {
        getSheet: () => sheetFake,
        getRow: () => 2,
        getColumn: () => 1,
        getValue: () => 'x'
      },
      value: 'x'
    };

    expect(() => modulo.onEdit(evento)).not.toThrow();
    expect(logger._chamadas).toHaveLength(1);
    const [mensagem, ...resto] = logger._chamadas[0];
    expect(mensagem).toEqual(expect.stringContaining('onEdit'));
    expect(resto[resto.length - 1]).toBeTruthy(); // err.message não-vazio
  });
});

describe('Código.js — onFormSubmit() — catches silenciosos agora logam o erro', () => {
  function montarAbas({ comCep }) {
    const headerCadastros = comCep
      ? ['NOME_CHAMADA', 'EMAIL_CONTATO', 'CEP', 'NUMERO', 'COMPLEMENTO']
      : ['NOME_CHAMADA', 'EMAIL_CONTATO'];
    const linhaCadastro = comCep
      ? ['MARIA TESTE', 'maria@example.com', '01310100', '100', 'Apto 1']
      : ['JOANA TESTE', 'joana@example.com'];
    const abaCadastros = criarAbaFake([headerCadastros, linhaCadastro]);
    return { abaCadastros };
  }

  test('erro ao buscar/parsear CEP é logado pelo catch interno, execução continua normalmente', () => {
    const logger = criarLoggerFake({ registrarChamadas: true });
    const abaBase = criarAbaFake([['INFLU_KEY', 'EMAIL', 'CEP', 'NUMERO', 'COMPLEMENTO']]);
    const { abaCadastros } = montarAbas({ comCep: true });

    const sandbox = {
      Logger: logger,
      SpreadsheetApp: criarSpreadsheetAppFake({ 'BASE DE DADOS': abaBase, 'CADASTROS': abaCadastros }),
      // HTTP 200 com corpo que não é JSON válido -> JSON.parse lança dentro de
      // resolverEnderecoPorCep(), para onde o try/catch da busca de CEP migrou
      // quando o EnderecoService foi extraído (V-03).
      UrlFetchApp: { fetch: () => ({ getResponseCode: () => 200, getContentText: () => 'NAO-E-JSON' }) }
    };
    const modulo = loadGasFiles([CODIGO_PATH], sandbox);

    expect(() => modulo.onFormSubmit()).not.toThrow();
    expect(logger._chamadas).toHaveLength(1);

    // A identidade do chamador continua no log — agora como argumento `contexto`,
    // não como prefixo da string de formato. A asserção original checava só o
    // primeiro argumento; o que importa (o log identifica onFormSubmit e carrega
    // a causa) segue valendo.
    const chamada = logger._chamadas[0];
    expect(chamada.join(' ')).toEqual(expect.stringContaining('onFormSubmit'));
    expect(chamada.join(' ')).toEqual(expect.stringContaining('resolverEnderecoPorCep'));
    expect(chamada[chamada.length - 1]).toBeTruthy(); // err.message não-vazio

    // Confirma que a linha ainda foi gravada na BASE apesar da falha no CEP —
    // o catch não deve mudar nenhum outro comportamento.
    expect(abaBase._linhas).toHaveLength(2);
  });

  test('erro fatal fora do bloco de CEP é logado pelo catch externo', () => {
    const logger = criarLoggerFake({ registrarChamadas: true });
    const { abaCadastros } = montarAbas({ comCep: false });
    // BASE fake cujo appendRow() explode — simula uma falha real de gravação
    // (ex.: aba protegida, cota excedida) fora do trecho de CEP.
    const abaBaseQuebrada = {
      getName: () => 'BASE DE DADOS',
      getLastColumn: () => 2,
      getRange: () => ({ getValues: () => [['INFLU_KEY', 'EMAIL']] }),
      appendRow: () => { throw new Error('falha simulada ao gravar na BASE'); }
    };

    const sandbox = {
      Logger: logger,
      SpreadsheetApp: criarSpreadsheetAppFake({ 'BASE DE DADOS': abaBaseQuebrada, 'CADASTROS': abaCadastros })
    };
    const modulo = loadGasFiles([CODIGO_PATH], sandbox);

    expect(() => modulo.onFormSubmit()).not.toThrow();
    expect(logger._chamadas).toHaveLength(1);
    const [mensagem, ...resto] = logger._chamadas[0];
    expect(mensagem).toEqual(expect.stringContaining('onFormSubmit'));
    expect(resto[resto.length - 1]).toBeTruthy(); // fatalError.message não-vazio
  });
});
