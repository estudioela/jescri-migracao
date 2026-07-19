const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/shared/Nucleo.js',
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Parceira.js',
  ]);
}

function montar(gas, parceiras) {
  const registros = [];
  const acl = {
    inserirEmLote: (cs) => cs.forEach((c) => registros.push(c)),
    listarTodas: () => registros.slice(),
  };
  const servico = new gas.CompiladorDoMes(
    { listarAtivasComCondicoes: () => parceiras },
    new gas.ColaboracaoMensalRepository(acl),
    { publicar: () => {} }
  );
  return new gas.ColaboracaoMensalController(servico);
}

const PARCEIRAS = [
  {
    parceiraId: 'maria',
    condicoes: {
      valorMensal: 3500,
      formatosContratados: ['Reels'],
      quantidadePorFormato: { Reels: 2 },
    },
  },
];

describe('ColaboracaoMensalController — envelope padrão (§3.3)', () => {
  test('sucesso devolve {success,data} com projeção serializável, nunca o domínio', () => {
    const gas = carregar();
    const controller = montar(gas, PARCEIRAS);

    const resposta = controller.compilarMes({ mesReferencia: '2026-07' });

    expect(resposta.success).toBe(true);
    expect(resposta.data.mesReferencia).toBe('2026-07');
    expect(resposta.data.jaCompilada).toBe(false);
    expect(resposta.data.colaboracoes).toEqual([
      {
        parceiraId: 'maria',
        mesReferencia: '2026-07',
        estado: 'Ativa',
        snapshot: {
          valorMensal: 3500,
          formatosContratados: ['Reels'],
          quantidadePorFormato: { Reels: 2 },
        },
      },
    ]);
    expect(resposta.data.colaboracoes[0] instanceof gas.ColaboracaoMensal).toBe(false);
  });

  test('recompilação devolve sucesso marcado como já compilada (C-02)', () => {
    const gas = carregar();
    const controller = montar(gas, PARCEIRAS);

    controller.compilarMes({ mesReferencia: '2026-07' });
    const segunda = controller.compilarMes({ mesReferencia: '2026-07' });

    expect(segunda.success).toBe(true);
    expect(segunda.data.jaCompilada).toBe(true);
    expect(segunda.data.colaboracoes).toHaveLength(1);
  });

  test('erro de domínio vira {success:false,error.mensagem} (nunca exceção crua)', () => {
    const gas = carregar();
    const controller = montar(gas, PARCEIRAS);

    const resposta = controller.compilarMes({ mesReferencia: '2026-13' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/CM-02/);
  });

  test('dados ausentes viram envelope de falha', () => {
    const gas = carregar();
    const controller = montar(gas, PARCEIRAS);

    const resposta = controller.compilarMes();

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/CM-02/);
  });
});
