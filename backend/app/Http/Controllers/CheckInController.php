<?php

namespace App\Http\Controllers;

use App\Models\CheckIn;
use App\Services\PatternAnalysisService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckInController extends Controller
{
    public function __construct(
        protected PatternAnalysisService $patternAnalysisService
    ) {}

    /**
     * Store a new check-in record for the authenticated user.
     *
     * POST /api/check-ins
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Backend validation
        $validated = $request->validate([
            'mood' => ['required', 'integer', 'between:1,10'],
            'energy' => ['required', 'integer', 'between:1,10'],
            'focus' => ['required', 'integer', 'between:1,10'],
            'stress' => ['required', 'integer', 'between:1,10'],
            'sleep' => ['required', 'integer', 'between:1,10'],
        ]);

        // Double-click idempotency guard:
        // If an identical check-in was saved by this user in the last 4 seconds,
        // return that record idempotently to prevent accidental duplicate rows.
        $recentDuplicate = CheckIn::where('user_id', $user->id)
            ->where('created_at', '>=', Carbon::now()->subSeconds(4))
            ->where('mood', $validated['mood'])
            ->where('energy', $validated['energy'])
            ->where('focus', $validated['focus'])
            ->where('stress', $validated['stress'])
            ->where('sleep', $validated['sleep'])
            ->latest('id')
            ->first();

        if ($recentDuplicate) {
            $formatted = $this->patternAnalysisService->formatCheckIn($recentDuplicate);
            $summary = $this->patternAnalysisService->classifyCurrentState($validated);

            return response()->json([
                'success' => true,
                'message' => 'Check-in recorded successfully.',
                'check_in' => $formatted,
                'timestamp' => $recentDuplicate->created_at->toISOString(),
                'summary' => $summary,
            ], 201);
        }

        // Persist using database transaction
        $checkIn = DB::transaction(function () use ($user, $validated) {
            return CheckIn::create([
                'user_id' => $user->id,
                'mood' => $validated['mood'],
                'energy' => $validated['energy'],
                'focus' => $validated['focus'],
                'stress' => $validated['stress'],
                'sleep' => $validated['sleep'],
            ]);
        });

        $formatted = $this->patternAnalysisService->formatCheckIn($checkIn);
        $summary = $this->patternAnalysisService->classifyCurrentState($validated);

        return response()->json([
            'success' => true,
            'message' => 'Check-in recorded successfully.',
            'check_in' => $formatted,
            'timestamp' => $checkIn->created_at->toISOString(),
            'summary' => $summary,
        ], 201);
    }

    /**
     * Retrieve pattern and trend analysis for the authenticated user.
     *
     * GET /api/patterns?period=7d|30d|90d|all
     */
    public function getPatterns(Request $request): JsonResponse
    {
        $user = $request->user();
        $period = (string)$request->query('period', '7d');

        $analysis = $this->patternAnalysisService->analyze($user, $period);

        return response()->json(array_merge([
            'success' => true,
        ], $analysis), 200);
    }

    /**
     * List authenticated user's recent check-ins.
     *
     * GET /api/check-ins
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $checkIns = $user->checkIns()
            ->latest('created_at')
            ->limit(30)
            ->get()
            ->map(fn(CheckIn $c) => $this->patternAnalysisService->formatCheckIn($c));

        return response()->json([
            'success' => true,
            'check_ins' => $checkIns,
        ], 200);
    }
}
