<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Decisão aprovada em docs/DECISAO_TAXONOMIA_MATERIAL_BRIEFING.md
     * (Opção B): Material passa a ter briefing_id obrigatório; `tipo`
     * deixa de ser digitado, passa a ser sempre derivado do Briefing
     * vinculado (Material::booted(), mesmo padrão de
     * Briefing::data_aprovacao_interna). FOTOS/OUTROS saem do domínio -
     * sem uso real (confirmado por grep na suíte de testes e ausência de
     * `database.sqlite` neste ambiente antes desta migration).
     */
    public function up(): void
    {
        Schema::table('materiais', function (Blueprint $table) {
            $table->foreignId('briefing_id')->after('participacao_id')
                ->constrained('briefings')->restrictOnDelete();
        });

        Schema::table('materiais', function (Blueprint $table) {
            $table->enum('tipo', ['FEED', 'REELS', 'STORIES', 'TIKTOK', 'UGC'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('materiais', function (Blueprint $table) {
            $table->dropConstrainedForeignId('briefing_id');
            $table->enum('tipo', ['REELS', 'STORIES', 'FOTOS', 'OUTROS'])->change();
        });
    }
};
