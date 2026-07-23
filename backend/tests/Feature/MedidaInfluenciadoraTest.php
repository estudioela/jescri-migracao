<?php

namespace Tests\Feature;

use App\Models\Parceira;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MedidaInfluenciadoraTest extends TestCase
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

    public function test_nova_medida_nao_sobrescreve_a_anterior_e_medida_atual_e_a_mais_recente(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create();

        $this->postJson("/api/parceiras/{$parceira->id}/medidas", [
            'sutia_tamanho' => 'M',
            'sutia_numeracao' => '42',
        ])->assertCreated();

        $this->postJson("/api/parceiras/{$parceira->id}/medidas", [
            'sutia_tamanho' => 'G',
            'sutia_numeracao' => '44',
        ])->assertCreated();

        $this->assertDatabaseCount('medidas_influenciadora', 2);
        $this->assertSame('G', $parceira->medidaAtual()->sutia_tamanho);

        $response = $this->getJson("/api/parceiras/{$parceira->id}/medidas");
        $response->assertOk();
        $response->assertJsonCount(2, 'data');
    }

    public function test_valor_fora_do_dominio_fechado_e_rejeitado(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create();

        $response = $this->postJson("/api/parceiras/{$parceira->id}/medidas", [
            'sutia_tamanho' => 'XG',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('sutia_tamanho');
    }
}
