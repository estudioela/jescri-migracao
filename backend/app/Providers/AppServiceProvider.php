<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::before(fn (User $user, string $ability) => $user->hasRole('ADMIN') ? true : null);

        // Aponta o link nativo do broker de senha para a tela do frontend
        // (SPA), no mesmo padrão já usado por InfluenciadoraConviteNotification
        // — sem isso, ResetPassword tentaria gerar uma rota web inexistente
        // nesta API.
        ResetPassword::createUrlUsing(fn (User $notifiable, string $token) => self::resetUrl($notifiable, $token));

        ResetPassword::toMailUsing(fn (User $notifiable, string $token) => (new MailMessage)
            ->subject('Redefinição de senha — Portal ELÃ | influência')
            ->greeting('Olá, '.$notifiable->name.'!')
            ->line('Recebemos uma solicitação para redefinir a senha da sua conta no Portal ELÃ | influência.')
            ->action('Definir nova senha', self::resetUrl($notifiable, $token))
            ->line('Se você não solicitou essa redefinição, pode ignorar este e-mail com segurança.'));
    }

    private static function resetUrl(User $notifiable, string $token): string
    {
        return config('app.frontend_url').'/definir-senha?token='.$token.'&email='.urlencode($notifiable->email);
    }
}
