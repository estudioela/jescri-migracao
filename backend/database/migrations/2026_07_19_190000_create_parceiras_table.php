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
        Schema::create('parceiras', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->unique();
            $table->enum('status', ['Ativa', 'Inativa'])->default('Inativa');
            $table->string('email')->nullable();
            $table->string('cnpj')->nullable();
            $table->string('chave_pix')->nullable();
            $table->string('cep')->nullable();
            $table->string('rua')->nullable();
            $table->string('bairro')->nullable();
            $table->string('cidade')->nullable();
            $table->string('uf', 2)->nullable();
            $table->string('numero')->nullable();
            $table->string('complemento')->nullable();
            $table->string('endereco_completo')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parceiras');
    }
};
