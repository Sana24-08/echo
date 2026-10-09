<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CheckInController;
use App\Http\Controllers\ConnectionController;
use App\Http\Controllers\MusicController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StatusController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'message' => 'Laravel backend connected successfully!'
    ]);
});

Route::get('/status', [StatusController::class, 'status']);
Route::get('/music/status', [MusicController::class, 'status']);
Route::get('/music/tracks', [MusicController::class, 'getTracks']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/access-key/verify', [AuthController::class, 'verifyAccessKey']);

Route::middleware('auth:sanctum')->group(function () {
    // User Profile & Settings (Phase 17)
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/profile/logout', [ProfileController::class, 'logout']);
    Route::get('/profile/check-ins', [ProfileController::class, 'checkIns']);

    // Wellness Activities & Journaling (Phase 17)
    Route::post('/activities/log', [ActivityController::class, 'logActivity']);
    Route::get('/activities/history', [ActivityController::class, 'history']);
    Route::post('/journal', [ActivityController::class, 'saveJournal']);
    Route::get('/journal', [ActivityController::class, 'getJournals']);

    // Music Preferences (Phase 17)
    Route::get('/music/preferences', [MusicController::class, 'getPreferences']);
    Route::put('/music/preferences', [MusicController::class, 'updatePreferences']);

    // Chat with Gemini (Phase 2)
    Route::post('/chat', [ChatController::class, 'chat']);

    // Reports (Phase 5)
    Route::get('/reports', [ReportController::class, 'index']);

    // Check-ins & Patterns (Phase 16)
    Route::post('/check-ins', [CheckInController::class, 'store']);
    Route::get('/check-ins', [CheckInController::class, 'index']);
    Route::get('/patterns', [CheckInController::class, 'getPatterns']);

    // Connections (Phases 10-14)
    Route::get('/connections', [ConnectionController::class, 'index']);
    Route::get('/connections/incoming', [ConnectionController::class, 'indexIncoming'])
        ->middleware(['role:admin', 'user_type:teacher,parent,organization']);

    Route::post('/connections', [ConnectionController::class, 'store'])
        ->middleware(['role:user', 'user_type:student,employee,general,children']);

    Route::post('/connections/{connection}/accept', [ConnectionController::class, 'accept'])
        ->middleware(['role:admin', 'user_type:teacher,parent,organization']);
    Route::post('/connections/{connection}/reject', [ConnectionController::class, 'reject'])
        ->middleware(['role:admin', 'user_type:teacher,parent,organization']);
    Route::post('/connections/{connection}/revoke', [ConnectionController::class, 'revoke']);

    Route::patch('/connections/{connection}/permissions', [ConnectionController::class, 'updatePermissions'])
        ->middleware(['role:user']);

    // Support Access Key Management (Admin Supporters only)
    Route::middleware(['role:admin', 'user_type:teacher,parent,organization'])->group(function () {
        Route::get('/access-key', [AuthController::class, 'getAccessKey']);
        Route::post('/access-key/generate', [AuthController::class, 'generateAccessKey']);
    });
});



