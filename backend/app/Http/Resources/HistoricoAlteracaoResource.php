<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HistoricoAlteracaoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'campo' => $this->campo,
            'valor_anterior' => $this->valor_anterior,
            'valor_novo' => $this->valor_novo,
            'autor' => $this->user?->name,
            'ip' => $this->ip,
            'criado_em' => $this->created_at?->toIso8601String(),
        ];
    }
}
