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
            'razao_social' => $this->razao_social,
            'status' => $this->status,
            'aprovado_em' => $this->aprovado_em?->toIso8601String(),
            'consentimento_cadastro_aceito_em' => $this->consentimento_cadastro_aceito_em?->toIso8601String(),
            'reprovado_em' => $this->reprovado_em?->toIso8601String(),
            'motivo_reprovacao' => $this->motivo_reprovacao,
            'email' => $this->email,
            'telefone' => $this->telefone,
            'instagram' => $this->instagram,
            'cnpj' => $this->cnpj,
            'chave_pix' => $this->chave_pix,
            'canais_uso_imagem' => $this->canais_uso_imagem,
            'prazo_uso_imagem' => $this->prazo_uso_imagem,
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
