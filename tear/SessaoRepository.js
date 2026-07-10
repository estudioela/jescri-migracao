/**
 * Sessões e bloqueio por tentativas, sobre `CacheService`.
 *
 * Existe para que o `AuthService` não toque infraestrutura direto — mesma razão
 * pela qual o `AtivacaoService` não toca `SpreadsheetApp`. Trocar `CacheService`
 * por outra coisa na V3 muda só este arquivo.
 *
 * Todo TTL é explícito, como exige o CLAUDE.md §11.2.
 */
const SESSAO_TTL_SEGUNDOS = 21600;              // 6h de inatividade, como na V1
const SESSAO_TTL_ABSOLUTO_SEGUNDOS = 604800;    // 7 dias, renove-se quanto renovar
const LOGIN_MAX_TENTATIVAS = 5;
const LOGIN_BLOQUEIO_SEGUNDOS = 900;            // 15min
const SEPARADOR_CACHE = '|';

class SessaoRepository {
  constructor(cache) {
    this.cache = cache || CacheService.getScriptCache();
  }

  /**
   * O token é um bearer puro: quem o tiver, é a parceira. Por isso ele mora em
   * `sessionStorage` no cliente, nunca em `localStorage` — persistir além da aba
   * transforma token esquecido em sequestro de sessão.
   */
  criar(idInfluenciadora) {
    const token = Utilities.getUuid();
    const valor = String(idInfluenciadora) + SEPARADOR_CACHE + Date.now();

    this.cache.put(this._chaveSessao(token), valor, SESSAO_TTL_SEGUNDOS);

    return token;
  }

  /**
   * Renovação deslizante (morre por inatividade) COM teto absoluto: sem o teto,
   * uma aba aberta que chama o servidor a cada poucas horas mantém a sessão viva
   * para sempre, e um token roubado nunca caduca sozinho.
   */
  resolver(token) {
    if (!token) {
      return null;
    }

    const chave = this._chaveSessao(token);
    const bruto = this.cache.get(chave);

    if (!bruto) {
      return null;
    }

    const partes = String(bruto).split(SEPARADOR_CACHE);
    const idInfluenciadora = partes[0];
    const criadaEm = Number(partes[1]);

    if (!criadaEm || (Date.now() - criadaEm) / 1000 > SESSAO_TTL_ABSOLUTO_SEGUNDOS) {
      this.cache.remove(chave);
      return null;
    }

    this.cache.put(chave, bruto, SESSAO_TTL_SEGUNDOS);

    return idInfluenciadora;
  }

  destruir(token) {
    if (token) {
      this.cache.remove(this._chaveSessao(token));
    }
  }

  estaBloqueado(cupom) {
    return this._tentativas(cupom) >= LOGIN_MAX_TENTATIVAS;
  }

  /**
   * A janela de bloqueio é FIXA a partir da primeira falha. Reiniciar o TTL a
   * cada tentativa deixaria qualquer um manter a conta de uma parceira trancada
   * indefinidamente, mandando um login errado a cada 15 minutos — o cupom é
   * semi-público (é um código promocional), então o atacante sempre o conhece.
   */
  registrarTentativa(cupom) {
    const agora = Date.now();
    const atual = this._registroDeTentativas(cupom);

    const total = atual.total + 1;
    const expiraEm = atual.expiraEm || agora + LOGIN_BLOQUEIO_SEGUNDOS * 1000;
    const segundosRestantes = Math.max(1, Math.ceil((expiraEm - agora) / 1000));

    this.cache.put(
      this._chaveTentativas(cupom),
      String(total) + SEPARADOR_CACHE + expiraEm,
      segundosRestantes
    );

    return total;
  }

  limparTentativas(cupom) {
    this.cache.remove(this._chaveTentativas(cupom));
  }

  _tentativas(cupom) {
    return this._registroDeTentativas(cupom).total;
  }

  _registroDeTentativas(cupom) {
    const bruto = this.cache.get(this._chaveTentativas(cupom));

    if (!bruto) {
      return { total: 0, expiraEm: 0 };
    }

    const partes = String(bruto).split(SEPARADOR_CACHE);
    const expiraEm = Number(partes[1]) || 0;

    // O CacheService devia ter expirado sozinho; se o relógio disser que a
    // janela passou, não contamos a tentativa antiga.
    if (expiraEm && Date.now() >= expiraEm) {
      return { total: 0, expiraEm: 0 };
    }

    return { total: Number(partes[0]) || 0, expiraEm: expiraEm };
  }

  _chaveSessao(token) {
    return 'sessao:' + token;
  }

  _chaveTentativas(cupom) {
    return 'tentativas:' + String(cupom).trim().toUpperCase();
  }
}
