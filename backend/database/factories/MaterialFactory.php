<?php

namespace Database\Factories;

use App\Models\Briefing;
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
        // participacao_id/briefing_id precisam apontar para a mesma
        // participação (briefing_id.exists é validado contra isso na
        // criação real) - criados juntos aqui para manter a consistência.
        $participacao = ParticipacaoNaCampanha::factory()->create();
        $briefing = Briefing::factory()->create(['participacao_id' => $participacao->id]);

        return [
            'participacao_id' => $participacao->id,
            'briefing_id' => $briefing->id,
            'nome_arquivo' => fake()->lexify('material_????.mp4'),
            'drive_file_id' => null,
            'drive_file_url' => fake()->url(),
        ];
    }
}
