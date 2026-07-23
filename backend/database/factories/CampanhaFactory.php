<?php

namespace Database\Factories;

use App\Models\Campanha;
use App\Models\Marca;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Campanha>
 */
class CampanhaFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'marca_id' => Marca::factory(),
            'nome' => 'Campanha '.fake()->words(2, true),
            'descricao' => fake()->sentence(),
            'data_inicio' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'data_fim' => fake()->dateTimeBetween('now', '+2 months')->format('Y-m-d'),
            'status' => 'PLANEJADA',
        ];
    }
}
