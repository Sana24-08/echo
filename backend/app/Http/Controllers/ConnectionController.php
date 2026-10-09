<?php

namespace App\Http\Controllers;

use App\Models\Connection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConnectionController extends Controller
{
    /**
     * Create a new connection request.
     */
    public function store(Request $request): JsonResponse
    {
        $requester = $request->user();

        $validated = $request->validate([
            'supporter_id' => ['required', 'integer', 'exists:users,id'],
            'allow_mood' => ['sometimes', 'boolean'],
            'allow_stress' => ['sometimes', 'boolean'],
            'allow_sleep' => ['sometimes', 'boolean'],
            'allow_energy' => ['sometimes', 'boolean'],
        ]);

        $supporterId = (int) $validated['supporter_id'];

        // Step 13: Self-connection prevention
        if ((int) $requester->id === $supporterId) {
            return response()->json([
                'message' => 'You cannot create a connection with yourself.',
            ], 422);
        }

        // Step 14: Duplicate request protection (active statuses: pending, accepted)
        $existingActive = Connection::where('requester_id', $requester->id)
            ->where('supporter_id', $supporterId)
            ->whereIn('status', ['pending', 'accepted'])
            ->exists();

        if ($existingActive) {
            return response()->json([
                'message' => 'A connection request already exists.',
            ], 409);
        }

        // Step 15: Create connection
        $connection = Connection::create([
            'requester_id' => $requester->id,
            'supporter_id' => $supporterId,
            'status' => 'pending',
            'allow_mood' => (bool) ($validated['allow_mood'] ?? false),
            'allow_stress' => (bool) ($validated['allow_stress'] ?? false),
            'allow_sleep' => (bool) ($validated['allow_sleep'] ?? false),
            'allow_energy' => (bool) ($validated['allow_energy'] ?? false),
        ]);

        return response()->json([
            'message' => 'Connection request created',
            'connection' => [
                'id' => $connection->id,
                'requester_id' => $connection->requester_id,
                'supporter_id' => $connection->supporter_id,
                'status' => $connection->status,
                'allow_mood' => (bool) $connection->allow_mood,
                'allow_stress' => (bool) $connection->allow_stress,
                'allow_sleep' => (bool) $connection->allow_sleep,
                'allow_energy' => (bool) $connection->allow_energy,
            ],
        ], 201);
    }

    /**
     * List incoming connection requests for the authenticated supporter.
     */
    public function indexIncoming(Request $request): JsonResponse
    {
        $user = $request->user();

        $connections = Connection::with(['requester:id,name,email,role,user_type'])
            ->where('supporter_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Incoming connection requests retrieved',
            'connections' => $connections,
        ], 200);
    }

    /**
     * Accept a pending connection request (supporter only).
     */
    public function accept(Request $request, Connection $connection): JsonResponse
    {
        $user = $request->user();

        if ((int) $connection->supporter_id !== (int) $user->id) {
            return response()->json([
                'message' => 'You are not allowed to manage this connection.',
            ], 403);
        }

        if ($connection->status !== 'pending') {
            return response()->json([
                'message' => 'Connection request is no longer pending.',
            ], 409);
        }

        $connection->status = 'accepted';
        $connection->save();

        return response()->json([
            'message' => 'Connection request accepted',
            'connection' => [
                'id' => $connection->id,
                'requester_id' => $connection->requester_id,
                'supporter_id' => $connection->supporter_id,
                'status' => $connection->status,
                'allow_mood' => (bool) $connection->allow_mood,
                'allow_stress' => (bool) $connection->allow_stress,
                'allow_sleep' => (bool) $connection->allow_sleep,
                'allow_energy' => (bool) $connection->allow_energy,
            ],
        ], 200);
    }

    /**
     * Reject a pending connection request (supporter only).
     */
    public function reject(Request $request, Connection $connection): JsonResponse
    {
        $user = $request->user();

        if ((int) $connection->supporter_id !== (int) $user->id) {
            return response()->json([
                'message' => 'You are not allowed to manage this connection.',
            ], 403);
        }

        if ($connection->status !== 'pending') {
            return response()->json([
                'message' => 'Connection request is no longer pending.',
            ], 409);
        }

        $connection->status = 'rejected';
        $connection->save();

        return response()->json([
            'message' => 'Connection request rejected',
            'connection' => [
                'id' => $connection->id,
                'requester_id' => $connection->requester_id,
                'supporter_id' => $connection->supporter_id,
                'status' => $connection->status,
            ],
        ], 200);
    }

    /**
     * Revoke an active accepted connection (requester or supporter).
     */
    public function revoke(Request $request, Connection $connection): JsonResponse
    {
        $user = $request->user();

        if ((int) $connection->requester_id !== (int) $user->id && (int) $connection->supporter_id !== (int) $user->id) {
            return response()->json([
                'message' => 'You are not allowed to manage this connection.',
            ], 403);
        }

        if ($connection->status !== 'accepted') {
            return response()->json([
                'message' => 'Connection is not currently active.',
            ], 409);
        }

        $connection->status = 'revoked';
        $connection->save();

        return response()->json([
            'message' => 'Connection revoked',
            'connection' => [
                'id' => $connection->id,
                'requester_id' => $connection->requester_id,
                'supporter_id' => $connection->supporter_id,
                'status' => $connection->status,
            ],
        ], 200);
    }

    /**
     * List all connections where the authenticated user is requester or supporter.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $connections = Connection::with([
            'requester:id,name,role,user_type',
            'supporter:id,name,role,user_type',
        ])
            ->where(function ($query) use ($user) {
                $query->where('requester_id', $user->id)
                      ->orWhere('supporter_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'connections' => $connections,
        ], 200);
    }

    /**
     * Update permissions for an accepted connection (requester only).
     */
    public function updatePermissions(Request $request, Connection $connection): JsonResponse
    {
        $user = $request->user();

        // 13.2 Only requester may update permissions
        if ((int) $connection->requester_id !== (int) $user->id) {
            return response()->json([
                'message' => 'You are not allowed to manage permissions for this connection.',
            ], 403);
        }

        // Only allow when connection status is accepted
        if ($connection->status !== 'accepted') {
            return response()->json([
                'message' => 'Permissions can only be updated for active accepted connections.',
            ], 409);
        }

        $validated = $request->validate([
            'allow_mood' => ['sometimes', 'boolean'],
            'allow_stress' => ['sometimes', 'boolean'],
            'allow_sleep' => ['sometimes', 'boolean'],
            'allow_energy' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('allow_mood', $validated)) {
            $connection->allow_mood = (bool) $validated['allow_mood'];
        }
        if (array_key_exists('allow_stress', $validated)) {
            $connection->allow_stress = (bool) $validated['allow_stress'];
        }
        if (array_key_exists('allow_sleep', $validated)) {
            $connection->allow_sleep = (bool) $validated['allow_sleep'];
        }
        if (array_key_exists('allow_energy', $validated)) {
            $connection->allow_energy = (bool) $validated['allow_energy'];
        }

        $connection->save();

        return response()->json([
            'message' => 'Connection permissions updated',
            'connection' => [
                'id' => $connection->id,
                'requester_id' => $connection->requester_id,
                'supporter_id' => $connection->supporter_id,
                'status' => $connection->status,
                'allow_mood' => (bool) $connection->allow_mood,
                'allow_stress' => (bool) $connection->allow_stress,
                'allow_sleep' => (bool) $connection->allow_sleep,
                'allow_energy' => (bool) $connection->allow_energy,
                'created_at' => $connection->created_at,
                'updated_at' => $connection->updated_at,
            ],
        ], 200);
    }
}

