<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TestGoogleDriveConfiguracaoCommandTest extends TestCase
{
    private function configurarCredenciaisFake(): void
    {
        config([
            'services.google_drive.client_id' => 'tear-drive-uploader.apps.googleusercontent.com',
            'services.google_drive.client_secret' => 'fake-client-secret',
            'services.google_drive.refresh_token' => 'fake-refresh-token',
            'services.google_drive.root_folder_id' => 'root-folder-id',
            'services.google_drive.backup_folder_id' => 'backup-folder-id',
        ]);
    }

    public function test_falha_na_primeira_etapa_quando_variaveis_ausentes(): void
    {
        config([
            'services.google_drive.client_id' => null,
            'services.google_drive.client_secret' => null,
            'services.google_drive.refresh_token' => null,
            'services.google_drive.root_folder_id' => null,
        ]);

        $this->artisan('google-drive:test')
            ->assertFailed()
            ->expectsOutputToContain('Variáveis de ambiente');
    }

    public function test_todas_as_etapas_passam_com_drive_saudavel(): void
    {
        $this->configurarCredenciaisFake();
        $this->travelTo(Carbon::parse('2026-07-22T00:00:00+00:00'));

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/drive/v3/files/root-folder-id*' => Http::response(
                ['id' => 'root-folder-id', 'name' => 'TEAR', 'mimeType' => 'application/vnd.google-apps.folder'],
                200,
            ),
            'www.googleapis.com/drive/v3/files/backup-folder-id*' => Http::response(
                ['id' => 'backup-folder-id', 'name' => 'Backup', 'mimeType' => 'application/vnd.google-apps.folder'],
                200,
            ),
            'www.googleapis.com/drive/v3/files/arquivo-diag-id*' => Http::sequence()
                ->push('Diagnóstico TEAR — 2026-07-22T00:00:00+00:00', 200)
                ->push('', 204),
            'www.googleapis.com/drive/v3/files*' => Http::response([
                'files' => [['id' => 'diag-folder-id', 'name' => 'tear-diagnostico']],
            ], 200),
            'www.googleapis.com/upload/drive/v3/files*' => Http::response([
                'id' => 'arquivo-diag-id',
                'webViewLink' => 'https://drive.google.com/file/d/arquivo-diag-id/view',
            ], 200),
        ]);

        $this->artisan('google-drive:test')
            ->assertSuccessful()
            ->expectsOutputToContain('Todas as etapas passaram');
    }

    public function test_falha_na_etapa_de_leitura_ainda_assim_tenta_excluir(): void
    {
        $this->configurarCredenciaisFake();

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/drive/v3/files/root-folder-id*' => Http::response(
                ['id' => 'root-folder-id', 'name' => 'TEAR', 'mimeType' => 'application/vnd.google-apps.folder'],
                200,
            ),
            'www.googleapis.com/drive/v3/files/backup-folder-id*' => Http::response(
                ['id' => 'backup-folder-id', 'name' => 'Backup', 'mimeType' => 'application/vnd.google-apps.folder'],
                200,
            ),
            'www.googleapis.com/drive/v3/files/arquivo-diag-id*' => Http::sequence()
                ->push('conteudo-divergente', 200)
                ->push('', 204),
            'www.googleapis.com/drive/v3/files*' => Http::response([
                'files' => [['id' => 'diag-folder-id', 'name' => 'tear-diagnostico']],
            ], 200),
            'www.googleapis.com/upload/drive/v3/files*' => Http::response([
                'id' => 'arquivo-diag-id',
                'webViewLink' => 'https://drive.google.com/file/d/arquivo-diag-id/view',
            ], 200),
        ]);

        $this->artisan('google-drive:test')
            ->assertFailed()
            ->expectsOutputToContain('Leitura do arquivo')
            ->expectsOutputToContain('Exclusão do arquivo');

        Http::assertSent(fn ($request) => $request->method() === 'DELETE'
            && str_contains($request->url(), 'arquivo-diag-id'));
    }
}
