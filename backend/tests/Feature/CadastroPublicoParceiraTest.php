<?php

namespace Tests\Feature;

use App\Models\Parceira;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CadastroPublicoParceiraTest extends TestCase
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

    public function test_cadastro_publico_nao_exige_autenticacao(): void
    {
        $response = $this->postJson('/api/parceiras/cadastro', $this->dadosCadastroValidos());

        $response->assertCreated();
    }

    public function test_cadastro_publico_cria_parceira_inativa(): void
    {
        $response = $this->postJson('/api/parceiras/cadastro', $this->dadosCadastroValidos());

        $response->assertJsonPath('data.status', 'Inativa');
        $this->assertDatabaseHas('parceiras', [
            'nome' => 'Maria Influenciadora',
            'status' => 'Inativa',
        ]);
    }

    public function test_cadastro_publico_ignora_status_enviado(): void
    {
        $response = $this->postJson(
            '/api/parceiras/cadastro',
            $this->dadosCadastroValidos(['status' => 'Ativa']),
        );

        $response->assertJsonPath('data.status', 'Inativa');
    }

    public function test_cadastro_publico_valida_campos_obrigatorios(): void
    {
        $response = $this->postJson('/api/parceiras/cadastro', ['nome' => 'Maria Influenciadora']);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors([
            'email', 'telefone', 'instagram', 'chave_pix', 'cidade', 'uf', 'consentimento_aceito',
        ]);
    }

    public function test_cadastro_publico_exige_consentimento_explicito(): void
    {
        $response = $this->postJson(
            '/api/parceiras/cadastro',
            $this->dadosCadastroValidos(['consentimento_aceito' => false]),
        );

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('consentimento_aceito');
        $this->assertDatabaseMissing('parceiras', ['nome' => 'Maria Influenciadora']);
    }

    public function test_cadastro_publico_registra_consentimento_no_nascimento_do_dado(): void
    {
        $response = $this->postJson('/api/parceiras/cadastro', $this->dadosCadastroValidos());

        $response->assertCreated();

        $parceira = Parceira::where('nome', 'Maria Influenciadora')->firstOrFail();
        $this->assertNotNull($parceira->consentimento_cadastro_aceito_em);
    }

    public function test_cadastro_publico_respeita_nome_unico(): void
    {
        Parceira::factory()->create(['nome' => 'Maria Influenciadora']);

        $response = $this->postJson('/api/parceiras/cadastro', $this->dadosCadastroValidos());

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('nome');
    }

    public function test_cadastro_publico_respeita_nome_unico_ignorando_case_e_espacos(): void
    {
        Parceira::factory()->create(['nome' => 'Maria Influenciadora']);

        $response = $this->postJson(
            '/api/parceiras/cadastro',
            $this->dadosCadastroValidos(['nome' => '  maria   influenciadora  ']),
        );

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('nome');
    }

    public function test_cadastro_publico_normaliza_espacos_do_nome(): void
    {
        $response = $this->postJson(
            '/api/parceiras/cadastro',
            $this->dadosCadastroValidos(['nome' => '  Maria   Influenciadora  ']),
        );

        $response->assertCreated();
        $this->assertDatabaseHas('parceiras', ['nome' => 'Maria Influenciadora']);
    }

    public function test_cadastro_publico_nao_expoe_listagem_nem_edicao(): void
    {
        $this->getJson('/api/parceiras')->assertUnauthorized();
        $this->putJson('/api/parceiras/1', $this->dadosCadastroValidos())->assertUnauthorized();
    }
}
