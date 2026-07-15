/**
 * SERVICE: CadastrarParceiraService — caso de uso de cadastro (SPEC-001 RF-001).
 *
 * Orquestra o cadastro: cria a Parceira no domínio e a persiste via
 * repositório. Coordena Domínio + Repository.
 *
 * RN-01 (SPEC-001 §4/§11): o cadastro cria a Parceira sempre Inativa; nenhum
 * dado do formulário pode ativá-la automaticamente. A garantia mora na própria
 * entidade (constrói Inativa e ignora status externo) — o service não decide
 * estado, apenas orquestra.
 *
 * Não pode: falar HTTP/HTML; formatar envelope (Controller); conhecer coluna
 * física (ACL).
 *
 * @param {ParceiraRepository} parceiraRepository
 */

this.CadastrarParceiraService = class CadastrarParceiraService {
  constructor(parceiraRepository) {
    this.parceiraRepository = parceiraRepository;
  }

  /**
   * Cadastra uma nova Parceira a partir dos dados do formulário.
   * @param {{nome: string}} dados dados curados do cadastro.
   * @returns {Parceira} a Parceira persistida (Inativa).
   */
  executar(dados) {
    const parceira = new Parceira(dados && dados.nome);
    return this.parceiraRepository.salvar(parceira);
  }
};
