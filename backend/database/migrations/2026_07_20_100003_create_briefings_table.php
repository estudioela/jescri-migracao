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
        Schema::create('briefings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participacao_id')
                ->unique()
                ->constrained('participacoes_na_campanha')
                ->restrictOnDelete();
            $table->text('orientacoes');
            $table->date('prazo');
            $table->text('entregaveis_esperados')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('briefings');
    }
};
