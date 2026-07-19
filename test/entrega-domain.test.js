const { loadGas } = require('./helpers/gasHarness');

function dominio() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
    'src/modulos/Entrega.js',
  ]);
}

function snapshotPadrao(gas, sobrescritas) {
  const padrao = {
    valorMensal: 3500,
    formatosContratados: ['Reels', 'Carrossel', 'Stories'],
    quantidadePorFormato: { Reels: 1, Carrossel: 1, Stories: 2 },
  };
  return new gas.CondicaoComercialSnapshot(Object.assign(padrao, sobrescritas || {}));
}

function entregasPadrao(gas) {
  return gas.Entrega.materializar(
    'maria-silva',
    new gas.MesReferencia(2026, 7),
    snapshotPadrao(gas)
  );
}

const LINK = 'https://drive.example.com/material/reel-julho.mp4';

describe('Entrega — materialização (SPEC-012 RN-01)', () => {
  test('uma Entrega por unidade contratada, rótulos idênticos aos blocos do Briefing', () => {
    const gas = dominio();

    const entregas = entregasPadrao(gas);

    expect(entregas.map((e) => e.rotulo)).toEqual([
      'Reels',
      'Carrossel',
      'Stories 1',
      'Stories 2',
    ]);
    entregas.forEach((entrega) => {
      expect(entrega.estado).toBe('AguardandoMaterial');
      expect(entrega.material).toBeNull();
      expect(entrega.dataArquivamento).toBeNull();
    });
  });

  test('Parceira sem formato contratado → nenhuma Entrega', () => {
    const gas = dominio();

    const entregas = gas.Entrega.materializar(
      'maria-silva',
      new gas.MesReferencia(2026, 7),
      snapshotPadrao(gas, { formatosContratados: [], quantidadePorFormato: {} })
    );

    expect(entregas).toEqual([]);
  });

  test('exige identidade completa e Snapshot (INV-01)', () => {
    const gas = dominio();
    const mes = new gas.MesReferencia(2026, 7);

    expect(() => gas.Entrega.materializar('', mes, snapshotPadrao(gas))).toThrow(/parceira/i);
    expect(() => gas.Entrega.materializar('maria', '2026-07', snapshotPadrao(gas))).toThrow(
      /MesReferencia/
    );
    expect(() => gas.Entrega.materializar('maria', mes, null)).toThrow(/INV-01/);
  });
});

describe('IdentificadorDeEntrega — único e permanente (SPEC-012 §6.1, RNF-01/INV-02)', () => {
  test('é determinístico pela composição parceira × competência × rótulo', () => {
    const gas = dominio();
    const mes = new gas.MesReferencia(2026, 7);

    const a = new gas.IdentificadorDeEntrega('maria-silva', mes, 'Stories 1');
    const b = new gas.IdentificadorDeEntrega('maria-silva', new gas.MesReferencia(2026, 7), 'Stories 1');
    const outro = new gas.IdentificadorDeEntrega('maria-silva', mes, 'Stories 2');

    expect(a.igualA(b)).toBe(true);
    expect(a.toString()).toBe(b.toString());
    expect(a.igualA(outro)).toBe(false);
  });

  test('materialização gera identificadores únicos e estáveis entre chamadas', () => {
    const gas = dominio();

    const primeira = entregasPadrao(gas).map((e) => e.id.toString());
    const segunda = entregasPadrao(gas).map((e) => e.id.toString());

    expect(primeira).toEqual(segunda);
    expect(new Set(primeira).size).toBe(primeira.length);
  });

  test('exige as três partes da composição (fail-fast)', () => {
    const gas = dominio();
    const mes = new gas.MesReferencia(2026, 7);

    expect(() => new gas.IdentificadorDeEntrega('', mes, 'Reels')).toThrow(/parceira/i);
    expect(() => new gas.IdentificadorDeEntrega('maria', '2026-07', 'Reels')).toThrow(
      /MesReferencia/
    );
    expect(() => new gas.IdentificadorDeEntrega('maria', mes, '')).toThrow(/r[oó]tulo/i);
  });
});

describe('LinkDoMaterial — VO do material enviado (SPEC-012 §6.1)', () => {
  test('aceita URL http(s) e é imutável', () => {
    const gas = dominio();

    const link = new gas.LinkDoMaterial(LINK);

    expect(link.toString()).toBe(LINK);
    expect(Object.isFrozen(link)).toBe(true);
  });

  test('recusa link vazio ou fora de http(s) (fail-fast)', () => {
    const gas = dominio();

    expect(() => new gas.LinkDoMaterial('')).toThrow(/material/i);
    expect(() => new gas.LinkDoMaterial('ftp://arquivo')).toThrow(/http/i);
  });
});

describe('Entrega — máquina de estados (SPEC-012 §9)', () => {
  test('RN-03/UC-012.02: enviar material leva AguardandoMaterial → EmRevisao', () => {
    const gas = dominio();
    const entrega = entregasPadrao(gas)[0];

    entrega.enviarMaterial(LINK);

    expect(entrega.estado).toBe('EmRevisao');
    expect(entrega.material.toString()).toBe(LINK);
  });

  test('CB-01: upload repetido substitui o material mantendo identidade e estado', () => {
    const gas = dominio();
    const entrega = entregasPadrao(gas)[0];
    const idOriginal = entrega.id.toString();
    const outroLink = 'https://drive.example.com/material/reel-julho-v2.mp4';

    entrega.enviarMaterial(LINK);
    entrega.enviarMaterial(outroLink);

    expect(entrega.estado).toBe('EmRevisao');
    expect(entrega.material.toString()).toBe(outroLink);
    expect(entrega.id.toString()).toBe(idOriginal);
  });

  test('UC-012.03: EmRevisao → Aprovado → Publicado, arquivando com data (RN-04)', () => {
    const gas = dominio();
    const entrega = entregasPadrao(gas)[0];
    const dataArquivamento = new Date(2026, 6, 30);

    entrega.enviarMaterial(LINK);
    entrega.aprovar();
    expect(entrega.estado).toBe('Aprovado');

    entrega.publicar(dataArquivamento);
    expect(entrega.estado).toBe('Publicado');
    expect(entrega.dataArquivamento).toBe(dataArquivamento);
  });

  test('CT-03: transições fora da máquina falham barulhento', () => {
    const gas = dominio();
    const entrega = entregasPadrao(gas)[0];

    expect(() => entrega.aprovar()).toThrow(/CT-03/);
    expect(() => entrega.publicar(new Date(2026, 6, 30))).toThrow(/CT-03/);
  });

  test('CB-03: publicar Entrega já publicada é recusado (terminal)', () => {
    const gas = dominio();
    const entrega = entregasPadrao(gas)[0];
    entrega.enviarMaterial(LINK);
    entrega.aprovar();
    entrega.publicar(new Date(2026, 6, 30));

    expect(() => entrega.publicar(new Date(2026, 6, 31))).toThrow(/CB-03/);
  });

  test('INV-04: Entrega arquivada é somente leitura', () => {
    const gas = dominio();
    const entrega = entregasPadrao(gas)[0];
    entrega.enviarMaterial(LINK);
    entrega.aprovar();
    entrega.publicar(new Date(2026, 6, 30));

    expect(() => entrega.enviarMaterial(LINK)).toThrow(/INV-04/);
    expect(() => entrega.espelharDataAprovacao(new Date(2026, 6, 15))).toThrow(/INV-04/);
  });

  test('publicar exige data de arquivamento válida (RN-04, determinístico)', () => {
    const gas = dominio();
    const entrega = entregasPadrao(gas)[0];
    entrega.enviarMaterial(LINK);
    entrega.aprovar();

    expect(() => entrega.publicar(null)).toThrow(/arquivamento/i);
    expect(() => entrega.publicar(new Date('inválida'))).toThrow(/arquivamento/i);
  });
});

describe('Entrega — espelhamento da data de aprovação (SPEC-012 §14.1 / SPEC-009 RN-04)', () => {
  test('espelha a data de aprovação interna vinda do Briefing', () => {
    const gas = dominio();
    const entrega = entregasPadrao(gas)[0];
    const dataAprovacao = new Date(2026, 6, 15);

    entrega.espelharDataAprovacao(dataAprovacao);

    expect(entrega.dataAprovacaoInterna).toBe(dataAprovacao);
  });

  test('recusa data inválida (fail-fast)', () => {
    const gas = dominio();
    const entrega = entregasPadrao(gas)[0];

    expect(() => entrega.espelharDataAprovacao(null)).toThrow(/aprova/i);
    expect(() => entrega.espelharDataAprovacao(new Date('inválida'))).toThrow(/aprova/i);
  });
});
