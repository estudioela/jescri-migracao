const { loadGas } = require('./helpers/gasHarness');

// Portas novas de ParceiraACL para a vinculação de identidade (SPEC-035
// §5.1-A/§10.2.4): buscarCandidataPorEmail (leitura, para propor a
// vinculação — nunca associa automaticamente, RN-02), vincularSubProvider
// (escrita célula-a-célula, mesmo padrão de atualizarPerfil) e
// obterPorSubProvider (leitura, para o login resolver INFLU_KEY a partir
// do SUB_PROVIDER já vinculado, §11.2).

function fakeSheet(cabecalho, linhas) {
  const rows = [cabecalho.slice()].concat((linhas || []).map((l) => l.slice()));
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    appendRow: (arr) => rows.push(arr.slice()),
    getRange: (linha, coluna) => ({
      setValue: (v) => {
        rows[linha - 1][coluna - 1] = v;
      },
    }),
  };
}

function novaAcl(sheet) {
  const gas = loadGas([, 'src/modulos/Parceira.js']);
  return { gas, acl: new gas.ParceiraACL(sheet) };
}

const CABECALHO = ['INFLU_KEY', 'STATUS', 'EMAIL', 'SUB_PROVIDER'];

describe('ParceiraACL — vinculação de identidade (SPEC-035 §5.1-A/§10.2.4)', () => {
  test('buscarCandidataPorEmail localiza a Parceira por e-mail (case/espaço-insensível)', () => {
    const { acl } = novaAcl(
      fakeSheet(CABECALHO, [['maria-silva', 'ON', 'Maria@Exemplo.com', '']])
    );

    expect(acl.buscarCandidataPorEmail(' maria@exemplo.com ')).toEqual({
      parceiraId: 'maria-silva',
    });
  });

  test('buscarCandidataPorEmail sem correspondência devolve null', () => {
    const { acl } = novaAcl(fakeSheet(CABECALHO, [['maria-silva', 'ON', 'maria@exemplo.com', '']]));

    expect(acl.buscarCandidataPorEmail('ninguem@exemplo.com')).toBeNull();
  });

  test('buscarCandidataPorEmail ignora Parceira já vinculada a outro SUB_PROVIDER', () => {
    const { acl } = novaAcl(
      fakeSheet(CABECALHO, [['maria-silva', 'ON', 'maria@exemplo.com', 'sub-existente']])
    );

    expect(acl.buscarCandidataPorEmail('maria@exemplo.com')).toBeNull();
  });

  test('vincularSubProvider grava a coluna na linha existente, preservando as demais', () => {
    const sheet = fakeSheet(CABECALHO, [['maria-silva', 'ON', 'maria@exemplo.com', '']]);
    const { acl } = novaAcl(sheet);

    acl.vincularSubProvider('maria-silva', 'sub-123');

    expect(sheet._rows[1]).toEqual(['maria-silva', 'ON', 'maria@exemplo.com', 'sub-123']);
  });

  test('vincularSubProvider em Parceira inexistente lança Error', () => {
    const { acl } = novaAcl(fakeSheet(CABECALHO, []));

    expect(() => acl.vincularSubProvider('nao-existe', 'sub-123')).toThrow(/não encontrada/);
  });

  test('obterPorSubProvider resolve INFLU_KEY a partir do SUB_PROVIDER vinculado (§11.2)', () => {
    const { acl } = novaAcl(
      fakeSheet(CABECALHO, [['maria-silva', 'ON', 'maria@exemplo.com', 'sub-123']])
    );

    expect(acl.obterPorSubProvider('sub-123')).toEqual({ parceiraId: 'maria-silva' });
    expect(acl.obterPorSubProvider('sub-inexistente')).toBeNull();
  });
});
