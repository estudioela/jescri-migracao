const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
  ]);
}

// Fake da porta da ACL de Colaborações (mesma porta do Repository).
function fakeAclColaboracoes() {
  const registros = [];
  return {
    registros,
    inserirEmLote(colaboracoes) {
      colaboracoes.forEach((c) => registros.push(c));
    },
    listarTodas() {
      return registros.slice();
    },
  };
}

// Fake da porta do Cadastro (SPEC-005 §14.1): Parceiras ativas + condições.
function fakeCadastro(parceiras) {
  return {
    listarAtivasComCondicoes: () => parceiras.map((p) => Object.assign({}, p)),
  };
}

function fakePublicador() {
  const eventos = [];
  return { eventos, publicar: (evento) => eventos.push(evento) };
}

function condicoesDe(valor) {
  return {
    valorMensal: valor,
    formatosContratados: ['Reels'],
    quantidadePorFormato: { Reels: 2 },
  };
}

function montar(gas, parceiras) {
  const acl = fakeAclColaboracoes();
  const repositorio = new gas.ColaboracaoMensalRepository(acl);
  const publicador = fakePublicador();
  const cadastro = fakeCadastro(parceiras);
  const servico = new gas.CompiladorDoMes(cadastro, repositorio, publicador);
  return { acl, repositorio, publicador, cadastro, servico };
}

describe('CompiladorDoMes — UC-005.01 Compilar Mês (C-01)', () => {
  test('cria uma Colaboração Ativa com Snapshot congelado por Parceira ativa', () => {
    const gas = carregar();
    const { servico, repositorio } = montar(gas, [
      { parceiraId: 'maria', condicoes: condicoesDe(3500) },
      { parceiraId: 'ana', condicoes: condicoesDe(1200) },
    ]);

    const resultado = servico.executar('2026-07');

    expect(resultado.jaCompilada).toBe(false);
    expect(resultado.colaboracoes).toHaveLength(2);
    const persistidas = repositorio.listarPor(new gas.MesReferencia(2026, 7));
    expect(persistidas).toHaveLength(2);
    expect(persistidas.every((c) => c.estado === 'Ativa')).toBe(true);
    const deMaria = persistidas.find((c) => c.parceiraId === 'maria');
    expect(deMaria.snapshot.valorMensal).toBe(3500);
  });

  test('publica MesCompilado com a competência e as colaborações (§12)', () => {
    const gas = carregar();
    const { servico, publicador } = montar(gas, [
      { parceiraId: 'maria', condicoes: condicoesDe(3500) },
    ]);

    servico.executar('2026-07');

    expect(publicador.eventos).toHaveLength(1);
    expect(publicador.eventos[0].nome).toBe('MesCompilado');
    expect(publicador.eventos[0].mesReferencia).toBe('2026-07');
    expect(publicador.eventos[0].colaboracoes).toHaveLength(1);
  });

  test('RN-04/C-03: alterar condições no Cadastro depois não retroage no Snapshot', () => {
    const gas = carregar();
    const parceiras = [{ parceiraId: 'maria', condicoes: condicoesDe(3500) }];
    const { servico, repositorio } = montar(gas, parceiras);

    servico.executar('2026-07');
    parceiras[0].condicoes.valorMensal = 9999;

    const persistidas = repositorio.listarPor(new gas.MesReferencia(2026, 7));
    expect(persistidas[0].snapshot.valorMensal).toBe(3500);
  });
});

describe('CompiladorDoMes — idempotência (RN-09, C-02, CB-01)', () => {
  test('segunda chamada da mesma competência é no-op: nada novo, nenhum evento', () => {
    const gas = carregar();
    const { servico, acl, publicador } = montar(gas, [
      { parceiraId: 'maria', condicoes: condicoesDe(3500) },
    ]);

    servico.executar('2026-07');
    const segunda = servico.executar('2026-07');

    expect(segunda.jaCompilada).toBe(true);
    expect(segunda.colaboracoes).toHaveLength(1);
    expect(acl.registros).toHaveLength(1);
    expect(publicador.eventos).toHaveLength(1);
  });

  test('competências diferentes compilam independentemente (RN-02)', () => {
    const gas = carregar();
    const { servico, acl } = montar(gas, [
      { parceiraId: 'maria', condicoes: condicoesDe(3500) },
    ]);

    servico.executar('2026-07');
    servico.executar('2026-08');

    expect(acl.registros).toHaveLength(2);
  });
});

describe('CompiladorDoMes — recusas fail-fast (§16/§17)', () => {
  test('CB-02/CM-03: nenhuma Parceira ativa — nada criado, nenhum evento', () => {
    const gas = carregar();
    const { servico, acl, publicador } = montar(gas, []);

    expect(() => servico.executar('2026-07')).toThrow(/CM-03/);
    expect(acl.registros).toHaveLength(0);
    expect(publicador.eventos).toHaveLength(0);
  });

  test('CM-02: MesReferencia inválida — nada acontece', () => {
    const gas = carregar();
    const { servico, acl, publicador } = montar(gas, [
      { parceiraId: 'maria', condicoes: condicoesDe(3500) },
    ]);

    expect(() => servico.executar('julho de 2026')).toThrow(/CM-02/);
    expect(acl.registros).toHaveLength(0);
    expect(publicador.eventos).toHaveLength(0);
  });

  test('RN-10: condições vindas com PII são recusadas (CM-04), nada persistido', () => {
    const gas = carregar();
    const condicoesComPII = Object.assign(condicoesDe(3500), { chavePix: 'x@y.z' });
    const { servico, acl } = montar(gas, [
      { parceiraId: 'maria', condicoes: condicoesComPII },
    ]);

    expect(() => servico.executar('2026-07')).toThrow(/CM-04/);
    expect(acl.registros).toHaveLength(0);
  });

  test('CB-03: falha na persistência propaga e o evento NÃO é publicado', () => {
    const gas = carregar();
    const { servico, acl, publicador } = montar(gas, [
      { parceiraId: 'maria', condicoes: condicoesDe(3500) },
    ]);
    acl.inserirEmLote = () => {
      throw new Error('falha física de escrita');
    };

    expect(() => servico.executar('2026-07')).toThrow(/falha física/);
    expect(publicador.eventos).toHaveLength(0);
  });
});
