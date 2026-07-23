<?php

namespace App\Http\Requests\Material;

use Illuminate\Foundation\Http\FormRequest;

class ReprovarMaterialRequest extends FormRequest
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
            'motivo' => ['required', 'string'],
        ];
    }
}
