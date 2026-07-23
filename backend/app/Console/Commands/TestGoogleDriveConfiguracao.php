<?php

namespace App\Console\Commands;

use App\Services\GoogleDriveService;
use Closure;
use Illuminate\Console\Command;
use Illuminate\Http\UploadedFile;
use RuntimeException;
use Throwable;

class TestGoogleDriveConfiguracao extends Command
{
    protected $signature = 'google-drive:test';

    protected $description = 'Valida toda a configuração do Google Drive (env, OAuth, pastas, escrita, upload, leitura, exclusão) antes do primeiro upload real';

    /** @var array<int, array{nome: string, ok: bool, detalhe: string}> */
    private array $resultados = [];

    public function __construct(private readonly GoogleDriveService $drive)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Diagnóstico de configuração do Google Drive');
        $this->newLine();

        if (! $this->passo('Variáveis de ambiente', function () {
            if (! $this->drive->isConfigured()) {
                throw new RuntimeException('GOOGLE_DRIVE_CLIENT_ID/_CLIENT_SECRET/_REFRESH_TOKEN/_ROOT_FOLDER_ID ausentes.');
            }

            return 'client_id/client_secret/refresh_token/root_folder_id presentes.';
        })) {
            return $this->relatorioFinal();
        }

        if (! $this->passo('Obtenção do access token', function () {
            $this->drive->accessToken();

            return 'Token obtido e cacheado via refresh_token.';
        })) {
            return $this->relatorioFinal();
        }

        $rootId = $this->drive->rootFolderId();

        if (! $this->passo('Acesso à pasta ROOT', function () use ($rootId) {
            $pasta = $this->drive->getFile($rootId);

            return "Pasta \"{$pasta['name']}\" acessível (id={$rootId}).";
        })) {
            return $this->relatorioFinal();
        }

        $backupId = null;

        if (! $this->passo('Existência/criação da pasta BACKUP', function () use ($rootId, &$backupId) {
            $configurado = (string) config('services.google_drive.backup_folder_id');

            if ($configurado !== '') {
                $pasta = $this->drive->getFile($configurado);
                $backupId = $configurado;

                return "Pasta BACKUP configurada e acessível: \"{$pasta['name']}\" (id={$configurado}).";
            }

            $backupId = $this->drive->ensureFolder($rootId, 'Backup');

            return "GOOGLE_DRIVE_BACKUP_FOLDER_ID não configurado; pasta \"Backup\" localizada/criada agora (id={$backupId}). Adicione esse valor ao .env.";
        })) {
            return $this->relatorioFinal();
        }

        $diagFolderId = null;

        if (! $this->passo('Permissão de escrita', function () use ($backupId, &$diagFolderId) {
            $diagFolderId = $this->drive->ensureFolder($backupId, 'tear-diagnostico');

            return "Subpasta de diagnóstico criada/reaproveitada dentro de BACKUP (id={$diagFolderId}).";
        })) {
            return $this->relatorioFinal();
        }

        $arquivoId = null;
        $conteudo = 'Diagnóstico TEAR — '.now()->toIso8601String();

        if (! $this->passo('Upload de arquivo temporário', function () use ($diagFolderId, &$arquivoId, $conteudo) {
            $caminho = tempnam(sys_get_temp_dir(), 'tear_drive_diag_');
            file_put_contents($caminho, $conteudo);

            $arquivo = new UploadedFile($caminho, 'diagnostico.txt', 'text/plain', null, true);
            $resultado = $this->drive->uploadFile($diagFolderId, $arquivo);
            $arquivoId = $resultado['id'];

            @unlink($caminho);

            return "Arquivo enviado (id={$arquivoId}): {$resultado['url']}";
        })) {
            return $this->relatorioFinal();
        }

        // Leitura e exclusão rodam mesmo se uma delas falhar, para não
        // deixar lixo de diagnóstico no Drive quando só a leitura falha.
        $this->passo('Leitura do arquivo', function () use ($arquivoId, $conteudo) {
            $lido = $this->drive->downloadFile($arquivoId);

            if ($lido !== $conteudo) {
                throw new RuntimeException('Conteúdo lido não confere com o conteúdo enviado.');
            }

            return 'Conteúdo lido confere byte a byte com o conteúdo enviado.';
        });

        $this->passo('Exclusão do arquivo', function () use ($arquivoId) {
            $this->drive->deleteFile($arquivoId);

            return 'Arquivo de diagnóstico removido do Drive.';
        });

        return $this->relatorioFinal();
    }

    private function passo(string $nome, Closure $acao): bool
    {
        try {
            $detalhe = $acao();
            $this->line("  <fg=green>✓</> {$nome} — {$detalhe}");
            $this->resultados[] = ['nome' => $nome, 'ok' => true, 'detalhe' => $detalhe];

            return true;
        } catch (Throwable $e) {
            $this->line("  <fg=red>✗</> {$nome} — {$e->getMessage()}");
            $this->resultados[] = ['nome' => $nome, 'ok' => false, 'detalhe' => $e->getMessage()];

            return false;
        }
    }

    private function relatorioFinal(): int
    {
        $falhas = array_filter($this->resultados, fn (array $r) => ! $r['ok']);

        $this->newLine();
        $this->info('Relatório final:');

        foreach ($this->resultados as $r) {
            $simbolo = $r['ok'] ? 'OK   ' : 'FALHA';
            $this->line("  [{$simbolo}] {$r['nome']}");
        }

        if ($falhas !== []) {
            $this->newLine();
            $this->error(count($falhas).' etapa(s) falharam. Corrija antes do primeiro upload real.');

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Todas as etapas passaram. Configuração pronta para uso real.');

        return self::SUCCESS;
    }
}
