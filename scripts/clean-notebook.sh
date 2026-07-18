#!/usr/bin/env bash
#
# clean-notebook.sh — remove documentos duplicados do notebook "🧶 PROJETO TEAR".
#
# Estratégia (evita falso positivo de títulos iguais em caminhos diferentes,
# ex.: knowledge/README.md vs knowledge/specs/README.md):
#   1. Fontes cujo source_id está em knowledge/.notebook-index.json são
#      SEMPRE mantidas — o índice mapeia caminho relativo → source_id, então
#      cada uma corresponde a um arquivo distinto, mesmo com título repetido.
#   2. Fontes fora do índice com título de um arquivo indexado são cópias
#      obsoletas (o sync mantém a versão indexada) → removidas.
#   3. Demais fontes fora do índice: agrupadas por título, mantém a primeira.
# Sem índice, aplica-se apenas a regra 3 (com aviso).
#
# Uso:
#   scripts/clean-notebook.sh            # lista duplicados e pede confirmação
#   scripts/clean-notebook.sh --dry-run  # apenas mostra o que faria
#
# Idempotente: uma segunda execução não encontra duplicados e sai sem agir.
# Compatível com o bash 3.2 do macOS (zsh/bash).

set -euo pipefail

ALIAS="tear"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INDEX_FILE="$REPO_ROOT/knowledge/.notebook-index.json"
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//' | sed -n '2,18p'
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

# Índice do sync (caminho relativo → sha256 + source_id). Opcional, mas sem
# ele não dá para distinguir arquivos diferentes com o mesmo título.
if [ -f "$INDEX_FILE" ]; then
  INDEX_JSON="$(cat "$INDEX_FILE")"
else
  echo "⚠ Índice $INDEX_FILE não encontrado — deduplicando só por título" >&2
  INDEX_JSON='{}'
fi

echo "→ Lendo fontes do notebook '$ALIAS'..."
SOURCES_JSON="$(nlm source list "$ALIAS" --json)"

if ! printf '%s' "$SOURCES_JSON" | jq -e 'type == "array"' >/dev/null 2>&1; then
  echo "erro: saída inesperada de 'nlm source list $ALIAS --json':" >&2
  printf '%s\n' "$SOURCES_JSON" >&2
  exit 1
fi

# Classificação (regras 1–3 acima). Saída: "id<TAB>title<TAB>motivo" por linha.
DELETE_LIST="$(printf '%s' "$SOURCES_JSON" | jq -r --argjson idx "$INDEX_JSON" '
  ($idx | [.[].source_id]) as $indexed_ids
  | ($idx | [keys[] | split("/") | last] | unique) as $indexed_titles
  | [ .[] | select(.id as $i | $indexed_ids | index($i) | not) ]
  | group_by(.title)
  | map(
      if (.[0].title as $t | $indexed_titles | index($t)) then
        map(. + {reason: "cópia não rastreada de arquivo indexado"})
      else
        .[1:] | map(. + {reason: "duplicata por título"})
      end
    )
  | flatten
  | .[] | "\(.id)\t\(.title)\t\(.reason)"
')"

TOTAL=$(printf '%s' "$SOURCES_JSON" | jq 'length')
INDEXED=$(printf '%s' "$SOURCES_JSON" | jq --argjson idx "$INDEX_JSON" \
  '($idx | [.[].source_id]) as $ids | [.[] | select(.id as $i | $ids | index($i))] | length')
DUPES=$(printf '%s' "$DELETE_LIST" | grep -c . || true)

echo "  Fontes no notebook:      $TOTAL"
echo "  Rastreadas pelo índice:  $INDEXED (sempre mantidas)"
echo "  Duplicadas a remover:    $DUPES"
echo

if [ "$DUPES" -eq 0 ]; then
  echo "✓ Nenhum duplicado encontrado. Nada a fazer."
  exit 0
fi

echo "IDs que serão removidos:"
printf '%s\n' "$DELETE_LIST" | while IFS=$'\t' read -r id title reason; do
  echo "  - $id  ($title — $reason)"
done
echo

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
