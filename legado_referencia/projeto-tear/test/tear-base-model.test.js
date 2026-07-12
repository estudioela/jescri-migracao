/**
 * Modelo de domínio BASE (F0.1.3.A). Entidade de leitura pura que representa
 * INTEGRALMENTE o contrato `BASE.csv` (`CAMPOS_BASE`, 14 campos): getters pelo
 * vocabulário do contrato, sem I/O, sem regra de negócio e sem parse/cálculo
 * (valores devolvidos crus). A duplicidade de `LOOKS` no CSV vira duas
 * propriedades distintas — `looksQuantidade` e `looksUrl` — rastreáveis ao
 * rótulo original.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

function montar() {
  return loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js'].map(arquivo),
    { console: { warn() {} } },
    ['Base', 'CAMPOS_BASE']
  );
}

describe('Modelo Base', () => {
  test('construtor lança TypeError sem objeto de dados', () => {
    const { Base } = montar();

    expect(() => new Base()).toThrow(/exige um objeto de dados/);
    expect(() => new Base(null)).toThrow(/exige um objeto de dados/);
    expect(() => new Base('base')).toThrow(/exige um objeto de dados/);
  });

  test('CAMPOS_BASE cobre os 14 campos do contrato na ordem do CSV', () => {
    const { CAMPOS_BASE } = montar();

    expect(Object.values(CAMPOS_BASE)).toEqual([
      'INFLUENCER',
      'CUPOM',
      'STATUS',
      'RAZÃO SOCIAL',
      'PIX',
      'REEL',
      'CARROSSEL',
      'STORIES',
      'FEE',
      'LOOKS (quantidade)',
      'ENDEREÇO',
      'SENHA',
      'DRIVE',
      'LOOKS (URL)'
    ]);
  });

  test('getters devolvem os valores do dicionário pelos nomes de contrato', () => {
    const { Base, CAMPOS_BASE } = montar();

    const base = new Base({
      [CAMPOS_BASE.INFLUENCER]: 'Ana',
      [CAMPOS_BASE.CUPOM]: 'ANA10',
      [CAMPOS_BASE.STATUS]: 'ON',
      [CAMPOS_BASE.RAZAO_SOCIAL]: 'Ana Silva ME',
      [CAMPOS_BASE.PIX]: 'ana@pix.com',
      [CAMPOS_BASE.REEL]: 'Um',
      [CAMPOS_BASE.CARROSSEL]: 'Dois',
      [CAMPOS_BASE.STORIES]: 'Três',
      [CAMPOS_BASE.FEE]: 'R$ 720,00',
      [CAMPOS_BASE.LOOKS_QUANTIDADE]: 'Dois',
      [CAMPOS_BASE.ENDERECO]: 'Rua X, 100',
      [CAMPOS_BASE.SENHA]: 'segredo',
      [CAMPOS_BASE.DRIVE]: 'https://drive/ana',
      [CAMPOS_BASE.LOOKS_URL]: 'https://sheets/ana-looks'
    });

    expect(base.influencer).toBe('Ana');
    expect(base.cupom).toBe('ANA10');
    expect(base.status).toBe('ON');
    expect(base.razaoSocial).toBe('Ana Silva ME');
    expect(base.pix).toBe('ana@pix.com');
    expect(base.reel).toBe('Um');
    expect(base.carrossel).toBe('Dois');
    expect(base.stories).toBe('Três');
    expect(base.fee).toBe('R$ 720,00');
    expect(base.looksQuantidade).toBe('Dois');
    expect(base.endereco).toBe('Rua X, 100');
    expect(base.senha).toBe('segredo');
    expect(base.drive).toBe('https://drive/ana');
    expect(base.looksUrl).toBe('https://sheets/ana-looks');
  });

  test('LOOKS duplicado vira duas propriedades distintas e independentes', () => {
    const { Base, CAMPOS_BASE } = montar();

    const base = new Base({
      [CAMPOS_BASE.LOOKS_QUANTIDADE]: 3,
      [CAMPOS_BASE.LOOKS_URL]: 'https://sheets/looks'
    });

    expect(base.looksQuantidade).toBe(3);
    expect(base.looksUrl).toBe('https://sheets/looks');
    // As duas ocorrências de LOOKS não se sobrepõem no dicionário.
    expect(base.looksQuantidade).not.toBe(base.looksUrl);
  });

  test('valores são devolvidos crus, sem interpretação de domínio', () => {
    const { Base, CAMPOS_BASE } = montar();

    const base = new Base({
      [CAMPOS_BASE.FEE]: 'R$ 720,00',
      [CAMPOS_BASE.REEL]: 'Duas'
    });

    // Prova de não-interpretação: nenhum parse numérico/financeiro no modelo.
    expect(base.fee).toBe('R$ 720,00');
    expect(base.reel).toBe('Duas');
  });

  test('campo ausente resulta em undefined (leitura pura, não quebra)', () => {
    const { Base, CAMPOS_BASE } = montar();

    const base = new Base({ [CAMPOS_BASE.INFLUENCER]: 'Ana' });

    expect(base.influencer).toBe('Ana');
    expect(base.cupom).toBeUndefined();
    expect(base.looksQuantidade).toBeUndefined();
    expect(base.looksUrl).toBeUndefined();
    expect(base.drive).toBeUndefined();
  });
});
