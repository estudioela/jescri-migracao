<?php

namespace App\Policies;

use App\Models\Campanha;
use App\Models\User;

class CampanhaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * RN-03 / ESPECIFICACAO_FUNCIONAL §6: a influenciadora só vê campanhas
     * onde sua própria participação está ATIVA.
     */
    public function view(User $user, Campanha $campanha): bool
    {
        $parceiraId = $user->parceira?->id;

        if ($parceiraId === null) {
            return false;
        }

        return $campanha->participacoes()
            ->where('parceira_id', $parceiraId)
            ->where('status', 'ATIVA')
            ->exists();
    }
}
