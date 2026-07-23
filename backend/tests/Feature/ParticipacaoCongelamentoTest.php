<?php

namespace Tests\Feature;

use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ParticipacaoCongelamentoTest extends TestCase
{
    use RefreshDatabase;

    private function autenticarComoAdmin(): void
    {
        Role::findOrCreate('ADMIN', 'web');
        $admin = User::factory()->create();
        $admin->assignRole('ADMIN');
        Sanctum::actingAs($admin);
    }

    public function test_admin_pode_congelar_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->patchJson("/api/participacoes/{$participacao->id}/congelar");

        $response->assertOk();
        $this->assertNotNull($participacao->fresh()->congelado_em);
    }

    public function test_congelar_participacao_ja_congelada_retorna_conflito(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        $participacao->congelar();

        $response = $this->patchJson("/api/participacoes/{$participacao->id}/congelar");

        $response->assertStatus(409);
    }

    public function test_nao_pode_editar_valor_ou_quantidades_apos_congelamento(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create(['valor_contratado' => 1000]);
        $participacao->congelar();

        $response = $this->patchJson("/api/participacoes/{$participacao->id}", [
            'valor_contratado' => 2000,
        ]);

        $response->assertStatus(409);
        $this->assertEquals(1000, $participacao->fresh()->valor_contratado);
    }

    public function test_status_continua_editavel_apos_congelamento(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        $participacao->congelar();

        $response = $this->patchJson("/api/participacoes/{$participacao->id}", [
            'status' => 'CANCELADA',
        ]);

        $response->assertOk();
        $this->assertSame('CANCELADA', $participacao->fresh()->status);
    }

    public function test_edicao_livre_antes_do_congelamento(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create(['valor_contratado' => 1000]);

        $response = $this->patchJson("/api/participacoes/{$participacao->id}", [
            'valor_contratado' => 2000,
        ]);

        $response->assertOk();
        $this->assertEquals(2000, $participacao->fresh()->valor_contratado);
    }
}
