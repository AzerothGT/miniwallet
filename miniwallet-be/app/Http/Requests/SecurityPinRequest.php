<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SecurityPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'pin' => ['bail', 'required', 'digits:6', 'numeric', 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'pin.required' => 'Security PIN wajib diisi.',
            'pin.digits' => 'Security PIN harus terdiri dari 6 digit.',
            'pin.numeric' => 'Security PIN hanya boleh berisi angka.',
            'pin.confirmed' => 'Konfirmasi Security PIN tidak cocok.',
        ];
    }
}
