#!/bin/sh
# Backup do banco Postgres do docker-compose.yml. Uso:
#   ./scripts/backup-db.sh                 # grava em ./backups/tear_AAAAMMDD_HHMMSS.sql.gz
#   ./scripts/backup-db.sh /outro/destino  # grava nesse diretório
#
# Agendar via cron do host (fora do container, não há scheduler configurado
# na aplicação — ver TEAR_V2.5_GO_LIVE_CHECKLIST.md).
set -eu

cd "$(dirname "$0")/.."

DEST_DIR="${1:-./backups}"
mkdir -p "$DEST_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_FILE="$DEST_DIR/tear_${TIMESTAMP}.sql.gz"

DB_USER=$(grep -m1 '^DB_USERNAME=' backend/.env | cut -d= -f2- || echo tear)
DB_NAME=$(grep -m1 '^DB_DATABASE=' backend/.env | cut -d= -f2- || echo tear)

docker compose exec -T db pg_dump -U "${DB_USER:-tear}" "${DB_NAME:-tear}" | gzip > "$OUT_FILE"

echo "Backup salvo em $OUT_FILE"
