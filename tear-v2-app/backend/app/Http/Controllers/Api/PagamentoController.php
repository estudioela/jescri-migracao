<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pagamento\StorePagamentoRequest;
use App\Http\Requests\Pagamento\UpdatePagamentoRequest;
use App\Http\Resources\PagamentoResource;
use App\Models\Pagamento;
use App\Models\ParticipacaoNaCampanha;

class PagamentoController extends Controller
{
    public function show(ParticipacaoNaCampanha $participacao): PagamentoResource
    {
        $this->authorize('view', $participacao);

        $pagamento = $participacao->pagamento()->firstOrFail();

        return new PagamentoResource($pagamento);
    }

    public function store(StorePagamentoRequest $request, ParticipacaoNaCampanha $participacao): PagamentoResource
    {
        $pagamento = $participacao->pagamento()->create($request->validated());

        return new PagamentoResource($pagamento);
    }

    public function update(UpdatePagamentoRequest $request, Pagamento $pagamento): PagamentoResource
    {
        $data = $request->validated();

        if (array_key_exists('valor', $data)) {
            $pagamento->valor = $data['valor'];
        }

        if (($data['status'] ?? null) && $data['status'] !== $pagamento->status) {
            $pagamento->status = $data['status'];
            if ($data['status'] === 'APROVADO') {
                $pagamento->aprovado_por = $request->user()->id;
                $pagamento->aprovado_em = now();
            }
        }

        $pagamento->save();

        return new PagamentoResource($pagamento);
    }
}
