<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParceiraResource extends JsonResource
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
            'email' => $this->email,
            'cnpj' => $this->cnpj,
            'chave_pix' => $this->chave_pix,
            'cep' => $this->cep,
            'rua' => $this->rua,
            'bairro' => $this->bairro,
            'cidade' => $this->cidade,
            'uf' => $this->uf,
            'numero' => $this->numero,
            'complemento' => $this->complemento,
            'endereco_completo' => $this->endereco_completo,
        ];
    }
}
