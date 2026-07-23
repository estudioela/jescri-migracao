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
            $table->foreignId('reprovado_por')->nullable()->after('aprovado_em')->constrained('users')->nullOnDelete();
            $table->timestamp('reprovado_em')->nullable()->after('reprovado_por');
            $table->text('motivo_reprovacao')->nullable()->after('reprovado_em');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parceiras', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reprovado_por');
            $table->dropColumn(['reprovado_em', 'motivo_reprovacao']);
        });
    }
};
