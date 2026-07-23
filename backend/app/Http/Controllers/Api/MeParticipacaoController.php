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

    /**
     * Histórico (RF-028, PRD.md §9): participações que não aparecem mais
     * no painel ativo — cancelada ou de uma campanha já encerrada/cancelada.
     */
    public function historico(Request $request): AnonymousResourceCollection
    {
        $parceira = $request->user()->parceira;

        abort_if($parceira === null, 404);

        $participacoes = $parceira->participacoes()
            ->where(function ($query) {
                $query->where('status', 'CANCELADA')
                    ->orWhereHas('campanha', function ($query) {
                        $query->whereIn('status', ['ENCERRADA', 'CANCELADA']);
                    });
            })
            ->with(['campanha.marca', 'briefings', 'pagamento'])
            ->get()
            ->sortByDesc(fn (ParticipacaoNaCampanha $p) => $p->campanha->data_fim)
            ->values();

        return MeParticipacaoResource::collection($participacoes);
    }
}
