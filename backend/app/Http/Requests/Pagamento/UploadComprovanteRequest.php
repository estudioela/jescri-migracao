<?php

namespace App\Http\Requests\Pagamento;

use Illuminate\Foundation\Http\FormRequest;

class UploadComprovanteRequest extends FormRequest
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
            'arquivo' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp'],
        ];
    }
}
