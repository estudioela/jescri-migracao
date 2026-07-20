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
        ];
    }

    public function campanha(): BelongsTo
    {
        return $this->belongsTo(Campanha::class);
    }

    public function parceira(): BelongsTo
    {
        return $this->belongsTo(Parceira::class);
    }

    public function briefing(): HasOne
    {
        return $this->hasOne(Briefing::class, 'participacao_id');
    }

    public function materiais(): HasMany
    {
        return $this->hasMany(Material::class, 'participacao_id');
    }

    public function pagamento(): HasOne
    {
        return $this->hasOne(Pagamento::class, 'participacao_id');
    }
}
