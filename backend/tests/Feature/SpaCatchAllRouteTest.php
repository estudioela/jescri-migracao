<?php

namespace Tests\Feature;

use Tests\TestCase;

class SpaCatchAllRouteTest extends TestCase
{
    private function comBuildFake(callable $callback): void
    {
        $dir = public_path('build');
        $index = $dir.'/index.html';
        $jaExistia = is_dir($dir);

        @mkdir($dir, recursive: true);
        file_put_contents($index, '<!doctype html><div id="root">spa-fake</div>');

        try {
            $callback();
        } finally {
            unlink($index);
            if (! $jaExistia) {
                rmdir($dir);
            }
        }
    }

    public function test_serve_o_build_do_frontend_para_rotas_desconhecidas(): void
    {
        $this->comBuildFake(function () {
            $response = $this->get('/participacoes/123/qualquer-coisa');

            $response->assertOk();
            $response->assertSee('spa-fake', false);
        });
    }

    public function test_serve_o_build_do_frontend_na_raiz(): void
    {
        $this->comBuildFake(function () {
            $this->get('/')->assertOk();
        });
    }

    public function test_retorna_404_quando_build_do_frontend_nao_existe(): void
    {
        $index = public_path('build/index.html');
        $this->assertFileDoesNotExist($index);

        $this->get('/')->assertNotFound();
    }

    public function test_rota_de_api_nao_e_capturada_pelo_catch_all_da_spa(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk()->assertJson(['status' => 'ok']);
    }
}
