<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Envio\StoreEnvioRequest;
use App\Http\Requests\Envio\UpdateEnvioRequest;
use App\Http\Resources\EnvioResource;
use App\Models\Envio;
use App\Models\ParticipacaoNaCampanha;

class EnvioController extends Controller
{
    public function show(ParticipacaoNaCampanha $participacao): EnvioResource
    {
        $this->authorize('view', $participacao);

        $envio = $participacao->envio()->firstOrFail();

        return new EnvioResource($envio);
    }

    public function store(StoreEnvioRequest $request, ParticipacaoNaCampanha $participacao): EnvioResource
    {
        $envio = $participacao->envio()->create($request->validated());

        return new EnvioResource($envio);
    }

    public function update(UpdateEnvioRequest $request, Envio $envio): EnvioResource
    {
        $envio->update($request->validated());

        return new EnvioResource($envio);
    }
}
