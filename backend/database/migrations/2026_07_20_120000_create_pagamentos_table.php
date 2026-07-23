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
        Schema::create('pagamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participacao_id')
                ->unique()
                ->constrained('participacoes_na_campanha')
                ->restrictOnDelete();
            $table->decimal('valor', 10, 2);
            $table->enum('status', ['PENDENTE', 'APROVADO', 'PAGO'])->default('PENDENTE');
            $table->foreignId('aprovado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('aprovado_em')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pagamentos');
    }
};
