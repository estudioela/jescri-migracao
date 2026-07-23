<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeParticipacaoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'campanha' => [
                'id' => $this->campanha->id,
                'nome' => $this->campanha->nome,
                'status' => $this->campanha->status,
                'data_inicio' => $this->campanha->data_inicio?->toDateString(),
                'data_fim' => $this->campanha->data_fim?->toDateString(),
                'marca' => ['nome' => $this->campanha->marca->nome],
            ],
            'valor_contratado' => $this->valor_contratado === null ? null : (float) $this->valor_contratado,
            'entregaveis_contratados' => [
                'FEED' => $this->carrossel_qtd,
                'REELS' => $this->reels_qtd,
                'STORIES' => $this->stories_qtd,
                'TIKTOK' => $this->tiktok_qtd,
                'UGC' => $this->ugc_qtd,
            ],
            'proximo_prazo_briefing' => $this->briefings->min('prazo')?->toDateString(),
            'pagamento_status' => $this->pagamento?->status,
            'status' => $this->status,
        ];
    }
}
