<?php

use Illuminate\Support\Facades\Route;

// Origem única para frontend e backend (ADR-015): o build do frontend
// (Vite → backend/public/build, ver frontend/vite.config.ts) é servido
// pelo Laravel para qualquer rota que não seja /api/*, /up ou um asset
// físico em public/ — essas são resolvidas antes de chegar aqui (rotas de
// API são registradas antes das de web, ver
// Illuminate\Foundation\Configuration\ApplicationBuilder::buildRoutingCallback;
// assets físicos são servidos direto pelo servidor web).
Route::get('/{any?}', function () {
    $index = public_path('build/index.html');

    if (! file_exists($index)) {
        // Em dev, o par `npm run dev` (Vite, porta 5173) + `php artisan serve`
        // é intencionalmente duas origens (HMR do Vite) — este backend não
        // serve a SPA nesse modo, só `/api/*`. Não é regressão de ADR-015:
        // `/` nunca serviu o portal real aqui (era a view `welcome` antes).
        // Resposta direta (não `abort()`): a view padrão de erro 404 do
        // Laravel não exibe a mensagem da exceção ao navegador.
        $mensagem = app()->environment('local')
            ? 'Build do frontend não encontrado em public/build. Em desenvolvimento, acesse o frontend pelo servidor do Vite (`npm run dev` em frontend/, padrão http://localhost:5173) — este backend serve só /api/* nesse modo. Para servir o build completo por aqui (como em produção), rode `npm run build:locaweb` em frontend/.'
            : 'Build do frontend não encontrado. Rode `npm run build:locaweb` em frontend/.';

        return response($mensagem, 404)->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    return response(file_get_contents($index))->header('Content-Type', 'text/html');
})->where('any', '.*');
