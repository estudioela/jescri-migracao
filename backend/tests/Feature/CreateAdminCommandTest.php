<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_new_user_with_admin_role(): void
    {
        $this->artisan('admin:create', [
            '--name' => 'Admin Produção',
            '--email' => 'admin@producao.test',
            '--password' => 'senha-forte-123',
        ])->assertSuccessful();

        $user = User::where('email', 'admin@producao.test')->first();

        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('ADMIN'));
        $this->assertTrue(Hash::check('senha-forte-123', $user->password));
    }

    public function test_promotes_existing_user_when_email_already_exists(): void
    {
        $existing = User::factory()->create(['email' => 'ja-existe@producao.test']);
        $this->assertFalse($existing->hasRole('ADMIN'));

        $this->artisan('admin:create', [
            '--name' => 'Novo Nome',
            '--email' => 'ja-existe@producao.test',
            '--password' => 'outra-senha-123',
        ])->assertSuccessful();

        $existing->refresh();

        $this->assertTrue($existing->hasRole('ADMIN'));
        $this->assertSame('Novo Nome', $existing->name);
    }

    public function test_rejects_invalid_input(): void
    {
        $this->artisan('admin:create', [
            '--name' => 'Sem Email',
            '--email' => 'nao-e-um-email',
            '--password' => 'senha-forte-123',
        ])->assertFailed();

        $this->assertNull(User::where('name', 'Sem Email')->first());
    }
}
