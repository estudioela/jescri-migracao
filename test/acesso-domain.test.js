const { loadGas } = require('./helpers/gasHarness');

const ARQUIVOS = [
  'src/domain/Credencial.js',
  'src/domain/TokenDeSessao.js',
  'src/modulos/Arquivamento.js',
  'src/domain/Sessao.js',
  'src/domain/Autenticador.js',
];

function carregar() {
  return loadGas(ARQUIVOS);
}

describe('VO Credencial (SPEC-025 §6.1)', () => {
  test('exige identificador e segredo — fail-fast', () => {
    const gas = carregar();

    expect(() => new gas.Credencial('', '12345')).toThrow();
    expect(() => new gas.Credencial('CUPOM10', '')).toThrow();
    expect(() => new gas.Credencial('   ', '   ')).toThrow();
  });

  test('normaliza com trim e preserva identificador e segredo', () => {
    const gas = carregar();

    const credencial = new gas.Credencial(' CUPOM10 ', ' 12345 ');

    expect(credencial.identificador).toBe('CUPOM10');
    expect(credencial.segredo).toBe('12345');
  });

  // INV-03 / RN-04: credencial nunca em claro em log — a serialização
  // acidental (String(credencial), JSON) não pode expor o segredo.
  test('não expõe o segredo em serialização acidental (INV-03)', () => {
    const gas = carregar();

    const credencial = new gas.Credencial('CUPOM10', '12345');

    expect(String(credencial)).not.toContain('12345');
    expect(JSON.stringify(credencial)).not.toContain('12345');
  });
});

describe('VO TokenDeSessao (SPEC-025 §6.1)', () => {
  test('exige valor — fail-fast', () => {
    const gas = carregar();

    expect(() => new gas.TokenDeSessao('')).toThrow();
    expect(() => new gas.TokenDeSessao('   ')).toThrow();
  });

  test('preserva o valor opaco', () => {
    const gas = carregar();

    expect(new gas.TokenDeSessao('abc-123').valor).toBe('abc-123');
  });
});

describe('VO JanelaDeBloqueio (SPEC-025 RN-02)', () => {
  test('dura 15 minutos a partir do início (RN-02)', () => {
    const gas = carregar();
    const inicio = new Date('2026-07-16T10:00:00Z');

    const janela = new gas.JanelaDeBloqueio(inicio);

    expect(janela.fim.getTime() - inicio.getTime()).toBe(15 * 60 * 1000);
  });

  test('ativaEm: bloqueia dentro da janela, libera após (CB-03)', () => {
    const gas = carregar();
    const janela = new gas.JanelaDeBloqueio(new Date('2026-07-16T10:00:00Z'));

    expect(janela.ativaEm(new Date('2026-07-16T10:14:59Z'))).toBe(true);
    expect(janela.ativaEm(new Date('2026-07-16T10:15:00Z'))).toBe(false);
  });

  test('exige início válido — fail-fast', () => {
    const gas = carregar();

    expect(() => new gas.JanelaDeBloqueio(null)).toThrow();
    expect(() => new gas.JanelaDeBloqueio('ontem')).toThrow();
  });
});

describe('Agregado Sessão (SPEC-025 §6.2, RN-03)', () => {
  const agora = new Date('2026-07-16T10:00:00Z');

  function novaSessao(gas) {
    return new gas.Sessao('Maria', new gas.TokenDeSessao('tok-1'), agora);
  }

  // INV-01: Sessão só existe para Parceira autenticada.
  test('exige parceiraId e token (INV-01) — fail-fast', () => {
    const gas = carregar();

    expect(() => new gas.Sessao('', new gas.TokenDeSessao('t'), agora)).toThrow();
    expect(() => new gas.Sessao('Maria', null, agora)).toThrow();
  });

  test('nasce válida por 6 horas (RN-03)', () => {
    const gas = carregar();

    const sessao = novaSessao(gas);

    expect(sessao.expiraEm.getTime() - agora.getTime()).toBe(6 * 60 * 60 * 1000);
  });

  test('renovar desliza a validade a partir da interação (UC-025.02)', () => {
    const gas = carregar();
    const sessao = novaSessao(gas);
    const interacao = new Date('2026-07-16T12:00:00Z');

    sessao.renovar(interacao);

    expect(sessao.expiraEm.getTime() - interacao.getTime()).toBe(6 * 60 * 60 * 1000);
  });

  test('expira após 6h de inatividade (CB-02)', () => {
    const gas = carregar();
    const sessao = novaSessao(gas);

    expect(sessao.expiradaEm(new Date('2026-07-16T15:59:59Z'))).toBe(false);
    expect(sessao.expiradaEm(new Date('2026-07-16T16:00:00Z'))).toBe(true);
  });

  test('reconstituir preserva a validade persistida (não recomputa)', () => {
    const gas = carregar();
    const expiraEm = new Date('2026-07-16T13:30:00Z');

    const sessao = gas.Sessao.reconstituir('Maria', 'tok-1', expiraEm);

    expect(sessao.parceiraId).toBe('Maria');
    expect(sessao.token.valor).toBe('tok-1');
    expect(sessao.expiraEm.getTime()).toBe(expiraEm.getTime());
  });
});

describe('Serviço de domínio Autenticador (SPEC-025 §6.3)', () => {
  const agora = new Date('2026-07-16T10:00:00Z');

  function autenticadorQueResolve(gas, parceiraId) {
    return new gas.Autenticador({ verificar: () => parceiraId });
  }

  test('credencial válida autentica a Parceira (UC-025.01)', () => {
    const gas = carregar();
    const autenticador = autenticadorQueResolve(gas, 'Maria');

    const resultado = autenticador.autenticar(
      new gas.Credencial('CUPOM10', '12345'),
      0,
      agora
    );

    expect(resultado).toEqual({ sucesso: true, parceiraId: 'Maria' });
  });

  test('credencial inválida acumula falha sem bloquear antes do limite', () => {
    const gas = carregar();
    const autenticador = autenticadorQueResolve(gas, null);

    const resultado = autenticador.autenticar(
      new gas.Credencial('CUPOM10', '99999'),
      3,
      agora
    );

    expect(resultado.sucesso).toBe(false);
    expect(resultado.falhas).toBe(4);
    expect(resultado.bloqueio).toBeNull();
  });

  // RN-02 / CB-01: a 5ª tentativa malsucedida inicia bloqueio de 15 min.
  test('5ª falha aplica bloqueio de 15 minutos (RN-02, CB-01)', () => {
    const gas = carregar();
    const autenticador = autenticadorQueResolve(gas, null);

    const resultado = autenticador.autenticar(
      new gas.Credencial('CUPOM10', '99999'),
      4,
      agora
    );

    expect(resultado.sucesso).toBe(false);
    expect(resultado.falhas).toBe(5);
    expect(resultado.bloqueio.ativaEm(agora)).toBe(true);
  });

  test('criarSessao emite Sessão de 6h para a Parceira autenticada', () => {
    const gas = carregar();
    const autenticador = autenticadorQueResolve(gas, 'Maria');

    const sessao = autenticador.criarSessao('Maria', 'tok-1', agora);

    expect(sessao.parceiraId).toBe('Maria');
    expect(sessao.token.valor).toBe('tok-1');
    expect(sessao.expiraEm.getTime() - agora.getTime()).toBe(6 * 60 * 60 * 1000);
  });
});
