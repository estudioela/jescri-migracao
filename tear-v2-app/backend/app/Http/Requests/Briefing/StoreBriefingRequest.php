<?php

namespace App\Http\Requests\Briefing;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class StoreBriefingRequest extends FormRequest
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
            'orientacoes' => ['required', 'string'],
            'prazo' => ['required', 'date'],
            'entregaveis_esperados' => ['nullable', 'string'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($this->route('participacao')->briefing()->exists()) {
                $validator->errors()->add('participacao_id', 'Esta participação já tem um briefing.');
            }
        });
    }
}
