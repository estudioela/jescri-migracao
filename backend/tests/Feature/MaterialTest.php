<?php

namespace Tests\Feature;

use App\Models\Briefing;
use App\Models\Material;
use App\Models\Parceira;
use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MaterialTest extends TestCase
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

    public function test_rotas_de_material_exigem_autenticacao(): void
    {
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $this->getJson("/api/participacoes/{$participacao->id}/materiais")->assertUnauthorized();
        $this->postJson("/api/participacoes/{$participacao->id}/materiais", [])->assertUnauthorized();
    }

    public function test_usuario_sem_posse_nem_role_admin_nao_pode_enviar_material(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $briefing = Briefing::factory()->create(['participacao_id' => $participacao->id, 'tipo' => 'REELS']);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", [
            'briefing_id' => $briefing->id,
            'arquivo' => UploadedFile::fake()->create('video.mp4', 500),
        ]);

        $response->assertForbidden();
    }

    public function test_dona_da_participacao_ativa_pode_enviar_material(): void
    {
        config([
            'services.google_drive.client_id' => 'tear-drive-uploader.apps.googleusercontent.com',
            'services.google_drive.client_secret' => 'fake-client-secret',
            'services.google_drive.refresh_token' => 'fake-refresh-token',
            'services.google_drive.root_folder_id' => 'root-folder-id',
        ]);

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/drive/v3/files*' => Http::sequence()
                ->push(['files' => []], 200)
                ->push(['id' => 'pasta-parceira'], 200)
                ->push(['files' => []], 200)
                ->push(['id' => 'pasta-campanha'], 200)
                ->push(['files' => []], 200)
                ->push(['id' => 'pasta-tipo'], 200),
            'www.googleapis.com/upload/drive/v3/files*' => Http::response([
                'id' => 'arquivo-drive-1',
                'webViewLink' => 'https://drive.google.com/file/d/arquivo-drive-1/view',
            ], 200),
        ]);

        $user = User::factory()->create();
        $parceira = Parceira::factory()->create(['status' => 'Ativa']);
        $parceira->vincularUsuario($user);
        $participacao = ParticipacaoNaCampanha::factory()->create([
            'parceira_id' => $parceira->id,
            'status' => 'ATIVA',
        ]);
        $briefing = Briefing::factory()->create(['participacao_id' => $participacao->id, 'tipo' => 'REELS']);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", [
            'briefing_id' => $briefing->id,
            'arquivo' => UploadedFile::fake()->create('video.mp4', 500),
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('materiais', [
            'participacao_id' => $participacao->id,
            'briefing_id' => $briefing->id,
            'tipo' => 'REELS',
        ]);
    }

    public function test_influenciadora_nao_pode_enviar_material_de_participacao_alheia(): void
    {
        $user = User::factory()->create();
        $parceira = Parceira::factory()->create(['status' => 'Ativa']);
        $parceira->vincularUsuario($user);

        $participacaoAlheia = ParticipacaoNaCampanha::factory()->create(['status' => 'ATIVA']);
        $briefingAlheio = Briefing::factory()->create(['participacao_id' => $participacaoAlheia->id, 'tipo' => 'REELS']);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/participacoes/{$participacaoAlheia->id}/materiais", [
            'briefing_id' => $briefingAlheio->id,
            'arquivo' => UploadedFile::fake()->create('video.mp4', 500),
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('materiais', 0);
    }

    public function test_influenciadora_nao_pode_enviar_material_de_participacao_cancelada(): void
    {
        $user = User::factory()->create();
        $parceira = Parceira::factory()->create(['status' => 'Ativa']);
        $parceira->vincularUsuario($user);
        $participacao = ParticipacaoNaCampanha::factory()->create([
            'parceira_id' => $parceira->id,
            'status' => 'CANCELADA',
        ]);
        $briefing = Briefing::factory()->create(['participacao_id' => $participacao->id, 'tipo' => 'REELS']);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", [
            'briefing_id' => $briefing->id,
            'arquivo' => UploadedFile::fake()->create('video.mp4', 500),
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('materiais', 0);
    }

    /**
     * P0 (auditoria de Go-Live): o fallback para Storage::disk('public')
     * gravava material de influenciadora em disco público sem autenticação
     * enquanto o Drive não estivesse configurado. Removido — sem Drive
     * configurado, o upload falha explicitamente (503) em vez de expor o
     * arquivo publicamente ou de simular sucesso.
     */
    public function test_upload_retorna_503_quando_drive_nao_esta_configurado(): void
    {
        config(['services.google_drive.client_id' => null]);

        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        $briefing = Briefing::factory()->create(['participacao_id' => $participacao->id, 'tipo' => 'REELS']);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", [
            'briefing_id' => $briefing->id,
            'arquivo' => UploadedFile::fake()->create('video.mp4', 500),
        ]);

        $response->assertStatus(503);
        $this->assertDatabaseCount('materiais', 0);
    }

    public function test_briefing_de_outra_participacao_e_rejeitado(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        $briefingAlheio = Briefing::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", [
            'briefing_id' => $briefingAlheio->id,
            'arquivo' => UploadedFile::fake()->create('video.mp4', 500),
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('briefing_id');
    }

    public function test_admin_pode_enviar_material_com_drive_configurado(): void
    {
        config([
            'services.google_drive.client_id' => 'tear-drive-uploader.apps.googleusercontent.com',
            'services.google_drive.client_secret' => 'fake-client-secret',
            'services.google_drive.refresh_token' => 'fake-refresh-token',
            'services.google_drive.root_folder_id' => 'root-folder-id',
        ]);

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/drive/v3/files*' => Http::sequence()
                ->push(['files' => []], 200) // busca pasta da parceira: não encontrada
                ->push(['id' => 'pasta-parceira'], 200) // cria pasta da parceira
                ->push(['files' => []], 200) // busca pasta da campanha: não encontrada
                ->push(['id' => 'pasta-campanha'], 200) // cria pasta da campanha
                ->push(['files' => []], 200) // busca pasta do tipo: não encontrada
                ->push(['id' => 'pasta-tipo'], 200), // cria pasta do tipo
            'www.googleapis.com/upload/drive/v3/files*' => Http::response([
                'id' => 'arquivo-drive-1',
                'webViewLink' => 'https://drive.google.com/file/d/arquivo-drive-1/view',
            ], 200),
        ]);

        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        $briefing = Briefing::factory()->create(['participacao_id' => $participacao->id, 'tipo' => 'REELS']);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", [
            'briefing_id' => $briefing->id,
            'arquivo' => UploadedFile::fake()->create('video.mp4', 500),
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.drive_file_url', 'https://drive.google.com/file/d/arquivo-drive-1/view');
        $this->assertDatabaseHas('materiais', [
            'participacao_id' => $participacao->id,
            'drive_file_id' => 'arquivo-drive-1',
            'drive_file_url' => 'https://drive.google.com/file/d/arquivo-drive-1/view',
        ]);
    }

    /**
     * P0 (auditoria de Go-Live): StoreMaterialRequest não tinha whitelist de
     * MIME — qualquer tipo de arquivo era aceito. Restrito a imagens/vídeos.
     */
    public function test_tipo_de_arquivo_fora_da_whitelist_e_rejeitado(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        $briefing = Briefing::factory()->create(['participacao_id' => $participacao->id, 'tipo' => 'REELS']);

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", [
            'briefing_id' => $briefing->id,
            'arquivo' => UploadedFile::fake()->create('script.php', 10),
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['arquivo']);
        $this->assertDatabaseCount('materiais', 0);
    }

    public function test_briefing_id_e_arquivo_sao_obrigatorios_na_criacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['briefing_id', 'arquivo']);
    }

    public function test_admin_pode_listar_materiais_de_uma_participacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();
        Material::factory()->count(2)->create(['participacao_id' => $participacao->id]);

        $response = $this->getJson("/api/participacoes/{$participacao->id}/materiais");

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
    }

    public function test_admin_pode_aprovar_material_pendente(): void
    {
        $admin = $this->autenticarComoAdmin();
        $material = Material::factory()->create();

        $response = $this->patchJson("/api/materiais/{$material->id}/aprovar");

        $response->assertOk();
        $response->assertJsonPath('data.status', 'APROVADO');
        $this->assertDatabaseHas('materiais', [
            'id' => $material->id,
            'status' => 'APROVADO',
            'aprovado_por' => $admin->id,
        ]);
    }

    public function test_admin_pode_reprovar_material_pendente_com_motivo(): void
    {
        $admin = $this->autenticarComoAdmin();
        $material = Material::factory()->create();

        $response = $this->patchJson("/api/materiais/{$material->id}/reprovar", [
            'motivo' => 'Marca concorrente aparece no vídeo.',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'REPROVADO');
        $response->assertJsonPath('data.motivo_reprovacao', 'Marca concorrente aparece no vídeo.');
        $this->assertDatabaseHas('materiais', [
            'id' => $material->id,
            'status' => 'REPROVADO',
            'aprovado_por' => $admin->id,
        ]);
    }

    public function test_reprovar_sem_motivo_e_rejeitado(): void
    {
        $this->autenticarComoAdmin();
        $material = Material::factory()->create();

        $response = $this->patchJson("/api/materiais/{$material->id}/reprovar", []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('motivo');
    }

    public function test_nao_pode_avaliar_material_ja_avaliado(): void
    {
        $this->autenticarComoAdmin();
        $material = Material::factory()->create(['status' => 'APROVADO']);

        $response = $this->patchJson("/api/materiais/{$material->id}/aprovar");

        $response->assertStatus(409);
    }

    public function test_usuario_sem_role_admin_nao_pode_aprovar_material(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $material = Material::factory()->create();

        $response = $this->patchJson("/api/materiais/{$material->id}/aprovar");

        $response->assertForbidden();
    }
}
