<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Medida\StoreMedidaRequest;
use App\Http\Resources\MedidaInfluenciadoraResource;
use App\Models\Parceira;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MedidaController extends Controller
{
    public function index(Parceira $parceira): AnonymousResourceCollection
    {
        $this->authorize('view', $parceira);

        return MedidaInfluenciadoraResource::collection($parceira->medidas()->get());
    }

    public function store(StoreMedidaRequest $request, Parceira $parceira): MedidaInfluenciadoraResource
    {
        $this->authorize('view', $parceira);

        $medida = $parceira->medidas()->create($request->validated());

        return new MedidaInfluenciadoraResource($medida);
    }
}
