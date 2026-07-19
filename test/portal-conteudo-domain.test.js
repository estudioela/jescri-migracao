const { loadGas } = require('./helpers/gasHarness');

function montar() {
  return loadGas([
    'src/modulos/ColaboracaoMensal.js',
    'src/modulos/Entrega.js',
    'src/modulos/Briefing.js',
    'src/modulos/PortalConteudo.js',
  ]);
}

describe('ItemDePendencia.de (SPEC-027 §6.1)', () => {
  test('projeta Entrega + bloco correspondente do Briefing', () => {
    const gas = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    const entrega = new gas.Entrega('Maria', mesReferencia, 'Reels');
    const bloco = new gas.BlocoDeFormato('Reels');
    bloco.preencher({
      look: 'Look 12',
      dataEntrega: new Date('2026-07-10'),
      dataPostagem: new Date('2026-07-22'),
    });

    const item = gas.ItemDePendencia.de(entrega, bloco);

    expect(item.entregaId).toBe(entrega.id.toString());
    expect(item.rotulo).toBe('Reels');
    expect(item.estado).toBe('AguardandoMaterial');
    expect(item.briefing).toEqual({
      look: 'Look 12',
      dataEntrega: new Date('2026-07-10'),
      dataPostagem: new Date('2026-07-22'),
    });
  });

  test('projeta briefing null quando não há bloco correspondente', () => {
    const gas = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    const entrega = new gas.Entrega('Maria', mesReferencia, 'Reels');

    const item = gas.ItemDePendencia.de(entrega, null);

    expect(item.briefing).toBeNull();
  });

  test('reflete o estado atual da Entrega (ex.: após enviar material)', () => {
    const gas = montar();
    const mesReferencia = gas.MesReferencia.deTexto('2026-07');
    const entrega = new gas.Entrega('Maria', mesReferencia, 'Reels');
    entrega.enviarMaterial('https://drive/arquivo');

    const item = gas.ItemDePendencia.de(entrega, null);

    expect(item.estado).toBe('EmRevisao');
  });
});
