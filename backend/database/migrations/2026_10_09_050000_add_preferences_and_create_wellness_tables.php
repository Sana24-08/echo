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
        Schema::table('users', function (Blueprint $table) {
            $table->json('notification_preferences')->nullable()->after('access_key');
            $table->json('privacy_settings')->nullable()->after('notification_preferences');
            $table->json('music_preferences')->nullable()->after('privacy_settings');
        });

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('prompt')->nullable();
            $table->text('content');
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('activity_type');
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->boolean('completed')->default(true);
            $table->string('feeling')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('journal_entries');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['notification_preferences', 'privacy_settings', 'music_preferences']);
        });
    }
};
