<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BriefingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'participacao_id' => $this->participacao_id,
            'orientacoes' => $this->orientacoes,
            'prazo' => $this->prazo?->toDateString(),
            'entregaveis_esperados' => $this->entregaveis_esperados,
        ];
    }
}
