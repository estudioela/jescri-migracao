<?php

namespace App\Models;

use Database\Factories\MarcaFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'nome',
    'contato_nome',
    'contato_email',
    'contato_telefone',
    'cnpj',
    'status',
])]
class Marca extends Model
{
    /** @use HasFactory<MarcaFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'Ativa',
    ];

    public function campanhas(): HasMany
    {
        return $this->hasMany(Campanha::class);
    }
}
