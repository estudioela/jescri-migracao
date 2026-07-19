const { loadGas } = require('./helpers/gasHarness');

// Unidade isolada da porta "Adaptador de CEP" (SPEC-032 §6.3; RN-01/RN-02).
// Até aqui só era exercitado indiretamente via test/perfil-portal.test.js
// (slice ponta a ponta com PerfilPortalService) — este arquivo cobre o
// contrato do próprio adaptador (parsing da resposta da BrasilAPI e os dois
// modos de falha) isolado de UrlFetchApp, sem depender do Service.

function carregar(fetchImpl) {
  const gas = loadGas(['src/modulos/Parceira.js'], {
    UrlFetchApp: { fetch: fetchImpl },
  });
  return { gas, adaptador: new gas.AdaptadorDeCepBrasilApi() };
}

describe('AdaptadorDeCepBrasilApi — porta de CEP (RN-01/RN-02)', () => {
  test('resolve CEP mascarado consultando a BrasilAPI e parseando street/neighborhood/city/state', () => {
    let urlChamada;
    const { adaptador } = carregar((url) => {
      urlChamada = url;
      return {
        getResponseCode: () => 200,
        getContentText: () =>
          JSON.stringify({
            street: 'Avenida Paulista',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
          }),
      };
    });

    const endereco = adaptador.resolver('01310-100');

    expect(urlChamada).toBe('https://brasilapi.com.br/api/cep/v1/01310100');
    expect(endereco).toEqual({
      rua: 'Avenida Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });
  });

  test('CEP vazio lança Error sem chamar o serviço externo', () => {
    const fetch = jest.fn();
    const { adaptador } = carregar(fetch);

    expect(() => adaptador.resolver('')).toThrow(/CEP vazio/);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('resposta com status diferente de 200 lança Error (serviço indisponível ou CEP inexistente)', () => {
    const { adaptador } = carregar(() => ({
      getResponseCode: () => 404,
      getContentText: () => '{"message":"not found"}',
    }));

    expect(() => adaptador.resolver('00000000')).toThrow(/indisponível ou CEP inexistente/);
  });
});
