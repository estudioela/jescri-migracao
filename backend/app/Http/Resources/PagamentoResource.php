<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PagamentoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'participacao_id' => $this->participacao_id,
            'valor' => (float) $this->valor,
            'status' => $this->status,
            'aprovado_por' => $this->aprovado_por,
            'aprovado_em' => $this->aprovado_em?->toIso8601String(),
            'comprovante_url' => $this->comprovante_drive_file_url,
        ];
    }
}
