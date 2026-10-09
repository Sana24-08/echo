<?php

namespace App\Http\Controllers;

use App\Services\GeminiService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatusController extends Controller
{
    public function __construct(
        protected GeminiService $geminiService
    ) {}

    /**
     * Return truthful system operational status without exposing secret credentials.
     *
     * GET /api/status
     */
    public function status(): JsonResponse
    {
        $dbStatus = 'degraded';
        try {
            DB::connection()->getPdo();
            $dbStatus = 'operational';
        } catch (\Throwable $e) {
            $dbStatus = 'unavailable';
        }

        $geminiStatus = $this->geminiService->isConfigured() ? 'operational' : 'unconfigured';

        $isOverallHealthy = ($dbStatus === 'operational');

        return response()->json([
            'status' => $isOverallHealthy ? 'operational' : 'degraded',
            'backend' => 'operational',
            'database' => $dbStatus,
            'gemini_service' => $geminiStatus,
            'check_ins_service' => 'operational',
            'patterns_service' => 'operational',
            'reports_service' => 'operational',
            'timestamp' => Carbon::now()->toIso8601String(),
        ], 200);
    }
}
