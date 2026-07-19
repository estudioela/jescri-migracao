const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Envio.js',
  ]);
}

function colaboracao(gas, parceiraId) {
  return { parceiraId, mesReferencia: new gas.MesReferencia(2026, 7) };
}

function fakeColaboracaoRepo(colaboracoes) {
  return {
    listarPor(mesReferencia) {
      return colaboracoes.filter((c) => c.mesReferencia.igualA(mesReferencia));
    },
  };
}

function fakeCadastro(contatosPorParceira) {
  return {
    obterContatoDeEnvio(parceiraId) {
      return (contatosPorParceira || {})[parceiraId] || null;
    },
  };
}

function fakeEnvioRepo() {
  const estado = { porChave: {}, recriacoes: [], salvos: [] };
  const chave = (mes, parceiraId) => parceiraId + '|' + mes.toString();
  return {
    estado,
    recriarCompetencia(mesReferencia, envios) {
      estado.recriacoes.push(envios);
      envios.forEach((e) => {
        estado.porChave[chave(mesReferencia, e.parceiraId)] = e;
      });
      return envios;
    },
    salvar(envio) {
      estado.salvos.push(envio);
      estado.porChave[chave(envio.mesReferencia, envio.parceiraId)] = envio;
      return envio;
    },
    obterPor(mesReferencia, parceiraId) {
      return estado.porChave[chave(mesReferencia, parceiraId)] || null;
    },
    listarPor(mesReferencia, parceiraId) {
      return Object.values(estado.porChave)
        .filter((e) => e.mesReferencia.igualA(mesReferencia))
        .filter((e) => parceiraId === undefined || e.parceiraId === parceiraId);
    },
    existeParaCompetencia(mesReferencia) {
      return this.listarPor(mesReferencia).length > 0;
    },
  };
}

function fakeAdaptadorDeRastreio(comportamento) {
  return { consultar: comportamento };
}

function fakePublicador() {
  const eventos = [];
  return { eventos, publicar: (evento) => eventos.push(evento) };
}

const HOJE = new Date(2026, 6, 30);
const comandoMaria = { mesReferencia: '2026-07', parceiraId: 'maria' };

function montar(gas, opcoes) {
  const envioRepo = fakeEnvioRepo();
  const publicador = fakePublicador();
  const service = new gas.EnvioService(
    fakeColaboracaoRepo((opcoes && opcoes.colaboracoes) || []),
    fakeCadastro(opcoes && opcoes.contatos),
    envioRepo,
    (opcoes && opcoes.adaptador) || fakeAdaptadorDeRastreio(() => ({ entregue: false })),
    publicador,
    { hoje: () => (opcoes && opcoes.hoje) || HOJE }
  );
  return { service, envioRepo, publicador };
}

describe('EnvioService — reação a MesCompilado (RN-01)', () => {
  test('materializa um Envio por Parceira Ativa (por Colaboração compilada)', () => {
    const gas = carregar();
    const { service, envioRepo } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria'), colaboracao(gas, 'ana')],
    });

    const materializados = service.materializarParaCompetencia('2026-07');

    expect(materializados).toHaveLength(2);
    expect(envioRepo.estado.recriacoes).toHaveLength(1);
    expect(materializados.every((e) => e.revisao === 'AguardandoConfirmacao')).toBe(true);
    expect(materializados.every((e) => e.jornada === 'Pendente')).toBe(true);
  });
});

describe('EnvioService — UC-016.01 confirmar endereço (D-03)', () => {
  test('confirma a Revisão, persiste e gera mensagem com endereço e PIX — sem persistir PII no Envio', () => {
    const gas = carregar();
    const { service, envioRepo } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria')],
      contatos: { maria: { endereco: 'Rua das Flores, 123', pix: 'pix@maria' } },
    });
    service.materializarParaCompetencia('2026-07');

    const resultado = service.confirmarEndereco(comandoMaria);

    expect(resultado.envio.revisao).toBe('Confirmado');
    expect(resultado.mensagem).toContain('Rua das Flores, 123');
    expect(resultado.mensagem).toContain('pix@maria');
    expect(envioRepo.estado.salvos).toHaveLength(1);
    expect(Object.keys(resultado.envio)).not.toContain('endereco');
    expect(Object.keys(resultado.envio)).not.toContain('pix');
  });

  test('LG-01: Envio inexistente é recusado fail-fast', () => {
    const gas = carregar();
    const { service } = montar(gas, {});

    expect(() => service.confirmarEndereco(comandoMaria)).toThrow(/LG-01/);
  });

  test('endereço ausente no cadastro falha barulhento e nada é persistido (mesma disciplina de RN-01/CB-03)', () => {
    const gas = carregar();
    const { service, envioRepo } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria')],
      contatos: {},
    });
    service.materializarParaCompetencia('2026-07');

    expect(() => service.confirmarEndereco(comandoMaria)).toThrow(/endere[cç]o/i);
    expect(envioRepo.estado.salvos).toHaveLength(0);
    expect(envioRepo.obterPor(new gas.MesReferencia(2026, 7), 'maria').revisao).toBe(
      'AguardandoConfirmacao'
    );
  });
});

describe('EnvioService — UC-016.02 registrar rastreio (RN-02)', () => {
  test('registra rastreio, preenche a data de envio pelo relógio injetado e emite ProdutoDespachado', () => {
    const gas = carregar();
    const { service, envioRepo, publicador } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria')],
    });
    service.materializarParaCompetencia('2026-07');

    const envio = service.registrarRastreio(Object.assign({ codigo: 'BR123' }, comandoMaria));

    expect(envio.jornada).toBe('Expedido');
    expect(envio.rastreio.toString()).toBe('BR123');
    expect(envio.dataEnvio).toBe(HOJE);
    expect(envioRepo.estado.salvos).toHaveLength(1);
    expect(publicador.eventos).toEqual([
      {
        nome: 'ProdutoDespachado',
        parceiraId: 'maria',
        mesReferencia: '2026-07',
        rastreio: 'BR123',
      },
    ]);
  });

  test('CB-02: re-registrar rastreio preserva a data de envio original', () => {
    const gas = carregar();
    const primeiraChamada = new Date(2026, 6, 16);
    const segundaChamada = new Date(2026, 6, 20);
    let hojeAtual = primeiraChamada;
    const envioRepo = fakeEnvioRepo();
    const service = new gas.EnvioService(
      fakeColaboracaoRepo([colaboracao(gas, 'maria')]),
      fakeCadastro({}),
      envioRepo,
      fakeAdaptadorDeRastreio(() => ({ entregue: false })),
      fakePublicador(),
      { hoje: () => hojeAtual }
    );
    service.materializarParaCompetencia('2026-07');
    service.registrarRastreio(Object.assign({ codigo: 'BR123' }, comandoMaria));

    hojeAtual = segundaChamada;
    const envio = service.registrarRastreio(Object.assign({ codigo: 'BR999' }, comandoMaria));

    expect(envio.rastreio.toString()).toBe('BR999');
    expect(envio.dataEnvio).toBe(primeiraChamada);
  });

  test('falha na persistência nunca publica evento', () => {
    const gas = carregar();
    const { service, envioRepo, publicador } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria')],
    });
    service.materializarParaCompetencia('2026-07');
    envioRepo.salvar = () => {
      throw new Error('falha física de escrita');
    };

    expect(() =>
      service.registrarRastreio(Object.assign({ codigo: 'BR123' }, comandoMaria))
    ).toThrow(/falha física/);
    expect(publicador.eventos).toHaveLength(0);
  });

  test('LG-01: Envio inexistente é recusado sem evento', () => {
    const gas = carregar();
    const { service, publicador } = montar(gas, {});

    expect(() =>
      service.registrarRastreio(Object.assign({ codigo: 'BR123' }, comandoMaria))
    ).toThrow(/LG-01/);
    expect(publicador.eventos).toHaveLength(0);
  });
});

describe('EnvioService — UC-016.03 atualizar status (RNF-01/CB-01)', () => {
  function comEnvioExpedido(gas, opcoes) {
    const contexto = montar(
      gas,
      Object.assign({ colaboracoes: [colaboracao(gas, 'maria')] }, opcoes)
    );
    contexto.service.materializarParaCompetencia('2026-07');
    contexto.service.registrarRastreio(Object.assign({ codigo: 'BR123' }, comandoMaria));
    return contexto;
  }

  test('entrega detectada leva a Entregue, arquiva com o relógio e emite ProdutoEntregue', () => {
    const gas = carregar();
    const { service, envioRepo, publicador } = comEnvioExpedido(gas, {
      adaptador: fakeAdaptadorDeRastreio(() => ({ entregue: true })),
    });

    const envio = service.atualizarStatus(comandoMaria);

    expect(envio.jornada).toBe('Entregue');
    expect(envio.dataArquivamento).toBe(HOJE);
    expect(envioRepo.estado.salvos).toHaveLength(2); // registrarRastreio + atualizarStatus
    expect(publicador.eventos.map((e) => e.nome)).toEqual(['ProdutoDespachado', 'ProdutoEntregue']);
  });

  test('CB-01: transportadora indisponível (falha do adaptador) não bloqueia — sem erro nem evento', () => {
    const gas = carregar();
    const { service, envioRepo, publicador } = comEnvioExpedido(gas, {
      adaptador: fakeAdaptadorDeRastreio(() => {
        throw new Error('transportadora fora do ar');
      }),
    });

    const envio = service.atualizarStatus(comandoMaria);

    expect(envio.jornada).toBe('Expedido');
    expect(envioRepo.estado.salvos).toHaveLength(1); // só o registrarRastreio
    expect(publicador.eventos.map((e) => e.nome)).toEqual(['ProdutoDespachado']);
  });

  test('consulta indica não entregue → nenhuma mudança, sem evento', () => {
    const gas = carregar();
    const { service, publicador } = comEnvioExpedido(gas, {
      adaptador: fakeAdaptadorDeRastreio(() => ({ entregue: false })),
    });

    const envio = service.atualizarStatus(comandoMaria);

    expect(envio.jornada).toBe('Expedido');
    expect(publicador.eventos.map((e) => e.nome)).toEqual(['ProdutoDespachado']);
  });
});

describe('EnvioService — listagem (Portal/query)', () => {
  test('lista os Envios da competência, opcionalmente por Parceira', () => {
    const gas = carregar();
    const { service } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria'), colaboracao(gas, 'ana')],
    });
    service.materializarParaCompetencia('2026-07');

    expect(service.listarEnvios('2026-07', 'ana')).toHaveLength(1);
    expect(service.listarEnvios('2026-07')).toHaveLength(2);
  });
});
