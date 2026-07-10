/**
 * Logística da V2 (sprint 2026-07-10): entidade + repositório + service + controller.
 *
 * Carrega os arquivos reais de tear/ no mesmo contexto vm, na ordem em que o
 * Apps Script os concatenaria (escopo global único). `const`/`class` de topo só
 * viram propriedades do sandbox via `exportarNomes` (ver loadGasModule.js).
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

const CABECALHO = [
  'ID_Logistica', 'ID_Ciclo', 'ID_Influenciadora', 'Endereco_Entrega',
  'Codigo_Rastreio', 'Data_Envio', 'Status_Logistica'
];

// Planilha fake controlável: cada teste seta LINHAS antes de instanciar o repo.
let LINHAS = [];

function abaFake() {
  return {
    getDataRange: () => ({ getValues: () => [CABECALHO.slice()].concat(LINHAS.map((l) => l.slice())) }),
    getRange: (linha) => ({
      getFormulas: () => [CABECALHO.map(() => '')],
      setValues: (valores) => { LINHAS[linha - 2] = valores[0]; }
    }),
    appendRow: (linha) => LINHAS.push(linha)
  };
}

let uuidN = 0;
const sandbox = {
  Utilities: { getUuid: () => 'log-uuid-' + (++uuidN) },
  console: { error() {} },
  SpreadsheetApp: { getActive: () => ({ getSheetByName: (nome) => (nome === 'Logistica' ? abaFake() : null) }) }
};

const ctx = loadGasFiles(
  ['Infra.js', 'Modelos.js', 'Repositories.js', 'Services.js', 'Controllers.js'].map(arquivo),
  sandbox,
  ['Logistica', 'LogisticaRepository', 'LogisticaService', 'LogisticaController',
   'CAMPOS_LOGISTICA', 'ESTADOS_LOGISTICA', 'EVENTO_LOGISTICA_ENVIADA']
);

const {
  Logistica, LogisticaRepository, LogisticaService, LogisticaController,
  CAMPOS_LOGISTICA, ESTADOS_LOGISTICA, EVENTO_LOGISTICA_ENVIADA
} = ctx;
const C = CAMPOS_LOGISTICA;
const E = ESTADOS_LOGISTICA;

// Linha crua, como o Repository a devolveria (chaves = cabeçalhos da planilha).
function linhaCrua(over) {
  return Object.assign({
    [C.ID]: 'l-1',
    [C.CICLO]: 'c-1',
    [C.INFLUENCIADORA]: 'i-1',
    [C.ENDERECO]: 'Rua X, 100',
    [C.RASTREIO]: '',
    [C.DATA_ENVIO]: '',
    [C.STATUS]: E.AGUARDANDO_ENVIO
  }, over);
}

function repoFake(linhas) {
  return {
    getById: (id) => linhas.find((l) => String(l[C.ID]) === String(id)) || null,
    findByCiclo: (idc) => linhas.filter((l) => String(l[C.CICLO]) === String(idc)),
    save: (dados) => dados
  };
}

const dispatcherFake = () => ({ dispatch: jest.fn() });

function montar(linhas) {
  const dispatcher = dispatcherFake();
  const service = new LogisticaService(dispatcher, repoFake(linhas));
  return { service, dispatcher, controller: new LogisticaController(service) };
}

describe('Logistica — máquina de estados', () => {
  test('transições válidas do fluxo logístico', () => {
    expect(new Logistica(linhaCrua({ [C.STATUS]: E.PENDENTE })).validateStateTransition(E.AGUARDANDO_ENVIO)).toBe(true);
    expect(new Logistica(linhaCrua()).validateStateTransition(E.ENVIADO)).toBe(true);
    expect(new Logistica(linhaCrua({ [C.STATUS]: E.ENVIADO })).validateStateTransition(E.ENTREGUE)).toBe(true);
  });

  test('Cancelado é alcançável de qualquer estado ativo', () => {
    [E.PENDENTE, E.AGUARDANDO_ENVIO, E.ENVIADO].forEach((estado) => {
      expect(new Logistica(linhaCrua({ [C.STATUS]: estado })).validateStateTransition(E.CANCELADO)).toBe(true);
    });
  });

  test('pular etapa é transição proibida', () => {
    expect(() => new Logistica(linhaCrua({ [C.STATUS]: E.PENDENTE })).validateStateTransition(E.ENVIADO))
      .toThrow(/Transição proibida/i);
  });

  test('Entregue e Cancelado são terminais', () => {
    expect(() => new Logistica(linhaCrua({ [C.STATUS]: E.ENTREGUE })).validateStateTransition(E.CANCELADO))
      .toThrow(/terminal/i);
    expect(() => new Logistica(linhaCrua({ [C.STATUS]: E.CANCELADO })).validateStateTransition(E.ENVIADO))
      .toThrow(/terminal/i);
  });

  test('estado de destino fora do domínio é rejeitado', () => {
    expect(() => new Logistica(linhaCrua()).validateStateTransition('Voando'))
      .toThrow(/não pertence a ESTADOS_LOGISTICA/i);
  });
});

describe('LogisticaService — leitura', () => {
  test('listarPorCiclo devolve DTO, não a linha da planilha', () => {
    const { service } = montar([linhaCrua()]);

    const [dto] = service.listarPorCiclo('c-1');

    expect(dto).toEqual({
      idLogistica: 'l-1',
      idCiclo: 'c-1',
      idInfluenciadora: 'i-1',
      enderecoEntrega: 'Rua X, 100',
      codigoRastreio: '',
      dataEnvio: '',
      status: E.AGUARDANDO_ENVIO
    });
    expect(Object.keys(dto)).not.toContain(C.STATUS);
  });

  test('escopo por parceira: não devolve o envio de outra influenciadora', () => {
    const { service } = montar([linhaCrua(), linhaCrua({ [C.ID]: 'l-2', [C.INFLUENCIADORA]: 'i-2' })]);

    expect(service.listarDaInfluenciadoraNoCiclo('c-1', 'i-1').map((d) => d.idLogistica)).toEqual(['l-1']);
  });

  test.each([[''], [null], [undefined]])('listarPorCiclo(%p) exige o ciclo', (vazio) => {
    expect(() => montar([]).service.listarPorCiclo(vazio)).toThrow(/ciclo/i);
  });

  test('obter não devolve o envio de outra influenciadora', () => {
    const { service } = montar([linhaCrua()]);

    expect(service.obter('l-1', 'i-1').idLogistica).toBe('l-1');
    expect(() => service.obter('l-1', 'i-2')).toThrow(/não encontrada/i);
    expect(() => service.obter('l-1', '')).toThrow(/influenciadora/i);
  });
});

describe('LogisticaService — automação de envio', () => {
  test('registrarEnvio grava rastreio, transiciona para Enviado e dispara o evento', () => {
    const { service, dispatcher } = montar([linhaCrua()]);

    const dto = service.registrarEnvio('l-1', 'BR123', 'i-1');

    expect(dto.status).toBe(E.ENVIADO);
    expect(dto.codigoRastreio).toBe('BR123');
    expect(dto.enviadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(EVENTO_LOGISTICA_ENVIADA, expect.objectContaining({
      idLogistica: 'l-1',
      codigoRastreio: 'BR123'
    }));
  });

  test('registrarEnvio exige código de rastreio', () => {
    expect(() => montar([linhaCrua()]).service.registrarEnvio('l-1', '  ', 'i-1'))
      .toThrow(/rastreio/i);
  });

  test('registrarEnvio a partir de estado inválido é transição proibida', () => {
    const { service } = montar([linhaCrua({ [C.STATUS]: E.PENDENTE })]);

    expect(() => service.registrarEnvio('l-1', 'BR123', 'i-1')).toThrow(/Transição proibida/i);
  });

  test('registrarEnvio não notifica de fato: nenhum listener de e-mail acoplado (sem MailApp no ambiente)', () => {
    // O Service dispara o evento; o disparo real de e-mail fica desligado até
    // autorização (CLAUDE.md §12.4). Se o Service chamasse MailApp direto, isto
    // lançaria ReferenceError — a ausência de erro prova o desacoplamento.
    expect(() => montar([linhaCrua()]).service.registrarEnvio('l-1', 'BR123', 'i-1')).not.toThrow();
  });

  test('alterarStatus dispara evento e não altera envio de outra parceira', () => {
    const { service, dispatcher } = montar([linhaCrua()]);

    const dto = service.alterarStatus('l-1', E.ENVIADO, 'i-1');
    expect(dto).toEqual(expect.objectContaining({ statusAnterior: E.AGUARDANDO_ENVIO, novoStatus: E.ENVIADO }));
    expect(dispatcher.dispatch).toHaveBeenCalled();

    expect(() => service.alterarStatus('l-1', E.ENVIADO, 'i-2')).toThrow(/não encontrada/i);
  });
});

describe('LogisticaController — envelope', () => {
  test('LIST_BY_CYCLE e GET_BY_ID devolvem sucesso', () => {
    const { controller } = montar([linhaCrua()]);

    const lista = controller.handleLogisticaQuery({ action: 'LIST_BY_CYCLE', idCiclo: 'c-1', idInfluenciadora: 'i-1' });
    expect(lista).toEqual({ success: true, data: [expect.objectContaining({ idLogistica: 'l-1' })] });

    const um = controller.handleLogisticaQuery({ action: 'GET_BY_ID', idLogistica: 'l-1', idInfluenciadora: 'i-1' });
    expect(um.success).toBe(true);
    expect(um.data.idLogistica).toBe('l-1');
  });

  test('REGISTER_SHIPMENT devolve sucesso com mensagem', () => {
    const { controller } = montar([linhaCrua()]);

    const resp = controller.handleLogisticaUpdate({
      action: 'REGISTER_SHIPMENT', idLogistica: 'l-1', codigoRastreio: 'BR9', idInfluenciadora: 'i-1'
    });

    expect(resp.success).toBe(true);
    expect(resp.data.status).toBe(E.ENVIADO);
    expect(resp.message).toMatch(/registrado/i);
  });

  test.each([
    [{ action: 'LIST_BY_CYCLE', idCiclo: 'c-1' }, 'query', /idInfluenciadora/],
    [{ action: 'GET_BY_ID', idInfluenciadora: 'i-1' }, 'query', /idLogistica/],
    [{ action: 'APAGAR', idCiclo: 'c-1', idInfluenciadora: 'i-1' }, 'query', /não é suportada/],
    [null, 'query', /payload ausente/],
    [{ action: 'REGISTER_SHIPMENT', idLogistica: 'l-1', idInfluenciadora: 'i-1' }, 'update', /codigoRastreio/],
    [{ action: 'CHANGE_STATUS', idLogistica: 'l-1', idInfluenciadora: 'i-1' }, 'update', /newStatus/],
    [{ action: 'LIST_BY_CYCLE' }, 'update', /não é suportada/]
  ])('converte %p em {success:false} sem lançar', (payload, tipo, mensagem) => {
    const { controller } = montar([linhaCrua()]);

    const resp = tipo === 'query'
      ? controller.handleLogisticaQuery(payload)
      : controller.handleLogisticaUpdate(payload);

    expect(resp.success).toBe(false);
    expect(resp.error).toMatch(mensagem);
    expect(resp).not.toHaveProperty('data');
  });
});

describe('LogisticaRepository — planilha real (fake)', () => {
  beforeEach(() => { LINHAS = []; uuidN = 0; });

  test('save insere gerando ID quando ausente', () => {
    const repo = new LogisticaRepository();

    const salvo = repo.save({ [C.CICLO]: 'c-1', [C.INFLUENCIADORA]: 'i-1', [C.STATUS]: E.PENDENTE });

    expect(salvo[C.ID]).toBe('log-uuid-1');
    expect(LINHAS).toHaveLength(1);
    expect(repo.getById('log-uuid-1')[C.STATUS]).toBe(E.PENDENTE);
  });

  test('findByCiclo filtra por ciclo e ignora linhas de outro', () => {
    const repo = new LogisticaRepository();
    repo.save({ [C.ID]: 'l-1', [C.CICLO]: 'c-1', [C.INFLUENCIADORA]: 'i-1', [C.STATUS]: E.PENDENTE });
    repo.save({ [C.ID]: 'l-2', [C.CICLO]: 'c-2', [C.INFLUENCIADORA]: 'i-2', [C.STATUS]: E.PENDENTE });

    expect(repo.findByCiclo('c-1').map((l) => l[C.ID])).toEqual(['l-1']);
  });

  test('save atualiza preservando colunas não enviadas', () => {
    const repo = new LogisticaRepository();
    repo.save({ [C.ID]: 'l-1', [C.CICLO]: 'c-1', [C.INFLUENCIADORA]: 'i-1', [C.ENDERECO]: 'Rua Y', [C.STATUS]: E.AGUARDANDO_ENVIO });

    repo.save({ [C.ID]: 'l-1', [C.STATUS]: E.ENVIADO, [C.RASTREIO]: 'BR7' });

    const atual = repo.getById('l-1');
    expect(atual[C.STATUS]).toBe(E.ENVIADO);
    expect(atual[C.RASTREIO]).toBe('BR7');
    expect(atual[C.ENDERECO]).toBe('Rua Y'); // não foi enviada no update, tem que sobreviver
    expect(LINHAS).toHaveLength(1);
  });
});

describe('Painel Admin — Logística cross-parceira (service + controller)', () => {
  test('alterarStatusComoAdmin transiciona sem exigir posse por parceira', () => {
    const { service, dispatcher } = montar([linhaCrua()]);

    const dto = service.alterarStatusComoAdmin('l-1', E.ENVIADO);

    expect(dto).toEqual(expect.objectContaining({ statusAnterior: E.AGUARDANDO_ENVIO, novoStatus: E.ENVIADO }));
    expect(dispatcher.dispatch).toHaveBeenCalled();
  });

  test('alterarStatusComoAdmin lança quando o envio não existe', () => {
    expect(() => montar([linhaCrua()]).service.alterarStatusComoAdmin('inexistente', E.ENVIADO))
      .toThrow(/não encontrada/i);
  });

  test('LIST_ALL_BY_CYCLE devolve os envios de todas as parceiras do ciclo', () => {
    const { controller } = montar([linhaCrua(), linhaCrua({ [C.ID]: 'l-2', [C.INFLUENCIADORA]: 'i-2' })]);

    const resp = controller.handleLogisticaQuery({ action: 'LIST_ALL_BY_CYCLE', idCiclo: 'c-1' });

    expect(resp.success).toBe(true);
    expect(resp.data.map((d) => d.idLogistica).sort()).toEqual(['l-1', 'l-2']);
  });

  test('CHANGE_STATUS_ADMIN muda o status sem idInfluenciadora', () => {
    const { controller } = montar([linhaCrua()]);

    const resp = controller.handleLogisticaUpdate({ action: 'CHANGE_STATUS_ADMIN', idLogistica: 'l-1', newStatus: E.ENVIADO });

    expect(resp.success).toBe(true);
    expect(resp.data.novoStatus).toBe(E.ENVIADO);
    expect(resp.message).toMatch(/atualizado/i);
  });

  test.each([
    [{ action: 'LIST_ALL_BY_CYCLE' }, 'query', /idCiclo/],
    [{ action: 'CHANGE_STATUS_ADMIN', idLogistica: 'l-1' }, 'update', /newStatus/]
  ])('valida campos obrigatórios das ações admin: %p', (payload, tipo, mensagem) => {
    const { controller } = montar([linhaCrua()]);

    const resp = tipo === 'query'
      ? controller.handleLogisticaQuery(payload)
      : controller.handleLogisticaUpdate(payload);

    expect(resp.success).toBe(false);
    expect(resp.error).toMatch(mensagem);
  });
});

describe('Painel Admin — entrypoints de Logística (gate ADMIN_TOKEN)', () => {
  function cacheFalso() {
    const m = new Map();
    return { get: (k) => (m.has(k) ? m.get(k) : null), put: (k, v) => m.set(k, String(v)), remove: (k) => m.delete(k) };
  }

  function abaLogFake(linhas) {
    return {
      getDataRange: () => ({ getValues: () => [CABECALHO.slice()].concat(linhas.map((l) => l.slice())) }),
      getRange: (linha) => ({ getFormulas: () => [CABECALHO.map(() => '')], setValues: (v) => { linhas[linha - 2] = v[0]; } }),
      appendRow: (l) => linhas.push(l.slice())
    };
  }

  function linhaArray(over) {
    const obj = linhaCrua(over);
    return CABECALHO.map((h) => obj[h]);
  }

  function montarEntrypoints(linhasArray, adminToken) {
    const linhas = (linhasArray || []).map((l) => l.slice());
    const cache = cacheFalso();
    const sandbox = {
      console: { error() {} },
      Utilities: { getUuid: () => 'ep-uuid' },
      SpreadsheetApp: { getActive: () => ({ getSheetByName: (nome) => (nome === 'Logistica' ? abaLogFake(linhas) : null) }) },
      CacheService: { getScriptCache: () => cache },
      PropertiesService: { getScriptProperties: () => ({ getProperty: () => adminToken }) }
    };

    const ctxEp = loadGasFiles(
      ['Infra.js', 'Modelos.js', 'Repositories.js', 'Services.js', 'Controllers.js', 'Roteador.js'].map(arquivo),
      sandbox,
      ['apiListarLogisticaDoCiclo', 'apiAlterarStatusLogistica', 'apiListarCiclosAdmin']
    );

    return { ctxEp };
  }

  test('token admin errado é rejeitado, mesma mensagem para os três entrypoints', () => {
    const { ctxEp } = montarEntrypoints([linhaArray()], 'ADMIN-OK');

    expect(ctxEp.apiListarLogisticaDoCiclo('ERRADO', 'c-1')).toEqual({ success: false, error: 'Operação não autorizada.' });
    expect(ctxEp.apiAlterarStatusLogistica('ERRADO', 'l-1', E.ENVIADO)).toEqual({ success: false, error: 'Operação não autorizada.' });
    expect(ctxEp.apiListarCiclosAdmin('ERRADO')).toEqual({ success: false, error: 'Operação não autorizada.' });
  });

  test('token admin válido lista todos os envios do ciclo', () => {
    const { ctxEp } = montarEntrypoints(
      [linhaArray(), linhaArray({ [C.ID]: 'l-2', [C.INFLUENCIADORA]: 'i-2' })],
      'ADMIN-OK'
    );

    const r = ctxEp.apiListarLogisticaDoCiclo('ADMIN-OK', 'c-1');

    expect(r.success).toBe(true);
    expect(r.data.map((d) => d.idLogistica).sort()).toEqual(['l-1', 'l-2']);
  });

  test('token admin válido altera o status de qualquer envio', () => {
    const { ctxEp } = montarEntrypoints([linhaArray()], 'ADMIN-OK');

    const r = ctxEp.apiAlterarStatusLogistica('ADMIN-OK', 'l-1', E.ENVIADO);

    expect(r.success).toBe(true);
    expect(r.data.novoStatus).toBe(E.ENVIADO);
  });
});
