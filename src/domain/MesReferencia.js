/**
 * VALUE OBJECT: MesReferencia
 *
 * Representa um mês de referência do programa de colaboração, no formato
 * canônico 'AAAA-MM' (ex.: '2026-07') — ordenável e comparável, conforme
 * ADR-001 §3.
 *
 * Invariantes preservadas (SPEC-005 §6.1):
 * - 1 ≤ MM ≤ 12.
 * - AAAA ≥ 2020.
 * - Igualdade estrutural: dois VOs são iguais sse MM e AAAA iguais.
 * - Ordenação total definida (cronológica).
 *
 * Origem física (Contrato §7.2): a projeção sobre MES_REFERENCIA +
 * ANO_REFERENCIA pertence à ACL — este VO nunca conhece coluna física,
 * planilha ou ACL.
 *
 * Erros: toda construção inválida falha fail-fast com Error cuja mensagem
 * inclui o código CM-02 (SPEC-005 §17) e identifica o valor rejeitado.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.MesReferencia = class MesReferencia {
  /**
   * @param {number} ano inteiro, >= 2020.
   * @param {number} mes inteiro, entre 1 e 12.
   */
  constructor(ano, mes) {
    if (!Number.isInteger(ano) || !Number.isInteger(mes)) {
      throw new Error(
        'CM-02: MesReferencia inválida — ano e mês devem ser inteiros (recebido ano=' +
          ano +
          ', mes=' +
          mes +
          ').'
      );
    }
    if (mes < 1 || mes > 12) {
      throw new Error('CM-02: MesReferencia inválida — mês fora do intervalo 1-12 (recebido ' + mes + ').');
    }
    if (ano < 2020) {
      throw new Error('CM-02: MesReferencia inválida — ano anterior a 2020 (recebido ' + ano + ').');
    }

    this.ano = ano;
    this.mes = mes;
    Object.freeze(this);
  }

  /**
   * Constrói a partir do formato canônico 'AAAA-MM'. Qualquer desvio
   * (formato, tipo, vazio) falha fail-fast com CM-02.
   * @param {string} texto
   * @returns {MesReferencia}
   */
  static deTexto(texto) {
    if (typeof texto !== 'string') {
      throw new Error('CM-02: MesReferencia inválida — texto esperado no formato AAAA-MM (recebido ' + texto + ').');
    }
    const casamento = /^(\d{4})-(\d{2})$/.exec(texto);
    if (!casamento) {
      throw new Error('CM-02: MesReferencia inválida — texto fora do formato canônico AAAA-MM (recebido "' + texto + '").');
    }
    const ano = Number(casamento[1]);
    const mes = Number(casamento[2]);
    return new MesReferencia(ano, mes);
  }

  /**
   * @returns {string} 'AAAA-MM' com mês zero-padded (ex.: '2026-07').
   */
  toString() {
    const mesTexto = this.mes < 10 ? '0' + this.mes : String(this.mes);
    return this.ano + '-' + mesTexto;
  }

  /**
   * Igualdade estrutural: ano e mês iguais.
   * @param {MesReferencia} outro
   * @returns {boolean} false quando `outro` não é um MesReferencia (mesmo
   *   padrão das demais VOs/entidades do domínio, ex. ColaboracaoMensal).
   */
  igualA(outro) {
    return outro instanceof MesReferencia && this.ano === outro.ano && this.mes === outro.mes;
  }

  /**
   * Ordenação total cronológica.
   * @param {MesReferencia} outro
   * @returns {number} -1 se anterior, 0 se igual, 1 se posterior.
   * @throws {Error} CM-02 quando `outro` não é um MesReferencia — a
   *   ordenação não tem um valor de retorno seguro para comparar contra
   *   outro tipo, então falha fail-fast em vez de ler propriedades de um
   *   objeto arbitrário.
   */
  comparadoCom(outro) {
    if (!(outro instanceof MesReferencia)) {
      throw new Error(
        'CM-02: MesReferencia inválida — comparadoCom exige outro Value Object MesReferencia.'
      );
    }
    if (this.ano !== outro.ano) {
      return this.ano < outro.ano ? -1 : 1;
    }
    if (this.mes !== outro.mes) {
      return this.mes < outro.mes ? -1 : 1;
    }
    return 0;
  }
};
