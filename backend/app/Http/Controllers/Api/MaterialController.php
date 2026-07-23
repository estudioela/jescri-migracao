<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Material\ReprovarMaterialRequest;
use App\Http\Requests\Material\StoreMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Briefing;
use App\Models\Material;
use App\Models\ParticipacaoNaCampanha;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MaterialController extends Controller
{
    public function __construct(private readonly GoogleDriveService $drive) {}

    public function index(ParticipacaoNaCampanha $participacao): AnonymousResourceCollection
    {
        $this->authorize('view', $participacao);

        return MaterialResource::collection(
            $participacao->materiais()->latest()->get()
        );
    }

    public function store(StoreMaterialRequest $request, ParticipacaoNaCampanha $participacao): MaterialResource|JsonResponse
    {
        $this->authorize('view', $participacao);

        if (! $this->drive->isConfigured()) {
            return response()->json([
                'message' => 'Envio de materiais está temporariamente indisponível. Tente novamente mais tarde.',
            ], 503);
        }

        $file = $request->file('arquivo');
        $briefingId = $request->validated('briefing_id');
        $tipo = Briefing::findOrFail($briefingId)->tipo;

        $participacao->loadMissing('parceira', 'campanha');
        $parceiraFolder = $this->drive->ensureFolder($this->drive->rootFolderId(), $participacao->parceira->nome);
        $campanhaFolder = $this->drive->ensureFolder($parceiraFolder, $participacao->campanha->nome);
        $tipoFolder = $this->drive->ensureFolder($campanhaFolder, $tipo);
        $uploaded = $this->drive->uploadFile($tipoFolder, $file);

        $material = $participacao->materiais()->create([
            'briefing_id' => $briefingId,
            'nome_arquivo' => $file->getClientOriginalName(),
            'drive_file_id' => $uploaded['id'],
            'drive_file_url' => $uploaded['url'],
        ]);

        return new MaterialResource($material);
    }

    public function aprovar(Request $request, Material $material): MaterialResource|JsonResponse
    {
        if ($material->status !== 'PENDENTE') {
            return response()->json(['message' => 'Material já foi avaliado.'], 409);
        }

        $material->aprovar($request->user());

        return new MaterialResource($material);
    }

    public function reprovar(ReprovarMaterialRequest $request, Material $material): MaterialResource|JsonResponse
    {
        if ($material->status !== 'PENDENTE') {
            return response()->json(['message' => 'Material já foi avaliado.'], 409);
        }

        $material->reprovar($request->user(), $request->validated('motivo'));

        return new MaterialResource($material);
    }
}
