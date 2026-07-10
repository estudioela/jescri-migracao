/**
 * Autenticação da V2.
 *
 * Nenhum DTO daqui carrega `Senha_Hash`. Nenhuma mensagem de erro distingue
 * "cupom não existe" de "senha errada": a diferença permitiria enumerar
 * parceiras cadastradas.
 */
/** Formato `salt$hash` válido, senha nenhuma. Só existe para gastar o mesmo tempo. */
const HASH_FICTICIO_PARA_TEMPO_CONSTANTE =
  '00000000-0000-0000-0000-000000000000$' +
  '0000000000000000000000000000000000000000000000000000000000000000';

class AuthService {
  constructor(parceiroRepository, sessaoRepository) {
    if (!parceiroRepository || !sessaoRepository) {
      throw new TypeError('AuthService exige ParceiroRepository e SessaoRepository.');
    }

    this.parceiroRepository = parceiroRepository;
    this.sessaoRepository = sessaoRepository;
  }

  login(cupom, senha) {
    if (!cupom || !senha) {
      throw new Error('Informe o cupom e a senha.');
    }

    if (this.sessaoRepository.estaBloqueado(cupom)) {
      throw new Error('Muitas tentativas. Tente novamente em alguns minutos.');
    }

    const parceiro = this.parceiroRepository.findByCupom(cupom);

    // Hash fictício, com formato válido, para cupom inexistente: sem ele, o
    // caminho "não existe" não calcularia SHA-256 e responderia mais rápido que
    // "senha errada" — um oráculo de tempo que permite enumerar cupons apesar
    // de as mensagens serem idênticas.
    const armazenado = parceiro
      ? parceiro[CAMPOS_PARCEIRO.SENHA_HASH]
      : HASH_FICTICIO_PARA_TEMPO_CONSTANTE;

    const senhaCorreta = senhaConfere(senha, armazenado);

    // Uma parceira sem senha definida não loga — a aba nasce sem credencial.
    if (!parceiro || !senhaCorreta) {
      this.sessaoRepository.registrarTentativa(cupom);
      throw new Error('Cupom ou senha inválidos.');
    }

    this.sessaoRepository.limparTentativas(cupom);

    return {
      token: this.sessaoRepository.criar(parceiro[CAMPOS_PARCEIRO.ID]),
      perfil: this._paraDto(parceiro)
    };
  }

  sessaoAtual(token) {
    const idInfluenciadora = this.sessaoRepository.resolver(token);

    if (!idInfluenciadora) {
      throw new Error('Sessão expirada. Entre novamente.');
    }

    const parceiro = this.parceiroRepository.getById(idInfluenciadora);

    if (!parceiro) {
      throw new Error('Sessão expirada. Entre novamente.');
    }

    return this._paraDto(parceiro);
  }

  logout(token) {
    this.sessaoRepository.destruir(token);

    return { encerrada: true };
  }

  /** `Senha_Hash` e `Cupom` não saem daqui. */
  _paraDto(parceiro) {
    return {
      idInfluenciadora: this._texto(parceiro[CAMPOS_PARCEIRO.ID]),
      nome: this._texto(parceiro[CAMPOS_PARCEIRO.NOME]),
      statusContrato: this._texto(parceiro[CAMPOS_PARCEIRO.STATUS_CONTRATO]),
      categoria: this._texto(parceiro[CAMPOS_PARCEIRO.CATEGORIA])
    };
  }

  _texto(valor) {
    return valor === null || valor === undefined ? '' : String(valor);
  }
}
