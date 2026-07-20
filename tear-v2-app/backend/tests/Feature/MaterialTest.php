<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\ParticipacaoNaCampanha;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
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

    public function test_usuario_sem_role_admin_nao_pode_enviar_material(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", [
            'tipo' => 'REELS',
            'arquivo' => UploadedFile::fake()->create('video.mp4', 500),
        ]);

        $response->assertForbidden();
    }

    public function test_admin_pode_enviar_material_sem_drive_configurado(): void
    {
        Storage::fake('public');
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", [
            'tipo' => 'REELS',
            'arquivo' => UploadedFile::fake()->create('video.mp4', 500),
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.participacao_id', $participacao->id);
        $response->assertJsonPath('data.tipo', 'REELS');
        $response->assertJsonPath('data.status', 'PENDENTE');
        $response->assertJsonPath('data.nome_arquivo', 'video.mp4');
        $this->assertNotNull($response->json('data.drive_file_url'));
        $this->assertDatabaseHas('materiais', [
            'participacao_id' => $participacao->id,
            'tipo' => 'REELS',
            'status' => 'PENDENTE',
        ]);
    }

    public function test_admin_pode_enviar_material_com_drive_configurado(): void
    {
        $resource = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($resource, $chavePrivada);
        config([
            'services.google_drive.client_email' => 'service-account@tear-test.iam.gserviceaccount.com',
            'services.google_drive.private_key' => $chavePrivada,
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

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", [
            'tipo' => 'REELS',
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

    public function test_tipo_e_arquivo_sao_obrigatorios_na_criacao(): void
    {
        $this->autenticarComoAdmin();
        $participacao = ParticipacaoNaCampanha::factory()->create();

        $response = $this->postJson("/api/participacoes/{$participacao->id}/materiais", []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['tipo', 'arquivo']);
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
