<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Participacao\StoreParticipacaoRequest;
use App\Http\Requests\Participacao\UpdateParticipacaoRequest;
use App\Http\Resources\ParticipacaoResource;
use App\Models\Campanha;
use App\Models\ParticipacaoNaCampanha;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ParticipacaoController extends Controller
{
    public function index(Request $request, Campanha $campanha): AnonymousResourceCollection
    {
        $this->authorize('view', $campanha);

        $user = $request->user();

        return ParticipacaoResource::collection(
            $campanha->participacoes()
                ->when(
                    ! $user->hasRole('ADMIN'),
                    fn ($query) => $query->where('parceira_id', $user->parceira?->id)
                )
                ->with('parceira')
                ->get()
        );
    }

    public function store(StoreParticipacaoRequest $request, Campanha $campanha): ParticipacaoResource
    {
        $participacao = $campanha->participacoes()->create($request->validated());

        return new ParticipacaoResource($participacao->load('parceira'));
    }

    private const CAMPOS_COMERCIAIS = ['valor_contratado', 'reels_qtd', 'carrossel_qtd', 'stories_qtd'];

    public function update(UpdateParticipacaoRequest $request, ParticipacaoNaCampanha $participacao): ParticipacaoResource|JsonResponse
    {
        $dados = $request->validated();

        if ($participacao->congelado_em !== null && array_intersect(self::CAMPOS_COMERCIAIS, array_keys($dados))) {
            return response()->json([
                'message' => 'Participação congelada: valor e quantidades não podem mais ser editados.',
            ], 409);
        }

        $participacao->update($dados);

        return new ParticipacaoResource($participacao->load('parceira'));
    }

    public function congelar(ParticipacaoNaCampanha $participacao): ParticipacaoResource|JsonResponse
    {
        if ($participacao->congelado_em !== null) {
            return response()->json([
                'message' => 'Participação já está congelada.',
            ], 409);
        }

        $participacao->congelar();

        return new ParticipacaoResource($participacao->load('parceira'));
    }
}
