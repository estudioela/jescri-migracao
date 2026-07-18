#!/usr/bin/env bash
#
# sync-notebook.sh — sincronizador incremental de knowledge/ com o notebook
# "🧶 PROJETO TEAR" (alias "tear") no NotebookLM.
#
# Mantém knowledge/.notebook-index.json com sha256 + source_id de cada .md:
#   - arquivo inalterado (mesmo sha256) → ignorado;
#   - arquivo alterado → remove a versão antiga no notebook (pelo source_id)
#     e envia a nova;
#   - arquivo novo → envia e registra no índice.
# O índice só é atualizado após upload bem-sucedido.
#
# Uploads rodam em paralelo (até MAX_JOBS simultâneos) via xargs -P.
#
# Uso:
#   scripts/sync-notebook.sh
#
# Compatível com o bash 3.2 do macOS.

set -uo pipefail   # sem -e: falha em um upload não deve abortar o restante

ALIAS="tear"
MAX_JOBS=4
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KNOWLEDGE_DIR="$REPO_ROOT/knowledge"
INDEX_FILE="$KNOWLEDGE_DIR/.notebook-index.json"

# ---------------------------------------------------------------------------
# Modo worker: o script se re-invoca como "$0 __upload <arquivo>" para cada
# upload paralelo. Grava o resultado em $RESULTS_DIR para o processo pai
# consolidar (só o pai escreve no índice).
# ---------------------------------------------------------------------------
if [ "${1:-}" = "__upload" ]; then
  file="$2"
  rel="${file#"$REPO_ROOT"/}"
  hash="$(shasum -a 256 "$file" | cut -d' ' -f1)"
  old_id="$(jq -r --arg r "$rel" '.[$r].source_id // empty' "$INDEX_FILE")"
  removed=0

  # Remove a versão antiga antes do novo upload (evita duplicata no notebook).
  if [ -n "$old_id" ]; then
    if nlm source delete "$old_id" --confirm >/dev/null 2>&1; then
      removed=1
    else
      echo "  ⚠ $rel: não removeu versão antiga $old_id (seguindo com o upload)"
    fi
  fi

  json="$(nlm source add "$ALIAS" --file "$file" --wait --json 2>/dev/null)" || json=""
  new_id="$(printf '%s' "$json" | jq -r '.source_id // empty' 2>/dev/null)"

  out="$RESULTS_DIR/$(echo "$rel" | tr '/' '_').result"
  if [ -n "$new_id" ]; then
    if [ "$removed" -eq 1 ]; then echo "  ↻ $rel (atualizado)"; else echo "  ✓ $rel (novo)"; fi
    printf 'ok\t%s\t%s\t%s\t%s\n' "$rel" "$hash" "$new_id" "$removed" > "$out"
  else
    echo "  ✗ $rel (upload falhou)"
    printf 'fail\t%s\t\t\t%s\n' "$rel" "$removed" > "$out"
  fi
  exit 0
fi

# ---------------------------------------------------------------------------
# Modo normal
# ---------------------------------------------------------------------------
command -v nlm >/dev/null 2>&1 || { echo "erro: 'nlm' não encontrado no PATH" >&2; exit 1; }
command -v jq  >/dev/null 2>&1 || { echo "erro: 'jq' não encontrado no PATH" >&2; exit 1; }
[ -d "$KNOWLEDGE_DIR" ] || { echo "erro: pasta $KNOWLEDGE_DIR não existe" >&2; exit 1; }

[ -f "$INDEX_FILE" ] || echo '{}' > "$INDEX_FILE"
jq -e 'type == "object"' "$INDEX_FILE" >/dev/null 2>&1 \
  || { echo "erro: $INDEX_FILE não é um objeto JSON válido" >&2; exit 1; }

RESULTS_DIR="$(mktemp -d)"
trap 'rm -rf "$RESULTS_DIR"' EXIT
export ALIAS REPO_ROOT INDEX_FILE RESULTS_DIR

FILES="$(find "$KNOWLEDGE_DIR" -type f -name '*.md' | sort)"
TOTAL=$(printf '%s\n' "$FILES" | grep -c .)

if [ "$TOTAL" -eq 0 ]; then
  echo "Nenhum arquivo .md encontrado em $KNOWLEDGE_DIR. Nada a fazer."
  exit 0
fi

# Compara o sha256 atual com o do índice e separa o que precisa ser enviado.
TO_SEND=""
SKIPPED=0
while IFS= read -r file; do
  rel="${file#"$REPO_ROOT"/}"
  hash="$(shasum -a 256 "$file" | cut -d' ' -f1)"
  known="$(jq -r --arg r "$rel" '.[$r].sha256 // empty' "$INDEX_FILE")"
  if [ "$hash" = "$known" ]; then
    SKIPPED=$((SKIPPED + 1))
  else
    TO_SEND="$TO_SEND$file
"
  fi
done <<EOF
$FILES
EOF

N_SEND=$(printf '%s' "$TO_SEND" | grep -c . || true)
echo "→ Notebook '$ALIAS': $TOTAL arquivo(s), $SKIPPED inalterado(s), $N_SEND a enviar."

if [ "$N_SEND" -eq 0 ]; then
  echo "✓ Tudo sincronizado. Nada a fazer."
  exit 0
fi
echo

START=$(date +%s)

# Uploads em paralelo; resultados individuais ficam em $RESULTS_DIR.
printf '%s' "$TO_SEND" | xargs -P "$MAX_JOBS" -I{} "$0" __upload {}

# Consolida resultados e atualiza o índice (troca atômica via mv).
SENT=0
FAILED=0
REMOVED=0
FAILED_FILES=""
NEW_INDEX="$RESULTS_DIR/index.new"
cp "$INDEX_FILE" "$NEW_INDEX"
for result in "$RESULTS_DIR"/*.result; do
  [ -f "$result" ] || continue
  IFS=$'\t' read -r status rel hash id was_removed < "$result"
  [ "${was_removed:-0}" = "1" ] && REMOVED=$((REMOVED + 1))
  if [ "$status" = "ok" ]; then
    SENT=$((SENT + 1))
    jq --arg r "$rel" --arg h "$hash" --arg id "$id" \
      '.[$r] = { sha256: $h, source_id: $id }' "$NEW_INDEX" > "$NEW_INDEX.tmp"
    mv "$NEW_INDEX.tmp" "$NEW_INDEX"
  else
    FAILED=$((FAILED + 1))
    FAILED_FILES="$FAILED_FILES  - $rel\n"
  fi
done
mv "$NEW_INDEX" "$INDEX_FILE"

ELAPSED=$(( $(date +%s) - START ))

echo
echo "Resumo:"
echo "  Enviados:    $SENT"
echo "  Ignorados:   $SKIPPED"
echo "  Removidos:   $REMOVED"
echo "  Falhas:      $FAILED"
echo "  Tempo:       ${ELAPSED}s"

if [ "$FAILED" -gt 0 ]; then
  echo
  echo "Arquivos com falha (rode novamente para tentar de novo):"
  printf '%b' "$FAILED_FILES"
  exit 1
fi
