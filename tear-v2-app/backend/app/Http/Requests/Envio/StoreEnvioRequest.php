<?php

namespace App\Http\Requests\Envio;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class StoreEnvioRequest extends FormRequest
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
            'codigo_rastreio' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($this->route('participacao')->envio()->exists()) {
                $validator->errors()->add('participacao_id', 'Esta participação já tem um envio.');
            }
        });
    }
}
