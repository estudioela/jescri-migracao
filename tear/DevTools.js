/* ═══════════════════════════════════════════════════════════════
   operacoes/SetupDatabase.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Cabeçalho canônico da aba `Parceiros_Influenciadoras` (V2).
 *
 * União reconciliada (decisão do usuário, Fase 2): a identidade estável do
 * runtime (CAMPOS_PARCEIRO — lida pelo login/ParceiroRepository) somada às
 * colunas de consolidação exigidas pelo Autocrat para gerar contratos.
 * Estrutura HORIZONTAL, uma linha por parceira — sem explosão de entregáveis,
 * para não quebrar os templates de mala direta.
 *
 * Função (não const) de propósito: evita depender da ordem de carga entre
 * arquivos no escopo global do Apps Script para resolver CAMPOS_PARCEIRO.
 */
function cabecalhoParceirosV2_() {
  return [
    // Identidade / runtime (CAMPOS_PARCEIRO)
    CAMPOS_PARCEIRO.ID, CAMPOS_PARCEIRO.NOME, CAMPOS_PARCEIRO.STATUS_CONTRATO,
    CAMPOS_PARCEIRO.CATEGORIA, CAMPOS_PARCEIRO.CUPOM,
    // Consolidação Autocrat (contratos)
    'Qtd_Reels', 'Qtd_Carrossel', 'Qtd_Stories', 'Valor_Total_Contrato',
    'Looks_Qtd', 'Endereço_Formatado',
    // Credencial (nunca vem da V1)
    CAMPOS_PARCEIRO.SENHA_HASH
  ];
}

function cabecalhosV2_() {
  return Object.freeze({
    // 1. ABA DE CADASTRO E CONTRATOS (Foco no Autocrat)
    [PLANILHAS.PARCEIROS_INFLUENCIADORAS]: cabecalhoParceirosV2_(),

    // 2. ABA DE LOGÍSTICA (entidade persistida V2 — docs/spec/SCHEMA_V2.md;
    //    cabeçalhos = CAMPOS_LOGISTICA em Repositories.js)
    [PLANILHAS.LOGISTICA]: [
      'ID_Logistica', 'ID_Ciclo', 'ID_Influenciadora', 'Endereco_Entrega',
      'Codigo_Rastreio', 'Data_Envio', 'Status_Logistica'
    ],

    // 3. ABAS DE CONTROLE INTERNO (O motor da V2)
    [PLANILHAS.CICLOS]: [
      'ID_Ciclo', 'Nome_Ciclo', 'Data_Inicio_Logistica', 'Data_Fim_Operacao'
    ],
    // Cabeçalhos = CAMPOS_ATIVACAO (Repositories.js) + Estado_Derivado (fórmula
    // de apresentação, última coluna). Alinhado a docs/spec/SCHEMA_V2.md.
    [PLANILHAS.ATIVACOES]: [
      'ID_Ativacao', 'ID_Ciclo', 'ID_Influenciadora', 'Tipo_Conteudo', 'Estado_Principal',
      'Look_Referencia', 'Data_Prevista_Entrega', 'Link_Briefing', 'Link_Upload_HD', 'Estado_Derivado'
    ],
    // Tabela de junção influenciadora × ciclo (cabeçalhos = CAMPOS_PLANO).
    [PLANILHAS.PLANOS_COLABORACAO]: [
      'ID_Plano', 'ID_Influenciadora', 'ID_Ciclo', 'Qtd_Entregaveis', 'Valor_Cache'
    ]
  });
}

function setupV2Database() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const cabecalhos = cabecalhosV2_();
  const relatorio = [];

  Object.keys(cabecalhos).forEach(nomeAba => {
    const colunas = cabecalhos[nomeAba];
    let aba = planilha.getSheetByName(nomeAba);
    let situacao;

    if (aba) {
      situacao = 'aba já existia';
    } else {
      aba = planilha.insertSheet(nomeAba);
      situacao = 'aba criada';
    }

    if (aba.getRange(1, 1).isBlank()) {
      aba.getRange(1, 1, 1, colunas.length).setValues([colunas]);
      situacao += ', cabeçalho gravado';
    } else {
      situacao += ', cabeçalho preservado (linha 1 não estava vazia)';
    }

    aba.setFrozenRows(1);
    relatorio.push(`${nomeAba}: ${situacao}`);
  });

  console.log(relatorio.join('\n'));
  return relatorio;
}


/* ═══════════════════════════════════════════════════════════════
   operacoes/MigracaoParceiros.js
   ═══════════════════════════════════════════════════════════════ */

const ABA_BASE_V1 = 'BASE DE DADOS';
const PROPRIEDADE_PLANILHA_V1 = 'ID_PLANILHA_V1';
const PROPRIEDADE_MIGRACAO_HABILITADA = 'MIGRACAO_HABILITADA';

// ID da PLANILHA ANTIGA (origem/leitura). Fallback quando a propriedade
// ID_PLANILHA_V1 não estiver definida. IDs de planilha não são segredo — o
// acesso é controlado pelas permissões do Drive.
const ID_PLANILHA_V1_PADRAO = '1ZKqrmz80oOaU70gcHeIgr-yK9zeJ_5YkE8b5CKkuRdM';

function _textoDaCelula(valor) {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

function _mapaDeCabecalhoV1(cabecalho) {
  return cabecalho.reduce((mapa, nome, indice) => {
    const chave = _textoDaCelula(nome);
    if (chave) mapa[chave] = indice;
    return mapa;
  }, {});
}

function _celulaV1(linha, mapa, nome) {
  return nome in mapa ? _textoDaCelula(linha[mapa[nome]]) : '';
}

function _exigirMigracaoHabilitada(propriedades) {
  if (propriedades.getProperty(PROPRIEDADE_MIGRACAO_HABILITADA) !== 'true') {
    throw new Error(
      `Operação desligada. Defina a propriedade "${PROPRIEDADE_MIGRACAO_HABILITADA}" como "true", rode, e apague-a em seguida.`
    );
  }
}

/**
 * BASE DE DADOS parceiros da V2. 
 * Migra TODO o histórico (ignora status ON/OFF), exigindo apenas Cupom e ID.
 */
function parceirosDaBaseV1(valores) {
  if (!valores || valores.length < 2) {
    return { parceiros: [], descartadas: [] };
  }

  const mapa = _mapaDeCabecalhoV1(valores[0]);

  ['INFLU_KEY', 'CUPOM'].forEach(coluna => {
    if (!(coluna in mapa)) {
      throw new Error(`Coluna "${coluna}" não encontrada em "${ABA_BASE_V1}".`);
    }
  });

  const parceiros = [];
  const descartadas = [];

  for (let i = 1; i < valores.length; i++) {
    const linha = valores[i];
    const cupom = _celulaV1(linha, mapa, 'CUPOM');
    const id = _celulaV1(linha, mapa, 'INFLU_KEY');
    
    const statusOriginal = ('STATUS' in mapa) ? _celulaV1(linha, mapa, 'STATUS').toUpperCase() : 'OFF';

    if (!cupom) {
      descartadas.push({ linha: i + 1, motivo: 'SEM_CUPOM' });
      continue;
    }
    if (!id) {
      descartadas.push({ linha: i + 1, motivo: 'SEM_INFLU_KEY' });
      continue;
    }

    const statusContrato = (statusOriginal === 'ON' || statusOriginal === 'TRUE') ? 'ATIVO' : 'INATIVO';

    parceiros.push({
      [CAMPOS_PARCEIRO.ID]: id,
      [CAMPOS_PARCEIRO.NOME]: _celulaV1(linha, mapa, 'INFLUENCIADORA_RAZAO_SOCIAL') || id,
      [CAMPOS_PARCEIRO.STATUS_CONTRATO]: statusContrato,
      [CAMPOS_PARCEIRO.CATEGORIA]: '',
      [CAMPOS_PARCEIRO.CUPOM]: cupom
    });
  }

  const chaves = parceiros.map(p => p[CAMPOS_PARCEIRO.ID]);
  const duplicadas = chaves.filter((c, i) => chaves.indexOf(c) !== i);
  if (duplicadas.length) {
    throw new Error(`INFLU_KEY duplicada na V1: ${duplicadas.join(', ')}. A chave primária tem que ser única.`);
  }

  return { parceiros: parceiros, descartadas: descartadas };
}

/* ── ETL Fase 2 · De-Para V1 → V2 (estrutura horizontal / Autocrat) ────────── */

/**
 * De-Para: para cada coluna de DESTINO (V2), a lista ordenada de candidatos de
 * coluna de ORIGEM (V1). O ETL usa o primeiro candidato que existir no
 * cabeçalho da V1; o dry-run relata qual casou (ou "NÃO ENCONTRADA"), para o
 * usuário confirmar/corrigir antes da escrita real.
 *
 * Colunas tratadas à parte (não entram aqui): STATUS→Status_Contrato (transform
 * ON/OFF), Endereço_Formatado (coluna pronta OU concatenação dos campos de
 * endereço) e Senha_Hash (jamais vem da V1).
 */
function _deParaParceiroV2_() {
  return {
    [CAMPOS_PARCEIRO.ID]: ['INFLU_KEY'],
    [CAMPOS_PARCEIRO.NOME]: ['INFLUENCIADORA_RAZAO_SOCIAL', 'NOME', 'RAZAO_SOCIAL'],
    [CAMPOS_PARCEIRO.CATEGORIA]: ['CATEGORIA'],
    [CAMPOS_PARCEIRO.CUPOM]: ['CUPOM'],
    // Nomes reais confirmados pelo usuário (BASE DE DADOS da V1).
    'Qtd_Reels': ['REELS_TEXTO'],
    'Qtd_Carrossel': ['CARROSSEL_TEXTO'],
    'Qtd_Stories': ['STORIES_TEXTO'],
    'Valor_Total_Contrato': ['VALOR_TOTAL_CONTRATO', 'VALOR_TOTAL', 'VALOR'],
    'Looks_Qtd': ['LOOKS_QTD', 'QTD_LOOKS', 'LOOKS']
  };
}

// Campos de endereço da V1 usados para montar `Endereço_Formatado` quando não
// existir uma coluna de endereço já pronta na origem.
const CAMPOS_ENDERECO_V1 = ['RUA', 'NUMERO', 'COMPLEMENTO', 'BAIRRO', 'CIDADE', 'UF', 'CEP'];

function _enderecoFormatadoV1_(linha, mapa) {
  const pronto = _celulaV1(linha, mapa, 'INFLUENCIADORA_ENDERECO')
    || _celulaV1(linha, mapa, 'ENDERECO_FORMATADO')
    || _celulaV1(linha, mapa, 'ENDERECO');
  if (pronto) return pronto;

  return CAMPOS_ENDERECO_V1
    .map(coluna => _celulaV1(linha, mapa, coluna))
    .filter(Boolean)
    .join(', ');
}

/**
 * Transform PURO (sem I/O) da BASE DE DADOS da V1 para a estrutura horizontal
 * da aba `Parceiros_Influenciadoras` (V2). Testável em jest.
 *
 * Regras (Fase 2): migra 100% da base (inativos viram INATIVO, não são
 * descartados); exige apenas INFLU_KEY e CUPOM; INFLU_KEY é a chave primária e
 * precisa ser única. Retorna também o De-Para resolvido para o relatório.
 */
function transformarParceirosV1ParaV2(valores) {
  const cabecalhoDestino = cabecalhoParceirosV2_();

  if (!valores || valores.length < 2) {
    return {
      cabecalho: cabecalhoDestino,
      parceiros: [],
      descartadas: [],
      deParaResolvido: {},
      cabecalhoOrigem: (valores && valores[0]) ? valores[0].map(_textoDaCelula) : []
    };
  }

  const mapa = _mapaDeCabecalhoV1(valores[0]);

  ['INFLU_KEY', 'CUPOM'].forEach(coluna => {
    if (!(coluna in mapa)) {
      throw new Error(`Coluna "${coluna}" não encontrada em "${ABA_BASE_V1}".`);
    }
  });

  // Resolve o De-Para uma vez: destino → coluna de origem que casou (ou null).
  const dePara = _deParaParceiroV2_();
  const deParaResolvido = {};
  Object.keys(dePara).forEach(destino => {
    const origem = dePara[destino].find(nome => nome in mapa);
    deParaResolvido[destino] = origem || null;
  });

  const parceiros = [];
  const descartadas = [];

  for (let i = 1; i < valores.length; i++) {
    const linha = valores[i];
    const cupom = _celulaV1(linha, mapa, 'CUPOM');
    const id = _celulaV1(linha, mapa, 'INFLU_KEY');

    if (!cupom) { descartadas.push({ linha: i + 1, motivo: 'SEM_CUPOM' }); continue; }
    if (!id) { descartadas.push({ linha: i + 1, motivo: 'SEM_INFLU_KEY' }); continue; }

    const statusOriginal = ('STATUS' in mapa) ? _celulaV1(linha, mapa, 'STATUS').toUpperCase() : 'OFF';
    const statusContrato = (statusOriginal === 'ON' || statusOriginal === 'TRUE') ? 'ATIVO' : 'INATIVO';

    const parceiro = {};
    cabecalhoDestino.forEach(coluna => {
      if (coluna === CAMPOS_PARCEIRO.STATUS_CONTRATO) {
        parceiro[coluna] = statusContrato;
      } else if (coluna === CAMPOS_PARCEIRO.SENHA_HASH) {
        parceiro[coluna] = ''; // credencial nunca vem da V1
      } else if (coluna === 'Endereço_Formatado') {
        parceiro[coluna] = _enderecoFormatadoV1_(linha, mapa);
      } else {
        const origem = deParaResolvido[coluna];
        parceiro[coluna] = origem ? _celulaV1(linha, mapa, origem) : '';
      }
    });

    // Nome nunca fica vazio: cai para a chave.
    if (!parceiro[CAMPOS_PARCEIRO.NOME]) parceiro[CAMPOS_PARCEIRO.NOME] = id;

    parceiros.push(parceiro);
  }

  const chaves = parceiros.map(p => p[CAMPOS_PARCEIRO.ID]);
  const duplicadas = chaves.filter((c, i) => chaves.indexOf(c) !== i);
  if (duplicadas.length) {
    throw new Error(`INFLU_KEY duplicada na V1: ${duplicadas.join(', ')}. A chave primária tem que ser única.`);
  }

  return { cabecalho: cabecalhoDestino, parceiros, descartadas, deParaResolvido, cabecalhoOrigem: valores[0].map(_textoDaCelula) };
}

/** Formata o relatório do dry-run (texto para o log do Apps Script). */
function formatarRelatorioDryRunParceiros_(resultado, idPlanilha, amostraMax) {
  const limite = amostraMax || 5;
  const { cabecalho, parceiros, descartadas, deParaResolvido, cabecalhoOrigem } = resultado;

  const deParaLinhas = cabecalho.map(destino => {
    if (destino === CAMPOS_PARCEIRO.STATUS_CONTRATO) return `  ${destino}  ⟵  STATUS  (ON/OFF → ATIVO/INATIVO)`;
    if (destino === CAMPOS_PARCEIRO.SENHA_HASH) return `  ${destino}  ⟵  (vazio — provisionado depois, nunca vem da V1)`;
    if (destino === 'Endereço_Formatado') return `  ${destino}  ⟵  endereço pronto OU concatenação de ${CAMPOS_ENDERECO_V1.join('+')}`;
    const origem = deParaResolvido[destino];
    return `  ${destino}  ⟵  ${origem || '⚠ NÃO ENCONTRADA na V1 (sairá vazia)'}`;
  });

  const contagemStatus = parceiros.reduce((acc, p) => {
    const s = p[CAMPOS_PARCEIRO.STATUS_CONTRATO];
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const motivos = descartadas.reduce((acc, d) => {
    acc[d.motivo] = (acc[d.motivo] || 0) + 1;
    return acc;
  }, {});

  const amostra = parceiros.slice(0, limite).map((p, i) => {
    const campos = cabecalho
      .filter(c => c !== CAMPOS_PARCEIRO.SENHA_HASH)
      .map(c => `    ${c}: ${JSON.stringify(p[c])}`)
      .join('\n');
    return `  [linha ${i + 1}]\n${campos}`;
  });

  return [
    '════════ DRY-RUN · Migração Parceiros_Influenciadoras (V1 → V2) ════════',
    `Planilha ANTIGA (origem): ${idPlanilha}  ·  aba "${ABA_BASE_V1}"`,
    `NADA foi gravado. Apenas leitura e log.`,
    '',
    `Cabeçalho ORIGEM (V1), ${cabecalhoOrigem.length} colunas:`,
    `  ${cabecalhoOrigem.join(' | ')}`,
    '',
    `Cabeçalho DESTINO (V2), ${cabecalho.length} colunas — De-Para:`,
    ...deParaLinhas,
    '',
    `Totais: ${parceiros.length} parceira(s) migrada(s) · ${descartadas.length} descartada(s)`,
    `  Status: ${JSON.stringify(contagemStatus)}`,
    `  Descartes: ${descartadas.length ? JSON.stringify(motivos) : 'nenhum'}`,
    descartadas.length ? `  Linhas descartadas: ${descartadas.map(d => `${d.linha}(${d.motivo})`).join(', ')}` : '',
    '',
    `Amostra (primeiras ${Math.min(limite, parceiros.length)} linhas formatadas):`,
    ...amostra,
    '',
    'Se a estrutura estiver correta, autorize a escrita para eu alinhar o writer',
    'migrarParceirosDaV1() a este cabeçalho e gravar de verdade.',
    '══════════════════════════════════════════════════════════════════════'
  ].filter(l => l !== '').join('\n');
}

/**
 * DRY-RUN da migração de parceiros. Lê a PLANILHA ANTIGA por ID (in-app),
 * aplica o transform e LOGA como os dados ficariam — sem gravar nada.
 *
 * Uso no editor: simularMigracaoDeParceiros()  (ou {amostra: 10} para ver mais).
 */
function simularMigracaoDeParceiros(opcoes) {
  const config = opcoes || {};
  const idPlanilha = config.idPlanilhaV1
    || PropertiesService.getScriptProperties().getProperty(PROPRIEDADE_PLANILHA_V1)
    || ID_PLANILHA_V1_PADRAO;

  const planilha = SpreadsheetApp.openById(idPlanilha);
  const origem = planilha.getSheetByName(ABA_BASE_V1);
  if (!origem) {
    throw new Error(`Aba "${ABA_BASE_V1}" não encontrada na planilha da V1 (${idPlanilha}).`);
  }

  const resultado = transformarParceirosV1ParaV2(origem.getDataRange().getValues());
  const relatorio = formatarRelatorioDryRunParceiros_(resultado, idPlanilha, config.amostra);
  console.log(relatorio);
  return relatorio;
}

function linhasDeParceirosParaGravar(cabecalho, parceiros, hashesPorId) {
  const hashes = hashesPorId || {};

  return parceiros.map(parceiro =>
    cabecalho.map(coluna => {
      if (coluna === CAMPOS_PARCEIRO.SENHA_HASH) {
        return hashes[parceiro[CAMPOS_PARCEIRO.ID]] || '';
      }
      return coluna in parceiro ? parceiro[coluna] : '';
    })
  );
}

function garantirCabecalhoDeParceiros(cabecalhoAtual) {
  const faltantes = Object.keys(CAMPOS_PARCEIRO)
    .map(chave => CAMPOS_PARCEIRO[chave])
    .filter(coluna => cabecalhoAtual.indexOf(coluna) === -1);

  return { cabecalho: cabecalhoAtual.concat(faltantes), acrescentadas: faltantes };
}

/**
 * Lê os hashes de senha já gravados no destino, indexados pela chave primária,
 * para que uma reimportação do cadastro não apague a credencial de quem já tem.
 */
function _hashesPreservadosDoDestino_(valoresDestino) {
  const cabecalhoAtual = (valoresDestino[0] || []).map(_textoDaCelula);
  const idIdx = cabecalhoAtual.indexOf(CAMPOS_PARCEIRO.ID);
  const hashIdx = cabecalhoAtual.indexOf(CAMPOS_PARCEIRO.SENHA_HASH);
  const hashesPorId = {};

  if (idIdx !== -1 && hashIdx !== -1) {
    valoresDestino.slice(1).forEach(linha => {
      const id = _textoDaCelula(linha[idIdx]);
      const hash = _textoDaCelula(linha[hashIdx]);
      if (id && hash) hashesPorId[id] = hash;
    });
  }

  return hashesPorId;
}

/**
 * ESCRITA REAL. Migra a BASE DE DADOS da V1 para a aba
 * `Parceiros_Influenciadoras`, gravando com o cabeçalho canônico validado
 * (`cabecalhoParceirosV2_()`): identidade do runtime + consolidação Autocrat.
 *
 * Gated por MIGRACAO_HABILITADA=true (property setada pelo operador no editor e
 * apagada em seguida). Preserva Senha_Hash existente por chave. Substitui o
 * conteúdo da aba (clearContents + reescrita). Mesmo transform do dry-run
 * (`transformarParceirosV1ParaV2`) — o que você validou é o que grava.
 */
function migrarParceirosDaV1() {
  const propriedades = PropertiesService.getScriptProperties();

  _exigirMigracaoHabilitada(propriedades);

  const idPlanilhaV1 = propriedades.getProperty(PROPRIEDADE_PLANILHA_V1) || ID_PLANILHA_V1_PADRAO;

  const origem = SpreadsheetApp.openById(idPlanilhaV1).getSheetByName(ABA_BASE_V1);
  if (!origem) {
    throw new Error(`Aba "${ABA_BASE_V1}" não encontrada na planilha da V1 (${idPlanilhaV1}).`);
  }

  const resultado = transformarParceirosV1ParaV2(origem.getDataRange().getValues());

  if (!resultado.parceiros.length) {
    throw new Error('Nenhuma parceira válida com cupom na V1. Nada foi gravado.');
  }

  const destino = abaObrigatoria(SpreadsheetApp.getActiveSpreadsheet(), PLANILHAS.PARCEIROS_INFLUENCIADORAS);
  const cabecalho = resultado.cabecalho; // canônico: cabecalhoParceirosV2_()
  const hashesPorId = _hashesPreservadosDoDestino_(destino.getDataRange().getValues());

  const linhas = linhasDeParceirosParaGravar(cabecalho, resultado.parceiros, hashesPorId);

  destino.clearContents();
  destino.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
  destino.getRange(2, 1, linhas.length, cabecalho.length).setValues(linhas);

  const contagemStatus = resultado.parceiros.reduce((acc, p) => {
    const s = p[CAMPOS_PARCEIRO.STATUS_CONTRATO];
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const relatorio = [
    `Parceiras gravadas: ${linhas.length} (${JSON.stringify(contagemStatus)})`,
    `Linhas descartadas na V1: ${resultado.descartadas.length}` +
      (resultado.descartadas.length ? ` — ${resultado.descartadas.map(d => `${d.linha}(${d.motivo})`).join(', ')}` : ''),
    `Senhas preservadas: ${Object.keys(hashesPorId).length}`,
    'Próximo passo: execute provisionarSenhasIniciais() no painel.'
  ].join('\n');

  console.log(relatorio);
  return relatorio;
}

function provisionarSenhasIniciais() {
  const propriedades = PropertiesService.getScriptProperties();

  _exigirMigracaoHabilitada(propriedades);

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const { cabecalho, linhas } = lerAbaComCabecalho(planilha, PLANILHAS.PARCEIROS_INFLUENCIADORAS);
  const cupomIdx = indiceDaColuna(cabecalho, CAMPOS_PARCEIRO.CUPOM, PLANILHAS.PARCEIROS_INFLUENCIADORAS);
  const hashIdx = indiceDaColuna(cabecalho, CAMPOS_PARCEIRO.SENHA_HASH, PLANILHAS.PARCEIROS_INFLUENCIADORAS);

  const repositorio = new ParceiroRepository(planilha);
  const provisionadas = [];

  linhas.forEach(linha => {
    const cupom = _textoDaCelula(linha[cupomIdx]);
    if (!cupom || _textoDaCelula(linha[hashIdx])) {
      return;
    }

    const senha = Utilities.getUuid().replace(/-/g, '').slice(0, 10);
    repositorio.definirSenhaHash(cupom, criarSenhaHash(senha));
    provisionadas.push(`${cupom}\t${senha}`);
  });

  if (!provisionadas.length) {
    const aviso = 'Nenhuma parceira sem senha. Nada foi alterado.';
    console.log(aviso);
    return aviso;
  }

  const relatorio = [
    `${provisionadas.length} senha(s) provisionada(s). Entregue cada uma à parceira e apague este log.`,
    'CUPOM\tSENHA',
    ...provisionadas
  ].join('\n');

  console.log(relatorio);
  return relatorio;
}


/* ═══════════════════════════════════════════════════════════════
   operacoes/SanityCheck.js
   ═══════════════════════════════════════════════════════════════ */

function runV2SanityCheck() {
  class AtivacaoRepositoryFake {
    constructor(linhas) {
      this.linhas = linhas.map(linha => Object.assign({}, linha));
    }

    getById(id) {
      const linha = this.linhas.find(l => String(l[CAMPOS_ATIVACAO.ID]) === String(id));
      return linha ? Object.assign({}, linha) : null;
    }

    findByCiclo(cicloId) {
      return this.linhas
        .filter(l => String(l[CAMPOS_ATIVACAO.CICLO]) === String(cicloId))
        .map(l => Object.assign({}, l));
    }

    save(ativacaoData) {
      const id = ativacaoData[CAMPOS_ATIVACAO.ID];
      const posicao = this.linhas.findIndex(l => String(l[CAMPOS_ATIVACAO.ID]) === String(id));

      if (posicao === -1) {
        this.linhas.push(Object.assign({}, ativacaoData));
        return Object.assign({}, ativacaoData);
      }

      this.linhas[posicao] = Object.assign({}, this.linhas[posicao], ativacaoData);
      return Object.assign({}, this.linhas[posicao]);
    }
  }

  const dispatcher = new EventDispatcher();
  const eventosCapturados = [];

  dispatcher.subscribe(EVENTO_ATIVACAO_ESTADO_ALTERADO, evento => eventosCapturados.push(evento));
  dispatcher.subscribe(EVENTO_ATIVACAO_ESTADO_ALTERADO, () => {
    throw new Error('Listener defeituoso proposital: não pode derrubar a transação.');
  });

  const repositorio = new AtivacaoRepositoryFake([
    {
      ID_Ativacao: 'ativacao-001',
      ID_Ciclo: 'ciclo-01',
      ID_Influenciadora: 'influ-01',
      Tipo_Conteudo: 'REEL',
      Estado_Principal: ESTADOS_ATIVACAO.PLANEJAMENTO,
      Estado_Derivado: 'No Prazo'
    },
    {
      ID_Ativacao: 'ativacao-002',
      ID_Ciclo: 'ciclo-01',
      ID_Influenciadora: 'influ-02',
      Tipo_Conteudo: 'STORIES',
      Estado_Principal: ESTADOS_ATIVACAO.PLANEJAMENTO,
      Estado_Derivado: 'No Prazo'
    }
  ]);

  const controller = new AtivacaoController(new AtivacaoService(dispatcher, repositorio));

  const cenarios = [
    {
      nome: 'transição válida (Planejamento  Pronta para Envio)',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'ativacao-001', newState: ESTADOS_ATIVACAO.PRONTA_PARA_ENVIO, idInfluenciadora: 'influ-01' },
      sucessoEsperado: true
    },
    {
      nome: 'transição proibida (Planejamento  Concluída)',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'ativacao-002', newState: ESTADOS_ATIVACAO.CONCLUIDA, idInfluenciadora: 'influ-02' },
      sucessoEsperado: false
    },
    {
      nome: 'bypass permitido (Planejamento  Arquivada)',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'ativacao-002', newState: ESTADOS_ATIVACAO.ARQUIVADA, idInfluenciadora: 'influ-02' },
      sucessoEsperado: true
    },
    {
      nome: 'ativação de outra influenciadora não é alterada',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'ativacao-001', newState: ESTADOS_ATIVACAO.ARQUIVADA, idInfluenciadora: 'influ-02' },
      sucessoEsperado: false
    },
    {
      nome: 'ativação inexistente',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'nao-existe', newState: ESTADOS_ATIVACAO.ARQUIVADA, idInfluenciadora: 'influ-01' },
      sucessoEsperado: false
    },
    {
      nome: 'payload sem newState',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'ativacao-001', idInfluenciadora: 'influ-01' },
      sucessoEsperado: false
    },
    {
      nome: 'ação não suportada',
      payload: { action: 'DELETE', idAtivacao: 'ativacao-001', newState: ESTADOS_ATIVACAO.ARQUIVADA, idInfluenciadora: 'influ-01' },
      sucessoEsperado: false
    }
  ];

  let falhas = 0;

  cenarios.forEach(cenario => {
    const resposta = controller.handleAtivacaoUpdate(cenario.payload);
    const passou = resposta.success === cenario.sucessoEsperado;

    if (!passou) {
      falhas++;
    }

    console.log(`[${passou ? 'OK' : 'FALHOU'}] ${cenario.nome}  ${JSON.stringify(resposta)}`);
  });

  const estadoFinal001 = repositorio.getById('ativacao-001');
  const derivadoPreservado = estadoFinal001.Estado_Derivado === 'No Prazo';

  console.log(`Eventos capturados pelo listener saudável: ${JSON.stringify(eventosCapturados)}`);
  console.log(`Estado_Derivado preservado pelo domínio: ${derivadoPreservado}`);
  console.log(`Estado final da fonte fake: ${JSON.stringify(repositorio.linhas)}`);
  console.log(`Resultado: ${cenarios.length - falhas}/${cenarios.length} cenários conforme esperado.`);

  return falhas === 0;
}