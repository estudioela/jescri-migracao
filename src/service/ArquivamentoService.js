/**
 * SERVICE: ArquivamentoService — única entrada para os comandos de
 * Arquivamento (SPEC-034, UC-034.01/UC-034.02).
 *
 * RN-07 (resolve D-01, §21 da SPEC): a competência é elegível para selagem
 * quando TODO item existente das 3 origens (Entrega/SPEC-012 `Publicado`,
 * Envio/SPEC-016 `Entregue`, Obrigação `Mensal`/SPEC-020 `Pago`) já está em
 * estado terminal. Ausência de itens de um módulo é vacuamente satisfeita
 * (CB-03) — nunca bloqueia. Obrigação `Avulso` não tem competência
 * (`mesReferencia === null`) e já fica fora de `listarPagamentos`.
 *
 * A transição de domínio (Concluída -> Arquivada, CM-06) é validada aqui
 * sobre os agregados reidratados antes de qualquer escrita — falha fail-fast
 * se a competência não estiver no estado que o domínio exige, sem persistir
 * nada (CB-01/AR-02/AR-03).
 *
 * Depende só de Services de outros módulos (EntregaService/EnvioService/
 * PagamentoService) para as checagens de elegibilidade — nunca de
 * ACL/Repository alheios (mesmo princípio de SPEC-027/030/032). O único
 * Repository próprio é o da Colaboração Mensal, porque selar a competência
 * É a responsabilidade deste Service sobre o seu próprio agregado.
 *
 * Não pode: falar HTTP/HTML; formatar envelope (Controller); conhecer
 * coluna física (ACL); checar papel/autorização (Q-08, dívida registrada).
 *
 * @param {EntregaService} entregaService
 * @param {EnvioService} envioService
 * @param {PagamentoService} pagamentoService
 * @param {ColaboracaoMensalRepository} colaboracaoMensalRepository
 * @param {object} publicadorDeEventos porta de eventos: publicar(evento).
 */

this.ArquivamentoService = class ArquivamentoService {
  constructor(
    entregaService,
    envioService,
    pagamentoService,
    colaboracaoMensalRepository,
    publicadorDeEventos
  ) {
    this.entregaService = entregaService;
    this.envioService = envioService;
    this.pagamentoService = pagamentoService;
    this.colaboracaoMensalRepository = colaboracaoMensalRepository;
    this.publicadorDeEventos = publicadorDeEventos;
  }

  /**
   * Comando SelarCompetencia(MesReferencia) — UC-034.02.
   * @param {string} mesReferenciaTexto competência no formato canônico 'AAAA-MM'.
   * @returns {{mesReferencia: string, jaSelada: boolean}}
   * @throws {Error} AR-02 se a competência não foi compilada ou tem
   *   pendências operacionais; erro do domínio (CM-06) se a transição de
   *   estado for inválida.
   */
  selarCompetencia(mesReferenciaTexto) {
    const mesReferencia = MesReferencia.deTexto(mesReferenciaTexto);
    const colaboracoes = this.colaboracaoMensalRepository.listarPor(mesReferencia);

    if (colaboracoes.length === 0) {
      throw new Error(
        "AR-02: competência '" + mesReferencia.toString() + "' não foi compilada — nada para selar."
      );
    }
    if (colaboracoes.every((colaboracao) => colaboracao.estado === 'Arquivada')) {
      return { mesReferencia: mesReferencia.toString(), jaSelada: true };
    }

    const entregas = this.entregaService.listarEntregas(mesReferenciaTexto);
    const envios = this.envioService.listarEnvios(mesReferenciaTexto);
    const obrigacoes = this.pagamentoService.listarPagamentos(mesReferenciaTexto);
    const pendente =
      entregas.some((entrega) => entrega.estado !== 'Publicado') ||
      envios.some((envio) => envio.jornada !== 'Entregue') ||
      obrigacoes.some((obrigacao) => obrigacao.estado !== 'Pago');
    if (pendente) {
      throw new Error(
        "AR-02: competência '" + mesReferencia.toString() + "' tem pendências operacionais — selagem recusada."
      );
    }

    colaboracoes.forEach((colaboracao) => {
      if (colaboracao.estado === 'Ativa') {
        colaboracao.concluir();
      }
      colaboracao.arquivar();
    });
    this.colaboracaoMensalRepository.arquivarCompetencia(mesReferencia);
    this.publicadorDeEventos.publicar({
      nome: 'CompetenciaArquivada',
      mesReferencia: mesReferencia.toString(),
    });

    return { mesReferencia: mesReferencia.toString(), jaSelada: false };
  }

  /**
   * Comando ArquivarLote() — UC-034.01: varre todas as competências ainda
   * não seladas por inteiro e sela as que estão elegíveis (RN-07); as
   * demais são reportadas com o motivo da recusa, sem interromper o lote.
   * Sem candidatas → no-op (CB-03).
   * @returns {{resultados: Array<{mesReferencia: string, selada: boolean, motivo: (string|undefined)}>}}
   */
  arquivarLote() {
    const candidatas = [];
    this.colaboracaoMensalRepository.listarTodas().forEach((colaboracao) => {
      if (colaboracao.estado === 'Arquivada') {
        return;
      }
      if (!candidatas.some((mes) => mes.igualA(colaboracao.mesReferencia))) {
        candidatas.push(colaboracao.mesReferencia);
      }
    });

    const resultados = candidatas.map((mesReferencia) => {
      try {
        const selagem = this.selarCompetencia(mesReferencia.toString());
        return { mesReferencia: selagem.mesReferencia, selada: !selagem.jaSelada };
      } catch (erro) {
        return { mesReferencia: mesReferencia.toString(), selada: false, motivo: erro.message };
      }
    });

    return { resultados: resultados };
  }
};
