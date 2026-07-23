<?php

namespace Database\Factories;

use App\Models\Marca;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Marca>
 */
class MarcaFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nome' => fake()->unique()->company(),
            'contato_nome' => fake()->name(),
            'contato_email' => fake()->safeEmail(),
            'contato_telefone' => fake()->numerify('(##) #####-####'),
            'cnpj' => fake()->numerify('##.###.###/####-##'),
            'status' => 'Ativa',
        ];
    }
}
