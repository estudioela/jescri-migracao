const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
    'src/modulos/Arquivamento.js',
  ]);
}

function novaColaboracao(gas, parceiraId, estado, ano, mes) {
  const colaboracao = new gas.ColaboracaoMensal(
    parceiraId,
    new gas.MesReferencia(ano || 2026, mes || 7),
    new gas.CondicaoComercialSnapshot({
      valorMensal: 1000,
      formatosContratados: ['Reels'],
      quantidadePorFormato: { Reels: 1 },
    })
  );
  if (estado === 'Concluída' || estado === 'Arquivada') colaboracao.concluir();
  if (estado === 'Arquivada') colaboracao.arquivar();
  return colaboracao;
}

function fakeColaboracaoMensalRepository(porMes) {
  const arquivadas = [];
  return {
    arquivadas,
    listarPor: (mesReferencia) => (porMes[mesReferencia.toString()] || []).slice(),
    listarTodas: () =>
      Object.keys(porMes).reduce((acc, chave) => acc.concat(porMes[chave]), []),
    arquivarCompetencia(mesReferencia) {
      arquivadas.push(mesReferencia.toString());
    },
  };
}

function fakePublicador() {
  const eventos = [];
  return { eventos, publicar: (evento) => eventos.push(evento) };
}

function montar({ colaboracoesPorMes, entregas, envios, obrigacoes } = {}) {
  const gas = carregar();
  const colaboracaoMensalRepository = fakeColaboracaoMensalRepository(colaboracoesPorMes || {});
  const publicador = fakePublicador();
  const service = new gas.ArquivamentoService(
    { listarEntregas: (texto) => (entregas && entregas[texto]) || [] },
    { listarEnvios: (texto) => (envios && envios[texto]) || [] },
    { listarPagamentos: (texto) => (obrigacoes && obrigacoes[texto]) || [] },
    colaboracaoMensalRepository,
    publicador
  );
  return { gas, service, colaboracaoMensalRepository, publicador };
}

describe('ArquivamentoService.selarCompetencia — RN-07 (elegibilidade, resolve D-01)', () => {
  test('todos os itens terminais → sela, persiste e publica CompetenciaArquivada', () => {
    const gas = carregar();
    const colaboracao = novaColaboracao(gas, 'maria', 'Ativa');
    const { service, colaboracaoMensalRepository, publicador } = montar({
      colaboracoesPorMes: { '2026-07': [colaboracao] },
      entregas: { '2026-07': [{ estado: 'Publicado' }] },
      envios: { '2026-07': [{ jornada: 'Entregue' }] },
      obrigacoes: { '2026-07': [{ estado: 'Pago' }] },
    });

    const resultado = service.selarCompetencia('2026-07');

    expect(resultado).toEqual({ mesReferencia: '2026-07', jaSelada: false });
    expect(colaboracao.estado).toBe('Arquivada');
    expect(colaboracaoMensalRepository.arquivadas).toEqual(['2026-07']);
    expect(publicador.eventos).toEqual([
      { nome: 'CompetenciaArquivada', mesReferencia: '2026-07' },
    ]);
  });

  test('ausência de itens de um módulo não bloqueia (vacuamente satisfeita, CB-03)', () => {
    const gas = carregar();
    const colaboracao = novaColaboracao(gas, 'maria', 'Ativa');
    const { service } = montar({
      colaboracoesPorMes: { '2026-07': [colaboracao] },
      obrigacoes: { '2026-07': [{ estado: 'Pago' }] },
    });

    const resultado = service.selarCompetencia('2026-07');

    expect(resultado.jaSelada).toBe(false);
    expect(colaboracao.estado).toBe('Arquivada');
  });

  test('Entrega não Publicado → recusa AR-02, nada persistido nem publicado', () => {
    const gas = carregar();
    const colaboracao = novaColaboracao(gas, 'maria', 'Ativa');
    const { service, colaboracaoMensalRepository, publicador } = montar({
      colaboracoesPorMes: { '2026-07': [colaboracao] },
      entregas: { '2026-07': [{ estado: 'EmRevisao' }] },
    });

    expect(() => service.selarCompetencia('2026-07')).toThrow(/AR-02/);
    expect(colaboracao.estado).toBe('Ativa');
    expect(colaboracaoMensalRepository.arquivadas).toEqual([]);
    expect(publicador.eventos).toEqual([]);
  });

  test('Envio não Entregue → recusa AR-02', () => {
    const gas = carregar();
    const colaboracao = novaColaboracao(gas, 'maria', 'Ativa');
    const { service } = montar({
      colaboracoesPorMes: { '2026-07': [colaboracao] },
      envios: { '2026-07': [{ jornada: 'AguardandoConfirmacao' }] },
    });

    expect(() => service.selarCompetencia('2026-07')).toThrow(/AR-02/);
  });

  test('Obrigação Mensal não Paga → recusa AR-02', () => {
    const gas = carregar();
    const colaboracao = novaColaboracao(gas, 'maria', 'Ativa');
    const { service } = montar({
      colaboracoesPorMes: { '2026-07': [colaboracao] },
      obrigacoes: { '2026-07': [{ estado: 'Aprovado' }] },
    });

    expect(() => service.selarCompetencia('2026-07')).toThrow(/AR-02/);
  });

  test('competência já arquivada é idempotente (no-op, sem publicar de novo)', () => {
    const gas = carregar();
    const colaboracao = novaColaboracao(gas, 'maria', 'Arquivada');
    const { service, colaboracaoMensalRepository, publicador } = montar({
      colaboracoesPorMes: { '2026-07': [colaboracao] },
    });

    const resultado = service.selarCompetencia('2026-07');

    expect(resultado).toEqual({ mesReferencia: '2026-07', jaSelada: true });
    expect(colaboracaoMensalRepository.arquivadas).toEqual([]);
    expect(publicador.eventos).toEqual([]);
  });

  test('competência nunca compilada (sem colaborações) → recusa AR-02', () => {
    const { service } = montar({ colaboracoesPorMes: {} });

    expect(() => service.selarCompetencia('2026-07')).toThrow(/AR-02/);
  });
});

describe('ArquivamentoService.arquivarLote — UC-034.01 (arquivamento manual geral)', () => {
  test('sela as competências elegíveis e reporta as com pendência, sem lançar', () => {
    const gas = carregar();
    const julho = novaColaboracao(gas, 'maria', 'Ativa', 2026, 7);
    const agosto = novaColaboracao(gas, 'maria', 'Ativa', 2026, 8);
    const jaArquivada = novaColaboracao(gas, 'ana', 'Arquivada', 2026, 6);
    const { service, colaboracaoMensalRepository, publicador } = montar({
      colaboracoesPorMes: {
        '2026-07': [julho],
        '2026-08': [agosto],
        '2026-06': [jaArquivada],
      },
      entregas: {
        '2026-07': [{ estado: 'Publicado' }],
        '2026-08': [{ estado: 'EmRevisao' }],
      },
    });

    const resultado = service.arquivarLote();

    expect(resultado.resultados).toEqual([
      { mesReferencia: '2026-07', selada: true },
      { mesReferencia: '2026-08', selada: false, motivo: expect.stringMatching(/AR-02/) },
    ]);
    expect(julho.estado).toBe('Arquivada');
    expect(agosto.estado).toBe('Ativa');
    expect(colaboracaoMensalRepository.arquivadas).toEqual(['2026-07']);
    expect(publicador.eventos).toHaveLength(1);
  });

  test('nada para selar (tudo já arquivado) → no-op (CB-03)', () => {
    const gas = carregar();
    const jaArquivada = novaColaboracao(gas, 'ana', 'Arquivada', 2026, 6);
    const { service } = montar({ colaboracoesPorMes: { '2026-06': [jaArquivada] } });

    const resultado = service.arquivarLote();

    expect(resultado.resultados).toEqual([]);
  });

  test('nenhuma colaboração em lugar nenhum → no-op (CB-03)', () => {
    const { service } = montar({ colaboracoesPorMes: {} });

    expect(service.arquivarLote()).toEqual({ resultados: [] });
  });
});
