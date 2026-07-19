const { loadGas } = require('./helpers/gasHarness');

function dominio() {
  return loadGas(['src/modulos/Usuario.js']);
}

const AGORA = new Date('2026-07-17T10:00:00Z');

describe('Usuario — construção (SPEC-035 RN-01/RN-05)', () => {
  test('novo() nasce PENDING (RN-04), com subProvider/email/papel normalizados', () => {
    const gas = dominio();

    const usuario = gas.Usuario.novo(' sub-123 ', ' Maria@Exemplo.com ', 'INFLUENCIADORA', AGORA);

    expect(usuario.subProvider).toBe('sub-123');
    expect(usuario.email).toBe('Maria@Exemplo.com');
    expect(usuario.papel).toBe('INFLUENCIADORA');
    expect(usuario.estado).toBe('PENDING');
    expect(usuario.dataCriacao).toBe(AGORA);
    expect(usuario.ultimoAcesso).toBeNull();
  });

  test('exige subProvider — fail-fast', () => {
    const gas = dominio();

    expect(() => gas.Usuario.novo('', 'a@b.com', 'ADMINISTRADOR', AGORA)).toThrow();
    expect(() => gas.Usuario.novo('   ', 'a@b.com', 'ADMINISTRADOR', AGORA)).toThrow();
  });

  test('papel deve ser um dos três canônicos (RN-05) — fail-fast', () => {
    const gas = dominio();

    expect(() => gas.Usuario.novo('sub-1', 'a@b.com', 'SUPERADMIN', AGORA)).toThrow();
    expect(() => gas.Usuario.novo('sub-1', 'a@b.com', '', AGORA)).toThrow();
  });

  test('aceita os três papéis do enum soberano (ADMINISTRADOR/MARCA/INFLUENCIADORA)', () => {
    const gas = dominio();

    ['ADMINISTRADOR', 'MARCA', 'INFLUENCIADORA'].forEach((papel) => {
      expect(gas.Usuario.novo('sub-1', 'a@b.com', papel, AGORA).papel).toBe(papel);
    });
  });
});

describe('Usuario — máquina de estados (SPEC-035 Cap. 7)', () => {
  test('aprovar(): PENDING → ACTIVE (RN-04)', () => {
    const gas = dominio();
    const usuario = gas.Usuario.novo('sub-1', 'a@b.com', 'ADMINISTRADOR', AGORA);

    usuario.aprovar();

    expect(usuario.estado).toBe('ACTIVE');
    expect(usuario.estaAtivo()).toBe(true);
  });

  test('rejeitar(): PENDING → REJECTED (RN-04)', () => {
    const gas = dominio();
    const usuario = gas.Usuario.novo('sub-1', 'a@b.com', 'ADMINISTRADOR', AGORA);

    usuario.rejeitar();

    expect(usuario.estado).toBe('REJECTED');
    expect(usuario.estaAtivo()).toBe(false);
  });

  test('aprovar()/rejeitar() fora de PENDING lança erro (§7.2)', () => {
    const gas = dominio();
    const ativo = gas.Usuario.novo('sub-1', 'a@b.com', 'ADMINISTRADOR', AGORA).aprovar();

    expect(() => ativo.aprovar()).toThrow();
    expect(() => ativo.rejeitar()).toThrow();
  });

  test('inativar(): ACTIVE → INACTIVE; só a partir de ACTIVE (§7.2)', () => {
    const gas = dominio();
    const pendente = gas.Usuario.novo('sub-1', 'a@b.com', 'ADMINISTRADOR', AGORA);
    expect(() => pendente.inativar()).toThrow();

    const ativo = pendente.aprovar();
    ativo.inativar();

    expect(ativo.estado).toBe('INACTIVE');
    expect(ativo.estaAtivo()).toBe(false);
  });

  test('reativar(): INACTIVE → ACTIVE; só a partir de INACTIVE (§7.2)', () => {
    const gas = dominio();
    const usuario = gas.Usuario.novo('sub-1', 'a@b.com', 'ADMINISTRADOR', AGORA)
      .aprovar()
      .inativar();

    usuario.reativar();

    expect(usuario.estado).toBe('ACTIVE');
  });

  test('REJECTED é terminal — nenhuma transição permitida (§7.1)', () => {
    const gas = dominio();
    const rejeitado = gas.Usuario.novo('sub-1', 'a@b.com', 'ADMINISTRADOR', AGORA).rejeitar();

    expect(() => rejeitado.aprovar()).toThrow();
    expect(() => rejeitado.inativar()).toThrow();
    expect(() => rejeitado.reativar()).toThrow();
  });
});

describe('Usuario — reconstituir() (rehydration do Repository)', () => {
  test('reidrata sem recomputar o estado nem regra de criação', () => {
    const gas = dominio();
    const ultimoAcesso = new Date('2026-07-17T12:00:00Z');

    const usuario = gas.Usuario.reconstituir(
      'sub-1',
      'a@b.com',
      'INFLUENCIADORA',
      'ACTIVE',
      AGORA,
      ultimoAcesso
    );

    expect(usuario.estado).toBe('ACTIVE');
    expect(usuario.dataCriacao).toBe(AGORA);
    expect(usuario.ultimoAcesso).toBe(ultimoAcesso);
    expect(usuario.estaAtivo()).toBe(true);
  });

  test('registrarAcesso() atualiza ultimoAcesso (§10.2.1 ULTIMO_ACESSO)', () => {
    const gas = dominio();
    const usuario = gas.Usuario.reconstituir('sub-1', 'a@b.com', 'ADMINISTRADOR', 'ACTIVE', AGORA, null);
    const novoAcesso = new Date('2026-07-17T15:00:00Z');

    usuario.registrarAcesso(novoAcesso);

    expect(usuario.ultimoAcesso).toBe(novoAcesso);
  });
});
