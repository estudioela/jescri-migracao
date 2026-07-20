<?php

namespace App\Http\Requests\Marca;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMarcaRequest extends FormRequest
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
            'nome' => [
                'required',
                'string',
                'max:255',
                Rule::unique('marcas', 'nome')->ignore($this->route('marca')),
            ],
            'contato_nome' => ['nullable', 'string', 'max:255'],
            'contato_email' => ['nullable', 'email', 'max:255'],
            'contato_telefone' => ['nullable', 'string', 'max:32'],
            'cnpj' => ['nullable', 'string', 'max:32'],
            'status' => ['sometimes', Rule::in(['Ativa', 'Inativa'])],
        ];
    }
}
