<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Cnpj implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $digits = preg_replace('/\D/', '', (string) $value);

        if (! $this->isValid($digits)) {
            $fail('CNPJ inválido — confira os dígitos digitados.');
        }
    }

    private function isValid(string $cnpj): bool
    {
        if (strlen($cnpj) !== 14 || preg_match('/^(\d)\1{13}$/', $cnpj) === 1) {
            return false;
        }

        $calcularDigito = function (string $base, array $pesos): int {
            $soma = 0;
            foreach (str_split($base) as $i => $digito) {
                $soma += (int) $digito * $pesos[$i];
            }
            $resto = $soma % 11;

            return $resto < 2 ? 0 : 11 - $resto;
        };

        $pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        $base = substr($cnpj, 0, 12);
        $digito1 = $calcularDigito($base, $pesos1);
        $digito2 = $calcularDigito($base.$digito1, $pesos2);

        return $cnpj === $base.$digito1.$digito2;
    }
}
