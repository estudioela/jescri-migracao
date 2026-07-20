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

    public function view(User $user, Parceira $parceira): bool
    {
        return $parceira->user_id !== null && $parceira->user_id === $user->id;
    }
}
