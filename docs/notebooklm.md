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

- Lê `nlm source list tear --json` e agrupa por `title`.
- Mantém a **primeira** ocorrência de cada título (ordem retornada pelo `nlm`)
  e remove as demais em uma única chamada `nlm source delete ... --confirm`.
- Exibe total de fontes, títulos únicos, quantidade de duplicados e os IDs
  a remover antes de qualquer ação.
- Idempotente: sem duplicados, encerra com "Nada a fazer".

Requisitos: `nlm` autenticado (`nlm login`) e `jq` no PATH.

## Sincronização incremental

Para enviar/atualizar os documentos de `knowledge/` no notebook, use
`scripts/sync-notebook.sh` — ver `docs/notebook-sync.md`.
