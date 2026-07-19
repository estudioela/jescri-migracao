const { loadGas } = require('./helpers/gasHarness');

// Fachada sem agregado próprio (mesmo desenho de PortalDeConteudoService,
// SPEC-027 §6.2/§6.4): reaproveita o AcessoPortalService (resolve Sessão) e
// fala com o Cadastro através da porta parceiraACL.obterPerfil/atualizarPerfil
// (fake em memória aqui — o mapeamento físico da BASE DE DADOS é
// responsabilidade exclusiva da ParceiraACL real, fora deste teste) e com o
// adaptador de CEP através da porta adaptadorDeCep.resolver (RN-02: falha
// degradável, nunca lançada como exceção do serviço).

function perfilVazio() {
  return {
    email: '',
    pix: '',
    cep: '',
    numero: '',
    complemento: '',
    rua: '',
    bairro: '',
    cidade: '',
    uf: '',
  };
}

function montar() {
  const gas = loadGas([
    'src/shared/Nucleo.js',
    'src/modulos/Parceira.js',
    'src/modulos/Perfil.js',
  ]);

  const sessoes = { 'tok-maria': 'Maria' };
  let chamadasARenovar = 0;
  const acessoPortalService = {
    renovar: (dados) => {
      chamadasARenovar += 1;
      const parceiraId = sessoes[dados && dados.token];
      if (!parceiraId) {
        const erro = new Error('Sessão expirada.');
        erro.codigo = 'AC-03';
        throw erro;
      }
      return { parceiraId: parceiraId };
    },
  };

  const perfis = {};
  const atualizacoes = [];
  let chamadasAObterPerfil = 0;
  const parceiraACL = {
    obterPerfil: (parceiraId) => {
      chamadasAObterPerfil += 1;
      return Object.prototype.hasOwnProperty.call(perfis, parceiraId) ? perfis[parceiraId] : null;
    },
    atualizarPerfil: (parceiraId, campos) => {
      atualizacoes.push({ parceiraId: parceiraId, campos: campos });
      const atual = perfis[parceiraId] || perfilVazio();
      perfis[parceiraId] = Object.assign({}, atual, campos);
    },
  };

  let resolverCep = () => {
    throw new Error('CEP indisponível (fake não configurado para este teste).');
  };
  const adaptadorDeCep = {
    resolver: (cep) => resolverCep(cep),
  };

  const servico = new gas.PerfilPortalService(acessoPortalService, parceiraACL, adaptadorDeCep);

  return {
    gas: gas,
    servico: servico,
    setPerfilDaMaria: (parcial) => {
      perfis['Maria'] = Object.assign(perfilVazio(), parcial);
    },
    setResolverCep: (fn) => {
      resolverCep = fn;
    },
    atualizacoes: atualizacoes,
    perfis: perfis,
    chamadasARenovar: () => chamadasARenovar,
    chamadasAObterPerfil: () => chamadasAObterPerfil,
  };
}

function codigoDe(fn) {
  try {
    fn();
    return null;
  } catch (erro) {
    return erro.codigo;
  }
}

describe('PerfilPortalService.resolverSessao', () => {
  test('PP-01: token inválido/expirado é recusado', () => {
    const { servico } = montar();

    expect(codigoDe(() => servico.resolverSessao('token-fantasma'))).toBe('PP-01');
  });
});

describe('PerfilPortalService.verPerfil (UC-032.01)', () => {
  test('perfil vazio (Parceira sem PIX/email/endereço cadastrados) devolve tudo null', () => {
    const { servico, setPerfilDaMaria } = montar();
    setPerfilDaMaria({});

    const perfil = servico.verPerfil({ token: 'tok-maria' });

    expect(perfil).toEqual({ email: null, pix: null, endereco: null });
  });

  test('Parceira inexistente na ACL (obterPerfil devolve null) é tratada como perfil vazio', () => {
    const { servico } = montar(); // nunca chamou setPerfilDaMaria: obterPerfil -> null

    const perfil = servico.verPerfil({ token: 'tok-maria' });

    expect(perfil).toEqual({ email: null, pix: null, endereco: null });
  });

  test('projeta email/PIX/endereco preenchidos como instâncias de domínio', () => {
    const { gas, servico, setPerfilDaMaria } = montar();
    setPerfilDaMaria({
      email: 'maria@exemplo.com',
      pix: 'chave-pix-maria',
      cep: '01310-100',
      numero: '1000',
      complemento: '',
      rua: 'Avenida Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });

    const perfil = servico.verPerfil({ token: 'tok-maria' });

    expect(perfil.email).toBe('maria@exemplo.com');
    expect(perfil.pix).toBeInstanceOf(gas.PIX);
    expect(perfil.pix.valor).toBe('chave-pix-maria');
    expect(perfil.endereco).toBeInstanceOf(gas.Endereco);
    expect(perfil.endereco.cep).toBe('01310-100');
    expect(perfil.endereco.completo()).toBe(true);
  });

  test('endereco null quando cep está vazio, mesmo com outros campos de endereço presentes', () => {
    const { servico, setPerfilDaMaria } = montar();
    setPerfilDaMaria({ cep: '', numero: '10' });

    const perfil = servico.verPerfil({ token: 'tok-maria' });

    expect(perfil.endereco).toBeNull();
  });

  test('PP-01: sessão inválida é recusada', () => {
    const { servico } = montar();

    expect(codigoDe(() => servico.verPerfil({ token: 'token-fantasma' }))).toBe('PP-01');
  });
});

describe('PerfilPortalService.editarPerfil (UC-032.02)', () => {
  test('PP-02: chave não permitida em dados é recusada', () => {
    const { servico, setPerfilDaMaria } = montar();
    setPerfilDaMaria({});

    expect(
      codigoDe(() => servico.editarPerfil({ token: 'tok-maria', outraCoisa: 'x' }))
    ).toBe('PP-02');
  });

  test('PP-01: sessão inválida é recusada antes de qualquer validação de campo', () => {
    const { servico } = montar();

    expect(
      codigoDe(() => servico.editarPerfil({ token: 'token-fantasma', pix: 'x' }))
    ).toBe('PP-01');
  });

  // CB-02/RN-04/INV-03: campo comercial não é representável no comando de
  // edição de perfil — recusado antes de tocar a ACL (nenhuma escrita).
  test('CB-02/RN-04: tentativa de editar valor comercial é recusada e não escreve nada na ACL', () => {
    const { servico, setPerfilDaMaria, atualizacoes } = montar();
    setPerfilDaMaria({});

    expect(
      codigoDe(() => servico.editarPerfil({ token: 'tok-maria', valorTotal: 9999 }))
    ).toBe('PP-02');
    expect(atualizacoes).toHaveLength(0);
  });

  test('edita email e PIX isoladamente (endereço não é tocado)', () => {
    const { servico, setPerfilDaMaria } = montar();
    setPerfilDaMaria({});

    const resultado = servico.editarPerfil({
      token: 'tok-maria',
      email: ' maria@exemplo.com ',
      pix: ' chave-nova ',
    });

    expect(resultado.email).toBe('maria@exemplo.com');
    expect(resultado.pix.valor).toBe('chave-nova');
    expect(resultado.endereco).toBeNull();
  });

  test('permite limpar email/PIX enviando string vazia', () => {
    const { servico, setPerfilDaMaria } = montar();
    setPerfilDaMaria({ email: 'maria@exemplo.com', pix: 'chave-antiga' });

    const resultado = servico.editarPerfil({ token: 'tok-maria', email: '', pix: '' });

    expect(resultado.email).toBeNull();
    expect(resultado.pix).toBeNull();
  });

  test('RN-01: CEP novo resolvido com sucesso recompõe rua/bairro/cidade/uf', () => {
    const { servico, setPerfilDaMaria, setResolverCep, atualizacoes } = montar();
    setPerfilDaMaria({});
    setResolverCep((cep) => {
      expect(cep).toBe('01310-100');
      return { rua: 'Avenida Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' };
    });

    const resultado = servico.editarPerfil({
      token: 'tok-maria',
      cep: '01310-100',
      numero: '1000',
    });

    expect(resultado.endereco.cep).toBe('01310-100');
    expect(resultado.endereco.numero).toBe('1000');
    expect(resultado.endereco.rua).toBe('Avenida Paulista');
    expect(resultado.endereco.completo()).toBe(true);
    const ultima = atualizacoes[atualizacoes.length - 1];
    expect(ultima.campos).toEqual(
      expect.objectContaining({
        cep: '01310-100',
        rua: 'Avenida Paulista',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
      })
    );
  });

  test('CB-01/RN-02: CEP mudou e a resolução falha — endereço fica incompleto mas é salvo', () => {
    const { servico, setPerfilDaMaria, setResolverCep } = montar();
    setPerfilDaMaria({
      cep: '01310-100',
      rua: 'Avenida Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });
    setResolverCep(() => {
      throw new Error('CEP indisponível.');
    });

    const resultado = servico.editarPerfil({ token: 'tok-maria', cep: '99999-999' });

    expect(resultado.endereco.cep).toBe('99999-999');
    expect(resultado.endereco.rua).toBe('');
    expect(resultado.endereco.bairro).toBe('');
    expect(resultado.endereco.cidade).toBe('');
    expect(resultado.endereco.uf).toBe('');
    expect(resultado.endereco.completo()).toBe(false);
  });

  test('CEP NÃO mudou (só numero/complemento) e a resolução falha — mantém rua/bairro/cidade/uf antigos', () => {
    const { servico, setPerfilDaMaria, setResolverCep } = montar();
    setPerfilDaMaria({
      cep: '01310-100',
      numero: '10',
      rua: 'Avenida Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });
    setResolverCep(() => {
      throw new Error('CEP indisponível.');
    });

    const resultado = servico.editarPerfil({ token: 'tok-maria', numero: '2000' });

    expect(resultado.endereco.numero).toBe('2000');
    expect(resultado.endereco.rua).toBe('Avenida Paulista');
    expect(resultado.endereco.bairro).toBe('Bela Vista');
    expect(resultado.endereco.cidade).toBe('São Paulo');
    expect(resultado.endereco.uf).toBe('SP');
    expect(resultado.endereco.completo()).toBe(true);
  });

  test('devolve o mesmo formato de verPerfil (perfil atualizado)', () => {
    const { servico, setPerfilDaMaria } = montar();
    setPerfilDaMaria({});

    const resultado = servico.editarPerfil({ token: 'tok-maria', pix: 'chave-x' });

    expect(Object.keys(resultado).sort()).toEqual(['email', 'endereco', 'pix']);
  });

  test('achado da revisão: email/pix explicitamente null limpa o campo, nunca persiste a string "null"', () => {
    const { servico, setPerfilDaMaria, atualizacoes } = montar();
    setPerfilDaMaria({ email: 'maria@exemplo.com', pix: 'chave-antiga' });

    const resultado = servico.editarPerfil({ token: 'tok-maria', email: null, pix: null });

    expect(resultado.email).toBeNull();
    expect(resultado.pix).toBeNull();
    const ultima = atualizacoes[atualizacoes.length - 1];
    expect(ultima.campos.email).toBe('');
    expect(ultima.campos.pix).toBe('');
  });

  test('achado da revisão: cep explicitamente null não vira o CEP literal "null" nem corrompe o endereço', () => {
    const { servico, setPerfilDaMaria, atualizacoes } = montar();
    setPerfilDaMaria({
      cep: '01310-100',
      rua: 'Avenida Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });

    const resultado = servico.editarPerfil({ token: 'tok-maria', cep: null });

    expect(resultado.endereco).toBeNull();
    const ultima = atualizacoes[atualizacoes.length - 1];
    expect(ultima.campos.cep).toBe('');
  });

  test('achado da revisão: renova a sessão UMA ÚNICA VEZ por edição bem-sucedida', () => {
    const { servico, setPerfilDaMaria, chamadasARenovar } = montar();
    setPerfilDaMaria({});

    servico.editarPerfil({ token: 'tok-maria', pix: 'chave-x' });

    expect(chamadasARenovar()).toBe(1);
  });

  test('achado da revisão: só chama o adaptador de CEP quando o CEP de fato muda', () => {
    const { servico, setPerfilDaMaria, setResolverCep } = montar();
    setPerfilDaMaria({ cep: '01310-100', numero: '10' });
    let chamadasAoResolver = 0;
    setResolverCep(() => {
      chamadasAoResolver += 1;
      return { rua: 'X', bairro: 'Y', cidade: 'Z', uf: 'SP' };
    });

    servico.editarPerfil({ token: 'tok-maria', numero: '2000' });

    expect(chamadasAoResolver).toBe(0);
  });

  test('achado de performance (FASE 5): lê a aba UMA única vez por edição, mesmo com endereço', () => {
    const { servico, setPerfilDaMaria, setResolverCep, chamadasAObterPerfil } = montar();
    setPerfilDaMaria({});
    setResolverCep(() => ({ rua: 'X', bairro: 'Y', cidade: 'Z', uf: 'SP' }));

    servico.editarPerfil({ token: 'tok-maria', cep: '01310-100', numero: '1000' });

    expect(chamadasAObterPerfil()).toBe(1);
  });
});
