<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GoogleDriveService
{
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const API_URL = 'https://www.googleapis.com/drive/v3';

    private const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

    private const SCOPE = 'https://www.googleapis.com/auth/drive';

    public function isConfigured(): bool
    {
        return filled(config('services.google_drive.client_email'))
            && filled(config('services.google_drive.private_key'))
            && filled(config('services.google_drive.root_folder_id'));
    }

    public function rootFolderId(): string
    {
        return (string) config('services.google_drive.root_folder_id');
    }

    /**
     * Encontra (ou cria) uma pasta com o nome informado dentro de $parentId.
     */
    public function ensureFolder(string $parentId, string $name): string
    {
        $escaped = str_replace("'", "\\'", $name);
        $query = sprintf(
            "'%s' in parents and name = '%s' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            $parentId,
            $escaped,
        );

        $found = Http::withToken($this->accessToken())
            ->get(self::API_URL.'/files', [
                'q' => $query,
                'fields' => 'files(id, name)',
            ])
            ->throw()
            ->json();

        if (! empty($found['files'])) {
            return $found['files'][0]['id'];
        }

        $created = Http::withToken($this->accessToken())
            ->post(self::API_URL.'/files', [
                'name' => $name,
                'mimeType' => 'application/vnd.google-apps.folder',
                'parents' => [$parentId],
            ])
            ->throw()
            ->json();

        return $created['id'];
    }

    /**
     * @return array{id: string, url: string}
     */
    public function uploadFile(string $folderId, UploadedFile $file): array
    {
        $boundary = 'tear-'.bin2hex(random_bytes(16));
        $metadata = json_encode([
            'name' => $file->getClientOriginalName(),
            'parents' => [$folderId],
        ]);

        $body = "--{$boundary}\r\n"
            ."Content-Type: application/json; charset=UTF-8\r\n\r\n"
            ."{$metadata}\r\n"
            ."--{$boundary}\r\n"
            ."Content-Type: {$file->getMimeType()}\r\n\r\n"
            .file_get_contents($file->getRealPath())."\r\n"
            ."--{$boundary}--";

        $response = Http::withToken($this->accessToken())
            ->withBody($body, "multipart/related; boundary={$boundary}")
            ->post(self::UPLOAD_URL.'?uploadType=multipart&fields=id,webViewLink')
            ->throw()
            ->json();

        return [
            'id' => $response['id'],
            'url' => $response['webViewLink'] ?? "https://drive.google.com/file/d/{$response['id']}/view",
        ];
    }

    private function accessToken(): string
    {
        return Cache::remember('google_drive_access_token', 3300, function () {
            $now = time();
            $header = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $claims = $this->base64UrlEncode(json_encode([
                'iss' => config('services.google_drive.client_email'),
                'scope' => self::SCOPE,
                'aud' => self::TOKEN_URL,
                'iat' => $now,
                'exp' => $now + 3600,
            ]));

            $signature = '';
            openssl_sign(
                "{$header}.{$claims}",
                $signature,
                config('services.google_drive.private_key'),
                'sha256WithRSAEncryption',
            );

            $jwt = "{$header}.{$claims}.".$this->base64UrlEncode($signature);

            $response = Http::asForm()->post(self::TOKEN_URL, [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ])->throw()->json();

            return $response['access_token'];
        });
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
