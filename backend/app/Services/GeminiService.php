<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected ?string $apiKey;
    protected string $model;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $this->model = config('services.gemini.model') ?: 'gemini-3.8-flash';
    }

    /**
     * Check if Gemini API is configured with an API key.
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Send a conversation message to Gemini and return ECHO's response.
     *
     * @param string $message User's new message
     * @param array $history Previous conversation messages [{'role': 'user'|'model'|'assistant', 'text': '...'}]
     * @param User|null $user Authenticated user
     * @return array ['success' => bool, 'reply' => string, 'error' => string|null]
     */
    public function chat(string $message, array $history = [], ?User $user = null): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => true,
                'reply' => $this->getFallbackReply($message, 'ECHO service is running in local companion mode.'),
                'source' => 'fallback',
                'error' => 'GEMINI_API_KEY is not configured.',
            ];
        }

        $systemInstruction = "You are ECHO, a gentle, compassionate, and supportive personal well-being companion. "
            . "Your goal is to listen without judgment, offer warm grounding reflections, encourage healthy self-awareness, "
            . "and help the user explore simple, restorative steps to feel supported. "
            . "Important safety rules: "
            . "1. Never provide clinical medical, psychological, or psychiatric diagnoses (e.g. do not diagnose clinical depression, anxiety disorders, etc.). "
            . "2. Keep your replies warm, concise, conversational, and uplifting (1 to 3 short paragraphs). "
            . "3. If someone expresses severe emotional pain or crisis, offer warm empathy and gently encourage speaking with a trusted person, counsellor, or helpline.";

        // Format conversation history for Gemini
        $contents = [];
        $recentHistory = array_slice($history, -8); // Keep last 8 turns for context

        foreach ($recentHistory as $item) {
            $text = trim($item['text'] ?? '');
            if (empty($text)) {
                continue;
            }
            $role = ($item['role'] ?? 'user') === 'user' ? 'user' : 'model';
            $contents[] = [
                'role' => $role,
                'parts' => [['text' => $text]],
            ];
        }

        // Add user's active message
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $message]],
        ];

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $systemInstruction]],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 600,
            ],
        ];

        try {
            $url = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";
            $response = Http::timeout(15)
                ->withOptions(['verify' => false])
                ->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $replyText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

                if (!empty($replyText)) {
                    return [
                        'success' => true,
                        'reply' => trim($replyText),
                        'source' => 'gemini',
                        'error' => null,
                    ];
                }
            }

            // Fallback for API failure
            Log::warning('Gemini API call failed', [
                'status' => $response->status(),
                'model' => $this->model,
            ]);

            return [
                'success' => true,
                'reply' => $this->getFallbackReply($message, 'ECHO connection refreshed.'),
                'source' => 'fallback',
                'error' => 'API response status: ' . $response->status(),
            ];
        } catch (\Throwable $e) {
            Log::warning('Gemini API exception', ['message' => $e->getMessage()]);

            return [
                'success' => true,
                'reply' => $this->getFallbackReply($message, 'ECHO local reflection.'),
                'source' => 'fallback',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Provide a warm, empathetic rule-based fallback response if Gemini is unreachable.
     */
    protected function getFallbackReply(string $message, string $context = ''): string
    {
        $lower = strtolower($message);

        if (str_contains($lower, 'stress') || str_contains($lower, 'overwhelm') || str_contains($lower, 'pressure')) {
            return "I hear you. When things feel heavy or crowded, it's completely natural for stress to rise. Take a slow, gentle breath with me right now. You don't have to carry the whole mountain all at once — what is one small thing you can set aside for today?";
        }

        if (str_contains($lower, 'sleep') || str_contains($lower, 'tired') || str_contains($lower, 'exhaust')) {
            return "Rest is so essential for your rhythm. If your reserves are running low, give yourself permission to ease your pace today. A warm cup of water, stepping away from screens, or a quiet pause can help your body begin to recharge.";
        }

        if (str_contains($lower, 'good') || str_contains($lower, 'happy') || str_contains($lower, 'great')) {
            return "That's wonderful to hear! Notice that lightness and carry it with you today. Celebrating the good moments gives you steady ground to stand on.";
        }

        if (str_contains($lower, 'help') || str_contains($lower, 'alone')) {
            return "I'm right here with you, and you don't have to navigate everything by yourself. Check in with your ECHO Circle, or explore the Support and Counsellors pages whenever you'd like a helping hand.";
        }

        return "Thank you for sharing that with me. I'm listening, and I'm right here with you. Take things one gentle step at a time, and tell me more whenever you're ready.";
    }

    /**
     * Lightweight health check.
     */
    public function checkHealth(): array
    {
        return [
            'configured' => $this->isConfigured(),
            'model' => $this->model,
        ];
    }
}
