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
        Schema::table('participacoes_na_campanha', function (Blueprint $table) {
            $table->unsignedInteger('tiktok_qtd')->default(0)->after('stories_qtd');
            $table->unsignedInteger('ugc_qtd')->default(0)->after('tiktok_qtd');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('participacoes_na_campanha', function (Blueprint $table) {
            $table->dropColumn(['tiktok_qtd', 'ugc_qtd']);
        });
    }
};
