const { loadGas } = require('./helpers/gasHarness');

// Slice ponta a ponta do M8 · Perfil no Portal da Parceira (SPEC-032), no
// mesmo molde de test/portal-conteudo.test.js (SPEC-027): login real via
// AcessoPortalService + adaptador de credencial legado, depois as duas
// funções do Portal (`verPerfilDoPortal`/`editarPerfilDoPortal`), tudo sobre
// a pilha real de fakes de planilha.
//
// O adaptador de CEP vive em src/modulos/Parceira.js desde a ADR-014 —
// hoje é AdaptadorDeCepBrasilApi (BrasilAPI), então o fake de
// UrlFetchApp.fetch devolve getResponseCode()/getContentText() no formato
// dessa API (street/neighborhood/city/state); falha = fetch lança.

// Aba BASE DE DADOS: colunas do Cadastro (compilarMes) + do acesso legado
// (CUPOM/INFLUENCIADORA_CNPJ, RN-16) + campos de perfil (SPEC-032).
function fakeBaseDeDados() {
  const cabecalho = [
    'INFLU_KEY',
    'STATUS',
    'CHAVE_PIX',
    'EMAIL',
    'CEP',
    'NUMERO',
    'COMPLEMENTO',
    'RUA',
    'BAIRRO',
    'CIDADE',
    'UF',
    'INFLUENCIADORA_ENDERECO',
    'VALOR_TOTAL',
    'REELS_TEXTO',
    'CARROSSEL_TEXTO',
    'STORIES_TEXTO',
    'LOOKS_QTD',
    'CUPOM',
    'INFLUENCIADORA_CNPJ',
  ];
  const rows = [
    cabecalho.slice(),
    [
      'Maria',
      'ON',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      3500,
      '1',
      '',
      '2',
      '',
      'CUPOMMARIA',
      '12.345.678/0001-90',
    ],
  ];
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    appendRow: (arr) => rows.push(arr.slice()),
    // Extensão sobre o fake mínimo de test/parceira-acl.test.js: escrita de
    // uma célula, para a ACL persistir a edição de perfil (UC-032.02) sem
    // reescrever a linha inteira. `linha`/`coluna` 1-based, mesma convenção
    // de getDataRange().getValues() (linha 1 = cabeçalho).
    getRange: (linha, coluna) => ({
      setValue: (v) => {
        rows[linha - 1][coluna - 1] = v;
      },
    }),
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

function fakeColaboracoes() {
  return fakeAbaGravavel([
    'INFLU_KEY',
    'MES_REFERENCIA',
    'ANO_REFERENCIA',
    'ESTADO',
    'SNAPSHOT_VALOR',
    'SNAPSHOT_FORMATOS',
    'SNAPSHOT_QTD_POR_FORMATO',
  ]);
}

function fakeBriefingAba() {
  return fakeAbaGravavel([
    'INFLU_KEY',
    'MES_REFERENCIA',
    'ANO_REFERENCIA',
    'ESTADO',
    'BLOCO_ROTULO',
    'LOOK',
    'DATA_ENTREGA',
    'DATA_POSTAGEM',
    'ORIENTACAO',
    'DATA_APROVACAO_INTERNA',
  ]);
}

function fakeEntregasAba() {
  return fakeAbaGravavel([
    'INFLU_KEY',
    'ANO_REFERENCIA',
    'MES_REFERENCIA',
    'ROTULO',
    'ESTADO',
    'LINK_MATERIAL',
    'DATA_APROVACAO_INTERNA',
    'DATA_ARQUIVAMENTO',
  ]);
}

function fakeEnviosAba() {
  return fakeAbaGravavel([
    'INFLU_KEY',
    'ANO_REFERENCIA',
    'MES_REFERENCIA',
    'STATUS_REVISAO',
    'STATUS_LOGISTICA',
    'RASTREIO',
    'DATA_ENVIO',
    'DATA_ARQUIVAMENTO',
  ]);
}

function fakeSessoesAba() {
  return fakeAbaGravavel(['TOKEN', 'PARCEIRA_ID', 'EXPIRA_EM']);
}

function fakeBloqueiosAba() {
  return fakeAbaGravavel(['IDENTIFICADOR', 'TENTATIVAS', 'BLOQUEIO_INICIO']);
}

function montarPortal(abas) {
  let uuid = 0;
  let cepDeveFalhar = false;
  let cepResposta = {
    street: 'Avenida Paulista',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  };

  const gas = loadGas(
    [
      'src/shared/Nucleo.js',
      'src/modulos/Parceira.js',
      'src/modulos/ColaboracaoMensal.js',
      'src/modulos/Briefing.js',
      'src/modulos/Entrega.js',
      'src/modulos/Envio.js',
      'src/modulos/Autenticacao.js',
      'src/modulos/Arquivamento.js',
      'src/modulos/PortalConteudo.js',
      'src/modulos/Perfil.js',
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
      LockService: {
        getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }),
      },
      // Porta de rede para o adaptador de CEP (RN-02: falha degradável).
      UrlFetchApp: {
        fetch: () => {
          if (cepDeveFalhar) {
            throw new Error('Falha de rede ao consultar CEP (fake).');
          }
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify(cepResposta),
          };
        },
      },
    }
  );

  return {
    gas: gas,
    setCepFalha: (v) => {
      cepDeveFalhar = v;
    },
    setCepResposta: (resposta) => {
      cepResposta = resposta;
    },
  };
}

function portalPronto() {
  const { gas, setCepFalha, setCepResposta } = montarPortal({
    'BASE DE DADOS': fakeBaseDeDados(),
    COLABORACOES: fakeColaboracoes(),
    BRIEFING: fakeBriefingAba(),
    ENTREGAS: fakeEntregasAba(),
    ENVIOS: fakeEnviosAba(),
    SESSOES: fakeSessoesAba(),
    BLOQUEIOS: fakeBloqueiosAba(),
  });
  const login = gas.entrarNoPortal({ identificador: 'CUPOMMARIA', segredo: '12345' });
  expect(login.success).toBe(true);
  return { gas, token: login.data.token, setCepFalha, setCepResposta };
}

describe('Entrypoint · Portal — slice do Perfil (SPEC-032)', () => {
  test('verPerfilDoPortal: perfil vazio inicialmente (UC-032.01)', () => {
    const { gas, token } = portalPronto();

    const resposta = gas.verPerfilDoPortal({ token: token });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual({ email: null, pix: null, endereco: null });
  });

  test('editarPerfilDoPortal: edita PIX e email (UC-032.02)', () => {
    const { gas, token } = portalPronto();

    const edicao = gas.editarPerfilDoPortal({
      token: token,
      pix: 'chave-pix-maria',
      email: 'maria@exemplo.com',
    });

    expect(edicao.success).toBe(true);
    expect(edicao.data.pix).toBe('chave-pix-maria');
    expect(edicao.data.email).toBe('maria@exemplo.com');
    expect(edicao.data.endereco).toBeNull();

    // Persistência real: uma nova leitura reflete o valor gravado.
    const leitura = gas.verPerfilDoPortal({ token: token });
    expect(leitura.data.pix).toBe('chave-pix-maria');
    expect(leitura.data.email).toBe('maria@exemplo.com');
  });

  test('editarPerfilDoPortal: CEP resolvido com sucesso recompõe o endereço (RN-01)', () => {
    const { gas, token } = portalPronto();

    const edicao = gas.editarPerfilDoPortal({
      token: token,
      cep: '01310-100',
      numero: '1000',
    });

    expect(edicao.success).toBe(true);
    expect(edicao.data.endereco).toEqual({
      cep: '01310-100',
      numero: '1000',
      complemento: '',
      rua: 'Avenida Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
      completo: true,
    });
  });

  test('editarPerfilDoPortal: CEP com falha na resolução salva mesmo assim, endereço incompleto (CB-01/RN-02)', () => {
    const { gas, token, setCepFalha } = portalPronto();
    setCepFalha(true);

    const edicao = gas.editarPerfilDoPortal({
      token: token,
      cep: '99999-999',
      numero: '10',
    });

    expect(edicao.success).toBe(true);
    expect(edicao.data.endereco.cep).toBe('99999-999');
    expect(edicao.data.endereco.numero).toBe('10');
    expect(edicao.data.endereco.rua).toBe('');
    expect(edicao.data.endereco.bairro).toBe('');
    expect(edicao.data.endereco.cidade).toBe('');
    expect(edicao.data.endereco.uf).toBe('');

    // Persistência real, mesmo com endereço incompleto.
    const leitura = gas.verPerfilDoPortal({ token: token });
    expect(leitura.data.endereco.cep).toBe('99999-999');
  });

  test('editarPerfilDoPortal: campo não permitido é recusado (PP-02)', () => {
    const { gas, token } = portalPronto();

    const resposta = gas.editarPerfilDoPortal({ token: token, outraCoisa: 'x' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('PP-02');
  });

  test('sessão inválida é recusada em qualquer ação (PP-01)', () => {
    const { gas } = portalPronto();

    const ver = gas.verPerfilDoPortal({ token: 'token-fantasma' });
    expect(ver.success).toBe(false);
    expect(ver.error.codigo).toBe('PP-01');

    const editar = gas.editarPerfilDoPortal({ token: 'token-fantasma', pix: 'x' });
    expect(editar.success).toBe(false);
    expect(editar.error.codigo).toBe('PP-01');
  });
});
