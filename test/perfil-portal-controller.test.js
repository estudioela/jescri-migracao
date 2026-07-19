const { loadGas } = require('./helpers/gasHarness');

// Mesmo padrão de PortalDeConteudoController: o Controller nunca devolve a
// instância de domínio crua — pix vira pix.valor, endereco vira a projeção
// plana de campos. O fake de serviço aqui devolve objetos mínimos com
// `.valor` (imitando PIX) e os campos planos (imitando Endereco), já que o
// Controller só acessa essas propriedades.

function montar(servicoFake) {
  const gas = loadGas(['src/shared/Nucleo.js', 'src/modulos/Perfil.js']);
  return new gas.PerfilPortalController(servicoFake);
}

describe('PerfilPortalController', () => {
  describe('verPerfil', () => {
    test('projeta perfil completo em envelope de sucesso — nunca a instância de domínio crua', () => {
      const controller = montar({
        verPerfil: () => ({
          email: 'maria@exemplo.com',
          pix: { valor: 'chave-pix-maria' },
          endereco: {
            cep: '01310-100',
            numero: '1000',
            complemento: '',
            rua: 'Avenida Paulista',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            uf: 'SP',
            // Reconciliado: o Controller projeta `completo()` (RN-02/CB-01)
            // como campo plano no envelope, para a UI sinalizar endereço
            // incompleto sem reimplementar a regra — mantido de propósito.
            completo: () => true,
          },
        }),
      });

      const resposta = controller.verPerfil({ token: 'tok' });

      expect(resposta.success).toBe(true);
      expect(resposta.data).toEqual({
        email: 'maria@exemplo.com',
        pix: 'chave-pix-maria',
        endereco: {
          cep: '01310-100',
          numero: '1000',
          complemento: '',
          rua: 'Avenida Paulista',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
          completo: true,
        },
      });
    });

    test('perfil vazio: pix e endereco nulos no envelope', () => {
      const controller = montar({
        verPerfil: () => ({ email: null, pix: null, endereco: null }),
      });

      const resposta = controller.verPerfil({ token: 'tok' });

      expect(resposta.success).toBe(true);
      expect(resposta.data).toEqual({ email: null, pix: null, endereco: null });
    });

    test('erro com codigo PP-01 é propagado no envelope de falha', () => {
      const controller = montar({
        verPerfil: () => {
          const erro = new Error('Sessão inválida ou expirada.');
          erro.codigo = 'PP-01';
          throw erro;
        },
      });

      const resposta = controller.verPerfil({ token: 'invalido' });

      expect(resposta).toEqual({
        success: false,
        error: { codigo: 'PP-01', mensagem: 'Sessão inválida ou expirada.' },
      });
    });
  });

  describe('editarPerfil', () => {
    test('projeta o perfil atualizado em envelope de sucesso', () => {
      const controller = montar({
        editarPerfil: () => ({
          email: 'maria@exemplo.com',
          pix: { valor: 'chave-nova' },
          endereco: null,
        }),
      });

      const resposta = controller.editarPerfil({
        token: 'tok',
        email: 'maria@exemplo.com',
        pix: 'chave-nova',
      });

      expect(resposta.success).toBe(true);
      expect(resposta.data).toEqual({
        email: 'maria@exemplo.com',
        pix: 'chave-nova',
        endereco: null,
      });
    });

    test('erro com codigo PP-02 (campo não permitido) é propagado', () => {
      const controller = montar({
        editarPerfil: () => {
          const erro = new Error("Campo não permitido: 'outraCoisa'.");
          erro.codigo = 'PP-02';
          throw erro;
        },
      });

      const resposta = controller.editarPerfil({ token: 'tok', outraCoisa: 'x' });

      expect(resposta.success).toBe(false);
      expect(resposta.error.codigo).toBe('PP-02');
    });

    test('erro com codigo PP-01 (sessão inválida) é propagado', () => {
      const controller = montar({
        editarPerfil: () => {
          const erro = new Error('Sessão inválida ou expirada.');
          erro.codigo = 'PP-01';
          throw erro;
        },
      });

      const resposta = controller.editarPerfil({ token: 'invalido', pix: 'x' });

      expect(resposta.success).toBe(false);
      expect(resposta.error.codigo).toBe('PP-01');
    });
  });
});
