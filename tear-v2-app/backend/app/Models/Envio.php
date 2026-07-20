<?php

namespace App\Models;

use Database\Factories\EnvioFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'participacao_id',
    'status',
    'codigo_rastreio',
])]
class Envio extends Model
{
    /** @use HasFactory<EnvioFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'PENDENTE',
    ];

    public function participacao(): BelongsTo
    {
        return $this->belongsTo(ParticipacaoNaCampanha::class, 'participacao_id');
    }
}
