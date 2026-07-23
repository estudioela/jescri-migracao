<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Marca\StoreMarcaRequest;
use App\Http\Requests\Marca\UpdateMarcaRequest;
use App\Http\Resources\MarcaResource;
use App\Models\Marca;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class MarcaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Marca::class);

        $request->validate([
            'status' => ['sometimes', Rule::in(['Ativa', 'Inativa'])],
        ]);

        return MarcaResource::collection(
            Marca::when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
                ->orderBy('nome')
                ->paginate(20)
        );
    }

    public function store(StoreMarcaRequest $request): MarcaResource
    {
        $marca = Marca::create($request->validated());

        return new MarcaResource($marca);
    }

    public function show(Marca $marca): MarcaResource
    {
        $this->authorize('view', $marca);

        return new MarcaResource($marca);
    }

    public function update(UpdateMarcaRequest $request, Marca $marca): MarcaResource
    {
        $marca->update($request->validated());

        return new MarcaResource($marca);
    }
}
