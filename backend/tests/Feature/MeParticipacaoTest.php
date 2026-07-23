<?php

namespace Tests\Feature;

use App\Models\Briefing;
use App\Models\Campanha;
use App\Models\Marca;
use App\Models\Parceira;
use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MeParticipacaoTest extends TestCase
{
    use RefreshDatabase;

    private function autenticarComoInfluenciadora(): Parceira
    {
        $user = User::factory()->create();
        $parceira = Parceira::factory()->create(['status' => 'Ativa']);
        $parceira->vincularUsuario($user);
        Sanctum::actingAs($user);

        return $parceira;
    }

    public function test_rota_exige_autenticacao(): void
    {
        $this->getJson('/api/me/participacoes')->assertUnauthorized();
    }

    public function test_lista_so_as_proprias_participacoes_ativas(): void
    {
        $parceira = $this->autenticarComoInfluenciadora();
        $campanha = Campanha::factory()->for(Marca::factory())->create();
        ParticipacaoNaCampanha::factory()->create([
            'campanha_id' => $campanha->id,
            'parceira_id' => $parceira->id,
            'status' => 'ATIVA',
        ]);
        $outraCampanha = Campanha::factory()->for(Marca::factory())->create();
        ParticipacaoNaCampanha::factory()->create([
            'campanha_id' => $outraCampanha->id,
            'parceira_id' => $parceira->id,
            'status' => 'CANCELADA',
        ]);
        // participação de outra parceira - nunca deve aparecer
        ParticipacaoNaCampanha::factory()->create(['status' => 'ATIVA']);

        $response = $this->getJson('/api/me/participacoes');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.campanha.nome', $campanha->nome);
    }

    public function test_show_retorna_404_para_participacao_de_outra_parceira(): void
    {
        $this->autenticarComoInfluenciadora();
        $alheia = ParticipacaoNaCampanha::factory()->create(['status' => 'ATIVA']);

        $this->getJson("/api/me/participacoes/{$alheia->id}")->assertForbidden();
    }

    public function test_show_ordena_e_expoe_proximo_prazo_de_briefing(): void
    {
        $parceira = $this->autenticarComoInfluenciadora();
        $participacao = ParticipacaoNaCampanha::factory()->create([
            'parceira_id' => $parceira->id,
            'status' => 'ATIVA',
            'reels_qtd' => 2,
        ]);
        Briefing::factory()->create([
            'participacao_id' => $participacao->id,
            'tipo' => 'REELS',
            'prazo' => '2026-09-01',
        ]);

        $response = $this->getJson("/api/me/participacoes/{$participacao->id}");

        $response->assertOk();
        $response->assertJsonPath('data.proximo_prazo_briefing', '2026-09-01');
        $response->assertJsonPath('data.entregaveis_contratados.REELS', 2);
    }

    public function test_historico_exige_autenticacao(): void
    {
        $this->getJson('/api/me/historico')->assertUnauthorized();
    }

    public function test_historico_traz_participacao_cancelada_e_campanha_encerrada_mas_nao_a_ativa(): void
    {
        $parceira = $this->autenticarComoInfluenciadora();

        $campanhaAtiva = Campanha::factory()->for(Marca::factory())->create(['status' => 'ATIVA']);
        ParticipacaoNaCampanha::factory()->create([
            'campanha_id' => $campanhaAtiva->id,
            'parceira_id' => $parceira->id,
            'status' => 'ATIVA',
        ]);

        $campanhaEncerrada = Campanha::factory()->for(Marca::factory())->create(['status' => 'ENCERRADA']);
        ParticipacaoNaCampanha::factory()->create([
            'campanha_id' => $campanhaEncerrada->id,
            'parceira_id' => $parceira->id,
            'status' => 'ATIVA',
        ]);

        $campanhaParaCancelada = Campanha::factory()->for(Marca::factory())->create(['status' => 'ATIVA']);
        ParticipacaoNaCampanha::factory()->create([
            'campanha_id' => $campanhaParaCancelada->id,
            'parceira_id' => $parceira->id,
            'status' => 'CANCELADA',
        ]);

        // participação encerrada de outra parceira - nunca deve aparecer
        ParticipacaoNaCampanha::factory()->create([
            'campanha_id' => Campanha::factory()->for(Marca::factory())->create(['status' => 'ENCERRADA'])->id,
            'status' => 'ATIVA',
        ]);

        $response = $this->getJson('/api/me/historico');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $nomes = collect($response->json('data'))->pluck('campanha.nome');
        $this->assertTrue($nomes->contains($campanhaEncerrada->nome));
        $this->assertTrue($nomes->contains($campanhaParaCancelada->nome));
        $this->assertFalse($nomes->contains($campanhaAtiva->nome));
    }
}
