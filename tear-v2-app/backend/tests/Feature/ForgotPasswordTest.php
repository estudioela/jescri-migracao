<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * P0-1 (varredura técnica 2026-07-21): antes desta entrega não havia nenhuma
 * forma de uma influenciadora recuperar o acesso ao Portal caso esquecesse a
 * senha ou perdesse a janela de 60 min do convite — fluxo nativo do broker de
 * senha do Laravel (Password::broker()->sendResetLink()), sem autenticação
 * própria.
 */
class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_existente_gera_token_de_redefinicao(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/password/forgot', ['email' => $user->email]);

        $response->assertNoContent();
        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
    }

    public function test_email_inexistente_tambem_retorna_sucesso_generico(): void
    {
        $response = $this->postJson('/api/password/forgot', ['email' => 'ninguem@example.com']);

        $response->assertNoContent();
        $this->assertDatabaseCount('password_reset_tokens', 0);
    }

    public function test_email_e_obrigatorio(): void
    {
        $response = $this->postJson('/api/password/forgot', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_token_enviado_por_email_permite_definir_senha(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/password/forgot', ['email' => $user->email])->assertNoContent();

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token) {
            $token = $notification->token;

            return true;
        });

        $response = $this->postJson('/api/password/reset', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nova-senha-123',
            'password_confirmation' => 'nova-senha-123',
        ]);

        $response->assertNoContent();
    }
}
