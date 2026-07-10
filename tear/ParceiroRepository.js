/**
 * Colunas da aba `Parceiros_Influenciadoras` (docs/spec/SCHEMA_V2.md).
 *
 * `SENHA_HASH` é credencial: o Repository a lê, o Service a consome para
 * verificar, e NENHUM DTO a carrega para fora.
 */
const CAMPOS_PARCEIRO = Object.freeze({
  ID: 'ID_Influenciadora',
  NOME: 'Nome',
  STATUS_CONTRATO: 'Status_Contrato',
  CATEGORIA: 'Categoria',
  CUPOM: 'Cupom',
  SENHA_HASH: 'Senha_Hash'
});

/** Única camada autorizada a tocar `SpreadsheetApp` para a entidade Parceiro. */
class ParceiroRepository {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActive();
  }

  /** Cupom casa sem diferenciar caixa nem espaço: é o que a parceira digita. */
  findByCupom(cupom) {
    if (!cupom) {
      return null;
    }

    const encontrados = this._porCupom(cupom);

    return encontrados.length ? encontrados[0] : null;
  }

  /**
   * Nada na planilha impede dois cadastros com o mesmo cupom (ou com cupons que
   * normalizam igual). Escolher a primeira linha em silêncio faria a parceira
   * logar como outra pessoa. Falha alto.
   */
  _porCupom(cupom) {
    const alvo = this._normalizar(cupom);
    const encontrados = this._linhas().filter(
      linha => this._normalizar(linha[CAMPOS_PARCEIRO.CUPOM]) === alvo
    );

    if (encontrados.length > 1) {
      throw new Error(`Cadastro inconsistente: o cupom "${cupom}" está duplicado.`);
    }

    return encontrados;
  }

  getById(idInfluenciadora) {
    if (!idInfluenciadora) {
      return null;
    }

    const alvo = String(idInfluenciadora).trim();
    const encontrado = this._linhas().find(
      linha => String(linha[CAMPOS_PARCEIRO.ID]).trim() === alvo
    );

    return encontrado || null;
  }

  /** Escrita da credencial. Só o provisionamento administrativo chama isto. */
  definirSenhaHash(cupom, hash) {
    const nome = PLANILHAS.PARCEIROS_INFLUENCIADORAS;
    const { aba, cabecalho, linhas } = lerAbaComCabecalho(this.spreadsheet, nome);
    const cupomIdx = indiceDaColuna(cabecalho, CAMPOS_PARCEIRO.CUPOM, nome);
    const senhaIdx = indiceDaColuna(cabecalho, CAMPOS_PARCEIRO.SENHA_HASH, nome);

    const alvo = this._normalizar(cupom);
    const posicoes = linhas
      .map((linha, i) => (this._normalizar(linha[cupomIdx]) === alvo ? i : -1))
      .filter(i => i !== -1);

    if (posicoes.length > 1) {
      throw new Error(`Cadastro inconsistente: o cupom "${cupom}" está duplicado.`);
    }

    const posicao = posicoes.length ? posicoes[0] : -1;

    if (posicao === -1) {
      throw new Error(`Parceira com cupom "${cupom}" não encontrada.`);
    }

    // +2: a linha 1 é o cabeçalho e `linhas` é 0-indexado.
    aba.getRange(posicao + 2, senhaIdx + 1).setValue(hash);
  }

  _linhas() {
    const nome = PLANILHAS.PARCEIROS_INFLUENCIADORAS;
    const { cabecalho, linhas } = lerAbaComCabecalho(this.spreadsheet, nome);

    return linhasComChave(cabecalho, linhas, CAMPOS_PARCEIRO.ID, nome)
      .map(linha => linhaParaObjeto(cabecalho, linha));
  }

  _normalizar(valor) {
    return String(valor === null || valor === undefined ? '' : valor).trim().toUpperCase();
  }
}
