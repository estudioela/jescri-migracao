/**
 * Pontos de entrada de google.script.run, atravessando os Repositories REAIS
 * contra uma planilha falsa — Api → Controller → Service → Repository.
 *
 * Desde a Etapa 7 toda leitura exige sessão, e a identidade vem do TOKEN,
 * nunca de um argumento. O teste mais importante deste arquivo é o de
 * isolamento: uma parceira autenticada não pode ler os dados de outra.
 */
const { montarTear, autenticar } = require('./helpers/tearContexto');

const PARCEIRAS = [
  ['i-1', 'Ana', 'Ativo', 'Moda', 'ANA10', ''],
  ['i-2', 'Bia', 'Ativo', 'Beleza', 'BIA10', '']
];

const ATIVACOES = [
  ['a-1', 'c-1', 'i-1', 'REEL', 'Em Produção', 'https://ex/b1'],
  ['a-2', 'c-1', 'i-1', 'STORIES', 'Arquivada', ''],
  ['a-3', 'c-1', 'i-2', 'CARROSSEL', 'Aprovada', ''],
  ['a-4', 'c-2', 'i-1', 'REEL', 'Planejamento', '']
];

const CICLOS = [['c-1', 'julho', '', ''], ['c-2', 'agosto', '', '']];

function cenario() {
  const tear = montarTear({
    Parceiros_Influenciadoras: PARCEIRAS,
    Ativacoes: ATIVACOES,
    Ciclos: CICLOS
  });

  return { tear, tokenAna: autenticar(tear, 'ANA10'), tokenBia: autenticar(tear, 'BIA10') };
}

describe('apiListarAtivacoesDoCiclo — escopo por sessão', () => {
  test('devolve só as ativações da parceira autenticada, no ciclo pedido', () => {
    const { tear, tokenAna } = cenario();

    const resposta = tear.ctx.apiListarAtivacoesDoCiclo(tokenAna, 'c-1');

    expect(resposta.success).toBe(true);
    expect(resposta.data.map((d) => d.idAtivacao)).toEqual(['a-1', 'a-2']);
  });

  // O coração do controle de acesso: trocar o token troca o dono dos dados.
  test('parceiras diferentes veem conjuntos diferentes', () => {
    const { tear, tokenAna, tokenBia } = cenario();

    expect(tear.ctx.apiListarAtivacoesDoCiclo(tokenAna, 'c-1').data.map((d) => d.idAtivacao)).toEqual(['a-1', 'a-2']);
    expect(tear.ctx.apiListarAtivacoesDoCiclo(tokenBia, 'c-1').data.map((d) => d.idAtivacao)).toEqual(['a-3']);
  });

  test.each([['token-falso'], [''], [null], [undefined]])(
    'token %p não lê nada e devolve sessão expirada',
    (token) => {
      const { tear } = cenario();

      const resposta = tear.ctx.apiListarAtivacoesDoCiclo(token, 'c-1');

      expect(resposta.success).toBe(false);
      expect(resposta.error).toMatch(/Sessão expirada/);
      expect(resposta).not.toHaveProperty('data');
    }
  );

  test('logout invalida o token para as leituras', () => {
    const { tear, tokenAna } = cenario();

    tear.ctx.apiLogout(tokenAna);

    expect(tear.ctx.apiListarAtivacoesDoCiclo(tokenAna, 'c-1').success).toBe(false);
  });

  test('não expõe Estado_Derivado nem nome de coluna da planilha', () => {
    const { tear, tokenAna } = cenario();

    const [dto] = tear.ctx.apiListarAtivacoesDoCiclo(tokenAna, 'c-1').data;

    expect(dto).not.toHaveProperty('Estado_Principal');
    expect(dto).not.toHaveProperty('Estado_Derivado');
    expect(dto.tipoConteudo).toBe('REEL');
  });

  test('ciclo sem ativações da parceira devolve lista vazia, não erro', () => {
    const { tear, tokenBia } = cenario();

    expect(tear.ctx.apiListarAtivacoesDoCiclo(tokenBia, 'c-2')).toEqual({ success: true, data: [] });
  });

  // Hoje as abas da V2 não existem na planilha viva: o front tem que receber
  // um envelope, nunca uma página de erro do Apps Script.
  test('aba ausente vira {success:false}, sem lançar', () => {
    const tear = montarTear({ Parceiros_Influenciadoras: PARCEIRAS });
    const token = autenticar(tear, 'ANA10');

    const resposta = tear.ctx.apiListarAtivacoesDoCiclo(token, 'c-1');

    expect(resposta.success).toBe(false);
    expect(resposta.error).toMatch(/Aba "Ativacoes" não encontrada/);
  });
});

describe('apiListarHistoricoDoCiclo — arquivadas da parceira', () => {
  test('só as arquivadas dela', () => {
    const { tear, tokenAna, tokenBia } = cenario();

    expect(tear.ctx.apiListarHistoricoDoCiclo(tokenAna, 'c-1').data.map((d) => d.idAtivacao)).toEqual(['a-2']);
    expect(tear.ctx.apiListarHistoricoDoCiclo(tokenBia, 'c-1').data).toEqual([]);
  });

  test('exige sessão', () => {
    const { tear } = cenario();

    expect(tear.ctx.apiListarHistoricoDoCiclo('nada', 'c-1').success).toBe(false);
  });
});

describe('apiListarCiclos — exige sessão', () => {
  test('autenticada lê os ciclos', () => {
    const { tear, tokenAna } = cenario();

    expect(tear.ctx.apiListarCiclos(tokenAna).data.map((c) => c.idCiclo)).toEqual(['c-1', 'c-2']);
  });

  test('sem sessão, nada', () => {
    const { tear } = cenario();

    expect(tear.ctx.apiListarCiclos('x').success).toBe(false);
  });
});

describe('apiAlterarEstadoDaAtivacao', () => {
  test('transição válida grava; proibida devolve envelope de erro', () => {
    const { tear, tokenAna } = cenario();

    expect(tear.ctx.apiAlterarEstadoDaAtivacao(tokenAna, 'a-1', 'Aguardando Aprovação').success).toBe(true);

    const proibida = tear.ctx.apiAlterarEstadoDaAtivacao(tokenAna, 'a-1', 'Publicada');
    expect(proibida.success).toBe(false);
    expect(proibida.error).toMatch(/Transição proibida/i);
  });

  test('exige sessão', () => {
    const { tear } = cenario();

    expect(tear.ctx.apiAlterarEstadoDaAtivacao('x', 'a-1', 'Aguardando Aprovação').success).toBe(false);
  });
});

/**
 * A identidade sempre veio do token, mas `apiObterAtivacao` e
 * `apiAlterarEstadoDaAtivacao` resolviam a sessão e DESCARTAVAM o id: bastava
 * a Bia passar 'a-1' (da Ana) para ler e alterar a entrega dela.
 *
 * `a-1` pertence a `i-1` (Ana); a Bia (`i-2`) autentica normalmente.
 */
describe('ativação individual — isolamento entre parceiras', () => {
  test('Bia não lê a ativação da Ana, e a resposta não revela que ela existe', () => {
    const { tear, tokenAna, tokenBia } = cenario();

    expect(tear.ctx.apiObterAtivacao(tokenAna, 'a-1').success).toBe(true);

    const alheia = tear.ctx.apiObterAtivacao(tokenBia, 'a-1');
    const inexistente = tear.ctx.apiObterAtivacao(tokenBia, 'a-999');

    expect(alheia.success).toBe(false);

    // As duas respostas só diferem no id que o próprio chamador passou. Nada na
    // mensagem separa "existe, mas é da Ana" de "não existe".
    expect(alheia.error).toBe('Ativação "a-1" não encontrada.');
    expect(inexistente.error).toBe('Ativação "a-999" não encontrada.');
  });

  test('Bia não altera o estado da ativação da Ana, e nada é gravado', () => {
    const { tear, tokenBia } = cenario();

    const resposta = tear.ctx.apiAlterarEstadoDaAtivacao(tokenBia, 'a-1', 'Aguardando Aprovação');

    expect(resposta.success).toBe(false);
    expect(resposta.error).toMatch(/não encontrada/i);
    expect(tear.abas.Ativacoes.escrito).toEqual([]);
  });
});

describe('adminDefinirSenha — ADMIN_TOKEN ausente torna a função inerte', () => {
  test('sem a propriedade configurada, ninguém define senha', () => {
    const { tear } = cenario();

    expect(tear.ctx.adminDefinirSenha('ANA10', 'nova', 'qualquer')).toEqual({
      success: false,
      error: 'Operação não autorizada.'
    });
  });
});
