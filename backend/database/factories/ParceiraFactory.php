<?php

namespace Database\Factories;

use App\Models\Parceira;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Parceira>
 */
class ParceiraFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nome' => fake()->unique()->name(),
            'email' => fake()->safeEmail(),
            'telefone' => fake()->numerify('(##) #####-####'),
            'instagram' => '@'.fake()->userName(),
            'cnpj' => fake()->numerify('##.###.###/####-##'),
            'chave_pix' => fake()->safeEmail(),
            'cep' => fake()->numerify('#####-###'),
            'rua' => fake()->streetName(),
            'bairro' => fake()->word(),
            'cidade' => fake()->city(),
            'uf' => fake()->stateAbbr(),
            'numero' => (string) fake()->buildingNumber(),
            'complemento' => null,
        ];
    }
}
