<?php

namespace Database\Factories;

use App\Models\Pagamento;
use App\Models\ParticipacaoNaCampanha;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pagamento>
 */
class PagamentoFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'participacao_id' => ParticipacaoNaCampanha::factory(),
            'valor' => fake()->randomFloat(2, 100, 5000),
        ];
    }
}
