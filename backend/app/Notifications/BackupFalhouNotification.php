<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BackupFalhouNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $motivo) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('[TEAR] Falha no backup do banco')
            ->greeting('Alerta de backup')
            ->line($this->motivo)
            ->line('Verifique o backup mais recente e o log do comando `backup:upload-to-drive`.');
    }
}
