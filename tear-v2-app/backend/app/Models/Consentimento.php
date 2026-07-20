<?php

namespace App\Models;

use Database\Factories\ConsentimentoFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['parceira_id', 'user_id', 'aceito_em', 'ip'])]
class Consentimento extends Model
{
    /** @use HasFactory<ConsentimentoFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'aceito_em' => 'datetime',
        ];
    }

    public function parceira(): BelongsTo
    {
        return $this->belongsTo(Parceira::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
