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
        // MySQL (InnoDB) exige que a FK de participacao_id sempre tenha um
        // índice que a sustente — dropUnique(['participacao_id']) antes de
        // criar o índice composto quebra com "Cannot drop index ...: needed
        // in a foreign key constraint" (erro 1553). PostgreSQL não tem essa
        // exigência do lado referenciador, por isso não aparecia antes.
        Schema::table('briefings', function (Blueprint $table) {
            $table->string('tipo')->default('FEED')->after('participacao_id');
            $table->json('referencias')->nullable()->after('prazo');
            $table->text('observacoes')->nullable()->after('entregaveis_esperados');
        });

        Schema::table('briefings', function (Blueprint $table) {
            $table->unique(['participacao_id', 'tipo']);
        });

        Schema::table('briefings', function (Blueprint $table) {
            $table->dropUnique(['participacao_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('briefings', function (Blueprint $table) {
            $table->unique('participacao_id');
        });

        Schema::table('briefings', function (Blueprint $table) {
            $table->dropUnique(['participacao_id', 'tipo']);
            $table->dropColumn(['tipo', 'referencias', 'observacoes']);
        });
    }
};
