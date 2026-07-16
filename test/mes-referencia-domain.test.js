const { loadGas } = require('./helpers/gasHarness');

// NOTA (achado FASE 4, auditoria de dívida técnica): `loadGas` cria um
// `vm.createContext` novo a cada chamada (realm isolado). `igualA`/
// `comparadoCom` agora guardam `instanceof MesReferencia` (alinhando com
// toda VO/entidade irmã do domínio, ex. ColaboracaoMensal) — por isso,
// sempre que um teste compara duas instâncias, ambas precisam vir do MESMO
// `gas` (mesmo realm). `dominio()` carrega uma vez por teste; os helpers
// abaixo recebem esse `gas` em vez de chamar `loadGas` por si.
function dominio() {
  return loadGas(['src/domain/MesReferencia.js']);
}

function novoMesReferencia(gas, ano, mes) {
  return new gas.MesReferencia(ano, mes);
}

function mesReferenciaDeTexto(gas, texto) {
  return gas.MesReferencia.deTexto(texto);
}

describe('Value Object MesReferencia', () => {
  test('deve carregar o Value Object MesReferencia', () => {
    const gas = dominio();

    expect(gas.MesReferencia).toBeDefined();
  });

  // Caso 1: construção válida com zero-padding no toString.
  test('construção válida gera toString no formato canônico AAAA-MM', () => {
    const gas = dominio();
    const mesReferencia = novoMesReferencia(gas, 2026, 7);

    expect(mesReferencia.toString()).toBe('2026-07');
  });

  // Caso 2: deTexto('2026-07') equivalente à construção direta.
  test('deTexto("2026-07") produz VO equivalente ao construído diretamente', () => {
    const gas = dominio();
    const viaTexto = mesReferenciaDeTexto(gas, '2026-07');
    const viaConstrutor = novoMesReferencia(gas, 2026, 7);

    expect(viaTexto.igualA(viaConstrutor)).toBe(true);
    expect(viaTexto.toString()).toBe('2026-07');
  });

  // Caso 3: invariantes de mês/ano — fail-fast com código CM-02.
  describe('invariantes (CM-02)', () => {
    test('mês 0 é inválido', () => {
      const gas = dominio();
      expect(() => novoMesReferencia(gas, 2026, 0)).toThrow(/CM-02/);
    });

    test('mês 13 é inválido', () => {
      const gas = dominio();
      expect(() => novoMesReferencia(gas, 2026, 13)).toThrow(/CM-02/);
    });

    test('ano anterior a 2020 é inválido', () => {
      const gas = dominio();
      expect(() => novoMesReferencia(gas, 2019, 1)).toThrow(/CM-02/);
    });

    test('ano/mês não inteiros são inválidos', () => {
      const gas = dominio();
      expect(() => novoMesReferencia(gas, 2026.5, 7)).toThrow(/CM-02/);
      expect(() => novoMesReferencia(gas, 2026, '07')).toThrow(/CM-02/);
      expect(() => novoMesReferencia(gas, null, 7)).toThrow(/CM-02/);
      expect(() => novoMesReferencia(gas, 2026, undefined)).toThrow(/CM-02/);
    });
  });

  // Caso 4: deTexto com entradas não canônicas.
  describe('deTexto — entradas não canônicas (CM-02)', () => {
    test('mês sem zero-padding é inválido', () => {
      const gas = dominio();
      expect(() => mesReferenciaDeTexto(gas, '2026-7')).toThrow(/CM-02/);
    });

    test('ordem invertida (MM-AAAA) é inválida', () => {
      const gas = dominio();
      expect(() => mesReferenciaDeTexto(gas, '07-2026')).toThrow(/CM-02/);
    });

    test('separador incorreto é inválido', () => {
      const gas = dominio();
      expect(() => mesReferenciaDeTexto(gas, '2026/07')).toThrow(/CM-02/);
    });

    test('texto vazio é inválido', () => {
      const gas = dominio();
      expect(() => mesReferenciaDeTexto(gas, '')).toThrow(/CM-02/);
    });

    test('null é inválido', () => {
      const gas = dominio();
      expect(() => mesReferenciaDeTexto(gas, null)).toThrow(/CM-02/);
    });
  });

  // Caso 5: igualdade estrutural.
  describe('igualA — igualdade estrutural', () => {
    test('mesmo ano e mês são iguais', () => {
      const gas = dominio();
      const a = novoMesReferencia(gas, 2026, 7);
      const b = novoMesReferencia(gas, 2026, 7);

      expect(a.igualA(b)).toBe(true);
    });

    test('ano diferente não são iguais', () => {
      const gas = dominio();
      const a = novoMesReferencia(gas, 2026, 7);
      const b = novoMesReferencia(gas, 2025, 7);

      expect(a.igualA(b)).toBe(false);
    });

    test('mês diferente não são iguais', () => {
      const gas = dominio();
      const a = novoMesReferencia(gas, 2026, 7);
      const b = novoMesReferencia(gas, 2026, 8);

      expect(a.igualA(b)).toBe(false);
    });

    // Achado FASE 4 (auditoria de dívida técnica): igualA não guardava
    // `instanceof` — diferente de toda VO/entidade irmã do domínio
    // (ColaboracaoMensal, Envio, Entrega, PIX...), que retornam `false`
    // para null/objeto de outro tipo em vez de arremessar TypeError.
    test('null, undefined ou objeto estruturalmente igual mas de outro tipo não são iguais', () => {
      const gas = dominio();
      const a = novoMesReferencia(gas, 2026, 7);

      expect(a.igualA(null)).toBe(false);
      expect(a.igualA(undefined)).toBe(false);
      expect(a.igualA({ ano: 2026, mes: 7 })).toBe(false);
    });
  });

  // Caso 6: ordenação total cronológica.
  describe('comparadoCom — ordenação total', () => {
    test('mês anterior é "menor" que mês posterior no mesmo ano', () => {
      const gas = dominio();
      const jan = novoMesReferencia(gas, 2026, 1);
      const fev = novoMesReferencia(gas, 2026, 2);

      expect(jan.comparadoCom(fev)).toBe(-1);
      expect(fev.comparadoCom(jan)).toBe(1);
    });

    test('ano anterior é "menor" independentemente do mês', () => {
      const gas = dominio();
      const dez2025 = novoMesReferencia(gas, 2025, 12);
      const jan2026 = novoMesReferencia(gas, 2026, 1);

      expect(dez2025.comparadoCom(jan2026)).toBe(-1);
      expect(jan2026.comparadoCom(dez2025)).toBe(1);
    });

    test('instâncias iguais retornam 0', () => {
      const gas = dominio();
      const a = novoMesReferencia(gas, 2026, 2);
      const b = novoMesReferencia(gas, 2026, 2);

      expect(a.comparadoCom(b)).toBe(0);
    });

    // Achado FASE 4: comparadoCom lia `.ano`/`.mes` de qualquer objeto sem
    // checar o tipo — null ou objeto estranho geravam TypeError cru em vez
    // de um erro de domínio claro (CM-02, mesmo código de invariante da VO).
    test('comparar contra algo que não é MesReferencia falha fail-fast (CM-02)', () => {
      const gas = dominio();
      const a = novoMesReferencia(gas, 2026, 2);

      expect(() => a.comparadoCom(null)).toThrow(/CM-02/);
      expect(() => a.comparadoCom({ ano: 2026, mes: 2 })).toThrow(/CM-02/);
    });
  });

  // Caso 7: imutabilidade — Object.freeze.
  test('instância é imutável: tentativa de mutação não altera o VO', () => {
    const gas = dominio();
    const mesReferencia = novoMesReferencia(gas, 2026, 7);

    expect(() => {
      mesReferencia.ano = 1999;
    }).not.toThrow(); // em modo não-strict do vm, atribuição falha silenciosamente
    mesReferencia.mes = 1;

    expect(mesReferencia.ano).toBe(2026);
    expect(mesReferencia.mes).toBe(7);
    expect(Object.isFrozen(mesReferencia)).toBe(true);
  });
});
