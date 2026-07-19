const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
  ]);
}

// Fake da porta da ACL de Colaboração Mensal: lote único de escrita e
// leitura completa. Mantém o Repository cego à planilha física.
function fakeAcl() {
  const registros = [];
  const chamadas = { lotes: 0, arquivamentos: [] };
  return {
    registros,
    chamadas,
    inserirEmLote(colaboracoes) {
      chamadas.lotes += 1;
      colaboracoes.forEach((c) => registros.push(c));
    },
    listarTodas() {
      return registros.slice();
    },
    arquivarCompetencia(mesReferencia) {
      chamadas.arquivamentos.push(mesReferencia);
    },
  };
}

function novaColaboracao(gas, parceiraId, ano, mes) {
  return new gas.ColaboracaoMensal(
    parceiraId,
    new gas.MesReferencia(ano, mes),
    new gas.CondicaoComercialSnapshot({
      valorMensal: 1000,
      formatosContratados: ['Reels'],
      quantidadePorFormato: { Reels: 1 },
    })
  );
}

describe('ColaboracaoMensalRepository — persistência atômica (RN-03)', () => {
  test('salvarTodas persiste a competência inteira num único lote da ACL', () => {
    const gas = carregar();
    const acl = fakeAcl();
    const repo = new gas.ColaboracaoMensalRepository(acl);
    const colaboracoes = [
      novaColaboracao(gas, 'maria', 2026, 7),
      novaColaboracao(gas, 'ana', 2026, 7),
    ];

    const salvas = repo.salvarTodas(colaboracoes);

    expect(acl.chamadas.lotes).toBe(1);
    expect(acl.registros).toHaveLength(2);
    expect(salvas).toBe(colaboracoes);
  });

  test('falha da ACL propaga e nada é persistido (CB-03: tudo ou nada)', () => {
    const gas = carregar();
    const acl = fakeAcl();
    acl.inserirEmLote = () => {
      throw new Error('falha física de escrita');
    };
    const repo = new gas.ColaboracaoMensalRepository(acl);

    expect(() => repo.salvarTodas([novaColaboracao(gas, 'maria', 2026, 7)])).toThrow(
      /falha física/
    );
    expect(acl.registros).toHaveLength(0);
  });
});

describe('ColaboracaoMensalRepository — existência por competência (base de RN-09/CB-01)', () => {
  test('competência inexistente responde false', () => {
    const gas = carregar();
    const repo = new gas.ColaboracaoMensalRepository(fakeAcl());

    expect(repo.existeCompetencia(new gas.MesReferencia(2026, 7))).toBe(false);
  });

  test('competência já compilada responde true; outra competência, false', () => {
    const gas = carregar();
    const acl = fakeAcl();
    const repo = new gas.ColaboracaoMensalRepository(acl);
    repo.salvarTodas([novaColaboracao(gas, 'maria', 2026, 7)]);

    expect(repo.existeCompetencia(new gas.MesReferencia(2026, 7))).toBe(true);
    expect(repo.existeCompetencia(new gas.MesReferencia(2026, 8))).toBe(false);
  });
});

describe('ColaboracaoMensalRepository — consulta (UC-005.03)', () => {
  function repoPopulado() {
    const gas = carregar();
    const repo = new gas.ColaboracaoMensalRepository(fakeAcl());
    repo.salvarTodas([
      novaColaboracao(gas, 'maria', 2026, 7),
      novaColaboracao(gas, 'ana', 2026, 7),
    ]);
    repo.salvarTodas([novaColaboracao(gas, 'maria', 2026, 8)]);
    return { gas, repo };
  }

  test('listarPor competência devolve somente as colaborações daquela MesReferencia', () => {
    const { gas, repo } = repoPopulado();

    const julho = repo.listarPor(new gas.MesReferencia(2026, 7));

    expect(julho).toHaveLength(2);
    expect(julho.map((c) => c.parceiraId).sort()).toEqual(['ana', 'maria']);
  });

  test('listarPor competência e parceira restringe às colaborações da parceira', () => {
    const { gas, repo } = repoPopulado();

    const deMaria = repo.listarPor(new gas.MesReferencia(2026, 7), 'maria');

    expect(deMaria).toHaveLength(1);
    expect(deMaria[0].parceiraId).toBe('maria');
    expect(deMaria[0].mesReferencia.toString()).toBe('2026-07');
  });

  test('competência sem colaborações devolve lista vazia', () => {
    const { gas, repo } = repoPopulado();

    expect(repo.listarPor(new gas.MesReferencia(2027, 1))).toEqual([]);
  });
});

describe('ColaboracaoMensalRepository — listarTodas (base do arquivamento em lote, SPEC-034)', () => {
  test('devolve todas as colaborações, de todas as competências', () => {
    const gas = carregar();
    const repo = new gas.ColaboracaoMensalRepository(fakeAcl());
    repo.salvarTodas([
      novaColaboracao(gas, 'maria', 2026, 7),
      novaColaboracao(gas, 'ana', 2026, 7),
    ]);
    repo.salvarTodas([novaColaboracao(gas, 'maria', 2026, 8)]);

    const todas = repo.listarTodas();

    expect(todas).toHaveLength(3);
  });

  test('sem nenhuma colaboração persistida devolve lista vazia', () => {
    const gas = carregar();
    const repo = new gas.ColaboracaoMensalRepository(fakeAcl());

    expect(repo.listarTodas()).toEqual([]);
  });
});

describe('ColaboracaoMensalRepository — arquivarCompetencia (selagem, SPEC-034 UC-034.02)', () => {
  test('delega à ACL a competência a ser selada', () => {
    const gas = carregar();
    const acl = fakeAcl();
    const repo = new gas.ColaboracaoMensalRepository(acl);
    const mesReferencia = new gas.MesReferencia(2026, 7);

    repo.arquivarCompetencia(mesReferencia);

    expect(acl.chamadas.arquivamentos).toEqual([mesReferencia]);
  });
});
