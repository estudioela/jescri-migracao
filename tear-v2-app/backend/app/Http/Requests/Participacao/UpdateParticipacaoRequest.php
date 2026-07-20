<?php

namespace App\Http\Requests\Participacao;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateParticipacaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'valor_contratado' => ['nullable', 'numeric', 'min:0'],
            'reels_qtd' => ['sometimes', 'integer', 'min:0'],
            'carrossel_qtd' => ['sometimes', 'integer', 'min:0'],
            'stories_qtd' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['ATIVA', 'CANCELADA'])],
        ];
    }
}
