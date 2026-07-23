<?php

namespace App\Policies;

use App\Models\Marca;
use App\Models\User;

/**
 * Sem ownership definido para Marca nesta sprint — só ADMIN (via Gate::before)
 * enxerga marcas; os demais papéis a veem indiretamente aninhada em Campanha.
 */
class MarcaPolicy
{
    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, Marca $marca): bool
    {
        return false;
    }
}
