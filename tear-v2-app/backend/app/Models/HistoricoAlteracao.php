<?php

namespace App\Models;

use Database\Factories\HistoricoAlteracaoFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['parceira_id', 'user_id', 'campo', 'valor_anterior', 'valor_novo', 'ip'])]
class HistoricoAlteracao extends Model
{
    /** @use HasFactory<HistoricoAlteracaoFactory> */
    use HasFactory;

    protected $table = 'historico_alteracoes';

    const UPDATED_AT = null;

    public function parceira(): BelongsTo
    {
        return $this->belongsTo(Parceira::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
