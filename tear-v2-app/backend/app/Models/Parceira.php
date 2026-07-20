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
    'telefone',
    'instagram',
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
// status e user_id ficam fora do fillable de propósito: só mudam por ação dedicada (RN-01, vincularUsuario()).
class Parceira extends Model
{
    /** @use HasFactory<ParceiraFactory> */
    use HasFactory;

    // Duplicado do default da coluna: o valor de schema não é lido de volta
    // para o modelo em memória logo após create(), só numa consulta nova.
    protected $attributes = [
        'status' => 'Inativa',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'aprovado_em' => 'datetime',
        ];
    }

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

    public function aprovadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprovado_por');
    }

    /**
     * Transição dedicada Inativa -> Ativa (RN-01). Único ponto de escrita de status.
     */
    public function aprovar(User $admin): void
    {
        $this->status = 'Ativa';
        $this->aprovado_por = $admin->id;
        $this->aprovado_em = now();
        $this->save();
    }

    /**
     * Único ponto de escrita de user_id — vincula a Parceira ao User que a acessa
     * como INFLUENCIADORA (base do RBAC de leitura por dono, Sprint 1).
     */
    public function vincularUsuario(User $user): void
    {
        $this->user_id = $user->id;
        $this->save();
    }
}
