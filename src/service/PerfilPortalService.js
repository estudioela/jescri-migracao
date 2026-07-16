/**
 * SERVICE: PerfilPortalService — fachada do Perfil no Portal (SPEC-032
 * UC-032.01/02/03).
 *
 * "Opera sobre o agregado Parceira, restrito aos campos de perfil" (§6.2):
 * não recria a entidade Parceira nem reescreve a linha inteira — lê/escreve
 * só os campos de perfil via as novas portas de ParceiraACL
 * (obterPerfil/atualizarPerfil, SPEC-032). Mesmo padrão de isolamento de
 * PortalDeConteudoService (SPEC-027): o parceiraId NUNCA vem do comando
 * externo, sempre da Sessão resolvida pelo token (RN-03/INV-01, Q-09).
 *
 * RN-01/RN-02 (CEP degradável): a falha do Adaptador de CEP nunca impede
 * salvar PIX/e-mail/CEP/número/complemento — só deixa rua/bairro/cidade/uf
 * incompletos (CB-01). PP-03 (§17) é portanto um AVISO dentro do envelope
 * de sucesso, nunca uma exceção lançada — lançar quebraria RN-02.
 *
 * DÍVIDA REGISTRADA (achado da revisão arquitetural): esta é a primeira
 * operação sob a trava global do Portal (`comTravaDeAcesso`, entrypoint)
 * que pode fazer uma chamada HTTP síncrona (adaptadorDeCep, quando o CEP
 * muda) — GAS não permite configurar timeout em UrlFetchApp. Mitigado
 * chamando o adaptador só quando o CEP de fato mudou (não a cada edição de
 * perfil), mas o acoplamento trava-global + chamada externa síncrona
 * permanece; resolver de vez exige mover a resolução de CEP para fora da
 * trava (ADR futuro) ou trocar o lock global por lock por-Parceira.
 *
 * Não pode: tocar SpreadsheetApp; conhecer coluna física; formatar envelope.
 *
 * @param {AcessoPortalService} acessoPortalService resolve token → Sessão (SPEC-025).
 * @param {ParceiraACL} parceiraACL portas de leitura/escrita do perfil (SPEC-032).
 * @param {object} adaptadorDeCep porta de CEP: resolver(cep) → {rua,bairro,cidade,uf} ou lança.
 */

/**
 * @param {string} codigo código do contrato de erros (SPEC-032 §17).
 * @param {string} mensagem mensagem SEM PII (mesma disciplina de SPEC-025 RN-04).
 * @returns {Error} erro com `codigo` anexado para o Controller.
 */
function erroDePerfilPortal(codigo, mensagem) {
  const erro = new Error(mensagem);
  erro.codigo = codigo;
  return erro;
}

this.PerfilPortalService = class PerfilPortalService {
  constructor(acessoPortalService, parceiraACL, adaptadorDeCep) {
    this.acessoPortalService = acessoPortalService;
    this.parceiraACL = parceiraACL;
    this.adaptadorDeCep = adaptadorDeCep;
  }

  /**
   * Resolve o token na Sessão ativa (RN-03: única fonte do parceiraId).
   * @param {string} token
   * @returns {Sessao}
   * @throws {Error} PP-01 sessão inválida/expirada (§17).
   */
  resolverSessao(token) {
    try {
      return this.acessoPortalService.renovar({ token: token });
    } catch {
      throw erroDePerfilPortal('PP-01', 'Sessão inválida ou expirada.');
    }
  }

  /**
   * Projeta o perfil cru da ACL nas VOs de domínio (§6.1). Campo ausente/
   * vazio vira `null` — não construir PIX/Endereco com string vazia.
   * @param {{email: string, pix: string, cep: string, numero: string,
   *   complemento: string, rua: string, bairro: string, cidade: string,
   *   uf: string}|null} perfilCru
   * @returns {{email: (string|null), pix: (PIX|null), endereco: (Endereco|null)}}
   */
  projetar(perfilCru) {
    const cru = perfilCru || {
      email: '',
      pix: '',
      cep: '',
      numero: '',
      complemento: '',
      rua: '',
      bairro: '',
      cidade: '',
      uf: '',
    };
    return {
      email: cru.email !== '' ? cru.email : null,
      pix: cru.pix !== '' ? new PIX(cru.pix) : null,
      endereco: cru.cep !== '' ? new Endereco(cru) : null,
    };
  }

  /**
   * UC-032.01 · Ver perfil: PIX, e-mail e endereço atuais da Parceira
   * autenticada.
   * @param {{token: string}} dados
   * @returns {{email: (string|null), pix: (PIX|null), endereco: (Endereco|null)}}
   * @throws {Error} PP-01 sessão inválida/expirada.
   */
  verPerfil(dados) {
    const sessao = this.resolverSessao(dados && dados.token);
    return this.projetar(this.parceiraACL.obterPerfil(sessao.parceiraId));
  }

  /**
   * UC-032.02/03 · Editar PIX/e-mail e/ou endereço (por CEP) da Parceira
   * autenticada. RN-04: campos comerciais NUNCA são representáveis neste
   * comando — qualquer chave fora da lista permitida é recusada (PP-02),
   * antes mesmo de tocar a planilha (CB-02).
   * @param {{token: string, pix: (string|undefined), email: (string|undefined),
   *   cep: (string|undefined), numero: (string|undefined),
   *   complemento: (string|undefined)}} dados
   * @returns {{email: (string|null), pix: (PIX|null), endereco: (Endereco|null)}}
   * @throws {Error} PP-01 sessão inválida; PP-02 campo não permitido.
   */
  editarPerfil(dados) {
    const sessao = this.resolverSessao(dados && dados.token);
    const permitidos = ['token', 'pix', 'email', 'cep', 'numero', 'complemento'];
    const seguro = dados || {};
    const invalido = Object.keys(seguro).find((chave) => permitidos.indexOf(chave) === -1);
    if (invalido) {
      throw erroDePerfilPortal(
        'PP-02',
        "Campo não permitido na edição de perfil: '" + invalido + "'."
      );
    }

    const campos = {};
    if (seguro.email !== undefined) {
      campos.email = String(seguro.email == null ? '' : seguro.email).trim();
    }
    if (seguro.pix !== undefined) {
      campos.pix = String(seguro.pix == null ? '' : seguro.pix).trim();
    }

    const enderecoMudou =
      seguro.cep !== undefined || seguro.numero !== undefined || seguro.complemento !== undefined;
    if (enderecoMudou) {
      Object.assign(campos, this.recomporEndereco(sessao.parceiraId, seguro));
    }

    this.parceiraACL.atualizarPerfil(sessao.parceiraId, campos);
    return this.projetar(this.parceiraACL.obterPerfil(sessao.parceiraId));
  }

  /**
   * RN-01/RN-02/CB-01: recompõe rua/bairro/cidade/uf a partir do CEP.
   * Falha do adaptador nunca impede salvar (RN-02): se o CEP mudou, o
   * endereço fica incompleto (zera rua/bairro/cidade/uf); se só
   * número/complemento mudaram, preserva o último endereço resolvido.
   * @param {string} parceiraId
   * @param {{cep: (string|undefined), numero: (string|undefined),
   *   complemento: (string|undefined)}} dados
   * @returns {object} campos físicos a persistir (cep/numero/complemento/
   *   rua/bairro/cidade/uf/enderecoCompleto).
   */
  recomporEndereco(parceiraId, dados) {
    const atual = this.parceiraACL.obterPerfil(parceiraId) || {
      cep: '',
      numero: '',
      complemento: '',
      rua: '',
      bairro: '',
      cidade: '',
      uf: '',
    };
    const cep =
      dados.cep !== undefined ? String(dados.cep == null ? '' : dados.cep).trim() : atual.cep;
    const cepMudou = cep !== atual.cep;
    const campos = {
      cep: cep,
      numero:
        dados.numero !== undefined
          ? String(dados.numero == null ? '' : dados.numero).trim()
          : atual.numero,
      complemento:
        dados.complemento !== undefined
          ? String(dados.complemento == null ? '' : dados.complemento).trim()
          : atual.complemento,
    };

    // Só chama o adaptador quando o CEP de fato mudou (achado da revisão
    // arquitetural): reduz chamadas externas redundantes e — mais
    // importante — reduz o tempo que a trava global do Portal
    // (comTravaDeAcesso) fica presa numa chamada HTTP síncrona (única
    // operação sob a trava hoje que sai da planilha para a rede).
    let resolucao = null;
    if (cepMudou && cep !== '') {
      try {
        resolucao = this.adaptadorDeCep.resolver(cep);
      } catch {
        resolucao = null; // RN-02/CB-01: falha degradável, não impede salvar.
      }
    }

    if (resolucao) {
      campos.rua = resolucao.rua;
      campos.bairro = resolucao.bairro;
      campos.cidade = resolucao.cidade;
      campos.uf = resolucao.uf;
    } else if (cepMudou) {
      campos.rua = '';
      campos.bairro = '';
      campos.cidade = '';
      campos.uf = '';
    } else {
      campos.rua = atual.rua;
      campos.bairro = atual.bairro;
      campos.cidade = atual.cidade;
      campos.uf = atual.uf;
    }
    campos.enderecoCompleto = [
      campos.rua,
      campos.numero,
      campos.complemento,
      campos.bairro,
      campos.cidade,
      campos.uf,
    ]
      .filter((parte) => parte)
      .join(', ');
    return campos;
  }
};
