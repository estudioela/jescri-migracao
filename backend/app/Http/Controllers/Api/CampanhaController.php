<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Campanha\StoreCampanhaRequest;
use App\Http\Requests\Campanha\UpdateCampanhaRequest;
use App\Http\Resources\CampanhaResource;
use App\Models\Campanha;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class CampanhaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Campanha::class);

        $request->validate([
            'marca_id' => ['sometimes', 'integer', 'exists:marcas,id'],
            'status' => ['sometimes', Rule::in(['PLANEJADA', 'ATIVA', 'ENCERRADA', 'CANCELADA'])],
        ]);

        $user = $request->user();

        return CampanhaResource::collection(
            Campanha::with('marca')
                // Mesmo escopo de participacoes() do show(): sem isto, o
                // Portal da Influenciadora (PortalCampanhasListPage) recebia
                // a chave `participacoes` inteiramente ausente do JSON
                // (CampanhaResource::whenLoaded omite quando não carregada),
                // e `campanha.participacoes[0]` quebrava o componente em
                // runtime — sem ErrorBoundary, derrubava a SPA inteira.
                ->with(['participacoes' => function ($query) use ($user) {
                    if (! $user->hasRole('ADMIN')) {
                        $query->where('parceira_id', $user->parceira?->id);
                    }
                    $query->with('parceira');
                }])
                ->when($request->query('marca_id'), fn ($query, $marcaId) => $query->where('marca_id', $marcaId))
                ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
                ->when(
                    ! $user->hasRole('ADMIN'),
                    fn ($query) => $query->whereHas(
                        'participacoes',
                        fn ($q) => $q->where('parceira_id', $user->parceira?->id)->where('status', 'ATIVA')
                    )
                )
                ->orderByDesc('data_inicio')
                ->paginate(20)
        );
    }

    public function store(StoreCampanhaRequest $request): CampanhaResource
    {
        $campanha = Campanha::create($request->validated());

        return new CampanhaResource($campanha->load('marca'));
    }

    public function show(Request $request, Campanha $campanha): CampanhaResource
    {
        $this->authorize('view', $campanha);

        $user = $request->user();

        $campanha->load('marca');
        $campanha->load(['participacoes' => function ($query) use ($user) {
            if (! $user->hasRole('ADMIN')) {
                $query->where('parceira_id', $user->parceira?->id);
            }
            $query->with('parceira');
        }]);

        return new CampanhaResource($campanha);
    }

    public function update(UpdateCampanhaRequest $request, Campanha $campanha): CampanhaResource
    {
        $campanha->update($request->validated());

        return new CampanhaResource($campanha->load('marca'));
    }
}
