/**
 * Teste de CARACTERIZAÇÃO de arquivarGenerico() (mae/Código.js).
 *
 * Não corrige nada. Fotografa o comportamento atual, para que a extração do
 * ArquivamentoService (Onda 1) e a introdução do LockService (INT-08, Onda 4)
 * possam ser feitas com rede de segurança.
 *
 * Por que esta função primeiro (docs/auditoria/06_inteligencia_operacional.md
 * INT-08, §5.5): é `[Core]`, tem QUATRO chamadores — onEdit bloco ATIVAÇÕES,
 * onEdit bloco PAGAMENTOS, menuArquivarTudo() e arquivarFluxo() via
 * atualizarRastreiosBRComerce() —, atravessa TRÊS bounded contexts, já teve um
 * bug de cópia posicional em produção (CLAUDE.md §3) e não tinha um único
 * teste. É o maior risco isolado do repositório.
 *
 * Dois comportamentos abaixo são deliberados e estão travados aqui de propósito,
 * para que ninguém os "conserte" por engano numa refatoração:
 *
 *   1. Arquiva TODAS as linhas elegíveis, não só a que disparou o evento (RN-20).
 *   2. appendRow(destino) acontece ANTES de deleteRow(origem): sob falha no
 *      meio, o pior caso é DUPLICAÇÃO no histórico, nunca PERDA de dado.
 *      Inverter a ordem trocaria duplicata por perda — proibido (CLAUDE.md §12.4.6).
 */
const path = require('path');
const { loadGasModule } = require('./helpers/loadGasModule');
const {
  criarAbaFake,
  criarSpreadsheetAppFake,
  criarUtilitiesFake
} = require('./helpers/gasServiceMocks');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

function carregar(abasPorNome) {
  const spreadsheetApp = criarSpreadsheetAppFake(abasPorNome);
  const toasts = [];
  spreadsheetApp._ss.toast = (msg) => toasts.push(msg);

  const sandbox = loadGasModule(CODIGO_PATH, {
    SpreadsheetApp: spreadsheetApp,
    Utilities: criarUtilitiesFake(),
    Logger: { log() {} }
  });
  return { sandbox, toasts };
}

// Par real de produção: ATIVAÇÕES tem LINK_ARQUIVO na coluna 7; HISTÓRICO DE
// CONTEÚDOS tem DATA_ARQUIVAMENTO na coluna 7. A cópia posicional antiga gravava
// o link na coluna do carimbo. (CLAUDE.md §3, correção de 2026-07-08.)
const CABECALHO_ATIVACOES = ['ID', 'INFLU_KEY', 'MES_REFERENCIA', 'FORMATO', 'STATUS_CONTEUDO', 'DATA_ATIVACAO', 'LINK_ARQUIVO'];
const CABECALHO_HIST_CONT = ['ID', 'INFLU_KEY', 'MES_REFERENCIA', 'FORMATO', 'STATUS_CONTEUDO', 'DATA_ATIVACAO', 'DATA_ARQUIVAMENTO', 'LINK_ARQUIVO'];

const linhaAtivacao = (id, status, link) =>
  [id, 'FULANA', 'AGOSTO', 'REEL', status, '', link];

describe('arquivarGenerico — cópia por NOME de cabeçalho (não posicional)', () => {
  test('LINK_ARQUIVO da origem cai em LINK_ARQUIVO do destino, não na coluna do carimbo', () => {
    const origem = criarAbaFake([CABECALHO_ATIVACOES, linhaAtivacao('uuid-1', 'postado', 'http://link/1')]);
    const destino = criarAbaFake([CABECALHO_HIST_CONT]);
    const { sandbox } = carregar({ 'ATIVAÇÕES': origem, 'HISTÓRICO DE CONTEÚDOS': destino });

    const movidos = sandbox.arquivarGenerico('ATIVAÇÕES', 'HISTÓRICO DE CONTEÚDOS', 'STATUS_CONTEUDO', ['postado'], true);

    expect(movidos).toBe(1);
    const arquivada = destino._linhas[1];
    expect(arquivada[CABECALHO_HIST_CONT.indexOf('LINK_ARQUIVO')]).toBe('http://link/1');
    expect(arquivada[CABECALHO_HIST_CONT.indexOf('DATA_ARQUIVAMENTO')]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(arquivada[CABECALHO_HIST_CONT.indexOf('ID')]).toBe('uuid-1');
  });

  test('coluna da origem sem correspondente no destino é descartada', () => {
    const origem = criarAbaFake([
      ['INFLU_KEY', 'STATUS_CONTEUDO', 'COLUNA_QUE_SO_EXISTE_NA_ORIGEM'],
      ['FULANA', 'postado', 'valor-perdido']
    ]);
    const destino = criarAbaFake([['INFLU_KEY', 'STATUS_CONTEUDO', 'DATA_ARQUIVAMENTO']]);
    const { sandbox } = carregar({ ORIG: origem, DEST: destino });

    sandbox.arquivarGenerico('ORIG', 'DEST', 'STATUS_CONTEUDO', ['postado'], true);

    expect(destino._linhas[1]).not.toContain('valor-perdido');
    expect(destino._linhas[1][0]).toBe('FULANA');
  });

  test('destino SEM cabeçalho cai no comportamento posicional antigo (carimbo no fim)', () => {
    const origem = criarAbaFake([['INFLU_KEY', 'STATUS_CONTEUDO'], ['FULANA', 'postado']]);
    const destino = criarAbaFake([]); // aba recém-criada, sem header
    const { sandbox } = carregar({ ORIG: origem, DEST: destino });

    sandbox.arquivarGenerico('ORIG', 'DEST', 'STATUS_CONTEUDO', ['postado'], true);

    expect(destino._linhas[0]).toEqual(['FULANA', 'postado', expect.stringMatching(/^\d{2}\//)]);
  });
});

describe('arquivarGenerico — seleção das linhas', () => {
  test('RN-20: arquiva TODAS as linhas elegíveis, não só uma', () => {
    const origem = criarAbaFake([
      CABECALHO_ATIVACOES,
      linhaAtivacao('uuid-1', 'postado', 'l1'),
      linhaAtivacao('uuid-2', 'em aberto', ''),
      linhaAtivacao('uuid-3', 'postado', 'l3'),
      linhaAtivacao('uuid-4', 'postado', 'l4')
    ]);
    const destino = criarAbaFake([CABECALHO_HIST_CONT]);
    const { sandbox } = carregar({ 'ATIVAÇÕES': origem, 'HISTÓRICO DE CONTEÚDOS': destino });

    const movidos = sandbox.arquivarGenerico('ATIVAÇÕES', 'HISTÓRICO DE CONTEÚDOS', 'STATUS_CONTEUDO', ['postado'], true);

    expect(movidos).toBe(3);
    expect(destino._linhas).toHaveLength(4); // header + 3
    // A varredura é de baixo para cima; a não-elegível sobrevive intacta.
    expect(origem._linhas).toHaveLength(2);
    expect(origem._linhas[1][0]).toBe('uuid-2');
  });

  test('match é por SUBSTRING e case-insensitive', () => {
    const origem = criarAbaFake([
      ['INFLU_KEY', 'STATUS_CONTEUDO'],
      ['A', 'POSTADO'],
      ['B', 'já postado ontem'],
      ['C', 'aprovado']
    ]);
    const destino = criarAbaFake([['INFLU_KEY', 'STATUS_CONTEUDO', 'DATA_ARQUIVAMENTO']]);
    const { sandbox } = carregar({ ORIG: origem, DEST: destino });

    expect(sandbox.arquivarGenerico('ORIG', 'DEST', 'STATUS_CONTEUDO', ['postado'], true)).toBe(2);
    expect(origem._linhas[1][0]).toBe('C');
  });

  test('qualquer valor da lista de gatilhos serve (FLUXO LOGÍSTICO usa vários)', () => {
    const origem = criarAbaFake([
      ['INFLU_KEY', 'STATUS_LOGISTICA'],
      ['A', 'entregue'],
      ['B', 'objeto entregue ao destinatário'],
      ['C', 'em trânsito']
    ]);
    const destino = criarAbaFake([['INFLU_KEY', 'STATUS_LOGISTICA', 'DATA_ARQUIVAMENTO']]);
    const { sandbox } = carregar({ ORIG: origem, DEST: destino });

    const movidos = sandbox.arquivarGenerico('ORIG', 'DEST', 'STATUS_LOGISTICA', ['entregue', 'entrega realizada'], true);

    expect(movidos).toBe(2);
  });
});

describe('arquivarGenerico — carimbo de DATA_PAGAMENTO (RN-28)', () => {
  const CAB_PAG = ['INFLU_KEY', 'STATUS_PAGAMENTO', 'DATA_PAGAMENTO'];
  const CAB_HIST = ['INFLU_KEY', 'STATUS_PAGAMENTO', 'DATA_PAGAMENTO', 'DATA_ARQUIVAMENTO'];

  test('DATA_PAGAMENTO vazia é carimbada no momento do arquivamento', () => {
    const origem = criarAbaFake([CAB_PAG, ['FULANA', 'pago', '']]);
    const destino = criarAbaFake([CAB_HIST]);
    const { sandbox } = carregar({ PAGAMENTOS: origem, HIST: destino });

    sandbox.arquivarGenerico('PAGAMENTOS', 'HIST', 'STATUS_PAGAMENTO', ['pago'], true);

    // Data de arquivamento != data do PIX — a função carimba o instante do arquivamento.
    expect(destino._linhas[1][2]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  test('DATA_PAGAMENTO já preenchida é preservada', () => {
    const origem = criarAbaFake([CAB_PAG, ['FULANA', 'pago', '01/08/2026']]);
    const destino = criarAbaFake([CAB_HIST]);
    const { sandbox } = carregar({ PAGAMENTOS: origem, HIST: destino });

    sandbox.arquivarGenerico('PAGAMENTOS', 'HIST', 'STATUS_PAGAMENTO', ['pago'], true);

    expect(destino._linhas[1][2]).toBe('01/08/2026');
  });
});

describe('arquivarGenerico — guardas e retorno', () => {
  test('aba de origem ou destino inexistente devolve 0 sem lançar', () => {
    const { sandbox } = carregar({ ORIG: criarAbaFake([['A', 'STATUS'], ['x', 'postado']]) });

    expect(sandbox.arquivarGenerico('ORIG', 'NAO_EXISTE', 'STATUS', ['postado'], true)).toBe(0);
    expect(sandbox.arquivarGenerico('NAO_EXISTE', 'ORIG', 'STATUS', ['postado'], true)).toBe(0);
  });

  test('origem só com cabeçalho devolve 0', () => {
    const { sandbox } = carregar({ ORIG: criarAbaFake([['A', 'STATUS']]), DEST: criarAbaFake([['A', 'STATUS']]) });

    expect(sandbox.arquivarGenerico('ORIG', 'DEST', 'STATUS', ['postado'], true)).toBe(0);
  });

  test('coluna de status ausente no cabeçalho da origem devolve 0 (não arquiva às cegas)', () => {
    const origem = criarAbaFake([['INFLU_KEY'], ['FULANA']]);
    const destino = criarAbaFake([['INFLU_KEY']]);
    const { sandbox } = carregar({ ORIG: origem, DEST: destino });

    expect(sandbox.arquivarGenerico('ORIG', 'DEST', 'STATUS_CONTEUDO', ['postado'], true)).toBe(0);
    expect(origem._linhas).toHaveLength(2);
  });

  test('silent=false emite toast; silent=true não', () => {
    const abas = () => ({
      ORIG: criarAbaFake([['A', 'STATUS'], ['x', 'postado']]),
      DEST: criarAbaFake([['A', 'STATUS', 'DATA_ARQUIVAMENTO']])
    });

    const comToast = carregar(abas());
    comToast.sandbox.arquivarGenerico('ORIG', 'DEST', 'STATUS', ['postado'], false);
    expect(comToast.toasts).toHaveLength(1);

    const semToast = carregar(abas());
    semToast.sandbox.arquivarGenerico('ORIG', 'DEST', 'STATUS', ['postado'], true);
    expect(semToast.toasts).toHaveLength(0);
  });
});

describe('arquivarGenerico — ordem append-antes-de-delete (fail-safe deliberado)', () => {
  test('falha no deleteRow deixa a linha DUPLICADA, nunca PERDIDA', () => {
    const origem = criarAbaFake([['INFLU_KEY', 'STATUS'], ['FULANA', 'postado']]);
    const destino = criarAbaFake([['INFLU_KEY', 'STATUS', 'DATA_ARQUIVAMENTO']]);
    origem.deleteRow = () => { throw new Error('falha simulada de API no meio do arquivamento'); };

    const { sandbox } = carregar({ ORIG: origem, DEST: destino });

    expect(() => sandbox.arquivarGenerico('ORIG', 'DEST', 'STATUS', ['postado'], true)).toThrow();

    // O dado sobreviveu nos dois lados. Inverter a ordem (delete antes de append)
    // trocaria esta duplicata por perda irreversível — por isso a ordem é lei.
    expect(destino._linhas).toHaveLength(2);
    expect(origem._linhas).toHaveLength(2);
  });
});
