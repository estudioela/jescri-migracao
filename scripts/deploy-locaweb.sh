#!/bin/bash
# Executado NO HOST Locaweb via SSH, chamado por
# .github/workflows/tear-v2-deploy.yml depois que o rsync já publicou o
# código (backend/, já com vendor/ e o build do frontend em public/build)
# em <deploy_base_path>/releases/<release_id>/. O host Locaweb não tem
# Composer instalado globalmente (achado de auditoria,
# docs/deployment/AUDITORIA_LOCAWEB.md §1/§4.3) — vendor/ é gerado no
# runner do GitHub Actions e chega pronto via rsync; este script nunca
# executa Composer. Completa o deploy atômico: liga .env/storage
# compartilhados, roda migrations, gera cache de config/rotas/views e troca
# o symlink `current` (ver Etapa 6 de docs/deployment/PLANO_IMPLEMENTACAO.md).
#
# Uso: ./deploy-locaweb.sh <release_id> <deploy_base_path>
set -euo pipefail

RELEASE_ID="${1:?uso: deploy-locaweb.sh <release_id> <deploy_base_path>}"
BASE_PATH="${2:?uso: deploy-locaweb.sh <release_id> <deploy_base_path>}"
RELEASE_PATH="$BASE_PATH/releases/$RELEASE_ID"

cd "$RELEASE_PATH"

if [ ! -f vendor/autoload.php ]; then
  echo "vendor/ ausente na release — composer install deveria ter rodado no runner do GitHub Actions antes do rsync (ver .github/workflows/tear-v2-deploy.yml)." >&2
  exit 1
fi

ln -sfn "$BASE_PATH/shared/.env" .env
# storage/ compartilhado entre releases: sem isto, logs (Pulse depende
# deles — monitoramento obrigatório, ver ARQUITETURA_PRODUCAO.md §11) e
# sessões em disco seriam perdidos a cada deploy.
mkdir -p "$BASE_PATH/shared/storage"
rm -rf storage
ln -sfn "$BASE_PATH/shared/storage" storage

php83 artisan migrate --force
php83 artisan config:cache
php83 artisan route:cache
php83 artisan view:cache

ln -sfn "$RELEASE_PATH" "$BASE_PATH/current"

echo "Release $RELEASE_ID ativa em $BASE_PATH/current"
