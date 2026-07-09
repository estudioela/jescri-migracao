/**
 * Pontos de entrada de `google.script.run`. É o que o front-end da V2 enxerga.
 *
 * Nada aqui tem lógica: monta as dependências e delega ao WebAppController,
 * que é quem converte exceção em `{success, data?, error?}`. Uma exceção que
 * escapasse daqui faria o Apps Script devolver uma página de erro em vez de
 * JSON — o modo de falha que a V1 manifestou como "Failed to fetch".
 *
 * As dependências são montadas DENTRO da função, nunca em tempo de carga:
 * `const`/`class` não têm hoisting entre arquivos do Apps Script, e a ordem
 * de carga não é garantida (CLAUDE.md §13).
 */

function _montarControllerDeAtivacao() {
  return new WebAppController(new AtivacaoService(new EventDispatcher(), new AtivacaoRepository()));
}

function apiListarAtivacoesDoCiclo(idCiclo) {
  return _montarControllerDeAtivacao().handleAtivacaoQuery({
    action: ACOES_ATIVACAO.LIST_BY_CYCLE,
    idCiclo: idCiclo
  });
}

function apiObterAtivacao(idAtivacao) {
  return _montarControllerDeAtivacao().handleAtivacaoQuery({
    action: ACOES_ATIVACAO.GET_BY_ID,
    idAtivacao: idAtivacao
  });
}

function apiAlterarEstadoDaAtivacao(idAtivacao, novoEstado) {
  return _montarControllerDeAtivacao().handleAtivacaoUpdate({
    action: ACOES_ATIVACAO.CHANGE_STATE,
    idAtivacao: idAtivacao,
    newState: novoEstado
  });
}
