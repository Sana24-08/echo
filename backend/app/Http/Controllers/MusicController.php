<?php

namespace App\Http\Controllers;

use App\Services\SpotifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MusicController extends Controller
{
    public function __construct(
        protected SpotifyService $spotifyService
    ) {}

    /**
     * Return truthful status of Spotify integration.
     *
     * GET /api/music/status
     */
    public function status(): JsonResponse
    {
        $status = $this->spotifyService->getStatus();
        return response()->json(array_merge([
            'success' => true,
        ], $status), 200);
    }

    /**
     * Get user music preferences.
     *
     * GET /api/music/preferences
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'success' => true,
            'preferences' => $user->music_preferences ?? [
                'intent' => 'relax',
                'genres' => ['calm and relaxing', 'lo-fi'],
            ],
        ], 200);
    }

    /**
     * Save user music preferences.
     *
     * PUT /api/music/preferences
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'intent' => ['required', 'string', 'max:50'],
            'genres' => ['required', 'array', 'max:10'],
            'genres.*' => ['string', 'max:50'],
        ]);

        $user = $request->user();
        $user->update([
            'music_preferences' => [
                'intent' => $validated['intent'],
                'genres' => $validated['genres'],
                'updated_at' => now()->toIso8601String(),
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Music preferences saved successfully.',
            'preferences' => $user->music_preferences,
        ], 200);
    }

    /**
     * Get recommended tracks according to user intent and genres.
     *
     * GET /api/music/tracks
     */
    public function getTracks(Request $request): JsonResponse
    {
        $intent = (string)$request->query('intent', 'relax');
        $rawGenres = $request->query('genres');

        $genres = [];
        if (is_array($rawGenres)) {
            $genres = $rawGenres;
        } elseif (is_string($rawGenres) && !empty($rawGenres)) {
            $genres = array_map('trim', explode(',', $rawGenres));
        }

        // If authenticated user and no params provided, use saved preferences
        if (empty($genres) && $request->user() && !empty($request->user()->music_preferences)) {
            $saved = $request->user()->music_preferences;
            $intent = $saved['intent'] ?? $intent;
            $genres = $saved['genres'] ?? $genres;
        }

        $result = $this->spotifyService->getRecommendedTracks($intent, $genres);

        return response()->json(array_merge([
            'success' => true,
        ], $result), 200);
    }
}
