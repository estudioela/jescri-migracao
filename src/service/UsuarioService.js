/**
 * SERVICE: UsuarioService — casos de uso de Identidade e Acesso
 * (SPEC-035 UC-035.01..05, §9.1.3/§9.2/§9.2-A).
 *
 * Único Service novo da SPEC-035 — não existe AuthService paralelo.
 * Reaproveita integralmente `Sessao`/`TokenDeSessao`/`SessaoRepository` e
 * `AcessoPortalService.renovar()` (SPEC-025, sem alteração) para emissão e
 * resolução de sessão; não reaproveita `Autenticador`/`Credencial`/
 * `JanelaDeBloqueio` (justificativa técnica: §9.2-A — bloqueio por
 * tentativas mitiga segredo adivinhável, não se aplica a token assinado
 * criptograficamente).
 *
 * Escopo desta implementação: papéis `ADMINISTRADOR` e `INFLUENCIADORA`
 * (o ator `MARCA` está definido na SPEC mas fora de escopo — nota de
 * revisão 2, pendente de decisão do PO).
 *
 * Não pode: falar HTTP/HTML; formatar envelope (Controller); conhecer
 * coluna física (ACL).
 *
 * @param {{validar: function(string, Date): {sub, email, name}}} validadorDeToken
 *   porta de verificação de identidade federada (ValidadorDeTokenGoogle).
 * @param {UsuarioRepository} usuarioRepository agregado Usuario (SIS_IDENTIDADES).
 * @param {AdministradorACL} administradorACL dados complementares do papel Administrador.
 * @param {ParceiraACL} parceiraACL portas de vinculação de identidade (§5.1-A/§10.2.4).
 * @param {SessaoRepository} sessaoRepository reaproveitado de SPEC-025 (§9.2-A).
 * @param {AcessoPortalService} acessoPortalService reaproveitado de SPEC-025
 *   (renovar() resolve token → Sessão, mesmo padrão de PortalDeConteudoService).
 * @param {{gerar: function(): string}} geradorDeToken porta de token opaco (reaproveitada).
 * @param {{hoje: function(): Date}} relogio porta de tempo.
 * @param {{publicar: function(object)}} publicador porta de eventos (§11.3).
 */

this.UsuarioService = class UsuarioService {
  constructor(
    validadorDeToken,
    usuarioRepository,
    administradorACL,
    parceiraACL,
    sessaoRepository,
    acessoPortalService,
    geradorDeToken,
    relogio,
    publicador
  ) {
    this.validadorDeToken = validadorDeToken;
    this.usuarioRepository = usuarioRepository;
    this.administradorACL = administradorACL;
    this.parceiraACL = parceiraACL;
    this.sessaoRepository = sessaoRepository;
    this.acessoPortalService = acessoPortalService;
    this.geradorDeToken = geradorDeToken;
    this.relogio = relogio;
    this.publicador = publicador;
  }

  /**
   * UC-035.01/02: autentica via Google e resolve o direcionamento (§9.2).
   * @param {{idToken: string}} dados
   * @returns {{status: 'AUTENTICADO', sessao: Sessao, papel: string}
   *   |{status: 'CANDIDATA_VINCULACAO', parceiraId: string, sub: string, email: string, name: string}
   *   |{status: 'ONBOARDING_REQUERIDO', sub: string, email: string, name: string}}
   * @throws {Error} ERR_AUTH_INVALID_TOKEN; ERR_AUTH_ACCOUNT_PENDING/INACTIVE/REJECTED (§14.3).
   */
  entrar(dados) {
    const agora = this.relogio.hoje();
    const identidade = this.validadorDeToken.validar(dados && dados.idToken, agora);
    const usuario = this.usuarioRepository.buscarPorSub(identidade.sub);

    if (!usuario) {
      const candidata = identidade.email
        ? this.parceiraACL.buscarCandidataPorEmail(identidade.email)
        : null;
      if (candidata) {
        return {
          status: 'CANDIDATA_VINCULACAO',
          parceiraId: candidata.parceiraId,
          sub: identidade.sub,
          email: identidade.email,
          name: identidade.name,
        };
      }
      return {
        status: 'ONBOARDING_REQUERIDO',
        sub: identidade.sub,
        email: identidade.email,
        name: identidade.name,
      };
    }

    if (!usuario.estaAtivo()) {
      throw this.erroDeEstado(usuario.estado);
    }

    const identificadorDeSessao =
      usuario.papel === 'INFLUENCIADORA'
        ? this.resolverInfluKey(usuario.subProvider)
        : usuario.subProvider;

    usuario.registrarAcesso(agora);
    this.usuarioRepository.salvar(usuario);

    const sessao = new Sessao(identificadorDeSessao, new TokenDeSessao(this.geradorDeToken.gerar()), agora);
    this.sessaoRepository.salvar(sessao);
    this.publicador.publicar({ nome: 'UsuarioAutenticado', subProvider: usuario.subProvider });

    return { status: 'AUTENTICADO', sessao: sessao, papel: usuario.papel };
  }

  /**
   * UC-035.02 (§5.1-A): confirma a vinculação da identidade federada a uma
   * Parceira pré-existente. Nunca associa automaticamente (RN-02) — exige
   * que o chamador reapresente o `parceiraId` exibido como candidata, e
   * revalida que ele ainda corresponde à candidata real do e-mail do token
   * (evita vinculação manipulada).
   * @param {{idToken: string, parceiraId: string}} dados
   * @returns {Usuario} o novo Usuario, em PENDING (RN-04).
   * @throws {Error} ERR_AUTH_INVALID_TOKEN; vinculação inválida.
   */
  confirmarVinculacao(dados) {
    const agora = this.relogio.hoje();
    const identidade = this.validadorDeToken.validar(dados && dados.idToken, agora);
    const candidata = this.parceiraACL.buscarCandidataPorEmail(identidade.email);
    if (!candidata || candidata.parceiraId !== dados.parceiraId) {
      throw erroComCodigo(
        'ERR_AUTH_VINCULACAO_INVALIDA',
        'A vinculação não corresponde a uma candidata válida para este e-mail.'
      );
    }
    this.parceiraACL.vincularSubProvider(candidata.parceiraId, identidade.sub);
    const usuario = Usuario.novo(identidade.sub, identidade.email, 'INFLUENCIADORA', agora);
    this.usuarioRepository.salvar(usuario);
    this.publicador.publicar({ nome: 'UsuarioCadastradoEvent', subProvider: usuario.subProvider });
    return usuario;
  }

  /**
   * UC-035.03 (§3.1.2/§5.3): completa o onboarding de um utilizador
   * genuinamente novo. `MARCA` está fora do escopo desta implementação
   * (nota de revisão 2 da SPEC). `INFLUENCIADORA` sem candidata
   * pré-existente é recusada — este módulo não captura dados contratuais
   * (§1.4/§3.1.2); a Influenciadora precisa já existir como Parceira
   * (SPEC-002) antes do primeiro login.
   * @param {{idToken: string, papel: string,
   *   dadosComplementares: ({nomeCompleto: string, areaResponsabilidade: (string|undefined)}|undefined)}} dados
   * @returns {Usuario} o novo Usuario, em PENDING (RN-04).
   * @throws {Error} ERR_AUTH_INVALID_TOKEN; ERR_AUTH_PAPEL_NAO_DISPONIVEL;
   *   ERR_AUTH_PARCEIRA_NAO_ENCONTRADA; sub já cadastrado.
   */
  completarCadastro(dados) {
    const agora = this.relogio.hoje();
    const identidade = this.validadorDeToken.validar(dados && dados.idToken, agora);
    if (this.usuarioRepository.buscarPorSub(identidade.sub)) {
      throw erroComCodigo('ERR_AUTH_JA_CADASTRADO', 'Este identificador já possui registo.');
    }
    if (dados.papel === 'MARCA') {
      throw erroComCodigo(
        'ERR_AUTH_PAPEL_NAO_DISPONIVEL',
        'Cadastro de Marca ainda não disponível nesta implementação.'
      );
    }
    if (dados.papel === 'INFLUENCIADORA') {
      throw erroComCodigo(
        'ERR_AUTH_PARCEIRA_NAO_ENCONTRADA',
        'Nenhuma parceria encontrada para este e-mail — contacte a equipa Estúdio Elã para cadastro.'
      );
    }
    if (dados.papel !== 'ADMINISTRADOR') {
      throw erroComCodigo('ERR_AUTH_PAPEL_NAO_DISPONIVEL', 'Papel operacional desconhecido.');
    }
    const usuario = Usuario.novo(identidade.sub, identidade.email, 'ADMINISTRADOR', agora);
    this.usuarioRepository.salvar(usuario);
    const complementares = dados.dadosComplementares || {};
    this.administradorACL.inserir({
      subProvider: identidade.sub,
      nomeCompleto: complementares.nomeCompleto || '',
      areaResponsabilidade: complementares.areaResponsabilidade,
    });
    this.publicador.publicar({ nome: 'UsuarioCadastradoEvent', subProvider: usuario.subProvider });
    return usuario;
  }

  /**
   * Porta do painel de moderação (§13.4). Exclusivo do papel Administrador
   * ACTIVE.
   * @param {{token: string}} dados
   * @returns {Usuario[]} Usuarios em PENDING.
   */
  listarPendentes(dados) {
    this.exigirPapel(dados.token, 'ADMINISTRADOR');
    return this.usuarioRepository.listarPendentes();
  }

  /**
   * UC-035.04 (RN-04/§12.3): aprova um registo PENDING. Exclusivo do papel
   * Administrador ACTIVE (guarda de segurança, §8.3).
   * @param {{token: string, subAlvo: string}} dados
   * @returns {Usuario} o Usuario aprovado (ACTIVE).
   */
  aprovarUsuario(dados) {
    this.exigirPapel(dados.token, 'ADMINISTRADOR');
    const alvo = this.buscarAlvoNoEstado(dados.subAlvo, 'PENDING');
    alvo.aprovar();
    this.usuarioRepository.salvar(alvo);
    this.publicador.publicar({ nome: 'UsuarioAprovadoEvent', subProvider: alvo.subProvider });
    return alvo;
  }

  /**
   * UC-035.04 (RN-04/§12.3): rejeita um registo PENDING. Exclusivo do
   * papel Administrador ACTIVE.
   * @param {{token: string, subAlvo: string}} dados
   * @returns {Usuario} o Usuario rejeitado (REJECTED).
   */
  rejeitarUsuario(dados) {
    this.exigirPapel(dados.token, 'ADMINISTRADOR');
    const alvo = this.buscarAlvoNoEstado(dados.subAlvo, 'PENDING');
    alvo.rejeitar();
    this.usuarioRepository.salvar(alvo);
    return alvo;
  }

  /**
   * §3.1.3/§4.1/§7.2: suspende uma conta ACTIVE. Exclusivo do papel
   * Administrador ACTIVE (§8.1 — único papel com permissão para inativar
   * contas de Marcas e Influenciadoras).
   * @param {{token: string, subAlvo: string}} dados
   * @returns {Usuario} o Usuario suspenso (INACTIVE).
   */
  inativarUsuario(dados) {
    this.exigirPapel(dados.token, 'ADMINISTRADOR');
    const alvo = this.buscarAlvoNoEstado(dados.subAlvo, 'ACTIVE');
    alvo.inativar();
    this.usuarioRepository.salvar(alvo);
    this.publicador.publicar({ nome: 'UsuarioInativadoEvent', subProvider: alvo.subProvider });
    return alvo;
  }

  /**
   * §7.2 "Reativação Operacional": INACTIVE → ACTIVE mediante nova
   * autorização expressa do Administrador. Exclusivo do papel
   * Administrador ACTIVE.
   * @param {{token: string, subAlvo: string}} dados
   * @returns {Usuario} o Usuario reativado (ACTIVE).
   */
  reativarUsuario(dados) {
    this.exigirPapel(dados.token, 'ADMINISTRADOR');
    const alvo = this.buscarAlvoNoEstado(dados.subAlvo, 'INACTIVE');
    alvo.reativar();
    this.usuarioRepository.salvar(alvo);
    return alvo;
  }

  /**
   * Guarda de segurança (§11.2 `UsuarioService.exigirPapel`, §8.3):
   * resolve a Sessão a partir do token (reaproveitando
   * `AcessoPortalService.renovar`, SPEC-025) e confirma que o Usuario
   * correspondente está ACTIVE e possui o papel exigido.
   * @param {string} token
   * @param {string} papelExigido
   * @returns {Usuario}
   * @throws {Error} ERR_AUTH_INVALID_TOKEN (sessão inválida);
   *   ERR_AUTH_UNAUTHORIZED_ROLE (papel/estado divergente).
   */
  exigirPapel(token, papelExigido) {
    let sessao;
    try {
      sessao = this.acessoPortalService.renovar({ token: token });
    } catch {
      throw erroComCodigo('ERR_AUTH_INVALID_TOKEN', 'Sessão inválida ou expirada.');
    }
    // O identificador da Sessão é a INFLU_KEY para Influenciadora, ou o
    // próprio sub para os demais papéis (§9.2/§11.2). `SIS_IDENTIDADES` é
    // indexado por sub — esta guarda só resolve corretamente para papéis
    // cujo identificador de sessão É o sub (Administrador, hoje o único
    // caso de uso real: rotas administrativas). Guardar rotas restritas à
    // Influenciadora não precisa de exigirPapel — os módulos de Portal já
    // isolam por `parceiraId` da própria Sessão (RN-01/INV-01, SPEC-027).
    const usuario = this.usuarioRepository.buscarPorSub(sessao.parceiraId);
    if (!usuario || !usuario.estaAtivo() || usuario.papel !== papelExigido) {
      throw erroComCodigo(
        'ERR_AUTH_UNAUTHORIZED_ROLE',
        "Ação exige o papel '" + papelExigido + "'."
      );
    }
    return usuario;
  }

  /**
   * Resolve o Usuario alvo de uma ação de moderação, exigindo que esteja
   * no estado de origem correto da transição (§7.2) — reaproveitada por
   * aprovar/rejeitar/inativar/reativar, uma única checagem para as
   * quatro transições administrativas.
   * @param {string} subAlvo
   * @param {string} estadoExigido estado de origem da transição (§7.2).
   * @returns {Usuario}
   * @throws {Error} inexistente ou fora do estado exigido.
   */
  buscarAlvoNoEstado(subAlvo, estadoExigido) {
    const alvo = this.usuarioRepository.buscarPorSub(subAlvo);
    if (!alvo || alvo.estado !== estadoExigido) {
      throw erroComCodigo(
        'ERR_AUTH_ALVO_INVALIDO',
        "Nenhum registo em '" + estadoExigido + "' encontrado para este identificador."
      );
    }
    return alvo;
  }

  /**
   * @param {string} subProvider Influenciadora já vinculada.
   * @returns {string} INFLU_KEY resolvida.
   * @throws {Error} vínculo ausente (estado inconsistente — nunca deveria
   *   ocorrer para um Usuario ACTIVE do papel Influenciadora).
   */
  resolverInfluKey(subProvider) {
    const vinculo = this.parceiraACL.obterPorSubProvider(subProvider);
    if (!vinculo) {
      throw erroComCodigo(
        'ERR_SYS_VINCULO_INCONSISTENTE',
        'Influenciadora ativa sem vínculo de Parceira — contacte o suporte.'
      );
    }
    return vinculo.parceiraId;
  }

  /**
   * @param {string} estado ESTADO_CONTA atual.
   * @returns {Error} erro do contrato (§14.3) correspondente ao estado.
   */
  erroDeEstado(estado) {
    const mapa = {
      PENDING: ['ERR_AUTH_ACCOUNT_PENDING', 'Cadastro aguarda aprovação da administração.'],
      INACTIVE: ['ERR_AUTH_ACCOUNT_INACTIVE', 'Conta suspensa.'],
      REJECTED: ['ERR_AUTH_ACCOUNT_REJECTED', 'Cadastro rejeitado.'],
    };
    const par = mapa[estado] || ['ERR_AUTH_ACCOUNT_INACTIVE', 'Conta sem acesso.'];
    return erroComCodigo(par[0], par[1]);
  }
};
