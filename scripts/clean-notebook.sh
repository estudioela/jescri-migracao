#!/usr/bin/env bash
#
# clean-notebook.sh — remove documentos duplicados do notebook "🧶 PROJETO TEAR".
#
# Agrupa as fontes do notebook (alias "tear") por `title`, mantém a primeira
# ocorrência de cada título e remove as demais via `nlm source delete`.
#
# Uso:
#   scripts/clean-notebook.sh            # lista duplicados e pede confirmação
#   scripts/clean-notebook.sh --dry-run  # apenas mostra o que seria removido
#
# Idempotente: uma segunda execução não encontra duplicados e sai sem agir.
# Compatível com o bash 3.2 do macOS (sem mapfile/associative arrays).

set -euo pipefail

ALIAS="tear"
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//' | sed -n '2,12p'
      exit 0
      ;;
    *)
      echo "Argumento desconhecido: $arg (use --dry-run ou --help)" >&2
      exit 1
      ;;
  esac
done

command -v nlm >/dev/null 2>&1 || { echo "erro: 'nlm' não encontrado no PATH" >&2; exit 1; }
command -v jq  >/dev/null 2>&1 || { echo "erro: 'jq' não encontrado no PATH" >&2; exit 1; }

echo "→ Lendo fontes do notebook '$ALIAS'..."
SOURCES_JSON="$(nlm source list "$ALIAS" --json)"

# Valida que recebemos um array JSON (e não uma mensagem de erro do CLI).
if ! printf '%s' "$SOURCES_JSON" | jq -e 'type == "array"' >/dev/null 2>&1; then
  echo "erro: saída inesperada de 'nlm source list $ALIAS --json':" >&2
  printf '%s\n' "$SOURCES_JSON" >&2
  exit 1
fi

TOTAL=$(printf '%s' "$SOURCES_JSON" | jq 'length')
UNIQUE=$(printf '%s' "$SOURCES_JSON" | jq '[.[].title] | unique | length')
DUPES=$((TOTAL - UNIQUE))

echo "  Fontes no notebook:  $TOTAL"
echo "  Títulos únicos:      $UNIQUE"
echo "  Duplicados a remover: $DUPES"
echo

if [ "$DUPES" -eq 0 ]; then
  echo "✓ Nenhum duplicado encontrado. Nada a fazer."
  exit 0
fi

# Para cada título com mais de uma fonte, mantém a primeira (ordem retornada
# pelo nlm) e marca as demais para remoção. Saída: "id<TAB>title" por linha.
DELETE_LIST="$(printf '%s' "$SOURCES_JSON" | jq -r '
  group_by(.title)
  | map(select(length > 1) | .[1:] | .[])
  | .[]
  | "\(.id)\t\(.title)"
')"

echo "IDs que serão removidos (mantendo 1 cópia de cada título):"
printf '%s\n' "$DELETE_LIST" | while IFS=$'\t' read -r id title; do
  echo "  - $id  ($title)"
done
echo

# Extrai só os IDs, um por linha.
DELETE_IDS="$(printf '%s\n' "$DELETE_LIST" | cut -f1)"

if [ "$DRY_RUN" -eq 1 ]; then
  echo "✓ Dry-run: nenhuma fonte foi removida."
  exit 0
fi

printf "Confirmar remoção de %d fonte(s)? [y/N] " "$DUPES"
read -r ANSWER
case "$ANSWER" in
  y|Y|yes|YES) ;;
  *) echo "Abortado. Nenhuma fonte foi removida."; exit 0 ;;
esac

# Remove em uma única chamada (o CLI aceita múltiplos IDs). O --confirm pula
# o prompt interno do nlm — a confirmação já foi feita acima.
# shellcheck disable=SC2086  # word splitting intencional dos IDs
nlm source delete $DELETE_IDS --confirm

echo
echo "✓ Concluído: $DUPES fonte(s) duplicada(s) removida(s) do notebook '$ALIAS'."
