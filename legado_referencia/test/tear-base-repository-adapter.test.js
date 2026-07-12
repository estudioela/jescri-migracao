/**
 * BaseRepository — Adapter/ACL (F0.1.4.A/B). Valida a tradução da aba física
 * legada `Parceiros_Influenciadoras` para o contrato de domínio BASE:
 * De-Para dos campos com origem física, campos sem origem em `null`,
 * `LOOKS` duplicado mantido separado e ausência de erro em coluna inexistente.
 * A entidade `Base` permanece fiel ao contrato — toda tradução vive no adapter.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

const HEADER = [
  'ID_Influenciadora',
  'Nome',
  'Status_Contrato',
  'Categoria',
  'Cupom',
  'Senha_Hash',
  'Qtd_Reels',
  'Qtd_Carrossel',
  'Qtd_Stories',
  'Valor_Total_Contrato',
  'Looks_Qtd',
  'Endereço_Formatado'
];

// Linha coerente com HEADER, com valores crus (sem parse no domínio).
const LINHA_ANA = [
  'i-1', 'Ana', 'ATIVO', 'Moda', 'ANA10', 'hash-ana',
  'Dois', 'Um', 'Três', 'R$ 720,00', '2', 'Rua X, 100 - SP'
];

function abaFalsa(cabecalho, linhas) {
  return {
    getDataRange: () => ({
      getValues: () => [cabecalho.slice()].concat(linhas.map((l) => l.slice()))
    })
  };
}

function montar(cabecalho, linhas) {
  const aba = abaFalsa(cabecalho, (linhas || []).map((l) => l.slice()));
  const sandbox = {
    console: { error() {}, warn() {} },
    SpreadsheetApp: { getActive: () => ({ getSheetByName: () => aba }) }
  };

  return loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js'].map(arquivo),
    sandbox,
    ['BaseRepository', 'Base', 'CAMPOS_BASE', 'CAMPOS_PARCEIRO']
  );
}

describe('BaseRepository — adapter físico → contrato BASE', () => {
  test('leitura retorna instâncias de Base', () => {
    const { BaseRepository, Base } = montar(HEADER, [LINHA_ANA]);

    const bases = new BaseRepository().listar();

    expect(bases).toHaveLength(1);
    expect(bases[0]).toBeInstanceOf(Base);
  });

  test('campos com origem física são mapeados (De-Para completo)', () => {
    const { BaseRepository } = montar(HEADER, [LINHA_ANA]);

    const [base] = new BaseRepository().listar();

    expect(base.influencer).toBe('Ana');            // Nome → INFLUENCER
    expect(base.cupom).toBe('ANA10');                // Cupom → CUPOM
    expect(base.status).toBe('ATIVO');               // Status_Contrato → STATUS
    expect(base.reel).toBe('Dois');                  // Qtd_Reels → REEL
    expect(base.carrossel).toBe('Um');               // Qtd_Carrossel → CARROSSEL
    expect(base.stories).toBe('Três');               // Qtd_Stories → STORIES
    expect(base.fee).toBe('R$ 720,00');              // Valor_Total_Contrato → FEE
    expect(base.looksQuantidade).toBe('2');          // Looks_Qtd → LOOKS (quantidade)
    expect(base.endereco).toBe('Rua X, 100 - SP');   // Endereço_Formatado → ENDEREÇO
    expect(base.senha).toBe('hash-ana');             // Senha_Hash → SENHA
  });

  test('campos sem origem física permanecem null (nada inventado)', () => {
    const { BaseRepository } = montar(HEADER, [LINHA_ANA]);

    const [base] = new BaseRepository().listar();

    // Guardrail: Nome não vira RAZÃO SOCIAL.
    expect(base.razaoSocial).toBeNull();
    expect(base.pix).toBeNull();
    expect(base.drive).toBeNull();
    expect(base.looksUrl).toBeNull();
  });

  test('LOOKS duplicado continua separado (quantidade mapeada, URL nula)', () => {
    const { BaseRepository } = montar(HEADER, [LINHA_ANA]);

    const [base] = new BaseRepository().listar();

    expect(base.looksQuantidade).toBe('2');
    expect(base.looksUrl).toBeNull();
    // Duas propriedades distintas do contrato, não uma sobrepondo a outra.
    expect(Object.prototype.hasOwnProperty.call(base.dados, 'LOOKS (quantidade)')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(base.dados, 'LOOKS (URL)')).toBe(true);
  });

  test('listarAtivas filtra apenas ATIVO/ON', () => {
    const linha = (id, nome, status, cupom) => [
      id, nome, status, 'Moda', cupom, '', '', '', '', '', '', ''
    ];
    const { BaseRepository } = montar(HEADER, [
      linha('i-1', 'Ana', 'ATIVO', 'ANA10'),
      linha('i-2', 'Bia', 'ON', 'BIA10'),
      linha('i-3', 'Cris', 'INATIVO', 'CRIS10'),
      linha('i-4', 'Dani', 'OFF', 'DANI10')
    ]);

    const ativas = new BaseRepository().listarAtivas();

    expect(ativas).toHaveLength(2);
    expect(ativas.map((b) => b.influencer).sort()).toEqual(['Ana', 'Bia']);
  });

  test('nenhum erro ocorre com coluna física inexistente', () => {
    // Cabeçalho mínimo: faltam Status/Senha/Qtd_*/Valor/Looks/Endereço.
    const cabecalhoReduzido = ['ID_Influenciadora', 'Nome', 'Cupom'];
    const { BaseRepository } = montar(cabecalhoReduzido, [['i-1', 'Ana', 'ANA10']]);

    const repo = new BaseRepository();

    expect(() => repo.listar()).not.toThrow();
    expect(() => repo.listarAtivas()).not.toThrow();

    const [base] = repo.listar();
    expect(base.influencer).toBe('Ana');
    expect(base.cupom).toBe('ANA10');
    // Colunas ausentes → null, sem erro.
    expect(base.status).toBeNull();
    expect(base.reel).toBeNull();
    expect(base.fee).toBeNull();
    expect(base.senha).toBeNull();
    // Status ausente não conta como ativo.
    expect(repo.listarAtivas()).toHaveLength(0);
  });

  test('linhas em branco são descartadas (sem registro fantasma)', () => {
    const branca = HEADER.map(() => '');
    const { BaseRepository } = montar(HEADER, [LINHA_ANA, branca]);

    expect(new BaseRepository().listar()).toHaveLength(1);
  });
});
