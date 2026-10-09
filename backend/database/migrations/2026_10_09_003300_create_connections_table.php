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
        Schema::create('connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supporter_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->boolean('allow_mood')->default(false);
            $table->boolean('allow_stress')->default(false);
            $table->boolean('allow_sleep')->default(false);
            $table->boolean('allow_energy')->default(false);
            $table->timestamps();

            $table->index(['requester_id', 'supporter_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('connections');
    }
};
