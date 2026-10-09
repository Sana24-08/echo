<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    /**
     * Get aggregated well-being report for the authenticated user or supporter.
     *
     * GET /api/reports?period=7d|30d|90d|all
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $period = (string)$request->query('period', '30d');
        $isAdminView = $request->boolean('admin') || ($user->role === 'admin' && $request->has('admin'));

        if ($isAdminView) {
            $report = $this->reportService->generateSupporterReport($user, $period);
        } else {
            $report = $this->reportService->generateUserReport($user, $period);
        }

        return response()->json(array_merge([
            'success' => true,
        ], $report), 200);
    }
}
