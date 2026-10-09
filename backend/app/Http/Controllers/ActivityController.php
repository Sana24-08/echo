<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Log a completed wellness activity.
     *
     * POST /api/activities/log
     */
    public function logActivity(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'activity_type' => ['required', 'string', 'in:breathe,walk,grounding,stretch,journal,music,hydrate'],
            'duration_seconds' => ['required', 'integer', 'min:0', 'max:86400'],
            'completed' => ['boolean'],
            'feeling' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        $log = ActivityLog::create([
            'user_id' => $user->id,
            'activity_type' => $validated['activity_type'],
            'duration_seconds' => $validated['duration_seconds'],
            'completed' => $validated['completed'] ?? true,
            'feeling' => $validated['feeling'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Wellness activity logged.',
            'activity' => $log,
        ], 201);
    }

    /**
     * Get wellness activity history.
     *
     * GET /api/activities/history
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $logs = ActivityLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(25)
            ->get();

        return response()->json([
            'success' => true,
            'total' => $logs->count(),
            'activities' => $logs,
        ], 200);
    }

    /**
     * Save a private journal entry.
     *
     * POST /api/journal
     */
    public function saveJournal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string', 'min:1', 'max:10000'],
        ]);

        $user = $request->user();

        $entry = JournalEntry::create([
            'user_id' => $user->id,
            'prompt' => $validated['prompt'] ?? 'What has been on your mind today?',
            'content' => trim($validated['content']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Journal entry saved securely.',
            'entry' => [
                'id' => $entry->id,
                'prompt' => $entry->prompt,
                'content' => $entry->content,
                'created_at' => $entry->created_at->toIso8601String(),
                'formatted_date' => $entry->created_at->format('M j, Y g:i A'),
            ],
        ], 201);
    }

    /**
     * Get user's private journal entries.
     *
     * GET /api/journal
     */
    public function getJournals(Request $request): JsonResponse
    {
        $user = $request->user();

        $entries = JournalEntry::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'prompt' => $entry->prompt,
                    'content' => $entry->content,
                    'created_at' => $entry->created_at->toIso8601String(),
                    'formatted_date' => $entry->created_at->format('M j, Y g:i A'),
                ];
            });

        return response()->json([
            'success' => true,
            'entries' => $entries,
        ], 200);
    }
}
