<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): UserResource
    {
        if (! Auth::guard('web')->attempt($request->validated())) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $request->session()->regenerate();

        return new UserResource(Auth::guard('web')->user());
    }

    public function forgotPassword(ForgotPasswordRequest $request): Response
    {
        Password::broker()->sendResetLink($request->only('email'));

        // Resposta genérica de propósito: não revelar se o e-mail existe na
        // base (evita enumeração de usuários), mesma decisão de segurança já
        // aplicada em resetPassword().
        return response()->noContent();
    }

    public function resetPassword(ResetPasswordRequest $request): Response
    {
        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill(['password' => $password])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            // Mensagem genérica de propósito: não revelar se o token expirou
            // ou se o e-mail não existe (evita enumeração de usuários).
            throw ValidationException::withMessages([
                'email' => [__('Não foi possível concluir a redefinição de senha. Verifique o link enviado por e-mail.')],
            ]);
        }

        return response()->noContent();
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
