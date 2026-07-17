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
