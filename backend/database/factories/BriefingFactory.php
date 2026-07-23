<?php

namespace Database\Factories;

use App\Models\Briefing;
use App\Models\ParticipacaoNaCampanha;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Briefing>
 */
class BriefingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'participacao_id' => ParticipacaoNaCampanha::factory(),
            'tipo' => 'FEED',
            'orientacoes' => fake()->paragraph(),
            'prazo' => fake()->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
            'entregaveis_esperados' => fake()->sentence(),
        ];
    }
}
