<?php

namespace App\Http\Controllers;

use App\Services\GeminiService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct(
        protected GeminiService $geminiService
    ) {}

    /**
     * Handle conversational chat message from user.
     *
     * POST /api/chat
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'history' => ['nullable', 'array', 'max:20'],
            'history.*.role' => ['required_with:history', 'string', 'in:user,model,assistant'],
            'history.*.text' => ['nullable', 'string', 'max:2000'],
            'history.*.content' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = $request->user();
        $message = trim($validated['message']);
        $rawHistory = $validated['history'] ?? [];
        $history = array_map(function ($item) {
            return [
                'role' => $item['role'] ?? 'user',
                'text' => $item['text'] ?? $item['content'] ?? '',
            ];
        }, $rawHistory);

        $result = $this->geminiService->chat($message, $history, $user);


        return response()->json([
            'success' => true,
            'reply' => $result['reply'],
            'source' => $result['source'] ?? 'gemini',
            'timestamp' => Carbon::now()->toIso8601String(),
        ], 200);
    }
}
