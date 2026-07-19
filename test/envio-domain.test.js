const { loadGas } = require('./helpers/gasHarness');

function dominio() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Envio.js',
  ]);
}

function envioPadrao(gas) {
  return new gas.Envio('maria-silva', new gas.MesReferencia(2026, 7));
}

const RASTREIO = 'BR123456789XX';
const DATA_ENVIO = new Date(2026, 6, 16);

describe('Envio — criação (SPEC-016 RN-01/INV-01)', () => {
  test('nasce com Revisão AguardandoConfirmacao e Jornada Pendente', () => {
    const gas = dominio();

    const envio = envioPadrao(gas);

    expect(envio.revisao).toBe('AguardandoConfirmacao');
    expect(envio.jornada).toBe('Pendente');
    expect(envio.rastreio).toBeNull();
    expect(envio.dataEnvio).toBeNull();
    expect(envio.dataArquivamento).toBeNull();
  });

  test('exige identidade completa: Parceira e MesReferencia (fail-fast)', () => {
    const gas = dominio();
    const mes = new gas.MesReferencia(2026, 7);

    expect(() => new gas.Envio('', mes)).toThrow(/parceira/i);
    expect(() => new gas.Envio('maria-silva', '2026-07')).toThrow(/MesReferencia/);
  });

  test('igualdade de entidade por Parceira × competência', () => {
    const gas = dominio();

    const a = new gas.Envio('maria-silva', new gas.MesReferencia(2026, 7));
    const b = new gas.Envio('maria-silva', new gas.MesReferencia(2026, 7));
    const outro = new gas.Envio('maria-silva', new gas.MesReferencia(2026, 8));

    expect(a.igualA(b)).toBe(true);
    expect(a.igualA(outro)).toBe(false);
  });
});

describe('CodigoRastreio — VO (SPEC-016 §6.1)', () => {
  test('aceita código não vazio, é imutável e compara por valor', () => {
    const gas = dominio();

    const codigo = new gas.CodigoRastreio(' BR123456789XX ');

    expect(codigo.toString()).toBe('BR123456789XX');
    expect(Object.isFrozen(codigo)).toBe(true);
    expect(codigo.igualA(new gas.CodigoRastreio('BR123456789XX'))).toBe(true);
  });

  test('recusa código vazio (fail-fast)', () => {
    const gas = dominio();

    expect(() => new gas.CodigoRastreio('')).toThrow(/rastreio/i);
    expect(() => new gas.CodigoRastreio(null)).toThrow(/rastreio/i);
  });
});

describe('EnderecoDeEntrega — VO com PII protegida (SPEC-016 §6.1/INV-04)', () => {
  const ENDERECO = 'Rua das Flores, 123 — São Paulo/SP';

  test('guarda o valor para uso explícito e é imutável', () => {
    const gas = dominio();

    const endereco = new gas.EnderecoDeEntrega(ENDERECO);

    expect(endereco.valor).toBe(ENDERECO);
    expect(Object.isFrozen(endereco)).toBe(true);
  });

  test('INV-04: não vaza PII em toString nem em serialização JSON', () => {
    const gas = dominio();

    const endereco = new gas.EnderecoDeEntrega(ENDERECO);

    expect(String(endereco)).not.toContain('Flores');
    expect(JSON.stringify(endereco)).not.toContain('Flores');
  });

  test('recusa endereço vazio (fail-fast)', () => {
    const gas = dominio();

    expect(() => new gas.EnderecoDeEntrega('')).toThrow(/endere[cç]o/i);
  });
});

describe('Envio — Revisão de dados (SPEC-016 §9)', () => {
  test('UC-016.01: confirmar endereço leva AguardandoConfirmacao → Confirmado', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);

    envio.confirmarEndereco();

    expect(envio.revisao).toBe('Confirmado');
  });

  test('LG-02: Confirmado é terminal — reconfirmar falha barulhento', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);
    envio.confirmarEndereco();

    expect(() => envio.confirmarEndereco()).toThrow(/LG-02/);
  });
});

describe('Envio — Jornada física (SPEC-016 §9)', () => {
  test('UC-016.02/RN-02: registrar rastreio leva Pendente → Expedido e preenche a data de envio', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);

    envio.registrarRastreio(RASTREIO, DATA_ENVIO);

    expect(envio.jornada).toBe('Expedido');
    expect(envio.rastreio.toString()).toBe(RASTREIO);
    expect(envio.dataEnvio).toBe(DATA_ENVIO);
  });

  test('CB-02: rastreio registrado com data de envio já preenchida preserva a data', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);
    envio.registrarRastreio(RASTREIO, DATA_ENVIO);

    envio.registrarRastreio('BR999999999XX', new Date(2026, 6, 20));

    expect(envio.jornada).toBe('Expedido');
    expect(envio.rastreio.toString()).toBe('BR999999999XX');
    expect(envio.dataEnvio).toBe(DATA_ENVIO);
  });

  test('registrar rastreio exige data de envio válida (determinístico)', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);

    expect(() => envio.registrarRastreio(RASTREIO, null)).toThrow(/data de envio/i);
    expect(() => envio.registrarRastreio(RASTREIO, new Date('inválida'))).toThrow(
      /data de envio/i
    );
  });

  test('RN-03: entrega detectada leva Expedido → Entregue e arquiva com data', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);
    const dataArquivamento = new Date(2026, 6, 25);
    envio.registrarRastreio(RASTREIO, DATA_ENVIO);

    envio.marcarEntregue(dataArquivamento);

    expect(envio.jornada).toBe('Entregue');
    expect(envio.dataArquivamento).toBe(dataArquivamento);
  });

  test('LG-02: marcar entregue fora de Expedido falha barulhento', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);

    expect(() => envio.marcarEntregue(new Date(2026, 6, 25))).toThrow(/LG-02/);
  });

  test('marcar entregue exige data de arquivamento válida (RN-03)', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);
    envio.registrarRastreio(RASTREIO, DATA_ENVIO);

    expect(() => envio.marcarEntregue(null)).toThrow(/arquivamento/i);
    expect(() => envio.marcarEntregue(new Date('inválida'))).toThrow(/arquivamento/i);
  });

  test('cancelar leva Expedido → Cancelado (terminal)', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);
    envio.registrarRastreio(RASTREIO, DATA_ENVIO);

    envio.cancelar();

    expect(envio.jornada).toBe('Cancelado');
    expect(() => envio.marcarEntregue(new Date(2026, 6, 25))).toThrow(/LG-02/);
    expect(() => envio.registrarRastreio(RASTREIO, DATA_ENVIO)).toThrow(/LG-02/);
  });
});

describe('Envio — independência das máquinas (SPEC-016 RN-04)', () => {
  test('a Jornada avança sem a Revisão confirmada, e vice-versa', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);

    envio.registrarRastreio(RASTREIO, DATA_ENVIO);
    expect(envio.revisao).toBe('AguardandoConfirmacao');
    expect(envio.jornada).toBe('Expedido');

    envio.confirmarEndereco();
    expect(envio.revisao).toBe('Confirmado');
    expect(envio.jornada).toBe('Expedido');
  });
});

describe('Envio — arquivado é somente leitura (SPEC-016 INV-03)', () => {
  test('após Entregue, toda mutação falha barulhento', () => {
    const gas = dominio();
    const envio = envioPadrao(gas);
    envio.registrarRastreio(RASTREIO, DATA_ENVIO);
    envio.marcarEntregue(new Date(2026, 6, 25));

    expect(() => envio.confirmarEndereco()).toThrow(/INV-03/);
    expect(() => envio.registrarRastreio(RASTREIO, DATA_ENVIO)).toThrow(/INV-03/);
    expect(() => envio.cancelar()).toThrow(/INV-03/);
    expect(() => envio.marcarEntregue(new Date(2026, 6, 26))).toThrow(/INV-03/);
  });
});
