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
            $table->foreignId('aprovado_por')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('aprovado_em')->nullable()->after('aprovado_por');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parceiras', function (Blueprint $table) {
            $table->dropConstrainedForeignId('aprovado_por');
            $table->dropColumn('aprovado_em');
        });
    }
};
