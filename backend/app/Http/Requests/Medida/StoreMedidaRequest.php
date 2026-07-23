<?php

namespace App\Http\Requests\Medida;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMedidaRequest extends FormRequest
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
            'sutia_tamanho' => ['nullable', Rule::in(['P', 'M', 'G', 'GG'])],
            'sutia_numeracao' => ['nullable', Rule::in(['42', '44', '46', '48'])],
            'sutia_taca' => ['nullable', Rule::in(['A', 'B', 'C', 'D'])],
            'calcinha_tamanho' => ['nullable', Rule::in(['P', 'M', 'G', 'GG'])],
            'linha_noite_tamanho' => ['nullable', Rule::in(['P', 'M', 'G', 'GG'])],
        ];
    }
}
