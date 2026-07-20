<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MarcaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'status' => $this->status,
            'contato_nome' => $this->contato_nome,
            'contato_email' => $this->contato_email,
            'contato_telefone' => $this->contato_telefone,
            'cnpj' => $this->cnpj,
        ];
    }
}
