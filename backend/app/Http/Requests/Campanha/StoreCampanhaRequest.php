<?php

namespace App\Http\Requests\Campanha;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCampanhaRequest extends FormRequest
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
            'marca_id' => ['required', 'integer', 'exists:marcas,id'],
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'data_inicio' => ['required', 'date'],
            'data_fim' => ['nullable', 'date', 'after_or_equal:data_inicio'],
            'status' => ['sometimes', Rule::in(['PLANEJADA', 'ATIVA', 'ENCERRADA', 'CANCELADA'])],
        ];
    }
}
