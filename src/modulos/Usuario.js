/**
 * MÓDULO: Usuario — gestão e vinculação de usuários do Portal (SPEC-035 M-ID)
 *
 * Fatia vertical (ADR-014): camadas como seções, na ordem
 * DOMAIN → ACL → REPOSITORY → SERVICE → CONTROLLER → ADAPTERS.
 * Os contratos de camada valem integralmente (docs/ARQUITETURA_CAMADAS.md).
 */

// ============================================================================
// DOMAIN — Usuario.js (ex-src/domain/Usuario.js)
// ============================================================================

/**
 * AGREGADO RAIZ: Usuario (SPEC-035 §6.2/§9.1.6) — identidade e ciclo de
 * vida de um ator autenticado pelo provedor federado.
 *
 * Bounded context próprio (identidade e acesso), distinto do agregado
 * soberano Parceira (CONTRATO_SOBERANO.md §6.1). Para o papel
 * Influenciadora, referencia Parceira apenas por identificador (INFLU_KEY,
 * ligação fraca) — nunca modela seus atributos de negócio.
 *
 * Máquina de estados fechada (§7): PENDING → ACTIVE|REJECTED (RN-04);
 * ACTIVE → INACTIVE; INACTIVE → ACTIVE (§7.2). REJECTED é terminal.
 * Transição inválida falha barulhento, mesmo padrão de Entrega (SPEC-012).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.Usuario = class Usuario {
  /** Papéis operacionais canônicos (RN-05 — exclusividade). */
  static get PAPEIS() {
    return ['ADMINISTRADOR', 'MARCA', 'INFLUENCIADORA'];
  }

  constructor(subProvider, email, papel, estado, dataCriacao, ultimoAcesso) {
    const sub = String(subProvider == null ? '' : subProvider).trim();
    if (!sub) {
      throw new Error('Usuario exige subProvider (RN-01).');
    }
    if (Usuario.PAPEIS.indexOf(papel) === -1) {
      throw new Error(
        "Usuario exige papel operacional válido (RN-05): '" + papel + "'."
      );
    }
    this.subProvider = sub;
    this.email = String(email == null ? '' : email).trim();
    this.papel = papel;
    this.estado = estado;
    this.dataCriacao = dataCriacao;
    this.ultimoAcesso = ultimoAcesso == null ? null : ultimoAcesso;
  }

  /**
   * UC-035.01: cria um novo Usuario a partir do onboarding — nasce sempre
   * PENDING (RN-04); não existe aprovação automática ou por decurso de
   * prazo.
   * @param {string} subProvider identificador imutável do provedor.
   * @param {string} email atributo mutável de contacto (RN-02).
   * @param {string} papel um de Usuario.PAPEIS (RN-05).
   * @param {Date} agora instante do primeiro acesso (DATA_CRIACAO).
   * @returns {Usuario}
   */
  static novo(subProvider, email, papel, agora) {
    return new Usuario(subProvider, email, papel, 'PENDING', agora, null);
  }

  /**
   * Reidrata um Usuario persistido SEM recomputar o estado (mesmo padrão
   * de Sessao.reconstituir, SPEC-025).
   * @param {string} subProvider
   * @param {string} email
   * @param {string} papel
   * @param {string} estado PENDING|ACTIVE|INACTIVE|REJECTED, já persistido.
   * @param {Date} dataCriacao
   * @param {Date|null} ultimoAcesso
   * @returns {Usuario}
   */
  static reconstituir(subProvider, email, papel, estado, dataCriacao, ultimoAcesso) {
    return new Usuario(subProvider, email, papel, estado, dataCriacao, ultimoAcesso || null);
  }

  /**
   * UC-035.04: Soberania da Moderação Administrativa (RN-04) —
   * PENDING → ACTIVE.
   * @returns {Usuario}
   * @throws {Error} fora de PENDING (§7.2).
   */
  aprovar() {
    this.transitar('PENDING', 'ACTIVE', 'aprovar');
    return this;
  }

  /**
   * UC-035.04: PENDING → REJECTED (RN-04).
   * @returns {Usuario}
   * @throws {Error} fora de PENDING (§7.2).
   */
  rejeitar() {
    this.transitar('PENDING', 'REJECTED', 'rejeitar');
    return this;
  }

  /**
   * Suspensão operacional: ACTIVE → INACTIVE (§7.2).
   * @returns {Usuario}
   * @throws {Error} fora de ACTIVE.
   */
  inativar() {
    this.transitar('ACTIVE', 'INACTIVE', 'inativar');
    return this;
  }

  /**
   * Reativação operacional: INACTIVE → ACTIVE, mediante nova autorização
   * expressa do Administrador (§7.2).
   * @returns {Usuario}
   * @throws {Error} fora de INACTIVE.
   */
  reativar() {
    this.transitar('INACTIVE', 'ACTIVE', 'reativar');
    return this;
  }

  /**
   * @returns {boolean} true apenas em ACTIVE (RN-03 — bloqueio preventivo).
   */
  estaAtivo() {
    return this.estado === 'ACTIVE';
  }

  /**
   * Registra o instante do último acesso bem-sucedido (§10.2.1 ULTIMO_ACESSO).
   * @param {Date} agora
   * @returns {Usuario}
   */
  registrarAcesso(agora) {
    this.ultimoAcesso = agora;
    return this;
  }

  /**
   * Guarda de transição fail-fast — mesmo padrão de Entrega.enviarMaterial
   * (SPEC-012 CT-03).
   * @param {string} exigido estado obrigatório para a transição.
   * @param {string} destino estado resultante.
   * @param {string} acao nome da operação, para a mensagem de erro.
   */
  transitar(exigido, destino, acao) {
    if (this.estado !== exigido) {
      throw new Error(
        "Transição inválida (§7.2) — '" +
          acao +
          "' exige estado '" +
          exigido +
          "', estado atual: '" +
          this.estado +
          "'."
      );
    }
    this.estado = destino;
  }
};

// ============================================================================
// ACL — UsuarioACL.js (ex-src/acl/UsuarioACL.js)
// ============================================================================

/**
 * ACL: UsuarioACL — camada anticorrupção da aba física `SIS_IDENTIDADES`
 * (SPEC-035 §10.2.1).
 *
 * Único ponto que conhece as colunas físicas SUB_PROVIDER | EMAIL_PERFIL |
 * PAPEL_ATOR | ESTADO_CONTA | DATA_CRIACAO | ULTIMO_ACESSO. Acessa a
 * planilha SEMPRE por cabeçalho (Contrato §7), nunca por índice fixo.
 * Escrita: upsert reescreve a aba inteira num único setValues, mesmo
 * padrão de SessaoACL (SPEC-025) — aba pequena e auxiliar, sem colunas
 * alheias a preservar.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API).
 */

this.UsuarioACL = class UsuarioACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Insere ou substitui o registro do Usuario (upsert por SUB_PROVIDER).
   * @param {{subProvider: string, email: string, papel: string,
   *   estado: string, dataCriacao: Date, ultimoAcesso: (Date|null)}} usuario
   */
  upsert(usuario) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const nova = cabecalho.map(() => '');
    nova[coluna('SUB_PROVIDER')] = usuario.subProvider;
    nova[coluna('EMAIL_PERFIL')] = usuario.email;
    nova[coluna('PAPEL_ATOR')] = usuario.papel;
    nova[coluna('ESTADO_CONTA')] = usuario.estado;
    nova[coluna('DATA_CRIACAO')] = usuario.dataCriacao.toISOString();
    nova[coluna('ULTIMO_ACESSO')] = usuario.ultimoAcesso ? usuario.ultimoAcesso.toISOString() : '';
    const linhas = valores
      .slice(1)
      .filter(
        (linha) =>
          String(linha[coluna('SUB_PROVIDER')]).trim() !== String(usuario.subProvider).trim()
      );
    linhas.push(nova);
    reescreverAba(this.sheet, cabecalho, linhas);
  }

  /**
   * @param {string} subProvider
   * @returns {{subProvider: string, email: string, papel: string,
   *   estado: string, dataCriacao: Date, ultimoAcesso: (Date|null)}|null}
   */
  buscarPorSub(subProvider) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const alvo = String(subProvider == null ? '' : subProvider).trim();
    const linha = valores.slice(1).find((l) => String(l[coluna('SUB_PROVIDER')]).trim() === alvo);
    if (!linha) {
      return null;
    }
    return this.projetar(linha, coluna);
  }

  /**
   * Porta do painel de moderação (§13.4): utilizadores num dado ESTADO_CONTA.
   * @param {string} estado PENDING|ACTIVE|INACTIVE|REJECTED.
   * @returns {Array<{subProvider: string, email: string, papel: string,
   *   estado: string, dataCriacao: Date, ultimoAcesso: (Date|null)}>}
   */
  listarPorEstado(estado) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    return valores
      .slice(1)
      .filter((l) => String(l[coluna('SUB_PROVIDER')]).trim() !== '')
      .filter((l) => String(l[coluna('ESTADO_CONTA')]).trim() === estado)
      .map((l) => this.projetar(l, coluna));
  }

  /**
   * @param {Array} linha
   * @param {function(string): number} coluna
   * @returns {{subProvider: string, email: string, papel: string,
   *   estado: string, dataCriacao: Date, ultimoAcesso: (Date|null)}}
   */
  projetar(linha, coluna) {
    return {
      subProvider: String(linha[coluna('SUB_PROVIDER')]).trim(),
      email: String(linha[coluna('EMAIL_PERFIL')] == null ? '' : linha[coluna('EMAIL_PERFIL')]).trim(),
      papel: String(linha[coluna('PAPEL_ATOR')]).trim(),
      estado: String(linha[coluna('ESTADO_CONTA')]).trim(),
      dataCriacao: celulaParaData(linha[coluna('DATA_CRIACAO')], 'DATA_CRIACAO', 'SIS_IDENTIDADES'),
      ultimoAcesso: celulaParaData(linha[coluna('ULTIMO_ACESSO')], 'ULTIMO_ACESSO', 'SIS_IDENTIDADES'),
    };
  }

  /**
   * @param {Array} cabecalho
   * @returns {function(string): number} resolve nome → índice, fail-fast.
   */
  resolvedorDeColuna(cabecalho) {
    return criarResolvedorDeColuna(cabecalho, 'SIS_IDENTIDADES');
  }
};

// ============================================================================
// REPOSITORY — UsuarioRepository.js (ex-src/repository/UsuarioRepository.js)
// ============================================================================

/**
 * REPOSITORY: UsuarioRepository — persistência do agregado Usuario
 * (SPEC-035 §9.1.4).
 *
 * Cobre exclusivamente a aba `SIS_IDENTIDADES` (o agregado Usuario). Dados
 * complementares de papel (`BASE_ADMINISTRADORES`) e a vinculação com a
 * Parceira soberana (`BASE DE DADOS`) são coordenados pelo Service através
 * de `AdministradorACL`/`ParceiraACL` diretamente — mesmo padrão de
 * composição de colaboradores já usado por `AcessoPortalService`
 * (SPEC-025: `sessaoRepository` + `bloqueioRepository`, sem repositório
 * único agregando os dois).
 *
 * Não pode conter regra de negócio nem conhecer coluna física.
 *
 * @param {UsuarioACL} acl ACL única da aba SIS_IDENTIDADES.
 */

this.UsuarioRepository = class UsuarioRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Persiste (insere ou atualiza) o Usuario.
   * @param {Usuario} usuario
   * @returns {Usuario} o mesmo Usuario persistido.
   */
  salvar(usuario) {
    this.acl.upsert({
      subProvider: usuario.subProvider,
      email: usuario.email,
      papel: usuario.papel,
      estado: usuario.estado,
      dataCriacao: usuario.dataCriacao,
      ultimoAcesso: usuario.ultimoAcesso,
    });
    return usuario;
  }

  /**
   * @param {string} subProvider
   * @returns {Usuario|null} Usuario reidratado, ou null se inexistente.
   */
  buscarPorSub(subProvider) {
    const registro = this.acl.buscarPorSub(subProvider);
    if (!registro) {
      return null;
    }
    return this.reidratar(registro);
  }

  /**
   * Porta do painel de moderação (§13.4/UC-035.04).
   * @returns {Usuario[]} Usuarios em estado PENDING.
   */
  listarPendentes() {
    return this.acl.listarPorEstado('PENDING').map((registro) => this.reidratar(registro));
  }

  /**
   * @param {{subProvider: string, email: string, papel: string,
   *   estado: string, dataCriacao: Date, ultimoAcesso: (Date|null)}} registro
   * @returns {Usuario}
   */
  reidratar(registro) {
    return Usuario.reconstituir(
      registro.subProvider,
      registro.email,
      registro.papel,
      registro.estado,
      registro.dataCriacao,
      registro.ultimoAcesso
    );
  }
};

// ============================================================================
// SERVICE — UsuarioService.js (ex-src/service/UsuarioService.js)
// ============================================================================

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
    publicador,
    trocadorDeCodigoOAuth,
    guardiaoDeEstadoOAuth
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
    this.trocadorDeCodigoOAuth = trocadorDeCodigoOAuth;
    this.guardiaoDeEstadoOAuth = guardiaoDeEstadoOAuth;
  }

  /**
   * ADR-013: inicia o login federado — emite o state anti-CSRF (condição 3)
   * e devolve a URL de autorização do provedor para o redirect top-level.
   * @returns {{urlDeAutorizacao: string}}
   */
  iniciarLogin() {
    const state = this.geradorDeToken.gerar();
    this.guardiaoDeEstadoOAuth.registrar(state);
    return { urlDeAutorizacao: this.trocadorDeCodigoOAuth.construirUrlDeAutorizacao(state) };
  }

  /**
   * ADR-013: callback do Authorization Code Flow. Valida e CONSOME o state
   * (anti-CSRF, condição 3), troca o código por id_token (Adapter, condição
   * 4) e delega ao fluxo de entrada existente (§9.2) — nenhuma regra de
   * identidade nova. Estados não autenticados carregam o idToken para os
   * fluxos de vinculação/onboarding existentes (mesma exposição do GIS
   * anterior: token do próprio usuário, no próprio navegador).
   * @param {{code: string, state: string}} dados
   * @returns {object} mesmo contrato de entrar(), com `idToken` anexado aos
   *   resultados não-AUTENTICADO.
   * @throws {Error} ERR_AUTH_STATE_INVALIDO; ERR_AUTH_INVALID_TOKEN; demais
   *   de entrar() (§14.3).
   */
  entrarComCodigo(dados) {
    if (!this.guardiaoDeEstadoOAuth.validarEConsumir(dados && dados.state)) {
      throw erroComCodigo(
        'ERR_AUTH_STATE_INVALIDO',
        'Sessão de login inválida ou expirada — recomece o login.'
      );
    }
    const idToken = this.trocadorDeCodigoOAuth.trocarCodigoPorIdToken(dados && dados.code);
    const resultado = this.entrar({ idToken: idToken });
    if (resultado.status !== 'AUTENTICADO') {
      resultado.idToken = idToken;
    }
    return resultado;
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

// ============================================================================
// CONTROLLER — UsuarioController.js (ex-src/controller/UsuarioController.js)
// ============================================================================

/**
 * CONTROLLER: UsuarioController — adapta o contrato externo de Identidade
 * e Acesso (SPEC-035). Recebe a chamada do Entrypoint, invoca o Service e
 * devolve SEMPRE o envelope padrão {success,data}/{success,error}
 * (`src/shared/Envelope.js`, via envelopeOk/falharComCodigo).
 *
 * Não existe um AuthController separado (§9.2-A) — renovação/encerramento
 * de sessão continuam servidos pelo `AcessoController` já existente
 * (SPEC-025). Este controller cobre exclusivamente login federado,
 * onboarding, vinculação, moderação e RBAC.
 *
 * Erros do contrato (§14.3) carregam o código; erros de infraestrutura
 * seguem o padrão dos pares (envelope só com mensagem). Expõe apenas
 * projeções serializáveis — nunca a instância de domínio (`Usuario`) nem
 * `Sessao`.
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer
 * coluna física.
 *
 * @param {UsuarioService} usuarioService
 */

this.UsuarioController = class UsuarioController {
  constructor(usuarioService) {
    this.usuarioService = usuarioService;
  }

  /**
   * @param {Usuario} usuario
   * @returns {{subProvider: string, email: string, papel: string, estado: string}}
   */
  projetarUsuario(usuario) {
    return {
      subProvider: usuario.subProvider,
      email: usuario.email,
      papel: usuario.papel,
      estado: usuario.estado,
    };
  }

  /**
   * @param {{status: string, sessao: (Sessao|undefined), papel: (string|undefined)}} resultado devolvido por UsuarioService.entrar.
   * @returns {object} projeção serializável — nunca a instância de Sessao. `papel`
   *   permite ao frontend rotear entre a área da Influenciadora e a da equipe.
   */
  projetarResultadoDeEntrada(resultado) {
    if (resultado.status !== 'AUTENTICADO') {
      return resultado;
    }
    return {
      status: 'AUTENTICADO',
      token: resultado.sessao.token.valor,
      parceiraId: resultado.sessao.parceiraId,
      expiraEm: resultado.sessao.expiraEm.toISOString(),
      papel: resultado.papel,
    };
  }

  /**
   * UC-035.01/02: autentica via Google (§9.2).
   * @param {{idToken: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  entrar(dados) {
    try {
      return envelopeOk(this.projetarResultadoDeEntrada(this.usuarioService.entrar(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * ADR-013: inicia o login federado (emite state, devolve URL de
   * autorização para o redirect top-level).
   * @returns {{success: true, data: {urlDeAutorizacao: string}}|{success: false, error: object}}
   */
  iniciarLogin() {
    try {
      return envelopeOk(this.usuarioService.iniciarLogin());
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * ADR-013: callback do Authorization Code Flow — troca code+state por
   * sessão (ou pelos estados de vinculação/onboarding, com idToken).
   * @param {{code: string, state: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  entrarComCodigo(dados) {
    try {
      return envelopeOk(
        this.projetarResultadoDeEntrada(this.usuarioService.entrarComCodigo(dados))
      );
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-035.02 (§5.1-A): confirma a vinculação a uma Parceira pré-existente.
   * @param {{idToken: string, parceiraId: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  confirmarVinculacao(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.confirmarVinculacao(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-035.03 (§5.3): completa o onboarding de um utilizador novo.
   * @param {{idToken: string, papel: string, dadosComplementares: object}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  completarCadastro(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.completarCadastro(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * Painel de moderação (§13.4) — exclusivo do papel Administrador.
   * @param {{token: string}} dados
   * @returns {{success: true, data: object[]}|{success: false, error: object}}
   */
  listarPendentes(dados) {
    try {
      return envelopeOk(this.usuarioService.listarPendentes(dados).map((u) => this.projetarUsuario(u)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-035.04 (RN-04/§12.3): aprova um registo pendente.
   * @param {{token: string, subAlvo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  aprovarUsuario(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.aprovarUsuario(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * UC-035.04 (RN-04/§12.3): rejeita um registo pendente.
   * @param {{token: string, subAlvo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  rejeitarUsuario(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.rejeitarUsuario(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * §3.1.3/§4.1/§7.2: suspende uma conta ACTIVE.
   * @param {{token: string, subAlvo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  inativarUsuario(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.inativarUsuario(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  /**
   * §7.2 "Reativação Operacional": reativa uma conta INACTIVE.
   * @param {{token: string, subAlvo: string}} dados
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  reativarUsuario(dados) {
    try {
      return envelopeOk(this.projetarUsuario(this.usuarioService.reativarUsuario(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }
};
