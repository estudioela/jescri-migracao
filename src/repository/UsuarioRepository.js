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
