<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Base class for rule violations that are not input-format problems.
 *
 * Validation failures (wrong shape, missing field) are already handled by
 * Laravel with a 422. These are requests that were well-formed but cannot be
 * carried out, so they surface as 400 with a machine-readable `code`.
 */
abstract class BusinessRuleException extends Exception
{
    protected int $status = 400;

    protected string $errorCode = 'business_rule_violation';

    /**
     * Extra fields merged into the JSON body.
     *
     * Deliberately not named `context()`: Laravel's exception handler treats a
     * public `context()` method as log metadata and would call it itself.
     *
     * @return array<string, mixed>
     */
    protected function details(): array
    {
        return [];
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code' => $this->errorCode,
            ...$this->details(),
        ], $this->status);
    }
}
