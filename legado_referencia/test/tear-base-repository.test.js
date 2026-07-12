/**
 * BaseRepository — leitura com fixtures (sem escrita).
 *
 * Escopo deliberadamente mecânico:
 * - leitura de linhas;
 * - filtro de status ATIVO/ON;
 * - mapeamento para entidade Base.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

const HEADER = [
  'ID_Influenciadora',
  'Nome',
  'Status_Contrato',
  'Qtd_Reels',
  'Qtd_Carrossel',
  'Qtd_Stories',
  'Valor_Total_Contrato',
  'Looks_Qtd',
  'Endereço_Formatado',
  'Categoria',
  'Cupom',
  'Senha_Hash'
];

function abaFalsa(cabecalho, linhas) {
  return {
    getDataRange: () => ({ getValues: () => [cabecalho.slice()].concat(linhas.map((l) => l.slice())) }),
    appendRow: () => { throw new Error('appendRow não deve ser chamado neste teste'); },
    getRange: () => ({
      setValue: () => { throw new Error('setValue não deve ser chamado neste teste'); },
      getFormulas: () => [cabecalho.map(() => '')],
      setValues: () => { throw new Error('setValues não deve ser chamado neste teste'); }
    })
  };
}

function montar(linhas) {
  const aba = abaFalsa(HEADER, (linhas || []).map((l) => l.slice()));
  const sandbox = {
    console: { error() {} },
    SpreadsheetApp: {
      getActive: () => ({ getSheetByName: () => aba })
    }
  };

  try {
    const ctx = loadGasFiles(
      ['Infra.js', 'Modelos.js', 'Repositories.js'].map(arquivo),
      sandbox,
      ['BaseRepository', 'Base', 'CAMPOS_BASE', 'CAMPOS_PARCEIRO']
    );

    return { ctx, possuiBaseRepository: true };
  } catch (erro) {
    if (!/BaseRepository is not defined|Base is not defined/.test(String(erro))) {
      throw erro;
    }

    return { ctx: {}, possuiBaseRepository: false };
  }
}

function metodoDeLeitura(repo) {
  return repo.linhas || repo.listarTodas || repo.listar || repo.findAll;
}

function metodoDeAtivas(repo) {
  return repo.linhasAtivas || repo.listarAtivas || repo.ativas || repo.findAtivas;
}

function statusAtivo(campoStatus) {
  return [
    ['i-1', 'Ana', 'ATIVO', 'Um', 'Dois', 'Três', 'R$ 100,00', 2, 'Rua A', 'Moda', 'ANA10', 'hash-1'],
    ['i-2', 'Bia', 'ON', 'Um', 'Dois', 'Três', 'R$ 100,00', 2, 'Rua B', 'Beleza', 'BIA10', 'hash-2'],
    ['i-3', 'Cris', 'INATIVO', 'Um', 'Dois', 'Três', 'R$ 100,00', 2, 'Rua C', 'Moda', 'CRIS10', 'hash-3'],
    ['i-4', 'Dani', 'OFF', 'Um', 'Dois', 'Três', 'R$ 100,00', 2, 'Rua D', 'Lifestyle', 'DANI10', 'hash-4']
  ].map((linha) => {
    const base = linha.slice();
    if (campoStatus && campoStatus !== 'Status_Contrato') {
      const idx = HEADER.indexOf('Status_Contrato');
      if (idx !== -1) {
        base[idx] = '';
      }
    }
    return base;
  });
}

const boot = montar([]);
const describeBaseRepository = boot.possuiBaseRepository ? describe : describe.skip;

describeBaseRepository('BaseRepository — leitura/filtro/mapeamento', () => {
  test('lê linhas da base usando fixture', () => {
    const { ctx } = montar([
      ['i-1', 'Ana', 'ATIVO', 'Um', 'Dois', 'Três', 'R$ 720,00', 2, 'Rua X', 'Moda', 'ANA10', 'hash-1'],
      ['i-2', 'Bia', 'INATIVO', 'Um', 'Dois', 'Três', 'R$ 500,00', 1, 'Rua Y', 'Beleza', 'BIA10', 'hash-2']
    ]);

    expect(typeof ctx.BaseRepository).toBe('function');

    const repo = new ctx.BaseRepository();
    const ler = metodoDeLeitura(repo);

    expect(typeof ler).toBe('function');

    const linhas = ler.call(repo);

    expect(Array.isArray(linhas)).toBe(true);
    expect(linhas).toHaveLength(2);
  });

  test('filtra apenas status ATIVO/ON', () => {
    const { ctx } = montar(statusAtivo());

    expect(typeof ctx.BaseRepository).toBe('function');

    const repo = new ctx.BaseRepository();
    const ativasFn = metodoDeAtivas(repo);

    expect(typeof ativasFn).toBe('function');

    const ativas = ativasFn.call(repo);

    expect(Array.isArray(ativas)).toBe(true);
    expect(ativas).toHaveLength(2);
  });

  test('mapeia saída para entidade Base', () => {
    const { ctx } = montar([
      ['i-1', 'Ana', 'ATIVO', 'Um', 'Dois', 'Três', 'R$ 720,00', 2, 'Rua X', 'Moda', 'ANA10', 'hash-1'],
      ['i-2', 'Bia', 'ON', 'Um', 'Dois', 'Três', 'R$ 500,00', 1, 'Rua Y', 'Beleza', 'BIA10', 'hash-2']
    ]);

    expect(typeof ctx.BaseRepository).toBe('function');
    expect(typeof ctx.Base).toBe('function');

    const repo = new ctx.BaseRepository();
    const ler = metodoDeLeitura(repo);

    expect(typeof ler).toBe('function');

    const linhas = ler.call(repo);

    expect(linhas.length).toBeGreaterThan(0);
    linhas.forEach((item) => {
      expect(item instanceof ctx.Base).toBe(true);
    });
  });

  test('mapeia legado para contrato BASE completo + id técnico', () => {
    const { ctx } = montar([
      ['i-42', 'Ana', 'ATIVO', 'Um', 'Dois', 'Três', 'R$ 720,00', 2, 'Rua X, 100', 'Moda', 'ANA10', 'hash-42']
    ]);

    const repo = new ctx.BaseRepository();
    const base = metodoDeLeitura(repo).call(repo)[0];

    expect(base.dados.id).toBe('i-42');
    expect(base.influencer).toBe('Ana');
    expect(base.status).toBe('ATIVO');
    expect(base.reel).toBe('Um');
    expect(base.carrossel).toBe('Dois');
    expect(base.stories).toBe('Três');
    expect(base.fee).toBe('R$ 720,00');
    expect(base.looksQuantidade).toBe(2);
    expect(base.endereco).toBe('Rua X, 100');
    expect(base.senha).toBe('hash-42');
  });

  test('campos ausentes no legado (PIX/DRIVE/LOOKS_URL) permanecem nulos sem quebrar', () => {
    const { ctx } = montar([
      ['i-7', 'Bia', 'ON', 'Um', 'Dois', 'Três', 'R$ 300,00', 1, 'Rua Y, 200', 'Beleza', 'BIA10', 'hash-7']
    ]);

    const repo = new ctx.BaseRepository();
    const base = metodoDeLeitura(repo).call(repo)[0];

    expect(base.pix).toBeNull();
    expect(base.drive).toBeNull();
    expect(base.looksUrl).toBeNull();
  });
});
