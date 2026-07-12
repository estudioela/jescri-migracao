# Migração offline da base do Projeto Tear (V2)

Scripts de uso único, já executados com sucesso na carga inicial da base da V2.
**Não são código de produção e não sobem para o Apps Script.**

- `DataSeed.js` — os dados exportados da V1 (`const DADOS_IMPORTACAO`).
- `Importador.js` — grava `DADOS_IMPORTACAO` na aba `Parceiros_Influenciadoras`.
  Depende de `DataSeed.js` estar carregado no mesmo escopo global.

## Por que moramos aqui, e não em `tear/`

Enquanto estavam em `tear/` eram um risco silencioso:

- `Importador.js` escreve na planilha via `SpreadsheetApp` direto, sem passar
  pelos Repositories — ignora a validação de coluna por nome, que é a única
  proteção do sistema contra uma coluna inserida no meio da aba;
- estavam fora da allowlist de `tear/.claspignore`, e o
  `claspignore-allowlist.test.js` só verifica arquivos **rastreados pelo git**.
  Como estes nunca foram commitados, escapavam da trava: um `git add` distraído
  quebraria a suíte, e um `!Importador.js` distraído publicaria em produção uma
  função global que reescreve a aba de parceiras.

## Como rodar de novo, se um dia for preciso

Cole os dois arquivos num projeto Apps Script **descartável**, ligado a uma
CÓPIA da planilha, e execute `importarDadosDaV1()`. Nunca no projeto de
produção (`tear/.clasp.json`).
