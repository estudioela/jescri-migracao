<?php

namespace App\Models;

use Database\Factories\ParceiraFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'nome',
    'razao_social',
    'email',
    'telefone',
    'instagram',
    'cnpj',
    'chave_pix',
    'canais_uso_imagem',
    'prazo_uso_imagem',
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
            'consentimento_cadastro_aceito_em' => 'datetime',
            'reprovado_em' => 'datetime',
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

    public function reprovadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reprovado_por');
    }

    public function medidas(): HasMany
    {
        return $this->hasMany(MedidaInfluenciadora::class)->orderByDesc('id');
    }

    public function participacoes(): HasMany
    {
        return $this->hasMany(ParticipacaoNaCampanha::class);
    }

    public function historicoAlteracoes(): HasMany
    {
        return $this->hasMany(HistoricoAlteracao::class)->orderByDesc('id');
    }

    public function medidaAtual(): ?MedidaInfluenciadora
    {
        return $this->medidas()->first();
    }

    /**
     * Transição dedicada Inativa -> Ativa (RN-01). Único ponto de escrita de status.
     */
    public function aprovar(User $admin): void
    {
        $this->status = 'Ativa';
        $this->aprovado_por = $admin->id;
        $this->aprovado_em = now();
        $this->reprovado_por = null;
        $this->reprovado_em = null;
        $this->motivo_reprovacao = null;
        $this->save();
    }

    /**
     * Transição dedicada para solicitação de cadastro não aprovada (HU-3.6).
     * A Parceira permanece Inativa — o schema atual não tem um estado
     * "reprovada" dedicado no enum — mas fica marcada e distinguível de
     * "ainda pendente" pela presença destes campos, mesmo padrão de
     * aprovado_por/aprovado_em. Único ponto de escrita destes campos.
     */
    public function reprovar(User $admin, ?string $motivo = null): void
    {
        $this->reprovado_por = $admin->id;
        $this->reprovado_em = now();
        $this->motivo_reprovacao = $motivo;
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

    /**
     * Único ponto de escrita do consentimento do cadastro público (LGPD, dado
     * sensível incluído — medidas corporais são coletadas depois, já sob esta
     * Parceira). Não usa a tabela `consentimentos` porque, neste momento, ainda
     * não existe User vinculado (user_id só nasce em vincularUsuario(), no
     * primeiro acesso) — `consentimentos.user_id` é obrigatório e pressupõe um
     * autor autenticado, o que não existe no cadastro público.
     */
    public function registrarConsentimentoCadastro(?string $ip): void
    {
        $this->consentimento_cadastro_aceito_em = now();
        $this->consentimento_cadastro_ip = $ip;
        $this->save();
    }
}
