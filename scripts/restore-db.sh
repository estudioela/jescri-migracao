#!/bin/sh
# Restaura um backup gerado por backup-db.sh contra o banco gerenciado da
# Locaweb (sem Docker — mesma fonte de conexão de backup-db.sh, ver
# docs/deployment/ARQUITETURA_PRODUCAO.md §2). DESTRUTIVO: sobrescreve o
# banco atual. Uso:
#   ./scripts/restore-db.sh ./backups/tear_20260101_120000.sql.gz
set -eu

cd "$(dirname "$0")/.."

BACKUP_FILE="${1:?uso: restore-db.sh <arquivo.sql.gz>}"
[ -f "$BACKUP_FILE" ] || { echo "Arquivo não encontrado: $BACKUP_FILE" >&2; exit 1; }

ENV_FILE=backend/.env
DB_HOST=$(grep -m1 '^DB_HOST=' "$ENV_FILE" | cut -d= -f2-)
DB_PORT=$(grep -m1 '^DB_PORT=' "$ENV_FILE" | cut -d= -f2-)
DB_DATABASE=$(grep -m1 '^DB_DATABASE=' "$ENV_FILE" | cut -d= -f2-)
DB_USERNAME=$(grep -m1 '^DB_USERNAME=' "$ENV_FILE" | cut -d= -f2-)
DB_PASSWORD=$(grep -m1 '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)

printf 'Isto vai SOBRESCREVER o banco "%s". Confirma? (digite "sim"): ' "${DB_DATABASE:-tear}"
read -r CONFIRM
[ "$CONFIRM" = "sim" ] || { echo "Cancelado."; exit 1; }

gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
  --host="$DB_HOST" --port="${DB_PORT:-5432}" \
  --username="$DB_USERNAME" --no-password \
  "$DB_DATABASE"

echo "Restauração concluída a partir de $BACKUP_FILE"
