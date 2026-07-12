/**
 * Fluxo crítico #2 (prioridade do usuário): ENVIO DE MATERIAIS.
 * Cobre iniciarEnvioResumable(), finalizarEnvioResumable() e
 * encontrarLinhaAtivacaoPorId() — mae/WebApp.js — já teve 2 incidentes reais
 * documentados (404 por uploadUrl ausente; "Failed to fetch" por violação de
 * validação de dados em STATUS_CONTEUDO). Ver FLOW.md "FLOW: Envio de
 * material", SYSTEM_MAP.md achado crítico #2.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const {
  criarCacheServiceFake,
  criarLockServiceFake,
  criarUtilitiesFake,
  criarLoggerFake,
  criarAbaFake,
  criarSpreadsheetAppFake,
  criarDriveAppFake,
  criarRespostaHttpFake,
  criarUrlFetchAppFake,
  criarPropertiesServiceFake,
  criarScriptAppFake
} = require('./helpers/gasServiceMocks');
const { HEADER_BASE, linhaBase, INFLUENCIADORA_PADRAO, HEADER_ATIVACOES, linhaAtivacao } = require('./helpers/fixtures');

const WEBAPP_PATH = path.join(__dirname, '..', 'mae', 'WebApp.js');
const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

// No projeto Apps Script real, WebApp.js chama getHeaderMap() (definida em
// Código.js) porque todos os arquivos do projeto compartilham um único
// namespace global — os dois arquivos precisam ser carregados no mesmo
// sandbox para reproduzir isso fielmente.
function carregarProjeto(sandbox) {
  return loadGasFiles([CODIGO_PATH, WEBAPP_PATH], sandbox);
}

function montarAmbienteEnvio({ ativacoes, respostaUrlFetch, propsIniciais }) {
  const abaBase = criarAbaFake([HEADER_BASE, linhaBase(INFLUENCIADORA_PADRAO)]);
  const abaAtivacoes = criarAbaFake([HEADER_ATIVACOES, ...ativacoes.map(linhaAtivacao)]);
  const spreadsheetAppFake = criarSpreadsheetAppFake({
    'BASE DE DADOS': abaBase,
    'ATIVAÇÕES': abaAtivacoes
  });
  const cacheFake = criarCacheServiceFake();
  const { driveAppFake } = criarDriveAppFake('raiz-drive-teste');
  const propsFake = criarPropertiesServiceFake({ PASTA_RAIZ_ENTREGAS: 'raiz-drive-teste', ...propsIniciais });
  const respostaPadrao = () => criarRespostaHttpFake({ code: 200, headers: { Location: 'https://upload.example/sessao-1' } });

  const sandbox = {
    SpreadsheetApp: spreadsheetAppFake,
    CacheService: cacheFake,
    LockService: criarLockServiceFake(),
    Utilities: criarUtilitiesFake(),
    Logger: criarLoggerFake(),
    DriveApp: driveAppFake,
    PropertiesService: propsFake,
    ScriptApp: criarScriptAppFake(),
    UrlFetchApp: criarUrlFetchAppFake(respostaUrlFetch || respostaPadrao)
  };
  const modulo = carregarProjeto(sandbox);
  const token = modulo.login('MARIA10', '12345').token;
  return { modulo, token, abaAtivacoes, propsStore: propsFake._store };
}

describe('WebApp.js — iniciarEnvioResumable + finalizarEnvioResumable (fluxo feliz)', () => {
  test('envio completo: inicia upload, finaliza, grava link e status "ajustes"', () => {
    const { modulo, token, abaAtivacoes } = montarAmbienteEnvio({
      ativacoes: [{ id: 'ativ-001' }]
    });

    const iniciarRes = modulo.iniciarEnvioResumable(token, 'ativ-001', 'foto.jpg', 'image/jpeg', 12345);
    expect(iniciarRes).toEqual({ ok: true, uploadUrl: 'https://upload.example/sessao-1' });

    const finalizarRes = modulo.finalizarEnvioResumable(token, 'ativ-001', 'file-id-123');
    expect(finalizarRes.ok).toBe(true);
    expect(finalizarRes.link).toBe('https://drive.google.com/file/d/file-id-123/view');

    const linhaGravada = abaAtivacoes._linhas[1];
    expect(linhaGravada[HEADER_ATIVACOES.indexOf('STATUS_CONTEUDO')]).toBe('ajustes');
    expect(linhaGravada[HEADER_ATIVACOES.indexOf('LINK_ARQUIVO')]).toBe('https://drive.google.com/file/d/file-id-123/view');
  });

  test('múltiplos envios para a mesma ativação concatenam o link com quebra de linha', () => {
    const { modulo, token, abaAtivacoes } = montarAmbienteEnvio({ ativacoes: [{ id: 'ativ-001' }] });
    modulo.finalizarEnvioResumable(token, 'ativ-001', 'arquivo-1');
    modulo.finalizarEnvioResumable(token, 'ativ-001', 'arquivo-2');

    const linhaGravada = abaAtivacoes._linhas[1];
    expect(linhaGravada[HEADER_ATIVACOES.indexOf('LINK_ARQUIVO')]).toBe(
      'https://drive.google.com/file/d/arquivo-1/view\nhttps://drive.google.com/file/d/arquivo-2/view'
    );
  });

  test('pasta da influenciadora é criada uma vez e reaproveitada em envios seguintes', () => {
    const { modulo, token, propsStore } = montarAmbienteEnvio({
      ativacoes: [{ id: 'ativ-001', formato: 'REEL' }, { id: 'ativ-002', formato: 'CARROSSEL' }]
    });
    modulo.iniciarEnvioResumable(token, 'ativ-001', 'foto.jpg', 'image/jpeg', 100);
    const idPastaAposPrimeiro = propsStore.get('PASTA_DRIVE_MARIA10');
    expect(idPastaAposPrimeiro).toBeTruthy();

    modulo.iniciarEnvioResumable(token, 'ativ-002', 'video.mp4', 'video/mp4', 200);
    expect(propsStore.get('PASTA_DRIVE_MARIA10')).toBe(idPastaAposPrimeiro); // não recriou a pasta
  });
});

describe('WebApp.js — iniciarEnvioResumable/finalizarEnvioResumable — controle de acesso e erros', () => {
  test('token inválido → SESSAO_EXPIRADA em ambas as funções', () => {
    const { modulo } = montarAmbienteEnvio({ ativacoes: [{ id: 'ativ-001' }] });
    expect(modulo.iniciarEnvioResumable('token-invalido', 'ativ-001', 'a.jpg', 'image/jpeg', 1)).toEqual({ ok: false, erro: 'SESSAO_EXPIRADA' });
    expect(modulo.finalizarEnvioResumable('token-invalido', 'ativ-001', 'file-x')).toEqual({ ok: false, erro: 'SESSAO_EXPIRADA' });
  });

  test('idAtivacao inexistente → ATIVACAO_NAO_ENCONTRADA', () => {
    const { modulo, token } = montarAmbienteEnvio({ ativacoes: [{ id: 'ativ-001' }] });
    expect(modulo.iniciarEnvioResumable(token, 'nao-existe', 'a.jpg', 'image/jpeg', 1)).toEqual({ ok: false, erro: 'ATIVACAO_NAO_ENCONTRADA' });
    expect(modulo.finalizarEnvioResumable(token, 'nao-existe', 'file-x')).toEqual({ ok: false, erro: 'ATIVACAO_NAO_ENCONTRADA' });
  });

  test('ativação de outra influenciadora → ACESSO_NEGADO', () => {
    const { modulo, token } = montarAmbienteEnvio({
      ativacoes: [{ id: 'ativ-001', influKey: 'OUTRA INFLUENCIADORA' }]
    });
    expect(modulo.iniciarEnvioResumable(token, 'ativ-001', 'a.jpg', 'image/jpeg', 1)).toEqual({ ok: false, erro: 'ACESSO_NEGADO' });
    expect(modulo.finalizarEnvioResumable(token, 'ativ-001', 'file-x')).toEqual({ ok: false, erro: 'ACESSO_NEGADO' });
  });

  test('REGRESSÃO (achado real de 2026-07-05): Google Drive não retorna header Location → FALHA_INICIAR_UPLOAD com detalhe, nunca ok:true com uploadUrl ausente', () => {
    const { modulo, token } = montarAmbienteEnvio({
      ativacoes: [{ id: 'ativ-001' }],
      respostaUrlFetch: () => criarRespostaHttpFake({ code: 200, headers: {} }) // sem Location
    });
    const res = modulo.iniciarEnvioResumable(token, 'ativ-001', 'a.jpg', 'image/jpeg', 1);
    expect(res.ok).toBe(false);
    expect(res.erro).toBe('FALHA_INICIAR_UPLOAD');
    expect(res.detalhes).toMatch(/Location/);
  });

  test('Google Drive responde com erro HTTP (!= 200) → FALHA_INICIAR_UPLOAD com o corpo da resposta', () => {
    const { modulo, token } = montarAmbienteEnvio({
      ativacoes: [{ id: 'ativ-001' }],
      respostaUrlFetch: () => criarRespostaHttpFake({ code: 403, corpo: 'Permission denied' })
    });
    const res = modulo.iniciarEnvioResumable(token, 'ativ-001', 'a.jpg', 'image/jpeg', 1);
    expect(res).toEqual({ ok: false, erro: 'FALHA_INICIAR_UPLOAD', detalhes: 'Permission denied' });
  });
});

describe('WebApp.js — encontrarLinhaAtivacaoPorId', () => {
  // getHeaderMap vive em Código.js, não em WebApp.js — o header map aqui é
  // montado manualmente, na mesma ordem de HEADER_ATIVACOES.
  const modulo = loadGasFiles([WEBAPP_PATH], {});
  const abaAtivacoes = criarAbaFake([
    HEADER_ATIVACOES,
    linhaAtivacao({ id: 'uuid-aaa' }),
    linhaAtivacao({ id: 'uuid-bbb' })
  ]);

  test('encontra a linha pelo ID estável (UUID)', () => {
    const header = { ID: 1, INFLU_KEY: 2, MES_REFERENCIA: 3, ANO_REFERENCIA: 4, FORMATO: 5, DATA_APROVACAO: 6, DATA_ATIVACAO: 7, STATUS_CONTEUDO: 8, LINK_ARQUIVO: 9 };
    expect(modulo.encontrarLinhaAtivacaoPorId(abaAtivacoes, header, 'uuid-bbb')).toBe(3);
  });

  test('fallback "ROWn" aceita número de linha literal dentro do intervalo válido', () => {
    const header = { ID: 1 };
    expect(modulo.encontrarLinhaAtivacaoPorId(abaAtivacoes, header, 'ROW2')).toBe(2);
  });

  test('fallback "ROWn" fora do intervalo retorna -1', () => {
    const header = { ID: 1 };
    expect(modulo.encontrarLinhaAtivacaoPorId(abaAtivacoes, header, 'ROW99')).toBe(-1);
  });

  test('ID inexistente retorna -1', () => {
    const header = { ID: 1 };
    expect(modulo.encontrarLinhaAtivacaoPorId(abaAtivacoes, header, 'nao-existe')).toBe(-1);
  });

  test('sem coluna ID no cabeçalho retorna -1 (exceto fallback ROWn)', () => {
    expect(modulo.encontrarLinhaAtivacaoPorId(abaAtivacoes, {}, 'uuid-aaa')).toBe(-1);
  });
});
