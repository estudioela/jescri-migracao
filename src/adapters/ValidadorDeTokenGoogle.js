/**
 * ADAPTADOR: ValidadorDeTokenGoogle — cumpre a porta de verificação de
 * identidade federada (SPEC-035 §9.1.7/§14.1).
 *
 * Delega a validação de assinatura ao endpoint oficial `tokeninfo` do
 * provedor de identidade (o Apps Script não expõe verificação de
 * assinatura RSA nativamente) e confere, além disso, `aud` (client_id do
 * TEAR — evita confusão de token entre aplicações), `iss` (emissor
 * oficial) e a janela temporal (`exp`/`iat`).
 *
 * Fail-closed: qualquer falha (rede, assinatura, aud, iss, exp, iat, sub
 * ausente) lança Error com o código do contrato (§14.3
 * ERR_AUTH_INVALID_TOKEN) — nunca devolve identidade parcial.
 *
 * Não pode conter regra de negócio de identidade/estado (isso é do
 * Service) nem reaproveitar Autenticador/Credencial/JanelaDeBloqueio
 * (SPEC-025) — decisão justificada em SPEC-035 §9.2-A: bloqueio por
 * tentativas mitiga segredo adivinhável; não se aplica a token assinado
 * criptograficamente.
 */

this.ValidadorDeTokenGoogle = class ValidadorDeTokenGoogle {
  /** Emissores aceitos pelo provedor (ambas as formas são válidas). */
  static get EMISSORES_ACEITOS() {
    return ['accounts.google.com', 'https://accounts.google.com'];
  }

  /** @param {string} clientId client_id OAuth2 do TEAR (Config.js). */
  constructor(clientId) {
    this.clientId = String(clientId == null ? '' : clientId).trim();
  }

  /**
   * @param {string} idToken ID Token bruto vindo do frontend.
   * @param {Date} agora instante da validação (determinístico/testável).
   * @returns {{sub: string, email: string, name: string}}
   * @throws {Error} ERR_AUTH_INVALID_TOKEN em qualquer falha.
   */
  validar(idToken, agora) {
    const token = String(idToken == null ? '' : idToken).trim();
    if (!token) {
      throw this.erroInvalido('token vazio');
    }
    const resposta = UrlFetchApp.fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token),
      { muteHttpExceptions: true }
    );
    if (resposta.getResponseCode() !== 200) {
      throw this.erroInvalido('token rejeitado pelo provedor de identidade');
    }
    let claims;
    try {
      claims = JSON.parse(resposta.getContentText());
    } catch {
      throw this.erroInvalido('resposta malformada do provedor de identidade');
    }
    if (!claims || claims.aud !== this.clientId) {
      throw this.erroInvalido('audience não corresponde ao client_id do TEAR');
    }
    if (ValidadorDeTokenGoogle.EMISSORES_ACEITOS.indexOf(claims.iss) === -1) {
      throw this.erroInvalido('emissor não reconhecido');
    }
    const agoraSegundos = agora.getTime() / 1000;
    const exp = Number(claims.exp);
    const iat = Number(claims.iat);
    if (!exp || exp <= agoraSegundos) {
      throw this.erroInvalido('token expirado');
    }
    if (!iat || iat > agoraSegundos) {
      throw this.erroInvalido('token emitido no futuro');
    }
    const sub = String(claims.sub == null ? '' : claims.sub).trim();
    if (!sub) {
      throw this.erroInvalido('claim sub ausente');
    }
    return {
      sub: sub,
      email: String(claims.email == null ? '' : claims.email).trim(),
      name: String(claims.name == null ? '' : claims.name).trim(),
    };
  }

  /**
   * @param {string} motivo mensagem interna (nunca inclui o token — PII/segredo).
   * @returns {Error} erro com o código do contrato (§14.3).
   */
  erroInvalido(motivo) {
    const erro = new Error('ERR_AUTH_INVALID_TOKEN: ' + motivo + '.');
    erro.codigo = 'ERR_AUTH_INVALID_TOKEN';
    return erro;
  }
};
