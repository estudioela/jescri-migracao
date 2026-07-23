<?php

namespace App\Rules;

use App\Models\Parceira;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NomeParceiraUnico implements ValidationRule
{
    public function __construct(private readonly int|string|null $ignoreId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $query = Parceira::whereRaw('LOWER(nome) = ?', [mb_strtolower((string) $value)]);

        if ($this->ignoreId !== null) {
            $query->where('id', '!=', $this->ignoreId);
        }

        if ($query->exists()) {
            $fail('Já existe uma parceira cadastrada com esse nome.');
        }
    }
}
