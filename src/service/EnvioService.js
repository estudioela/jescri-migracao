/**
 * SERVICE: EnvioService — casos de uso do Envio (SPEC-016 UC-016.01/02/03;
 * RN-01/RN-02/RN-03; RNF-01/CB-01 falha degradável do adaptador).
 *
 * - Reage a `MesCompilado` (§5/§14.1): materializa um Envio por Colaboração
 *   compilada (toda Parceira Ativa, RN-01), num lote atômico do Repository.
 * - UC-016.01/D-03: confirmarEndereco() transita a Revisão e, SÓ ENTÃO, lê
 *   endereço/PIX na porta do Cadastro EXCLUSIVAMENTE para compor a
 *   mensagem de confirmação manual — o dado nunca é persistido no Envio
 *   (INV-04) nem entra em log/evento.
 * - UC-016.02: registrar rastreio persiste antes de publicar `ProdutoDespachado`
 *   (mesma disciplina de CB-03 — falha na persistência nunca publica evento).
 * - UC-016.03/RNF-01/CB-01: consulta a porta de rastreio; falha do adaptador
 *   é degradável — a operação principal segue sem erro nem efeito.
 * - Datas de envio/arquivamento vêm do relógio injetado — determinístico e
 *   testável (RN-02/RNF-02).
 * - LG-01 (§17): Envio inexistente é recusado fail-fast.
 *
 * DÍVIDAS REGISTRADAS:
 * - D-01 (SPEC-016 §21): rótulos crus da EnvioACL são convenção provisória,
 *   pendente de confirmação por ADR.
 * - D-02 (SPEC-016 §21): provedor/contrato real da API de rastreio — o
 *   adaptador injetado aqui é a porta; a implementação concreta (HTTP) é
 *   dívida futura, mesma disciplina de D-02 (Entrega) e do publicador de log.
 *
 * Não pode: tocar SpreadsheetApp; conhecer coluna física; formatar envelope.
 *
 * @param {ColaboracaoMensalRepository} colaboracaoMensalRepository base da
 *   materialização (M2, congelado — somente leitura).
 * @param {object} cadastroDeParceiras porta do Cadastro (D-03):
 *   obterContatoDeEnvio(parceiraId) → {endereco, pix}|null.
 * @param {EnvioRepository} envioRepository persistência do agregado.
 * @param {object} adaptadorDeRastreio porta de rastreio (D-02):
 *   consultar(codigoRastreio) → {entregue: boolean}.
 * @param {object} publicadorDeEventos porta de eventos: publicar(evento).
 * @param {object} relogio porta de tempo: hoje() → Date.
 */

this.EnvioService = class EnvioService {
  constructor(
    colaboracaoMensalRepository,
    cadastroDeParceiras,
    envioRepository,
    adaptadorDeRastreio,
    publicadorDeEventos,
    relogio
  ) {
    this.colaboracaoMensalRepository = colaboracaoMensalRepository;
    this.cadastroDeParceiras = cadastroDeParceiras;
    this.envioRepository = envioRepository;
    this.adaptadorDeRastreio = adaptadorDeRastreio;
    this.publicadorDeEventos = publicadorDeEventos;
    this.relogio = relogio;
  }

  /**
   * Reação a `MesCompilado` (RN-01): materializa os Envios da competência,
   * um por Colaboração compilada (toda Parceira Ativa). Idempotente por
   * competência (achado F1/F2 da auditoria SPEC-012): se já existe algum
   * Envio desta competência, é no-op — nunca sobrescreve (protege
   * confirmações/rastreios/arquivamentos já feitos e permite reconciliar
   * com segurança uma compilação anterior que falhou parcialmente).
   * @param {string} mesReferenciaTexto competência 'AAAA-MM'.
   * @returns {Envio[]} Envios materializados (vazio se já existia).
   */
  materializarParaCompetencia(mesReferenciaTexto) {
    const mesReferencia = MesReferencia.deTexto(String(mesReferenciaTexto));
    if (this.envioRepository.existeParaCompetencia(mesReferencia)) {
      return [];
    }
    const colaboracoes = this.colaboracaoMensalRepository.listarPor(mesReferencia);
    const envios = colaboracoes.map(
      (colaboracao) => new Envio(colaboracao.parceiraId, colaboracao.mesReferencia)
    );
    return this.envioRepository.recriarCompetencia(mesReferencia, envios);
  }

  /**
   * UC-016.01 · Confirmar endereço: lê e valida endereço/PIX na porta do
   * Cadastro (D-03) ANTES de mutar e persistir — se o contato for inválido
   * (VO fail-fast), nada é persistido (mesma disciplina de "falha nunca
   * deixa efeito parcial" de RN-01/CB-03). Só então AguardandoConfirmacao
   * → Confirmado e persiste. O endereço/PIX nunca é persistido no Envio.
   * @param {{mesReferencia: string, parceiraId: string}} comando
   * @returns {{envio: Envio, mensagem: string}}
   * @throws {Error} LG-01 Envio inexistente; endereço ausente no cadastro
   *   (fail-fast do VO); LG-02 transição inválida.
   */
  confirmarEndereco(comando) {
    const { envio } = this.resolver(comando);

    const contato = this.cadastroDeParceiras.obterContatoDeEnvio(envio.parceiraId) || {
      endereco: '',
      pix: '',
    };
    const endereco = new EnderecoDeEntrega(contato.endereco);

    envio.confirmarEndereco();
    this.envioRepository.salvar(envio);

    return {
      envio,
      mensagem: 'Endereço de entrega: ' + endereco.valor + ' — Chave PIX: ' + contato.pix,
    };
  }

  /**
   * UC-016.02 · Registrar rastreio: Pendente/Expedido → Expedido (RN-02: a
   * data de envio é preenchida pelo relógio SÓ na primeira vez), persiste e
   * publica `ProdutoDespachado` — evento só após persistência (CB-03).
   * @param {{mesReferencia: string, parceiraId: string, codigo: string}} comando
   * @returns {Envio}
   * @throws {Error} LG-01 Envio inexistente; LG-02 transição inválida.
   */
  registrarRastreio(comando) {
    const { mesReferencia, envio } = this.resolver(comando);
    envio.registrarRastreio(comando.codigo, this.relogio.hoje());
    this.envioRepository.salvar(envio);

    this.publicadorDeEventos.publicar({
      nome: 'ProdutoDespachado',
      parceiraId: envio.parceiraId,
      mesReferencia: mesReferencia.toString(),
      rastreio: envio.rastreio.toString(),
    });
    return envio;
  }

  /**
   * UC-016.03 · Atualizar status: consulta a porta de rastreio; se indicar
   * entrega, arquiva automaticamente (Expedido → Entregue) com a data do
   * relógio e publica `ProdutoEntregue`. Falha do adaptador é degradável
   * (RNF-01/CB-01): a operação principal segue, sem erro nem evento.
   * @param {{mesReferencia: string, parceiraId: string}} comando
   * @returns {Envio} o Envio, atualizado ou inalterado.
   * @throws {Error} LG-01 Envio inexistente.
   */
  atualizarStatus(comando) {
    const { mesReferencia, envio } = this.resolver(comando);
    let resultado;
    try {
      resultado = this.adaptadorDeRastreio.consultar(
        envio.rastreio ? envio.rastreio.toString() : null
      );
    } catch {
      // CB-01/RNF-01: transportadora indisponível não bloqueia a operação.
      return envio;
    }
    if (!resultado || resultado.entregue !== true) {
      return envio;
    }

    envio.marcarEntregue(this.relogio.hoje());
    this.envioRepository.salvar(envio);

    this.publicadorDeEventos.publicar({
      nome: 'ProdutoEntregue',
      parceiraId: envio.parceiraId,
      mesReferencia: mesReferencia.toString(),
      dataArquivamento: envio.dataArquivamento,
    });
    return envio;
  }

  /**
   * Lista os Envios da competência, opcionalmente por Parceira.
   * @param {string} mesReferenciaTexto 'AAAA-MM'.
   * @param {string} [parceiraId]
   * @returns {Envio[]}
   */
  listarEnvios(mesReferenciaTexto, parceiraId) {
    return this.envioRepository.listarPor(
      MesReferencia.deTexto(String(mesReferenciaTexto)),
      parceiraId
    );
  }

  /**
   * Resolve o comando externo no Envio alvo (LG-01 fail-fast).
   * @param {{mesReferencia: string, parceiraId: string}} comando
   * @returns {{mesReferencia: MesReferencia, envio: Envio}}
   */
  resolver(comando) {
    if (comando == null || typeof comando !== 'object') {
      throw new Error('LG-01: comando ausente — identifique o Envio.');
    }
    const mesReferencia = MesReferencia.deTexto(String(comando.mesReferencia));
    return {
      mesReferencia,
      envio: this.obterOuFalhar(mesReferencia, comando.parceiraId),
    };
  }

  /**
   * @param {MesReferencia} mesReferencia
   * @param {string} parceiraId
   * @returns {Envio}
   * @throws {Error} LG-01 quando o Envio não existe.
   */
  obterOuFalhar(mesReferencia, parceiraId) {
    const envio = this.envioRepository.obterPor(mesReferencia, parceiraId);
    if (envio === null) {
      throw new Error(
        "LG-01: Envio inexistente — '" +
          parceiraId +
          "' × " +
          mesReferencia.toString() +
          ' (recompile o mês se a competência ainda não foi materializada).'
      );
    }
    return envio;
  }
};
