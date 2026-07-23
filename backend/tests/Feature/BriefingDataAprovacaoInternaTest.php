<?php

namespace Tests\Feature;

use App\Models\Briefing;
use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BriefingDataAprovacaoInternaTest extends TestCase
{
    use RefreshDatabase;

    private function autenticarComoAdmin(): void
    {
        Role::findOrCreate('ADMIN', 'web');
        $admin = User::factory()->create();
        $admin->assignRole('ADMIN');
        Sanctum::actingAs($admin);
    }

    /**
     * @return array<string, array{prazo: string, esperado: string}>
     */
    public static function casos(): array
    {
        return [
            'dia útil (segunda -7d cai numa segunda)' => ['prazo' => '2026-08-10', 'esperado' => '2026-08-03'],
            'sexta empurra para a segunda seguinte' => ['prazo' => '2026-08-14', 'esperado' => '2026-08-10'],
            'sábado empurra para a segunda seguinte' => ['prazo' => '2026-08-08', 'esperado' => '2026-08-03'],
            'domingo empurra para a segunda seguinte' => ['prazo' => '2026-08-09', 'esperado' => '2026-08-03'],
        ];
    }

    #[DataProvider('casos')]
    public function test_calcula_data_de_aprovacao_interna_ao_criar(string $prazo, string $esperado): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create(['reels_qtd' => 1]);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefings", [
            'tipo' => 'REELS',
            'orientacoes' => 'Orientação.',
            'prazo' => $prazo,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.data_aprovacao_interna', $esperado);
    }

    public function test_recalcula_ao_editar_o_prazo(): void
    {
        $this->autenticarComoAdmin();
        $briefing = Briefing::factory()->create(['prazo' => '2026-08-10']);
        $this->assertSame('2026-08-03', $briefing->fresh()->data_aprovacao_interna->toDateString());

        $response = $this->patchJson("/api/briefings/{$briefing->id}", ['prazo' => '2026-08-14']);

        $response->assertOk();
        $response->assertJsonPath('data.data_aprovacao_interna', '2026-08-10');
    }

    public function test_data_aprovacao_interna_enviada_no_payload_e_ignorada(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create(['reels_qtd' => 1]);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/briefings", [
            'tipo' => 'REELS',
            'orientacoes' => 'Orientação.',
            'prazo' => '2026-08-10',
            'data_aprovacao_interna' => '2099-01-01',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.data_aprovacao_interna', '2026-08-03');
    }
}
