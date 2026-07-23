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

    public function isConfigured(): bool
    {
        return filled(config('services.google_drive.client_id'))
            && filled(config('services.google_drive.client_secret'))
            && filled(config('services.google_drive.refresh_token'))
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
                // Pasta comum no Meu Drive da conta dedicada (ADR-017 adendo
                // 2026-07-22), não Shared Drive: elafashionmkt@gmail.com é
                // conta pessoal, sem Google Workspace, e Shared Drives são
                // recurso exclusivo de Workspace. supportsAllDrives/
                // includeItemsFromAllDrives ficam como flags inofensivas
                // (sem efeito num Meu Drive comum), sem corpora=drive/driveId
                // — que exigiriam um Shared Drive inexistente.
                'supportsAllDrives' => 'true',
                'includeItemsFromAllDrives' => 'true',
            ])
            ->throw()
            ->json();

        if (! empty($found['files'])) {
            return $found['files'][0]['id'];
        }

        $created = Http::withToken($this->accessToken())
            ->post(self::API_URL.'/files?supportsAllDrives=true', [
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
            ->post(self::UPLOAD_URL.'?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true')
            ->throw()
            ->json();

        return [
            'id' => $response['id'],
            'url' => $response['webViewLink'] ?? "https://drive.google.com/file/d/{$response['id']}/view",
        ];
    }

    /**
     * @return array{id: string, name: string, mimeType: string}
     */
    public function getFile(string $id): array
    {
        return Http::withToken($this->accessToken())
            ->get(self::API_URL."/files/{$id}", [
                'fields' => 'id, name, mimeType',
                'supportsAllDrives' => 'true',
            ])
            ->throw()
            ->json();
    }

    public function downloadFile(string $id): string
    {
        return Http::withToken($this->accessToken())
            ->get(self::API_URL."/files/{$id}", [
                'alt' => 'media',
                'supportsAllDrives' => 'true',
            ])
            ->throw()
            ->body();
    }

    public function deleteFile(string $id): void
    {
        Http::withToken($this->accessToken())
            ->delete(self::API_URL."/files/{$id}", [
                'supportsAllDrives' => 'true',
            ])
            ->throw();
    }

    public function accessToken(): string
    {
        return Cache::remember('google_drive_access_token', 3300, function () {
            // Conta dedicada via refresh_token (ADR-017) — não Service
            // Account, para não esbarrar em
            // iam.disableServiceAccountKeyCreation em elafashionmkt-org, e
            // não Workspace, já que a conta usada é pessoal (Gmail comum) —
            // ver ADR-017 adendo 2026-07-22.
            $response = Http::asForm()->post(self::TOKEN_URL, [
                'grant_type' => 'refresh_token',
                'client_id' => config('services.google_drive.client_id'),
                'client_secret' => config('services.google_drive.client_secret'),
                'refresh_token' => config('services.google_drive.refresh_token'),
            ])->throw()->json();

            return $response['access_token'];
        });
    }
}
