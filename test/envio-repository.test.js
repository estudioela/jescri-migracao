const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Envio.js',
  ]);
}

// Fake da porta da ACL do Envio: substituição atômica por competência,
// upsert individual e leitura completa. Mantém o Repository cego à planilha.
function fakeAcl() {
  let registros = [];
  const chamadas = { substituicoes: 0 };
  return {
    get registros() {
      return registros;
    },
    chamadas,
    substituirCompetencia(mesReferencia, envios) {
      chamadas.substituicoes += 1;
      registros = registros.filter((e) => !e.mesReferencia.igualA(mesReferencia)).concat(envios);
    },
    salvar(envio) {
      registros = registros.filter((e) => !e.igualA(envio)).concat([envio]);
    },
    listarTodos() {
      return registros.slice();
    },
  };
}

function envios(gas, parceiraIds, ano, mes) {
  return parceiraIds.map((id) => new gas.Envio(id, new gas.MesReferencia(ano, mes)));
}

describe('EnvioRepository — recriação por competência (RN-01)', () => {
  test('recriarCompetencia substitui os Envios anteriores da competência num único lote', () => {
    const gas = carregar();
    const acl = fakeAcl();
    const repo = new gas.EnvioRepository(acl);
    const mes = new gas.MesReferencia(2026, 7);
    repo.recriarCompetencia(mes, envios(gas, ['maria'], 2026, 7));

    repo.recriarCompetencia(mes, envios(gas, ['maria', 'ana'], 2026, 7));

    expect(acl.chamadas.substituicoes).toBe(2);
    expect(acl.registros).toHaveLength(2);
  });

  test('recriação não toca Envios de outra competência', () => {
    const gas = carregar();
    const repo = new gas.EnvioRepository(fakeAcl());
    repo.recriarCompetencia(new gas.MesReferencia(2026, 6), envios(gas, ['maria'], 2026, 6));

    repo.recriarCompetencia(new gas.MesReferencia(2026, 7), envios(gas, ['maria'], 2026, 7));

    expect(repo.listarPor(new gas.MesReferencia(2026, 6))).toHaveLength(1);
    expect(repo.listarPor(new gas.MesReferencia(2026, 7))).toHaveLength(1);
  });

  test('falha da ACL propaga sem efeito parcial (tudo ou nada)', () => {
    const gas = carregar();
    const acl = fakeAcl();
    acl.substituirCompetencia = () => {
      throw new Error('falha física de escrita');
    };
    const repo = new gas.EnvioRepository(acl);

    expect(() =>
      repo.recriarCompetencia(new gas.MesReferencia(2026, 7), envios(gas, ['maria'], 2026, 7))
    ).toThrow(/falha física/);
    expect(acl.registros).toHaveLength(0);
  });
});

describe('EnvioRepository — persistência e consulta (UC-016.01/02/03)', () => {
  test('salvar faz upsert pela identidade permanente; obterPor devolve o estado salvo', () => {
    const gas = carregar();
    const repo = new gas.EnvioRepository(fakeAcl());
    const mes = new gas.MesReferencia(2026, 7);
    const [envio] = envios(gas, ['maria'], 2026, 7);
    repo.recriarCompetencia(mes, [envio]);

    envio.confirmarEndereco();
    repo.salvar(envio);

    const salvo = repo.obterPor(mes, 'maria');
    expect(salvo.revisao).toBe('Confirmado');
    expect(repo.listarPor(mes)).toHaveLength(1);
  });

  test('listarPor filtra por Parceira quando informada', () => {
    const gas = carregar();
    const repo = new gas.EnvioRepository(fakeAcl());
    const mes = new gas.MesReferencia(2026, 7);
    repo.recriarCompetencia(mes, envios(gas, ['maria', 'ana'], 2026, 7));

    expect(repo.listarPor(mes, 'ana')).toHaveLength(1);
    expect(repo.listarPor(mes, 'ana')[0].parceiraId).toBe('ana');
  });

  test('obterPor sem Envio devolve null', () => {
    const gas = carregar();
    const repo = new gas.EnvioRepository(fakeAcl());

    expect(repo.obterPor(new gas.MesReferencia(2026, 7), 'maria')).toBeNull();
  });
});
