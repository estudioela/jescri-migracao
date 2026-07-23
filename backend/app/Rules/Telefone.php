<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Telefone implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $digits = preg_replace('/\D/', '', (string) $value);

        if (! in_array(strlen($digits), [10, 11], true)) {
            $fail('Telefone inválido — inclua o DDD.');
        }
    }
}
