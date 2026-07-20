<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Material\ReprovarMaterialRequest;
use App\Http\Requests\Material\StoreMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Material;
use App\Models\ParticipacaoNaCampanha;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

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

    public function store(StoreMaterialRequest $request, ParticipacaoNaCampanha $participacao): MaterialResource
    {
        $file = $request->file('arquivo');
        $tipo = $request->validated('tipo');

        if ($this->drive->isConfigured()) {
            $participacao->loadMissing('parceira', 'campanha');
            $parceiraFolder = $this->drive->ensureFolder($this->drive->rootFolderId(), $participacao->parceira->nome);
            $campanhaFolder = $this->drive->ensureFolder($parceiraFolder, $participacao->campanha->nome);
            $tipoFolder = $this->drive->ensureFolder($campanhaFolder, $tipo);
            $uploaded = $this->drive->uploadFile($tipoFolder, $file);
            $driveFileId = $uploaded['id'];
            $driveFileUrl = $uploaded['url'];
        } else {
            $path = $file->store('materiais', 'public');
            $driveFileId = null;
            $driveFileUrl = Storage::disk('public')->url($path);
        }

        $material = $participacao->materiais()->create([
            'tipo' => $tipo,
            'nome_arquivo' => $file->getClientOriginalName(),
            'drive_file_id' => $driveFileId,
            'drive_file_url' => $driveFileUrl,
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
