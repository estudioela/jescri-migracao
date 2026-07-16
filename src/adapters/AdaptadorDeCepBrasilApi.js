/**
 * ADAPTADOR: AdaptadorDeCepBrasilApi — cumpre a porta "Adaptador de CEP"
 * (SPEC-032 §6.3; RN-01) usando o serviço externo BrasilAPI (PRD §6.1/§10).
 *
 * Contrato da porta: `resolver(cep)` devolve `{rua, bairro, cidade, uf}` em
 * caso de sucesso, ou LANÇA um Error em qualquer falha (CEP inválido,
 * serviço fora do ar, resposta malformada) — a falha é degradável por
 * inteiro no Service (RN-02/CB-01: nunca impede salvar os dados principais).
 *
 * Não pode conter regra de negócio (o que fazer com a falha é do Service).
 */

this.AdaptadorDeCepBrasilApi = class AdaptadorDeCepBrasilApi {
  /**
   * @param {string} cep CEP informado pela Parceira (com ou sem máscara).
   * @returns {{rua: string, bairro: string, cidade: string, uf: string}}
   * @throws {Error} CEP inválido ou serviço indisponível.
   */
  resolver(cep) {
    const limpo = String(cep == null ? '' : cep).replace(/\D/g, '');
    if (limpo === '') {
      throw new Error('CEP vazio — não é possível resolver o endereço.');
    }
    const resposta = UrlFetchApp.fetch('https://brasilapi.com.br/api/cep/v1/' + limpo, {
      muteHttpExceptions: true,
    });
    if (resposta.getResponseCode() !== 200) {
      throw new Error('Serviço de CEP indisponível ou CEP inexistente: ' + limpo);
    }
    const json = JSON.parse(resposta.getContentText());
    return {
      rua: String(json.street || ''),
      bairro: String(json.neighborhood || ''),
      cidade: String(json.city || ''),
      uf: String(json.state || ''),
    };
  }
};
