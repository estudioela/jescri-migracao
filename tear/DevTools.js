/* ═══════════════════════════════════════════════════════════════
   operacoes/SetupDatabase.js
   ═══════════════════════════════════════════════════════════════ */

function cabecalhosV2_() {
  return Object.freeze({
    // 1. ABA DE CADASTRO E CONTRATOS (Foco no Autocrat)
    [PLANILHAS.PARCEIROS_INFLUENCIADORAS]: [
      'STATUS', 'INFLU_KEY', 'CUPOM', 'INFLUENCIADORA_RAZAO_SOCIAL', 'EMAIL', 
      'CHAVE_PIX', 'INFLUENCIADORA_CNPJ', 'CEP', 'RUA', 'NUMERO', 'COMPLEMENTO', 
      'BAIRRO', 'CIDADE', 'UF', 'INFLUENCIADORA_ENDERECO', 'VALOR_TOTAL', 
      'REELS_TEXTO', 'CARROSSEL_TEXTO', 'STORIES_TEXTO', 'VALOR_TOTAL_EXTENSO', 
      'LOOKS_QTD', 'LOOKS_QTD_TEXTO', 'CANAIS_USO_IMAGEM', 'PRAZO_USO_IMAGEM', 
      'CIDADE_ASSINATURA', 'DATA_ASSINATURA', 'MES_REFERENCIA', 'INFLU_SHEET_URL', 
      'PASTA_DRIVE_LINK', 'SIM/NÃO', 'Senha_Hash'
    ],

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

function migrarParceirosDaV1() {
  const propriedades = PropertiesService.getScriptProperties();

  _exigirMigracaoHabilitada(propriedades);

  const idPlanilhaV1 = propriedades.getProperty(PROPRIEDADE_PLANILHA_V1);
  if (!idPlanilhaV1) {
    throw new Error(`Defina a propriedade "${PROPRIEDADE_PLANILHA_V1}" com o ID da planilha da V1.`);
  }

  const origem = SpreadsheetApp.openById(idPlanilhaV1).getSheetByName(ABA_BASE_V1);
  if (!origem) {
    throw new Error(`Aba "${ABA_BASE_V1}" não encontrada na planilha da V1.`);
  }

  const resultado = parceirosDaBaseV1(origem.getDataRange().getValues());

  if (!resultado.parceiros.length) {
    throw new Error('Nenhuma parceira válida com cupom na V1. Nada foi gravado.');
  }

  const destino = abaObrigatoria(SpreadsheetApp.getActiveSpreadsheet(), PLANILHAS.PARCEIROS_INFLUENCIADORAS);
  const valoresDestino = destino.getDataRange().getValues();
  const cabecalhoAtual = (valoresDestino[0] || []).map(_textoDaCelula).filter(Boolean);

  const { cabecalho, acrescentadas } = garantirCabecalhoDeParceiros(cabecalhoAtual);

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

  const linhas = linhasDeParceirosParaGravar(cabecalho, resultado.parceiros, hashesPorId);

  destino.clearContents();
  destino.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
  destino.getRange(2, 1, linhas.length, cabecalho.length).setValues(linhas);

  const relatorio = [
    `Parceiras gravadas: ${linhas.length}`,
    `Linhas descartadas na V1: ${resultado.descartadas.length}`,
    `Colunas acrescentadas ao cabeçalho: ${acrescentadas.length ? acrescentadas.join(', ') : 'nenhuma'}`,
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