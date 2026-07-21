<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;

class CreateAdminCommand extends Command
{
    /**
     * `DevUserSeeder` only runs in local/testing, so production has no
     * built-in way to provision its first ADMIN user. This command fills
     * that gap. Idempotent: re-running with the same e-mail promotes the
     * existing user to ADMIN instead of failing.
     */
    protected $signature = 'admin:create
        {--name= : Nome do administrador}
        {--email= : E-mail de login}
        {--password= : Senha (se omitida, será solicitada de forma oculta)}';

    protected $description = 'Cria ou promove um usuário para o papel ADMIN';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Nome');
        $email = $this->option('email') ?: $this->ask('E-mail');
        $password = $this->option('password') ?: $this->secret('Senha');

        $validator = Validator::make(
            ['name' => $name, 'email' => $email, 'password' => $password],
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255'],
                'password' => ['required', 'string', 'min:8'],
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->forceFill(['name' => $name, 'password' => Hash::make($password)])->save();
            $this->info("Usuário existente atualizado: {$email}");
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
            ]);
            $this->info("Usuário criado: {$email}");
        }

        Role::findOrCreate('ADMIN', 'web');

        if (! $user->hasRole('ADMIN')) {
            $user->assignRole('ADMIN');
        }

        $this->info("Papel ADMIN garantido para {$email}.");

        return self::SUCCESS;
    }
}
