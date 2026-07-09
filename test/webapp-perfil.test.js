/**
 * Fluxo crítico #7 (prioridade do usuário): INTEGRAÇÕES COM GOOGLE SHEETS
 * (leitura/escrita direta em BASE DE DADOS via getPerfil()/updatePerfil()).
 * Cobre mae/WebApp.js getPerfil() (~L568) e updatePerfil() (~L613) — o único
 * ponto de escrita direta da influenciadora em BASE DE DADOS. Junto com
 * login() (test/webapp-autenticacao.test.js), são os pontos que resolviam
 * MAP.BASE por índice fixo; migrados para getHeaderMap() em 2026-07-07 (ver
 * teste de risco em webapp-autenticacao.test.js e o novo teste de coluna
 * deslocada abaixo).
 *
 * Ver FLOW.md "FLOW: Perfil", CLAUDE.md seção 3 ("Perfil").
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');
const {
  criarCacheServiceFake,
  criarLockServiceFake,
  criarUtilitiesFake,
  criarLoggerFake,
  criarAbaFake,
  criarSpreadsheetAppFake
} = require('./helpers/gasServiceMocks');
const { HEADER_BASE, colBase, linhaBase, INFLUENCIADORA_PADRAO } = require('./helpers/fixtures');

const WEBAPP_PATH = path.join(__dirname, '..', 'mae', 'WebApp.js');
const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

const PERFIL_COMPLETO = {
  ...INFLUENCIADORA_PADRAO,
  email: 'maria@example.com',
  chavePix: 'maria-pix@example.com',
  cep: '01001000',
  rua: 'Rua Original',
  numero: '100',
  complemento: 'Apto 1',
  cidade: 'São Paulo',
  uf: 'SP',
  valor: 1500
};

// getPerfil()/updatePerfil() migraram de índice fixo (MAP.BASE) para
// getHeaderMap() (2026-07-07) — WebApp.js chama getHeaderMap(), definida em
// Código.js, então os dois precisam ser carregados no mesmo sandbox (ver
// test/helpers/loadGasModule.js), como já é feito nos demais arquivos de
// teste desta sessão (ex. webapp-pagamentos.test.js).
function montarAmbiente(linhasDados, headerBase) {
  const abaBase = criarAbaFake([headerBase || HEADER_BASE, ...linhasDados.map(linhaBase)]);
  const sandbox = {
    SpreadsheetApp: criarSpreadsheetAppFake({ 'BASE DE DADOS': abaBase }),
    CacheService: criarCacheServiceFake(),
    LockService: criarLockServiceFake(),
    Utilities: criarUtilitiesFake(),
    Logger: criarLoggerFake()
  };
  const modulo = loadGasFiles([CODIGO_PATH, WEBAPP_PATH], sandbox);
  const token = modulo.login(INFLUENCIADORA_PADRAO.cupom, '12345').token;
  return { modulo, abaBase, token };
}

describe('WebApp.js — getPerfil()', () => {
  test('retorna todos os dados cadastrais e os campos somente-leitura corretamente', () => {
    const { modulo, token } = montarAmbiente([PERFIL_COMPLETO]);
    const res = modulo.getPerfil(token);
    expect(res.ok).toBe(true);
    expect(res.dados).toEqual({
      nome: 'Maria Influencer',
      cnpj: '12345678000199',
      chavePix: 'maria-pix@example.com',
      email: 'maria@example.com',
      telefone: '',
      cep: '01001000',
      rua: 'Rua Original',
      numero: '100',
      complemento: 'Apto 1',
      cidade: 'São Paulo',
      estado: 'SP'
    });
    expect(res.somenteLeitura).toEqual({ cupom: 'MARIA10', valorTotal: 1500 });
  });

  test('token inválido → SESSAO_EXPIRADA', () => {
    const { modulo } = montarAmbiente([PERFIL_COMPLETO]);
    expect(modulo.getPerfil('token-invalido')).toEqual({ ok: false, erro: 'SESSAO_EXPIRADA' });
  });

  test('cupom sem correspondência em BASE DE DADOS (token válido, cadastro removido/alterado) → PERFIL_NAO_ENCONTRADO', () => {
    const { modulo, abaBase, token } = montarAmbiente([PERFIL_COMPLETO]);
    // token continua válido (só depende do CacheService), mas a linha da
    // planilha não bate mais com o cupom da sessão.
    abaBase._linhas[1][colBase('CUPOM') - 1] = 'OUTRO_CUPOM';
    expect(modulo.getPerfil(token)).toEqual({ ok: false, erro: 'PERFIL_NAO_ENCONTRADO' });
  });
});

describe('WebApp.js — updatePerfil()', () => {
  test('grava um campo isolado (chavePix) sem afetar os demais campos da linha', () => {
    const { modulo, abaBase, token } = montarAmbiente([PERFIL_COMPLETO]);
    const res = modulo.updatePerfil(token, { chavePix: 'nova-chave@example.com' });
    expect(res).toEqual({ ok: true });

    const linha = abaBase._linhas[1];
    expect(linha[colBase('CHAVE_PIX') - 1]).toBe('nova-chave@example.com');
    // demais campos preservados
    expect(linha[colBase('EMAIL') - 1]).toBe('maria@example.com');
    expect(linha[colBase('CEP') - 1]).toBe('01001000');
    expect(linha[colBase('NUMERO') - 1]).toBe('100');
    expect(linha[colBase('COMPLEMENTO') - 1]).toBe('Apto 1');
    expect(linha[colBase('INFLUENCIADORA_RAZAO_SOCIAL') - 1]).toBe('Maria Influencer'); // nem sequer é campo editável
  });

  test('atualiza todos os 5 campos editáveis simultaneamente', () => {
    const { modulo, abaBase, token } = montarAmbiente([PERFIL_COMPLETO]);
    modulo.updatePerfil(token, {
      chavePix: 'chave2', email: 'novo@example.com', cep: '02002000', numero: '200', complemento: 'Casa'
    });
    const linha = abaBase._linhas[1];
    expect(linha[colBase('CHAVE_PIX') - 1]).toBe('chave2');
    expect(linha[colBase('EMAIL') - 1]).toBe('novo@example.com');
    expect(linha[colBase('CEP') - 1]).toBe('02002000');
    expect(linha[colBase('NUMERO') - 1]).toBe('200');
    expect(linha[colBase('COMPLEMENTO') - 1]).toBe('Casa');
  });

  test('campo AUSENTE no payload (undefined) não sobrescreve o valor existente', () => {
    const { modulo, abaBase, token } = montarAmbiente([PERFIL_COMPLETO]);
    modulo.updatePerfil(token, { chavePix: 'só-isso-mudou' }); // demais campos nem aparecem no objeto
    const linha = abaBase._linhas[1];
    expect(linha[colBase('EMAIL') - 1]).toBe('maria@example.com');
    expect(linha[colBase('CEP') - 1]).toBe('01001000');
    expect(linha[colBase('NUMERO') - 1]).toBe('100');
    expect(linha[colBase('COMPLEMENTO') - 1]).toBe('Apto 1');
  });

  test('campo explicitamente null ou string vazia SOBRESCREVE (só "undefined" é tratado como "não enviado")', () => {
    const { modulo, abaBase, token } = montarAmbiente([PERFIL_COMPLETO]);
    modulo.updatePerfil(token, { email: null, cep: '' });
    const linha = abaBase._linhas[1];
    expect(linha[colBase('EMAIL') - 1]).toBeNull();
    expect(linha[colBase('CEP') - 1]).toBe('');
  });

  test('token inválido → SESSAO_EXPIRADA, nenhuma escrita ocorre', () => {
    const { modulo, abaBase } = montarAmbiente([PERFIL_COMPLETO]);
    const res = modulo.updatePerfil('token-invalido', { chavePix: 'tentativa' });
    expect(res).toEqual({ ok: false, erro: 'SESSAO_EXPIRADA' });
    expect(abaBase._linhas[1][colBase('CHAVE_PIX') - 1]).toBe('maria-pix@example.com'); // inalterado
  });

  test('cupom sem correspondência → PERFIL_NAO_ENCONTRADO', () => {
    const { modulo, abaBase, token } = montarAmbiente([PERFIL_COMPLETO]);
    abaBase._linhas[1][colBase('CUPOM') - 1] = 'OUTRO_CUPOM';
    expect(modulo.updatePerfil(token, { chavePix: 'x' })).toEqual({ ok: false, erro: 'PERFIL_NAO_ENCONTRADO' });
  });
});

describe('WebApp.js — getPerfil()/updatePerfil() — resolução de coluna por nome (não por posição)', () => {
  // Prova da correção do risco #1 da auditoria técnica
  // (docs/AUDITORIA_TECNICA_2026-07-07.md seções 7/15.3/17.1): antes da
  // migração para getHeaderMap(), inserir uma coluna no meio de BASE DE
  // DADOS deslocava todas as posições à direita e quebrava getPerfil()/
  // updatePerfil() silenciosamente (lia/gravava a célula errada). Este teste
  // insere uma coluna nova entre CHAVE_PIX e CNPJ e confirma que os dois
  // continuam lendo e gravando os campos certos.
  test('coluna nova inserida no meio do cabeçalho não quebra getPerfil() nem updatePerfil()', () => {
    const headerComColunaNova = [
      'STATUS', 'INFLU_KEY', 'CUPOM', 'INFLUENCIADORA_RAZAO_SOCIAL', 'EMAIL', 'CHAVE_PIX',
      'OBSERVACOES_INTERNAS', // <- coluna nova, inserida antes de CNPJ
      'INFLUENCIADORA_CNPJ', 'CEP', 'RUA', 'NUMERO', 'COMPLEMENTO', 'BAIRRO', 'CIDADE', 'UF', 'VALOR_TOTAL'
    ];
    const linhaComColunaNova = [
      'ON', PERFIL_COMPLETO.influKey, PERFIL_COMPLETO.cupom, PERFIL_COMPLETO.nome,
      PERFIL_COMPLETO.email, PERFIL_COMPLETO.chavePix,
      'nota interna qualquer',
      PERFIL_COMPLETO.cnpj, PERFIL_COMPLETO.cep, PERFIL_COMPLETO.rua, PERFIL_COMPLETO.numero,
      PERFIL_COMPLETO.complemento, '', PERFIL_COMPLETO.cidade, PERFIL_COMPLETO.uf, PERFIL_COMPLETO.valor
    ];
    const abaBase = criarAbaFake([headerComColunaNova, linhaComColunaNova]);
    const sandbox = {
      SpreadsheetApp: criarSpreadsheetAppFake({ 'BASE DE DADOS': abaBase }),
      CacheService: criarCacheServiceFake(),
      LockService: criarLockServiceFake(),
      Utilities: criarUtilitiesFake(),
      Logger: criarLoggerFake()
    };
    const modulo = loadGasFiles([CODIGO_PATH, WEBAPP_PATH], sandbox);
    const token = modulo.login(PERFIL_COMPLETO.cupom, '12345').token;

    const res = modulo.getPerfil(token);
    expect(res.ok).toBe(true);
    expect(res.dados.cnpj).toBe(PERFIL_COMPLETO.cnpj);
    expect(res.dados.cep).toBe(PERFIL_COMPLETO.cep);
    expect(res.somenteLeitura.valorTotal).toBe(PERFIL_COMPLETO.valor);

    const upd = modulo.updatePerfil(token, { chavePix: 'chave-nova-pos-coluna-extra' });
    expect(upd).toEqual({ ok: true });
    const colChavePix = headerComColunaNova.indexOf('CHAVE_PIX') + 1;
    const colObservacoes = headerComColunaNova.indexOf('OBSERVACOES_INTERNAS') + 1;
    expect(abaBase._linhas[1][colChavePix - 1]).toBe('chave-nova-pos-coluna-extra');
    expect(abaBase._linhas[1][colObservacoes - 1]).toBe('nota interna qualquer'); // não afetada
  });
});
