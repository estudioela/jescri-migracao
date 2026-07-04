# ARCHITECTURE_STABLE_STATE

Data: 2026-07-04

## Estrutura final confirmada
- `mae/` — sistema principal (ERP / Apps Script)
- `sites/` — sites auxiliares reunidos
  - `sites/estudioela/`
  - `sites/portal-influenciadoras-site/`
- `docs/` — documentação relevante
- `assets/` — recursos estáticos (portal-stitch-ui materializado)
- `archive/` — backups de `.git` e artefatos antigos

## Estado do Git
- Apenas 1 `.git` ativo: o repositório raiz (confirmado).
- Nenhum `.git` interno permanece nas subpastas (todos foram movidos para `archive/` como backup).
- `.gitignore` atualizado para incluir regras padrão e `**/.git`.

## Decisões aplicadas
- Vendorizei sub-repositórios internos (mover `.git` para `archive/` e adicionar arquivos ao root).
- Substituí links simbólicos internos por cópias físicas onde necessário (ex.: `assets/portal-stitch-ui`).
- Preservei histórico dos sub-repos em `archive/backup-git-*.git` com timestamp.

## Itens marcados como RISKY
- `sites/estudioela/` tinha uma entrada anterior chamada `sites/estudioela-repo` que apareceu como deletada no índice. Recomenda-se revisão dos arquivos e remoção de duplicatas ou limpeza adicional se necessário.

## Passos de manutenção sugeridos
- Faça `git push origin main` para persistir o monorepo no remoto e proteger o trabalho.
- Evitar restaurar `.git` aninhados; se precisar do histórico, criar repositórios remotos a partir de `archive/backup-git-*.git` e usar `git subtree` para integrar histórico.
- Atualizar `PROJECT_RULES.md` sempre que houver mudança estrutural.

## Estado final
- Repositório estável, sem submodules, sem `.git` internos, pronto para manutenção contínua.
