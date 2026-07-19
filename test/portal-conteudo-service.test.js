const { loadGas } = require('./helpers/gasHarness');

function montar() {
  const gas = loadGas([
    'src/shared/Nucleo.js',
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Entrega.js',
    'src/modulos/Briefing.js',
    'src/modulos/PortalConteudo.js',
  ]);

  const AGORA = new Date('2026-07-16T10:00:00Z');
  const entregas = [];
  let briefingDaMaria = null;

  const entregaService = {
    listarEntregas: (mesReferenciaTexto, parceiraId) =>
      entregas.filter(
        (e) => e.mesReferencia.toString() === mesReferenciaTexto && e.parceiraId === parceiraId
      ),
    enviarMaterial: (comando) => {
      const entrega = entregas.find(
        (e) =>
          e.mesReferencia.toString() === comando.mesReferencia &&
          e.parceiraId === comando.parceiraId &&
          e.rotulo === comando.rotulo
      );
      if (!entrega) {
        throw new Error("CT-01: Entrega inexistente — '" + comando.rotulo + "'.");
      }
      entrega.enviarMaterial(comando.link);
      return entrega;
    },
  };

  const briefingService = {
    obterBriefing: (mesReferenciaTexto, parceiraId) =>
      parceiraId === 'Maria' ? briefingDaMaria : null,
  };

  const sessoes = { 'tok-maria': 'Maria' };
  const acessoPortalService = {
    renovar: (dados) => {
      const parceiraId = sessoes[dados && dados.token];
      if (!parceiraId) {
        const erro = new Error('Sessão expirada.');
        erro.codigo = 'AC-03';
        throw erro;
      }
      return { parceiraId: parceiraId };
    },
  };

  const servico = new gas.PortalDeConteudoService(
    acessoPortalService,
    entregaService,
    briefingService,
    { hoje: () => AGORA }
  );

  return { gas, servico, entregas, setBriefingDaMaria: (b) => (briefingDaMaria = b) };
}

function codigoDe(fn) {
  try {
    fn();
    return null;
  } catch (erro) {
    return erro.codigo;
  }
}

describe('PortalDeConteudoService.listarPendencias (UC-027.01)', () => {
  test('lista só as Entregas da Parceira autenticada na competência corrente', () => {
    const { gas, servico, entregas } = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    entregas.push(
      new gas.Entrega('Maria', mesReferencia, 'Reels'),
      new gas.Entrega('Ana', mesReferencia, 'Reels')
    );

    const pendencias = servico.listarPendencias({ token: 'tok-maria' });

    expect(pendencias).toHaveLength(1);
    expect(pendencias[0].rotulo).toBe('Reels');
  });

  test('exclui Entregas já Publicadas (histórico é escopo de SPEC-030)', () => {
    const { gas, servico, entregas } = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    const publicada = new gas.Entrega('Maria', mesReferencia, 'Reels');
    publicada.enviarMaterial('https://drive/link');
    publicada.aprovar();
    publicada.publicar(new Date('2026-07-30'));
    entregas.push(publicada, new gas.Entrega('Maria', mesReferencia, 'Stories 1'));

    const pendencias = servico.listarPendencias({ token: 'tok-maria' });

    expect(pendencias.map((i) => i.rotulo)).toEqual(['Stories 1']);
  });

  test('bloco de briefing ainda não preenchido (rascunho) não é exposto como briefing (RN-03)', () => {
    const { gas, servico, entregas, setBriefingDaMaria } = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    entregas.push(new gas.Entrega('Maria', mesReferencia, 'Reels'));
    // Bloco existe (rascunho recriado no compilar), mas ainda não preenchido.
    setBriefingDaMaria({ blocos: [new gas.BlocoDeFormato('Reels')] });

    const pendencias = servico.listarPendencias({ token: 'tok-maria' });

    expect(pendencias[0].briefing).toBeNull();
  });

  test('F6 (auditoria SPEC-012): ordena por dataEntrega do bloco de briefing, cronológica', () => {
    const { gas, servico, entregas, setBriefingDaMaria } = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    entregas.push(
      new gas.Entrega('Maria', mesReferencia, 'Stories 1'),
      new gas.Entrega('Maria', mesReferencia, 'Reels'),
      new gas.Entrega('Maria', mesReferencia, 'Stories 2')
    );
    const blocoStories1 = new gas.BlocoDeFormato('Stories 1').preencher({
      look: 'Look A',
      dataEntrega: new Date('2026-07-20'),
      dataPostagem: new Date('2026-07-25'),
    });
    const blocoReels = new gas.BlocoDeFormato('Reels').preencher({
      look: 'Look B',
      dataEntrega: new Date('2026-07-05'),
      dataPostagem: new Date('2026-07-10'),
    });
    // 'Stories 2' fica sem bloco (rascunho não preenchido) — RN-03.
    setBriefingDaMaria({ blocos: [blocoStories1, blocoReels, new gas.BlocoDeFormato('Stories 2')] });

    const pendencias = servico.listarPendencias({ token: 'tok-maria' });

    expect(pendencias.map((i) => i.rotulo)).toEqual(['Reels', 'Stories 1', 'Stories 2']);
  });

  test('CB-02: sem pendências no mês devolve lista vazia', () => {
    const { servico } = montar();

    expect(servico.listarPendencias({ token: 'tok-maria' })).toEqual([]);
  });

  test('PC-01: token inválido/expirado é recusado', () => {
    const { servico } = montar();

    expect(codigoDe(() => servico.listarPendencias({ token: 'nao-existe' }))).toBe('PC-01');
  });

  test('projeta o bloco de briefing correspondente por rótulo', () => {
    const { gas, servico, entregas, setBriefingDaMaria } = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    entregas.push(new gas.Entrega('Maria', mesReferencia, 'Reels'));
    const bloco = new gas.BlocoDeFormato('Reels');
    bloco.preencher({
      look: 'Look 1',
      dataEntrega: new Date('2026-07-10'),
      dataPostagem: new Date('2026-07-22'),
    });
    setBriefingDaMaria({ blocos: [bloco] });

    const pendencias = servico.listarPendencias({ token: 'tok-maria' });

    expect(pendencias[0].briefing.look).toBe('Look 1');
  });
});

describe('PortalDeConteudoService.lerBriefingDoItem (UC-027.02)', () => {
  test('lê o bloco de briefing da Entrega própria', () => {
    const { gas, servico, entregas, setBriefingDaMaria } = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    entregas.push(new gas.Entrega('Maria', mesReferencia, 'Reels'));
    const bloco = new gas.BlocoDeFormato('Reels');
    bloco.preencher({
      look: 'Look 1',
      dataEntrega: new Date('2026-07-10'),
      dataPostagem: new Date('2026-07-22'),
    });
    setBriefingDaMaria({ blocos: [bloco] });

    expect(servico.lerBriefingDoItem({ token: 'tok-maria', rotulo: 'Reels' }).look).toBe('Look 1');
  });

  test('PC-02: bloco de briefing existente mas ainda não preenchido é recusado (RN-03)', () => {
    const { gas, servico, entregas, setBriefingDaMaria } = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    entregas.push(new gas.Entrega('Maria', mesReferencia, 'Reels'));
    setBriefingDaMaria({ blocos: [new gas.BlocoDeFormato('Reels')] });

    expect(
      codigoDe(() => servico.lerBriefingDoItem({ token: 'tok-maria', rotulo: 'Reels' }))
    ).toBe('PC-02');
  });

  test('PC-02: Entrega de outra Parceira (ou inexistente) é recusada', () => {
    const { gas, servico, entregas } = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    entregas.push(new gas.Entrega('Ana', mesReferencia, 'Reels'));

    expect(codigoDe(() => servico.lerBriefingDoItem({ token: 'tok-maria', rotulo: 'Reels' }))).toBe(
      'PC-02'
    );
  });
});

describe('PortalDeConteudoService.enviarMaterial (UC-027.03)', () => {
  test('delega à SPEC-012: Entrega vai a EmRevisao (RN-02)', () => {
    const { gas, servico, entregas } = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    entregas.push(new gas.Entrega('Maria', mesReferencia, 'Reels'));

    const entrega = servico.enviarMaterial({
      token: 'tok-maria',
      rotulo: 'Reels',
      link: 'https://drive/arquivo',
    });

    expect(entrega.estado).toBe('EmRevisao');
  });

  test('PC-02: não pode enviar material de Entrega alheia', () => {
    const { gas, servico, entregas } = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    entregas.push(new gas.Entrega('Ana', mesReferencia, 'Reels'));

    expect(
      codigoDe(() =>
        servico.enviarMaterial({ token: 'tok-maria', rotulo: 'Reels', link: 'x' })
      )
    ).toBe('PC-02');
  });

  test('PC-01: sessão expirada durante o upload (CB-01)', () => {
    const { servico } = montar();

    expect(
      codigoDe(() =>
        servico.enviarMaterial({ token: 'expirado', rotulo: 'Reels', link: 'x' })
      )
    ).toBe('PC-01');
  });
});
