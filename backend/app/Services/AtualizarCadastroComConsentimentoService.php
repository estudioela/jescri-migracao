<?php

namespace App\Services;

use App\Models\Consentimento;
use App\Models\HistoricoAlteracao;
use App\Models\Parceira;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Diff campo a campo + aceite explícito, tudo na mesma transação (ESPECIFICACAO_FUNCIONAL §5).
 */
class AtualizarCadastroComConsentimentoService
{
    /**
     * @param  array<string, mixed>  $dados
     */
    public function atualizar(Parceira $parceira, array $dados, User $autor, ?string $ip = null): Parceira
    {
        DB::transaction(function () use ($parceira, $dados, $autor, $ip) {
            $anterior = $parceira->only(array_keys($dados));

            $parceira->update($dados);

            foreach ($dados as $campo => $novo) {
                $velho = $anterior[$campo] ?? null;

                if ((string) $velho === (string) $novo) {
                    continue;
                }

                HistoricoAlteracao::create([
                    'parceira_id' => $parceira->id,
                    'user_id' => $autor->id,
                    'campo' => $campo,
                    'valor_anterior' => $velho,
                    'valor_novo' => $novo,
                    'ip' => $ip,
                ]);
            }

            Consentimento::create([
                'parceira_id' => $parceira->id,
                'user_id' => $autor->id,
                'aceito_em' => now(),
                'ip' => $ip,
            ]);
        });

        return $parceira->fresh();
    }
}
