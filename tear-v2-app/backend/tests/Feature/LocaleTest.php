<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_mensagens_de_validacao_sao_em_portugues(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/parceiras', []);

        $response->assertUnprocessable();
        $response->assertJsonFragment(['nome' => ['O campo nome é obrigatório.']]);
    }

    public function test_falha_de_login_retorna_mensagem_em_portugues(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'inexistente@example.com',
            'password' => 'senha-errada',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonFragment(['email' => ['Essas credenciais não correspondem aos nossos registros.']]);
    }
}
