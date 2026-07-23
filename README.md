# ELÃ | influência

Sistema de gestão do Programa de Parcerias do **Estúdio Elã**, desenvolvido em **Laravel 13 (backend/API) + React 19 (frontend, via Vite)**.

O ELÃ | influência centraliza toda a operação do programa de influenciadoras: cadastro das parceiras, campanhas, briefings, envio e aprovação de materiais, pagamentos e o Portal da Influenciadora.

> **Nota histórica (2026-07-23):** o produto nasceu como automação em Google Apps Script/Sheets. Essa versão foi descontinuada e removida deste repositório — `backend/` + `frontend/` são a única aplicação oficial. Registro do que existia e por que foi substituído: `docs/adrs/ADR-015-frontend-servido-pelo-laravel.md` e `docs/_workspace/TASK_ROUTER.md`.

---

# Objetivo

Fornecer uma plataforma única para gerenciamento do ciclo operacional das parcerias comerciais do Estúdio Elã: gestão de parceiras, campanhas e participações, briefings, materiais e aprovação de conteúdo, pagamentos, e o Portal onde a própria influenciadora acompanha suas colaborações.

---

# Stack Tecnológica

- **Backend/API:** Laravel 13 (PHP), `backend/`.
- **Frontend:** React 19 + TypeScript + Vite, `frontend/`.
- **Origem única em produção:** o Laravel serve o build estático do Vite — sem domínio/servidor separado para a SPA (`ADR-015`).
- **Persistência:** SQLite em desenvolvimento; PostgreSQL planejado para produção (ver `docs/release/GATE_FINAL_GO_LIVE.md`).
- **Controle de versão:** Git/GitHub.

---

# Estrutura do Repositório

```text
backend/        — API Laravel (app/, database/, routes/, tests/) — único produto do repositório
frontend/       — SPA React (src/, public/)
docker-compose.yml — ambiente de desenvolvimento local (não usado em produção, ver ARQUITETURA_PRODUCAO.md)

docs/           — documentação oficial do projeto (ver "Documentação" abaixo)
mcp/            — servidor MCP interno do projeto (ambiente para sessões de IA)
scripts/        — utilitários de deploy/backup/monitoramento e de manutenção da base de conhecimento (docs/knowledge/)
```

---

# Documentação

```text
docs/
├── adrs/         — decisões arquiteturais vigentes (nunca reabertas sem novo ADR)
├── specs/        — especificação de cada SPEC-NNN vigente
├── design/       — sistema de design e fluxos de UX
├── history/      — Contrato Soberano e histórico de migração
├── deployment/   — arquitetura e runbooks de produção
├── release/      — checklists e critérios de go-live
├── planning/     — roadmaps, backlog e especificações funcionais vigentes
├── knowledge/    — baseline de arquitetura/domínio da aplicação (backend/ + frontend/)
│   └── sistema-b/    — ARCHITECTURE.md, DOMAIN_MODEL.md, BUSINESS_FLOWS.md
└── _workspace/   — TASK_ROUTER.md (fonte única de estado) e checklists
```

Sem pasta de arquivo morto: histórico de sessões, auditorias pontuais,
planos superados e handoffs são removidos assim que seu conteúdo
acionável é absorvido por um documento vigente — não ficam na árvore
ativa. O histórico completo continua disponível pelo Git (`git log`).

## Documentos Principais

| Documento | Descrição |
|-----------|-----------|
| `README.md` | Visão geral do projeto |
| `CLAUDE.md` | Contrato operacional para agentes de IA |
| `docs/_workspace/TASK_ROUTER.md` | Fonte única de estado de cada SPEC |
| `docs/PRD.md` | Requisitos de produto |
| `docs/history/CONTRATO_SOBERANO.md` | Domínio soberano (termos, VOs, agregados) |
| `docs/adrs/` | ADRs vigentes |
| `docs/specs/` | Especificação de cada SPEC-NNN vigente |
| `docs/deployment/` | Arquitetura e implementação de produção |
| `docs/release/` | Checklists de go-live e release readiness |
| `docs/planning/` | Roadmaps, backlog e especificações funcionais vigentes |

---

# Primeiros Passos

## Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan test
```

## Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run lint      # oxlint
```

Detalhes de configuração de produção e deploy: `docs/deployment/DEPLOY.md` e `docs/deployment/CONFIGURACAO_PRODUCAO.md`.

---

# Contribuição

Toda alteração no projeto deve preservar os princípios arquiteturais estabelecidos em `CLAUDE.md` e nos ADRs vigentes.

Mudanças estruturais significativas devem ser acompanhadas da atualização da documentação correspondente e, quando aplicável, do respectivo ADR.

---

# Licença

Este repositório segue a política de licenciamento definida pelo Estúdio Elã.

Caso uma licença específica seja adotada futuramente, este documento deverá ser atualizado.

---

# Créditos

Projeto desenvolvido pelo **Estúdio Elã**.
