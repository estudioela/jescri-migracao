/**
 * Pagamento é um modelo de LEITURA derivado: a V2 não tem aba de pagamentos.
 * Cruza `Planos_Colaboracao` (o acordado) com `Ativacoes` (o entregue).
 *
 * A regra de elegibilidade foi derivada da máquina de estados, não de uma
 * especificação de negócio. Estes testes fixam a regra que o código implementa
 * hoje — se o negócio disser outra coisa, é aqui que a mudança aparece.
 */
const { montarTear, autenticar } = require('./helpers/tearContexto');

const PARCEIRAS = [['i-1', 'Ana', 'Ativo', 'Moda', 'ANA10', '']];

/** Sessão da Ana: desde a Etapa 7, toda leitura é escopada pela parceira logada. */
function comDados(ativacoes, planos) {
  const tear = montarTear({
    Parceiros_Influenciadoras: PARCEIRAS,
    Ativacoes: ativacoes.map((l) => l.concat([''])),
    Planos_Colaboracao: planos
  });

  const token = autenticar(tear, 'ANA10');

  return {
    apiListarPagamentosDoCiclo: (ciclo) => tear.ctx.apiListarPagamentosDoCiclo(token, ciclo),
    apiListarHistoricoDoCiclo: (ciclo) => tear.ctx.apiListarHistoricoDoCiclo(token, ciclo)
  };
}

function semAbaDePlanos() {
  const tear = montarTear({ Parceiros_Influenciadoras: PARCEIRAS, Ativacoes: [] });
  const token = autenticar(tear, 'ANA10');

  return { apiListarPagamentosDoCiclo: (ciclo) => tear.ctx.apiListarPagamentosDoCiclo(token, ciclo) };
}

const PLANO_ANA = ['p-1', 'i-1', 'c-1', 2, 1500];

describe('PagamentoService — elegibilidade derivada da máquina de estados', () => {
  test('todas as entregas liberadas → Elegível para Pagamento', () => {
    const api = comDados(
      [
        ['a-1', 'c-1', 'i-1', 'REEL', 'Elegível para Pagamento'],
        ['a-2', 'c-1', 'i-1', 'STORIES', 'Arquivada']
      ],
      [PLANO_ANA]
    );

    const [pagamento] = api.apiListarPagamentosDoCiclo('c-1').data;

    expect(pagamento.estado).toBe('Elegível para Pagamento');
    expect(pagamento.entregaveisConcluidos).toBe(2);
    expect(pagamento.valorCache).toBe('1500');
    expect(pagamento.entregaveisAcordados).toBe('2');
  });

  test('uma entrega ainda em produção → Pendente', () => {
    const api = comDados(
      [
        ['a-1', 'c-1', 'i-1', 'REEL', 'Elegível para Pagamento'],
        ['a-2', 'c-1', 'i-1', 'STORIES', 'Em Produção']
      ],
      [PLANO_ANA]
    );

    const [pagamento] = api.apiListarPagamentosDoCiclo('c-1').data;

    expect(pagamento.estado).toBe('Pendente');
    expect(pagamento.entregaveisConcluidos).toBe(1);
  });

  // Um plano sem ativação nenhuma é cadastro incompleto, não trabalho pronto.
  test('plano sem ativação nenhuma é Pendente, nunca elegível', () => {
    const api = comDados([], [PLANO_ANA]);

    expect(api.apiListarPagamentosDoCiclo('c-1').data[0].estado).toBe('Pendente');
  });

  test('Concluída conta como entregue, mas não libera o pagamento sozinha', () => {
    const api = comDados([['a-1', 'c-1', 'i-1', 'REEL', 'Concluída']], [PLANO_ANA]);

    const [pagamento] = api.apiListarPagamentosDoCiclo('c-1').data;

    expect(pagamento.entregaveisConcluidos).toBe(1);
    expect(pagamento.estado).toBe('Pendente');
  });

  test('não mistura influenciadoras nem ciclos', () => {
    const api = comDados(
      [
        ['a-1', 'c-1', 'i-1', 'REEL', 'Arquivada'],
        ['a-2', 'c-1', 'i-2', 'REEL', 'Em Produção'],
        ['a-3', 'c-2', 'i-1', 'REEL', 'Em Produção']
      ],
      [PLANO_ANA, ['p-2', 'i-2', 'c-1', 1, 900], ['p-3', 'i-1', 'c-2', 1, 700]]
    );

    const pagamentos = api.apiListarPagamentosDoCiclo('c-1').data;

    // Escopo por sessão: o plano da 'i-2' não aparece para a Ana.
    expect(pagamentos.map((p) => [p.idInfluenciadora, p.estado])).toEqual([
      ['i-1', 'Elegível para Pagamento']
    ]);
  });

  test('valor ausente não vira zero inventado', () => {
    const api = comDados([['a-1', 'c-1', 'i-1', 'REEL', 'Arquivada']], [['p-1', 'i-1', 'c-1', 1, '']]);

    expect(api.apiListarPagamentosDoCiclo('c-1').data[0].valorCache).toBe('');
  });

  test.each([[''], [null], [undefined]])('ciclo %p vira {success:false}', (vazio) => {
    const api = comDados([], [PLANO_ANA]);

    expect(api.apiListarPagamentosDoCiclo(vazio).success).toBe(false);
  });

  test('aba de planos ausente vira envelope de erro, sem lançar', () => {
    const api = semAbaDePlanos();

    expect(api.apiListarPagamentosDoCiclo('c-1')).toEqual({
      success: false,
      error: expect.stringMatching(/Aba "Planos_Colaboracao" não encontrada/)
    });
  });
});

describe('apiListarHistoricoDoCiclo — histórico é o estado terminal, não uma aba', () => {
  test('devolve só as ativações arquivadas do ciclo', () => {
    const api = comDados(
      [
        ['a-1', 'c-1', 'i-1', 'REEL', 'Arquivada'],
        ['a-2', 'c-1', 'i-1', 'STORIES', 'Publicada'],
        ['a-3', 'c-2', 'i-1', 'REEL', 'Arquivada']
      ],
      []
    );

    const historico = api.apiListarHistoricoDoCiclo('c-1').data;

    expect(historico.map((h) => h.idAtivacao)).toEqual(['a-1']);
  });

  test('ciclo sem arquivadas devolve lista vazia, não erro', () => {
    const api = comDados([['a-1', 'c-1', 'i-1', 'REEL', 'Em Produção']], []);

    expect(api.apiListarHistoricoDoCiclo('c-1')).toEqual({ success: true, data: [] });
  });
});
