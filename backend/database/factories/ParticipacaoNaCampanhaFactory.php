<?php

namespace Database\Factories;

use App\Models\Campanha;
use App\Models\Parceira;
use App\Models\ParticipacaoNaCampanha;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ParticipacaoNaCampanha>
 */
class ParticipacaoNaCampanhaFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'campanha_id' => Campanha::factory(),
            'parceira_id' => Parceira::factory(['status' => 'Ativa']),
            'valor_contratado' => fake()->randomFloat(2, 500, 5000),
            'reels_qtd' => fake()->numberBetween(0, 4),
            'carrossel_qtd' => fake()->numberBetween(0, 2),
            'stories_qtd' => fake()->numberBetween(0, 6),
            'status' => 'ATIVA',
        ];
    }
}
