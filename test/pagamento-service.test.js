const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Financeiro.js',
  ]);
}

function fakeCadastro(ativas, contatos) {
  return {
    listarAtivasComCondicoes: () => ativas || [],
    obterContatoDeEnvio: (id) => (contatos && contatos[id]) || { pix: 'chave-pix-x' },
  };
}

function fakeEntregaRepository(porParceira) {
  return {
    listarPor: (mesReferencia, parceiraId) => (porParceira && porParceira[parceiraId]) || [],
  };
}

function fakePagamentoRepository() {
  const salvos = [];
  const materializados = [];
  let existe = false;
  return {
    salvos,
    materializados,
    existeParaCompetencia: () => existe,
    materializarCompetencia(mesReferencia, obrigacoes) {
      existe = true;
      materializados.push(...obrigacoes);
      return obrigacoes;
    },
    salvar(obrigacao) {
      salvos.push(obrigacao);
      return obrigacao;
    },
    obterPor(id) {
      return salvos.find((o) => o.id === id) || materializados.find((o) => o.id === id) || null;
    },
    listarPorParceira(parceiraId) {
      return salvos
        .concat(materializados)
        .filter((o) => o.parceiraId === parceiraId);
    },
  };
}

function fakePublicador() {
  const eventos = [];
  return { eventos, publicar: (e) => eventos.push(e) };
}

function fakeGeradorDeId(sequencia) {
  let i = 0;
  return { gerar: () => sequencia[i++] || 'id-' + i };
}

function fakeRelogio(data) {
  return { hoje: () => data };
}

function montar({ cadastro, entregas, ids, relogio } = {}) {
  const gas = carregar();
  const pagamentoRepository = fakePagamentoRepository();
  const publicador = fakePublicador();
  const service = new gas.PagamentoService(
    cadastro || fakeCadastro([]),
    fakeEntregaRepository(entregas),
    pagamentoRepository,
    fakeGeradorDeId(ids || []),
    publicador,
    relogio || fakeRelogio(new Date('2026-07-20'))
  );
  return { gas, service, pagamentoRepository, publicador };
}

describe('PagamentoService — UC-020.01 lançamento mensal (RN-01, idempotência F1/F2)', () => {
  test('materializa uma Obrigação Mensal EmAberto por Parceira Ativa', () => {
    const { service, pagamentoRepository } = montar({
      cadastro: fakeCadastro([
        { parceiraId: 'Maria', condicoes: { valorMensal: 3500 } },
      ]),
      ids: ['m1'],
    });

    const obrigacoes = service.materializarParaCompetencia('2026-07');

    expect(obrigacoes).toHaveLength(1);
    expect(obrigacoes[0].estado).toBe('EmAberto');
    expect(obrigacoes[0].valor).toBe(3500);
    expect(pagamentoRepository.materializados).toHaveLength(1);
  });

  test('segunda chamada na mesma competência é no-op (idempotente)', () => {
    const { service } = montar({
      cadastro: fakeCadastro([{ parceiraId: 'Maria', condicoes: { valorMensal: 3500 } }]),
      ids: ['m1'],
    });
    service.materializarParaCompetencia('2026-07');

    const segunda = service.materializarParaCompetencia('2026-07');

    expect(segunda).toEqual([]);
  });
});

describe('PagamentoService — UC-020.03 liberar (Q-04, opção B — gate por conteúdo Aprovado)', () => {
  test('Mensal com toda Entrega Aprovada/Publicada → libera, publica PagamentoLiberado', () => {
    const { service, pagamentoRepository, publicador } = montar({
      cadastro: fakeCadastro([{ parceiraId: 'Maria', condicoes: { valorMensal: 3500 } }]),
      entregas: { Maria: [{ rotulo: 'Reels', estado: 'Aprovado' }, { rotulo: 'Stories', estado: 'Publicado' }] },
      ids: ['m1'],
    });
    service.materializarParaCompetencia('2026-07');

    const { obrigacao, mensagem } = service.liberar({ id: 'm1' });

    expect(obrigacao.estado).toBe('Aprovado');
    expect(mensagem).toMatch(/chave-pix-x/);
    expect(pagamentoRepository.salvos).toHaveLength(1);
    expect(publicador.eventos[0]).toEqual({
      nome: 'PagamentoLiberado',
      obrigacaoId: 'm1',
      parceiraId: 'Maria',
      mesReferencia: '2026-07',
    });
  });

  test('Mensal com Entrega ainda EmRevisao → recusa PG-05, nada persistido', () => {
    const { service, pagamentoRepository, publicador } = montar({
      cadastro: fakeCadastro([{ parceiraId: 'Maria', condicoes: { valorMensal: 3500 } }]),
      entregas: { Maria: [{ rotulo: 'Reels', estado: 'EmRevisao' }] },
      ids: ['m1'],
    });
    service.materializarParaCompetencia('2026-07');

    expect(() => service.liberar({ id: 'm1' })).toThrow(/PG-05/);
    expect(pagamentoRepository.salvos).toHaveLength(0);
    expect(publicador.eventos).toHaveLength(0);
  });

  test('Avulso não passa pelo gate de conteúdo (liberação manual)', () => {
    const { service, pagamentoRepository } = montar({ ids: ['a1'] });
    service.lancarAvulso({ parceiraId: 'Ana', valor: 500 });

    const { obrigacao } = service.liberar({ id: 'a1' });

    expect(obrigacao.estado).toBe('Aprovado');
    expect(pagamentoRepository.salvos.at(-1).id).toBe('a1');
  });

  test('Obrigação inexistente → PG-01', () => {
    const { service } = montar();
    expect(() => service.liberar({ id: 'fantasma' })).toThrow(/PG-01/);
  });
});

describe('PagamentoService — UC-020.03 pagar (RN-03, arquiva)', () => {
  test('Aprovado → Pago, arquiva com a data do relógio e publica PagamentoConfirmado', () => {
    const { service, publicador } = montar({ ids: ['a1'], relogio: fakeRelogio(new Date('2026-07-25')) });
    service.lancarAvulso({ parceiraId: 'Ana', valor: 500 });
    service.liberar({ id: 'a1' });

    const obrigacao = service.pagar({ id: 'a1' });

    expect(obrigacao.estado).toBe('Pago');
    expect(obrigacao.dataArquivamento).toEqual(new Date('2026-07-25'));
    expect(publicador.eventos.at(-1)).toEqual({
      nome: 'PagamentoConfirmado',
      obrigacaoId: 'a1',
      dataArquivamento: new Date('2026-07-25'),
    });
  });
});

describe('PagamentoService.listarPorParceira (SPEC-030 RN-04: períodos com atividade)', () => {
  test('delega ao PagamentoRepository, todas as competências e Avulsos da Parceira', () => {
    const { service } = montar({ ids: ['a1'] });
    service.lancarAvulso({ parceiraId: 'Ana', valor: 500 });

    const daAna = service.listarPorParceira('Ana');

    expect(daAna).toHaveLength(1);
    expect(daAna[0].parceiraId).toBe('Ana');
  });
});
