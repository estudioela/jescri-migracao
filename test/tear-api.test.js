/**
 * Pontos de entrada de google.script.run (tear/Api.js), atravessando o
 * Repository REAL contra uma planilha falsa.
 *
 * É o primeiro teste a exercitar AtivacaoRepository: os demais injetam um fake
 * no lugar dele. Aqui o que se verifica é justamente a fiação — Api → Controller
 * → Service → Repository → SpreadsheetApp — e a garantia de que nenhuma exceção
 * escapa como página de erro do Apps Script.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

const CABECALHO = [
  'ID_Ativacao', 'ID_Ciclo', 'ID_Influenciadora', 'Tipo_Conteudo',
  'Estado_Principal', 'Look_Referencia', 'Data_Prevista_Entrega',
  'Link_Briefing', 'Link_Upload_HD', 'Estado_Derivado'
];

const LINHAS = [
  ['a-1', 'c-1', 'i-1', 'REEL', 'Em Produção', 'look 3', '', 'https://ex/b', '', 'Atrasado'],
  ['a-2', 'c-1', 'i-2', 'STORIES', 'Planejamento', '', '', '', '', 'No Prazo'],
  ['a-3', 'c-2', 'i-1', 'CARROSSEL', 'Aprovada', '', '', '', '', 'No Prazo']
];

function abaFalsa(cabecalho, linhas) {
  const gravado = [];

  return {
    gravado,
    getDataRange: () => ({ getValues: () => [cabecalho.slice()].concat(linhas.map((l) => l.slice())) }),
    getRange: () => ({
      // Estado_Derivado é fórmula na planilha viva: save() tem que regravá-la
      // como fórmula, não como o valor calculado.
      getFormulas: () => [cabecalho.map((c) => (c === 'Estado_Derivado' ? '=FORMULA()' : ''))],
      setValues: (valores) => gravado.push(valores[0])
    }),
    appendRow: (linha) => gravado.push(linha)
  };
}

function carregarApi({ aba } = {}) {
  const SpreadsheetApp = {
    getActive: () => ({ getSheetByName: (nome) => (nome === 'Ativacoes' ? aba : null) })
  };

  return loadGasFiles(
    ['Config.js', 'Ativacao.js', 'AtivacaoRepository.js', 'EventDispatcher.js', 'AtivacaoService.js', 'WebAppController.js', 'Api.js'].map(arquivo),
    { SpreadsheetApp, console: { error() {} }, Utilities: { getUuid: () => 'uuid-novo' } },
    ['apiListarAtivacoesDoCiclo', 'apiObterAtivacao', 'apiAlterarEstadoDaAtivacao']
  );
}

describe('apiListarAtivacoesDoCiclo', () => {
  test('devolve as ativações do ciclo, já em DTO', () => {
    const api = carregarApi({ aba: abaFalsa(CABECALHO, LINHAS) });

    const resposta = api.apiListarAtivacoesDoCiclo('c-1');

    expect(resposta.success).toBe(true);
    expect(resposta.data.map((d) => d.idAtivacao)).toEqual(['a-1', 'a-2']);
    expect(resposta.data[0].tipoConteudo).toBe('REEL');
  });

  test('não expõe Estado_Derivado, que é coluna de fórmula', () => {
    const api = carregarApi({ aba: abaFalsa(CABECALHO, LINHAS) });

    const [dto] = api.apiListarAtivacoesDoCiclo('c-1').data;

    expect(dto).not.toHaveProperty('Estado_Derivado');
    expect(JSON.stringify(dto)).not.toContain('Atrasado');
  });

  test('ciclo sem ativações devolve lista vazia, não erro', () => {
    const api = carregarApi({ aba: abaFalsa(CABECALHO, LINHAS) });

    expect(api.apiListarAtivacoesDoCiclo('c-99')).toEqual({ success: true, data: [] });
  });

  // Hoje as abas da V2 não existem na planilha viva. O front-end precisa receber
  // um envelope, não uma página de erro do Apps Script.
  test('aba ausente vira {success:false}, sem lançar', () => {
    const api = carregarApi({ aba: null });

    const resposta = api.apiListarAtivacoesDoCiclo('c-1');

    expect(resposta.success).toBe(false);
    expect(resposta.error).toMatch(/Aba "Ativacoes" não encontrada/);
  });

  test('coluna ausente no cabeçalho vira {success:false}', () => {
    const api = carregarApi({ aba: abaFalsa(['ID_Ativacao'], [['a-1']]) });

    const resposta = api.apiListarAtivacoesDoCiclo('c-1');

    expect(resposta.success).toBe(false);
    expect(resposta.error).toMatch(/Coluna "ID_Ciclo" ausente/);
  });

  test.each([[''], [null], [undefined]])('ciclo %p vira erro de domínio', (vazio) => {
    const api = carregarApi({ aba: abaFalsa(CABECALHO, LINHAS) });

    expect(api.apiListarAtivacoesDoCiclo(vazio).success).toBe(false);
  });
});

describe('apiObterAtivacao', () => {
  test('devolve o DTO da ativação', () => {
    const api = carregarApi({ aba: abaFalsa(CABECALHO, LINHAS) });

    expect(api.apiObterAtivacao('a-3').data.tipoConteudo).toBe('CARROSSEL');
  });

  test('id inexistente vira {success:false}', () => {
    const api = carregarApi({ aba: abaFalsa(CABECALHO, LINHAS) });

    expect(api.apiObterAtivacao('nao-existe')).toEqual({
      success: false,
      error: expect.stringMatching(/não encontrada/i)
    });
  });
});

describe('apiAlterarEstadoDaAtivacao', () => {
  test('grava a transição válida e preserva a fórmula de Estado_Derivado', () => {
    const aba = abaFalsa(CABECALHO, LINHAS);
    const api = carregarApi({ aba });

    const resposta = api.apiAlterarEstadoDaAtivacao('a-1', 'Aguardando Aprovação');

    expect(resposta.success).toBe(true);
    expect(resposta.data.estadoAnterior).toBe('Em Produção');

    const linhaGravada = aba.gravado[0];
    expect(linhaGravada[CABECALHO.indexOf('Estado_Principal')]).toBe('Aguardando Aprovação');
    expect(linhaGravada[CABECALHO.indexOf('Estado_Derivado')]).toBe('=FORMULA()');
  });

  test('transição proibida não grava nada', () => {
    const aba = abaFalsa(CABECALHO, LINHAS);
    const api = carregarApi({ aba });

    const resposta = api.apiAlterarEstadoDaAtivacao('a-1', 'Publicada');

    expect(resposta.success).toBe(false);
    expect(resposta.error).toMatch(/Transição proibida/i);
    expect(aba.gravado).toHaveLength(0);
  });
});
