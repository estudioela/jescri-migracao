<?php

namespace App\Models;

use Database\Factories\MaterialFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'participacao_id',
    'tipo',
    'nome_arquivo',
    'drive_file_id',
    'drive_file_url',
])]
class Material extends Model
{
    /** @use HasFactory<MaterialFactory> */
    use HasFactory;

    protected $table = 'materiais';

    protected $attributes = [
        'status' => 'PENDENTE',
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

    public function participacao(): BelongsTo
    {
        return $this->belongsTo(ParticipacaoNaCampanha::class, 'participacao_id');
    }

    public function aprovadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprovado_por');
    }

    public function aprovar(User $admin): void
    {
        $this->status = 'APROVADO';
        $this->aprovado_por = $admin->id;
        $this->aprovado_em = now();
        $this->motivo_reprovacao = null;
        $this->save();
    }

    public function reprovar(User $admin, string $motivo): void
    {
        $this->status = 'REPROVADO';
        $this->aprovado_por = $admin->id;
        $this->aprovado_em = now();
        $this->motivo_reprovacao = $motivo;
        $this->save();
    }
}
