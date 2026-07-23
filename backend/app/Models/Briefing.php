<?php

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\BriefingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// data_aprovacao_interna fica fora do fillable de propósito: é sempre
// derivada de `prazo` (P0-5), nunca um campo livre editável diretamente.
#[Fillable([
    'participacao_id',
    'tipo',
    'orientacoes',
    'prazo',
    'referencias',
    'entregaveis_esperados',
    'observacoes',
])]
class Briefing extends Model
{
    /** @use HasFactory<BriefingFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'prazo' => 'date',
            'data_aprovacao_interna' => 'date',
            'referencias' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Briefing $briefing) {
            if ($briefing->prazo !== null) {
                $briefing->data_aprovacao_interna = self::calcularDataAprovacaoInterna($briefing->prazo);
            }
        });
    }

    /**
     * data de aprovação interna = data de postagem (prazo) − 7 dias; se cair
     * em sexta, sábado ou domingo, empurra para a segunda-feira seguinte
     * (P0-5, CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md).
     */
    public static function calcularDataAprovacaoInterna(Carbon $prazo): Carbon
    {
        $aprovacao = $prazo->copy()->subDays(7);

        return match (true) {
            $aprovacao->isFriday() => $aprovacao->addDays(3),
            $aprovacao->isSaturday() => $aprovacao->addDays(2),
            $aprovacao->isSunday() => $aprovacao->addDay(),
            default => $aprovacao,
        };
    }

    public function participacao(): BelongsTo
    {
        return $this->belongsTo(ParticipacaoNaCampanha::class, 'participacao_id');
    }
}
