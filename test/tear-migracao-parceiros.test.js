/**
 * Migração de Parceiros_Influenciadoras (leitura da BASE DE DADOS da V1).
 *
 * O bug que este módulo conserta foi de LEITURA POR ÍNDICE: `tools/processador.js`
 * tomou `linha[0]` (`STATUS`) como chave primária e nunca leu `CUPOM`. Os testes
 * abaixo fixam a leitura por NOME de cabeçalho e, principalmente, fixam que uma
 * mudança na ORDEM das colunas da V1 não muda o resultado.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

const { parceirosDaBaseV1, linhasDeParceirosParaGravar, garantirCabecalhoDeParceiros, CAMPOS_PARCEIRO } = loadGasFiles(
  ['Infra.js', 'Repositories.js', 'DevTools.js'].map(arquivo),
  {},
  ['parceirosDaBaseV1', 'linhasDeParceirosParaGravar', 'garantirCabecalhoDeParceiros', 'CAMPOS_PARCEIRO']
);

// Cabeçalho real de tools/base.csv.
const CABECALHO_V1 = ['STATUS', 'INFLU_KEY', 'CUPOM', 'INFLUENCIADORA_RAZAO_SOCIAL', 'EMAIL'];

const linha = (status, key, cupom, nome) => [status, key, cupom, nome, 'x@y.z'];

describe('parceirosDaBaseV1', () => {
  test('lê por nome de cabeçalho: ID vem de INFLU_KEY, nunca de STATUS', () => {
    const { parceiros } = parceirosDaBaseV1([CABECALHO_V1, linha('ON', 'CAROL', 'CAROL10', 'Carol Tanaka ME')]);

    expect(parceiros).toEqual([
      {
        [CAMPOS_PARCEIRO.ID]: 'CAROL',
        [CAMPOS_PARCEIRO.NOME]: 'Carol Tanaka ME',
        [CAMPOS_PARCEIRO.STATUS_CONTRATO]: 'ATIVO',
        [CAMPOS_PARCEIRO.CATEGORIA]: '',
        [CAMPOS_PARCEIRO.CUPOM]: 'CAROL10'
      }
    ]);
    expect(parceiros[0][CAMPOS_PARCEIRO.ID]).not.toBe('ON');
  });

  // A regressão de origem: ordem de coluna diferente, resultado idêntico.
  test('reordenar as colunas da V1 não muda nada', () => {
    const invertido = ['INFLUENCIADORA_RAZAO_SOCIAL', 'CUPOM', 'INFLU_KEY', 'STATUS'];
    const { parceiros } = parceirosDaBaseV1([invertido, ['Carol Tanaka ME', 'CAROL10', 'CAROL', 'ON']]);

    expect(parceiros[0][CAMPOS_PARCEIRO.ID]).toBe('CAROL');
    expect(parceiros[0][CAMPOS_PARCEIRO.CUPOM]).toBe('CAROL10');
  });

  test('descarta inativa e ativa sem cupom, sem inventar linha', () => {
    const { parceiros, descartadas } = parceirosDaBaseV1([
      CABECALHO_V1,
      linha('OFF', 'DANI', 'DANI10', 'Dani ME'),
      linha('ON', 'BIA', '', 'Bia ME'),
      linha('ON', 'CAROL', 'CAROL10', 'Carol Tanaka ME')
    ]);

    expect(parceiros.map((p) => p[CAMPOS_PARCEIRO.ID])).toEqual(['CAROL']);
    expect(descartadas.map((d) => d.motivo)).toEqual(['INATIVA', 'SEM_CUPOM']);
  });

  test('aceita STATUS booleano e TRUE textual', () => {
    const { parceiros } = parceirosDaBaseV1([
      CABECALHO_V1,
      linha(true, 'A', 'A10', 'A ME'),
      linha('true', 'B', 'B10', 'B ME')
    ]);

    expect(parceiros).toHaveLength(2);
  });

  test('sem razão social, o nome cai para a chave — nunca fica vazio', () => {
    const { parceiros } = parceirosDaBaseV1([CABECALHO_V1, linha('ON', 'CAROL', 'CAROL10', '')]);

    expect(parceiros[0][CAMPOS_PARCEIRO.NOME]).toBe('CAROL');
  });

  // Chave duplicada foi exatamente o estado em que a aba ficou ("ON" 10 vezes).
  test('INFLU_KEY duplicada falha alto', () => {
    expect(() =>
      parceirosDaBaseV1([CABECALHO_V1, linha('ON', 'CAROL', 'C1', 'x'), linha('ON', 'CAROL', 'C2', 'y')])
    ).toThrow(/duplicada/i);
  });

  test('coluna obrigatória ausente falha alto em vez de gravar vazio', () => {
    expect(() => parceirosDaBaseV1([['STATUS', 'INFLU_KEY'], ['ON', 'CAROL']])).toThrow(/CUPOM/);
  });

  test('planilha vazia devolve nada, sem lançar', () => {
    expect(parceirosDaBaseV1([CABECALHO_V1])).toEqual({ parceiros: [], descartadas: [] });
    expect(parceirosDaBaseV1([])).toEqual({ parceiros: [], descartadas: [] });
  });
});

describe('linhasDeParceirosParaGravar', () => {
  const cabecalho = [
    CAMPOS_PARCEIRO.ID,
    CAMPOS_PARCEIRO.NOME,
    CAMPOS_PARCEIRO.STATUS_CONTRATO,
    CAMPOS_PARCEIRO.CATEGORIA,
    CAMPOS_PARCEIRO.CUPOM,
    CAMPOS_PARCEIRO.SENHA_HASH
  ];
  const parceiro = {
    [CAMPOS_PARCEIRO.ID]: 'CAROL',
    [CAMPOS_PARCEIRO.NOME]: 'Carol Tanaka ME',
    [CAMPOS_PARCEIRO.STATUS_CONTRATO]: 'ATIVO',
    [CAMPOS_PARCEIRO.CATEGORIA]: '',
    [CAMPOS_PARCEIRO.CUPOM]: 'CAROL10'
  };

  test('grava na ordem do cabeçalho de destino', () => {
    expect(linhasDeParceirosParaGravar(cabecalho, [parceiro], {})).toEqual([
      ['CAROL', 'Carol Tanaka ME', 'ATIVO', '', 'CAROL10', '']
    ]);
  });

  // Reimportar o cadastro não pode apagar a credencial de quem já tem senha.
  test('preserva Senha_Hash existente, casando pela chave primária', () => {
    const [linhaGravada] = linhasDeParceirosParaGravar(cabecalho, [parceiro], { CAROL: 'sal$hash' });

    expect(linhaGravada[5]).toBe('sal$hash');
  });

  test('a V1 nunca é fonte de senha', () => {
    const comSenha = Object.assign({}, parceiro, { [CAMPOS_PARCEIRO.SENHA_HASH]: 'veio-da-v1' });

    expect(linhasDeParceirosParaGravar(cabecalho, [comSenha], {})[0][5]).toBe('');
  });

  test('coluna extra desconhecida no destino sai vazia, não desalinha', () => {
    const comExtra = cabecalho.concat('Observacoes');

    expect(linhasDeParceirosParaGravar(comExtra, [parceiro], {})[0]).toHaveLength(7);
    expect(linhasDeParceirosParaGravar(comExtra, [parceiro], {})[0][6]).toBe('');
  });
});

describe('garantirCabecalhoDeParceiros', () => {
  test('acrescenta ao final as colunas que faltam', () => {
    const { cabecalho, acrescentadas } = garantirCabecalhoDeParceiros(['ID_Influenciadora', 'Nome']);

    expect(acrescentadas).toEqual(['Status_Contrato', 'Categoria', 'Cupom', 'Senha_Hash']);
    expect(cabecalho.slice(0, 2)).toEqual(['ID_Influenciadora', 'Nome']);
  });

  test('não reordena, não renomeia e não apaga coluna desconhecida', () => {
    const atual = ['Observacoes', 'Nome', 'ID_Influenciadora', 'Status_Contrato', 'Categoria', 'Cupom', 'Senha_Hash'];
    const { cabecalho, acrescentadas } = garantirCabecalhoDeParceiros(atual);

    expect(cabecalho).toEqual(atual);
    expect(acrescentadas).toEqual([]);
  });
});
