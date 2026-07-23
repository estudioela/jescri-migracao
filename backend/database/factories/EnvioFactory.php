<?php

namespace Database\Factories;

use App\Models\Envio;
use App\Models\ParticipacaoNaCampanha;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Envio>
 */
class EnvioFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'participacao_id' => ParticipacaoNaCampanha::factory(),
        ];
    }
}
