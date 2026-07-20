<?php

namespace App\Http\Requests\Envio;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEnvioRequest extends FormRequest
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
            'status' => ['sometimes', Rule::in(['PENDENTE', 'EXPEDIDO', 'ENTREGUE', 'CANCELADO'])],
            'codigo_rastreio' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
