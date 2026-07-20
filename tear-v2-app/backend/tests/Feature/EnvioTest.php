<?php

namespace Tests\Feature;

use App\Models\Envio;
use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EnvioTest extends TestCase
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

    public function test_rotas_de_envio_exigem_autenticacao(): void
    {
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $this->getJson("/api/participacoes/{$participacao->id}/envio")->assertUnauthorized();
        $this->postJson("/api/participacoes/{$participacao->id}/envio", [])->assertUnauthorized();
    }

    public function test_usuario_sem_role_admin_nao_pode_criar_envio(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/envio", []);

        $response->assertForbidden();
    }

    public function test_admin_pode_criar_envio_pendente_por_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/envio", [
            'codigo_rastreio' => 'BR123456789',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'PENDENTE');
        $response->assertJsonPath('data.codigo_rastreio', 'BR123456789');
        $this->assertDatabaseHas('envios', [
            'participacao_id' => $participacao->id,
            'status' => 'PENDENTE',
        ]);
    }

    public function test_envio_expoe_endereco_lido_ao_vivo_da_parceira(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        $participacao->parceira->update(['cidade' => 'São Paulo', 'uf' => 'SP']);
        $envio = Envio::factory()->create(['participacao_id' => $participacao->id]);

        $response = $this->getJson("/api/participacoes/{$participacao->id}/envio");

        $response->assertOk();
        $this->assertStringContainsString('São Paulo', $response->json('data.endereco_completo'));
    }

    public function test_nao_persiste_dado_de_endereco_na_tabela_de_envio(): void
    {
        $this->assertFalse(Schema::hasColumn('envios', 'endereco_completo'));
        $this->assertFalse(Schema::hasColumn('envios', 'cep'));
    }

    public function test_admin_pode_avancar_status_ate_entregue(): void
    {
        $this->autenticarComoAdmin();
        $envio = Envio::factory()->create();

        $this->patchJson("/api/envios/{$envio->id}", ['status' => 'EXPEDIDO'])
            ->assertOk()
            ->assertJsonPath('data.status', 'EXPEDIDO');

        $this->patchJson("/api/envios/{$envio->id}", ['status' => 'ENTREGUE'])
            ->assertOk()
            ->assertJsonPath('data.status', 'ENTREGUE');
    }

    public function test_nao_pode_criar_dois_envios_para_a_mesma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        Envio::factory()->create(['participacao_id' => $participacao->id]);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/envio", []);

        $response->assertUnprocessable();
    }
}
