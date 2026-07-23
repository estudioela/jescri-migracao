<?php

namespace Tests\Feature;

use Tests\TestCase;

class RequestIdTest extends TestCase
{
    public function test_response_echoes_a_generated_request_id(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertHeader('X-Request-Id');
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f-]{36}$/',
            $response->headers->get('X-Request-Id')
        );
    }

    public function test_response_echoes_back_a_well_formed_incoming_request_id(): void
    {
        $response = $this->getJson('/api/health', ['X-Request-Id' => 'trace-abc-123']);

        $response->assertHeader('X-Request-Id', 'trace-abc-123');
    }

    public function test_malformed_incoming_request_id_is_replaced(): void
    {
        $response = $this->getJson('/api/health', ['X-Request-Id' => "bad\nvalue"]);

        $this->assertNotSame("bad\nvalue", $response->headers->get('X-Request-Id'));
    }
}
