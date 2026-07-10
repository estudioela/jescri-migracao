/**
 * Superfície de leitura da V2 (Etapa 3): Service → DTO, Controller → envelope.
 *
 * Carrega os arquivos reais de tear/ no mesmo contexto vm, na ordem em que o
 * Apps Script os concatenaria (todos compartilham um escopo global único).
 * O Repository é substituído por um fake — nenhuma planilha é tocada.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

function carregarDominio() {
  return loadGasFiles(
    ['Config.js', 'Ativacao.js', 'AtivacaoRepository.js', 'AtivacaoService.js', 'WebAppController.js'].map(arquivo),
    {},
    ['AtivacaoService', 'WebAppController', 'CAMPOS_ATIVACAO', 'ESTADOS_ATIVACAO']
  );
}

const dominio = carregarDominio();
const { AtivacaoService, WebAppController, CAMPOS_ATIVACAO, ESTADOS_ATIVACAO } = dominio;

const ENTREGA = new Date('2026-07-20T12:00:00.000Z');

// Linha crua, como o Repository a devolveria: chaves = cabeçalhos da planilha.
function linhaCrua(sobrescritas) {
  return Object.assign(
    {
      [CAMPOS_ATIVACAO.ID]: 'a-1',
      [CAMPOS_ATIVACAO.CICLO]: 'c-1',
      [CAMPOS_ATIVACAO.INFLUENCIADORA]: 'i-1',
      [CAMPOS_ATIVACAO.TIPO_CONTEUDO]: 'REEL',
      [CAMPOS_ATIVACAO.ESTADO]: ESTADOS_ATIVACAO.EM_PRODUCAO,
      [CAMPOS_ATIVACAO.LOOK]: 'look 3',
      [CAMPOS_ATIVACAO.ENTREGA_PREVISTA]: ENTREGA,
      [CAMPOS_ATIVACAO.LINK_BRIEFING]: 'https://exemplo/brief',
      [CAMPOS_ATIVACAO.LINK_UPLOAD_HD]: '',
      // Coluna de fórmula: a camada de domínio tem que ignorá-la por completo.
      Estado_Derivado: 'Atrasado'
    },
    sobrescritas
  );
}

function repositorioFake(linhas) {
  return {
    findByCiclo: (idCiclo) => linhas.filter((l) => String(l[CAMPOS_ATIVACAO.CICLO]) === String(idCiclo)),
    getById: (id) => linhas.find((l) => String(l[CAMPOS_ATIVACAO.ID]) === String(id)) || null,
    save: (dados) => dados
  };
}

const despachanteFake = () => ({ dispatch: jest.fn() });

function montar(linhas) {
  const service = new AtivacaoService(despachanteFake(), repositorioFake(linhas));
  return { service, controller: new WebAppController(service) };
}

describe('AtivacaoService — leitura', () => {
  test('listarPorCiclo devolve DTO, não a linha da planilha', () => {
    const { service } = montar([linhaCrua()]);

    const [dto] = service.listarPorCiclo('c-1');

    expect(dto).toEqual({
      idAtivacao: 'a-1',
      idCiclo: 'c-1',
      idInfluenciadora: 'i-1',
      tipoConteudo: 'REEL',
      estado: ESTADOS_ATIVACAO.EM_PRODUCAO,
      lookReferencia: 'look 3',
      entregaPrevista: ENTREGA.toISOString(),
      linkBriefing: 'https://exemplo/brief',
      linkUploadHd: ''
    });
  });

  // Estado_Derivado é calculado por fórmula. Se vazar para o DTO, a UI passa a
  // exibir um dado que o domínio não controla — e ninguém percebe.
  test('o DTO não carrega Estado_Derivado nem nome de coluna da planilha', () => {
    const { service } = montar([linhaCrua()]);

    const [dto] = service.listarPorCiclo('c-1');

    expect(dto).not.toHaveProperty('Estado_Derivado');
    expect(Object.keys(dto)).not.toContain(CAMPOS_ATIVACAO.ESTADO);
  });

  test('filtra pelo ciclo pedido', () => {
    const { service } = montar([linhaCrua(), linhaCrua({ [CAMPOS_ATIVACAO.ID]: 'a-2', [CAMPOS_ATIVACAO.CICLO]: 'c-2' })]);

    expect(service.listarPorCiclo('c-1').map((d) => d.idAtivacao)).toEqual(['a-1']);
    expect(service.listarPorCiclo('c-9')).toEqual([]);
  });

  test.each([[''], [null], [undefined]])('listarPorCiclo(%p) exige o ciclo', (vazio) => {
    const { service } = montar([]);

    expect(() => service.listarPorCiclo(vazio)).toThrow(/ciclo/i);
  });

  test('célula vazia vira string vazia, nunca "null" nem "undefined"', () => {
    const { service } = montar([
      linhaCrua({ [CAMPOS_ATIVACAO.LOOK]: null, [CAMPOS_ATIVACAO.ENTREGA_PREVISTA]: '' })
    ]);

    const [dto] = service.listarPorCiclo('c-1');

    expect(dto.lookReferencia).toBe('');
    expect(dto.entregaPrevista).toBe('');
  });

  test('obter devolve DTO e falha alto para id inexistente', () => {
    const { service } = montar([linhaCrua()]);

    expect(service.obter('a-1').idAtivacao).toBe('a-1');
    expect(() => service.obter('inexistente')).toThrow(/não encontrada/i);
  });
});

describe('WebAppController — consulta', () => {
  test('LIST_BY_CYCLE devolve o envelope de sucesso', () => {
    const { controller } = montar([linhaCrua()]);

    const resposta = controller.handleAtivacaoQuery({ action: 'LIST_BY_CYCLE', idCiclo: 'c-1', idInfluenciadora: 'i-1' });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toHaveLength(1);
    expect(resposta.data[0].idAtivacao).toBe('a-1');
  });

  test('GET_BY_ID devolve um único DTO', () => {
    const { controller } = montar([linhaCrua()]);

    const resposta = controller.handleAtivacaoQuery({ action: 'GET_BY_ID', idAtivacao: 'a-1' });

    expect(resposta).toEqual({ success: true, data: expect.objectContaining({ idAtivacao: 'a-1' }) });
  });

  // O Controller é o único que captura. Se uma exceção escapar daqui, o
  // Apps Script devolve uma página de erro em vez de JSON — foi assim que a V1
  // manifestou o "Failed to fetch".
  test.each([
    [{ action: 'LIST_BY_CYCLE' }, /idCiclo/],
    [{ action: 'LIST_BY_CYCLE', idCiclo: 'c-1' }, /idInfluenciadora/],
    [{ action: 'GET_BY_ID' }, /idAtivacao/],
    [{ action: 'APAGAR_TUDO', idCiclo: 'c-1' }, /não é suportada/],
    [{ idCiclo: 'c-1' }, /não é suportada/],
    [null, /payload ausente/],
    ['string', /payload ausente/]
  ])('converte %p em {success:false} sem lançar', (payload, mensagem) => {
    const { controller } = montar([linhaCrua()]);

    const resposta = controller.handleAtivacaoQuery(payload);

    expect(resposta.success).toBe(false);
    expect(resposta.error).toMatch(mensagem);
    expect(resposta).not.toHaveProperty('data');
  });

  test('id inexistente vira erro de domínio em pt-BR, não exceção', () => {
    const { controller } = montar([linhaCrua()]);

    const resposta = controller.handleAtivacaoQuery({ action: 'GET_BY_ID', idAtivacao: 'nao-existe' });

    expect(resposta.success).toBe(false);
    expect(resposta.error).toMatch(/não encontrada/i);
  });
});

describe('WebAppController — a escrita não regrediu', () => {
  test('CHANGE_STATE continua validando transição e devolvendo o DTO de mudança', () => {
    const { controller } = montar([linhaCrua()]);

    const ok = controller.handleAtivacaoUpdate({
      action: 'CHANGE_STATE',
      idAtivacao: 'a-1',
      newState: ESTADOS_ATIVACAO.AGUARDANDO_APROVACAO
    });

    expect(ok.success).toBe(true);
    expect(ok.data.estadoAnterior).toBe(ESTADOS_ATIVACAO.EM_PRODUCAO);
    expect(ok.data.novoEstado).toBe(ESTADOS_ATIVACAO.AGUARDANDO_APROVACAO);
  });

  test('transição proibida vira {success:false}', () => {
    const { controller } = montar([linhaCrua()]);

    const resposta = controller.handleAtivacaoUpdate({
      action: 'CHANGE_STATE',
      idAtivacao: 'a-1',
      newState: ESTADOS_ATIVACAO.PUBLICADA
    });

    expect(resposta.success).toBe(false);
    expect(resposta.error).toMatch(/Transição proibida/i);
  });

  test('a consulta não aceita CHANGE_STATE, e a escrita não aceita consulta', () => {
    const { controller } = montar([linhaCrua()]);

    expect(controller.handleAtivacaoQuery({ action: 'CHANGE_STATE', idAtivacao: 'a-1' }).success).toBe(false);
    expect(controller.handleAtivacaoUpdate({ action: 'LIST_BY_CYCLE', idCiclo: 'c-1', idInfluenciadora: 'i-1' }).success).toBe(false);
  });
});
