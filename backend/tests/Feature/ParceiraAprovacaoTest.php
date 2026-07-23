<?php

namespace Tests\Feature;

use App\Models\Parceira;
use App\Models\User;
use App\Notifications\InfluenciadoraConviteNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ParceiraAprovacaoTest extends TestCase
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

    public function test_admin_pode_aprovar_parceira_pendente(): void
    {
        $admin = $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create();

        $response = $this->patchJson("/api/parceiras/{$parceira->id}/aprovar");

        $response->assertOk();
        $response->assertJsonPath('data.status', 'Ativa');
        $this->assertDatabaseHas('parceiras', [
            'id' => $parceira->id,
            'status' => 'Ativa',
            'aprovado_por' => $admin->id,
        ]);
        $this->assertNotNull($parceira->fresh()->aprovado_em);
    }

    public function test_usuario_sem_role_admin_nao_pode_aprovar(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $parceira = Parceira::factory()->create();

        $response = $this->patchJson("/api/parceiras/{$parceira->id}/aprovar");

        $response->assertForbidden();
        $this->assertDatabaseHas('parceiras', [
            'id' => $parceira->id,
            'status' => 'Inativa',
        ]);
    }

    public function test_aprovar_cria_usuario_influenciadora_vinculado_e_envia_convite(): void
    {
        Notification::fake();
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create(['email' => 'nova@example.com']);

        $this->patchJson("/api/parceiras/{$parceira->id}/aprovar")->assertOk();

        $parceira->refresh();
        $this->assertNotNull($parceira->user_id);
        $user = User::find($parceira->user_id);
        $this->assertTrue($user->hasRole('INFLUENCIADORA'));
        Notification::assertSentTo($user, InfluenciadoraConviteNotification::class);
    }

    public function test_visitante_nao_autenticado_nao_pode_aprovar(): void
    {
        $parceira = Parceira::factory()->create();

        $this->patchJson("/api/parceiras/{$parceira->id}/aprovar")->assertUnauthorized();
    }

    public function test_aprovar_com_email_ja_usado_por_outro_usuario_nao_corrompe_estado(): void
    {
        Notification::fake();
        $this->autenticarComoAdmin();
        User::factory()->create(['email' => 'duplicado@example.com']);
        $parceira = Parceira::factory()->create(['email' => 'duplicado@example.com', 'status' => 'Inativa']);

        $response = $this->patchJson("/api/parceiras/{$parceira->id}/aprovar");

        $response->assertStatus(422);
        $this->assertDatabaseHas('parceiras', [
            'id' => $parceira->id,
            'status' => 'Inativa',
            'user_id' => null,
            'aprovado_por' => null,
        ]);
        Notification::assertNothingSent();
    }

    public function test_aprovar_parceira_ja_ativa_retorna_conflito(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create(['status' => 'Ativa']);

        $response = $this->patchJson("/api/parceiras/{$parceira->id}/aprovar");

        $response->assertStatus(409);
    }

    public function test_admin_pode_reenviar_convite_para_parceira_ja_ativa(): void
    {
        Notification::fake();
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create(['email' => 'ja-ativa@example.com']);
        $this->patchJson("/api/parceiras/{$parceira->id}/aprovar")->assertOk();
        Notification::fake();

        $response = $this->postJson("/api/parceiras/{$parceira->id}/reenviar-convite");

        $response->assertOk();
        $user = User::find($parceira->fresh()->user_id);
        Notification::assertSentTo($user, InfluenciadoraConviteNotification::class);
    }

    public function test_reenviar_convite_para_parceira_nunca_aprovada_retorna_conflito(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create(['status' => 'Inativa']);

        $response = $this->postJson("/api/parceiras/{$parceira->id}/reenviar-convite");

        $response->assertStatus(409);
    }

    public function test_usuario_sem_role_admin_nao_pode_reenviar_convite(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $parceira = Parceira::factory()->create();

        $response = $this->postJson("/api/parceiras/{$parceira->id}/reenviar-convite");

        $response->assertForbidden();
    }

    public function test_visitante_nao_autenticado_nao_pode_reenviar_convite(): void
    {
        $parceira = Parceira::factory()->create();

        $this->postJson("/api/parceiras/{$parceira->id}/reenviar-convite")->assertUnauthorized();
    }

    public function test_lista_pode_filtrar_por_status_pendente(): void
    {
        $this->autenticarComoAdmin();
        Parceira::factory()->count(2)->create(['status' => 'Inativa']);
        Parceira::factory()->create(['status' => 'Ativa']);

        $response = $this->getJson('/api/parceiras?status=Inativa');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
    }

    public function test_filtro_de_status_invalido_e_rejeitado(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/parceiras?status=Qualquer');

        $response->assertUnprocessable();
    }
}
