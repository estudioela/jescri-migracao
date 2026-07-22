# CHECKLIST_GITHUB_SECRETS.md — GitHub Secrets para deploy do TEAR V2.5

**Papel:** Preparação de infraestrutura lógica de deploy (Agente B)
**Data:** 2026-07-22
**Escopo:** `tear-v2-app/` — secrets consumidos por
`.github/workflows/tear-v2-deploy.yml`. Não cobre `tear-v2-ci.yml` (não usa
nenhum secret — só compila/testa contra SQLite local e `.env.example`).

Este documento consolida, num formato de referência rápida, o que já está
descrito em prosa na Etapa 9 de `PLANO_DE_IMPLANTACAO.md`. Não substitui o
runbook (que continua sendo a fonte de ordem de execução); é o
checklist único de "quais secrets cadastrar e por quê" pedido para a
preparação de deploy.

---

## 1. Secrets usados pelo workflow de deploy

Levantados por grep direto em `.github/workflows/*.yml` (`secrets\.`) — os
4 abaixo são os únicos usados em todo o repositório; nenhum outro workflow
(`tear-v2-ci.yml`) referencia secret nenhum.

| Secret | Obrigatório | Finalidade | Origem do valor |
|---|---|---|---|
| `SSH_HOST` | Sim | Host/IP do servidor Locaweb para onde o `rsync`/SSH do deploy publica a release | Painel Locaweb (Central do Cliente → dados de acesso SSH da hospedagem `estudioela.com`) |
| `SSH_USER` | Sim | Usuário SSH usado para autenticar e publicar a release | Painel Locaweb (mesmo usuário do FTP, confirmado em `AUDITORIA_LOCAWEB.md` — `estudioela1`) |
| `SSH_PRIVATE_KEY` | Sim | Chave privada usada por `ssh`/`rsync`/`scp` para autenticar sem senha interativa | Gerada para CI (**não** reaproveitar a chave pessoal do responsável do projeto) — ver ⚠️ abaixo |
| `DEPLOY_BASE_PATH` | Sim | Caminho absoluto no host onde `releases/`, `current` e `shared/` vivem (ex.: `/home/estudioela1/tear`) | Definido pelo responsável do projeto ao criar a estrutura de diretórios no host (Etapa 10 de `PLANO_DE_IMPLANTACAO.md`) |

Se `.github/workflows/tear-v2-deploy.yml` mudar no futuro para consumir
qualquer outro `secrets.*`, ele deixa de bater com este checklist — revisar
os dois juntos.

---

## 2. ⚠️ Inconsistência conhecida, não resolvida aqui

`AUDITORIA_LOCAWEB.md` §4.1 confirmou que o SSH da hospedagem Locaweb
autentica **por senha** (a mesma do FTP), sem suporte a cadastro de chave
pública (`authorized_keys`) no painel. O workflow acima, porém, já assume
`SSH_PRIVATE_KEY` (autenticação por chave). Ou seja: **`SSH_PRIVATE_KEY`
como está hoje não tem como funcionar no host real**, até que uma das
alternativas analisadas em `AUDITORIA_LOCAWEB.md` §5.1 seja decidida pelo
responsável do projeto (ex.: `SSH_PASSWORD` + `sshpass` em vez de
`SSH_PRIVATE_KEY`, ou o modelo híbrido FTP+SSH pontual já recomendado
lá). Esta é uma decisão de arquitetura de deploy, não de infraestrutura
lógica — registrada aqui como achado, não alterada por este documento nem
pelo workflow. Ver também a nota da Etapa 9 em `PLANO_DE_IMPLANTACAO.md`.

**Consequência prática para o cadastro dos secrets:** não cadastrar
`SSH_PRIVATE_KEY` ainda (ficaria incorreto) até essa decisão ser tomada —
os outros três (`SSH_HOST`, `SSH_USER`, `DEPLOY_BASE_PATH`) podem ser
cadastrados desde já, independente da forma de autenticação escolhida.

---

## 3. Por que não há secrets de `DB_*`, `APP_KEY`, `GOOGLE_DRIVE_*`, `MAIL_*`

Diferente de pipelines que injetam variáveis de produção via GitHub
Actions a cada deploy, este projeto usa um `.env` **persistente no host**,
fora do diretório versionado por release (Etapa 8 de
`PLANO_DE_IMPLANTACAO.md`: `shared/.env`, symlinkado para dentro de cada
release por `deploy-locaweb.sh`, e explicitamente excluído do `rsync` —
`--exclude='.env'` em `tear-v2-deploy.yml`). Ou seja, credenciais de banco,
`APP_KEY`, Google Drive e SMTP são preenchidas **uma vez, manualmente, no
host**, não passam pelo GitHub Actions e não precisam (nem devem) virar
GitHub Secret. Preencher isso é responsabilidade de quem executa a Etapa 8
do runbook, com o template `tear-v2-app/backend/.env.production.example`
como guia.

---

## 4. Validação do workflow (item 4 do escopo desta sessão)

- [x] Todos os `secrets.*` referenciados em `.github/workflows/*.yml`
  estão documentados na tabela da §1 (4 de 4 — nenhum órfão encontrado).
- [x] Nenhuma lógica do workflow foi alterada para produzir este
  checklist — só a variável de build `VITE_API_URL` (não é secret, é uma
  constante de arquitetura) foi adicionada ao passo "Build frontend",
  corrigindo uma lacuna real: a ADR-015 §4 já documentava
  `VITE_API_URL=/api` como comportamento de produção, mas nenhum arquivo
  do repositório de fato definia essa variável — sem ela, o build gerava
  `import.meta.env.VITE_API_URL === undefined` e toda chamada de API do
  frontend quebraria em produção (`apiClient.ts` usa `baseURL:
  import.meta.env.VITE_API_URL` sem fallback). Corrigido nesta sessão por
  ser puramente infraestrutura de deploy que já implementa uma decisão de
  arquitetura já aprovada (ADR-015), não uma nova decisão.
- [ ] `SSH_PRIVATE_KEY` — não cadastrar ainda; ver §2.

---

## 5. Referências

- `docs/deployment/PLANO_DE_IMPLANTACAO.md` — Etapa 9 (texto original, em
  prosa, com passo a passo de "onde configurar").
- `docs/deployment/AUDITORIA_LOCAWEB.md` §4.1, §5.1 — achado e alternativas
  para a inconsistência de autenticação SSH.
- `docs/adrs/ADR-015-frontend-servido-pelo-laravel.md` §4 — decisão de
  origem única que motiva `VITE_API_URL=/api`.
- `docs/adrs/ADR-016-composer-no-ci-deploy-manual.md` — decisão vigente
  sobre onde o Composer roda e o disparo manual do workflow.
- `tear-v2-app/backend/.env.production.example` — template de variáveis
  que vivem no `.env` do host, fora do GitHub Actions (ver §3 acima).
