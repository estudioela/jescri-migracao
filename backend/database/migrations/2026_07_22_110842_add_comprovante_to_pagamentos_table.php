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
        Schema::table('pagamentos', function (Blueprint $table) {
            $table->string('comprovante_drive_file_id')->nullable()->after('aprovado_em');
            $table->string('comprovante_drive_file_url')->nullable()->after('comprovante_drive_file_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pagamentos', function (Blueprint $table) {
            $table->dropColumn(['comprovante_drive_file_id', 'comprovante_drive_file_url']);
        });
    }
};
