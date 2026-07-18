# Sincronização de knowledge/ com o NotebookLM

`scripts/sync-notebook.sh` mantém o notebook "🧶 PROJETO TEAR" (alias `tear`)
em dia com os `.md` de `knowledge/`, de forma **incremental**.

## Uso

```sh
scripts/sync-notebook.sh
```

Não há flags. Rodar de novo sem mudanças termina em segundos sem enviar nada.

## Como funciona

O índice `knowledge/.notebook-index.json` guarda, por arquivo, o `sha256`
do conteúdo e o `source_id` da fonte correspondente no NotebookLM:

- **Inalterado** (mesmo sha256) → ignorado.
- **Alterado** → a versão antiga é removida do notebook (pelo `source_id`)
  e a nova é enviada; o índice é atualizado após o upload dar certo.
- **Novo** → enviado e registrado no índice.

Uploads rodam em paralelo (até 4 simultâneos). O resumo final mostra
enviados, ignorados, removidos, falhas e tempo total. Em caso de falha
parcial, basta rodar de novo: só os arquivos que falharam são reenviados.

O índice deve ser **versionado junto com knowledge/** — é ele que evita
reenvios e duplicatas entre execuções (inclusive em outra máquina).

## Relação com clean-notebook.sh

`scripts/clean-notebook.sh` (ver `docs/notebooklm.md`) usa o índice deste
sync como identificador estável: fontes rastreadas nunca são removidas
(mesmo com títulos repetidos, como os dois `README.md`), e cópias fora do
índice com título de arquivo indexado são consideradas obsoletas. Use-o para
limpar bagunça histórica, não como rotina pós-sync — o sync já não gera
duplicatas.

Requisitos: `nlm` autenticado (`nlm login`) e `jq` no PATH.
