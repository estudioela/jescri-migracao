/*************************************************************
 * SINCRONIZADOR ERP — PORTAL DO INFLUENCIADOR
 * Menu superior + Sync Down (Planilha Mãe -> Portal)
 * Esta é a ÚNICA função onOpen do projeto.
 *************************************************************/

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('?? Sincronização ERP')
    .addItem('⬇️ Puxar Dados da Planilha Mãe', 'puxarDadosDaMae')
    .addItem('⬇️ Puxar Históricos da Planilha Mãe', 'puxarHistoricosDaMae')
    .addSeparator()
    .addItem('ℹ️ Testar Conexão com a Mãe', 'testarConexaoMae')
    .addToUi();
}

function testarConexaoMae() {
  const ui = SpreadsheetApp.getUi();
  try {
    const mae = SpreadsheetApp.openById(ID_PLANILHA_MAE);
    const aba = mae.getSheetByName(ABA_MAE);
    if (!aba) throw new Error('Aba "' + ABA_MAE + '" não encontrada.');
    ui.alert('✅ Conectado a: ' + mae.getName() + '\nAba: ' + aba.getName());
  } catch (err) {
    ui.alert('❌ Falha: ' + err.message);
  }
}

/**
 * SYNC DOWN — copia BASE DE DADOS da Mãe para BASE DE APOIO do Portal.
 * Versão robusta: ignora filtros ativos e varre o range máximo real da aba,
 * evitando o problema de getLastRow/getLastColumn retornarem valores menores.
 *
 * IMPORTANTE: abaPortal.clear() apaga a aba inteira antes de reescrever,
 * incluindo colunas que existem só no Portal (como ID_PASTA_DRIVE, gravada
 * pelo WebApp.gs em iniciarUpload). Por isso, antes de limpar, preservamos
 * essa coluna casando por CUPOM e restauramos os valores depois de escrever
 * os dados novos da Mãe. Sem isso, cada sync faria o portal recriar uma
 * pasta nova no Drive para influenciadoras que já tinham pasta.
 */
function puxarDadosDaMae() {
  const ui = SpreadsheetApp.getUi();
  try {
    const mae    = SpreadsheetApp.openById(ID_PLANILHA_MAE);
    const abaMae = mae.getSheetByName(ABA_MAE);
    if (!abaMae) throw new Error('Aba "' + ABA_MAE + '" não encontrada na Mãe.');

    // Remove filtro ativo (se houver)
    const filtro = abaMae.getFilter();
    if (filtro) filtro.remove();

    // Varre o range MÁXIMO real da aba
    const maxRows = abaMae.getMaxRows();
    const maxCols = abaMae.getMaxColumns();
    const tudo    = abaMae.getRange(1, 1, maxRows, maxCols).getValues();

    // Descobre última linha e coluna com dados de verdade
    let ultLinha = 0, ultCol = 0;
    for (let r = 0; r < tudo.length; r++) {
      for (let c = 0; c < tudo[r].length; c++) {
        if (tudo[r][c] !== '' && tudo[r][c] !== null) {
          if (r + 1 > ultLinha) ultLinha = r + 1;
          if (c + 1 > ultCol)   ultCol   = c + 1;
        }
      }
    }
    if (ultLinha < 2 || ultCol < 1) throw new Error('BASE DE DADOS está vazia.');

    // Recorta a matriz só na área com dados
    const dados = tudo.slice(0, ultLinha).map(l => l.slice(0, ultCol));

    // Grava no Portal
    const portal  = SpreadsheetApp.openById(ID_PLANILHA_PORTAL);
    let abaPortal = portal.getSheetByName(ABA_PORTAL);
    if (!abaPortal) abaPortal = portal.insertSheet(ABA_PORTAL);

    // Lock durante a janela clear()+rewrite: evita que uma leitura do WebApp.gs
    // (getPendencias, getPerfil etc.) veja a aba pela metade, vazia ou sem
    // o ID_PASTA_DRIVE ainda restaurado. As funções de leitura em WebApp.gs
    // também precisam adquirir este mesmo lock para o efeito valer de fato.
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    let pastasRestauradas = 0;
    try {
      // Preserva o ID_PASTA_DRIVE (coluna exclusiva do Portal) antes do clear(),
      // casando por CUPOM. MAP vem de config.gs, mesmo projeto, mesmo escopo global.
      const colPastaDrive = MAP.BASE.ID_PASTA_DRIVE;
      const colCupom = MAP.BASE.CUPOM;
      const pastaPorCupom = {};
      const ultimaLinhaAntiga = abaPortal.getLastRow();
      const ultimaColAntiga = abaPortal.getLastColumn();
      if (ultimaLinhaAntiga >= 2 && ultimaColAntiga >= colPastaDrive) {
        const dadosAntigos = abaPortal.getRange(1, 1, ultimaLinhaAntiga, ultimaColAntiga).getValues();
        for (let i = 1; i < dadosAntigos.length; i++) {
          const cupomAntigo = (dadosAntigos[i][colCupom - 1] || "").toString().trim().toUpperCase();
          const pastaAntiga = dadosAntigos[i][colPastaDrive - 1];
          if (cupomAntigo && pastaAntiga) {
            pastaPorCupom[cupomAntigo] = pastaAntiga;
          }
        }
      }

      abaPortal.clear();
      abaPortal.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

      // Restaura o ID_PASTA_DRIVE preservado, casando por CUPOM
      for (let i = 1; i < dados.length; i++) {
        const cupomNovo = (dados[i][colCupom - 1] || "").toString().trim().toUpperCase();
        if (cupomNovo && pastaPorCupom[cupomNovo]) {
          abaPortal.getRange(i + 1, colPastaDrive).setValue(pastaPorCupom[cupomNovo]);
          pastasRestauradas++;
        }
      }

      // Garante a coluna DADOS_REVISADOS
      const headers = dados[0].map(h => String(h).trim().toUpperCase());
      if (headers.indexOf('DADOS_REVISADOS') === -1) {
        abaPortal.getRange(1, dados[0].length + 1).setValue('DADOS_REVISADOS');
      }

      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    ui.alert('✅ Sync concluído!\n\nLinhas: ' + (dados.length - 1) +
             '\nColunas: ' + dados[0].length +
             '\nPastas do Drive preservadas: ' + pastasRestauradas);
  } catch (err) {
    ui.alert('❌ Erro ao puxar dados: ' + err.message);
  }
}

/**
 * SYNC DOWN — copia HISTÓRICO DE CONTEÚDOS e HISTÓRICO DE PAGAMENTOS da Mãe
 * (onde scripts próprios geram esse histórico) para o Portal, aba por aba,
 * com o mesmo nome nos dois lados.
 *
 * Mais simples que puxarDadosDaMae(): o Portal só LÊ essas abas em
 * getHistorico() (entregas.gs), nunca escreve nelas. Não existe coluna
 * exclusiva do Portal pra preservar, então é clear() + rewrite direto.
 *
 * Se uma aba de histórico não existir ainda no Portal, ela é criada.
 * Se não existir na Mãe, essa aba é pulada (reportada no alerta final)
 * em vez de travar o sync inteiro.
 */
function puxarHistoricosDaMae() {
  const ui = SpreadsheetApp.getUi();
  const resultados = [];

  try {
    const mae    = SpreadsheetApp.openById(ID_PLANILHA_MAE);
    const portal = SpreadsheetApp.openById(ID_PLANILHA_PORTAL);

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      ABAS_HISTORICO.forEach(function(nomeAba) {
        const abaMae = mae.getSheetByName(nomeAba);
        if (!abaMae) {
          resultados.push('⚠️ "' + nomeAba + '": aba não encontrada na Mãe, pulada.');
          return;
        }

        // Remove filtro ativo (se houver)
        const filtro = abaMae.getFilter();
        if (filtro) filtro.remove();

        // Varre o range MÁXIMO real da aba (mesmo motivo de puxarDadosDaMae)
        const maxRows = abaMae.getMaxRows();
        const maxCols = abaMae.getMaxColumns();
        const tudo    = abaMae.getRange(1, 1, maxRows, maxCols).getValues();

        let ultLinha = 0, ultCol = 0;
        for (let r = 0; r < tudo.length; r++) {
          for (let c = 0; c < tudo[r].length; c++) {
            if (tudo[r][c] !== '' && tudo[r][c] !== null) {
              if (r + 1 > ultLinha) ultLinha = r + 1;
              if (c + 1 > ultCol)   ultCol   = c + 1;
            }
          }
        }

        if (ultLinha < 1 || ultCol < 1) {
          resultados.push('⚠️ "' + nomeAba + '": está vazia na Mãe, pulada.');
          return;
        }

        const dados = tudo.slice(0, ultLinha).map(l => l.slice(0, ultCol));

        let abaPortal = portal.getSheetByName(nomeAba);
        if (!abaPortal) abaPortal = portal.insertSheet(nomeAba);

        abaPortal.clear();
        abaPortal.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

        resultados.push('✅ "' + nomeAba + '": ' + (dados.length - 1) + ' linhas.');
      });

      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    ui.alert('Sync de históricos concluído!\n\n' + resultados.join('\n'));
  } catch (err) {
    ui.alert('❌ Erro ao puxar históricos: ' + err.message);
  }
}
