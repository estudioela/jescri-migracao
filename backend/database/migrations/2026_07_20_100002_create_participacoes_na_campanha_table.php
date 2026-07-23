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
        Schema::create('participacoes_na_campanha', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campanha_id')->constrained('campanhas')->restrictOnDelete();
            $table->foreignId('parceira_id')->constrained('parceiras')->restrictOnDelete();
            $table->decimal('valor_contratado', 10, 2)->nullable();
            $table->unsignedInteger('reels_qtd')->default(0);
            $table->unsignedInteger('carrossel_qtd')->default(0);
            $table->unsignedInteger('stories_qtd')->default(0);
            $table->enum('status', ['ATIVA', 'CANCELADA'])->default('ATIVA');
            $table->timestamps();

            $table->unique(['campanha_id', 'parceira_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('participacoes_na_campanha');
    }
};
