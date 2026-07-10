/**
 * Autenticação da V2.
 *
 * O que este arquivo protege não é "o login funciona" — é o conjunto de
 * propriedades de segurança que um login errado quebra em silêncio: senha
 * nunca em texto puro, hash nunca vazando em DTO, mensagem de erro que não
 * permite enumerar parceiras, bloqueio por tentativas, e sessão que expira.
 */
const path = require('path');
const crypto = require('crypto');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

const ARQUIVOS = [
  'Config.js', 'Planilha.js', 'Senha.js', 'ParceiroRepository.js',
  'SessaoRepository.js', 'AuthService.js', 'AuthController.js'
];

const EXPORTS = [
  'AuthService', 'AuthController', 'ParceiroRepository', 'SessaoRepository',
  'CAMPOS_PARCEIRO', 'criarSenhaHash', 'senhaConfere', 'LOGIN_MAX_TENTATIVAS'
];

const CAB = ['ID_Influenciadora', 'Nome', 'Status_Contrato', 'Categoria', 'Cupom', 'Senha_Hash'];

/** Reproduz o SHA-256 do Apps Script com o crypto do Node. */
const Utilities = {
  DigestAlgorithm: { SHA_256: 'sha256' },
  Charset: { UTF_8: 'utf8' },
  computeDigest: (_alg, texto) => Array.from(crypto.createHash('sha256').update(texto, 'utf8').digest()),
  getUuid: (() => {
    let n = 0;
    return () => 'uuid-' + ++n;
  })()
};

function cacheFalso() {
  const dados = new Map();

  return {
    dados,
    get: (k) => (dados.has(k) ? dados.get(k) : null),
    put: (k, v) => dados.set(k, String(v)),
    remove: (k) => dados.delete(k)
  };
}

function abaFalsa(linhas) {
  const escrito = [];

  return {
    escrito,
    getDataRange: () => ({ getValues: () => [CAB.slice()].concat(linhas.map((l) => l.slice())) }),
    getRange: (linha, coluna) => ({ setValue: (v) => escrito.push({ linha, coluna, valor: v }) })
  };
}

function montar(linhas) {
  const aba = abaFalsa(linhas);
  const ctx = loadGasFiles(
    ARQUIVOS.map(arquivo),
    {
      Utilities,
      SpreadsheetApp: { getActive: () => ({ getSheetByName: () => aba }) }
    },
    EXPORTS
  );

  const cache = cacheFalso();
  const service = new ctx.AuthService(new ctx.ParceiroRepository(), new ctx.SessaoRepository(cache));

  return { ctx, aba, cache, service, controller: new ctx.AuthController(service) };
}

const HASH_DE = (ctx, senha) => ctx.criarSenhaHash(senha);

function comParceira(senha) {
  const base = montar([]);
  const hash = senha === null ? '' : HASH_DE(base.ctx, senha);

  return montar([['i-1', 'Ana', 'Ativo', 'Moda', 'ANA10', hash]]);
}

describe('Senha — hash', () => {
  test('nunca guarda a senha em texto puro, e usa salt por parceira', () => {
    const { ctx } = montar([]);

    const a = ctx.criarSenhaHash('segredo');
    const b = ctx.criarSenhaHash('segredo');

    expect(a).not.toContain('segredo');
    expect(a).not.toBe(b); // salts distintos
    expect(ctx.senhaConfere('segredo', a)).toBe(true);
    expect(ctx.senhaConfere('segredo', b)).toBe(true);
  });

  test('rejeita senha errada e formato corrompido', () => {
    const { ctx } = montar([]);
    const hash = ctx.criarSenhaHash('segredo');

    expect(ctx.senhaConfere('outra', hash)).toBe(false);
    expect(ctx.senhaConfere('segredo', 'sem-separador')).toBe(false);
    expect(ctx.senhaConfere('segredo', '$')).toBe(false);
    expect(ctx.senhaConfere('segredo', '')).toBe(false);
    expect(ctx.senhaConfere('', hash)).toBe(false);
  });
});

describe('AuthService — login', () => {
  test('credencial correta devolve token e perfil', () => {
    const { service } = comParceira('segredo');

    const sessao = service.login('ANA10', 'segredo');

    expect(sessao.token).toBeTruthy();
    expect(sessao.perfil).toEqual({
      idInfluenciadora: 'i-1',
      nome: 'Ana',
      statusContrato: 'Ativo',
      categoria: 'Moda'
    });
  });

  // Se o hash escapar para o cliente, ele pode ser atacado offline.
  test('o perfil devolvido nunca carrega Senha_Hash nem Cupom', () => {
    const { service } = comParceira('segredo');

    const sessao = service.login('ANA10', 'segredo');

    expect(sessao.perfil).not.toHaveProperty('Senha_Hash');
    expect(JSON.stringify(sessao.perfil)).not.toMatch(/\$/);
    expect(sessao.perfil).not.toHaveProperty('cupom');
  });

  test('cupom casa sem diferenciar caixa nem espaço', () => {
    const { service } = comParceira('segredo');

    expect(service.login('  ana10 ', 'segredo').token).toBeTruthy();
  });

  // Mensagens distintas permitiriam descobrir quais cupons existem.
  test('cupom inexistente e senha errada dão a MESMA mensagem', () => {
    const { service } = comParceira('segredo');

    const erroDeCupom = (() => { try { service.login('NAOEXISTE', 'x'); } catch (e) { return e.message; } })();
    const erroDeSenha = (() => { try { service.login('ANA10', 'errada'); } catch (e) { return e.message; } })();

    expect(erroDeCupom).toBe('Cupom ou senha inválidos.');
    expect(erroDeSenha).toBe('Cupom ou senha inválidos.');
  });

  // A aba nasce com Senha_Hash vazia. Sem isso, credencial em branco logaria.
  test('parceira sem senha definida não consegue entrar', () => {
    const { service } = comParceira(null);

    expect(() => service.login('ANA10', '')).toThrow(/Informe o cupom e a senha/);
    expect(() => service.login('ANA10', 'qualquer')).toThrow(/inválidos/);
  });

  test('bloqueia após 5 tentativas e a mensagem muda', () => {
    const { service, ctx } = comParceira('segredo');

    for (let i = 0; i < ctx.LOGIN_MAX_TENTATIVAS; i++) {
      expect(() => service.login('ANA10', 'errada')).toThrow(/inválidos/);
    }

    // Mesmo com a senha CERTA: o bloqueio é por cupom, não por senha.
    expect(() => service.login('ANA10', 'segredo')).toThrow(/Muitas tentativas/);
  });

  test('login bem-sucedido zera o contador de tentativas', () => {
    const { service } = comParceira('segredo');

    expect(() => service.login('ANA10', 'errada')).toThrow();
    expect(service.login('ANA10', 'segredo').token).toBeTruthy();
    expect(() => service.login('ANA10', 'errada')).toThrow(/inválidos/); // não bloqueado
  });
});

describe('AuthService — sessão', () => {
  test('token válido resolve o perfil; token desconhecido expira', () => {
    const { service } = comParceira('segredo');
    const { token } = service.login('ANA10', 'segredo');

    expect(service.sessaoAtual(token).nome).toBe('Ana');
    expect(() => service.sessaoAtual('token-falso')).toThrow(/Sessão expirada/);
    expect(() => service.sessaoAtual('')).toThrow(/Sessão expirada/);
  });

  test('logout invalida o token', () => {
    const { service } = comParceira('segredo');
    const { token } = service.login('ANA10', 'segredo');

    service.logout(token);

    expect(() => service.sessaoAtual(token)).toThrow(/Sessão expirada/);
  });

  test('a sessão guarda só o id da parceira, nunca a credencial', () => {
    const { service, cache } = comParceira('segredo');
    const { token } = service.login('ANA10', 'segredo');

    // Formato `id|criadaEm`: o carimbo sustenta o teto absoluto de expiração.
    expect(cache.get('sessao:' + token)).toMatch(/^i-1\|\d+$/);
    expect(JSON.stringify([...cache.dados.values()])).not.toMatch(/\$/);
  });
});

describe('correções da revisão de segurança', () => {
  // Nada na planilha impede dois cadastros com o mesmo cupom. Pegar a primeira
  // linha em silêncio faria uma parceira entrar como outra.
  test('cupom duplicado falha alto, no login e no provisionamento', () => {
    const base = montar([]);
    const hash = base.ctx.criarSenhaHash('segredo');
    const { service, ctx } = montar([
      ['i-1', 'Ana', 'Ativo', 'Moda', 'ANA10', hash],
      ['i-2', 'Outra', 'Ativo', 'Moda', ' ana10 ', hash]
    ]);

    expect(() => service.login('ANA10', 'segredo')).toThrow(/duplicado/);
    expect(() => new ctx.ParceiroRepository().definirSenhaHash('ANA10', 'x')).toThrow(/duplicado/);
  });

  // Sem teto absoluto, uma aba aberta renova a sessão para sempre e um token
  // roubado nunca caduca sozinho.
  test('a sessão morre no teto absoluto, por mais que seja renovada', () => {
    const { service, cache } = comParceira('segredo');
    const { token } = service.login('ANA10', 'segredo');

    expect(service.sessaoAtual(token).nome).toBe('Ana');

    const oitoDiasAtras = Date.now() - 8 * 24 * 60 * 60 * 1000;
    cache.put('sessao:' + token, 'i-1|' + oitoDiasAtras);

    expect(() => service.sessaoAtual(token)).toThrow(/Sessão expirada/);
    expect(cache.get('sessao:' + token)).toBe(null); // e some do cache
  });

  // Reiniciar o TTL a cada tentativa deixaria qualquer um manter a conta de uma
  // parceira trancada indefinidamente, com um login errado a cada 15 minutos.
  test('a janela de bloqueio é fixa a partir da primeira falha', () => {
    const { service, cache } = comParceira('segredo');
    const chave = 'tentativas:ANA10';

    expect(() => service.login('ANA10', 'errada')).toThrow();
    const primeiraJanela = cache.get(chave).split('|')[1];

    expect(() => service.login('ANA10', 'errada')).toThrow();
    const segundaJanela = cache.get(chave).split('|')[1];

    expect(segundaJanela).toBe(primeiraJanela);
    expect(cache.get(chave).split('|')[0]).toBe('2');
  });

  test('tentativa de janela vencida não conta', () => {
    const { service, cache } = comParceira('segredo');

    cache.put('tentativas:ANA10', '4|' + (Date.now() - 1000));

    expect(() => service.login('ANA10', 'errada')).toThrow(/inválidos/);
    expect(cache.get('tentativas:ANA10').split('|')[0]).toBe('1');
  });
});

describe('AuthController — envelope', () => {
  test.each([
    [{ action: 'LOGIN', cupom: 'ANA10', senha: 'errada' }, /inválidos/],
    [{ action: 'ME', token: 'x' }, /Sessão expirada/],
    [{ action: 'DROP_TABLE' }, /não é suportada/],
    [null, /payload ausente/]
  ])('%p vira {success:false} sem lançar', (payload, mensagem) => {
    const { controller } = comParceira('segredo');

    const resposta = controller.handleAuth(payload);

    expect(resposta.success).toBe(false);
    expect(resposta.error).toMatch(mensagem);
  });

  test('LOGIN bem-sucedido devolve envelope com token', () => {
    const { controller } = comParceira('segredo');

    const resposta = controller.handleAuth({ action: 'LOGIN', cupom: 'ANA10', senha: 'segredo' });

    expect(resposta.success).toBe(true);
    expect(resposta.data.token).toBeTruthy();
  });
});

describe('ParceiroRepository — provisionamento de senha', () => {
  test('grava o hash na linha e coluna certas', () => {
    const { ctx, aba } = comParceira(null);

    new ctx.ParceiroRepository().definirSenhaHash('ana10', 'salt$hash');

    // linha 2 (primeira de dados), coluna 6 (Senha_Hash)
    expect(aba.escrito).toEqual([{ linha: 2, coluna: 6, valor: 'salt$hash' }]);
  });

  test('cupom inexistente falha alto, sem gravar nada', () => {
    const { ctx, aba } = comParceira(null);

    expect(() => new ctx.ParceiroRepository().definirSenhaHash('ninguem', 'x')).toThrow(/não encontrada/);
    expect(aba.escrito).toHaveLength(0);
  });
});
