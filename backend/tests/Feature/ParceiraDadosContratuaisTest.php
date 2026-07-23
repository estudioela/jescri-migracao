<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ParceiraDadosContratuaisTest extends TestCase
{
    use RefreshDatabase;

    private function autenticarComoAdmin(): void
    {
        Role::findOrCreate('ADMIN', 'web');
        $admin = User::factory()->create();
        $admin->assignRole('ADMIN');
        Sanctum::actingAs($admin);
    }

    private function dadosCadastroValidos(array $overrides = []): array
    {
        return array_merge([
            'nome' => 'Maria Influenciadora',
            'email' => 'maria@example.com',
            'telefone' => '(11) 98888-7777',
            'instagram' => '@mariainfluenciadora',
            'chave_pix' => 'maria@example.com',
            'cidade' => 'São Paulo',
            'uf' => 'SP',
            'consentimento_aceito' => true,
        ], $overrides);
    }

    public function test_cadastro_aceita_e_persiste_dados_contratuais(): void
    {
        $this->autenticarComoAdmin();

        $response = $this->postJson('/api/parceiras', $this->dadosCadastroValidos([
            'razao_social' => 'Maria Influenciadora LTDA',
            'canais_uso_imagem' => 'Instagram, TikTok',
            'prazo_uso_imagem' => '12 meses',
        ]));

        $response->assertCreated();
        $response->assertJsonPath('data.razao_social', 'Maria Influenciadora LTDA');
        $this->assertDatabaseHas('parceiras', [
            'razao_social' => 'Maria Influenciadora LTDA',
            'canais_uso_imagem' => 'Instagram, TikTok',
            'prazo_uso_imagem' => '12 meses',
        ]);
    }

    public function test_cadastro_sem_dados_contratuais_continua_funcionando(): void
    {
        $this->autenticarComoAdmin();

        $response = $this->postJson('/api/parceiras', $this->dadosCadastroValidos());

        $response->assertCreated();
        $response->assertJsonPath('data.razao_social', null);
    }
}
