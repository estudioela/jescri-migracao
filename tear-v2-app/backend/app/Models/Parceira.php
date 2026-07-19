<?php

namespace App\Models;

use Database\Factories\ParceiraFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'nome',
    'email',
    'cnpj',
    'chave_pix',
    'cep',
    'rua',
    'bairro',
    'cidade',
    'uf',
    'numero',
    'complemento',
])]
// status fica fora do fillable de propósito: nasce Inativa e só muda por ação dedicada futura (RN-01).
class Parceira extends Model
{
    /** @use HasFactory<ParceiraFactory> */
    use HasFactory;

    // Duplicado do default da coluna: o valor de schema não é lido de volta
    // para o modelo em memória logo após create(), só numa consulta nova.
    protected $attributes = [
        'status' => 'Inativa',
    ];

    protected static function booted(): void
    {
        static::saving(function (Parceira $parceira) {
            $parceira->endereco_completo = collect([
                $parceira->rua,
                $parceira->numero,
                $parceira->complemento,
                $parceira->bairro,
                $parceira->cidade,
                $parceira->uf,
            ])->filter()->implode(', ');
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
