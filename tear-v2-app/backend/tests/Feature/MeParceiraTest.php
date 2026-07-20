<?php

namespace Tests\Feature;

use App\Models\Parceira;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MeParceiraTest extends TestCase
{
    use RefreshDatabase;

    public function test_influenciadora_ve_o_proprio_perfil_via_me(): void
    {
        $user = User::factory()->create();
        $parceira = Parceira::factory()->create(['nome' => 'Ana Teste']);
        $parceira->vincularUsuario($user);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/me/parceira');

        $response->assertOk();
        $response->assertJsonPath('data.id', $parceira->id);
        $response->assertJsonPath('data.nome', 'Ana Teste');
    }

    public function test_usuario_sem_parceira_vinculada_recebe_404(): void
    {
        Role::findOrCreate('ADMIN', 'web');
        $admin = User::factory()->create();
        $admin->assignRole('ADMIN');

        Sanctum::actingAs($admin);

        $this->getJson('/api/me/parceira')->assertNotFound();
    }

    public function test_rota_exige_autenticacao(): void
    {
        $this->getJson('/api/me/parceira')->assertUnauthorized();
    }
}
