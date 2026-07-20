<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParticipacaoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'campanha_id' => $this->campanha_id,
            'parceira_id' => $this->parceira_id,
            'parceira' => new ParceiraResource($this->whenLoaded('parceira')),
            'valor_contratado' => $this->valor_contratado === null ? null : (float) $this->valor_contratado,
            'reels_qtd' => $this->reels_qtd,
            'carrossel_qtd' => $this->carrossel_qtd,
            'stories_qtd' => $this->stories_qtd,
            'status' => $this->status,
            'congelado_em' => $this->congelado_em?->toIso8601String(),
        ];
    }
}
