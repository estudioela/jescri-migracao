<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Briefing\StoreBriefingRequest;
use App\Http\Requests\Briefing\UpdateBriefingRequest;
use App\Http\Resources\BriefingResource;
use App\Models\Briefing;
use App\Models\ParticipacaoNaCampanha;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BriefingController extends Controller
{
    public function index(ParticipacaoNaCampanha $participacao): AnonymousResourceCollection
    {
        $this->authorize('view', $participacao);

        return BriefingResource::collection($participacao->briefings()->get());
    }

    public function store(StoreBriefingRequest $request, ParticipacaoNaCampanha $participacao): BriefingResource
    {
        $briefing = $participacao->briefings()->create($request->validated());

        return new BriefingResource($briefing);
    }

    public function update(UpdateBriefingRequest $request, Briefing $briefing): BriefingResource
    {
        $briefing->update($request->validated());

        return new BriefingResource($briefing);
    }
}
