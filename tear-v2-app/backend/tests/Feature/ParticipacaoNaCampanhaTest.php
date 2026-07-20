<?php

namespace Tests\Feature;

use App\Models\Campanha;
use App\Models\Parceira;
use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ParticipacaoNaCampanhaTest extends TestCase
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

    public function test_rotas_de_participacoes_exigem_autenticacao(): void
    {
        $campanha = Campanha::factory()->create();

        $this->getJson("/api/campanhas/{$campanha->id}/participacoes")->assertUnauthorized();
        $this->postJson("/api/campanhas/{$campanha->id}/participacoes", [])->assertUnauthorized();
    }

    public function test_usuario_sem_role_admin_nao_pode_vincular_parceira(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $campanha = Campanha::factory()->create();
        $parceira = Parceira::factory()->create(['status' => 'Ativa']);

        $response = $this->postJson("/api/campanhas/{$campanha->id}/participacoes", [
            'parceira_id' => $parceira->id,
        ]);

        $response->assertForbidden();
    }

    public function test_admin_pode_vincular_parceira_ativa_com_valor_e_entregaveis(): void
    {
        $this->autenticarComoAdmin();
        $campanha = Campanha::factory()->create();
        $parceira = Parceira::factory()->create(['status' => 'Ativa']);

        $response = $this->postJson("/api/campanhas/{$campanha->id}/participacoes", [
            'parceira_id' => $parceira->id,
            'valor_contratado' => 1500.50,
            'reels_qtd' => 2,
            'carrossel_qtd' => 1,
            'stories_qtd' => 4,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'ATIVA');
        $response->assertJsonPath('data.valor_contratado', 1500.5);
        $response->assertJsonPath('data.parceira.id', $parceira->id);
        $this->assertDatabaseHas('participacoes_na_campanha', [
            'campanha_id' => $campanha->id,
            'parceira_id' => $parceira->id,
            'reels_qtd' => 2,
            'carrossel_qtd' => 1,
            'stories_qtd' => 4,
        ]);
    }

    public function test_nao_pode_vincular_parceira_inativa(): void
    {
        $this->autenticarComoAdmin();
        $campanha = Campanha::factory()->create();
        $parceira = Parceira::factory()->create(['status' => 'Inativa']);

        $response = $this->postJson("/api/campanhas/{$campanha->id}/participacoes", [
            'parceira_id' => $parceira->id,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('parceira_id');
        $this->assertDatabaseMissing('participacoes_na_campanha', [
            'campanha_id' => $campanha->id,
            'parceira_id' => $parceira->id,
        ]);
    }

    public function test_nao_pode_vincular_a_mesma_parceira_duas_vezes_na_mesma_campanha(): void
    {
        $this->autenticarComoAdmin();
        $campanha = Campanha::factory()->create();
        $parceira = Parceira::factory()->create(['status' => 'Ativa']);
        ParticipacaoNaCampanha::factory()->create([
            'campanha_id' => $campanha->id,
            'parceira_id' => $parceira->id,
        ]);

        $response = $this->postJson("/api/campanhas/{$campanha->id}/participacoes", [
            'parceira_id' => $parceira->id,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('parceira_id');
    }

    public function test_mesma_parceira_pode_participar_de_campanhas_diferentes(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create(['status' => 'Ativa']);
        $campanhaA = Campanha::factory()->create();
        $campanhaB = Campanha::factory()->create();
        ParticipacaoNaCampanha::factory()->create([
            'campanha_id' => $campanhaA->id,
            'parceira_id' => $parceira->id,
        ]);

        $response = $this->postJson("/api/campanhas/{$campanhaB->id}/participacoes", [
            'parceira_id' => $parceira->id,
        ]);

        $response->assertCreated();
    }

    public function test_lista_participacoes_de_uma_campanha(): void
    {
        $this->autenticarComoAdmin();
        $campanha = Campanha::factory()->create();
        ParticipacaoNaCampanha::factory()->count(2)->create(['campanha_id' => $campanha->id]);

        $response = $this->getJson("/api/campanhas/{$campanha->id}/participacoes");

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
    }

    public function test_admin_pode_editar_condicao_comercial_e_cancelar_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create(['valor_contratado' => 1000]);

        $response = $this->patchJson("/api/participacoes/{$participacao->id}", [
            'valor_contratado' => 2000,
            'status' => 'CANCELADA',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.valor_contratado', 2000);
        $response->assertJsonPath('data.status', 'CANCELADA');
    }

    public function test_usuario_sem_role_admin_nao_pode_editar_participacao(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->patchJson("/api/participacoes/{$participacao->id}", ['status' => 'CANCELADA']);

        $response->assertForbidden();
    }
}
