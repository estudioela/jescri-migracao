<?php

namespace Tests\Feature;

use App\Models\Campanha;
use App\Models\Marca;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CampanhaTest extends TestCase
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

    public function test_rotas_de_campanhas_exigem_autenticacao(): void
    {
        $this->getJson('/api/campanhas')->assertUnauthorized();
        $this->postJson('/api/campanhas', ['nome' => 'Verão 2026'])->assertUnauthorized();
    }

    public function test_usuario_sem_role_admin_nao_pode_criar_campanha(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $marca = Marca::factory()->create();

        $response = $this->postJson('/api/campanhas', [
            'marca_id' => $marca->id,
            'nome' => 'Verão 2026',
            'data_inicio' => '2026-08-01',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_pode_criar_campanha_vinculada_a_marca(): void
    {
        $this->autenticarComoAdmin();
        $marca = Marca::factory()->create();

        $response = $this->postJson('/api/campanhas', [
            'marca_id' => $marca->id,
            'nome' => 'Verão 2026',
            'descricao' => 'Campanha de lançamento de coleção',
            'data_inicio' => '2026-08-01',
            'data_fim' => '2026-08-31',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.nome', 'Verão 2026');
        $response->assertJsonPath('data.status', 'PLANEJADA');
        $response->assertJsonPath('data.marca.id', $marca->id);
        $this->assertDatabaseHas('campanhas', [
            'marca_id' => $marca->id,
            'nome' => 'Verão 2026',
            'status' => 'PLANEJADA',
        ]);
    }

    public function test_marca_id_deve_existir(): void
    {
        $this->autenticarComoAdmin();

        $response = $this->postJson('/api/campanhas', [
            'marca_id' => 999,
            'nome' => 'Verão 2026',
            'data_inicio' => '2026-08-01',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('marca_id');
    }

    public function test_data_fim_nao_pode_ser_anterior_a_data_inicio(): void
    {
        $this->autenticarComoAdmin();
        $marca = Marca::factory()->create();

        $response = $this->postJson('/api/campanhas', [
            'marca_id' => $marca->id,
            'nome' => 'Verão 2026',
            'data_inicio' => '2026-08-31',
            'data_fim' => '2026-08-01',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('data_fim');
    }

    public function test_lista_pode_filtrar_por_marca_e_status(): void
    {
        $this->autenticarComoAdmin();
        $marcaA = Marca::factory()->create();
        $marcaB = Marca::factory()->create();
        Campanha::factory()->create(['marca_id' => $marcaA->id, 'status' => 'ATIVA']);
        Campanha::factory()->create(['marca_id' => $marcaA->id, 'status' => 'ENCERRADA']);
        Campanha::factory()->create(['marca_id' => $marcaB->id, 'status' => 'ATIVA']);

        $response = $this->getJson("/api/campanhas?marca_id={$marcaA->id}&status=ATIVA");

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
    }

    public function test_pode_ver_campanha_com_marca_e_participacoes(): void
    {
        $this->autenticarComoAdmin();
        $campanha = Campanha::factory()->create();

        $response = $this->getJson("/api/campanhas/{$campanha->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $campanha->id);
        $response->assertJsonPath('data.marca.id', $campanha->marca_id);
        $response->assertJsonPath('data.participacoes', []);
    }

    public function test_usuario_sem_role_admin_nao_pode_editar_campanha(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $campanha = Campanha::factory()->create();

        $response = $this->patchJson("/api/campanhas/{$campanha->id}", [
            'marca_id' => $campanha->marca_id,
            'nome' => 'Novo nome',
            'data_inicio' => $campanha->data_inicio->toDateString(),
        ]);

        $response->assertForbidden();
    }

    public function test_admin_pode_atualizar_status_da_campanha(): void
    {
        $this->autenticarComoAdmin();
        $campanha = Campanha::factory()->create(['status' => 'PLANEJADA']);

        $response = $this->patchJson("/api/campanhas/{$campanha->id}", [
            'marca_id' => $campanha->marca_id,
            'nome' => $campanha->nome,
            'data_inicio' => $campanha->data_inicio->toDateString(),
            'status' => 'ATIVA',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'ATIVA');
    }
}
