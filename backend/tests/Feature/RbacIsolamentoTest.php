<?php

namespace Tests\Feature;

use App\Models\Briefing;
use App\Models\Campanha;
use App\Models\Material;
use App\Models\Pagamento;
use App\Models\Parceira;
use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacIsolamentoTest extends TestCase
{
    use RefreshDatabase;

    public function test_influenciadora_nao_acessa_dado_de_outra_parceira(): void
    {
        $userA = User::factory()->create();
        $parceiraA = Parceira::factory()->create(['status' => 'Ativa']);
        $parceiraA->vincularUsuario($userA);

        $userB = User::factory()->create();
        $parceiraB = Parceira::factory()->create(['status' => 'Ativa']);
        $parceiraB->vincularUsuario($userB);

        $campanha = Campanha::factory()->create();
        $participacaoB = ParticipacaoNaCampanha::factory()->create([
            'campanha_id' => $campanha->id,
            'parceira_id' => $parceiraB->id,
            'status' => 'ATIVA',
        ]);
        $briefingB = Briefing::factory()->create(['participacao_id' => $participacaoB->id]);
        $materialB = Material::factory()->create(['participacao_id' => $participacaoB->id]);
        $pagamentoB = Pagamento::factory()->create(['participacao_id' => $participacaoB->id]);

        Sanctum::actingAs($userA);

        $this->getJson("/api/parceiras/{$parceiraB->id}")->assertForbidden();
        $this->getJson("/api/campanhas/{$campanha->id}")->assertForbidden();
        $this->getJson("/api/participacoes/{$participacaoB->id}/briefings")->assertForbidden();
        $this->getJson("/api/participacoes/{$participacaoB->id}/materiais")->assertForbidden();
        $this->getJson("/api/participacoes/{$participacaoB->id}/pagamento")->assertForbidden();

        $this->assertNotNull($briefingB->id);
        $this->assertNotNull($materialB->id);
        $this->assertNotNull($pagamentoB->id);

        // A própria parceira segue acessível para a dona.
        $this->getJson("/api/parceiras/{$parceiraA->id}")->assertOk();
    }
}
