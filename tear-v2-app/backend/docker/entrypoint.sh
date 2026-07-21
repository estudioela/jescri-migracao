#!/bin/sh
set -e

# Roda migrations no boot do container de app (idempotente). Em um cluster
# com múltiplas réplicas, prefira rodar isto como um job/step de deploy
# separado em vez de por-container — mantido aqui simples para o alvo
# atual (uma instância).
php artisan migrate --force

php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
