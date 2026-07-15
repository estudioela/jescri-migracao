/**
 * CONTROLLER: ColaboracaoMensalController — adapta o contrato externo da
 * compilação do mês (SPEC-005 UC-005.01).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * CompiladorDoMes e devolve SEMPRE o envelope padrão
 * {success,data}/{success,error} (PROJECT_GOVERNANCE §3.3, via
 * envelopeOk/envelopeFail).
 *
 * Expõe apenas uma projeção serializável das Colaborações — nunca a
 * instância de domínio. A projeção não carrega PII (o Snapshot já nasce
 * sem PII, RN-10).
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {CompiladorDoMes} compiladorDoMes
 */

this.ColaboracaoMensalController = class ColaboracaoMensalController {
  constructor(compiladorDoMes) {
    this.compiladorDoMes = compiladorDoMes;
  }

  /**
   * Adapta o comando CompilarMes ao contrato externo.
   * @param {{mesReferencia: string}} dados dados do formulário ('AAAA-MM').
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  compilarMes(dados) {
    try {
      const resultado = this.compiladorDoMes.executar(dados && dados.mesReferencia);
      return envelopeOk({
        mesReferencia: resultado.mesReferencia,
        jaCompilada: resultado.jaCompilada,
        colaboracoes: resultado.colaboracoes.map((colaboracao) => ({
          parceiraId: colaboracao.parceiraId,
          mesReferencia: colaboracao.mesReferencia.toString(),
          estado: colaboracao.estado,
          snapshot: {
            valorMensal: colaboracao.snapshot.valorMensal,
            formatosContratados: colaboracao.snapshot.formatosContratados.slice(),
            quantidadePorFormato: Object.assign(
              {},
              colaboracao.snapshot.quantidadePorFormato
            ),
          },
        })),
      });
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }
};
