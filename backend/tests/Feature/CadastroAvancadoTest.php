<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CadastroAvancadoTest extends TestCase
{
    use RefreshDatabase;

    private function dadosCadastroValidos(array $overrides = []): array
    {
        return array_merge([
            'nome' => 'Maria Influenciadora',
            'email' => 'maria@example.com',
            'telefone' => '(11) 98888-7777',
            'instagram' => '@mariainfluenciadora',
            'chave_pix' => 'maria@example.com',
            'cidade' => 'São Paulo',
            'uf' => 'SP',
            'consentimento_aceito' => true,
        ], $overrides);
    }

    public function test_cnpj_com_digito_verificador_invalido_e_rejeitado(): void
    {
        $response = $this->postJson('/api/parceiras/cadastro', $this->dadosCadastroValidos(['cnpj' => '11.111.111/1111-11']));

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('cnpj');
    }

    public function test_cnpj_valido_e_aceito_e_armazenado_so_com_digitos(): void
    {
        $response = $this->postJson('/api/parceiras/cadastro', $this->dadosCadastroValidos(['cnpj' => '11.222.333/0001-81']));

        $response->assertCreated();
        $response->assertJsonPath('data.cnpj', '11222333000181');
    }

    public function test_telefone_sem_ddd_e_rejeitado(): void
    {
        $response = $this->postJson('/api/parceiras/cadastro', $this->dadosCadastroValidos(['telefone' => '988887777']));

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('telefone');
    }

    public function test_cep_preenche_endereco_automaticamente_quando_rua_nao_informada(): void
    {
        Http::fake([
            'viacep.com.br/*' => Http::response([
                'logradouro' => 'Av. Paulista',
                'bairro' => 'Bela Vista',
                'localidade' => 'São Paulo',
                'uf' => 'SP',
            ], 200),
        ]);
        $response = $this->postJson('/api/parceiras/cadastro', $this->dadosCadastroValidos(['cep' => '01310-100']));

        $response->assertCreated();
        $response->assertJsonPath('data.rua', 'Av. Paulista');
        $response->assertJsonPath('data.bairro', 'Bela Vista');
    }

    public function test_falha_no_servico_de_cep_nao_bloqueia_o_cadastro(): void
    {
        Http::fake([
            'viacep.com.br/*' => Http::response([], 500),
        ]);
        $response = $this->postJson('/api/parceiras/cadastro', $this->dadosCadastroValidos(['cep' => '01310-100']));

        $response->assertCreated();
    }
}
