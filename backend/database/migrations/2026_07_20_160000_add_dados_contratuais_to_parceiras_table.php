<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('parceiras', function (Blueprint $table) {
            $table->string('razao_social')->nullable()->after('nome');
            $table->string('canais_uso_imagem')->nullable()->after('chave_pix');
            $table->string('prazo_uso_imagem')->nullable()->after('canais_uso_imagem');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parceiras', function (Blueprint $table) {
            $table->dropColumn(['razao_social', 'canais_uso_imagem', 'prazo_uso_imagem']);
        });
    }
};
