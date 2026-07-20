<?php

namespace Database\Factories;

use App\Models\Consentimento;
use App\Models\Parceira;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Consentimento>
 */
class ConsentimentoFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'parceira_id' => Parceira::factory(),
            'user_id' => User::factory(),
            'aceito_em' => now(),
            'ip' => null,
        ];
    }
}
