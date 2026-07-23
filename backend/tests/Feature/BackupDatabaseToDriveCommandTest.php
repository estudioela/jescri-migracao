<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\BackupFalhouNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BackupDatabaseToDriveCommandTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_falha_e_alerta_admins_quando_nenhum_arquivo_e_informado(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['email' => 'admin@producao.test']);
        Role::findOrCreate('ADMIN', 'web');
        $admin->assignRole('ADMIN');

        $this->artisan('backup:upload-to-drive')->assertFailed();

        Notification::assertSentTo($admin, BackupFalhouNotification::class);
    }

    public function test_falha_quando_drive_nao_configurado(): void
    {
        Notification::fake();
        config([
            'services.google_drive.client_id' => null,
            'services.google_drive.client_secret' => null,
            'services.google_drive.refresh_token' => null,
            'services.google_drive.root_folder_id' => null,
        ]);

        $arquivo = tempnam(sys_get_temp_dir(), 'tear_backup_').'.sql.gz';
        file_put_contents($arquivo, 'dump-fake');

        $this->artisan('backup:upload-to-drive', ['--file' => $arquivo])->assertFailed();

        unlink($arquivo);
    }

    public function test_falha_quando_pasta_de_backup_nao_configurada(): void
    {
        Notification::fake();
        $this->configurarCredenciaisFake();
        config(['services.google_drive.backup_folder_id' => null]);

        $arquivo = tempnam(sys_get_temp_dir(), 'tear_backup_').'.sql.gz';
        file_put_contents($arquivo, 'dump-fake');

        $this->artisan('backup:upload-to-drive', ['--file' => $arquivo])->assertFailed();

        unlink($arquivo);
    }

    public function test_envia_backup_com_sucesso_via_file(): void
    {
        Notification::fake();
        $this->configurarCredenciaisFake();

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/upload/drive/v3/files*' => Http::response([
                'id' => 'dump-123',
                'webViewLink' => 'https://drive.google.com/file/d/dump-123/view',
            ], 200),
        ]);

        $arquivo = tempnam(sys_get_temp_dir(), 'tear_backup_').'.sql.gz';
        file_put_contents($arquivo, 'dump-fake');

        $this->artisan('backup:upload-to-drive', ['--file' => $arquivo])->assertSuccessful();

        unlink($arquivo);
        Notification::assertNothingSent();
    }

    public function test_usa_arquivo_mais_recente_com_latest(): void
    {
        Notification::fake();
        $this->configurarCredenciaisFake();

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-token'], 200),
            'www.googleapis.com/upload/drive/v3/files*' => Http::response(['id' => 'dump-mais-novo'], 200),
        ]);

        $dir = base_path('backups');
        @mkdir($dir, recursive: true);
        $antigo = $dir.'/tear_20260101_000000.sql.gz';
        $novo = $dir.'/tear_20260201_000000.sql.gz';
        file_put_contents($antigo, 'antigo');
        file_put_contents($novo, 'novo');
        touch($antigo, time() - 100);
        touch($novo, time());

        $this->artisan('backup:upload-to-drive', ['--latest' => true])->assertSuccessful();

        Http::assertSent(fn ($request) => str_contains((string) $request->body(), 'tear_20260201_000000.sql.gz'));

        unlink($antigo);
        unlink($novo);
        rmdir($dir);
    }
}
