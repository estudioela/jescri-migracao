<?php

namespace App\Http\Requests\Pagamento;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePagamentoRequest extends FormRequest
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
            'valor' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in(['PENDENTE', 'APROVADO', 'PAGO'])],
        ];
    }
}
