<?php

namespace Tests\Feature;

use App\Models\Marca;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MarcaTest extends TestCase
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

    public function test_rotas_de_marcas_exigem_autenticacao(): void
    {
        $this->getJson('/api/marcas')->assertUnauthorized();
        $this->postJson('/api/marcas', ['nome' => 'Jescri'])->assertUnauthorized();
    }

    public function test_usuario_sem_role_admin_nao_pode_criar_marca(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/marcas', ['nome' => 'Jescri']);

        $response->assertForbidden();
    }

    public function test_admin_pode_criar_marca(): void
    {
        $this->autenticarComoAdmin();

        $response = $this->postJson('/api/marcas', [
            'nome' => 'Jescri',
            'contato_nome' => 'Equipe Jescri',
            'contato_email' => 'contato@jescri.com',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.nome', 'Jescri');
        $response->assertJsonPath('data.status', 'Ativa');
        $this->assertDatabaseHas('marcas', ['nome' => 'Jescri', 'status' => 'Ativa']);
    }

    public function test_nome_da_marca_deve_ser_unico(): void
    {
        $this->autenticarComoAdmin();
        Marca::factory()->create(['nome' => 'Jescri']);

        $response = $this->postJson('/api/marcas', ['nome' => 'Jescri']);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('nome');
    }

    public function test_usuario_sem_role_admin_nao_pode_listar_marcas(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Marca::factory()->count(2)->create();

        $response = $this->getJson('/api/marcas');

        $response->assertForbidden();
    }

    public function test_admin_pode_listar_marcas(): void
    {
        $this->autenticarComoAdmin();
        Marca::factory()->count(2)->create();

        $response = $this->getJson('/api/marcas');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
    }

    public function test_lista_pode_filtrar_por_status(): void
    {
        $this->autenticarComoAdmin();
        Marca::factory()->create(['status' => 'Ativa']);
        Marca::factory()->create(['status' => 'Inativa']);

        $response = $this->getJson('/api/marcas?status=Inativa');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
    }

    public function test_usuario_sem_role_admin_nao_pode_editar_marca(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $marca = Marca::factory()->create();

        $response = $this->patchJson("/api/marcas/{$marca->id}", ['nome' => 'Novo Nome']);

        $response->assertForbidden();
    }

    public function test_admin_pode_editar_marca(): void
    {
        $this->autenticarComoAdmin();
        $marca = Marca::factory()->create(['nome' => 'Nome Antigo']);

        $response = $this->patchJson("/api/marcas/{$marca->id}", ['nome' => 'Nome Novo']);

        $response->assertOk();
        $response->assertJsonPath('data.nome', 'Nome Novo');
    }
}
