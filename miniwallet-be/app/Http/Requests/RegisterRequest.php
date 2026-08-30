<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'alpha_dash', 'min:3', 'max:30', 'unique:users,username'],
            'email' => ['required', 'string', 'email:rfc,strict', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:/^08[0-9]{8,12}$/', 'unique:users,phone'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.unique' => 'Username sudah digunakan.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan.',
            'phone.regex' => 'Nomor HP harus diawali 08 dan terdiri dari 10-14 angka.',
            'phone.unique' => 'Nomor HP sudah digunakan.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ];
    }
}
