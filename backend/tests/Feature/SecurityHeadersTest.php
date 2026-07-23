<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_api_responses_include_baseline_security_headers(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    }

    public function test_hsts_header_is_absent_over_plain_http(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertHeaderMissing('Strict-Transport-Security');
    }
}
