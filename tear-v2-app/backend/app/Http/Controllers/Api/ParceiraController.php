<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Parceira\StoreParceiraRequest;
use App\Http\Requests\Parceira\UpdateParceiraRequest;
use App\Http\Resources\ParceiraResource;
use App\Models\Parceira;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ParceiraController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ParceiraResource::collection(Parceira::orderBy('nome')->paginate(20));
    }

    public function store(StoreParceiraRequest $request): ParceiraResource
    {
        $parceira = Parceira::create($request->validated());

        return new ParceiraResource($parceira);
    }

    public function show(Parceira $parceira): ParceiraResource
    {
        return new ParceiraResource($parceira);
    }

    public function update(UpdateParceiraRequest $request, Parceira $parceira): ParceiraResource
    {
        $parceira->update($request->validated());

        return new ParceiraResource($parceira);
    }
}
