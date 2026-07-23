<?php

namespace App\Models;

use Database\Factories\ParticipacaoNaCampanhaFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'campanha_id',
    'parceira_id',
    'valor_contratado',
    'reels_qtd',
    'carrossel_qtd',
    'stories_qtd',
    'tiktok_qtd',
    'ugc_qtd',
    'status',
])]
class ParticipacaoNaCampanha extends Model
{
    /** @use HasFactory<ParticipacaoNaCampanhaFactory> */
    use HasFactory;

    protected $table = 'participacoes_na_campanha';

    protected $attributes = [
        'status' => 'ATIVA',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'valor_contratado' => 'decimal:2',
            'reels_qtd' => 'integer',
            'carrossel_qtd' => 'integer',
            'stories_qtd' => 'integer',
            'tiktok_qtd' => 'integer',
            'ugc_qtd' => 'integer',
            'congelado_em' => 'datetime',
        ];
    }

    /**
     * Congelamento das condições comerciais (P0-3, parte 1) - único ponto de
     * escrita de `congelado_em`. Depois de congelada, valor/quantidades não
     * são mais editáveis (ver ParticipacaoController::update); `status`
     * continua editável (cancelamento não é termo comercial).
     */
    public function congelar(): void
    {
        $this->congelado_em = now();
        $this->save();
    }

    /**
     * Quantidade contratada para um tipo de conteúdo de Briefing (RN-06).
     * FEED generaliza o "Carrossel" da V1 — não há coluna própria de feed.
     */
    public function quantidadeContratadaPara(string $tipo): int
    {
        return match ($tipo) {
            'FEED' => $this->carrossel_qtd,
            'REELS' => $this->reels_qtd,
            'STORIES' => $this->stories_qtd,
            'TIKTOK' => $this->tiktok_qtd,
            'UGC' => $this->ugc_qtd,
            default => 0,
        };
    }

    public function campanha(): BelongsTo
    {
        return $this->belongsTo(Campanha::class);
    }

    public function parceira(): BelongsTo
    {
        return $this->belongsTo(Parceira::class);
    }

    public function briefings(): HasMany
    {
        return $this->hasMany(Briefing::class, 'participacao_id');
    }

    public function materiais(): HasMany
    {
        return $this->hasMany(Material::class, 'participacao_id');
    }

    public function pagamento(): HasOne
    {
        return $this->hasOne(Pagamento::class, 'participacao_id');
    }

    public function envio(): HasOne
    {
        return $this->hasOne(Envio::class, 'participacao_id');
    }
}
