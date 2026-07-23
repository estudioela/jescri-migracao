<?php

namespace App\Http\Requests\Participacao;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreParticipacaoRequest extends FormRequest
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
        $campanhaId = $this->route('campanha')->id;

        return [
            'parceira_id' => [
                'required',
                'integer',
                Rule::exists('parceiras', 'id')->where('status', 'Ativa'),
                Rule::unique('participacoes_na_campanha', 'parceira_id')
                    ->where(fn ($query) => $query->where('campanha_id', $campanhaId)),
            ],
            'valor_contratado' => ['nullable', 'numeric', 'min:0'],
            'reels_qtd' => ['sometimes', 'integer', 'min:0'],
            'carrossel_qtd' => ['sometimes', 'integer', 'min:0'],
            'stories_qtd' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'parceira_id.exists' => 'Só é possível vincular uma parceira com status Ativa.',
            'parceira_id.unique' => 'Esta parceira já participa desta campanha.',
        ];
    }
}
