<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Handle user registration with access-key generation.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
            'role' => ['required', 'string', Rule::in(['user', 'admin'])],
            'user_type' => [
                'required',
                'string',
                Rule::in([
                    'student',
                    'employee',
                    'general',
                    'children',
                    'teacher',
                    'parent',
                    'organization',
                ]),
            ],
        ]);

        $accessKey = $this->generateUniqueAccessKey();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'user_type' => $validated['user_type'],
            'access_key' => $accessKey,
        ]);

        $token = $user->createToken('echo-api-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'user_type' => $user->user_type,
                'access_key' => $user->access_key,
            ],
            'access_key' => $user->access_key,
        ], 201);
    }

    /**
     * Handle user login.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        $token = $user->createToken('echo-api-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'user_type' => $user->user_type,
                'access_key' => $user->access_key,
            ],
        ], 200);
    }

    /**
     * Verify an access key and return safe user information.
     */
    public function verifyAccessKey(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'access_key' => ['required', 'string'],
        ]);

        $cleanedKey = trim($validated['access_key']);
        $cleanedKey = str_replace(["\u{2013}", "\u{2014}"], '-', $cleanedKey);

        if ($cleanedKey === '') {
            return response()->json([
                'message' => 'The access key field is required.',
                'errors' => ['access_key' => ['The access key field is required.']],
            ], 422);
        }

        // Exact match or uppercase-normalized match
        $user = User::where('access_key', $cleanedKey)
            ->orWhere('access_key', strtoupper($cleanedKey))
            ->first();

        if (! $user) {
            return response()->json([
                'message' => 'Invalid access key',
            ], 401);
        }

        // Only eligible support accounts (role: admin with teacher, parent, or organization)
        $eligibleTypes = ['teacher', 'parent', 'organization'];
        if ($user->role !== 'admin' || ! in_array($user->user_type, $eligibleTypes, true)) {
            return response()->json([
                'message' => 'Invalid access key',
            ], 401);
        }

        return response()->json([
            'message' => 'Access key verified',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'user_type' => $user->user_type,
            ],
        ], 200);
    }

    /**
     * Retrieve the authenticated support user's access key.
     * Generates and persists one if missing for the eligible account.
     */
    public function getAccessKey(Request $request): JsonResponse
    {
        $user = $request->user();

        // If user already has an access key, return it without modifying
        if (! empty($user->access_key)) {
            return response()->json([
                'message' => 'Access key retrieved',
                'access_key' => $user->access_key,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'user_type' => $user->user_type,
                ],
            ], 200);
        }

        // Generate and persist a key only when necessary (when key is missing)
        $newKey = $this->generateUniqueAccessKey();
        $user->access_key = $newKey;
        $user->save();

        return response()->json([
            'message' => 'Access key generated',
            'access_key' => $user->access_key,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'user_type' => $user->user_type,
            ],
        ], 200);
    }

    /**
     * Explicitly generate or regenerate a new unique access key for the authenticated support user.
     */
    public function generateAccessKey(Request $request): JsonResponse
    {
        $user = $request->user();

        $newKey = $this->generateUniqueAccessKey();
        $user->access_key = $newKey;
        $user->save();

        return response()->json([
            'message' => 'Access key regenerated',
            'access_key' => $user->access_key,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'user_type' => $user->user_type,
            ],
        ], 200);
    }

    /**
     * Generate a unique, cryptographically secure access key in ECHO-XXXX-XXXX format.
     */
    private function generateUniqueAccessKey(): string
    {
        do {
            $part1 = strtoupper(Str::random(4));
            $part2 = strtoupper(Str::random(4));
            $key = "ECHO-{$part1}-{$part2}";
        } while (User::where('access_key', $key)->exists());

        return $key;
    }
}
