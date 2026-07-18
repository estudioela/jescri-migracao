# NotebookLM — manutenção do notebook "🧶 PROJETO TEAR"

O notebook usa o alias `tear` no CLI `nlm`.

## Limpeza de duplicados

`scripts/clean-notebook.sh` remove fontes duplicadas (mesmo `title`),
mantendo uma cópia de cada título.

```sh
# Simulação: mostra contagens e os IDs que seriam removidos, sem apagar nada
scripts/clean-notebook.sh --dry-run

# Execução real: lista os IDs e pede confirmação (y/N) antes de apagar
scripts/clean-notebook.sh
```

Comportamento:

- Lê `nlm source list tear --json` e usa `knowledge/.notebook-index.json`
  (caminho relativo → `source_id`, mantido pelo sync) como identificador
  estável — títulos iguais em caminhos diferentes (ex.: `knowledge/README.md`
  e `knowledge/specs/README.md`) **não** são tratados como duplicata.
- Fontes rastreadas pelo índice são sempre mantidas; fontes fora do índice
  com título de arquivo indexado são cópias obsoletas e são removidas;
  as demais são agrupadas por título, mantendo a primeira ocorrência.
- Sem o índice, cai no modo apenas-título (com aviso).
- Exibe contagens e os IDs a remover (com o motivo) antes de qualquer ação.
- Idempotente: sem duplicados, encerra com "Nada a fazer".

Requisitos: `nlm` autenticado (`nlm login`) e `jq` no PATH.

## Sincronização incremental

Para enviar/atualizar os documentos de `knowledge/` no notebook, use
`scripts/sync-notebook.sh` — ver `docs/notebook-sync.md`.
