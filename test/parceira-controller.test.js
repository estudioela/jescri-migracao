const { loadGas } = require('./helpers/gasHarness');

function novoController(service) {
  const gas = loadGas([
    'src/shared/Nucleo.js',
    'src/modulos/Parceira.js',
  ]);
  return new gas.ParceiraController(service);
}

describe('ParceiraController.cadastrar', () => {
  test('sucesso: devolve envelope {success, data} com a projeção da Parceira', () => {
    const service = { executar: () => ({ nome: 'Maria', estado: 'Inativa' }) };
    const controller = novoController(service);

    const resposta = controller.cadastrar({ nome: 'Maria' });

    expect(resposta).toEqual({
      success: true,
      data: { nome: 'Maria', estado: 'Inativa' },
    });
  });

  test('encaminha os dados recebidos ao service', () => {
    const recebidos = [];
    const service = {
      executar: (dados) => { recebidos.push(dados); return { nome: 'Ana', estado: 'Inativa' }; },
    };
    const controller = novoController(service);

    controller.cadastrar({ nome: 'Ana' });

    expect(recebidos).toEqual([{ nome: 'Ana' }]);
  });

  test('falha: converte erro do service em envelope {success:false, error}', () => {
    const service = { executar: () => { throw new Error('Parceira exige nome (identidade INFLU_KEY).'); } };
    const controller = novoController(service);

    const resposta = controller.cadastrar({});

    expect(resposta.success).toBe(false);
    expect(resposta.error.mensagem).toMatch(/nome/i);
  });
});
