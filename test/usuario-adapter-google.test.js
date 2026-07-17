const { loadGas } = require('./helpers/gasHarness');

// Unidade isolada da porta "Validador de Token" (SPEC-035 §9.1.7/§14.1):
// valida o ID Token delegando ao endpoint tokeninfo do provedor, sem
// reimplementar verificação de assinatura RSA localmente.

const CLIENT_ID = 'tear-v2.apps.googleusercontent.com';
const AGORA = new Date('2026-07-17T12:00:00Z'); // epoch segundos: 1784721600

function carregar(fetchImpl) {
  const gas = loadGas(['src/adapters/ValidadorDeTokenGoogle.js'], {
    UrlFetchApp: { fetch: fetchImpl },
  });
  return { gas, adaptador: new gas.ValidadorDeTokenGoogle(CLIENT_ID) };
}

function claimsValidas(sobrescritas) {
  const agoraSegundos = Math.floor(AGORA.getTime() / 1000);
  return Object.assign(
    {
      sub: 'sub-123',
      email: 'maria@exemplo.com',
      name: 'Maria Silva',
      aud: CLIENT_ID,
      iss: 'accounts.google.com',
      exp: agoraSegundos + 3600,
      iat: agoraSegundos - 60,
    },
    sobrescritas || {}
  );
}

function respostaOk(claims) {
  return { getResponseCode: () => 200, getContentText: () => JSON.stringify(claims) };
}

describe('ValidadorDeTokenGoogle — porta de identidade federada (§9.1.7/§14.1)', () => {
  test('token válido: devolve {sub, email, name} e consulta o endpoint oficial', () => {
    let urlChamada;
    const { adaptador } = carregar((url) => {
      urlChamada = url;
      return respostaOk(claimsValidas());
    });

    const identidade = adaptador.validar('id-token-valido', AGORA);

    expect(urlChamada).toContain('https://oauth2.googleapis.com/tokeninfo?id_token=');
    expect(identidade).toEqual({
      sub: 'sub-123',
      email: 'maria@exemplo.com',
      name: 'Maria Silva',
    });
  });

  test('token vazio lança Error sem chamar o serviço externo', () => {
    const fetch = jest.fn();
    const { adaptador } = carregar(fetch);

    expect(() => adaptador.validar('', AGORA)).toThrow(/ERR_AUTH_INVALID_TOKEN/);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('provedor rejeita o token (status != 200) → ERR_AUTH_INVALID_TOKEN', () => {
    const { adaptador } = carregar(() => ({
      getResponseCode: () => 400,
      getContentText: () => '{"error_description":"Invalid Value"}',
    }));

    expect(() => adaptador.validar('token-forjado', AGORA)).toThrow(/ERR_AUTH_INVALID_TOKEN/);
  });

  test('aud diferente do client_id do TEAR é rejeitado (confusão de token)', () => {
    const { adaptador } = carregar(() => respostaOk(claimsValidas({ aud: 'outro-app.apps.googleusercontent.com' })));

    expect(() => adaptador.validar('token-de-outro-app', AGORA)).toThrow(/ERR_AUTH_INVALID_TOKEN/);
  });

  test('iss fora do provedor oficial é rejeitado', () => {
    const { adaptador } = carregar(() => respostaOk(claimsValidas({ iss: 'https://evil.example.com' })));

    expect(() => adaptador.validar('token', AGORA)).toThrow(/ERR_AUTH_INVALID_TOKEN/);
  });

  test('token expirado (exp no passado) é rejeitado', () => {
    const agoraSegundos = Math.floor(AGORA.getTime() / 1000);
    const { adaptador } = carregar(() => respostaOk(claimsValidas({ exp: agoraSegundos - 10 })));

    expect(() => adaptador.validar('token-expirado', AGORA)).toThrow(/ERR_AUTH_INVALID_TOKEN/);
  });

  test('token emitido no futuro (iat adiantado) é rejeitado', () => {
    const agoraSegundos = Math.floor(AGORA.getTime() / 1000);
    const { adaptador } = carregar(() => respostaOk(claimsValidas({ iat: agoraSegundos + 600 })));

    expect(() => adaptador.validar('token-do-futuro', AGORA)).toThrow(/ERR_AUTH_INVALID_TOKEN/);
  });

  test('sub ausente no payload é rejeitado', () => {
    const { adaptador } = carregar(() => respostaOk(claimsValidas({ sub: undefined })));

    expect(() => adaptador.validar('token-sem-sub', AGORA)).toThrow(/ERR_AUTH_INVALID_TOKEN/);
  });

  test('aceita iss como https://accounts.google.com (forma alternativa)', () => {
    const { adaptador } = carregar(() => respostaOk(claimsValidas({ iss: 'https://accounts.google.com' })));

    expect(() => adaptador.validar('token', AGORA)).not.toThrow();
  });
});
