<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedidaInfluenciadoraResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parceira_id' => $this->parceira_id,
            'sutia_tamanho' => $this->sutia_tamanho,
            'sutia_numeracao' => $this->sutia_numeracao,
            'sutia_taca' => $this->sutia_taca,
            'calcinha_tamanho' => $this->calcinha_tamanho,
            'linha_noite_tamanho' => $this->linha_noite_tamanho,
            'criado_em' => $this->created_at?->toIso8601String(),
        ];
    }
}
