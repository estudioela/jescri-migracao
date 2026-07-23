<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Falha de integração externa não pode impedir salvar o cadastro (RNF herdada
 * da V1) — qualquer erro aqui degrada para null, nunca lança.
 */
class CepLookupService
{
    /**
     * Preenche rua/bairro/cidade/uf a partir do CEP quando a rua ainda não
     * foi informada manualmente — nunca sobrescreve edição do usuário.
     *
     * @param  array<string, mixed>  $dados
     * @return array<string, mixed>
     */
    public function preencherEnderecoSeNecessario(array $dados): array
    {
        if (empty($dados['cep']) || ! empty($dados['rua'])) {
            return $dados;
        }

        $endereco = $this->buscar($dados['cep']);

        if ($endereco === null) {
            return $dados;
        }

        return array_merge($dados, array_filter($endereco, fn ($valor) => $valor !== null));
    }

    /**
     * @return array{rua: ?string, bairro: ?string, cidade: ?string, uf: ?string}|null
     */
    public function buscar(string $cep): ?array
    {
        $cep = preg_replace('/\D/', '', $cep);

        if (strlen($cep) !== 8) {
            return null;
        }

        try {
            $response = Http::timeout(3)->get("https://viacep.com.br/ws/{$cep}/json/");

            if (! $response->successful() || ($response->json('erro') ?? false)) {
                return null;
            }

            return [
                'rua' => $response->json('logradouro') ?: null,
                'bairro' => $response->json('bairro') ?: null,
                'cidade' => $response->json('localidade') ?: null,
                'uf' => $response->json('uf') ?: null,
            ];
        } catch (Throwable $e) {
            Log::warning('Falha ao consultar CEP', ['cep' => $cep, 'erro' => $e->getMessage()]);

            return null;
        }
    }
}
