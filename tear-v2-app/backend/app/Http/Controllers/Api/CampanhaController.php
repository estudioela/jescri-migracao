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
        $request->validate([
            'marca_id' => ['sometimes', 'integer', 'exists:marcas,id'],
            'status' => ['sometimes', Rule::in(['PLANEJADA', 'ATIVA', 'ENCERRADA', 'CANCELADA'])],
        ]);

        return CampanhaResource::collection(
            Campanha::with('marca')
                ->when($request->query('marca_id'), fn ($query, $marcaId) => $query->where('marca_id', $marcaId))
                ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
                ->orderByDesc('data_inicio')
                ->paginate(20)
        );
    }

    public function store(StoreCampanhaRequest $request): CampanhaResource
    {
        $campanha = Campanha::create($request->validated());

        return new CampanhaResource($campanha->load('marca'));
    }

    public function show(Campanha $campanha): CampanhaResource
    {
        return new CampanhaResource($campanha->load('marca', 'participacoes.parceira'));
    }

    public function update(UpdateCampanhaRequest $request, Campanha $campanha): CampanhaResource
    {
        $campanha->update($request->validated());

        return new CampanhaResource($campanha->load('marca'));
    }
}
