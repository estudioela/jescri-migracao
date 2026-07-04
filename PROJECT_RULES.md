# PROJECT_RULES

Objetivo: manter o repositório organizado, previsível e seguro como um monorepo único.

Estrutura oficial esperada (pasta raiz):
- `mae/`    → sistema principal (ERP / backend)
- `sites/`  → projetos web auxiliares (sites, front-ends estáticos)
- `docs/`   → documentação do projeto
- `archive/`→ backups, históricos e itens legados
- `assets/` → recursos estáticos (imagens, css, bibliotecas)

Regras de organização (obrigatórias):
- Apenas 1 repositório Git ativo no projeto — o root (`.git` na raiz).
- É proibido manter `.git` dentro de subpastas.
- É proibido usar `git submodule` — não criar submodules.
- É proibido incluir links simbólicos que referenciem conteúdo interno do repositório; preferir cópia física (vendorizar) quando necessário.
- Não mover ou reescrever lógica do código ao reorganizar — mover somente arquivos e pastas para clareza estrutural.
- Para arquivos temporários e de sistema incluir em `.gitignore`:
  - `.DS_Store`
  - `*.log`
  - `archive/`
  - `_backup_full_*/`
  - `**/.git`

Fluxo de trabalho correto (resumido):
1. Fazer backup local (opcional) antes de reorganizações grandes.
2. Fazer mudanças em branches de recurso quando alterar código.
3. Evitar `clasp push` direto em cópias que não sejam a pasta canônica do Apps Script (`mae/`) — use `mae/` como fonte.
4. Antes de remover ou vendorizar um sub-repo: criar backup do `.git` em `archive/`.
5. Comitar mudanças no root e fazer `git push origin main` após revisão e aprovação.

Proibições (sempre):
- Não adicionar submodules.
- Não manter `.git` em subpastas.
- Não criar links simbólicos que escondam dependências internas.

Procedimentos para casos incertos:
- Se houver dúvida sobre um diretório, marcá-lo como `RISKY` em `docs/` e movê-lo para `archive/` até decisão final.

Contato e manutenção:
- Quando alterar a estrutura, atualize `PROJECT_RULES.md` e `ARCHITECTURE_STABLE_STATE.md`.
