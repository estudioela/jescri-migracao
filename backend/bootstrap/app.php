<?php

use App\Http\Middleware\RequestId;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Spatie\Permission\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->append(SecurityHeaders::class);
        $middleware->append(RequestId::class);
        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);

        // Locaweb compartilhada expõe a aplicação atrás do proxy reverso do
        // provedor; sem confiar nele, Request::ip() (rate-limit de /login) e a
        // detecção de HTTPS ficam incorretas. IP/CIDR confirmado só em produção
        // (Etapa 1 de docs/deployment/PLANO_IMPLEMENTACAO.md) — nunca hardcode.
        $trustedProxies = array_filter(explode(',', (string) env('TRUSTED_PROXIES', '')));
        if ($trustedProxies !== []) {
            $middleware->trustProxies(at: $trustedProxies);
        }
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
