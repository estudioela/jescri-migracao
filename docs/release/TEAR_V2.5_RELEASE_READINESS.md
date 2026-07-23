# TEAR V2.5 — Release Readiness (FASE 5.2)

Data: 2026-07-21
Autor: auditoria independente de prontidão para produção (não implementa
código, não altera arquitetura — mandato de auditoria read-only,
`CLAUDE.md`).
Branch auditada: `feat/ui-design-system-ela`.
Escopo: **somente `tear-v2-app`** (Laravel 12 + Sanctum + Spatie
Permission / React 19 + Vite + TypeScript). Não cobre o Portal legado GAS
(`src/`) nem reabre o domínio soberano (`CONTRATO_SOBERANO.md`).

Metodologia: verificação direta no código e execução real da suíte de
testes/lint desta sessão — não é uma repetição de um handoff anterior nem
de `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md`, é uma confirmação
independente das alegações desses documentos.

---

## GO / NO-GO

### GO

✔ Suíte de testes backend verde e executada nesta sessão (149/149,
  384 assertions).

✔ `vendor/bin/pint --test` limpo (padrão de código consistente).

✔ Frontend: `tsc -b` limpo; `oxlint` sem erros (1 warning cosmético
  pré-existente, não bloqueia build).

✔ Todas as 20 migrations têm `down()` implementado — nenhuma migration
  destrutiva sem reversão.

✔ Upload de Material sem credenciais do Google Drive falha de forma
  segura (503, mensagem clara), nunca 500 nem fallback silencioso para
  disco local.

✔ `POST /parceiras` (fora do fluxo público de cadastro) protegido por
  `role:ADMIN` — não é mais possível a um usuário autenticado qualquer
  criar `Parceira` arbitrária.

✔ Rate limiting aplicado nas rotas sensíveis de autenticação (login,
  cadastro público, reset de senha).

✔ CORS restrito ao domínio do frontend, sem wildcard.

✔ Security headers e correlação de request ID registrados globalmente e
  cobertos por teste dedicado.

✔ `/pulse` (observabilidade) bloqueado para não-ADMIN e coberto por
  teste dedicado.

✔ Backup/restore de banco com scripts prontos e documentados.

✔ Nenhum `.env` real (segredo de produção) versionado no repositório.

### NO-GO

✘ Nenhuma variável de produção real preenchida — `APP_URL`,
  `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL`, `SESSION_DOMAIN` ainda são
  `CHANGE_ME` no template.

✘ Credenciais reais do Google Drive (`GOOGLE_DRIVE_CLIENT_EMAIL`,
  `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`) ausentes —
  upload de material fica bloqueado (503) até serem configuradas.

✘ `MAIL_MAILER` ainda `log` no template de produção sem provedor SMTP/SES
  real definido — nenhum e-mail de convite/reset de senha sai para uma
  caixa real.

✘ Instância PostgreSQL de produção não provisionada — driver e compose já
  apontam para `pgsql`, mas não há banco real rodando.

✘ Domínio e certificado HTTPS não definidos — TLS deve terminar em um
  proxy externo ao `docker-compose.yml`, ainda não decidido.

✘ Nenhum deploy de homologação executado até o momento — o pipeline
  Docker completo (build → migrate → healthcheck) nunca rodou de ponta a
  ponta em um ambiente real.

Se qualquer item da lista NO-GO permanecer verdadeiro, o sistema **não
deve** ser promovido a produção — são todos pré-requisitos de
infraestrutura, não pendências de código.

---

## Evidências

| Alegação | Evidência verificada nesta sessão |
|---|---|
| Upload de Material sem Drive configurado retorna 503, sem fallback | `backend/app/Http/Controllers/Api/MaterialController.php:33-36` (`if (! $this->drive->isConfigured()) return response()->json([...], 503);`); teste em `tests/Feature/MaterialTest.php` |
| `POST /parceiras` restrito a ADMIN | `backend/routes/api.php:46` (`Route::post('/parceiras', ...)->middleware('role:ADMIN')`) |
| Rate limiting no login/cadastro/reset | `backend/routes/api.php:23,26,29,32` (`->middleware('throttle:6,1')`, 4 rotas) |
| CORS sem wildcard | `backend/config/cors.php:22` (`'allowed_origins' => [env('FRONTEND_URL', ...)]`) |
| Security headers + Request ID registrados globalmente | `backend/bootstrap/app.php:20-21` (`$middleware->append(SecurityHeaders::class); $middleware->append(RequestId::class);`); testes `tests/Feature/SecurityHeadersTest.php`, `tests/Feature/RequestIdTest.php` |
| `/pulse` restrito a ADMIN | `backend/app/Providers/AppServiceProvider.php:26` (`Gate::before(fn (User $user, ...) => $user->hasRole('ADMIN') ? true : null)`); teste `tests/Feature/PulseAccessTest.php` |
| Provisionamento do primeiro admin | `backend/app/Console/Commands/CreateAdminCommand.php`; teste `tests/Feature/CreateAdminCommandTest.php` |
| Health checks | Endpoint `GET /health` em `backend/routes/api.php:15` (retorna `{"status":"ok",...}`) + `/up` nativo do Laravel; `healthcheck:` em `app`/`nginx`/`frontend`/`db` no `docker-compose.yml` |
| Todas as migrations reversíveis | Checado nesta sessão: `grep -L "function down" backend/database/migrations/*.php` — nenhum arquivo sem `down()`, 20/20 |
| Permissões de diretório no container | `backend/Dockerfile:37` (`chown -R www:www /var/www/html/storage /var/www/html/bootstrap/cache`) |
| Nenhum segredo real versionado | `git ls-files \| grep -E "backend/\.env$\|backend/\.env\.production$"` — vazio; `.gitignore` cobre `.env`, `.env.backup`, `.env.production` |
| Testes/lint verdes | Executado nesta sessão: `php artisan test` → `{"tests":149,"passed":149,"assertions":384}`; `vendor/bin/pint --test` → passed; `tsc -b` → exit 0; `oxlint` → 1 warning (fast-refresh, não bloqueante) |
| Fila sem uso real | `find backend/app/Jobs backend/app/Listeners` (executado nesta sessão) — nenhum arquivo; worker do compose ocioso |
| Sem scheduler configurado | `grep -rn "Schedule::" bootstrap/app.php routes/console.php` — nenhum resultado |

Nenhuma afirmação deste documento depende de leitura indireta de outro
relatório — cada linha acima foi confirmada por comando executado nesta
sessão contra o código atual.

---

## Decisão Final

**⚠ APROVADO COM RESSALVAS.**

O código está tecnicamente pronto: testes, lint e build verdes,
proteções de segurança (auth, rate limit, MIME, CORS, headers)
verificadas diretamente no código, e nenhuma migration destrutiva. As
ressalvas são exclusivamente de infraestrutura/credenciais externas
(Postgres real, Drive, SMTP, domínio/HTTPS) — nenhuma exige trabalho de
engenharia adicional. Só passa a **NÃO APROVADO** se algum item da lista
NO-GO for ignorado no deploy real.
