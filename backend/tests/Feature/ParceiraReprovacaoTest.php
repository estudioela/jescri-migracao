<?php

namespace Tests\Feature;

use App\Models\Parceira;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ParceiraReprovacaoTest extends TestCase
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

    public function test_admin_pode_reprovar_parceira_pendente(): void
    {
        $admin = $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create();

        $response = $this->patchJson("/api/parceiras/{$parceira->id}/reprovar", [
            'motivo' => 'Dados de contato inconsistentes.',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'Inativa');
        $response->assertJsonPath('data.motivo_reprovacao', 'Dados de contato inconsistentes.');
        $this->assertDatabaseHas('parceiras', [
            'id' => $parceira->id,
            'status' => 'Inativa',
            'reprovado_por' => $admin->id,
            'motivo_reprovacao' => 'Dados de contato inconsistentes.',
        ]);
        $this->assertNotNull($parceira->fresh()->reprovado_em);
    }

    public function test_motivo_e_opcional(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create();

        $response = $this->patchJson("/api/parceiras/{$parceira->id}/reprovar");

        $response->assertOk();
        $this->assertNotNull($parceira->fresh()->reprovado_em);
    }

    public function test_usuario_sem_role_admin_nao_pode_reprovar(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $parceira = Parceira::factory()->create();

        $response = $this->patchJson("/api/parceiras/{$parceira->id}/reprovar");

        $response->assertForbidden();
        $this->assertNull($parceira->fresh()->reprovado_em);
    }

    public function test_visitante_nao_autenticado_nao_pode_reprovar(): void
    {
        $parceira = Parceira::factory()->create();

        $this->patchJson("/api/parceiras/{$parceira->id}/reprovar")->assertUnauthorized();
    }

    public function test_reprovar_parceira_ja_ativa_retorna_conflito(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create(['status' => 'Ativa']);

        $response = $this->patchJson("/api/parceiras/{$parceira->id}/reprovar");

        $response->assertStatus(409);
    }

    public function test_reprovar_parceira_ja_reprovada_retorna_conflito(): void
    {
        $admin = $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create();
        $parceira->reprovar($admin, 'Primeira reprovação.');

        $response = $this->patchJson("/api/parceiras/{$parceira->id}/reprovar", [
            'motivo' => 'Segunda tentativa.',
        ]);

        $response->assertStatus(409);
        $this->assertSame('Primeira reprovação.', $parceira->fresh()->motivo_reprovacao);
    }

    public function test_admin_ainda_pode_aprovar_parceira_previamente_reprovada(): void
    {
        $admin = $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create();
        $parceira->reprovar($admin, 'Motivo qualquer.');

        $response = $this->patchJson("/api/parceiras/{$parceira->id}/aprovar");

        $response->assertOk();
        $response->assertJsonPath('data.status', 'Ativa');
        $parceira->refresh();
        $this->assertNull($parceira->reprovado_por);
        $this->assertNull($parceira->reprovado_em);
        $this->assertNull($parceira->motivo_reprovacao);
    }
}
