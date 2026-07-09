/**
 * Orquestra a leitura de ciclos. Devolve DTO, nunca a linha crua do Repository:
 * a UI não pode depender do nome das colunas da planilha.
 *
 * Ciclo não tem invariante de negócio hoje (nenhuma transição, nenhuma regra),
 * então não existe Entity `Ciclo`. Criar uma classe vazia só para simetria com
 * `Ativacao` seria abstração antecipada — CLAUDE.md §12.3.
 */
class CicloService {
  constructor(repository) {
    this.repository = repository || new CicloRepository();
  }

  listar() {
    return this.repository.listarTodos().map(linha => this._paraDto(linha));
  }

  _paraDto(linha) {
    const C = CAMPOS_CICLO;

    return {
      idCiclo: this._texto(linha[C.ID]),
      nome: this._texto(linha[C.NOME]) || this._texto(linha[C.ID]),
      inicioLogistica: this._data(linha[C.INICIO_LOGISTICA]),
      fimOperacao: this._data(linha[C.FIM_OPERACAO])
    };
  }

  _texto(valor) {
    return valor === null || valor === undefined ? '' : String(valor);
  }

  _data(valor) {
    if (valor instanceof Date) {
      return valor.toISOString();
    }

    return this._texto(valor);
  }
}
