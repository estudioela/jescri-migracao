/**
 * V-03 / COM-03 — updatePerfil() passa a manter o endereço derivado em sincronia.
 *
 * O defeito: updatePerfil() gravava CEP/NUMERO/COMPLEMENTO e não recalculava
 * RUA/BAIRRO/CIDADE/UF/INFLUENCIADORA_ENDERECO. O onEdit() que deveria cobrir
 * isso nunca funcionou — é trigger SIMPLES: não dispara para setValue() de outra
 * execução, e não tem autorização para UrlFetchApp. Consequência real, em outro
 * contexto: gerarMensagemRevisao() confirmava no WhatsApp o endereço ANTIGO, e o
 * look era despachado para o lugar errado.
 *
 * Três invariantes travadas aqui:
 *   1. A chamada de rede acontece FORA do LockService — resolver o CEP dentro do
 *      lock serializaria todos os salvamentos de perfil atrás da brasilapi.
 *   2. Falha da API externa NUNCA derruba o salvamento do perfil.
 *   3. Se o CEP mudou e a API falhou, os campos derivados NÃO são recalculados:
 *      misturar CEP novo com rua antiga é pior que deixar o registro como estava.
 *
 * Ref: docs/auditoria/01_gestao_parceiros.md V-03
 * Ref: docs/auditoria/04_comunicacao_operacional.md COM-03
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const {
  criarAbaFake,
  criarSpreadsheetAppFake,
  criarCacheServiceFake,
  criarLoggerFake
} = require('./helpers/gasServiceMocks');

const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');
const WEBAPP_PATH = path.join(__dirname, '..', 'mae', 'WebApp.js');

const TOKEN = 'tok';
const CUPOM = 'CUPOM10';

const CAB_BASE = ['STATUS', 'INFLU_KEY', 'CUPOM', 'INFLUENCIADORA_CNPJ', 'INFLUENCIADORA_RAZAO_SOCIAL',
  'EMAIL', 'CHAVE_PIX', 'CEP', 'RUA', 'BAIRRO', 'NUMERO', 'COMPLEMENTO', 'CIDADE', 'UF',
  'INFLUENCIADORA_ENDERECO', 'VALOR_TOTAL'];

const col = (nome) => CAB_BASE.indexOf(nome);

const linhaInicial = () => ([
  'ON', 'FULANA', CUPOM, '12345678000199', 'FULANA LTDA',
  'f@e.com', 'f@pix', '01310100', 'AVENIDA PAULISTA', 'BELA VISTA', '100', 'APTO 1',
  'SÃO PAULO', 'SP', 'AVENIDA PAULISTA, 100, APTO 1, BELA VISTA - SÃO PAULO/SP, 01310-100', 1500
]);

const RESPOSTA_CEP_NOVO = {
  street: 'Rua Augusta', neighborhood: 'Consolação', city: 'São Paulo', state: 'SP'
};

/**
 * `eventos` registra a ordem real de aquisição de lock e chamada de rede — é
 * como o teste prova que a rede não acontece sob o lock.
 */
function carregar({ respostaFetch, lancarFetch } = {}) {
  const eventos = [];
  const aba = criarAbaFake([CAB_BASE, linhaInicial()]);

  const cacheService = criarCacheServiceFake();
  cacheService.getScriptCache().put(TOKEN, CUPOM);

  const lockService = {
    getScriptLock: () => ({
      waitLock() { eventos.push('lock:adquirido'); },
      releaseLock() { eventos.push('lock:liberado'); },
      tryLock() { eventos.push('lock:adquirido'); return true; }
    })
  };

  const urlFetchApp = {
    fetch(url) {
      eventos.push('rede:fetch');
      if (lancarFetch) throw new Error('timeout simulado da brasilapi');
      return {
        getResponseCode: () => (respostaFetch ? respostaFetch.code : 200),
        getContentText: () => JSON.stringify(respostaFetch ? respostaFetch.corpo : RESPOSTA_CEP_NOVO)
      };
    }
  };

  const logger = criarLoggerFake({ registrarChamadas: true });
  const sandbox = loadGasFiles([CODIGO_PATH, WEBAPP_PATH], {
    SpreadsheetApp: criarSpreadsheetAppFake({ 'BASE DE DADOS': aba }),
    CacheService: cacheService,
    LockService: lockService,
    UrlFetchApp: urlFetchApp,
    Logger: logger
  });

  return { sandbox, aba, eventos, logger };
}

const linhaGravada = (aba) => aba._linhas[1];

describe('montarEnderecoCompleto — pura, formato preservado', () => {
  const { sandbox } = carregar();

  test('monta no formato histórico, em maiúsculas', () => {
    expect(sandbox.montarEnderecoCompleto({
      rua: 'Rua Augusta', numero: '55', complemento: 'Casa 2',
      bairro: 'Consolação', cidade: 'São Paulo', uf: 'SP', cep: '01310100'
    })).toBe('RUA AUGUSTA, 55, CASA 2, CONSOLAÇÃO - SÃO PAULO/SP, 01310-100');
  });

  test('sem número vira S/N; sem complemento não deixa vírgula solta', () => {
    expect(sandbox.montarEnderecoCompleto({
      rua: 'Rua X', numero: '', complemento: '', bairro: 'B', cidade: 'C', uf: 'UF', cep: '12345678'
    })).toBe('RUA X, S/N, B - C/UF, 12345-678');
  });
});

describe('normalizarCep', () => {
  const { sandbox } = carregar();

  test('extrai 8 dígitos; qualquer outra coisa vira string vazia', () => {
    expect(sandbox.normalizarCep('01310-100')).toBe('01310100');
    expect(sandbox.normalizarCep(1310100)).toBe('');   // 7 dígitos
    expect(sandbox.normalizarCep('123')).toBe('');
    expect(sandbox.normalizarCep(null)).toBe('');
    expect(sandbox.normalizarCep(undefined)).toBe('');
  });
});

describe('updatePerfil — a rede acontece FORA do lock', () => {
  test('fetch do CEP precede a aquisição do lock', () => {
    const { sandbox, eventos } = carregar();

    sandbox.updatePerfil(TOKEN, { cep: '01305000' });

    expect(eventos.indexOf('rede:fetch')).toBeLessThan(eventos.indexOf('lock:adquirido'));
    expect(eventos[eventos.length - 1]).toBe('lock:liberado');
  });

  test('sem mudança de CEP, nenhuma chamada de rede é feita', () => {
    const { sandbox, eventos } = carregar();

    sandbox.updatePerfil(TOKEN, { email: 'novo@e.com' });

    expect(eventos).not.toContain('rede:fetch');
  });
});

describe('updatePerfil — CEP alterado e resolvido', () => {
  test('recalcula RUA/BAIRRO/CIDADE/UF e o endereço completo', () => {
    const { sandbox, aba } = carregar();

    const res = sandbox.updatePerfil(TOKEN, { cep: '01305000' });

    expect(res).toEqual({ ok: true });
    const linha = linhaGravada(aba);
    expect(linha[col('CEP')]).toBe('01305000');
    expect(linha[col('RUA')]).toBe('RUA AUGUSTA');
    expect(linha[col('BAIRRO')]).toBe('CONSOLAÇÃO');
    expect(linha[col('CIDADE')]).toBe('SÃO PAULO');
    expect(linha[col('UF')]).toBe('SP');
    // Mantém número e complemento que já estavam na linha.
    expect(linha[col('INFLUENCIADORA_ENDERECO')])
      .toBe('RUA AUGUSTA, 100, APTO 1, CONSOLAÇÃO - SÃO PAULO/SP, 01305-000');
  });

  test('CEP + número + complemento juntos: o endereço usa os valores novos', () => {
    const { sandbox, aba } = carregar();

    sandbox.updatePerfil(TOKEN, { cep: '01305000', numero: '999', complemento: '' });

    expect(linhaGravada(aba)[col('INFLUENCIADORA_ENDERECO')])
      .toBe('RUA AUGUSTA, 999, CONSOLAÇÃO - SÃO PAULO/SP, 01305-000');
  });
});

describe('updatePerfil — só número/complemento mudaram (sem rede)', () => {
  test('recompõe o endereço a partir do logradouro já gravado', () => {
    const { sandbox, aba, eventos } = carregar();

    sandbox.updatePerfil(TOKEN, { numero: '250' });

    expect(eventos).not.toContain('rede:fetch');
    expect(linhaGravada(aba)[col('INFLUENCIADORA_ENDERECO')])
      .toBe('AVENIDA PAULISTA, 250, APTO 1, BELA VISTA - SÃO PAULO/SP, 01310-100');
  });
});

describe('updatePerfil — resiliência: falha da API nunca derruba o salvamento', () => {
  test.each([
    ['exceção de rede', { lancarFetch: true }],
    ['HTTP 404', { respostaFetch: { code: 404, corpo: { message: 'CEP não encontrado' } } }],
    ['200 sem city', { respostaFetch: { code: 200, corpo: {} } }]
  ])('%s: perfil é salvo, CEP é gravado, derivados ficam INTACTOS', (_rotulo, opcoes) => {
    const { sandbox, aba, logger } = carregar(opcoes);
    const enderecoAntes = linhaInicial()[col('INFLUENCIADORA_ENDERECO')];

    const res = sandbox.updatePerfil(TOKEN, { cep: '01305000', chavePix: 'novo@pix' });

    expect(res).toEqual({ ok: true });                       // salvamento não falha
    const linha = linhaGravada(aba);
    expect(linha[col('CEP')]).toBe('01305000');              // CEP novo gravado
    expect(linha[col('CHAVE_PIX')]).toBe('novo@pix');        // demais campos gravados
    // Derivados preservados: melhor um registro antigo coerente que um híbrido
    // de CEP novo com rua antiga.
    expect(linha[col('RUA')]).toBe('AVENIDA PAULISTA');
    expect(linha[col('INFLUENCIADORA_ENDERECO')]).toBe(enderecoAntes);

    expect(logger._chamadas.map((c) => c.join(' ')).join('\n')).toContain('não resolvido');
  });

  test('CEP em formato inválido não dispara rede e não recalcula', () => {
    const { sandbox, aba, eventos } = carregar();
    const enderecoAntes = linhaInicial()[col('INFLUENCIADORA_ENDERECO')];

    const res = sandbox.updatePerfil(TOKEN, { cep: '123' });

    expect(res).toEqual({ ok: true });
    expect(eventos).not.toContain('rede:fetch');
    expect(linhaGravada(aba)[col('INFLUENCIADORA_ENDERECO')]).toBe(enderecoAntes);
  });
});

describe('updatePerfil — contrato preservado', () => {
  test('token inválido e perfil inexistente mantêm os códigos de erro', () => {
    const { sandbox } = carregar();

    expect(sandbox.updatePerfil('token-errado', { email: 'x' })).toEqual({ ok: false, erro: 'SESSAO_EXPIRADA' });
  });

  test('campos não enviados não são tocados', () => {
    const { sandbox, aba } = carregar();

    sandbox.updatePerfil(TOKEN, { email: 'novo@e.com' });

    const linha = linhaGravada(aba);
    expect(linha[col('EMAIL')]).toBe('novo@e.com');
    expect(linha[col('CHAVE_PIX')]).toBe('f@pix');
    expect(linha[col('CEP')]).toBe('01310100');
    expect(linha[col('INFLUENCIADORA_ENDERECO')]).toBe(linhaInicial()[col('INFLUENCIADORA_ENDERECO')]);
  });
});
