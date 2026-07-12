/**
 * Automação de pastas no Drive (TURBO). DriveApp é MOCKADO. Cobre o comportamento
 * principal + o fail-safe crítico (nada trava o fluxo se o Drive falhar):
 *  - ParceiroService.salvar cria `[TEAR] {Nome}` e grava a URL na coluna DRIVE;
 *  - CicloService.provisionarPastaMensal cria a subpasta do mês na pasta raiz;
 *  - erro/ausência de DriveApp → sem pasta, sem lançar.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

function montar(sandboxExtra) {
  return loadGasFiles(
    ['Infra.js', 'Modelos.js', 'Repositories.js', 'Services.js'].map(arquivo),
    Object.assign({ console: { warn() {} } }, sandboxExtra || {}),
    ['ParceiroService', 'CicloService', 'DriveService']
  );
}

// Repositório de parceira mínimo: sem senha/pasta ainda; registra a escrita.
function parceiroRepoFake() {
  const escritas = [];
  return {
    escritas,
    upsert: () => ({ chave: 'INF1', criado: true }),
    buscarPorCampo: () => null,
    getById: () => null,
    definirSenhaHashPorChave: () => {},
    definirCampoPorChave: (colChave, valChave, coluna, valor) => escritas.push({ coluna, valor })
  };
}

// CADASTROS vazio → sem CNPJ (a senha não interfere neste teste).
const cadastroRepoFake = { linhas: () => [] };

describe('Automação de pastas no Drive', () => {
  test('salvar cria [TEAR] {Nome} e grava a URL na coluna DRIVE', () => {
    const ctx = montar();
    const criadas = [];
    const driveApp = {
      createFolder: (nome) => {
        criadas.push(nome);
        return { getUrl: () => 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz01234' };
      }
    };

    const repo = parceiroRepoFake();
    const service = new ctx.ParceiroService(repo, cadastroRepoFake, new ctx.DriveService(driveApp));

    const resultado = service.salvar({
      INFLU_KEY: 'INF1', INFLUENCIADORA_RAZAO_SOCIAL: 'Fulana Silva', CUPOM: 'FULANA10'
    });

    expect(criadas).toEqual(['[TEAR] Fulana Silva']);
    expect(resultado.pastaProvisionada).toBe(true);
    expect(repo.escritas).toContainEqual({ coluna: 'DRIVE', valor: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz01234' });
  });

  test('fail-safe: erro no Drive não derruba o salvamento da parceira', () => {
    const ctx = montar();
    const driveApp = { createFolder: () => { throw new Error('sem permissão'); } };

    const repo = parceiroRepoFake();
    const service = new ctx.ParceiroService(repo, cadastroRepoFake, new ctx.DriveService(driveApp));

    const resultado = service.salvar({
      INFLU_KEY: 'INF1', INFLUENCIADORA_RAZAO_SOCIAL: 'Fulana Silva', CUPOM: 'FULANA10'
    });

    expect(resultado.criado).toBe(true);            // parceira salva
    expect(resultado.pastaProvisionada).toBe(false); // pasta engolida
    expect(repo.escritas).toHaveLength(0);           // nada gravado em DRIVE
  });

  test('gerarCicloMensal registra o ciclo e provisiona a subpasta do mês por parceira ativa', () => {
    const ctx = montar();

    const ciclosCriados = [];
    const cicloRepo = {
      listarTodos: () => [],
      criar: (dados) => { ciclosCriados.push(dados); return { chave: dados.ID_Ciclo, criado: true }; }
    };

    const escritas = [];
    const parceiroRepo = {
      listarTodas: () => [
        { INFLU_KEY: 'INF1', DRIVE: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz01234' },
        { INFLU_KEY: 'INF2', DRIVE: '' } // sem pasta raiz → ignorada, não derruba as demais
      ],
      definirCampoPorChave: (colChave, valChave, coluna, valor) => escritas.push({ valChave, coluna, valor })
    };

    const raiz = {
      getFoldersByName: () => ({ hasNext: () => false }),
      createFolder: (nome) => ({ getUrl: () => 'https://drive.google.com/drive/folders/SUB-' + nome })
    };
    const driveApp = { getFolderById: () => raiz };

    const service = new ctx.CicloService(cicloRepo, new ctx.DriveService(driveApp), parceiroRepo);
    const resultado = service.gerarCicloMensal(new Date(2026, 6, 15)); // Julho/2026

    expect(resultado.nomeCiclo).toBe('Julho 2026');
    expect(resultado.idCiclo).toBe('2026-07');
    expect(resultado.cicloCriado).toBe(true);
    expect(ciclosCriados).toContainEqual({ ID_Ciclo: '2026-07', Nome_Ciclo: 'Julho 2026' });
    // Só INF1 tinha pasta raiz: uma subpasta provisionada e persistida.
    expect(resultado.pastasProvisionadas).toBe(1);
    expect(escritas).toContainEqual({
      valChave: 'INF1', coluna: 'DRIVE_CICLO', valor: 'https://drive.google.com/drive/folders/SUB-Julho 2026'
    });
  });

  test('CicloService.provisionarPastaMensal cria a subpasta do mês na pasta raiz', () => {
    const ctx = montar();
    let subCriada = '';
    const raiz = {
      getFoldersByName: () => ({ hasNext: () => false }),
      createFolder: (nome) => { subCriada = nome; return { getUrl: () => 'https://drive.google.com/drive/folders/SUB456' }; }
    };
    const driveApp = { getFolderById: () => raiz };

    const service = new ctx.CicloService({ listarTodos: () => [] }, new ctx.DriveService(driveApp));
    const url = service.provisionarPastaMensal('https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz01234', 'Julho 2026');

    expect(subCriada).toBe('Julho 2026');
    expect(url).toBe('https://drive.google.com/drive/folders/SUB456');
  });
});
