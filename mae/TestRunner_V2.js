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

function runV2SanityCheck() {
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

  const controller = new WebAppController(new AtivacaoService(dispatcher, repositorio));

  const cenarios = [
    {
      nome: 'transição válida (Planejamento → Pronta para Envio)',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'ativacao-001', newState: ESTADOS_ATIVACAO.PRONTA_PARA_ENVIO },
      sucessoEsperado: true
    },
    {
      nome: 'transição proibida (Planejamento → Concluída)',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'ativacao-002', newState: ESTADOS_ATIVACAO.CONCLUIDA },
      sucessoEsperado: false
    },
    {
      nome: 'bypass permitido (Planejamento → Arquivada)',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'ativacao-002', newState: ESTADOS_ATIVACAO.ARQUIVADA },
      sucessoEsperado: true
    },
    {
      nome: 'ativação inexistente',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'nao-existe', newState: ESTADOS_ATIVACAO.ARQUIVADA },
      sucessoEsperado: false
    },
    {
      nome: 'payload sem newState',
      payload: { action: 'CHANGE_STATE', idAtivacao: 'ativacao-001' },
      sucessoEsperado: false
    },
    {
      nome: 'ação não suportada',
      payload: { action: 'DELETE', idAtivacao: 'ativacao-001', newState: ESTADOS_ATIVACAO.ARQUIVADA },
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

    console.log(`[${passou ? 'OK' : 'FALHOU'}] ${cenario.nome} → ${JSON.stringify(resposta)}`);
  });

  const estadoFinal001 = repositorio.getById('ativacao-001');
  const derivadoPreservado = estadoFinal001.Estado_Derivado === 'No Prazo';

  console.log(`Eventos capturados pelo listener saudável: ${JSON.stringify(eventosCapturados)}`);
  console.log(`Estado_Derivado preservado pelo domínio: ${derivadoPreservado}`);
  console.log(`Estado final da fonte fake: ${JSON.stringify(repositorio.linhas)}`);
  console.log(`Resultado: ${cenarios.length - falhas}/${cenarios.length} cenários conforme esperado.`);

  return falhas === 0;
}
