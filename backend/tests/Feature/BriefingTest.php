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

        $this->getJson("/api/participacoes/{$participacao->id}/briefings")->assertUnauthorized();
        $this->postJson("/api/participacoes/{$participacao->id}/briefings", [])->assertUnauthorized();
    }

    public function test_usuario_sem_role_admin_nao_pode_criar_briefing(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $participacao = ParticipacaoNaCampanha::factory()->create(['reels_qtd' => 2]);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefings", [
            'tipo' => 'REELS',
            'orientacoes' => 'Usar tons pastel, sem logo concorrente.',
            'prazo' => '2026-08-01',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_pode_criar_briefing_de_um_tipo_para_uma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create(['reels_qtd' => 2]);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefings", [
            'tipo' => 'REELS',
            'orientacoes' => 'Usar tons pastel, sem logo concorrente.',
            'prazo' => '2026-08-01',
            'referencias' => ['https://exemplo.com/inspiracao.png'],
            'entregaveis_esperados' => '2 reels com o produto em uso.',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.participacao_id', $participacao->id);
        $response->assertJsonPath('data.tipo', 'REELS');
        $response->assertJsonPath('data.prazo', '2026-08-01');
        $this->assertDatabaseHas('briefings', [
            'participacao_id' => $participacao->id,
            'tipo' => 'REELS',
            'orientacoes' => 'Usar tons pastel, sem logo concorrente.',
        ]);
    }

    public function test_nao_pode_criar_dois_briefings_do_mesmo_tipo_para_a_mesma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create(['reels_qtd' => 2]);
        Briefing::factory()->create(['participacao_id' => $participacao->id, 'tipo' => 'REELS']);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefings", [
            'tipo' => 'REELS',
            'orientacoes' => 'Outra orientação.',
            'prazo' => '2026-08-10',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('tipo');
        $this->assertDatabaseCount('briefings', 1);
    }

    public function test_nao_pode_criar_briefing_de_tipo_nao_contratado(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create([
            'reels_qtd' => 0,
            'carrossel_qtd' => 0,
            'stories_qtd' => 0,
            'tiktok_qtd' => 0,
            'ugc_qtd' => 0,
        ]);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefings", [
            'tipo' => 'TIKTOK',
            'orientacoes' => 'Vídeo dinâmico.',
            'prazo' => '2026-08-10',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('tipo');
    }

    public function test_pode_criar_briefings_de_tipos_diferentes_para_a_mesma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create(['reels_qtd' => 1, 'stories_qtd' => 1]);

        $this->postJson("/api/participacoes/{$participacao->id}/briefings", [
            'tipo' => 'REELS',
            'orientacoes' => 'Orientação Reels.',
            'prazo' => '2026-08-01',
        ])->assertCreated();

        $this->postJson("/api/participacoes/{$participacao->id}/briefings", [
            'tipo' => 'STORIES',
            'orientacoes' => 'Orientação Stories.',
            'prazo' => '2026-08-02',
        ])->assertCreated();

        $this->assertDatabaseCount('briefings', 2);
    }

    public function test_tipo_orientacoes_e_prazo_sao_obrigatorios_na_criacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefings", []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['tipo', 'orientacoes', 'prazo']);
    }

    public function test_admin_pode_listar_os_briefings_de_uma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create(['reels_qtd' => 1, 'stories_qtd' => 1]);
        Briefing::factory()->create(['participacao_id' => $participacao->id, 'tipo' => 'REELS']);
        Briefing::factory()->create(['participacao_id' => $participacao->id, 'tipo' => 'STORIES']);

        $response = $this->getJson("/api/participacoes/{$participacao->id}/briefings");

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
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
