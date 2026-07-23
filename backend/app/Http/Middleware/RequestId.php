<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestId
{
    /**
     * Correlates every log line written during a request with the request
     * itself, and echoes the id back in the response so it can be matched
     * against a bug report or an upstream proxy's own access log.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $incoming = $request->header('X-Request-Id');
        $requestId = is_string($incoming) && preg_match('/^[a-zA-Z0-9\-]{1,64}$/', $incoming) === 1
            ? $incoming
            : (string) Str::uuid();

        Log::shareContext(['request_id' => $requestId]);

        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
