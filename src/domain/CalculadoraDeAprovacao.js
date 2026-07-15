/**
 * SERVIÇO DE DOMÍNIO: CalculadoraDeAprovacao (SPEC-009 §6.3)
 *
 * Deriva a Data de Aprovação Interna a partir da data de postagem (RN-01):
 * aprovação = postagem − 7 dias; se o resultado cair em
 * sexta → +3 (segunda), sábado → +2 (segunda), domingo → +1 (segunda).
 * A aprovação nunca cai em fim de semana nem em sexta-feira.
 *
 * Invariantes preservadas:
 * - INV-03: a data de aprovação é sempre derivada, nunca arbitrária — este
 *   serviço é o único caminho de cálculo.
 * - RNF-01: cálculo determinístico (aritmética de calendário local, sem
 *   relógio, sem fuso, sem I/O) e testável.
 * - BR-02 (§17): data de postagem inválida falha fail-fast.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.CalculadoraDeAprovacao = class CalculadoraDeAprovacao {
  /**
   * Aplica RN-01 sobre a data de postagem.
   * @param {Date} dataPostagem data planejada de postagem do conteúdo.
   * @returns {Date} data de aprovação interna derivada.
   * @throws {Error} BR-02 quando a data de postagem não é uma Date válida.
   */
  static calcular(dataPostagem) {
    // Duck-typing em vez de instanceof: Date pode vir de outro realm
    // (harness vm) e instanceof falharia entre realms.
    if (
      dataPostagem == null ||
      typeof dataPostagem.getTime !== 'function' ||
      isNaN(dataPostagem.getTime())
    ) {
      throw new Error(
        "BR-02: data de postagem inválida — esperada Date válida (recebido '" +
          dataPostagem +
          "')."
      );
    }

    const aprovacao = new Date(
      dataPostagem.getFullYear(),
      dataPostagem.getMonth(),
      dataPostagem.getDate() - 7
    );

    // getDay(): 0=domingo, 5=sexta, 6=sábado (RN-01: ajuste até segunda).
    const diaDaSemana = aprovacao.getDay();
    let ajuste = 0;
    if (diaDaSemana === 5) {
      ajuste = 3;
    } else if (diaDaSemana === 6) {
      ajuste = 2;
    } else if (diaDaSemana === 0) {
      ajuste = 1;
    }

    return new Date(
      aprovacao.getFullYear(),
      aprovacao.getMonth(),
      aprovacao.getDate() + ajuste
    );
  }
};
