<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pagamento\StorePagamentoRequest;
use App\Http\Requests\Pagamento\UpdatePagamentoRequest;
use App\Http\Resources\PagamentoResource;
use App\Models\Pagamento;
use App\Models\ParticipacaoNaCampanha;
use Illuminate\Http\JsonResponse;

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

    public function update(UpdatePagamentoRequest $request, Pagamento $pagamento): PagamentoResource|JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('valor', $data)) {
            $pagamento->valor = $data['valor'];
        }

        if (($data['status'] ?? null) && $data['status'] !== $pagamento->status) {
            if ($data['status'] === 'APROVADO' && $this->existeMaterialNaoAprovado($pagamento)) {
                return response()->json([
                    'message' => 'Pagamento não pode ser aprovado: há material da participação ainda não aprovado.',
                ], 409);
            }

            $pagamento->status = $data['status'];
            if ($data['status'] === 'APROVADO') {
                $pagamento->aprovado_por = $request->user()->id;
                $pagamento->aprovado_em = now();
            }
        }

        $pagamento->save();

        return new PagamentoResource($pagamento);
    }

    /**
     * P0-1: pagamento só aprova se todo Material da participação estiver
     * aprovado (equivalente a Aprovado/Publicado do legado — Sistema B ainda
     * não tem status "Publicado" para Material). Vácuo (nenhum material)
     * aprova normalmente, mesma regra do legado.
     */
    private function existeMaterialNaoAprovado(Pagamento $pagamento): bool
    {
        return $pagamento->participacao->materiais()
            ->where('status', '!=', 'APROVADO')
            ->exists();
    }
}
