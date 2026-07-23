<?php

namespace App\Models;

use Database\Factories\CampanhaFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'marca_id',
    'nome',
    'descricao',
    'data_inicio',
    'data_fim',
    'status',
])]
class Campanha extends Model
{
    /** @use HasFactory<CampanhaFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'PLANEJADA',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data_inicio' => 'date',
            'data_fim' => 'date',
        ];
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class);
    }

    public function participacoes(): HasMany
    {
        return $this->hasMany(ParticipacaoNaCampanha::class);
    }
}
