const { loadGas } = require('./helpers/gasHarness');

// Domínio da SPEC-032 "Perfil no Portal da Parceira": PIX e Endereco.
// Ao contrário de EnderecoDeEntrega (SPEC-016, INV-04), aqui o destino do
// valor é a própria tela da Parceira (UC-032.01) — por isso NÃO deve haver
// masking de toString/toJSON. Os testes de "sem masking" abaixo são uma
// checagem de regressão direta contra esse contrato.

function montar() {
  return loadGas([, 'src/modulos/Parceira.js']);
}

describe('PIX (SPEC-032 §6.1)', () => {
  test('guarda a chave PIX trimada em .valor', () => {
    const gas = montar();

    const pix = new gas.PIX('  chave-pix-maria  ');

    expect(pix.valor).toBe('chave-pix-maria');
  });

  test('chave vazia/nula/indefinida falha barulhento', () => {
    const gas = montar();

    expect(() => new gas.PIX('')).toThrow();
    expect(() => new gas.PIX('   ')).toThrow();
    expect(() => new gas.PIX(null)).toThrow();
    expect(() => new gas.PIX(undefined)).toThrow();
  });

  test('igualA compara pelo valor', () => {
    const gas = montar();
    const a = new gas.PIX('chave-x');
    const b = new gas.PIX('chave-x');
    const c = new gas.PIX('chave-y');

    expect(a.igualA(b)).toBe(true);
    expect(a.igualA(c)).toBe(false);
    expect(a.igualA({ valor: 'chave-x' })).toBe(false);
  });

  test('SEM masking: JSON.stringify revela o valor real (diferente de EnderecoDeEntrega/INV-04)', () => {
    const gas = montar();
    const pix = new gas.PIX('chave-pix-maria');

    expect(JSON.stringify(pix)).toBe(JSON.stringify({ valor: 'chave-pix-maria' }));
    expect(JSON.stringify(pix)).not.toMatch(/PROTEGID[OA]/);
  });
});

describe('Endereco (SPEC-032 §6.1)', () => {
  test('CEP vazio/nulo falha barulhento', () => {
    const gas = montar();

    expect(() => new gas.Endereco({ cep: '' })).toThrow();
    expect(() => new gas.Endereco({ cep: null })).toThrow();
    expect(() => new gas.Endereco({})).toThrow();
    expect(() => new gas.Endereco()).toThrow();
  });

  test('campos viram string trim, com default vazio quando ausentes', () => {
    const gas = montar();

    const endereco = new gas.Endereco({ cep: ' 01310-100 ' });

    expect(endereco.cep).toBe('01310-100');
    expect(endereco.numero).toBe('');
    expect(endereco.complemento).toBe('');
    expect(endereco.rua).toBe('');
    expect(endereco.bairro).toBe('');
    expect(endereco.cidade).toBe('');
    expect(endereco.uf).toBe('');
  });

  test('campos fornecidos são trimados', () => {
    const gas = montar();

    const endereco = new gas.Endereco({
      cep: '01310-100',
      numero: ' 1000 ',
      complemento: ' Sala 1 ',
      rua: ' Avenida Paulista ',
      bairro: ' Bela Vista ',
      cidade: ' São Paulo ',
      uf: ' SP ',
    });

    expect(endereco.numero).toBe('1000');
    expect(endereco.complemento).toBe('Sala 1');
    expect(endereco.rua).toBe('Avenida Paulista');
    expect(endereco.bairro).toBe('Bela Vista');
    expect(endereco.cidade).toBe('São Paulo');
    expect(endereco.uf).toBe('SP');
  });

  describe('completo()', () => {
    test('true somente quando rua/bairro/cidade/uf estão todos preenchidos', () => {
      const gas = montar();

      const endereco = new gas.Endereco({
        cep: '01310-100',
        rua: 'Avenida Paulista',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
      });

      expect(endereco.completo()).toBe(true);
    });

    test('false quando qualquer um dos quatro está faltando (CB-01: CEP resolvido parcialmente)', () => {
      const gas = montar();

      expect(new gas.Endereco({ cep: '01310-100' }).completo()).toBe(false);
      expect(
        new gas.Endereco({
          cep: '01310-100',
          rua: 'Avenida Paulista',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: '',
        }).completo()
      ).toBe(false);
    });
  });

  test('SEM masking: JSON.stringify revela os valores reais (diferente de EnderecoDeEntrega/INV-04)', () => {
    const gas = montar();
    const endereco = new gas.Endereco({
      cep: '01310-100',
      numero: '1000',
      rua: 'Avenida Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });

    const serializado = JSON.parse(JSON.stringify(endereco));

    expect(serializado.rua).toBe('Avenida Paulista');
    expect(serializado.cep).toBe('01310-100');
    expect(JSON.stringify(endereco)).not.toMatch(/PROTEGID[OA]/);
  });
});
