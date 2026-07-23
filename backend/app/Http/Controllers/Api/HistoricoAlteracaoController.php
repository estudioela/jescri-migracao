<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\HistoricoAlteracaoResource;
use App\Models\Parceira;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HistoricoAlteracaoController extends Controller
{
    public function index(Parceira $parceira): AnonymousResourceCollection
    {
        $this->authorize('view', $parceira);

        return HistoricoAlteracaoResource::collection(
            $parceira->historicoAlteracoes()->with('user')->latest()->get(),
        );
    }
}
