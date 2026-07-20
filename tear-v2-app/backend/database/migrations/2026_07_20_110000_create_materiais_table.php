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
        Schema::create('materiais', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participacao_id')
                ->constrained('participacoes_na_campanha')
                ->restrictOnDelete();
            $table->enum('tipo', ['REELS', 'STORIES', 'FOTOS', 'OUTROS']);
            $table->string('nome_arquivo');
            $table->string('drive_file_id')->nullable();
            $table->string('drive_file_url')->nullable();
            $table->enum('status', ['PENDENTE', 'APROVADO', 'REPROVADO'])->default('PENDENTE');
            $table->foreignId('aprovado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('aprovado_em')->nullable();
            $table->text('motivo_reprovacao')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materiais');
    }
};
