# GATE FINAL GO LIVE — TEAR V2.5

**Objetivo:** registrar a decisão de autorização de produção e os critérios
objetivos que devem ser satisfeitos antes do primeiro acesso público.

**Escopo:** `tear-v2-app`. O legado GAS não faz parte desta liberação.

## Decisão atual

**GO LIVE: NÃO AUTORIZADO.**

O MVP está pronto do ponto de vista funcional e a arquitetura é preservável.
A autorização está pendente exclusivamente da conclusão e comprovação dos
controles operacionais abaixo.

## Bloqueadores de autorização

- [ ] Processo de deploy compatível com o SSH real da Locaweb validado. O
  workflow atual exige chave SSH; a hospedagem auditada oferece SSH temporário
  por senha. Não executar o workflow até que a operação escolhida tenha sido
  ensaiada ponta a ponta.
- [ ] PostgreSQL de produção provisionado, acessível e com migrations aplicadas.
- [ ] `influencia.estudioela.com` criado, DNS propagado e TLS válido emitido.
- [ ] `.env` de produção criado fora do Git, sem `CHANGE_ME`, com permissão 600.
- [ ] `APP_KEY` exclusiva de produção gerada e armazenada no gestor de senhas.
- [ ] SMTP configurado; convite e recuperação de senha entregues em caixa real.
- [ ] Google Drive OAuth configurado e `php artisan google-drive:test` aprovado.
- [ ] Backup executado e cópia confirmada no Drive.
- [ ] Restore de PostgreSQL, sem Docker, documentado e ensaiado em banco isolado.
- [ ] Cron instalado para backup, health check, scheduler e fila.
- [ ] Smoke test completo aprovado no ambiente de destino, incluindo WAF,
  login/Sanctum, upload e pagamento.

## Itens aceitos para o MVP

- Cache, sessões, fila e Pulse usando PostgreSQL.
- Worker de fila acionado por cron com `--stop-when-empty`.
- Hospedagem compartilhada Locaweb para o volume inicial.
- Google Drive como repositório de materiais e comprovantes.
- Ausência de Redis, Sentry, 2FA e escalonamento horizontal.

## Condições para autorizar

O responsável técnico pode alterar a decisão para **GO LIVE: AUTORIZADO**
somente após todos os bloqueadores estarem marcados e o registro de execução
da checklist `docs/deployment/CHECKLIST_GO_LIVE.md` estiver completo.

## Critérios de rollback após publicação

Executar rollback da aplicação e suspender novas operações caso ocorra um dos
seguintes eventos:

- login não persiste após reload;
- falha em cadastro, convite, reset, upload, aprovação ou pagamento;
- indisponibilidade de `/up` ou `/api/health`;
- erro 5xx acima de 2% por 10 minutos;
- falha de banco, migration ou autorização;
- P95 dos endpoints críticos acima de 3 segundos por 15 minutos;
- indisponibilidade do Google Drive ou SMTP sem procedimento de contingência.

O rollback só é considerado completo quando a release anterior estiver ativa,
os smoke tests mínimos passarem e os dados afetados tiverem sido avaliados.
