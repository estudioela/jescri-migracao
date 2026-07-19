const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
    'src/modulos/Briefing.js',
  ]);
}

function colaboracao(gas, parceiraId) {
  return new gas.ColaboracaoMensal(
    parceiraId,
    new gas.MesReferencia(2026, 7),
    new gas.CondicaoComercialSnapshot({
      valorMensal: 3500,
      formatosContratados: ['Reels', 'Stories'],
      quantidadePorFormato: { Reels: 1, Stories: 2 },
    })
  );
}

function fakeColaboracaoRepo(colaboracoes) {
  return {
    listarPor(mesReferencia, parceiraId) {
      return colaboracoes
        .filter((c) => c.mesReferencia.igualA(mesReferencia))
        .filter((c) => parceiraId === undefined || c.parceiraId === parceiraId);
    },
  };
}

function fakeBriefingRepo() {
  const estado = { porChave: {}, recriacoes: [], salvos: [] };
  const chave = (mes, parceiraId) => parceiraId + '|' + mes.toString();
  return {
    estado,
    recriarCompetencia(mesReferencia, briefings) {
      estado.recriacoes.push(briefings);
      briefings.forEach((b) => {
        estado.porChave[chave(mesReferencia, b.parceiraId)] = b;
      });
      return briefings;
    },
    salvar(briefing) {
      estado.salvos.push(briefing);
      estado.porChave[chave(briefing.mesReferencia, briefing.parceiraId)] = briefing;
      return briefing;
    },
    obterPor(mesReferencia, parceiraId) {
      return estado.porChave[chave(mesReferencia, parceiraId)] || null;
    },
    existeParaCompetencia(mesReferencia) {
      return Object.values(estado.porChave).some((b) =>
        b.mesReferencia.igualA(mesReferencia)
      );
    },
  };
}

function fakePublicador() {
  const eventos = [];
  return { eventos, publicar: (evento) => eventos.push(evento) };
}

const comandoPadrao = {
  mesReferencia: '2026-07',
  parceiraId: 'maria',
  blocos: [
    {
      rotulo: 'Reels',
      look: 'Look 1',
      dataEntrega: '2026-07-10',
      dataPostagem: '2026-07-22',
      orientacao: 'Luz natural.',
    },
    { rotulo: 'Stories 1', look: 'Look 2', dataEntrega: '2026-07-10', dataPostagem: '2026-07-22' },
    { rotulo: 'Stories 2', look: 'Look 3', dataEntrega: '2026-07-10', dataPostagem: '2026-07-22' },
  ],
};

function montar(gas, colaboracoes) {
  const briefingRepo = fakeBriefingRepo();
  const publicador = fakePublicador();
  const service = new gas.BriefingService(
    fakeColaboracaoRepo(colaboracoes),
    briefingRepo,
    publicador
  );
  return { service, briefingRepo, publicador };
}

describe('BriefingService — reação a MesCompilado (RN-03)', () => {
  test('recria um rascunho por Colaboração compilada, blocos derivados do Snapshot', () => {
    const gas = carregar();
    const { service, briefingRepo } = montar(gas, [
      colaboracao(gas, 'maria'),
      colaboracao(gas, 'ana'),
    ]);

    const rascunhos = service.recriarParaCompetencia('2026-07');

    expect(rascunhos).toHaveLength(2);
    expect(briefingRepo.estado.recriacoes).toHaveLength(1);
    expect(rascunhos[0].estado).toBe('Rascunho');
    expect(rascunhos[0].blocos.map((b) => b.rotulo)).toEqual([
      'Reels',
      'Stories 1',
      'Stories 2',
    ]);
  });
});

describe('BriefingService — UC-009.01 preencher e publicar', () => {
  test('preenche os blocos, publica o agregado e emite BriefingPublicado (§12)', () => {
    const gas = carregar();
    const { service, briefingRepo, publicador } = montar(gas, [colaboracao(gas, 'maria')]);
    service.recriarParaCompetencia('2026-07');

    const briefing = service.preencherEPublicar(comandoPadrao);

    expect(briefing.estado).toBe('Publicado');
    expect(briefingRepo.estado.salvos).toHaveLength(1);
    expect(publicador.eventos).toEqual([
      {
        nome: 'BriefingPublicado',
        parceiraId: 'maria',
        mesReferencia: '2026-07',
        blocos: ['Reels', 'Stories 1', 'Stories 2'],
      },
    ]);
  });

  test('BR-01: sem Colaboração compilada para a Parceira, recusa fail-fast', () => {
    const gas = carregar();
    const { service, publicador } = montar(gas, []);

    expect(() => service.preencherEPublicar(comandoPadrao)).toThrow(/BR-01/);
    expect(publicador.eventos).toHaveLength(0);
  });

  test('BR-02: data externa fora de AAAA-MM-DD é recusada', () => {
    const gas = carregar();
    const { service } = montar(gas, [colaboracao(gas, 'maria')]);
    service.recriarParaCompetencia('2026-07');
    const comando = JSON.parse(JSON.stringify(comandoPadrao));
    comando.blocos[0].dataPostagem = '22/07/2026';

    expect(() => service.preencherEPublicar(comando)).toThrow(/BR-02/);
  });

  test('falha na persistência nunca publica evento (disciplina CB-03 de SPEC-005)', () => {
    const gas = carregar();
    const { service, briefingRepo, publicador } = montar(gas, [colaboracao(gas, 'maria')]);
    service.recriarParaCompetencia('2026-07');
    briefingRepo.salvar = () => {
      throw new Error('falha física de escrita');
    };

    expect(() => service.preencherEPublicar(comandoPadrao)).toThrow(/falha física/);
    expect(publicador.eventos).toHaveLength(0);
  });
});
