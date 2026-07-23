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
        Schema::create('medidas_influenciadora', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parceira_id')->constrained('parceiras')->restrictOnDelete();
            $table->enum('sutia_tamanho', ['P', 'M', 'G', 'GG'])->nullable();
            $table->enum('sutia_numeracao', ['42', '44', '46', '48'])->nullable();
            $table->enum('sutia_taca', ['A', 'B', 'C', 'D'])->nullable();
            $table->enum('calcinha_tamanho', ['P', 'M', 'G', 'GG'])->nullable();
            $table->enum('linha_noite_tamanho', ['P', 'M', 'G', 'GG'])->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medidas_influenciadora');
    }
};
