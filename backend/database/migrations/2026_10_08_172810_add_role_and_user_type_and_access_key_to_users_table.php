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
            $table->enum('role', ['user', 'admin'])
                ->default('user')
                ->after('password');

            $table->enum('user_type', [
                'student',
                'employee',
                'general',
                'children',
                'teacher',
                'parent',
                'organization',
            ])->after('role');

            $table->string('access_key')
                ->nullable()
                ->after('user_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'user_type', 'access_key']);
        });
    }
};
