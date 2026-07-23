<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ObterGoogleDriveRefreshToken extends Command
{
    protected $signature = 'google-drive:obter-refresh-token
        {--client-id= : Client ID do OAuth Client "Desktop app"}
        {--client-secret= : Client Secret do mesmo OAuth Client}
        {--scope=https://www.googleapis.com/auth/drive : Escopo OAuth solicitado}
        {--timeout=300 : Segundos de espera pela autorização no navegador}';

    protected $description = 'Obtém um refresh_token do Google Drive via Authorization Code + redirect loopback local (RFC 8252), sem Service Account Key — uso único, na configuração da conta dedicada (ver ADR-017 e adendo)';

    private const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    public function handle(): int
    {
        $clientId = $this->option('client-id') ?: $this->ask('GOOGLE_DRIVE_CLIENT_ID (do OAuth Client "Desktop app")');
        $clientSecret = $this->option('client-secret') ?: $this->secret('GOOGLE_DRIVE_CLIENT_SECRET (do mesmo OAuth Client)');
        $scope = (string) $this->option('scope');
        $timeout = (int) $this->option('timeout');

        if (blank($clientId) || blank($clientSecret)) {
            $this->error('client-id e client-secret são obrigatórios.');

            return self::FAILURE;
        }

        $server = @stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);

        if ($server === false) {
            $this->error("Não foi possível abrir um servidor local para o redirect: {$errstr} ({$errno})");

            return self::FAILURE;
        }

        $socketName = stream_socket_get_name($server, false);
        $port = (int) substr((string) strrchr($socketName, ':'), 1);
        $redirectUri = "http://127.0.0.1:{$port}/";
        $state = Str::random(32);

        $authUrl = self::AUTH_URL.'?'.http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => $scope,
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
        ]);

        $this->newLine();
        $this->info('1. Abra esta URL no navegador da máquina onde este comando está rodando:');
        $this->line('   '.$authUrl);
        $this->info('2. Faça login com a conta dedicada do Google Drive (não uma conta pessoal).');
        $this->info('3. Autorize o acesso solicitado.');
        $this->newLine();
        $this->info("Aguardando o redirect em {$redirectUri} (timeout: {$timeout}s)...");

        $connection = @stream_socket_accept($server, $timeout);

        if ($connection === false) {
            fclose($server);
            $this->error('Nenhum redirect recebido dentro do tempo limite. Rode o comando novamente.');

            return self::FAILURE;
        }

        $request = fread($connection, 8192) ?: '';
        preg_match('#^GET\s+/\??(\S*)\s+HTTP#', $request, $matches);
        parse_str($matches[1] ?? '', $query);

        $this->respondToBrowser($connection, isset($query['error']) || ! isset($query['code']));
        fclose($connection);
        fclose($server);

        if (isset($query['error'])) {
            $this->error('Autorização negada ou falhou: '.$query['error']);

            return self::FAILURE;
        }

        if (! isset($query['code']) || ($query['state'] ?? null) !== $state) {
            $this->error('Redirect recebido sem código válido ou com state divergente (possível interferência).');

            return self::FAILURE;
        }

        $response = Http::asForm()->post(self::TOKEN_URL, [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $query['code'],
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirectUri,
        ]);

        if ($response->failed()) {
            $this->error('Falha ao trocar o código por tokens: '.$response->body());

            return self::FAILURE;
        }

        $body = $response->json();

        if (blank($body['refresh_token'] ?? null)) {
            $this->error('Google não retornou refresh_token. Revogue o acesso anterior da conta em myaccount.google.com/permissions e rode o comando novamente (o parâmetro prompt=consent já força reconsentimento).');

            return self::FAILURE;
        }

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

    /**
     * @param  resource  $connection
     */
    private function respondToBrowser($connection, bool $failed): void
    {
        $title = $failed ? 'Falha na autorização' : 'Autorização recebida';
        $body = $failed
            ? 'Algo deu errado. Volte ao terminal para ver o erro.'
            : 'Pode fechar esta janela e voltar ao terminal.';

        $html = "<html><body><h1>{$title}</h1><p>{$body}</p></body></html>";
        $response = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: ".strlen($html)."\r\nConnection: close\r\n\r\n{$html}";

        fwrite($connection, $response);
    }
}
