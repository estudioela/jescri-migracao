#!/bin/sh
# Uptime check externo (roda fora dos containers, ex.: cron do host ou de
# um monitor de terceiros). Verifica os dois health-checks do backend e
# falha (exit != 0) se qualquer um não responder 200.
#
# Uso:
#   TEAR_URL=https://seu-dominio.com ./scripts/healthcheck.sh
#   # opcional: alerta no Slack se SLACK_WEBHOOK_URL estiver definida
#   TEAR_URL=... SLACK_WEBHOOK_URL=https://hooks.slack.com/... ./scripts/healthcheck.sh
#
# Agendar via cron do host, ex. a cada 5 min:
#   */5 * * * * TEAR_URL=https://seu-dominio.com /caminho/scripts/healthcheck.sh
set -eu

URL="${TEAR_URL:-http://localhost:8000}"
FAILED=""

check() {
    path="$1"
    if ! curl -fsS --max-time 10 "${URL}${path}" > /dev/null 2>&1; then
        FAILED="${FAILED} ${path}"
    fi
}

check "/up"
check "/api/health"

if [ -n "$FAILED" ]; then
    MESSAGE="TEAR ($URL) health check falhou em:${FAILED}"
    echo "$MESSAGE" >&2

    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -fsS -X POST -H 'Content-Type: application/json' \
            --data "{\"text\": \"🔴 ${MESSAGE}\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi

    exit 1
fi

echo "OK: $URL"
