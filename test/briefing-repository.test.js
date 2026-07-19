const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
    'src/modulos/Briefing.js',
  ]);
}

// Fake da porta da ACL do Briefing: substituição atômica por competência,
// upsert individual e leitura completa. Mantém o Repository cego à planilha.
function fakeAcl() {
  let registros = [];
  const chamadas = { substituicoes: 0 };
  return {
    get registros() {
      return registros;
    },
    chamadas,
    substituirCompetencia(mesReferencia, briefings) {
      chamadas.substituicoes += 1;
      registros = registros
        .filter((b) => !b.mesReferencia.igualA(mesReferencia))
        .concat(briefings);
    },
    salvar(briefing) {
      registros = registros.filter((b) => !b.igualA(briefing)).concat([briefing]);
    },
    listarTodos() {
      return registros.slice();
    },
  };
}

function rascunho(gas, parceiraId, ano, mes) {
  return gas.Briefing.criarRascunho(
    parceiraId,
    new gas.MesReferencia(ano, mes),
    new gas.CondicaoComercialSnapshot({
      valorMensal: 1000,
      formatosContratados: ['Reels'],
      quantidadePorFormato: { Reels: 1 },
    })
  );
}

describe('BriefingRepository — recriação por compilação (RN-03/CB-02)', () => {
  test('recriarCompetencia substitui os briefings anteriores da competência num único lote', () => {
    const gas = carregar();
    const acl = fakeAcl();
    const repo = new gas.BriefingRepository(acl);
    const mes = new gas.MesReferencia(2026, 7);
    const anterior = rascunho(gas, 'maria', 2026, 7);
    anterior.preencherBloco('Reels', {
      look: 'Look antigo',
      dataEntrega: new Date(2026, 6, 10),
      dataPostagem: new Date(2026, 6, 22),
    });
    repo.recriarCompetencia(mes, [anterior]);

    // Nova compilação: o rascunho anterior (mesmo preenchido) é limpo (CB-02).
    repo.recriarCompetencia(mes, [rascunho(gas, 'maria', 2026, 7), rascunho(gas, 'ana', 2026, 7)]);

    expect(acl.chamadas.substituicoes).toBe(2);
    expect(acl.registros).toHaveLength(2);
    const deMaria = repo.obterPor(mes, 'maria');
    expect(deMaria.blocos[0].estaPreenchido()).toBe(false);
  });

  test('recriação não toca briefings de outra competência', () => {
    const gas = carregar();
    const repo = new gas.BriefingRepository(fakeAcl());
    repo.recriarCompetencia(new gas.MesReferencia(2026, 6), [rascunho(gas, 'maria', 2026, 6)]);

    repo.recriarCompetencia(new gas.MesReferencia(2026, 7), [rascunho(gas, 'maria', 2026, 7)]);

    expect(repo.obterPor(new gas.MesReferencia(2026, 6), 'maria')).not.toBeNull();
    expect(repo.obterPor(new gas.MesReferencia(2026, 7), 'maria')).not.toBeNull();
  });

  test('falha da ACL propaga sem efeito parcial (tudo ou nada)', () => {
    const gas = carregar();
    const acl = fakeAcl();
    acl.substituirCompetencia = () => {
      throw new Error('falha física de escrita');
    };
    const repo = new gas.BriefingRepository(acl);

    expect(() =>
      repo.recriarCompetencia(new gas.MesReferencia(2026, 7), [rascunho(gas, 'maria', 2026, 7)])
    ).toThrow(/falha física/);
    expect(acl.registros).toHaveLength(0);
  });
});

describe('BriefingRepository — persistência e consulta (UC-009.01)', () => {
  test('salvar faz upsert por identidade natural; obterPor devolve o estado salvo', () => {
    const gas = carregar();
    const repo = new gas.BriefingRepository(fakeAcl());
    const mes = new gas.MesReferencia(2026, 7);
    const briefing = rascunho(gas, 'maria', 2026, 7);
    repo.recriarCompetencia(mes, [briefing]);

    briefing.preencherBloco('Reels', {
      look: 'Look 3',
      dataEntrega: new Date(2026, 6, 10),
      dataPostagem: new Date(2026, 6, 22),
    });
    briefing.publicar();
    repo.salvar(briefing);

    const salvo = repo.obterPor(mes, 'maria');
    expect(salvo.estado).toBe('Publicado');
  });

  test('obterPor sem briefing devolve null', () => {
    const gas = carregar();
    const repo = new gas.BriefingRepository(fakeAcl());

    expect(repo.obterPor(new gas.MesReferencia(2026, 7), 'maria')).toBeNull();
  });
});
