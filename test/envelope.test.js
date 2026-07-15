/**
 * Prova a fundação: o envelope padrão (§3.3) carregado como código GAS
 * via o harness vm. Este é o teste "verde" de saída do Sprint 0 — valida
 * o harness E o contrato de resposta, sem nenhuma feature de negócio.
 */
const { loadGas } = require('./helpers/gasHarness');

const gas = loadGas(['src/shared/Envelope.js']);

describe('Envelope (contrato §3.3) via harness GAS/vm', () => {
  test('envelopeOk envolve o payload em {success:true, data}', () => {
    expect(gas.envelopeOk({ id: 1 })).toEqual({ success: true, data: { id: 1 } });
  });

  test('envelopeOk sem argumento retorna data vazio', () => {
    expect(gas.envelopeOk()).toEqual({ success: true, data: {} });
  });

  test('envelopeFail envolve o erro em {success:false, error}', () => {
    expect(gas.envelopeFail({ code: 'X' })).toEqual({ success: false, error: { code: 'X' } });
  });

  test('sucesso e falha são mutuamente exclusivos', () => {
    const ok = gas.envelopeOk({});
    const fail = gas.envelopeFail({});
    expect(ok.success).toBe(true);
    expect(ok).not.toHaveProperty('error');
    expect(fail.success).toBe(false);
    expect(fail).not.toHaveProperty('data');
  });
});
