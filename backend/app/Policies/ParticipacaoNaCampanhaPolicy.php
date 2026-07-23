<?php

namespace App\Policies;

use App\Models\ParticipacaoNaCampanha;
use App\Models\User;

class ParticipacaoNaCampanhaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * ESPECIFICACAO_FUNCIONAL §6: único critério de visibilidade é a própria
     * participação estar ATIVA — reaproveitado por Briefing/Material/Pagamento,
     * que são sempre lidos através da participação a que pertencem.
     */
    public function view(User $user, ParticipacaoNaCampanha $participacao): bool
    {
        return $participacao->status === 'ATIVA'
            && $participacao->parceira?->user_id === $user->id;
    }
}
