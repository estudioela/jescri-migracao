<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Parceira\StoreParceiraRequest;
use App\Http\Resources\ParceiraResource;
use App\Models\Parceira;
use App\Services\CepLookupService;
use Illuminate\Support\Facades\DB;

class CadastroPublicoController extends Controller
{
    public function __construct(private readonly CepLookupService $cepLookup) {}

    public function store(StoreParceiraRequest $request): ParceiraResource
    {
        $dados = $this->cepLookup->preencherEnderecoSeNecessario($request->validated());
        unset($dados['consentimento_aceito']);

        $parceira = DB::transaction(function () use ($dados, $request) {
            $parceira = Parceira::create($dados);
            $parceira->registrarConsentimentoCadastro($request->ip());

            return $parceira;
        });

        return new ParceiraResource($parceira);
    }
}
