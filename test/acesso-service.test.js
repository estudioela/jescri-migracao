const { loadGas } = require('./helpers/gasHarness');

const ARQUIVOS = [
  'src/shared/Nucleo.js',
  'src/domain/Credencial.js',
  'src/domain/TokenDeSessao.js',
  'src/modulos/Arquivamento.js',
  'src/domain/Sessao.js',
  'src/domain/Autenticador.js',
  'src/service/AcessoPortalService.js',
];

const AGORA = new Date('2026-07-16T10:00:00Z');

// Stubs em memória das portas do service (repositórios/relógio/token/eventos).
function montar(opcoes) {
  const gas = loadGas(ARQUIVOS);
  const estado = {
    sessoes: {},
    bloqueios: {},
    eventos: [],
    agora: (opcoes && opcoes.agora) || AGORA,
  };
  const sessaoRepository = {
    salvar: (sessao) => {
      estado.sessoes[sessao.token.valor] = sessao;
      return sessao;
    },
    obterPorToken: (token) => estado.sessoes[token] || null,
    remover: (token) => {
      delete estado.sessoes[token];
    },
  };
  const bloqueioRepository = {
    contarFalhas: (id) => (estado.bloqueios[id] ? estado.bloqueios[id].tentativas : 0),
    salvarFalhas: (id, falhas) => {
      estado.bloqueios[id] = { tentativas: falhas, janela: null };
    },
    obterJanela: (id) =>
      estado.bloqueios[id] && estado.bloqueios[id].janela
        ? estado.bloqueios[id].janela
        : null,
    bloquear: (id, janela, falhas) => {
      estado.bloqueios[id] = { tentativas: falhas, janela: janela };
    },
    limpar: (id) => {
      delete estado.bloqueios[id];
    },
  };
  const verificador = {
    verificar: (credencial) =>
      credencial.segredo === '12345' ? 'Maria' : null,
  };
  const servico = new gas.AcessoPortalService(
    new gas.Autenticador(verificador),
    sessaoRepository,
    bloqueioRepository,
    { gerar: () => 'tok-' + (Object.keys(estado.sessoes).length + 1) },
    { hoje: () => estado.agora },
    { publicar: (evento) => estado.eventos.push(evento) }
  );
  return { gas, servico, estado };
}

const CREDENCIAL_OK = { identificador: 'CUPOM10', segredo: '12345' };
const CREDENCIAL_ERRADA = { identificador: 'CUPOM10', segredo: '99999' };

function codigoDe(fn) {
  try {
    fn();
  } catch (erro) {
    return erro.codigo;
  }
  return null;
}

describe('AcessoPortalService.entrar (UC-025.01)', () => {
  test('login válido cria Sessão de 6h e publica SessaoIniciada (§12)', () => {
    const { servico, estado } = montar();

    const sessao = servico.entrar(CREDENCIAL_OK);

    expect(sessao.parceiraId).toBe('Maria');
    expect(estado.sessoes[sessao.token.valor]).toBe(sessao);
    expect(sessao.expiraEm.getTime() - AGORA.getTime()).toBe(6 * 60 * 60 * 1000);
    expect(estado.eventos).toEqual([{ nome: 'SessaoIniciada', parceiraId: 'Maria' }]);
  });

  test('credencial inválida devolve AC-01 e acumula falha', () => {
    const { servico, estado } = montar();

    expect(codigoDe(() => servico.entrar(CREDENCIAL_ERRADA))).toBe('AC-01');
    expect(estado.bloqueios['CUPOM10'].tentativas).toBe(1);
  });

  test('credencial vazia devolve AC-01 sem tocar estado', () => {
    const { servico, estado } = montar();

    expect(codigoDe(() => servico.entrar({ identificador: '', segredo: '' }))).toBe('AC-01');
    expect(estado.bloqueios).toEqual({});
  });

  // RN-02 / CB-01: a 5ª falha bloqueia por 15 minutos e publica o evento.
  test('5ª falha aplica bloqueio, devolve AC-02 e publica AcessoBloqueado', () => {
    const { servico, estado } = montar();

    for (let i = 0; i < 4; i++) {
      expect(codigoDe(() => servico.entrar(CREDENCIAL_ERRADA))).toBe('AC-01');
    }
    expect(codigoDe(() => servico.entrar(CREDENCIAL_ERRADA))).toBe('AC-02');

    expect(estado.bloqueios['CUPOM10'].janela.ativaEm(AGORA)).toBe(true);
    const nomes = estado.eventos.map((e) => e.nome);
    expect(nomes).toEqual(['AcessoBloqueado']);
    // §12: payload do evento é identificador + janela — nunca credencial.
    expect(estado.eventos[0].identificador).toBe('CUPOM10');
    expect(estado.eventos[0].janela.fim).toBe('2026-07-16T10:15:00.000Z');
  });

  // INV-02 / CB-03: bloqueio recusa até credencial correta durante a janela.
  test('durante a janela, até a credencial correta é recusada (CB-03)', () => {
    const { servico } = montar();
    for (let i = 0; i < 5; i++) {
      codigoDe(() => servico.entrar(CREDENCIAL_ERRADA));
    }

    expect(codigoDe(() => servico.entrar(CREDENCIAL_OK))).toBe('AC-02');
  });

  test('após o fim da janela, volta a NaoAutenticada e zera tentativas (§9)', () => {
    const { servico, estado } = montar();
    for (let i = 0; i < 5; i++) {
      codigoDe(() => servico.entrar(CREDENCIAL_ERRADA));
    }

    estado.agora = new Date('2026-07-16T10:15:00Z');
    const sessao = servico.entrar(CREDENCIAL_OK);

    expect(sessao.parceiraId).toBe('Maria');
    expect(estado.bloqueios['CUPOM10']).toBeUndefined();
  });

  test('login válido zera falhas anteriores ao limite', () => {
    const { servico, estado } = montar();
    codigoDe(() => servico.entrar(CREDENCIAL_ERRADA));

    servico.entrar(CREDENCIAL_OK);

    expect(estado.bloqueios['CUPOM10']).toBeUndefined();
  });

  // RN-04 / INV-03: mensagens de erro nunca carregam credencial.
  test('mensagens de erro não expõem segredo nem identificador (RN-04)', () => {
    const { servico } = montar();

    try {
      servico.entrar(CREDENCIAL_ERRADA);
    } catch (erro) {
      expect(erro.message).not.toContain('99999');
      expect(erro.message).not.toContain('CUPOM10');
    }
  });
});

describe('AcessoPortalService.renovar (UC-025.02)', () => {
  test('interação renova a validade — expiração deslizante (RN-03)', () => {
    const { servico, estado } = montar();
    const sessao = servico.entrar(CREDENCIAL_OK);

    estado.agora = new Date('2026-07-16T12:00:00Z');
    const renovada = servico.renovar({ token: sessao.token.valor });

    expect(renovada.expiraEm.toISOString()).toBe('2026-07-16T18:00:00.000Z');
  });

  test('sessão expirada devolve AC-03 e é removida (CB-02)', () => {
    const { servico, estado } = montar();
    const sessao = servico.entrar(CREDENCIAL_OK);

    estado.agora = new Date('2026-07-16T16:00:00Z');
    expect(codigoDe(() => servico.renovar({ token: sessao.token.valor }))).toBe('AC-03');
    expect(estado.sessoes[sessao.token.valor]).toBeUndefined();
  });

  test('token desconhecido ou ausente devolve AC-03', () => {
    const { servico } = montar();

    expect(codigoDe(() => servico.renovar({ token: 'nao-existe' }))).toBe('AC-03');
    expect(codigoDe(() => servico.renovar({}))).toBe('AC-03');
  });
});

describe('AcessoPortalService.sair (§9 logout)', () => {
  test('logout remove a sessão e é idempotente', () => {
    const { servico, estado } = montar();
    const sessao = servico.entrar(CREDENCIAL_OK);

    servico.sair({ token: sessao.token.valor });
    servico.sair({ token: sessao.token.valor });

    expect(estado.sessoes).toEqual({});
    expect(codigoDe(() => servico.renovar({ token: sessao.token.valor }))).toBe('AC-03');
  });
});
