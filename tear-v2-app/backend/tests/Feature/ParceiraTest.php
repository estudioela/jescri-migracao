<?php

namespace Tests\Feature;

use App\Models\Parceira;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ParceiraTest extends TestCase
{
    use RefreshDatabase;

    private function autenticarComoAdmin(): User
    {
        Role::findOrCreate('ADMIN', 'web');

        $admin = User::factory()->create();
        $admin->assignRole('ADMIN');

        Sanctum::actingAs($admin);

        return $admin;
    }

    public function test_rotas_de_parceiras_exigem_autenticacao(): void
    {
        $this->getJson('/api/parceiras')->assertUnauthorized();
        $this->postJson('/api/parceiras', ['nome' => 'Maria'])->assertUnauthorized();
    }

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
        ], $overrides);
    }

    public function test_cadastro_cria_parceira_inativa(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/parceiras', $this->dadosCadastroValidos());

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'Inativa');
        $response->assertJsonPath('data.telefone', '11988887777');
        $response->assertJsonPath('data.instagram', '@mariainfluenciadora');
        $this->assertDatabaseHas('parceiras', [
            'nome' => 'Maria Influenciadora',
            'status' => 'Inativa',
            'telefone' => '11988887777',
            'instagram' => '@mariainfluenciadora',
        ]);
    }

    public function test_status_enviado_no_cadastro_e_ignorado(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/parceiras', $this->dadosCadastroValidos(['status' => 'Ativa']));

        $response->assertJsonPath('data.status', 'Inativa');
    }

    public function test_nome_deve_ser_unico(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Parceira::factory()->create(['nome' => 'Maria Influenciadora']);

        $response = $this->postJson('/api/parceiras', $this->dadosCadastroValidos());

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('nome');
    }

    public function test_telefone_instagram_cidade_uf_e_chave_pix_sao_obrigatorios(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/parceiras', ['nome' => 'Maria Influenciadora']);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['email', 'telefone', 'instagram', 'chave_pix', 'cidade', 'uf']);
    }

    public function test_lista_parceiras_paginada(): void
    {
        $this->autenticarComoAdmin();
        Parceira::factory()->count(3)->create();

        $response = $this->getJson('/api/parceiras');

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
    }

    public function test_pode_ver_perfil_basico_de_uma_parceira(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create();

        $response = $this->getJson("/api/parceiras/{$parceira->id}");

        $response->assertOk();
        $response->assertJsonPath('data.nome', $parceira->nome);
    }

    public function test_pode_editar_dados_cadastrais(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $parceira = Parceira::factory()->create(['nome' => 'Nome Antigo']);

        $response = $this->putJson(
            "/api/parceiras/{$parceira->id}",
            $this->dadosCadastroValidos([
                'nome' => 'Nome Novo',
                'email' => 'novo@example.com',
                'cep' => '01310-100',
                'rua' => 'Av. Paulista',
                'numero' => '1000',
                'bairro' => 'Bela Vista',
                'cidade' => 'São Paulo',
                'uf' => 'SP',
                'consentimento_aceito' => true,
            ]),
        );

        $response->assertOk();
        $response->assertJsonPath('data.nome', 'Nome Novo');
        $response->assertJsonPath('data.endereco_completo', 'Av. Paulista, 1000, Bela Vista, São Paulo, SP');
    }

    public function test_edicao_nao_altera_status(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $parceira = Parceira::factory()->create();

        $response = $this->putJson(
            "/api/parceiras/{$parceira->id}",
            $this->dadosCadastroValidos(['nome' => $parceira->nome, 'status' => 'Ativa', 'consentimento_aceito' => true]),
        );

        $response->assertJsonPath('data.status', 'Inativa');
    }
}
