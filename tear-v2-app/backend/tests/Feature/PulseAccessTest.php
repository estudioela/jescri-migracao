<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PulseAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_pulse_dashboard(): void
    {
        $response = $this->get('/pulse');

        $response->assertForbidden();
    }

    public function test_non_admin_cannot_view_pulse_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/pulse');

        $response->assertForbidden();
    }

    public function test_admin_can_view_pulse_dashboard(): void
    {
        Role::findOrCreate('ADMIN', 'web');
        $admin = User::factory()->create();
        $admin->assignRole('ADMIN');

        $response = $this->actingAs($admin)->get('/pulse');

        $response->assertOk();
    }
}
