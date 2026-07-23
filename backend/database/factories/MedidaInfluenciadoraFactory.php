<?php

namespace Database\Factories;

use App\Models\MedidaInfluenciadora;
use App\Models\Parceira;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MedidaInfluenciadora>
 */
class MedidaInfluenciadoraFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'parceira_id' => Parceira::factory(),
            'sutia_tamanho' => 'M',
            'sutia_numeracao' => '44',
            'sutia_taca' => 'B',
            'calcinha_tamanho' => 'M',
            'linha_noite_tamanho' => 'M',
        ];
    }
}
