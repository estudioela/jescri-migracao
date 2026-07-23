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
        Schema::create('historico_alteracoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parceira_id')->constrained('parceiras')->restrictOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('campo');
            $table->text('valor_anterior')->nullable();
            $table->text('valor_novo')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historico_alteracoes');
    }
};
