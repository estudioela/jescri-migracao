<?php

namespace App\Console\Commands;

use App\Notifications\BackupFalhouNotification;
use App\Services\GoogleDriveService;
use Illuminate\Console\Command;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Throwable;

class BackupDatabaseToDrive extends Command
{
    protected $signature = 'backup:upload-to-drive
        {--file= : Caminho do dump a enviar}
        {--latest : Usa o dump mais recente em ./backups}';

    protected $description = 'Envia um dump de backup do banco para o Google Shared Drive, alertando ADMINs por e-mail em caso de falha';

    public function __construct(private readonly GoogleDriveService $drive)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $path = $this->resolveFilePath();

        if ($path === null || ! is_file($path)) {
            $this->falhar('Nenhum arquivo de backup encontrado para envio (--file/--latest).');

            return self::FAILURE;
        }

        if (! $this->drive->isConfigured()) {
            $this->falhar("Backup {$path} não enviado: credenciais do Google Drive não configuradas.");

            return self::FAILURE;
        }

        $folderId = (string) config('services.google_drive.backup_folder_id');

        if ($folderId === '') {
            $this->falhar("Backup {$path} não enviado: GOOGLE_DRIVE_BACKUP_FOLDER_ID não configurado.");

            return self::FAILURE;
        }

        try {
            $arquivo = new UploadedFile($path, basename($path), 'application/gzip', null, true);
            $resultado = $this->drive->uploadFile($folderId, $arquivo);
        } catch (Throwable $e) {
            $this->falhar("Falha ao enviar backup {$path} para o Google Drive: {$e->getMessage()}");

            return self::FAILURE;
        }

        $this->info("Backup enviado: {$resultado['url']}");

        return self::SUCCESS;
    }

    private function resolveFilePath(): ?string
    {
        if ($file = $this->option('file')) {
            return $file;
        }

        if ($this->option('latest')) {
            $arquivos = glob(base_path('backups').'/*.sql.gz') ?: [];

            if ($arquivos === []) {
                return null;
            }

            usort($arquivos, fn ($a, $b) => filemtime($b) <=> filemtime($a));

            return $arquivos[0];
        }

        return null;
    }

    private function falhar(string $mensagem): void
    {
        $this->error($mensagem);

        $admins = Role::findOrCreate('ADMIN', 'web')->users;

        if ($admins->isEmpty()) {
            return;
        }

        Notification::send($admins, new BackupFalhouNotification($mensagem));
    }
}
