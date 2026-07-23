<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CampanhaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'marca_id' => $this->marca_id,
            'marca' => new MarcaResource($this->whenLoaded('marca')),
            'nome' => $this->nome,
            'descricao' => $this->descricao,
            'data_inicio' => $this->data_inicio?->toDateString(),
            'data_fim' => $this->data_fim?->toDateString(),
            'status' => $this->status,
            'participacoes' => ParticipacaoResource::collection($this->whenLoaded('participacoes')),
        ];
    }
}
