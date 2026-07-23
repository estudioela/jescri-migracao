<?php

namespace Tests\Feature;

use App\Models\Briefing;
use App\Models\Pagamento;
use App\Models\Parceira;
use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Sprint 2.1 — Portal da Influenciadora (dashboard + perfil).
 * Cobre especificamente o isolamento entre duas influenciadoras reais nas
 * rotas novas/reabertas desta entrega (/me/parceira, PATCH /parceiras/{id}
 * agora fechado, medidas por posse) — mesmo padrão de RbacIsolamentoTest.
 */
class PortalIsolamentoTest extends TestCase
{
    use RefreshDatabase;

    public function test_influenciadora_nunca_edita_cadastro_de_outra_influenciadora(): void
    {
        $userA = User::factory()->create();
        $parceiraA = Parceira::factory()->create(['status' => 'Ativa']);
        $parceiraA->vincularUsuario($userA);

        $userB = User::factory()->create();
        $parceiraB = Parceira::factory()->create(['status' => 'Ativa', 'nome' => 'Parceira B']);
        $parceiraB->vincularUsuario($userB);

        Sanctum::actingAs($userA);

        $response = $this->putJson("/api/parceiras/{$parceiraB->id}", [
            'nome' => 'Nome Sequestrado',
            'email' => 'b@example.com',
            'telefone' => '(11) 98888-7777',
            'instagram' => '@b',
            'chave_pix' => 'b@example.com',
            'cidade' => 'São Paulo',
            'uf' => 'SP',
            'consentimento_aceito' => true,
        ]);

        $response->assertForbidden();
        $this->assertSame('Parceira B', $parceiraB->fresh()->nome);
    }

    public function test_influenciadora_nunca_le_ou_grava_medidas_de_outra_influenciadora(): void
    {
        $userA = User::factory()->create();
        $parceiraA = Parceira::factory()->create(['status' => 'Ativa']);
        $parceiraA->vincularUsuario($userA);

        $userB = User::factory()->create();
        $parceiraB = Parceira::factory()->create(['status' => 'Ativa']);
        $parceiraB->vincularUsuario($userB);

        Sanctum::actingAs($userA);

        $this->getJson("/api/parceiras/{$parceiraB->id}/medidas")->assertForbidden();
        $this->postJson("/api/parceiras/{$parceiraB->id}/medidas", ['sutia_tamanho' => 'M'])
            ->assertForbidden();
        $this->assertDatabaseCount('medidas_influenciadora', 0);
    }

    public function test_me_parceira_retorna_sempre_a_propria_parceira_da_sessao(): void
    {
        $userA = User::factory()->create();
        $parceiraA = Parceira::factory()->create(['status' => 'Ativa', 'nome' => 'Parceira A']);
        $parceiraA->vincularUsuario($userA);

        Parceira::factory()->create(['status' => 'Ativa', 'nome' => 'Parceira B']);

        Sanctum::actingAs($userA);

        $response = $this->getJson('/api/me/parceira');

        $response->assertOk();
        $response->assertJsonPath('data.id', $parceiraA->id);
        $response->assertJsonPath('data.nome', 'Parceira A');
    }

    /**
     * Sprint 2.2 — Campanhas/Briefing/Materiais/Pagamento no Portal. Estas
     * três rotas (campanha, briefing, pagamento) são consumidas pela mesma
     * tela (`PortalCampanhaDetailPage`) e reaproveitam
     * `ParticipacaoNaCampanhaPolicy::view`/`CampanhaPolicy::view` — cobertura
     * equivalente à que já existe para Material, fechando o mesmo tipo de
     * isolamento para as demais abas da tela.
     */
    public function test_influenciadora_nao_ve_campanha_de_participacao_alheia(): void
    {
        $userA = User::factory()->create();
        $parceiraA = Parceira::factory()->create(['status' => 'Ativa']);
        $parceiraA->vincularUsuario($userA);

        $parceiraB = Parceira::factory()->create(['status' => 'Ativa']);
        $participacaoB = ParticipacaoNaCampanha::factory()->create([
            'parceira_id' => $parceiraB->id,
            'status' => 'ATIVA',
        ]);

        Sanctum::actingAs($userA);

        $this->getJson("/api/campanhas/{$participacaoB->campanha_id}")->assertForbidden();
        $this->assertJsonMissingCampanhaAlheia($participacaoB);
    }

    public function test_influenciadora_nao_le_briefing_de_participacao_alheia(): void
    {
        $userA = User::factory()->create();
        $parceiraA = Parceira::factory()->create(['status' => 'Ativa']);
        $parceiraA->vincularUsuario($userA);

        $parceiraB = Parceira::factory()->create(['status' => 'Ativa']);
        $participacaoB = ParticipacaoNaCampanha::factory()->create([
            'parceira_id' => $parceiraB->id,
            'status' => 'ATIVA',
        ]);
        Briefing::factory()->create(['participacao_id' => $participacaoB->id]);

        Sanctum::actingAs($userA);

        $this->getJson("/api/participacoes/{$participacaoB->id}/briefings")->assertForbidden();
    }

    public function test_influenciadora_nao_ve_pagamento_de_participacao_alheia(): void
    {
        $userA = User::factory()->create();
        $parceiraA = Parceira::factory()->create(['status' => 'Ativa']);
        $parceiraA->vincularUsuario($userA);

        $parceiraB = Parceira::factory()->create(['status' => 'Ativa']);
        $participacaoB = ParticipacaoNaCampanha::factory()->create([
            'parceira_id' => $parceiraB->id,
            'status' => 'ATIVA',
        ]);
        Pagamento::factory()->create(['participacao_id' => $participacaoB->id]);

        Sanctum::actingAs($userA);

        $this->getJson("/api/participacoes/{$participacaoB->id}/pagamento")->assertForbidden();
    }

    private function assertJsonMissingCampanhaAlheia(ParticipacaoNaCampanha $participacaoB): void
    {
        $response = $this->getJson('/api/campanhas');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertNotContains($participacaoB->campanha_id, $ids);
    }
}
