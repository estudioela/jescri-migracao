const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
    'src/modulos/Entrega.js',
  ]);
}

// Fake da porta da ACL da Entrega: substituição atômica por competência,
// upsert individual e leitura completa. Mantém o Repository cego à planilha.
function fakeAcl() {
  let registros = [];
  const chamadas = { substituicoes: 0 };
  return {
    get registros() {
      return registros;
    },
    chamadas,
    substituirCompetencia(mesReferencia, entregas) {
      chamadas.substituicoes += 1;
      registros = registros
        .filter((e) => !e.mesReferencia.igualA(mesReferencia))
        .concat(entregas);
    },
    salvar(entrega) {
      registros = registros.filter((e) => !e.igualA(entrega)).concat([entrega]);
    },
    listarTodos() {
      return registros.slice();
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

describe('EntregaRepository — recriação por competência (RN-01)', () => {
  test('recriarCompetencia substitui as Entregas anteriores da competência num único lote', () => {
    const gas = carregar();
    const acl = fakeAcl();
    const repo = new gas.EntregaRepository(acl);
    const mes = new gas.MesReferencia(2026, 7);
    repo.recriarCompetencia(mes, entregas(gas, 'maria', 2026, 7));

    repo.recriarCompetencia(
      mes,
      entregas(gas, 'maria', 2026, 7).concat(entregas(gas, 'ana', 2026, 7))
    );

    expect(acl.chamadas.substituicoes).toBe(2);
    expect(acl.registros).toHaveLength(6);
  });

  test('recriação não toca Entregas de outra competência', () => {
    const gas = carregar();
    const repo = new gas.EntregaRepository(fakeAcl());
    repo.recriarCompetencia(new gas.MesReferencia(2026, 6), entregas(gas, 'maria', 2026, 6));

    repo.recriarCompetencia(new gas.MesReferencia(2026, 7), entregas(gas, 'maria', 2026, 7));

    expect(repo.listarPor(new gas.MesReferencia(2026, 6))).toHaveLength(3);
    expect(repo.listarPor(new gas.MesReferencia(2026, 7))).toHaveLength(3);
  });

  test('falha da ACL propaga sem efeito parcial (tudo ou nada)', () => {
    const gas = carregar();
    const acl = fakeAcl();
    acl.substituirCompetencia = () => {
      throw new Error('falha física de escrita');
    };
    const repo = new gas.EntregaRepository(acl);

    expect(() =>
      repo.recriarCompetencia(new gas.MesReferencia(2026, 7), entregas(gas, 'maria', 2026, 7))
    ).toThrow(/falha física/);
    expect(acl.registros).toHaveLength(0);
  });
});

describe('EntregaRepository — persistência e consulta (UC-012.01/02/03)', () => {
  test('salvar faz upsert pela identidade permanente; obterPor devolve o estado salvo', () => {
    const gas = carregar();
    const repo = new gas.EntregaRepository(fakeAcl());
    const mes = new gas.MesReferencia(2026, 7);
    const lote = entregas(gas, 'maria', 2026, 7);
    repo.recriarCompetencia(mes, lote);

    lote[0].enviarMaterial('https://drive.example.com/material/reel.mp4');
    repo.salvar(lote[0]);

    const salva = repo.obterPor(mes, 'maria', 'Reels');
    expect(salva.estado).toBe('EmRevisao');
    expect(repo.listarPor(mes)).toHaveLength(3);
  });

  test('listarPor filtra por Parceira quando informada (UC-012.01)', () => {
    const gas = carregar();
    const repo = new gas.EntregaRepository(fakeAcl());
    const mes = new gas.MesReferencia(2026, 7);
    repo.recriarCompetencia(
      mes,
      entregas(gas, 'maria', 2026, 7).concat(entregas(gas, 'ana', 2026, 7))
    );

    expect(repo.listarPor(mes, 'ana')).toHaveLength(3);
    expect(repo.listarPor(mes, 'ana').every((e) => e.parceiraId === 'ana')).toBe(true);
  });

  test('obterPor sem Entrega devolve null', () => {
    const gas = carregar();
    const repo = new gas.EntregaRepository(fakeAcl());

    expect(repo.obterPor(new gas.MesReferencia(2026, 7), 'maria', 'Reels')).toBeNull();
  });
});

describe('EntregaRepository.listarPorParceira (SPEC-030 RN-04: períodos com atividade)', () => {
  test('devolve as Entregas da Parceira em TODAS as competências, ignorando outras Parceiras', () => {
    const gas = carregar();
    const repo = new gas.EntregaRepository(fakeAcl());
    repo.recriarCompetencia(new gas.MesReferencia(2026, 6), entregas(gas, 'maria', 2026, 6));
    repo.recriarCompetencia(
      new gas.MesReferencia(2026, 7),
      entregas(gas, 'maria', 2026, 7).concat(entregas(gas, 'ana', 2026, 7))
    );

    const daMaria = repo.listarPorParceira('maria');

    expect(daMaria).toHaveLength(6);
    expect(daMaria.every((e) => e.parceiraId === 'maria')).toBe(true);
  });

  test('Parceira sem nenhuma Entrega devolve lista vazia (CB-01)', () => {
    const gas = carregar();
    const repo = new gas.EntregaRepository(fakeAcl());

    expect(repo.listarPorParceira('fantasma')).toEqual([]);
  });
});
