/**
 * QA_SHADOW — camada de teste E2E invisível, sem impacto em produção.
 *
 * Decisão de arquitetura (usuário, 2026-07-05): módulo SEPARADO que só valida
 * CONTRATO (formato das respostas), sem executar login()/iniciarEnvioResumable()/
 * getHistorico()/etc. de verdade. Login/upload/histórico/pagamentos aqui são
 * fixtures fiéis ao formato real (mesmas chaves, mesmo shape), não a lógica de
 * negócio de fato — a alternativa (injetar branch QA nas funções reais) foi
 * descartada por risco de regressão em código crítico de autenticação.
 *
 * As DUAS únicas partes que rodam de verdade contra o sistema real são
 * validarIntegridadeRealQA() e validarSchemaExporterRealQA() — ambas
 * inerentemente somente-leitura (SchemaExporter.js:verificarIntegridadeSistema()
 * e gerarSchemaPlanilha() não escrevem nada), então testam o sistema real sem
 * risco de escrita.
 *
 * Não existe "endpoint de gestor" real no Web App (mae/WebApp.js) — ações de
 * gestor hoje são só menu do ERP / SidebarBackend.js, dentro da planilha, não
 * via google.script.run. As funções QA_MANAGER abaixo espelham o formato dessas
 * funções de sidebar, não de um endpoint Web App que não existe.
 *
 * Exposição: doGet(?mode=qa&token=...) em mae/WebApp.js, protegido por token
 * gerado via configurarTokenQA() (menu) e guardado em PropertiesService — nunca
 * commitado no código. Sem token correto, doGet ignora mode=qa e serve o Portal
 * normalmente (zero mudança de comportamento pra usuário real).
 */

const QA_TOKEN_PROP = 'QA_SHADOW_TOKEN';

const QA_INFLUENCER = {
  influKey: 'QA_INFLUENCER',
  cupom: 'QA0001',
  nome: 'QA Influenciadora Teste',
  cnpj: '00000000000100',
  chavePix: 'qa-influenciadora@teste.qa',
  email: 'qa.influenciadora@teste.qa'
};

const QA_MANAGER = {
  influKey: 'QA_MANAGER',
  nome: 'QA Gestor Teste',
  papel: 'GESTOR_SIMULADO'
};

// ======================================================
// NÚCLEO SEM UI (headless — chamável via clasp run, sem SpreadsheetApp.getUi())
//
// Preferência arquitetural a partir daqui: toda função de menu nova separa
// lógica ("Interno", sem UI) de apresentação (ui.alert) — a versão "Interno"
// fica sempre disponível pra automação via clasp run, sem exigir sessão de
// planilha aberta. As funções de menu abaixo continuam existindo e com o
// mesmo comportamento, só passam a chamar o núcleo em vez de duplicar lógica.
// ======================================================

function gerarTokenQAInterno() {
  const token = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty(QA_TOKEN_PROP, token);
  return { ok: true, token: token };
}

// ======================================================
// GATILHOS (menu)
// ======================================================

function configurarTokenQA() {
  const ui = SpreadsheetApp.getUi();
  const resultado = gerarTokenQAInterno();
  ui.alert(
    'Token QA gerado',
    'Novo token (substitui qualquer anterior):\n\n' + resultado.token +
      '\n\nUse em: .../exec?mode=qa&token=' + resultado.token +
      '\n\nGuarde num lugar seguro — gerar de novo invalida este.',
    ui.ButtonSet.OK
  );
}

function rodarQaShadowAgora() {
  const ui = SpreadsheetApp.getUi();
  try {
    const resultado = runQA_E2E();
    Logger.log('QA_SHADOW: %s', JSON.stringify(resultado));
    ui.alert(
      resultado.aprovado ? 'QA Shadow — aprovado' : 'QA Shadow — falhas encontradas',
      'Duração: ' + resultado.duracaoMs + 'ms\n' +
        'Falhas: ' + resultado.falhas.length +
        (resultado.falhas.length ? '\n- ' + resultado.falhas.join('\n- ') : '') +
        '\n\nJSON completo em Execuções > Ver logs.',
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('Erro ao rodar QA Shadow', e.message, ui.ButtonSet.OK);
  }
}

// ======================================================
// ENTRADAS HEADLESS (clasp run) — sem SpreadsheetApp.getUi()
// ======================================================

function configurarTokenQAHeadless() {
  try {
    return gerarTokenQAInterno();
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}

function rodarQaShadowAgoraHeadless() {
  try {
    return runQA_E2E();
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}

// Roda as 3 pendências (token, triggers, QA Shadow) numa única chamada —
// pensado para `clasp run executarPendenciasQAHeadless`, sem exigir sessão
// de planilha aberta.
function executarPendenciasQAHeadless() {
  const resultado = {
    geradoEm: Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd'T'HH:mm:ssXXX"),
    token: null,
    triggers: null,
    qa: null
  };

  try { resultado.token = gerarTokenQAInterno(); } catch (e) { resultado.token = { ok: false, erro: e.message }; }
  try { resultado.triggers = instalarTriggersSchemaExporterInterno(); } catch (e) { resultado.triggers = { ok: false, erro: e.message }; }
  try { resultado.qa = runQA_E2E(); } catch (e) { resultado.qa = { ok: false, erro: e.message }; }

  resultado.tudoOk = !!(
    resultado.token && resultado.token.ok &&
    resultado.triggers && resultado.triggers.ok &&
    resultado.qa && resultado.qa.aprovado
  );

  return resultado;
}

// ======================================================
// ORQUESTRADOR
// ======================================================

function runQA_E2E() {
  const inicioMs = new Date().getTime();

  const influenciadora = {
    cadastro: simularCadastroQA(),
    login: simularLoginQA(),
    perfil: simularPerfilQA(),
    pendencias: simularPendenciasQA(),
    briefing: simularBriefingQA(),
    envioMaterial: simularEnvioMaterialQA(),
    pagamentos: simularPagamentosQA(),
    historico: simularHistoricoQA()
  };

  const gestor = {
    login: simularLoginGestorQA(),
    listaInfluenciadoras: simularListaInfluenciadorasQA(),
    dadosInfluenciadora: simularDadosInfluenciadoraQA(),
    atualizacaoStatus: simularAtualizacaoStatusQA()
  };

  const sistema = {
    integridade: validarIntegridadeRealQA(),
    schemaExporter: validarSchemaExporterRealQA()
  };

  const falhas = coletarFalhasQA(influenciadora, gestor, sistema);

  return {
    qaMode: true,
    persistidoEmProducao: false,
    geradoEm: Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd'T'HH:mm:ssXXX"),
    duracaoMs: new Date().getTime() - inicioMs,
    aprovado: falhas.length === 0,
    falhas: falhas,
    influenciadora: influenciadora,
    gestor: gestor,
    sistema: sistema,
    observacao: 'influenciadora/gestor são simulações de contrato (fixtures), não executam login()/upload/histórico reais nem escrevem em BASE DE DADOS. sistema.integridade e sistema.schemaExporter rodam contra os dados reais, mas são somente-leitura.'
  };
}

function coletarFalhasQA(influenciadora, gestor, sistema) {
  const falhas = [];
  Object.keys(influenciadora).forEach(function (k) {
    if (influenciadora[k] && influenciadora[k].ok === false) falhas.push('influenciadora.' + k + ': ' + (influenciadora[k].erro || 'falha desconhecida'));
  });
  Object.keys(gestor).forEach(function (k) {
    if (gestor[k] && gestor[k].ok === false) falhas.push('gestor.' + k + ': ' + (gestor[k].erro || 'falha desconhecida'));
  });
  if (!sistema.integridade.ok) {
    sistema.integridade.problemas.forEach(function (p) { falhas.push('sistema.integridade: ' + p.detalhe); });
  }
  if (!sistema.schemaExporter.ok) {
    falhas.push('sistema.schemaExporter: ' + sistema.schemaExporter.erro);
  }
  return falhas;
}

// ======================================================
// VALIDAÇÃO REAL (somente-leitura, sem fixture)
// ======================================================

function validarIntegridadeRealQA() {
  try {
    return verificarIntegridadeSistema(SpreadsheetApp.getActiveSpreadsheet());
  } catch (e) {
    return { ok: false, totalProblemas: 1, problemas: [{ tipo: 'ERRO_EXECUCAO', detalhe: e.message }] };
  }
}

function validarSchemaExporterRealQA() {
  try {
    const schema = gerarSchemaPlanilha(SpreadsheetApp.getActiveSpreadsheet()); // só gera em memória, não grava nada
    const valido = !!(schema && schema.versao && schema.versao.hashEstado && Array.isArray(schema.abas));
    return { ok: valido, hashEstado: valido ? schema.versao.hashEstado : null, totalAbas: valido ? schema.abas.length : 0 };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}

// ======================================================
// SIMULADORES — INFLUENCIADORA (fixtures, mesmo shape das respostas reais)
// ======================================================

function simularCadastroQA() {
  return { ok: true, influKey: QA_INFLUENCER.influKey, cupom: QA_INFLUENCER.cupom, persistido: false };
}

function simularLoginQA() {
  return { ok: true, token: 'QA-TOKEN-INFLUENCER-SIMULADO', nome: QA_INFLUENCER.nome, persistido: false };
}

function simularPerfilQA() {
  return {
    ok: true,
    dados: {
      nome: QA_INFLUENCER.nome, cnpj: QA_INFLUENCER.cnpj, chavePix: QA_INFLUENCER.chavePix,
      email: QA_INFLUENCER.email, telefone: '', cep: '00000000', rua: 'Rua QA',
      numero: '0', complemento: '', cidade: 'QA City', estado: 'QA'
    },
    somenteLeitura: { cupom: QA_INFLUENCER.cupom, valorTotal: 1000 },
    persistido: false
  };
}

function simularPendenciasQA() {
  return {
    ok: true,
    itens: [{
      idAtivacao: 'QA-ATIV-0001', formato: 'REEL', campanha: 'QA_MES 2026',
      dataEntrega: '01/01/2026', dataAprovacao: '05/01/2026', status: 'EM_APROVACAO', temBriefing: true
    }],
    persistido: false
  };
}

function simularBriefingQA() {
  return {
    ok: true, campanha: 'QA_MES 2026', formato: 'REEL', dataEntrega: '01/01/2026',
    dataAprovacao: '05/01/2026', textoBriefing: 'Briefing simulado para teste QA.',
    resumoMes: 'Resumo simulado do mês QA.', persistido: false
  };
}

function simularEnvioMaterialQA() {
  return { ok: true, link: 'https://drive.google.com/file/d/QA-SIMULADO/view', persistido: false };
}

function simularPagamentosQA() {
  return {
    ok: true, totalPrevisto: 1000, totalPago: 0,
    itens: [{ idPagamento: 1, referencia: 'QA_MES 2026', valor: 1000, etapa: 'PENDENTE', dataPrevista: '', dataPagamento: '' }],
    persistido: false
  };
}

function simularHistoricoQA() {
  return {
    ok: true,
    ativacoes: [{
      idAtivacao: 'HQA-0001', formato: 'REEL', campanha: 'QA_MES_ANTERIOR 2025',
      dataEntrega: '01/12/2025', dataAprovacao: '05/12/2025', status: 'PUBLICADO', temBriefing: false
    }],
    pagamentos: [{
      idPagamento: 'HQA-0001', referencia: 'QA_MES_ANTERIOR 2025', valor: 1000,
      etapa: 'PAGO', dataPrevista: '', dataPagamento: '15/12/2025'
    }],
    persistido: false
  };
}

// ======================================================
// SIMULADORES — GESTOR (equivalentes ao SidebarBackend.js, não a um endpoint
// Web App — não existe API de gestor real hoje, ver comentário no topo do arquivo)
// ======================================================

function simularLoginGestorQA() {
  return { ok: true, token: 'QA-TOKEN-MANAGER-SIMULADO', nome: QA_MANAGER.nome, persistido: false };
}

function simularListaInfluenciadorasQA() {
  return { ok: true, lista: [QA_INFLUENCER.influKey], persistido: false };
}

function simularDadosInfluenciadoraQA() {
  return {
    ok: true,
    dados: { cupom: QA_INFLUENCER.cupom, valor: 1000, qtd_reels: 1, qtd_carrossel: 0, qtd_stories: 0, looks: '' },
    persistido: false
  };
}

function simularAtualizacaoStatusQA() {
  return { ok: true, statusAnterior: 'EM_APROVACAO', statusNovo: 'APROVADO', persistido: false };
}
