const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/domain/MesReferencia.js',
    'src/domain/CondicaoComercialSnapshot.js',
    'src/domain/CalculadoraDeAprovacao.js',
    'src/domain/BlocoDeFormato.js',
    'src/domain/Briefing.js',
    'src/domain/IdentificadorDeEntrega.js',
    'src/domain/LinkDoMaterial.js',
    'src/domain/Entrega.js',
    'src/service/EntregaService.js',
  ]);
}

function colaboracao(gas, parceiraId) {
  return {
    parceiraId,
    mesReferencia: new gas.MesReferencia(2026, 7),
    snapshot: new gas.CondicaoComercialSnapshot({
      valorMensal: 3500,
      formatosContratados: ['Reels', 'Stories'],
      quantidadePorFormato: { Reels: 1, Stories: 2 },
    }),
  };
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

function fakeBriefingRepo(briefings) {
  return {
    obterPor(mesReferencia, parceiraId) {
      return (
        (briefings || []).find(
          (b) => b.mesReferencia.igualA(mesReferencia) && b.parceiraId === parceiraId
        ) || null
      );
    },
  };
}

function fakeEntregaRepo() {
  const estado = { porChave: {}, recriacoes: [], salvos: [] };
  const chave = (mes, parceiraId, rotulo) => parceiraId + '|' + mes.toString() + '|' + rotulo;
  return {
    estado,
    recriarCompetencia(mesReferencia, entregas) {
      estado.recriacoes.push(entregas);
      entregas.forEach((e) => {
        estado.porChave[chave(mesReferencia, e.parceiraId, e.rotulo)] = e;
      });
      return entregas;
    },
    salvar(entrega) {
      estado.salvos.push(entrega);
      estado.porChave[chave(entrega.mesReferencia, entrega.parceiraId, entrega.rotulo)] = entrega;
      return entrega;
    },
    obterPor(mesReferencia, parceiraId, rotulo) {
      return estado.porChave[chave(mesReferencia, parceiraId, rotulo)] || null;
    },
    listarPor(mesReferencia, parceiraId) {
      return Object.values(estado.porChave)
        .filter((e) => e.mesReferencia.igualA(mesReferencia))
        .filter((e) => parceiraId === undefined || e.parceiraId === parceiraId);
    },
  };
}

function fakePublicador() {
  const eventos = [];
  return { eventos, publicar: (evento) => eventos.push(evento) };
}

const HOJE = new Date(2026, 6, 30);
const LINK = 'https://drive.example.com/material/reel.mp4';
const comandoReels = { mesReferencia: '2026-07', parceiraId: 'maria', rotulo: 'Reels' };

function montar(gas, opcoes) {
  const entregaRepo = fakeEntregaRepo();
  const publicador = fakePublicador();
  const service = new gas.EntregaService(
    fakeColaboracaoRepo((opcoes && opcoes.colaboracoes) || []),
    fakeBriefingRepo((opcoes && opcoes.briefings) || []),
    entregaRepo,
    publicador,
    { hoje: () => HOJE }
  );
  return { service, entregaRepo, publicador };
}

describe('EntregaService — reação a MesCompilado (RN-01)', () => {
  test('materializa uma Entrega por unidade contratada de cada Colaboração compilada', () => {
    const gas = carregar();
    const { service, entregaRepo } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria'), colaboracao(gas, 'ana')],
    });

    const materializadas = service.materializarParaCompetencia('2026-07');

    expect(materializadas).toHaveLength(6);
    expect(entregaRepo.estado.recriacoes).toHaveLength(1);
    expect(materializadas.every((e) => e.estado === 'AguardandoMaterial')).toBe(true);
  });
});

describe('EntregaService — UC-012.02 enviar material', () => {
  test('upload leva a EmRevisao, persiste e só então emite ConteudoEnviado (§12)', () => {
    const gas = carregar();
    const { service, entregaRepo, publicador } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria')],
    });
    service.materializarParaCompetencia('2026-07');

    const entrega = service.enviarMaterial(
      Object.assign({ link: LINK }, comandoReels)
    );

    expect(entrega.estado).toBe('EmRevisao');
    expect(entregaRepo.estado.salvos).toHaveLength(1);
    expect(publicador.eventos).toEqual([
      {
        nome: 'ConteudoEnviado',
        entregaId: 'maria|2026-07|Reels',
        parceiraId: 'maria',
        mesReferencia: '2026-07',
      },
    ]);
  });

  test('CT-01: Entrega inexistente é recusada fail-fast, sem evento', () => {
    const gas = carregar();
    const { service, publicador } = montar(gas, {});

    expect(() =>
      service.enviarMaterial(Object.assign({ link: LINK }, comandoReels))
    ).toThrow(/CT-01/);
    expect(publicador.eventos).toHaveLength(0);
  });

  test('falha na persistência nunca publica evento (disciplina de SPEC-005 CB-03)', () => {
    const gas = carregar();
    const { service, entregaRepo, publicador } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria')],
    });
    service.materializarParaCompetencia('2026-07');
    entregaRepo.salvar = () => {
      throw new Error('falha física de escrita');
    };

    expect(() =>
      service.enviarMaterial(Object.assign({ link: LINK }, comandoReels))
    ).toThrow(/falha física/);
    expect(publicador.eventos).toHaveLength(0);
  });
});

describe('EntregaService — UC-012.03 aprovar e publicar', () => {
  test('aprova, publica com arquivamento pelo relógio injetado e emite os eventos (§12/RN-04)', () => {
    const gas = carregar();
    const { service, publicador } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria')],
    });
    service.materializarParaCompetencia('2026-07');
    service.enviarMaterial(Object.assign({ link: LINK }, comandoReels));

    service.aprovar(comandoReels);
    const publicada = service.publicar(comandoReels);

    expect(publicada.estado).toBe('Publicado');
    expect(publicada.dataArquivamento).toBe(HOJE);
    expect(publicador.eventos.map((e) => e.nome)).toEqual([
      'ConteudoEnviado',
      'ConteudoAprovado',
      'ConteudoPublicado',
    ]);
    expect(publicador.eventos[2]).toEqual({
      nome: 'ConteudoPublicado',
      entregaId: 'maria|2026-07|Reels',
      dataArquivamento: HOJE,
    });
  });

  test('CB-03: publicar Entrega já publicada propaga a recusa do domínio', () => {
    const gas = carregar();
    const { service } = montar(gas, { colaboracoes: [colaboracao(gas, 'maria')] });
    service.materializarParaCompetencia('2026-07');
    service.enviarMaterial(Object.assign({ link: LINK }, comandoReels));
    service.aprovar(comandoReels);
    service.publicar(comandoReels);

    expect(() => service.publicar(comandoReels)).toThrow(/CB-03/);
  });
});

describe('EntregaService — espelhamento da aprovação (SPEC-012 §14.1)', () => {
  test('reação a BriefingPublicado espelha a data de aprovação por rótulo e persiste', () => {
    const gas = carregar();
    const mes = new gas.MesReferencia(2026, 7);
    const briefing = gas.Briefing.criarRascunho('maria', mes, colaboracao(gas, 'maria').snapshot);
    briefing.blocos.forEach((bloco) => {
      briefing.preencherBloco(bloco.rotulo, {
        look: 'Look 1',
        dataEntrega: new Date(2026, 6, 10),
        dataPostagem: new Date(2026, 6, 22),
      });
    });
    briefing.publicar();
    const { service, entregaRepo } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria')],
      briefings: [briefing],
    });
    service.materializarParaCompetencia('2026-07');

    const espelhadas = service.espelharAprovacoes('2026-07', 'maria');

    expect(espelhadas).toHaveLength(3);
    espelhadas.forEach((entrega) => {
      expect(entrega.dataAprovacaoInterna.getTime()).toBe(
        briefing.blocos[0].dataAprovacaoInterna.getTime()
      );
    });
    expect(entregaRepo.estado.salvos).toHaveLength(3);
  });

  test('briefing inexistente para a competência é recusado fail-fast', () => {
    const gas = carregar();
    const { service } = montar(gas, { colaboracoes: [colaboracao(gas, 'maria')] });
    service.materializarParaCompetencia('2026-07');

    expect(() => service.espelharAprovacoes('2026-07', 'maria')).toThrow(/briefing/i);
  });
});

describe('EntregaService — UC-012.01 listar pendências', () => {
  test('lista as Entregas da competência por Parceira', () => {
    const gas = carregar();
    const { service } = montar(gas, {
      colaboracoes: [colaboracao(gas, 'maria'), colaboracao(gas, 'ana')],
    });
    service.materializarParaCompetencia('2026-07');

    const deAna = service.listarEntregas('2026-07', 'ana');

    expect(deAna).toHaveLength(3);
    expect(deAna.every((e) => e.parceiraId === 'ana')).toBe(true);
    expect(service.listarEntregas('2026-07')).toHaveLength(6);
  });
});
