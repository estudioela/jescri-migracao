<?php

namespace Tests\Feature;

use App\Models\HistoricoAlteracao;
use App\Models\Parceira;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class HistoricoAlteracaoTest extends TestCase
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

    public function test_admin_le_o_historico_de_alteracoes_da_parceira_mais_recente_primeiro(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create();

        $mais_antigo = HistoricoAlteracao::factory()->create([
            'parceira_id' => $parceira->id,
            'campo' => 'telefone',
        ]);
        $mais_recente = HistoricoAlteracao::factory()->create([
            'parceira_id' => $parceira->id,
            'campo' => 'nome',
        ]);

        $response = $this->getJson("/api/parceiras/{$parceira->id}/historico");

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $response->assertJsonPath('data.0.id', $mais_recente->id);
        $response->assertJsonPath('data.1.id', $mais_antigo->id);
    }

    public function test_usuario_sem_posse_nem_papel_admin_nao_acessa_historico_de_outra_parceira(): void
    {
        Role::findOrCreate('INFLUENCIADORA', 'web');
        $user = User::factory()->create();
        $user->assignRole('INFLUENCIADORA');
        Sanctum::actingAs($user);

        $parceira = Parceira::factory()->create();
        HistoricoAlteracao::factory()->create(['parceira_id' => $parceira->id]);

        $this->getJson("/api/parceiras/{$parceira->id}/historico")->assertForbidden();
    }
}
