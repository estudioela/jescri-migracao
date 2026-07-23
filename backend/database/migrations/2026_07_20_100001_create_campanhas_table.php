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
        Schema::create('campanhas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marca_id')->constrained('marcas')->restrictOnDelete();
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->date('data_inicio');
            $table->date('data_fim')->nullable();
            $table->enum('status', ['PLANEJADA', 'ATIVA', 'ENCERRADA', 'CANCELADA'])->default('PLANEJADA');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campanhas');
    }
};
