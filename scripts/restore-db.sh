#!/bin/sh
# Restaura um backup gerado por backup-db.sh. DESTRUTIVO: sobrescreve o
# banco atual. Uso:
#   ./scripts/restore-db.sh ./backups/tear_20260101_120000.sql.gz
set -eu

cd "$(dirname "$0")/.."

BACKUP_FILE="${1:?uso: restore-db.sh <arquivo.sql.gz>}"
[ -f "$BACKUP_FILE" ] || { echo "Arquivo não encontrado: $BACKUP_FILE" >&2; exit 1; }

DB_USER=$(grep -m1 '^DB_USERNAME=' backend/.env | cut -d= -f2- || echo tear)
DB_NAME=$(grep -m1 '^DB_DATABASE=' backend/.env | cut -d= -f2- || echo tear)

printf 'Isto vai SOBRESCREVER o banco "%s". Confirma? (digite "sim"): ' "${DB_NAME:-tear}"
read -r CONFIRM
[ "$CONFIRM" = "sim" ] || { echo "Cancelado."; exit 1; }

gunzip -c "$BACKUP_FILE" | docker compose exec -T db psql -U "${DB_USER:-tear}" "${DB_NAME:-tear}"

echo "Restauração concluída a partir de $BACKUP_FILE"
