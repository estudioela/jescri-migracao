<?php

namespace App\Http\Requests\Parceira;

use App\Rules\Cnpj;
use App\Rules\NomeParceiraUnico;
use App\Rules\Telefone;
use Illuminate\Foundation\Http\FormRequest;

class StoreParceiraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'nome' => $this->nome !== null ? trim(preg_replace('/\s+/', ' ', (string) $this->nome)) : null,
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
            'nome' => ['required', 'string', 'max:255', new NomeParceiraUnico],
            'razao_social' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'telefone' => ['required', 'string', new Telefone],
            'instagram' => ['required', 'string', 'max:255'],
            'chave_pix' => ['required', 'string', 'max:255'],
            'canais_uso_imagem' => ['nullable', 'string', 'max:255'],
            'prazo_uso_imagem' => ['nullable', 'string', 'max:255'],
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
