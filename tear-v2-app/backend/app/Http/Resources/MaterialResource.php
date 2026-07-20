<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'participacao_id' => $this->participacao_id,
            'tipo' => $this->tipo,
            'nome_arquivo' => $this->nome_arquivo,
            'drive_file_url' => $this->drive_file_url,
            'status' => $this->status,
            'aprovado_por' => $this->aprovado_por,
            'aprovado_em' => $this->aprovado_em?->toIso8601String(),
            'motivo_reprovacao' => $this->motivo_reprovacao,
        ];
    }
}
