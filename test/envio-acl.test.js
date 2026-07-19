const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Envio.js',
  ]);
}

const CABECALHO = [
  'INFLU_KEY',
  'ANO_REFERENCIA',
  'MES_REFERENCIA',
  'STATUS_REVISAO',
  'STATUS_LOGISTICA',
  'RASTREIO',
  'DATA_ENVIO',
  'DATA_ARQUIVAMENTO',
];

// Fake mínimo da API de Sheet usada pela ACL (mesma superfície da EntregaACL).
function fakeSheet(linhasIniciais) {
  let matriz = [CABECALHO.slice()].concat(linhasIniciais || []);
  return {
    get matriz() {
      return matriz;
    },
    getDataRange() {
      return { getValues: () => matriz.map((linha) => linha.slice()) };
    },
    clearContents() {
      matriz = [];
    },
    getRange() {
      return {
        setValues: (valores) => {
          matriz = valores.map((linha) => linha.slice());
        },
      };
    },
  };
}

function envio(gas, parceiraId, ano, mes) {
  return new gas.Envio(parceiraId, new gas.MesReferencia(ano, mes));
}

const RASTREIO = 'BR123456789XX';
const DATA_ENVIO = new Date(2026, 6, 16);
const DATA_ARQUIVAMENTO = new Date(2026, 6, 25);

describe('EnvioACL — substituição por competência e reidratação (RN-01)', () => {
  test('substituirCompetencia persiste uma linha por Envio e listarTodos reidrata o agregado recém-nascido', () => {
    const gas = carregar();
    const acl = new gas.EnvioACL(fakeSheet());

    acl.substituirCompetencia(new gas.MesReferencia(2026, 7), [
      envio(gas, 'maria', 2026, 7),
      envio(gas, 'ana', 2026, 7),
    ]);

    const lidos = acl.listarTodos();
    expect(lidos.map((e) => e.parceiraId).sort()).toEqual(['ana', 'maria']);
    lidos.forEach((e) => {
      expect(e.revisao).toBe('AguardandoConfirmacao');
      expect(e.jornada).toBe('Pendente');
      expect(e.rastreio).toBeNull();
    });
  });

  test('substituição preserva linhas de outra competência', () => {
    const gas = carregar();
    const acl = new gas.EnvioACL(fakeSheet());
    acl.substituirCompetencia(new gas.MesReferencia(2026, 6), [envio(gas, 'maria', 2026, 6)]);

    acl.substituirCompetencia(new gas.MesReferencia(2026, 7), [envio(gas, 'ana', 2026, 7)]);

    const porCompetencia = acl.listarTodos().map((e) => e.mesReferencia.toString());
    expect(porCompetencia.filter((m) => m === '2026-06')).toHaveLength(1);
    expect(porCompetencia.filter((m) => m === '2026-07')).toHaveLength(1);
  });

  test('salvar faz upsert pela identidade (parceira × competência) — jornada até Entregue sobrevive à reidratação', () => {
    const gas = carregar();
    const acl = new gas.EnvioACL(fakeSheet());
    const mes = new gas.MesReferencia(2026, 7);
    acl.substituirCompetencia(mes, [envio(gas, 'maria', 2026, 7)]);

    const alvo = acl.listarTodos().find((e) => e.parceiraId === 'maria');
    alvo.confirmarEndereco();
    alvo.registrarRastreio(RASTREIO, DATA_ENVIO);
    alvo.marcarEntregue(DATA_ARQUIVAMENTO);
    acl.salvar(alvo);

    const lidos = acl.listarTodos();
    expect(lidos).toHaveLength(1);
    const reidratado = lidos[0];
    expect(reidratado.revisao).toBe('Confirmado');
    expect(reidratado.jornada).toBe('Entregue');
    expect(reidratado.rastreio.toString()).toBe(RASTREIO);
    expect(reidratado.dataEnvio.getTime()).toBe(DATA_ENVIO.getTime());
    expect(reidratado.dataArquivamento.getTime()).toBe(DATA_ARQUIVAMENTO.getTime());
    // INV-03: a reidratada continua somente leitura.
    expect(() => reidratado.registrarRastreio(RASTREIO, DATA_ENVIO)).toThrow(/INV-03/);
  });

  test('salvar preserva a jornada Cancelado na reidratação', () => {
    const gas = carregar();
    const acl = new gas.EnvioACL(fakeSheet());
    const mes = new gas.MesReferencia(2026, 7);
    acl.substituirCompetencia(mes, [envio(gas, 'maria', 2026, 7)]);

    const alvo = acl.listarTodos()[0];
    alvo.registrarRastreio(RASTREIO, DATA_ENVIO);
    alvo.cancelar();
    acl.salvar(alvo);

    const reidratado = acl.listarTodos()[0];
    expect(reidratado.jornada).toBe('Cancelado');
    expect(reidratado.revisao).toBe('AguardandoConfirmacao');
  });
});

describe('EnvioACL — coerção fail-fast (RN-05, ADR-001 §2.4)', () => {
  test('STATUS_REVISAO cru desconhecido → erro de validação', () => {
    const gas = carregar();
    const acl = new gas.EnvioACL(
      fakeSheet([['maria', 2026, 7, 'em_analise', 'PENDENTE', '', '', '']])
    );

    expect(() => acl.listarTodos()).toThrow(/STATUS_REVISAO/);
  });

  test('STATUS_LOGISTICA cru desconhecido → erro de validação', () => {
    const gas = carregar();
    const acl = new gas.EnvioACL(
      fakeSheet([['maria', 2026, 7, 'AGUARDANDO_CONFIRMACAO', 'em_transito', '', '', '']])
    );

    expect(() => acl.listarTodos()).toThrow(/STATUS_LOGISTICA/);
  });

  test('estado persistido incoerente com as colunas (EXPEDIDO sem rastreio) → fail-fast', () => {
    const gas = carregar();
    const acl = new gas.EnvioACL(
      fakeSheet([['maria', 2026, 7, 'AGUARDANDO_CONFIRMACAO', 'EXPEDIDO', '', '', '']])
    );

    expect(() => acl.listarTodos()).toThrow(/incoerente/i);
  });

  test('coluna ausente no cabeçalho → fail-fast', () => {
    const gas = carregar();
    const sheet = fakeSheet();
    sheet
      .getRange()
      .setValues([
        CABECALHO.slice(0, 4),
        ['maria', 2026, 7, 'AGUARDANDO_CONFIRMACAO'],
      ]);
    const acl = new gas.EnvioACL(sheet);

    expect(() => acl.listarTodos()).toThrow(/ausente/i);
  });
});
