<?php

namespace App\Policies;

use App\Models\Parceira;
use App\Models\User;

class ParceiraPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Sem ownership possível na criação (a Parceira ainda não existe) —
     * só ADMIN (via Gate::before) cria pela rota administrativa. O
     * cadastro público segue por CadastroPublicoController, fora desta
     * policy (rota sem autenticação).
     */
    public function create(User $user): bool
    {
        return false;
    }

    public function view(User $user, Parceira $parceira): bool
    {
        return $parceira->user_id !== null && $parceira->user_id === $user->id;
    }

    public function update(User $user, Parceira $parceira): bool
    {
        return $parceira->user_id !== null && $parceira->user_id === $user->id;
    }
}
