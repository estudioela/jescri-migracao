<?php

namespace Tests\Feature;

use App\Models\Briefing;
use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BriefingTest extends TestCase
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

    public function test_rotas_de_briefing_exigem_autenticacao(): void
    {
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $this->getJson("/api/participacoes/{$participacao->id}/briefing")->assertUnauthorized();
        $this->postJson("/api/participacoes/{$participacao->id}/briefing", [])->assertUnauthorized();
    }

    public function test_usuario_sem_role_admin_nao_pode_criar_briefing(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefing", [
            'orientacoes' => 'Usar tons pastel, sem logo concorrente.',
            'prazo' => '2026-08-01',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_pode_criar_briefing_para_uma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefing", [
            'orientacoes' => 'Usar tons pastel, sem logo concorrente.',
            'prazo' => '2026-08-01',
            'entregaveis_esperados' => '2 reels e 1 carrossel com o produto em uso.',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.participacao_id', $participacao->id);
        $response->assertJsonPath('data.prazo', '2026-08-01');
        $this->assertDatabaseHas('briefings', [
            'participacao_id' => $participacao->id,
            'orientacoes' => 'Usar tons pastel, sem logo concorrente.',
        ]);
    }

    public function test_nao_pode_criar_dois_briefings_para_a_mesma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        Briefing::factory()->create(['participacao_id' => $participacao->id]);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefing", [
            'orientacoes' => 'Outra orientação.',
            'prazo' => '2026-08-10',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('participacao_id');
        $this->assertDatabaseCount('briefings', 1);
    }

    public function test_orientacoes_e_prazo_sao_obrigatorios_na_criacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefing", []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['orientacoes', 'prazo']);
    }

    public function test_qualquer_autenticado_pode_ver_o_briefing_de_uma_participacao(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $participacao = ParticipacaoNaCampanha::factory()->create();
        Briefing::factory()->create(['participacao_id' => $participacao->id]);

        $response = $this->getJson("/api/participacoes/{$participacao->id}/briefing");

        $response->assertOk();
        $response->assertJsonPath('data.participacao_id', $participacao->id);
    }

    public function test_ver_briefing_inexistente_retorna_404(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->getJson("/api/participacoes/{$participacao->id}/briefing");

        $response->assertNotFound();
    }

    public function test_admin_pode_editar_briefing_existente(): void
    {
        $this->autenticarComoAdmin();
        $briefing = Briefing::factory()->create(['orientacoes' => 'Original']);

        $response = $this->patchJson("/api/briefings/{$briefing->id}", [
            'orientacoes' => 'Atualizada',
            'prazo' => '2026-09-01',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.orientacoes', 'Atualizada');
        $response->assertJsonPath('data.prazo', '2026-09-01');
    }

    public function test_usuario_sem_role_admin_nao_pode_editar_briefing(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $briefing = Briefing::factory()->create();

        $response = $this->patchJson("/api/briefings/{$briefing->id}", [
            'orientacoes' => 'Tentativa não autorizada',
        ]);

        $response->assertForbidden();
    }
}
