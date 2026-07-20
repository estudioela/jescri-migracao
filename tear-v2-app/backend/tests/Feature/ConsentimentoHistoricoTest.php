<?php

namespace Tests\Feature;

use App\Models\Parceira;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConsentimentoHistoricoTest extends TestCase
{
    use RefreshDatabase;

    private function dadosValidos(array $overrides = []): array
    {
        return array_merge([
            'nome' => 'Maria Influenciadora',
            'email' => 'maria@example.com',
            'telefone' => '(11) 98888-7777',
            'instagram' => '@mariainfluenciadora',
            'chave_pix' => 'maria@example.com',
            'cidade' => 'São Paulo',
            'uf' => 'SP',
            'consentimento_aceito' => true,
        ], $overrides);
    }

    public function test_edicao_sem_aceite_de_consentimento_e_rejeitada(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $parceira = Parceira::factory()->create();

        $response = $this->putJson(
            "/api/parceiras/{$parceira->id}",
            $this->dadosValidos(['nome' => $parceira->nome, 'consentimento_aceito' => null]),
        );

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('consentimento_aceito');
        $this->assertDatabaseCount('consentimentos', 0);
        $this->assertDatabaseCount('historico_alteracoes', 0);
    }

    public function test_edicao_com_aceite_grava_consentimento_e_historico_por_campo_alterado(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $parceira = Parceira::factory()->create(['nome' => 'Nome Antigo', 'email' => 'antigo@example.com']);

        $response = $this->putJson(
            "/api/parceiras/{$parceira->id}",
            $this->dadosValidos(['nome' => 'Nome Novo', 'email' => 'antigo@example.com']),
        );

        $response->assertOk();
        $this->assertDatabaseCount('consentimentos', 1);
        $this->assertDatabaseHas('consentimentos', [
            'parceira_id' => $parceira->id,
            'user_id' => $user->id,
        ]);
        $this->assertDatabaseHas('historico_alteracoes', [
            'parceira_id' => $parceira->id,
            'campo' => 'nome',
            'valor_anterior' => 'Nome Antigo',
            'valor_novo' => 'Nome Novo',
        ]);
        // email não mudou (mesmo valor enviado) — não deve gerar linha de histórico.
        $this->assertDatabaseMissing('historico_alteracoes', ['campo' => 'email']);
    }
}
