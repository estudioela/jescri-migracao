<?php

namespace App\Models;

use Database\Factories\MedidaInfluenciadoraFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'parceira_id',
    'sutia_tamanho',
    'sutia_numeracao',
    'sutia_taca',
    'calcinha_tamanho',
    'linha_noite_tamanho',
])]
class MedidaInfluenciadora extends Model
{
    /** @use HasFactory<MedidaInfluenciadoraFactory> */
    use HasFactory;

    protected $table = 'medidas_influenciadora';

    public function parceira(): BelongsTo
    {
        return $this->belongsTo(Parceira::class);
    }
}
