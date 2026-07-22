<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Parceira\StoreParceiraRequest;
use App\Http\Resources\ParceiraResource;
use App\Models\Parceira;
use App\Services\CepLookupService;

class CadastroPublicoController extends Controller
{
    public function __construct(private readonly CepLookupService $cepLookup) {}

    public function store(StoreParceiraRequest $request): ParceiraResource
    {
        $dados = $this->cepLookup->preencherEnderecoSeNecessario($request->validated());
        unset($dados['consentimento_aceito']);

        $parceira = Parceira::create($dados);
        $parceira->registrarConsentimentoCadastro($request->ip());

        return new ParceiraResource($parceira);
    }
}
