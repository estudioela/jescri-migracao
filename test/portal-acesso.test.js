const { loadGas } = require('./helpers/gasHarness');

// Slice do M8 (SPEC-025): Portal → AcessoController → AcessoPortalService →
// Autenticador/VerificadorDeCredencialLegado (RN-16) + Repositories →
// SessaoACL/BloqueioACL/ParceiraACL sobre fakes de planilha.
// O relógio é o real (relogioDoSistema): expiração é exercitada escrevendo
// EXPIRA_EM no passado direto na aba SESSOES fake.

const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;

// Aba BASE DE DADOS somente-leitura com a projeção do acesso legado.
function fakeBaseDeDados() {
  const rows = [
    ['CUPOM', 'INFLU_KEY', 'INFLUENCIADORA_CNPJ'],
    ['CUPOMMARIA', 'Maria', '12.345.678/0001-90'],
  ];
  return {
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
  };
}

function fakeAbaGravavel(cabecalho) {
  let rows = [cabecalho.slice()];
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    clearContents() {
      rows = [];
    },
    getRange(linha, _coluna, numLinhas, numColunas) {
      return {
        setValues(valores) {
          if (valores.length !== numLinhas || valores[0].length !== numColunas) {
            throw new Error('fake: range incompatível.');
          }
          valores.forEach((v, i) => {
            rows[linha - 1 + i] = v.slice();
          });
        },
      };
    },
  };
}

function fakeSessoesAba() {
  return fakeAbaGravavel(['TOKEN', 'PARCEIRA_ID', 'EXPIRA_EM']);
}

function fakeBloqueiosAba() {
  return fakeAbaGravavel(['IDENTIFICADOR', 'TENTATIVAS', 'BLOQUEIO_INICIO']);
}

function montarPortal(abas) {
  let uuid = 0;
  return loadGas(
    [
      'src/shared/Nucleo.js',
      'src/modulos/Autenticacao.js',
      'src/modulos/Arquivamento.js',
      'src/modulos/Parceira.js',
      'src/entrypoint/Portal.js',
    ],
    {
      PropertiesService: {
        getScriptProperties: () => ({ getProperty: () => 'fake-spreadsheet-id' }),
      },
      SpreadsheetApp: {
        openById: () => ({ getSheetByName: (nome) => abas[nome] || null }),
      },
      Utilities: {
        getUuid: () => 'uuid-' + ++uuid,
      },
      // Trava de exclusão mútua do acesso (multiusuário) — no-op no teste.
      LockService: {
        getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }),
      },
    }
  );
}

function montar() {
  const sessoesAba = fakeSessoesAba();
  const bloqueiosAba = fakeBloqueiosAba();
  const gas = montarPortal({
    'BASE DE DADOS': fakeBaseDeDados(),
    SESSOES: sessoesAba,
    BLOQUEIOS: bloqueiosAba,
  });
  return { gas, sessoesAba, bloqueiosAba };
}

describe('Entrypoint · Portal — slice de Acesso (SPEC-025)', () => {
  test('login válido (RN-16) cria Sessão de 6h e persiste na aba SESSOES (UC-025.01)', () => {
    const { gas, sessoesAba } = montar();
    const antes = Date.now();

    const resposta = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '12345' });

    expect(resposta.success).toBe(true);
    expect(resposta.data.parceiraId).toBe('Maria');
    expect(resposta.data.token).toBe('uuid-1');
    // RN-03: validade 6h a partir do relógio real do sistema.
    const expiraEm = new Date(resposta.data.expiraEm).getTime();
    expect(expiraEm).toBeGreaterThanOrEqual(antes + SEIS_HORAS_MS);
    expect(expiraEm).toBeLessThanOrEqual(Date.now() + SEIS_HORAS_MS);
    // Persistência: linha na aba SESSOES — token opaco, sem CNPJ/PII.
    const linha = sessoesAba._rows.find((l) => l[0] === 'uuid-1');
    expect(linha[1]).toBe('Maria');
    expect(linha[2]).toBe(resposta.data.expiraEm);
  });

  test('5ª falha bloqueia (AC-02, CB-01) e persiste a janela na aba BLOQUEIOS (RN-02)', () => {
    const { gas, bloqueiosAba } = montar();

    // Quatro falhas acumulam sem bloquear (AC-01).
    for (let i = 0; i < 4; i++) {
      const resposta = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '99999' });
      expect(resposta.success).toBe(false);
      expect(resposta.error.codigo).toBe('AC-01');
    }
    // A 5ª atinge o limite e dispara a janela.
    const quinta = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '99999' });

    expect(quinta.success).toBe(false);
    expect(quinta.error.codigo).toBe('AC-02');
    const linha = bloqueiosAba._rows.find((l) => l[0] === 'CUPOMMARIA');
    expect(linha[1]).toBe(5);
    expect(String(linha[2])).not.toBe(''); // BLOQUEIO_INICIO gravado (ISO)
    expect(isNaN(new Date(String(linha[2])).getTime())).toBe(false);
  });

  test('login correto durante a janela é recusado (INV-02, CB-03 → AC-02)', () => {
    const { gas } = montar();
    for (let i = 0; i < 5; i++) {
      gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '99999' });
    }

    const resposta = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '12345' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('AC-02');
  });

  test('renovarSessaoDoPortal desliza a validade a partir da interação (UC-025.02, RN-03)', () => {
    const { gas, sessoesAba } = montar();
    const login = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '12345' });
    const validadeOriginal = new Date(login.data.expiraEm).getTime();
    const antes = Date.now();

    const resposta = gas.renovarSessaoDoPortal({ token: login.data.token });

    expect(resposta.success).toBe(true);
    expect(resposta.data.token).toBe(login.data.token);
    const novaValidade = new Date(resposta.data.expiraEm).getTime();
    expect(novaValidade).toBeGreaterThanOrEqual(validadeOriginal);
    expect(novaValidade).toBeGreaterThanOrEqual(antes + SEIS_HORAS_MS);
    // A validade renovada é persistida na aba.
    const linha = sessoesAba._rows.find((l) => l[0] === login.data.token);
    expect(linha[2]).toBe(resposta.data.expiraEm);
  });

  test('sessão com EXPIRA_EM no passado devolve AC-03 e é removida (CB-02)', () => {
    const { gas, sessoesAba } = montar();
    const login = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '12345' });
    // Simula o vencimento escrevendo EXPIRA_EM no passado direto na aba.
    const linha = sessoesAba._rows.find((l) => l[0] === login.data.token);
    linha[2] = new Date(Date.now() - 1000).toISOString();

    const resposta = gas.renovarSessaoDoPortal({ token: login.data.token });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('AC-03');
    expect(sessoesAba._rows.find((l) => l[0] === login.data.token)).toBeUndefined();
  });

  test('token desconhecido devolve AC-03 (reautenticar)', () => {
    const { gas } = montar();

    const resposta = gas.renovarSessaoDoPortal({ token: 'token-fantasma' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('AC-03');
  });

  test('sairDoPortal remove a Sessão da aba SESSOES (logout §9, idempotente)', () => {
    const { gas, sessoesAba } = montar();
    const login = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '12345' });

    const resposta = gas.sairDoPortal({ token: login.data.token });

    expect(resposta.success).toBe(true);
    expect(sessoesAba._rows.find((l) => l[0] === login.data.token)).toBeUndefined();
    // Renovar após logout exige reautenticação (AC-03).
    const renovacao = gas.renovarSessaoDoPortal({ token: login.data.token });
    expect(renovacao.error.codigo).toBe('AC-03');
  });
});
