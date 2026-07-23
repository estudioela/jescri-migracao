<?php

namespace Tests\Feature;

use App\Models\Parceira;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    private function autenticarComoAdmin(): User
    {
        Role::findOrCreate('ADMIN', 'web');

        $admin = User::factory()->create();
        $admin->assignRole('ADMIN');

        Sanctum::actingAs($admin);

        return $admin;
    }

    public function test_aprovacao_de_parceira_gera_token_de_redefinicao_de_senha(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create(['email' => 'nova@example.com']);

        $this->patchJson("/api/parceiras/{$parceira->id}/aprovar")->assertOk();

        $user = User::find($parceira->fresh()->user_id);
        $this->assertNotNull($user);
        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
    }

    public function test_token_valido_permite_definir_senha(): void
    {
        $user = User::factory()->create();
        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/password/reset', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nova-senha-123',
            'password_confirmation' => 'nova-senha-123',
        ]);

        $response->assertNoContent();
        $this->assertTrue(Hash::check('nova-senha-123', $user->fresh()->password));
    }

    public function test_senha_definida_por_token_permite_login(): void
    {
        $user = User::factory()->create();
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/password/reset', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nova-senha-123',
            'password_confirmation' => 'nova-senha-123',
        ])->assertNoContent();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'nova-senha-123',
        ], ['Referer' => 'http://'.config('sanctum.stateful')[0]]);

        $response->assertOk();
        $this->assertAuthenticatedAs($user->fresh(), 'web');
    }

    public function test_fluxo_completo_convite_ate_login(): void
    {
        $this->autenticarComoAdmin();
        $parceira = Parceira::factory()->create(['email' => 'influenciadora@example.com']);

        $this->patchJson("/api/parceiras/{$parceira->id}/aprovar")->assertOk();
        Auth::guard('web')->logout();

        $user = User::find($parceira->fresh()->user_id);
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/password/reset', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'senha-influenciadora-1',
            'password_confirmation' => 'senha-influenciadora-1',
        ])->assertNoContent();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'senha-influenciadora-1',
        ], ['Referer' => 'http://'.config('sanctum.stateful')[0]])->assertOk();

        $this->assertAuthenticatedAs($user->fresh(), 'web');
    }

    public function test_token_invalido_e_rejeitado(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/password/reset', [
            'token' => 'token-invalido',
            'email' => $user->email,
            'password' => 'nova-senha-123',
            'password_confirmation' => 'nova-senha-123',
        ]);

        $response->assertUnprocessable();
        $this->assertFalse(Hash::check('nova-senha-123', $user->fresh()->password));
    }

    public function test_token_ja_consumido_nao_pode_ser_reutilizado(): void
    {
        $user = User::factory()->create();
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/password/reset', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'primeira-senha-123',
            'password_confirmation' => 'primeira-senha-123',
        ])->assertNoContent();

        $response = $this->postJson('/api/password/reset', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'segunda-senha-123',
            'password_confirmation' => 'segunda-senha-123',
        ]);

        $response->assertUnprocessable();
    }

    public function test_email_sem_correspondencia_de_token_e_rejeitado(): void
    {
        $user = User::factory()->create();
        $outro = User::factory()->create();
        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/password/reset', [
            'token' => $token,
            'email' => $outro->email,
            'password' => 'nova-senha-123',
            'password_confirmation' => 'nova-senha-123',
        ]);

        $response->assertUnprocessable();
    }

    public function test_confirmacao_de_senha_divergente_e_rejeitada(): void
    {
        $user = User::factory()->create();
        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/password/reset', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nova-senha-123',
            'password_confirmation' => 'outra-senha-456',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_senha_curta_e_rejeitada(): void
    {
        $user = User::factory()->create();
        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/password/reset', [
            'token' => $token,
            'email' => $user->email,
            'password' => '123',
            'password_confirmation' => '123',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_campos_obrigatorios_sao_validados(): void
    {
        $response = $this->postJson('/api/password/reset', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['token', 'email', 'password']);
    }
}
