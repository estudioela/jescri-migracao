<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class ObterGoogleDriveRefreshToken extends Command
{
    protected $signature = 'google-drive:obter-refresh-token
        {--client-id= : Client ID do OAuth Client "TVs and Limited Input devices"}
        {--client-secret= : Client Secret do mesmo OAuth Client}
        {--scope=https://www.googleapis.com/auth/drive : Escopo OAuth solicitado}';

    protected $description = 'Obtém um refresh_token do Google Drive via Device Authorization Grant (RFC 8628), sem Service Account Key nem servidor local de callback — uso único, na configuração da conta dedicada (ver ADR-017)';

    private const DEVICE_CODE_URL = 'https://oauth2.googleapis.com/device/code';

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    public function handle(): int
    {
        $clientId = $this->option('client-id') ?: $this->ask('GOOGLE_DRIVE_CLIENT_ID (do OAuth Client no Cloud Console)');
        $clientSecret = $this->option('client-secret') ?: $this->secret('GOOGLE_DRIVE_CLIENT_SECRET (do mesmo OAuth Client)');
        $scope = (string) $this->option('scope');

        if (blank($clientId) || blank($clientSecret)) {
            $this->error('client-id e client-secret são obrigatórios.');

            return self::FAILURE;
        }

        $device = Http::asForm()->post(self::DEVICE_CODE_URL, [
            'client_id' => $clientId,
            'scope' => $scope,
        ])->throw()->json();

        $this->newLine();
        $this->info('1. Abra esta URL em qualquer navegador (pode ser em outro computador):');
        $this->line('   '.$device['verification_url']);
        $this->info('2. Faça login com a conta dedicada do Google Drive (não uma conta pessoal).');
        $this->info('3. Digite este código quando pedido:');
        $this->line('   '.$device['user_code']);
        $this->newLine();
        $this->info('Aguardando autorização...');

        $deadline = time() + (int) $device['expires_in'];
        $interval = (int) ($device['interval'] ?? 5);

        while (time() < $deadline) {
            sleep($interval);

            $response = Http::asForm()->post(self::TOKEN_URL, [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'device_code' => $device['device_code'],
                'grant_type' => 'urn:ietf:params:oauth:grant-type:device_code',
            ]);

            $body = $response->json();

            if ($response->successful()) {
                $this->newLine();
                $this->info('Autorizado. Copie estes valores para o .env de produção:');
                $this->newLine();
                $this->line('GOOGLE_DRIVE_CLIENT_ID='.$clientId);
                $this->line('GOOGLE_DRIVE_CLIENT_SECRET='.$clientSecret);
                $this->line('GOOGLE_DRIVE_REFRESH_TOKEN='.$body['refresh_token']);
                $this->newLine();
                $this->warn('O refresh_token não é exibido de novo pelo Google. Guarde-o agora em local seguro.');

                return self::SUCCESS;
            }

            $error = $body['error'] ?? null;

            if ($error === 'authorization_pending') {
                continue;
            }

            if ($error === 'slow_down') {
                $interval += 5;

                continue;
            }

            $this->error('Falha na autorização: '.($error ?? $response->body()));

            return self::FAILURE;
        }

        $this->error('Código expirado antes da autorização. Rode o comando novamente.');

        return self::FAILURE;
    }
}
