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
        Schema::table('briefings', function (Blueprint $table) {
            $table->dropUnique(['participacao_id']);
            $table->string('tipo')->default('FEED')->after('participacao_id');
            $table->json('referencias')->nullable()->after('prazo');
            $table->text('observacoes')->nullable()->after('entregaveis_esperados');
        });

        Schema::table('briefings', function (Blueprint $table) {
            $table->unique(['participacao_id', 'tipo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('briefings', function (Blueprint $table) {
            $table->dropUnique(['participacao_id', 'tipo']);
            $table->dropColumn(['tipo', 'referencias', 'observacoes']);
        });

        Schema::table('briefings', function (Blueprint $table) {
            $table->unique('participacao_id');
        });
    }
};
