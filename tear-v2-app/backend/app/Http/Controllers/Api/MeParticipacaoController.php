<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MeParticipacaoResource;
use App\Models\ParticipacaoNaCampanha;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Superfície "auto-escopada" do Portal (RFC-04, ESPECIFICACAO_FUNCIONAL
 * §6) - parceira_id deriva sempre da sessão, nunca de parâmetro do cliente.
 */
class MeParticipacaoController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $parceira = $request->user()->parceira;

        abort_if($parceira === null, 404);

        $participacoes = $parceira->participacoes()
            ->where('status', 'ATIVA')
            ->with(['campanha.marca', 'briefings', 'pagamento'])
            ->get()
            ->sortBy(fn (ParticipacaoNaCampanha $p) => $p->briefings->min('prazo')?->timestamp ?? PHP_INT_MAX)
            ->values();

        return MeParticipacaoResource::collection($participacoes);
    }

    public function show(Request $request, ParticipacaoNaCampanha $participacao): MeParticipacaoResource
    {
        $this->authorize('view', $participacao);

        return new MeParticipacaoResource($participacao->load(['campanha.marca', 'briefings', 'pagamento']));
    }
}
