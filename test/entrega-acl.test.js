const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
    'src/modulos/Entrega.js',
  ]);
}

const CABECALHO = [
  'INFLU_KEY',
  'ANO_REFERENCIA',
  'MES_REFERENCIA',
  'ROTULO',
  'ESTADO',
  'LINK_MATERIAL',
  'DATA_APROVACAO_INTERNA',
  'DATA_ARQUIVAMENTO',
];

// Fake mínimo da API de Sheet usada pela ACL (mesma superfície da BriefingACL).
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

function entregas(gas, parceiraId, ano, mes) {
  return gas.Entrega.materializar(
    parceiraId,
    new gas.MesReferencia(ano, mes),
    new gas.CondicaoComercialSnapshot({
      valorMensal: 1000,
      formatosContratados: ['Reels', 'Stories'],
      quantidadePorFormato: { Reels: 1, Stories: 2 },
    })
  );
}

const LINK = 'https://drive.example.com/material/reel.mp4';

describe('EntregaACL — substituição por competência e reidratação (RN-01)', () => {
  test('substituirCompetencia persiste uma linha por Entrega e listarTodos reidrata o agregado', () => {
    const gas = carregar();
    const acl = new gas.EntregaACL(fakeSheet());

    acl.substituirCompetencia(new gas.MesReferencia(2026, 7), entregas(gas, 'maria', 2026, 7));

    const lidas = acl.listarTodos();
    expect(lidas.map((e) => e.rotulo)).toEqual(['Reels', 'Stories 1', 'Stories 2']);
    lidas.forEach((entrega) => {
      expect(entrega.estado).toBe('AguardandoMaterial');
      expect(entrega.material).toBeNull();
    });
  });

  test('substituição preserva linhas de outra competência', () => {
    const gas = carregar();
    const acl = new gas.EntregaACL(fakeSheet());
    acl.substituirCompetencia(new gas.MesReferencia(2026, 6), entregas(gas, 'maria', 2026, 6));

    acl.substituirCompetencia(new gas.MesReferencia(2026, 7), entregas(gas, 'ana', 2026, 7));

    const porCompetencia = acl
      .listarTodos()
      .map((e) => e.mesReferencia.toString());
    expect(porCompetencia.filter((m) => m === '2026-06')).toHaveLength(3);
    expect(porCompetencia.filter((m) => m === '2026-07')).toHaveLength(3);
  });

  test('salvar faz upsert pela identidade (parceira × competência × rótulo) e o ciclo completo sobrevive à reidratação', () => {
    const gas = carregar();
    const acl = new gas.EntregaACL(fakeSheet());
    const mes = new gas.MesReferencia(2026, 7);
    acl.substituirCompetencia(mes, entregas(gas, 'maria', 2026, 7));
    const dataAprovacao = new Date(2026, 6, 15);
    const dataArquivamento = new Date(2026, 6, 30);

    const entrega = acl.listarTodos().find((e) => e.rotulo === 'Reels');
    entrega.espelharDataAprovacao(dataAprovacao);
    entrega.enviarMaterial(LINK);
    entrega.aprovar();
    entrega.publicar(dataArquivamento);
    acl.salvar(entrega);

    const lidas = acl.listarTodos();
    expect(lidas).toHaveLength(3);
    const publicada = lidas.find((e) => e.rotulo === 'Reels');
    expect(publicada.estado).toBe('Publicado');
    expect(publicada.material.toString()).toBe(LINK);
    expect(publicada.dataAprovacaoInterna.getTime()).toBe(dataAprovacao.getTime());
    expect(publicada.dataArquivamento.getTime()).toBe(dataArquivamento.getTime());
    // INV-04: a reidratada continua somente leitura.
    expect(() => publicada.enviarMaterial(LINK)).toThrow(/INV-04/);
  });
});

describe('EntregaACL — coerção fail-fast (RN-05/CB-02, ADR-001 §2.2)', () => {
  test('rótulo cru de estado desconhecido → erro de validação (CT-02)', () => {
    const gas = carregar();
    const acl = new gas.EntregaACL(
      fakeSheet([['maria', 2026, 7, 'Reels', 'postado', '', '', '']])
    );

    expect(() => acl.listarTodos()).toThrow(/CT-02/);
  });

  test('estado persistido incoerente com as colunas (EM_REVISAO sem link) → fail-fast', () => {
    const gas = carregar();
    const acl = new gas.EntregaACL(
      fakeSheet([['maria', 2026, 7, 'Reels', 'EM_REVISAO', '', '', '']])
    );

    expect(() => acl.listarTodos()).toThrow(/incoerente/i);
  });

  test('coluna ausente no cabeçalho → fail-fast', () => {
    const gas = carregar();
    const sheet = fakeSheet();
    sheet
      .getRange()
      .setValues([
        CABECALHO.slice(0, 5),
        ['maria', 2026, 7, 'Reels', 'AGUARDANDO_MATERIAL'],
      ]);
    const acl = new gas.EntregaACL(sheet);

    expect(() => acl.listarTodos()).toThrow(/ausente/i);
  });
});
