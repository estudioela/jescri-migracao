<?php

namespace App\Http\Requests\Material;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaterialRequest extends FormRequest
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
            'briefing_id' => [
                'required',
                Rule::exists('briefings', 'id')->where(
                    fn ($query) => $query->where('participacao_id', $this->route('participacao')->id)
                ),
            ],
            'arquivo' => ['required', 'file', 'max:51200', 'mimes:jpg,jpeg,png,webp,heic,mp4,mov,webm'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'briefing_id.exists' => 'Selecione um briefing publicado desta participação.',
        ];
    }
}
