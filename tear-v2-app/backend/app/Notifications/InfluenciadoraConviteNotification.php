<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InfluenciadoraConviteNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $token) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = config('app.frontend_url').'/definir-senha?token='.$this->token.'&email='.urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Bem-vinda ao Portal ELÃ | influência')
            ->greeting('Olá, '.$notifiable->name.'!')
            ->line('Sua parceria foi aprovada. Defina sua senha para acessar o Portal da Influenciadora.')
            ->action('Definir senha', $url)
            ->line('Se você não esperava este e-mail, pode ignorá-lo.');
    }
}
