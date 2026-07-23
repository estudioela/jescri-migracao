<?php

namespace App\Http\Requests\Briefing;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'tipo' => ['required', Rule::in(['FEED', 'REELS', 'STORIES', 'TIKTOK', 'UGC'])],
            'orientacoes' => ['required', 'string'],
            'prazo' => ['required', 'date'],
            'referencias' => ['nullable', 'array'],
            'entregaveis_esperados' => ['nullable', 'string'],
            'observacoes' => ['nullable', 'string'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $participacao = $this->route('participacao');
            $tipo = $this->input('tipo');

            if ($tipo === null) {
                return;
            }

            if ($participacao->briefings()->where('tipo', $tipo)->exists()) {
                $validator->errors()->add('tipo', 'Esta participação já tem um briefing deste tipo.');

                return;
            }

            if ($participacao->quantidadeContratadaPara($tipo) < 1) {
                $validator->errors()->add('tipo', 'Este tipo de conteúdo não foi contratado nesta participação.');
            }
        });
    }
}
