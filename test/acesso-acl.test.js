const { loadGas } = require('./helpers/gasHarness');

// Fakes das abas físicas (padrão DocumentoACL): leitura completa +
// reescrita da aba num único setValues.
function fakeAba(cabecalho) {
  let rows = [cabecalho.slice()];
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    clearContents() {
      rows = [];
    },
    getRange(linha, _coluna, numLinhas, numColunas) {
      return {
        setValues(valores) {
          if (valores.length !== numLinhas || valores[0].length !== numColunas) {
            throw new Error('fake: range incompatível.');
          }
          valores.forEach((v, i) => {
            rows[linha - 1 + i] = v.slice();
          });
        },
      };
    },
  };
}

describe('SessaoACL — aba SESSOES (SPEC-025 §14, ADR-001)', () => {
  const CABECALHO = ['TOKEN', 'PARCEIRA_ID', 'EXPIRA_EM'];

  function carregar(aba) {
    const gas = loadGas(['src/modulos/Autenticacao.js']);
    return { gas, acl: new gas.SessaoACL(aba) };
  }

  test('upsert insere sessão nova e substitui a linha do mesmo token', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);
    const v1 = new Date('2026-07-16T10:00:00.000Z');
    const v2 = new Date('2026-07-16T16:00:00.000Z');

    acl.upsert({ token: 'tok-1', parceiraId: 'Maria', expiraEm: v1 });
    acl.upsert({ token: 'tok-2', parceiraId: 'Ana', expiraEm: v1 });
    acl.upsert({ token: 'tok-1', parceiraId: 'Maria', expiraEm: v2 });

    const linhas = aba._rows.slice(1);
    expect(linhas).toHaveLength(2);
    const linhaTok1 = linhas.find((l) => l[0] === 'tok-1');
    // Data persistida em ISO-8601 (comparação por texto: realms distintos).
    expect(linhaTok1[2]).toBe(v2.toISOString());
  });

  test('obterPorToken reidrata com EXPIRA_EM como Date (valor do Sheets)', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);
    const expira = new Date('2026-07-16T18:30:00.000Z');
    aba.getRange(2, 1, 1, 3).setValues([['tok-1', 'Maria', expira]]);

    const sessao = acl.obterPorToken('tok-1');

    expect(sessao.parceiraId).toBe('Maria');
    expect(sessao.expiraEm.getTime()).toBe(expira.getTime());
  });

  test('obterPorToken reidrata com EXPIRA_EM como texto ISO', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);
    aba.getRange(2, 1, 1, 3).setValues([['tok-1', 'Maria', '2026-07-16T18:30:00.000Z']]);

    const sessao = acl.obterPorToken('tok-1');

    expect(sessao.token).toBe('tok-1');
    expect(sessao.expiraEm.toISOString()).toBe('2026-07-16T18:30:00.000Z');
  });

  test('obterPorToken devolve null quando o token não existe', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);

    expect(acl.obterPorToken('tok-inexistente')).toBeNull();
  });

  test('remover apaga a linha do token e preserva as demais', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);
    acl.upsert({ token: 'tok-1', parceiraId: 'Maria', expiraEm: new Date() });
    acl.upsert({ token: 'tok-2', parceiraId: 'Ana', expiraEm: new Date() });

    acl.remover('tok-1');

    const linhas = aba._rows.slice(1);
    expect(linhas).toHaveLength(1);
    expect(linhas[0][0]).toBe('tok-2');
  });

  test('coluna ausente falha barulhento (fail-fast, ADR-001)', () => {
    const aba = fakeAba(['TOKEN', 'PARCEIRA_ID']); // sem EXPIRA_EM
    const { acl } = carregar(aba);

    expect(() =>
      acl.upsert({ token: 'tok-1', parceiraId: 'Maria', expiraEm: new Date() })
    ).toThrow(/EXPIRA_EM/);
  });

  test('EXPIRA_EM inválida falha barulhento (fail-fast, ADR-001)', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);
    aba.getRange(2, 1, 1, 3).setValues([['tok-1', 'Maria', 'não-é-data']]);

    expect(() => acl.obterPorToken('tok-1')).toThrow(/EXPIRA_EM/);
  });
});

describe('BloqueioACL — aba BLOQUEIOS (SPEC-025 RN-02, ADR-001)', () => {
  const CABECALHO = ['IDENTIFICADOR', 'TENTATIVAS', 'BLOQUEIO_INICIO'];

  function carregar(aba) {
    const gas = loadGas(['src/modulos/Arquivamento.js']);
    return { gas, acl: new gas.BloqueioACL(aba) };
  }

  test('obter devolve null quando o identificador não tem registro', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);

    expect(acl.obter('cupom-x')).toBeNull();
  });

  test('salvar insere e depois substitui o registro do identificador (upsert)', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);
    const inicio = new Date('2026-07-16T12:00:00.000Z');

    acl.salvar('cupom-x', 2, null);
    acl.salvar('cupom-x', 5, inicio);

    const linhas = aba._rows.slice(1);
    expect(linhas).toHaveLength(1);
    expect(linhas[0][1]).toBe(5);
    expect(linhas[0][2]).toBe(inicio.toISOString());

    const registro = acl.obter('cupom-x');
    expect(registro.tentativas).toBe(5);
    expect(registro.inicio.getTime()).toBe(inicio.getTime());
  });

  test('BLOQUEIO_INICIO vazio reidrata inicio null (sem janela ativa)', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);
    acl.salvar('cupom-x', 3, null);

    const registro = acl.obter('cupom-x');

    expect(registro.tentativas).toBe(3);
    expect(registro.inicio).toBeNull();
  });

  test('remover apaga o registro do identificador', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);
    acl.salvar('cupom-x', 5, new Date());

    acl.remover('cupom-x');

    expect(acl.obter('cupom-x')).toBeNull();
    expect(aba._rows.slice(1)).toHaveLength(0);
  });

  test('TENTATIVAS inválida falha barulhento (fail-fast, ADR-001)', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);
    aba.getRange(2, 1, 1, 3).setValues([['cupom-x', 'muitas', '']]);

    expect(() => acl.obter('cupom-x')).toThrow(/TENTATIVAS/);
  });

  test('BLOQUEIO_INICIO inválido falha barulhento (fail-fast, ADR-001)', () => {
    const aba = fakeAba(CABECALHO);
    const { acl } = carregar(aba);
    aba.getRange(2, 1, 1, 3).setValues([['cupom-x', 5, 'ontem']]);

    expect(() => acl.obter('cupom-x')).toThrow(/BLOQUEIO_INICIO/);
  });

  test('coluna ausente falha barulhento (fail-fast, ADR-001)', () => {
    const aba = fakeAba(['IDENTIFICADOR', 'TENTATIVAS']); // sem BLOQUEIO_INICIO
    const { acl } = carregar(aba);

    expect(() => acl.salvar('cupom-x', 1, null)).toThrow(/BLOQUEIO_INICIO/);
  });
});

describe('ParceiraACL.obterAcessoLegado — porta do Acesso (SPEC-025 §14.1, RN-16)', () => {
  function fakeBase(linhas) {
    const rows = [['CUPOM', 'INFLU_KEY', 'INFLUENCIADORA_CNPJ']].concat(linhas);
    return { getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }) };
  }

  function carregar(aba) {
    const gas = loadGas(['src/modulos/Parceira.js']);
    return new gas.ParceiraACL(aba);
  }

  test('localiza por CUPOM com trim + casefold (ADR-001 §2)', () => {
    const acl = carregar(fakeBase([['  CupomMaria ', 'Maria', '12.345.678/0001-90']]));

    const acesso = acl.obterAcessoLegado('  cupomMARIA  ');

    expect(acesso).toEqual({ parceiraId: 'Maria', cnpj: '12.345.678/0001-90' });
  });

  test('cupom inexistente devolve null (fail-closed)', () => {
    const acl = carregar(fakeBase([['CUPOMMARIA', 'Maria', '12.345.678/0001-90']]));

    expect(acl.obterAcessoLegado('CUPOMANA')).toBeNull();
  });

  test('identificador vazio ou só espaços devolve null (fail-closed)', () => {
    const acl = carregar(fakeBase([['CUPOMMARIA', 'Maria', '12.345.678/0001-90']]));

    expect(acl.obterAcessoLegado('')).toBeNull();
    expect(acl.obterAcessoLegado('   ')).toBeNull();
    expect(acl.obterAcessoLegado(null)).toBeNull();
  });
});
