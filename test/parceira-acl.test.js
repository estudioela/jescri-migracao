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
  const gas = loadGas([, 'src/modulos/Parceira.js']);
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

describe('ParceiraACL — obterContatoDeEnvio (SPEC-016 UC-016.01, D-03)', () => {
  const CABECALHO = ['INFLU_KEY', 'STATUS', 'INFLUENCIADORA_ENDERECO', 'CHAVE_PIX'];

  function comLinhas(linhas) {
    const sheet = fakeSheet(CABECALHO);
    linhas.forEach((l) => sheet.appendRow(l));
    return novaAcl(sheet).acl;
  }

  test('devolve somente endereço e PIX da Parceira — projeção mínima, sem a linha completa', () => {
    const acl = comLinhas([['Maria', 'ON', 'Rua das Flores, 123', 'pix@maria']]);

    const contato = acl.obterContatoDeEnvio('Maria');

    expect(contato).toEqual({ endereco: 'Rua das Flores, 123', pix: 'pix@maria' });
    expect(Object.keys(contato).sort()).toEqual(['endereco', 'pix']);
  });

  test('Parceira inexistente devolve null', () => {
    const acl = comLinhas([['Maria', 'ON', 'Rua das Flores, 123', 'pix@maria']]);

    expect(acl.obterContatoDeEnvio('Ana')).toBeNull();
  });

  test('coluna ausente falha barulhento (mesma disciplina das demais leituras)', () => {
    const acl = novaAcl(fakeSheet(['INFLU_KEY', 'STATUS'])).acl;

    expect(() => acl.obterContatoDeEnvio('Maria')).toThrow(/ausente/i);
  });
});

describe('ParceiraACL — obterParaDocumentos (SPEC-023 §14.1)', () => {
  const CABECALHO = [
    'INFLU_KEY',
    'STATUS',
    'INFLUENCIADORA_RAZAO_SOCIAL',
    'INFLUENCIADORA_CNPJ',
    'INFLUENCIADORA_ENDERECO',
    'VALOR_TOTAL',
    'VALOR_TOTAL_EXTENSO',
    'REELS_TEXTO',
    'CARROSSEL_TEXTO',
    'STORIES_TEXTO',
    'LOOKS_QTD_TEXTO',
    'CANAIS_USO_IMAGEM',
    'PRAZO_USO_IMAGEM',
    'CIDADE_ASSINATURA',
    'DATA_ASSINATURA',
    'SIM/NÃO',
  ];

  function linhaMaria(sobrescritas) {
    const base = {
      INFLU_KEY: 'Maria',
      STATUS: 'ON',
      INFLUENCIADORA_RAZAO_SOCIAL: 'Maria Conteúdo LTDA',
      INFLUENCIADORA_CNPJ: '12.345.678/0001-99',
      INFLUENCIADORA_ENDERECO: 'Rua das Flores, 123 — São Paulo/SP',
      VALOR_TOTAL: 3500,
      VALOR_TOTAL_EXTENSO: 'três mil e quinhentos reais',
      REELS_TEXTO: '2 reels',
      CARROSSEL_TEXTO: '',
      STORIES_TEXTO: '4 stories',
      LOOKS_QTD_TEXTO: '',
      CANAIS_USO_IMAGEM: 'Instagram e site da marca',
      PRAZO_USO_IMAGEM: '12 meses',
      CIDADE_ASSINATURA: 'São Paulo',
      DATA_ASSINATURA: '2026-07-16',
      'SIM/NÃO': 'SIM',
    };
    Object.assign(base, sobrescritas || {});
    return CABECALHO.map((coluna) => base[coluna]);
  }

  function comLinha(sobrescritas) {
    const sheet = fakeSheet(CABECALHO);
    sheet.appendRow(linhaMaria(sobrescritas));
    return novaAcl(sheet).acl;
  }

  test('projeta estado, sinalização e os campos de mesclagem por cabeçalho', () => {
    const dados = comLinha().obterParaDocumentos('Maria');

    expect(dados.estado).toBe('Ativa');
    expect(dados.sinalizada).toBe(true);
    expect(dados.campos.razaoSocial).toBe('Maria Conteúdo LTDA');
    expect(dados.campos.cnpj).toBe('12.345.678/0001-99');
    expect(dados.campos.valorNumero).toBe(3500);
    expect(dados.campos.valorExtenso).toBe('três mil e quinhentos reais');
    expect(dados.campos.quantidades).toEqual({
      Reels: '2 reels',
      Stories: '4 stories',
    });
    expect(dados.campos.cidadeAssinatura).toBe('São Paulo');
  });

  test('Parceira inexistente devolve null (DC-01 é decidido no service)', () => {
    expect(comLinha().obterParaDocumentos('Ana')).toBeNull();
  });

  test("sinalização: 'NÃO' e vazio → false; valor desconhecido falha barulhento", () => {
    expect(comLinha({ 'SIM/NÃO': 'NÃO' }).obterParaDocumentos('Maria').sinalizada).toBe(
      false
    );
    expect(comLinha({ 'SIM/NÃO': '' }).obterParaDocumentos('Maria').sinalizada).toBe(
      false
    );
    expect(() => comLinha({ 'SIM/NÃO': 'talvez' }).obterParaDocumentos('Maria')).toThrow(
      /talvez/
    );
  });
});
