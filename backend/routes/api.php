<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BriefingController;
use App\Http\Controllers\Api\CadastroPublicoController;
use App\Http\Controllers\Api\CampanhaController;
use App\Http\Controllers\Api\EnvioController;
use App\Http\Controllers\Api\HistoricoAlteracaoController;
use App\Http\Controllers\Api\MarcaController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\MedidaController;
use App\Http\Controllers\Api\MeParticipacaoController;
use App\Http\Controllers\Api\PagamentoController;
use App\Http\Controllers\Api\ParceiraController;
use App\Http\Controllers\Api\ParticipacaoController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
    ]);
});

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:6,1');

Route::post('/password/forgot', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:6,1');

Route::post('/password/reset', [AuthController::class, 'resetPassword'])
    ->middleware('throttle:6,1');

Route::post('/parceiras/cadastro', [CadastroPublicoController::class, 'store'])
    ->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::patch('/parceiras/{parceira}/aprovar', [ParceiraController::class, 'aprovar'])
        ->middleware('role:ADMIN');
    Route::post('/parceiras/{parceira}/reenviar-convite', [ParceiraController::class, 'reenviarConvite'])
        ->middleware(['role:ADMIN', 'throttle:6,1']);
    Route::patch('/parceiras/{parceira}/reprovar', [ParceiraController::class, 'reprovar'])
        ->middleware('role:ADMIN');

    Route::get('/me/parceira', [ParceiraController::class, 'me']);
    Route::get('/me/participacoes', [MeParticipacaoController::class, 'index']);
    Route::get('/me/historico', [MeParticipacaoController::class, 'historico']);
    Route::get('/me/participacoes/{participacao}', [MeParticipacaoController::class, 'show']);

    Route::apiResource('parceiras', ParceiraController::class)->except(['destroy', 'store']);
    Route::post('/parceiras', [ParceiraController::class, 'store'])->middleware('role:ADMIN');

    Route::get('/parceiras/{parceira}/medidas', [MedidaController::class, 'index']);
    Route::post('/parceiras/{parceira}/medidas', [MedidaController::class, 'store']);

    Route::get('/parceiras/{parceira}/historico', [HistoricoAlteracaoController::class, 'index']);

    Route::get('/marcas', [MarcaController::class, 'index']);
    Route::get('/marcas/{marca}', [MarcaController::class, 'show']);
    Route::post('/marcas', [MarcaController::class, 'store'])->middleware('role:ADMIN');
    Route::patch('/marcas/{marca}', [MarcaController::class, 'update'])->middleware('role:ADMIN');

    Route::get('/campanhas', [CampanhaController::class, 'index']);
    Route::get('/campanhas/{campanha}', [CampanhaController::class, 'show']);
    Route::post('/campanhas', [CampanhaController::class, 'store'])->middleware('role:ADMIN');
    Route::patch('/campanhas/{campanha}', [CampanhaController::class, 'update'])->middleware('role:ADMIN');

    Route::get('/campanhas/{campanha}/participacoes', [ParticipacaoController::class, 'index']);
    Route::post('/campanhas/{campanha}/participacoes', [ParticipacaoController::class, 'store'])
        ->middleware('role:ADMIN');
    Route::patch('/participacoes/{participacao}', [ParticipacaoController::class, 'update'])
        ->middleware('role:ADMIN');
    Route::patch('/participacoes/{participacao}/congelar', [ParticipacaoController::class, 'congelar'])
        ->middleware('role:ADMIN');

    Route::get('/participacoes/{participacao}/briefings', [BriefingController::class, 'index']);
    Route::post('/participacoes/{participacao}/briefings', [BriefingController::class, 'store'])
        ->middleware('role:ADMIN');
    Route::patch('/briefings/{briefing}', [BriefingController::class, 'update'])
        ->middleware('role:ADMIN');

    Route::get('/participacoes/{participacao}/materiais', [MaterialController::class, 'index']);
    // Dono da participação OU ADMIN (HU-1.4) - autorização por policy no
    // controller, mesmo padrão de MedidaController::store.
    Route::post('/participacoes/{participacao}/materiais', [MaterialController::class, 'store']);
    Route::patch('/materiais/{material}/aprovar', [MaterialController::class, 'aprovar'])
        ->middleware('role:ADMIN');
    Route::patch('/materiais/{material}/reprovar', [MaterialController::class, 'reprovar'])
        ->middleware('role:ADMIN');

    Route::get('/participacoes/{participacao}/pagamento', [PagamentoController::class, 'show']);
    Route::post('/participacoes/{participacao}/pagamento', [PagamentoController::class, 'store'])
        ->middleware('role:ADMIN');
    Route::patch('/pagamentos/{pagamento}', [PagamentoController::class, 'update'])
        ->middleware('role:ADMIN');
    Route::post('/pagamentos/{pagamento}/comprovante', [PagamentoController::class, 'comprovante'])
        ->middleware('role:ADMIN');

    Route::get('/participacoes/{participacao}/envio', [EnvioController::class, 'show']);
    Route::post('/participacoes/{participacao}/envio', [EnvioController::class, 'store'])
        ->middleware('role:ADMIN');
    Route::patch('/envios/{envio}', [EnvioController::class, 'update'])
        ->middleware('role:ADMIN');
});
