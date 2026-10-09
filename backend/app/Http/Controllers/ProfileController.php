<?php

namespace App\Http\Controllers;

use App\Models\CheckIn;
use App\Models\Connection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Get authenticated user profile with statistics.
     *
     * GET /api/profile
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $checkInCount = CheckIn::where('user_id', $user->id)->count();
        $connectionsCount = Connection::where(function ($q) use ($user) {
            $q->where('requester_id', $user->id)
              ->orWhere('supporter_id', $user->id);
        })->where('status', 'accepted')->count();

        $notifPrefs = $user->notification_preferences ?? [
            'email_notifications' => true,
            'checkin_reminders' => true,
            'weekly_insights' => true,
            'supporter_alerts' => true,
        ];

        $privSettings = $user->privacy_settings ?? [
            'share_checkins' => true,
            'share_patterns' => true,
            'anonymous_analytics' => false,
            'allow_supporter_view' => true,
        ];

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'user_type' => $user->user_type,
                'access_key' => $user->access_key,
                'notification_preferences' => $notifPrefs,
                'privacy_settings' => $privSettings,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'notification_preferences' => $notifPrefs,
            'privacy_settings' => $privSettings,
            'stats' => [
                'total_check_ins' => $checkInCount,
                'active_connections' => $connectionsCount,
            ],
        ], 200);
    }

    /**
     * Update user details and preferences.
     *
     * PUT /api/profile
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:100'],
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'notification_preferences' => ['nullable', 'array'],
            'notification_preferences.daily_reminder' => ['boolean'],
            'notification_preferences.weekly_report' => ['boolean'],
            'notification_preferences.pattern_alerts' => ['boolean'],
            'notification_preferences.reminder_time' => ['nullable', 'string', 'max:10'],
            'privacy_settings' => ['nullable', 'array'],
            'privacy_settings.share_mood' => ['boolean'],
            'privacy_settings.share_stress' => ['boolean'],
            'privacy_settings.share_sleep' => ['boolean'],
            'privacy_settings.share_energy' => ['boolean'],
            'privacy_settings.allow_circle_requests' => ['boolean'],
        ]);

        $updateData = [];

        if (isset($validated['name'])) {
            $updateData['name'] = trim($validated['name']);
        }

        if (isset($validated['email'])) {
            $updateData['email'] = strtolower(trim($validated['email']));
        }

        if (isset($validated['notification_preferences'])) {
            $updateData['notification_preferences'] = array_merge(
                $user->notification_preferences ?? [],
                $validated['notification_preferences']
            );
        }

        if (isset($validated['privacy_settings'])) {
            $updateData['privacy_settings'] = array_merge(
                $user->privacy_settings ?? [],
                $validated['privacy_settings']
            );
        }

        if (!empty($updateData)) {
            $user->update($updateData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'user_type' => $user->user_type,
                'access_key' => $user->access_key,
                'notification_preferences' => $user->notification_preferences,
                'privacy_settings' => $user->privacy_settings,
            ],
        ], 200);
    }

    /**
     * Change account password.
     *
     * PUT /api/profile/password
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', Password::min(8), 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'The provided current password does not match our records.',
                'errors' => [
                    'current_password' => ['The current password is incorrect.']
                ],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ], 200);
    }

    /**
     * Log out and revoke the current access token.
     *
     * POST /api/profile/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out and session revoked.',
        ], 200);
    }

    /**
     * Get user check-in history.
     *
     * GET /api/profile/check-ins
     */
    public function checkIns(Request $request): JsonResponse
    {
        $user = $request->user();

        $checkIns = CheckIn::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'total' => $checkIns->count(),
            'check_ins' => $checkIns,
        ], 200);
    }
}
