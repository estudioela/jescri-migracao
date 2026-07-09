/**
 * Pontos de entrada de `google.script.run`. É o que o front-end da V2 enxerga.
 *
 * Nada aqui tem lógica de negócio: monta as dependências e delega ao
 * WebAppController, que converte exceção de domínio em `{success, data?, error?}`.
 *
 * Por que existe um try/catch AQUI, se "só o Controller captura" (CLAUDE.md §13):
 * a montagem das dependências acontece ANTES de qualquer try do Controller, e
 * `new AtivacaoRepository()` chama `SpreadsheetApp.getActive()`. Se a planilha
 * estiver indisponível, ou se um dos arquivos da V2 não tiver subido no push
 * (allowlist do `.claspignore`), o throw acontece fora do alcance do Controller
 * e o Apps Script devolve uma PÁGINA DE ERRO em vez de JSON — o front-end recebe
 * HTML onde esperava um envelope. Foi assim que a V1 manifestou o "Failed to
 * fetch". A regra continua valendo para as camadas de dentro: Entity, Service e
 * Repository seguem propagando.
 *
 * As dependências são montadas DENTRO da função, nunca em tempo de carga:
 * `const`/`class` não têm hoisting entre arquivos do Apps Script, e a ordem de
 * carga não é garantida (CLAUDE.md §13).
 */

function _comEnvelope(operacao) {
  try {
    return operacao();
  } catch (erro) {
    return { success: false, error: erro && erro.message ? erro.message : String(erro) };
  }
}

function _montarControllerDeAtivacao() {
  return new WebAppController(new AtivacaoService(new EventDispatcher(), new AtivacaoRepository()));
}

function _montarControllerDeCiclo() {
  return new CicloController(new CicloService(new CicloRepository()));
}

function apiListarAtivacoesDoCiclo(idCiclo) {
  return _comEnvelope(function () {
    return _montarControllerDeAtivacao().handleAtivacaoQuery({
      action: ACOES_ATIVACAO.LIST_BY_CYCLE,
      idCiclo: idCiclo
    });
  });
}

function apiObterAtivacao(idAtivacao) {
  return _comEnvelope(function () {
    return _montarControllerDeAtivacao().handleAtivacaoQuery({
      action: ACOES_ATIVACAO.GET_BY_ID,
      idAtivacao: idAtivacao
    });
  });
}

function apiAlterarEstadoDaAtivacao(idAtivacao, novoEstado) {
  return _comEnvelope(function () {
    return _montarControllerDeAtivacao().handleAtivacaoUpdate({
      action: ACOES_ATIVACAO.CHANGE_STATE,
      idAtivacao: idAtivacao,
      newState: novoEstado
    });
  });
}

function apiListarCiclos() {
  return _comEnvelope(function () {
    return _montarControllerDeCiclo().handleCicloQuery({ action: ACOES_CICLO.LIST_ALL });
  });
}
