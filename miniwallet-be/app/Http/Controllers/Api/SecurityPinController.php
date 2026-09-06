<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SecurityPinRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class SecurityPinController extends Controller
{
    public function store(SecurityPinRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->security_pin !== null) {
            return response()->json([
                'message' => 'Security PIN sudah dibuat.',
                'code' => 'security_pin_exists',
            ], Response::HTTP_CONFLICT);
        }

        $user->forceFill([
            'security_pin' => Hash::make($request->string('pin')->toString()),
        ])->save();

        return response()->json([
            'message' => 'Security PIN berhasil dibuat.',
        ], Response::HTTP_CREATED);
    }
}
