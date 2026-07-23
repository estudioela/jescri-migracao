<?php

namespace App\Http\Requests\Briefing;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBriefingRequest extends FormRequest
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
            'orientacoes' => ['sometimes', 'string'],
            'prazo' => ['sometimes', 'date'],
            'referencias' => ['nullable', 'array'],
            'entregaveis_esperados' => ['nullable', 'string'],
            'observacoes' => ['nullable', 'string'],
        ];
    }
}
