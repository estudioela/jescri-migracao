<?php

namespace Tests\Feature;

use App\Models\Parceira;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ParceiraTest extends TestCase
{
    use RefreshDatabase;

    public function test_rotas_de_parceiras_exigem_autenticacao(): void
    {
        $this->getJson('/api/parceiras')->assertUnauthorized();
        $this->postJson('/api/parceiras', ['nome' => 'Maria'])->assertUnauthorized();
    }

    public function test_cadastro_cria_parceira_inativa(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/parceiras', [
            'nome' => 'Maria Influenciadora',
            'email' => 'maria@example.com',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'Inativa');
        $this->assertDatabaseHas('parceiras', [
            'nome' => 'Maria Influenciadora',
            'status' => 'Inativa',
        ]);
    }

    public function test_status_enviado_no_cadastro_e_ignorado(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/parceiras', [
            'nome' => 'Maria Influenciadora',
            'status' => 'Ativa',
        ]);

        $response->assertJsonPath('data.status', 'Inativa');
    }

    public function test_nome_deve_ser_unico(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Parceira::factory()->create(['nome' => 'Maria Influenciadora']);

        $response = $this->postJson('/api/parceiras', ['nome' => 'Maria Influenciadora']);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('nome');
    }

    public function test_lista_parceiras_paginada(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Parceira::factory()->count(3)->create();

        $response = $this->getJson('/api/parceiras');

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
    }

    public function test_pode_ver_perfil_basico_de_uma_parceira(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $parceira = Parceira::factory()->create();

        $response = $this->getJson("/api/parceiras/{$parceira->id}");

        $response->assertOk();
        $response->assertJsonPath('data.nome', $parceira->nome);
    }

    public function test_pode_editar_dados_cadastrais(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $parceira = Parceira::factory()->create(['nome' => 'Nome Antigo']);

        $response = $this->putJson("/api/parceiras/{$parceira->id}", [
            'nome' => 'Nome Novo',
            'email' => 'novo@example.com',
            'cep' => '01310-100',
            'rua' => 'Av. Paulista',
            'numero' => '1000',
            'bairro' => 'Bela Vista',
            'cidade' => 'São Paulo',
            'uf' => 'SP',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.nome', 'Nome Novo');
        $response->assertJsonPath('data.endereco_completo', 'Av. Paulista, 1000, Bela Vista, São Paulo, SP');
    }

    public function test_edicao_nao_altera_status(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $parceira = Parceira::factory()->create();

        $response = $this->putJson("/api/parceiras/{$parceira->id}", [
            'nome' => $parceira->nome,
            'status' => 'Ativa',
        ]);

        $response->assertJsonPath('data.status', 'Inativa');
    }
}
