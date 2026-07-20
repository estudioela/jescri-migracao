<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Parceira\StoreParceiraRequest;
use App\Http\Requests\Parceira\UpdateParceiraRequest;
use App\Http\Resources\ParceiraResource;
use App\Models\Parceira;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ParceiraController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Parceira::class);

        $request->validate([
            'status' => ['sometimes', Rule::in(['Ativa', 'Inativa'])],
        ]);

        return ParceiraResource::collection(
            Parceira::when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
                ->when(
                    ! $request->user()->hasRole('ADMIN'),
                    fn ($query) => $query->where('user_id', $request->user()->id)
                )
                ->orderBy('nome')
                ->paginate(20)
        );
    }

    public function store(StoreParceiraRequest $request): ParceiraResource
    {
        $parceira = Parceira::create($request->validated());

        return new ParceiraResource($parceira);
    }

    public function show(Parceira $parceira): ParceiraResource
    {
        $this->authorize('view', $parceira);

        return new ParceiraResource($parceira);
    }

    public function update(UpdateParceiraRequest $request, Parceira $parceira): ParceiraResource
    {
        $parceira->update($request->validated());

        return new ParceiraResource($parceira);
    }

    public function aprovar(Request $request, Parceira $parceira): ParceiraResource|JsonResponse
    {
        if ($parceira->status === 'Ativa') {
            return response()->json([
                'message' => 'Parceira já está ativa.',
            ], 409);
        }

        $parceira->aprovar($request->user());

        return new ParceiraResource($parceira);
    }
}
