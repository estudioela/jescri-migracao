<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pagamento\StorePagamentoRequest;
use App\Http\Requests\Pagamento\UpdatePagamentoRequest;
use App\Http\Requests\Pagamento\UploadComprovanteRequest;
use App\Http\Resources\PagamentoResource;
use App\Models\Pagamento;
use App\Models\ParticipacaoNaCampanha;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;

class PagamentoController extends Controller
{
    public function __construct(private readonly GoogleDriveService $drive) {}

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
            // P0-1 vale para qualquer avanço a partir daqui, não só para a
            // transição explícita a APROVADO — sem isso, pular direto para
            // PAGO contornava a regra (achado da auditoria de regras de
            // negócio, TASK_ROUTER.md).
            if (
                in_array($data['status'], ['APROVADO', 'PAGO'], true)
                && $this->existeMaterialNaoAprovado($pagamento)
            ) {
                return response()->json([
                    'message' => 'Pagamento não pode avançar: há material da participação ainda não aprovado.',
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
     * P1 (AUDITORIA_FUNCIONAL_MVP_VS_ESPECIFICACAO.md): anexa o comprovante
     * de pagamento, mesma abstração (GoogleDriveService) já usada para
     * upload de Materiais.
     */
    public function comprovante(UploadComprovanteRequest $request, Pagamento $pagamento): PagamentoResource|JsonResponse
    {
        if (! $this->drive->isConfigured()) {
            return response()->json([
                'message' => 'Envio de comprovante está temporariamente indisponível. Tente novamente mais tarde.',
            ], 503);
        }

        $file = $request->file('arquivo');

        $pagamento->loadMissing('participacao.parceira', 'participacao.campanha');
        $participacao = $pagamento->participacao;
        $parceiraFolder = $this->drive->ensureFolder($this->drive->rootFolderId(), $participacao->parceira->nome);
        $campanhaFolder = $this->drive->ensureFolder($parceiraFolder, $participacao->campanha->nome);
        $comprovantesFolder = $this->drive->ensureFolder($campanhaFolder, 'Comprovantes');
        $uploaded = $this->drive->uploadFile($comprovantesFolder, $file);

        $pagamento->comprovante_drive_file_id = $uploaded['id'];
        $pagamento->comprovante_drive_file_url = $uploaded['url'];
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
