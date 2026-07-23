#!/bin/sh
# Backup do PostgreSQL de produção (banco gerenciado da Locaweb, sem
# Docker — ver docs/deployment/ARQUITETURA_PRODUCAO.md §2). Uso:
#   ./scripts/backup-db.sh                 # grava em ./backups/tear_AAAAMMDD_HHMMSS.sql.gz
#   ./scripts/backup-db.sh /outro/destino  # grava nesse diretório
#
# Agendamento via Crontab do host: ver scripts/crontab.example (Etapa 9 de
# docs/deployment/PLANO_IMPLEMENTACAO.md), que encadeia este script com
# `php artisan backup:upload-to-drive --latest`.
set -eu

cd "$(dirname "$0")/.."

DEST_DIR="${1:-./backups}"
mkdir -p "$DEST_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_FILE="$DEST_DIR/tear_${TIMESTAMP}.sql.gz"

ENV_FILE=backend/.env
DB_HOST=$(grep -m1 '^DB_HOST=' "$ENV_FILE" | cut -d= -f2-)
DB_PORT=$(grep -m1 '^DB_PORT=' "$ENV_FILE" | cut -d= -f2-)
DB_DATABASE=$(grep -m1 '^DB_DATABASE=' "$ENV_FILE" | cut -d= -f2-)
DB_USERNAME=$(grep -m1 '^DB_USERNAME=' "$ENV_FILE" | cut -d= -f2-)
DB_PASSWORD=$(grep -m1 '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)

PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" --port="${DB_PORT:-5432}" \
  --username="$DB_USERNAME" --no-password \
  "$DB_DATABASE" | gzip > "$OUT_FILE"

echo "Backup salvo em $OUT_FILE"
