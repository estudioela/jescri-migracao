/**
 * Leitura de aba por NOME de cabeçalho, compartilhada pelos Repositories.
 *
 * São `function` declarations de propósito, não uma classe base: `class X
 * extends Y` resolve `Y` em tempo de carga, e a ordem de carga entre arquivos
 * do Apps Script não é garantida (CLAUDE.md §13). Funções sofrem hoisting; a
 * herança não.
 *
 * Só Repositories chamam estas funções — são elas que tocam `SpreadsheetApp`.
 */

function abaObrigatoria(planilha, nomeAba) {
  const aba = planilha.getSheetByName(nomeAba);

  if (!aba) {
    throw new Error(`Aba "${nomeAba}" não encontrada na planilha.`);
  }

  return aba;
}

function lerAbaComCabecalho(planilha, nomeAba) {
  const aba = abaObrigatoria(planilha, nomeAba);
  const valores = aba.getDataRange().getValues();
  const cabecalho = valores.shift() || [];

  return { aba, cabecalho, linhas: valores };
}

/**
 * Resolver coluna por nome, nunca por índice: inserir uma coluna na planilha
 * não pode quebrar a leitura em silêncio. Foi o risco #1 do sistema até 2026-07-07.
 */
function indiceDaColuna(cabecalho, campo, nomeAba) {
  const indice = cabecalho.indexOf(campo);

  if (indice === -1) {
    throw new Error(`Coluna "${campo}" ausente em "${nomeAba}".`);
  }

  return indice;
}

function linhaParaObjeto(cabecalho, linha) {
  return cabecalho.reduce((obj, coluna, i) => {
    if (coluna) {
      obj[coluna] = linha[i];
    }
    return obj;
  }, {});
}

/**
 * `getDataRange()` devolve também as linhas em branco que o Sheets mantém
 * abaixo dos dados. Sem este filtro elas viram registros fantasma.
 */
function linhasComChave(cabecalho, linhas, campoChave, nomeAba) {
  const idx = indiceDaColuna(cabecalho, campoChave, nomeAba);

  return linhas.filter(linha => String(linha[idx]).trim() !== '');
}
