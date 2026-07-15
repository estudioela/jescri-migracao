const { loadGas } = require('./helpers/gasHarness');

// Fake mínimo da API de Sheet exercida pela ACL (getDataRange/appendRow).
// Mantém a ACL como único ponto que fala com a planilha, sem depender de
// SpreadsheetApp real no teste.
function fakeSheet(header) {
  const rows = [header.slice()];
  return {
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    appendRow: (arr) => rows.push(arr.slice()),
  };
}

function novaAcl(sheet) {
  const gas = loadGas(['src/domain/Parceira.js', 'src/acl/ParceiraACL.js']);
  return { gas, acl: new gas.ParceiraACL(sheet) };
}

describe('ParceiraACL — coerção de STATUS (ADR-001 §2.1)', () => {
  test('cru → canônico é case/espaço-insensível', () => {
    const { acl } = novaAcl(fakeSheet(['INFLU_KEY', 'STATUS']));

    expect(acl.statusParaCanonico('on')).toBe('Ativa');
    expect(acl.statusParaCanonico(' OFF ')).toBe('Inativa');
  });

  test('valor cru desconhecido falha barulhento (fail-fast)', () => {
    const { acl } = novaAcl(fakeSheet(['INFLU_KEY', 'STATUS']));

    expect(() => acl.statusParaCanonico('desligada')).toThrow();
  });

  test('canônico → cru persiste ON/OFF', () => {
    const { acl } = novaAcl(fakeSheet(['INFLU_KEY', 'STATUS']));

    expect(acl.statusParaCru('Ativa')).toBe('ON');
    expect(acl.statusParaCru('Inativa')).toBe('OFF');
  });
});

describe('ParceiraACL — inserir por cabeçalho', () => {
  test('escreve linha posicionada pelo cabeçalho, com STATUS cru', () => {
    const sheet = fakeSheet(['INFLU_KEY', 'STATUS']);
    const { gas, acl } = novaAcl(sheet);

    acl.inserir(new gas.Parceira('Maria')); // nasce Inativa → OFF

    const values = sheet.getDataRange().getValues();
    expect(values[values.length - 1]).toEqual(['Maria', 'OFF']);
  });

  test('resolve colunas pelo cabeçalho, nunca por índice fixo', () => {
    // Cabeçalho em ordem invertida: prova que o mapeamento é por nome.
    const sheet = fakeSheet(['STATUS', 'INFLU_KEY']);
    const { gas, acl } = novaAcl(sheet);

    acl.inserir(new gas.Parceira('Maria'));

    const values = sheet.getDataRange().getValues();
    expect(values[values.length - 1]).toEqual(['OFF', 'Maria']);
  });
});

describe('ParceiraACL — listarAtivasComCondicoes (SPEC-005 §14.1, Contrato §7.3)', () => {
  const CABECALHO = [
    'INFLU_KEY',
    'STATUS',
    'CHAVE_PIX',
    'VALOR_TOTAL',
    'REELS_TEXTO',
    'CARROSSEL_TEXTO',
    'STORIES_TEXTO',
    'LOOKS_QTD',
  ];

  function comLinhas(linhas) {
    const sheet = fakeSheet(CABECALHO);
    linhas.forEach((l) => sheet.appendRow(l));
    return novaAcl(sheet).acl;
  }

  test('devolve somente Parceiras ativas, com a projeção comercial curada', () => {
    const acl = comLinhas([
      ['Maria', 'ON', 'pix@maria', 3500, '2', '', '4', '3'],
      ['Ana', 'OFF', 'pix@ana', 1200, '1', '', '', ''],
      ['', '', '', '', '', '', '', ''],
    ]);

    const ativas = acl.listarAtivasComCondicoes();

    expect(ativas).toHaveLength(1);
    expect(ativas[0].parceiraId).toBe('Maria');
    expect(ativas[0].condicoes.valorMensal).toBe(3500);
    expect(ativas[0].condicoes.formatosContratados).toEqual([
      'Reels',
      'Stories',
      'Looks',
    ]);
    expect(ativas[0].condicoes.quantidadePorFormato).toEqual({
      Reels: 2,
      Stories: 4,
      Looks: 3,
    });
  });

  test('PII da BASE nunca entra nas condições (RN-10, Contrato §5)', () => {
    const acl = comLinhas([['Maria', 'ON', 'pix@maria', 3500, '2', '', '', '']]);

    const ativas = acl.listarAtivasComCondicoes();

    expect(Object.keys(ativas[0])).toEqual(['parceiraId', 'condicoes']);
    expect(Object.keys(ativas[0].condicoes).sort()).toEqual([
      'formatosContratados',
      'quantidadePorFormato',
      'valorMensal',
    ]);
  });

  test('entregável com quantidade zero ou vazia não é formato contratado', () => {
    const acl = comLinhas([['Maria', 'ON', '', 3500, '0', '', '', '']]);

    const ativas = acl.listarAtivasComCondicoes();

    expect(ativas[0].condicoes.formatosContratados).toEqual([]);
    expect(ativas[0].condicoes.quantidadePorFormato).toEqual({});
  });

  test("texto de entregável aceita prefixo numérico ('2 reels' → 2)", () => {
    const acl = comLinhas([['Maria', 'ON', '', 3500, '2 reels por mês', '', '', '']]);

    expect(acl.listarAtivasComCondicoes()[0].condicoes.quantidadePorFormato).toEqual({
      Reels: 2,
    });
  });

  test('VALOR_TOTAL não numérico falha barulhento identificando coluna e valor', () => {
    const acl = comLinhas([['Maria', 'ON', '', 'a combinar', '2', '', '', '']]);

    expect(() => acl.listarAtivasComCondicoes()).toThrow(/VALOR_TOTAL.*a combinar/);
  });

  test('entregável sem número à frente falha barulhento (fail-fast, ADR-001)', () => {
    const acl = comLinhas([['Maria', 'ON', '', 3500, 'dois', '', '', '']]);

    expect(() => acl.listarAtivasComCondicoes()).toThrow(/REELS_TEXTO.*dois/);
  });
});
