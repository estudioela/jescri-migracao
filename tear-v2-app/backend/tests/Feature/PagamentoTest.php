<?php

namespace Tests\Feature;

use App\Models\Pagamento;
use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PagamentoTest extends TestCase
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

    public function test_rotas_de_pagamento_exigem_autenticacao(): void
    {
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $this->getJson("/api/participacoes/{$participacao->id}/pagamento")->assertUnauthorized();
        $this->postJson("/api/participacoes/{$participacao->id}/pagamento", [])->assertUnauthorized();
    }

    public function test_usuario_sem_role_admin_nao_pode_criar_pagamento(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/pagamento", [
            'valor' => '1500.00',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_pode_criar_pagamento_para_uma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/pagamento", [
            'valor' => '1500.00',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.participacao_id', $participacao->id);
        $response->assertJsonPath('data.valor', 1500);
        $response->assertJsonPath('data.status', 'PENDENTE');
        $this->assertDatabaseHas('pagamentos', [
            'participacao_id' => $participacao->id,
            'status' => 'PENDENTE',
        ]);
    }

    public function test_nao_pode_criar_dois_pagamentos_para_a_mesma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        Pagamento::factory()->create(['participacao_id' => $participacao->id]);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/pagamento", [
            'valor' => '1500.00',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('participacao_id');
        $this->assertDatabaseCount('pagamentos', 1);
    }

    public function test_valor_e_obrigatorio_na_criacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/pagamento", []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('valor');
    }

    public function test_admin_pode_ver_o_pagamento_de_uma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        Pagamento::factory()->create(['participacao_id' => $participacao->id]);

        $response = $this->getJson("/api/participacoes/{$participacao->id}/pagamento");

        $response->assertOk();
        $response->assertJsonPath('data.participacao_id', $participacao->id);
    }

    public function test_ver_pagamento_inexistente_retorna_404(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->getJson("/api/participacoes/{$participacao->id}/pagamento");

        $response->assertNotFound();
    }

    public function test_admin_pode_aprovar_pagamento_e_registro_fica_com_auditoria(): void
    {
        $admin = $this->autenticarComoAdmin();
        $pagamento = Pagamento::factory()->create();

        $response = $this->patchJson("/api/pagamentos/{$pagamento->id}", [
            'status' => 'APROVADO',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'APROVADO');
        $this->assertDatabaseHas('pagamentos', [
            'id' => $pagamento->id,
            'status' => 'APROVADO',
            'aprovado_por' => $admin->id,
        ]);
        $this->assertNotNull($pagamento->fresh()->aprovado_em);
    }

    public function test_admin_pode_marcar_pagamento_como_pago(): void
    {
        $this->autenticarComoAdmin();
        $pagamento = Pagamento::factory()->create(['status' => 'APROVADO']);

        $response = $this->patchJson("/api/pagamentos/{$pagamento->id}", [
            'status' => 'PAGO',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'PAGO');
    }

    public function test_usuario_sem_role_admin_nao_pode_atualizar_pagamento(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $pagamento = Pagamento::factory()->create();

        $response = $this->patchJson("/api/pagamentos/{$pagamento->id}", [
            'status' => 'APROVADO',
        ]);

        $response->assertForbidden();
    }
}
