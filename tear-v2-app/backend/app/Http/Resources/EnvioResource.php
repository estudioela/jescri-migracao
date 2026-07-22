<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnvioResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Endereço lido ao vivo do cadastro da Parceira - nunca persistido
        // na tabela `envios` (P0-4, proteção de PII).
        $parceira = $this->participacao->parceira;

        return [
            'id' => $this->id,
            'participacao_id' => $this->participacao_id,
            'status' => $this->status,
            'codigo_rastreio' => $this->codigo_rastreio,
            'endereco_completo' => $parceira->endereco_completo,
        ];
    }
}
