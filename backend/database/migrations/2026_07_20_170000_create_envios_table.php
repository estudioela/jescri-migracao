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
        // Sem colunas de endereço/PIX de propósito - lido ao vivo do
        // cadastro da Parceira no momento da consulta (P0-4, proteção de PII).
        Schema::create('envios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participacao_id')
                ->unique()
                ->constrained('participacoes_na_campanha')
                ->restrictOnDelete();
            $table->enum('status', ['PENDENTE', 'EXPEDIDO', 'ENTREGUE', 'CANCELADO'])->default('PENDENTE');
            $table->string('codigo_rastreio')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('envios');
    }
};
