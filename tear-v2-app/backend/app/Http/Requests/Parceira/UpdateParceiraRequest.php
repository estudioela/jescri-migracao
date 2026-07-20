<?php

namespace App\Http\Requests\Parceira;

use App\Rules\Cnpj;
use App\Rules\Telefone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateParceiraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'telefone' => $this->telefone !== null ? preg_replace('/\D/', '', (string) $this->telefone) : null,
            'cnpj' => $this->cnpj !== null ? preg_replace('/\D/', '', (string) $this->cnpj) : null,
            'cep' => $this->cep !== null ? preg_replace('/\D/', '', (string) $this->cep) : null,
        ]);
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
                Rule::unique('parceiras', 'nome')->ignore($this->route('parceira')),
            ],
            'email' => ['required', 'email', 'max:255'],
            'telefone' => ['required', 'string', new Telefone],
            'instagram' => ['required', 'string', 'max:255'],
            'chave_pix' => ['required', 'string', 'max:255'],
            'cidade' => ['required', 'string', 'max:255'],
            'uf' => ['required', 'string', 'size:2'],
            'cnpj' => ['nullable', 'string', new Cnpj],
            'cep' => ['nullable', 'digits:8'],
            'rua' => ['nullable', 'string', 'max:255'],
            'bairro' => ['nullable', 'string', 'max:255'],
            'numero' => ['nullable', 'string', 'max:20'],
            'complemento' => ['nullable', 'string', 'max:255'],
            'consentimento_aceito' => ['required', 'accepted'],
        ];
    }
}
