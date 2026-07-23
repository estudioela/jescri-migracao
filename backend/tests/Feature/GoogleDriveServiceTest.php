<?php

namespace Tests\Feature;

use App\Services\GoogleDriveService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleDriveServiceTest extends TestCase
{
    private function configurarCredenciaisFake(): void
    {
        config([
            'services.google_drive.client_id' => 'tear-drive-uploader.apps.googleusercontent.com',
            'services.google_drive.client_secret' => 'fake-client-secret',
            'services.google_drive.refresh_token' => 'fake-refresh-token',
            'services.google_drive.root_folder_id' => 'root-folder-id',
        ]);
    }

    public function test_is_configured_reflete_as_quatro_variaveis_de_ambiente(): void
    {
        config([
            'services.google_drive.client_id' => null,
            'services.google_drive.client_secret' => null,
            'services.google_drive.refresh_token' => null,
            'services.google_drive.root_folder_id' => null,
        ]);
        $this->assertFalse((new GoogleDriveService)->isConfigured());

        $this->configurarCredenciaisFake();
        $this->assertTrue((new GoogleDriveService)->isConfigured());
    }

    public function test_access_token_troca_refresh_token_por_access_token(): void
    {
        $this->configurarCredenciaisFake();

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/drive/v3/files*' => Http::response([
                'files' => [['id' => 'pasta-existente', 'name' => 'Ana Teste']],
            ], 200),
        ]);

        (new GoogleDriveService)->ensureFolder('root-folder-id', 'Ana Teste');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'oauth2.googleapis.com/token')
            && $request['grant_type'] === 'refresh_token'
            && $request['refresh_token'] === 'fake-refresh-token'
            && $request['client_id'] === 'tear-drive-uploader.apps.googleusercontent.com'
            && $request['client_secret'] === 'fake-client-secret');
    }

    public function test_ensure_folder_reaproveita_pasta_existente_sem_criar_outra(): void
    {
        $this->configurarCredenciaisFake();

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/drive/v3/files*' => Http::response([
                'files' => [['id' => 'pasta-existente', 'name' => 'Ana Teste']],
            ], 200),
        ]);

        $id = (new GoogleDriveService)->ensureFolder('root-folder-id', 'Ana Teste');

        $this->assertSame('pasta-existente', $id);
        Http::assertSentCount(2); // token + busca, sem POST de criação
    }

    public function test_ensure_folder_cria_pasta_quando_nao_encontrada(): void
    {
        $this->configurarCredenciaisFake();

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/drive/v3/files*' => Http::sequence()
                ->push(['files' => []], 200)
                ->push(['id' => 'pasta-nova'], 200),
        ]);

        $id = (new GoogleDriveService)->ensureFolder('root-folder-id', 'Campanha Nova');

        $this->assertSame('pasta-nova', $id);
        Http::assertSentCount(3); // token + busca + criação
    }

    public function test_upload_file_envia_multipart_e_retorna_id_e_url(): void
    {
        $this->configurarCredenciaisFake();

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/upload/drive/v3/files*' => Http::response([
                'id' => 'arquivo-123',
                'webViewLink' => 'https://drive.google.com/file/d/arquivo-123/view',
            ], 200),
        ]);

        $arquivo = UploadedFile::fake()->create('reel.mp4', 100);

        $resultado = (new GoogleDriveService)->uploadFile('pasta-tipo', $arquivo);

        $this->assertSame('arquivo-123', $resultado['id']);
        $this->assertSame('https://drive.google.com/file/d/arquivo-123/view', $resultado['url']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'upload/drive/v3/files')
                && str_contains((string) $request->body(), 'reel.mp4');
        });
    }

    public function test_upload_file_usa_id_como_fallback_de_url_quando_web_view_link_ausente(): void
    {
        $this->configurarCredenciaisFake();

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/upload/drive/v3/files*' => Http::response(['id' => 'arquivo-456'], 200),
        ]);

        $resultado = (new GoogleDriveService)->uploadFile('pasta-tipo', UploadedFile::fake()->create('foto.jpg', 50));

        $this->assertSame('https://drive.google.com/file/d/arquivo-456/view', $resultado['url']);
    }

    public function test_access_token_e_reaproveitado_do_cache_entre_chamadas(): void
    {
        // CACHE_STORE=database em produção existe justamente para isto (ver
        // docs/CONFIGURACAO_PRODUCAO.md §1.5): sem cache, cada operação de
        // Drive buscaria um token novo, arriscando rate-limit da API do
        // Google. Duas operações independentes (instâncias novas do
        // service) devem gerar só 1 chamada ao endpoint de token.
        $this->configurarCredenciaisFake();

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/drive/v3/files*' => Http::response([
                'files' => [['id' => 'pasta-existente', 'name' => 'Ana Teste']],
            ], 200),
        ]);

        (new GoogleDriveService)->ensureFolder('root-folder-id', 'Ana Teste');
        (new GoogleDriveService)->ensureFolder('root-folder-id', 'Ana Teste');

        Http::assertSentCount(3); // 1 token (cacheado) + 2 buscas de pasta
        $chamadasDeToken = Http::recorded(fn ($request) => str_contains($request->url(), 'oauth2.googleapis.com/token'));
        $this->assertCount(1, $chamadasDeToken);
    }
}
