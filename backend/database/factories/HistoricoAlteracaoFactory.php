<?php

namespace Database\Factories;

use App\Models\HistoricoAlteracao;
use App\Models\Parceira;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HistoricoAlteracao>
 */
class HistoricoAlteracaoFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'parceira_id' => Parceira::factory(),
            'user_id' => User::factory(),
            'campo' => 'nome',
            'valor_anterior' => 'Antigo',
            'valor_novo' => 'Novo',
            'ip' => null,
        ];
    }
}
