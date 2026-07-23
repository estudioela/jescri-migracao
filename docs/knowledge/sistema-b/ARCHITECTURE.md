# Sistema B (tear-v2-app) — Arquitetura

> Versão baseline (2026-07-20), a partir da auditoria inicial. Não é
> exaustiva — aprofundar em sessão futura.

## Stack

- **Backend:** Laravel 13.8, autenticação por token via Sanctum 4, papéis via
  Spatie Permission 8.3.
- **Frontend:** React 19 + Vite 8 + TypeScript.
- **Banco:** SQLite (default de `.env.example`) — motor de produção ainda
  não decidido.
- **Armazenamento de arquivos:** Google Drive via service account (JWT
  bearer, upload multipart) com fallback automático para disco local quando
  as credenciais não estão configuradas.

## Estrutura de pastas

```
backend/            (Laravel padrão)
├── app/Models/
├── app/Http/Controllers/Api/
├── app/Http/Requests/
├── app/Http/Resources/
├── app/Services/GoogleDriveService.php
├── database/migrations/
├── database/seeders/ (RoleSeeder, DevUserSeeder)
└── routes/api.php

frontend/
└── src/{components,lib,pages,assets}
```

## Autenticação e autorização

- Login via `POST /api/login` (Sanctum), token simples.
- 3 papéis seedados: `ADMIN`, `GESTOR_MARCA`, `INFLUENCIADORA`.
- **Só `ADMIN` é de fato aplicado** em rotas (`role:ADMIN` middleware em
  todas as rotas de escrita). `GESTOR_MARCA` e `INFLUENCIADORA` existem
  apenas como rótulo no frontend (`lib/auth.tsx`, `Dashboard.tsx`) — nenhuma
  rota os exige ainda.
- Rotas de leitura (`index`/`show` de parceiras, marcas, campanhas,
  participações, briefings, materiais, pagamentos) exigem só
  `auth:sanctum`, sem checagem de papel — qualquer usuário autenticado lê
  tudo.

## Integrações externas

- Google Drive (service account) para upload de materiais.

## Testes e qualidade (última verificação: 2026-07-20)

- `php artisan test`: 78/78 verde.
- Pint (estilo de código): referenciado como limpo nos commits.

## Deploy

- Nenhum pipeline de CI/CD definido.
- Nenhuma hospedagem de produção definida.
- Banco de produção (motor e infraestrutura) não decidido.

## Relação com o Sistema A (GAS)

Ver `SISTEMA_B_TEAR_V2.md`. Sem ponte de dados entre os dois sistemas —
bases completamente independentes (Sheets vs. SQL).
