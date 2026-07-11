/**
 * ETL Fase 2 — transformarParceirosV1ParaV2 (estrutura horizontal / Autocrat).
 *
 * Fixa o De-Para V1 → V2: identidade estável do runtime (CAMPOS_PARCEIRO) +
 * colunas de consolidação do Autocrat, numa única linha por parceira. Leitura
 * SEMPRE por nome de cabeçalho — reordenar colunas da V1 não pode mudar nada.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

const { transformarParceirosV1ParaV2, cabecalhoParceirosV2_, linhasDeParceirosParaGravar, CAMPOS_PARCEIRO } = loadGasFiles(
  ['Infra.js', 'Repositories.js', 'DevTools.js'].map(arquivo),
  {},
  ['transformarParceirosV1ParaV2', 'cabecalhoParceirosV2_', 'linhasDeParceirosParaGravar', 'CAMPOS_PARCEIRO']
);

// Cabeçalho sintético da BASE DE DADOS da V1 (nomes assumidos; o dry-run real
// confirma os nomes de origem na planilha viva).
const CAB = [
  'STATUS', 'INFLU_KEY', 'CUPOM', 'INFLUENCIADORA_RAZAO_SOCIAL',
  'REELS_TEXTO', 'CARROSSEL_TEXTO', 'STORIES_TEXTO', 'VALOR_TOTAL', 'LOOKS_QTD',
  'INFLUENCIADORA_ENDERECO'
];
const linha = (status, key, cupom, nome) => [
  status, key, cupom, nome, 2, 1, 3, 1500, 4, 'Rua A, 10, Centro, SP'
];

describe('cabecalhoParceirosV2_', () => {
  test('une identidade do runtime + colunas de consolidação do Autocrat', () => {
    expect(cabecalhoParceirosV2_()).toEqual([
      'ID_Influenciadora', 'Nome', 'Status_Contrato', 'Categoria', 'Cupom',
      'Qtd_Reels', 'Qtd_Carrossel', 'Qtd_Stories', 'Valor_Total_Contrato',
      'Looks_Qtd', 'Endereço_Formatado', 'Senha_Hash'
    ]);
  });
});

describe('transformarParceirosV1ParaV2', () => {
  test('mapeia INFLU_KEY → ID_Influenciadora e preenche as colunas Autocrat', () => {
    const { parceiros } = transformarParceirosV1ParaV2([CAB, linha('ON', 'CAROL', 'CAROL10', 'Carol ME')]);
    const p = parceiros[0];

    expect(p[CAMPOS_PARCEIRO.ID]).toBe('CAROL');
    expect(p[CAMPOS_PARCEIRO.NOME]).toBe('Carol ME');
    expect(p[CAMPOS_PARCEIRO.STATUS_CONTRATO]).toBe('ATIVO');
    expect(p[CAMPOS_PARCEIRO.CUPOM]).toBe('CAROL10');
    expect(p.Qtd_Reels).toBe('2');
    expect(p.Qtd_Carrossel).toBe('1');
    expect(p.Qtd_Stories).toBe('3');
    expect(p.Valor_Total_Contrato).toBe('1500');
    expect(p.Looks_Qtd).toBe('4');
    expect(p['Endereço_Formatado']).toBe('Rua A, 10, Centro, SP');
    expect(p[CAMPOS_PARCEIRO.SENHA_HASH]).toBe('');
  });

  test('migra 100% da base: inativo (OFF) entra como INATIVO, não é descartado', () => {
    const { parceiros, descartadas } = transformarParceirosV1ParaV2([
      CAB,
      linha('OFF', 'DANI', 'DANI10', 'Dani ME'),
      linha('ON', 'CAROL', 'CAROL10', 'Carol ME')
    ]);

    expect(parceiros.map((p) => p[CAMPOS_PARCEIRO.STATUS_CONTRATO])).toEqual(['INATIVO', 'ATIVO']);
    expect(descartadas).toEqual([]);
  });

  test('reordenar as colunas da V1 não muda o resultado', () => {
    const invertido = ['CUPOM', 'INFLU_KEY', 'STATUS', 'VALOR_TOTAL'];
    const { parceiros } = transformarParceirosV1ParaV2([invertido, ['CAROL10', 'CAROL', 'ON', 999]]);

    expect(parceiros[0][CAMPOS_PARCEIRO.ID]).toBe('CAROL');
    expect(parceiros[0].Valor_Total_Contrato).toBe('999');
  });

  test('coluna Autocrat ausente na V1 sai vazia (relatada no De-Para), sem quebrar', () => {
    const magro = ['STATUS', 'INFLU_KEY', 'CUPOM'];
    const { parceiros, deParaResolvido } = transformarParceirosV1ParaV2([magro, ['ON', 'BIA', 'BIA10']]);

    expect(parceiros[0].Qtd_Reels).toBe('');
    expect(deParaResolvido.Qtd_Reels).toBeNull();
    expect(deParaResolvido[CAMPOS_PARCEIRO.ID]).toBe('INFLU_KEY');
  });

  test('descarta apenas sem cupom / sem chave, registrando o motivo', () => {
    const { parceiros, descartadas } = transformarParceirosV1ParaV2([
      CAB,
      linha('ON', 'BIA', '', 'Bia ME'),
      linha('ON', '', 'X10', 'Sem chave')
    ]);

    expect(parceiros).toEqual([]);
    expect(descartadas.map((d) => d.motivo)).toEqual(['SEM_CUPOM', 'SEM_INFLU_KEY']);
  });

  test('sem razão social o nome cai para a chave — nunca vazio', () => {
    const { parceiros } = transformarParceirosV1ParaV2([CAB, linha('ON', 'CAROL', 'CAROL10', '')]);
    expect(parceiros[0][CAMPOS_PARCEIRO.NOME]).toBe('CAROL');
  });

  test('INFLU_KEY duplicada falha alto', () => {
    expect(() =>
      transformarParceirosV1ParaV2([CAB, linha('ON', 'CAROL', 'C1', 'x'), linha('ON', 'CAROL', 'C2', 'y')])
    ).toThrow(/duplicada/i);
  });

  test('coluna obrigatória ausente falha alto', () => {
    expect(() => transformarParceirosV1ParaV2([['STATUS', 'INFLU_KEY'], ['ON', 'CAROL']])).toThrow(/CUPOM/);
  });

  test('endereço pronto (INFLUENCIADORA_ENDERECO) mapeia direto', () => {
    const { parceiros } = transformarParceirosV1ParaV2([CAB, linha('ON', 'CAROL', 'CAROL10', 'Carol ME')]);
    expect(parceiros[0]['Endereço_Formatado']).toBe('Rua A, 10, Centro, SP');
  });

  test('sem endereço pronto, concatena os campos avulsos como fallback', () => {
    const semPronto = ['STATUS', 'INFLU_KEY', 'CUPOM', 'RUA', 'NUMERO', 'BAIRRO', 'CIDADE', 'UF'];
    const dados = ['ON', 'CAROL', 'CAROL10', 'Rua B', '9', 'Vila', 'Santos', 'SP'];
    const { parceiros } = transformarParceirosV1ParaV2([semPronto, dados]);

    expect(parceiros[0]['Endereço_Formatado']).toBe('Rua B, 9, Vila, Santos, SP');
  });

  test('planilha vazia devolve nada, sem lançar', () => {
    expect(transformarParceirosV1ParaV2([CAB]).parceiros).toEqual([]);
    expect(transformarParceirosV1ParaV2([]).parceiros).toEqual([]);
  });
});

// Caminho de dados do writer migrarParceirosDaV1() (sem o I/O de planilha):
// transform → linhas prontas para gravar, na ordem do cabeçalho canônico.
describe('escrita: transform + linhasDeParceirosParaGravar', () => {
  test('gera a linha completa na ordem do cabeçalho canônico', () => {
    const { cabecalho, parceiros } = transformarParceirosV1ParaV2([CAB, linha('ON', 'CAROL', 'CAROL10', 'Carol ME')]);
    const [linhaGravada] = linhasDeParceirosParaGravar(cabecalho, parceiros, {});

    expect(cabecalho).toEqual(cabecalhoParceirosV2_());
    expect(linhaGravada).toEqual([
      'CAROL', 'Carol ME', 'ATIVO', '', 'CAROL10',
      '2', '1', '3', '1500', '4', 'Rua A, 10, Centro, SP', ''
    ]);
  });

  test('preserva Senha_Hash existente casando pela chave primária', () => {
    const { cabecalho, parceiros } = transformarParceirosV1ParaV2([CAB, linha('ON', 'CAROL', 'CAROL10', 'Carol ME')]);
    const [linhaGravada] = linhasDeParceirosParaGravar(cabecalho, parceiros, { CAROL: 'sal$hash' });

    expect(linhaGravada[cabecalho.indexOf(CAMPOS_PARCEIRO.SENHA_HASH)]).toBe('sal$hash');
  });
});
