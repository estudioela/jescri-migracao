/**
 * SCHEMA_EXPORTER
 * Gera um mapa vivo da estrutura REAL da planilha "[JESCRI] INFLUÊNCIA 360º",
 * lido exclusivamente via SpreadsheetApp/ScriptApp — não depende de FLOW.md,
 * CLAUDE.md nem de nenhuma suposição sobre o restante do código.
 *
 * Roda em 3 gatilhos:
 *   1. onEdit instalável (aoEditarExportarSchemaSeNecessario) — com debounce.
 *   2. Trigger de tempo (exportarSchemaAutomatico) — a cada
 *      SCHEMA_EXPORT_INTERVALO_MINUTOS minutos.
 *   3. Ao gerar novo mês (chamado no fim de gerarNovoMesCompleto(), Código.js).
 *
 * Ambos os triggers instaláveis (1 e 2) exigem UMA instalação manual única —
 * rode "Instalar Triggers Automáticos" no menu, ou instalarTriggersSchemaExporter()
 * direto. Isso é uma restrição da plataforma Apps Script (triggers instaláveis
 * não podem ser autocriados sem uma execução autorizada), não uma escolha de
 * projeto — mesma ressalva já documentada no CLAUDE.md seção 6 para onFormSubmit.
 *
 * onEdit já existe como trigger SIMPLES em Código.js e não pode chamar DriveApp
 * (triggers simples não têm autorização para isso — a chamada falharia
 * silenciosamente, já que aquele onEdit engole erros em catch(err){}). Por isso
 * o gatilho 1 acima é um trigger INSTALÁVEL separado, com nome de função
 * diferente — não colide com o onEdit(e) existente, os dois rodam independentes.
 *
 * Saída: SYSTEM_SCHEMA.json + SYSTEM_SCHEMA.md, salvos na mesma pasta do Drive
 * onde está a planilha (sobrescrevendo a versão anterior a cada execução real).
 */

const SCHEMA_EXPORT_INTERVALO_MINUTOS = 15; // valores aceitos por ScriptApp: 1, 5, 10, 15 ou 30
const SCHEMA_EXPORT_DEBOUNCE_MS = 20 * 1000; // onEdit não roda de novo antes disso
const SCHEMA_EXPORT_PROP_ULTIMO_HASH = 'SCHEMA_EXPORT_ULTIMO_HASH';
const SCHEMA_EXPORT_PROP_ULTIMA_EXEC_MS = 'SCHEMA_EXPORT_ULTIMA_EXEC_MS';

// ======================================================
// GATILHOS (pontos de entrada)
// ======================================================

// Menu manual — sempre força escrita (ignora hash/debounce) e sempre avisa o usuário.
function exportarSchemaCompleto() {
  const ui = SpreadsheetApp.getUi();
  try {
    const resultado = executarExportacaoSchema({ forcar: true, respeitarDebounce: false });
    const integridade = resultado.schema.integridade;
    let msg = 'Arquivos gerados na mesma pasta do Drive da planilha:\n- ' + resultado.arqJson.getName() + '\n- ' + resultado.arqMd.getName();
    if (!integridade.ok) {
      msg += '\n\n⚠️ ' + integridade.totalProblemas + ' problema(s) de integridade encontrado(s):\n' +
        integridade.problemas.map(function (p) { return '- ' + p.detalhe; }).join('\n');
    } else {
      msg += '\n\n✓ Checklist de integridade: nenhum problema encontrado.';
    }
    ui.alert('Schema exportado', msg, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Erro ao exportar schema', e.message, ui.ButtonSet.OK);
  }
}

// Trigger instalável de onEdit — silencioso, nunca lança erro (não pode quebrar
// a edição do usuário) e respeita debounce (não reexporta a cada tecla digitada).
function aoEditarExportarSchemaSeNecessario(e) {
  try {
    executarExportacaoSchema({ forcar: false, respeitarDebounce: true });
  } catch (err) { /* silencioso: exportação de schema nunca pode quebrar a edição da planilha */ }
}

// Trigger de tempo — silencioso; não usa debounce próprio (o intervalo do
// próprio trigger já espaça as execuções), mas ainda pula a escrita se o hash
// do estado não mudou desde a última exportação.
function exportarSchemaAutomatico() {
  try {
    executarExportacaoSchema({ forcar: false, respeitarDebounce: false });
  } catch (err) { /* silencioso: mesma razão do onEdit */ }
}

// Chamado no fim de gerarNovoMesCompleto() (Código.js). Silencioso pelo mesmo motivo.
function exportarSchemaAoIniciarNovoMes() {
  try {
    executarExportacaoSchema({ forcar: true, respeitarDebounce: false });
  } catch (err) { /* silencioso: geração de mês não pode ser quebrada por isso */ }
}

// ======================================================
// INSTALAÇÃO DE TRIGGERS (passo manual único — restrição da plataforma)
// ======================================================

// Núcleo sem UI — reaproveitado pelo menu e por clasp run (ver Headless abaixo).
function instalarTriggersSchemaExporterInterno() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let removidos = 0;

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'aoEditarExportarSchemaSeNecessario' || t.getHandlerFunction() === 'exportarSchemaAutomatico') {
      ScriptApp.deleteTrigger(t);
      removidos++;
    }
  });

  ScriptApp.newTrigger('aoEditarExportarSchemaSeNecessario').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('exportarSchemaAutomatico').timeBased().everyMinutes(SCHEMA_EXPORT_INTERVALO_MINUTOS).create();

  return {
    ok: true,
    triggersRemovidos: removidos,
    triggersCriados: ['aoEditarExportarSchemaSeNecessario (onEdit)', 'exportarSchemaAutomatico (a cada ' + SCHEMA_EXPORT_INTERVALO_MINUTOS + ' min)']
  };
}

function instalarTriggersSchemaExporter() {
  const ui = SpreadsheetApp.getUi();
  try {
    const resultado = instalarTriggersSchemaExporterInterno();
    ui.alert(
      'Triggers instalados',
      'SCHEMA_EXPORTER agora roda automaticamente:\n' +
        '- a cada edição na planilha (com debounce de ' + (SCHEMA_EXPORT_DEBOUNCE_MS / 1000) + 's)\n' +
        '- a cada ' + SCHEMA_EXPORT_INTERVALO_MINUTOS + ' minutos\n' +
        '- ao gerar um novo mês\n\n' +
        'Triggers antigos removidos: ' + resultado.triggersRemovidos + '.\n' +
        'Este passo só precisa ser executado uma vez (ou de novo se os triggers forem removidos manualmente, ex.: no painel de Triggers do Apps Script).',
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('Erro ao instalar triggers', e.message, ui.ButtonSet.OK);
  }
}

function instalarTriggersSchemaExporterHeadless() {
  try {
    return instalarTriggersSchemaExporterInterno();
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}

// ======================================================
// NÚCLEO COMPARTILHADO — lock, debounce, skip-se-inalterado
// ======================================================

function executarExportacaoSchema(opts) {
  opts = opts || {};
  const forcar = !!opts.forcar;
  const respeitarDebounce = !!opts.respeitarDebounce;
  const props = PropertiesService.getScriptProperties();

  if (respeitarDebounce) {
    const ultimaExecMs = parseInt(props.getProperty(SCHEMA_EXPORT_PROP_ULTIMA_EXEC_MS) || '0', 10);
    if (Date.now() - ultimaExecMs < SCHEMA_EXPORT_DEBOUNCE_MS) {
      Logger.log('SCHEMA_EXPORTER: pulado (debounce, %sms desde a última execução)', Date.now() - ultimaExecMs);
      return { pulou: true, motivo: 'debounce' };
    }
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log('SCHEMA_EXPORTER: pulado (lock ocupado por outra execução concorrente)');
    return { pulou: true, motivo: 'lock_ocupado' };
  }

  try {
    if (respeitarDebounce) props.setProperty(SCHEMA_EXPORT_PROP_ULTIMA_EXEC_MS, String(Date.now()));

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const schema = gerarSchemaPlanilha(ss);

    if (!forcar) {
      const hashAnterior = props.getProperty(SCHEMA_EXPORT_PROP_ULTIMO_HASH);
      if (hashAnterior === schema.versao.hashEstado) {
        Logger.log('SCHEMA_EXPORTER: pulado (hash %s inalterado desde a última exportação)', schema.versao.hashEstado.substring(0, 12));
        return { pulou: true, motivo: 'sem_mudanca', schema: schema };
      }
    }

    const arqJson = salvarSchemaJson(schema);
    const arqMd = salvarSchemaMarkdown(schema);
    props.setProperty(SCHEMA_EXPORT_PROP_ULTIMO_HASH, schema.versao.hashEstado);

    Logger.log('SCHEMA_EXPORTER: exportado (hash %s, %s abas, forcar=%s)', schema.versao.hashEstado.substring(0, 12), schema.abas.length, forcar);
    return { pulou: false, schema: schema, arqJson: arqJson, arqMd: arqMd };
  } catch (e) {
    Logger.log('SCHEMA_EXPORTER: ERRO durante a exportação — %s', e.message);
    throw e;
  } finally {
    lock.releaseLock();
  }
}

// ======================================================
// GERAÇÃO DO SCHEMA (só o que é lido de fato da planilha/projeto)
// ======================================================

function gerarSchemaPlanilha(ss) {
  const abas = ss.getSheets().map(function (sh) { return gerarSchemaAba(sh); });

  return {
    planilha: ss.getName(),
    versao: {
      geradoEm: Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd'T'HH:mm:ssXXX"),
      hashEstado: calcularHashEstado(abas)
    },
    triggersInstalados: listarTriggersInstalados(),
    observacaoTriggers: "Apps Script não permite associar um trigger instalado a uma aba " +
      "específica, nem inspecionar quais funções do projeto leem/escrevem cada aba. A lista " +
      "de triggers abaixo é do projeto inteiro (global), não por aba — item 5 do objetivo " +
      "('funções associadas no código') só é detectável nesse nível, via ScriptApp; qualquer " +
      "associação função↔aba além disso exigiria ler o código-fonte, fora do escopo deste " +
      "exportador (que usa exclusivamente SpreadsheetApp/ScriptApp).",
    integridade: verificarIntegridadeSistema(ss),
    abas: abas
  };
}

// ======================================================
// CHECKLIST DE INTEGRIDADE — valida na planilha viva o risco que o CLAUDE.md
// já documenta: MAP.BASE (mae/WebApp.js) usa índice fixo de coluna, não
// getHeaderMap(). Se alguém inserir/remover coluna em BASE DE DADOS, login e
// perfil quebram silenciosamente (leem célula errada, sem erro). Este check
// lê o cabeçalho real de BASE DE DADOS e compara com o nome real esperado em
// cada posição.
//
// Os nomes de propriedade em MAP.BASE (NOME, CNPJ) são só aliases internos
// do JS — não precisam bater com o texto literal do cabeçalho, porque
// MAP.BASE nunca lê por nome. O cabeçalho real das colunas D/G é
// INFLUENCIADORA_RAZAO_SOCIAL/INFLUENCIADORA_CNPJ (confirmado de forma
// independente por Código.js:onFormSubmit(), que usa getHeaderMap() e
// referencia esses dois nomes exatos para gravar nas mesmas colunas) — não
// "NOME"/"CNPJ" como uma primeira versão deste checklist assumiu por engano
// (2026-07-05, corrigido após 1ª execução real do QA Shadow apontar falso
// positivo nessas duas colunas).
// ======================================================

const INTEGRIDADE_MAP_BASE_ESPERADO = {
  2: 'INFLU_KEY', 3: 'CUPOM', 4: 'INFLUENCIADORA_RAZAO_SOCIAL', 5: 'EMAIL', 6: 'CHAVE_PIX',
  7: 'INFLUENCIADORA_CNPJ', 8: 'CEP', 9: 'RUA', 10: 'NUMERO', 11: 'COMPLEMENTO',
  13: 'CIDADE', 14: 'UF', 16: 'VALOR_TOTAL'
};

function normalizarCabecalhoIntegridade(v) {
  return (v || '').toString().trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ /g, '_');
}

function verificarIntegridadeSistema(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const problemas = [];

  if (typeof SETUP !== 'undefined' && SETUP.ABAS) {
    Object.keys(SETUP.ABAS).forEach(function (chave) {
      const nomeAba = SETUP.ABAS[chave];
      if (!ss.getSheetByName(nomeAba)) {
        problemas.push({ tipo: 'ABA_AUSENTE', detalhe: 'Aba "' + nomeAba + '" (SETUP.ABAS.' + chave + ') não existe na planilha.' });
      }
    });
  }

  if (typeof MAP !== 'undefined' && MAP.BASE) {
    const shBase = ss.getSheetByName(MAP.BASE.NOME_ABA);
    if (!shBase) {
      problemas.push({ tipo: 'ABA_AUSENTE', detalhe: 'Aba "' + MAP.BASE.NOME_ABA + '" (MAP.BASE) não existe — impossível validar índice fixo.' });
    } else {
      const cabecalhoReal = shBase.getRange(1, 1, 1, shBase.getLastColumn()).getValues()[0];
      Object.keys(INTEGRIDADE_MAP_BASE_ESPERADO).forEach(function (colStr) {
        const col = parseInt(colStr, 10);
        const esperado = INTEGRIDADE_MAP_BASE_ESPERADO[col];
        const real = normalizarCabecalhoIntegridade(cabecalhoReal[col - 1]);
        if (real !== esperado) {
          problemas.push({
            tipo: 'MAP_BASE_DIVERGENTE',
            detalhe: 'Coluna ' + col + ' de "' + MAP.BASE.NOME_ABA + '": esperado "' + esperado + '", encontrado "' + (real || '(vazio)') + '". MAP.BASE usa índice fixo — se a coluna foi inserida/removida, login/perfil quebram silenciosamente (ver CLAUDE.md seção 6).'
          });
        }
      });
    }
  }

  return { ok: problemas.length === 0, totalProblemas: problemas.length, problemas: problemas };
}

// Hash só do conteúdo estrutural das abas (não inclui timestamp nem lista de
// triggers) — é o que muda quando a planilha muda de fato.
function calcularHashEstado(abas) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(abas));
  return bytes.map(function (b) { return ((b < 0 ? b + 256 : b)).toString(16).padStart(2, '0'); }).join('');
}

function gerarSchemaAba(sh) {
  const nome = sh.getName();
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    return { nomeAba: nome, totalColunas: 0, totalLinhasDados: 0, colunas: [], amostraPrimeiraLinha: null, colunasStatus: {} };
  }

  const cabecalho = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (v) {
    return (v === "" || v === null || v === undefined) ? null : v.toString();
  });

  const totalLinhasDados = Math.max(0, lastRow - 1);

  let amostraPrimeiraLinha = null;
  if (totalLinhasDados > 0) {
    const linha = sh.getRange(2, 1, 1, lastCol).getValues()[0];
    amostraPrimeiraLinha = {};
    cabecalho.forEach(function (col, i) {
      if (col) amostraPrimeiraLinha[col] = formatarValorParaJson(linha[i]);
    });
  }

  const colunasStatus = {};
  if (totalLinhasDados > 0) {
    cabecalho.forEach(function (col, i) {
      if (!col || col.toUpperCase().indexOf("STATUS") === -1) return;
      const valores = sh.getRange(2, i + 1, totalLinhasDados, 1).getValues();
      const unicos = {};
      valores.forEach(function (r) {
        const v = (r[0] === "" || r[0] === null || r[0] === undefined) ? "(vazio)" : r[0].toString();
        unicos[v] = true;
      });
      colunasStatus[col] = Object.keys(unicos).sort();
    });
  }

  return {
    nomeAba: nome,
    totalColunas: lastCol,
    totalLinhasDados: totalLinhasDados,
    colunas: cabecalho,
    amostraPrimeiraLinha: amostraPrimeiraLinha,
    colunasStatus: colunasStatus
  };
}

function formatarValorParaJson(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "GMT-3", "dd/MM/yyyy HH:mm");
  return v;
}

function listarTriggersInstalados() {
  return ScriptApp.getProjectTriggers().map(function (t) {
    return {
      funcaoManipuladora: t.getHandlerFunction(),
      tipoEvento: t.getEventType() ? t.getEventType().toString() : null,
      origem: t.getTriggerSource() ? t.getTriggerSource().toString() : null
    };
  });
}

// ======================================================
// SAÍDA: JSON + MARKDOWN, SALVOS NA PASTA DA PLANILHA
// ======================================================

function salvarSchemaJson(schema) {
  return salvarArquivoNaPastaDaPlanilha('SYSTEM_SCHEMA.json', JSON.stringify(schema, null, 2), 'application/json');
}

function salvarSchemaMarkdown(schema) {
  return salvarArquivoNaPastaDaPlanilha('SYSTEM_SCHEMA.md', gerarMarkdownDoSchema(schema), MimeType.PLAIN_TEXT);
}

function salvarArquivoNaPastaDaPlanilha(nomeArquivo, conteudo, mimeType) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const arquivoPlanilha = DriveApp.getFileById(ss.getId());
  const pastas = arquivoPlanilha.getParents();
  const pasta = pastas.hasNext() ? pastas.next() : DriveApp.getRootFolder();

  const existentes = pasta.getFilesByName(nomeArquivo);
  while (existentes.hasNext()) { existentes.next().setTrashed(true); }

  return pasta.createFile(nomeArquivo, conteudo, mimeType);
}

function gerarMarkdownDoSchema(schema) {
  let md = '# SYSTEM_SCHEMA — ' + schema.planilha + '\n\n';
  md += '> Gerado automaticamente por SCHEMA_EXPORTER em ' + schema.versao.geradoEm +
    ' (hash `' + schema.versao.hashEstado.substring(0, 12) + '…`). ' +
    'Fonte exclusiva: `SpreadsheetApp`/`ScriptApp`, direto da planilha viva — não usa FLOW.md nem CLAUDE.md.\n\n';

  md += '## Triggers instalados no projeto (globais — não associáveis a uma aba específica)\n\n';
  if (!schema.triggersInstalados.length) {
    md += '_Nenhum trigger instalável encontrado (ou sem permissão de leitura no momento da execução)._\n\n';
  } else {
    md += '| Função | Tipo de evento | Origem |\n|---|---|---|\n';
    schema.triggersInstalados.forEach(function (t) {
      md += '| `' + t.funcaoManipuladora + '` | ' + (t.tipoEvento || '-') + ' | ' + (t.origem || '-') + ' |\n';
    });
    md += '\n';
  }
  md += '_' + schema.observacaoTriggers + '_\n\n---\n\n';

  md += '## Checklist de integridade\n\n';
  if (schema.integridade.ok) {
    md += '✓ Nenhum problema encontrado.\n\n';
  } else {
    md += '⚠️ ' + schema.integridade.totalProblemas + ' problema(s) encontrado(s):\n\n';
    schema.integridade.problemas.forEach(function (p) {
      md += '- **' + p.tipo + '**: ' + p.detalhe + '\n';
    });
    md += '\n';
  }
  md += '---\n\n';

  schema.abas.forEach(function (aba) {
    md += '## Aba: `' + aba.nomeAba + '`\n\n';
    md += '- Total de colunas: ' + aba.totalColunas + '\n';
    md += '- Total de linhas de dados: ' + aba.totalLinhasDados + '\n\n';

    md += '### Colunas (header row)\n\n';
    md += aba.colunas.length
      ? aba.colunas.map(function (c, i) { return (i + 1) + '. `' + (c || '(vazio)') + '`'; }).join('\n') + '\n\n'
      : '_Aba vazia._\n\n';

    md += '### Amostra (primeira linha de dados)\n\n';
    md += aba.amostraPrimeiraLinha
      ? '```json\n' + JSON.stringify(aba.amostraPrimeiraLinha, null, 2) + '\n```\n\n'
      : '_Sem dados._\n\n';

    md += '### Valores únicos em colunas de status\n\n';
    const chaves = Object.keys(aba.colunasStatus);
    md += chaves.length
      ? chaves.map(function (col) {
          return '- `' + col + '`: ' + aba.colunasStatus[col].map(function (v) { return '`' + v + '`'; }).join(', ');
        }).join('\n') + '\n\n'
      : '_Nenhuma coluna com "STATUS" no nome._\n\n';

    md += '---\n\n';
  });

  return md;
}
