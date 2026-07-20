<?php

namespace Database\Factories;

use App\Models\Material;
use App\Models\ParticipacaoNaCampanha;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Material>
 */
class MaterialFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'participacao_id' => ParticipacaoNaCampanha::factory(),
            'tipo' => fake()->randomElement(['REELS', 'STORIES', 'FOTOS', 'OUTROS']),
            'nome_arquivo' => fake()->lexify('material_????.mp4'),
            'drive_file_id' => null,
            'drive_file_url' => fake()->url(),
        ];
    }
}
