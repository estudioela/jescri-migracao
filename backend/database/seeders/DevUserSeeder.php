<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DevUserSeeder extends Seeder
{
    /**
     * Test users for local/dev only. Never runs in production —
     * do not remove the environment guard below.
     */
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            return;
        }

        $users = [
            ['name' => 'Admin Dev', 'email' => 'admin@tear.test', 'role' => 'ADMIN'],
            ['name' => 'Gestor Dev', 'email' => 'gestor@tear.test', 'role' => 'GESTOR_MARCA'],
            ['name' => 'Influenciadora Dev', 'email' => 'influenciadora@tear.test', 'role' => 'INFLUENCIADORA'],
        ];

        foreach ($users as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                ['name' => $data['name'], 'password' => 'password']
            );

            if (! $user->hasRole($data['role'])) {
                $user->assignRole($data['role']);
            }
        }
    }
}
