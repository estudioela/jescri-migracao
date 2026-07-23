<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Base structural roles for TEAR V2. No permissions/policies attached yet.
     */
    public function run(): void
    {
        foreach (['ADMIN', 'GESTOR_MARCA', 'INFLUENCIADORA'] as $role) {
            Role::findOrCreate($role, 'web');
        }
    }
}
