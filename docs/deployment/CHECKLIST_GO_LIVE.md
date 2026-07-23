# Checklist Executável de Go Live — TEAR V2.5

Preencher esta lista durante a execução. Uma marca só vale com evidência:
data, responsável, URL, saída de comando ou ticket.

## 1. Infraestrutura

- [ ] PostgreSQL criado; conexão autenticada confirmada.
- [ ] PHP 8.3 e extensões necessárias confirmadas no host.
- [ ] `pg_dump`, `psql`, cron e espaço em disco confirmados.
- [ ] Document root configurado para `current/public`.
- [ ] `storage/` e `bootstrap/cache/` graváveis pelo PHP.
- [ ] DNS de `portal.estudioela.com` propagado.
- [ ] SSL válido e renovação confirmada.
- [ ] WAF validado com API, CSRF e upload multipart.

## 2. Segredos e ambiente

- [ ] `.env` está fora do Git e com permissão 600.
- [ ] `APP_ENV=production` e `APP_DEBUG=false`.
- [ ] `APP_KEY` exclusiva, guardada no gestor de senhas.
- [ ] Todos os `DB_*` reais e sem placeholders.
- [ ] `TRUSTED_PROXIES` confirmado com a Locaweb.
- [ ] Cookie seguro, domínio de sessão, Sanctum e origem única configurados.
- [ ] SMTP configurado e domínio de envio autenticado.
- [ ] Google Drive OAuth e IDs de pastas configurados.

## 3. Publicação

- [ ] CI do commit candidato está verde.
- [ ] Método de deploy compatível com o SSH real foi ensaiado.
- [ ] `vendor/` e `public/build/` constam na release nova.
- [ ] `.env` e `storage` compartilhados foram vinculados corretamente.
- [ ] `php83 artisan migrate --force` concluído.
- [ ] Caches de config, rotas e views gerados.
- [ ] `current` aponta para a nova release.
- [ ] Release anterior preservada para rollback.

## 4. Serviços e integrações

- [ ] Primeiro ADMIN criado.
- [ ] `php83 artisan google-drive:test` aprovado (no host, via SSH).
- [ ] Convite chega à caixa de entrada.
- [ ] Reset de senha chega à caixa de entrada.
- [ ] Material de teste enviado e encontrado no Drive.
- [ ] Comprovante de pagamento enviado e encontrado no Drive.

## 5. Operação e recuperação

- [ ] Cron de backup instalado.
- [ ] Cron de health check instalado.
- [ ] Cron de scheduler instalado.
- [ ] Cron de fila instalado, se aplicável.
- [ ] Backup executado e arquivo confirmado no Drive.
- [ ] Restore ensaiado em banco isolado, sem Docker.
- [ ] `/up` e `/api/health` respondem 200.
- [ ] Pulse disponível ao ADMIN.
- [ ] Logs diários e `X-Request-Id` confirmados.
- [ ] Alerta de falha de backup testado.

## 6. Homologação final

- [ ] Cadastro público.
- [ ] Aprovação de Parceira e convite.
- [ ] Login, reload e logout.
- [ ] Recuperação de senha.
- [ ] Briefing.
- [ ] Upload e aprovação/reprovação de material.
- [ ] Pagamento e comprovante.
- [ ] Envio.
- [ ] Verificação de isolamento entre influenciadoras.

## Encerramento

- [ ] Todos os itens obrigatórios concluídos.
- [ ] Gate `docs/release/GATE_FINAL_GO_LIVE.md` autorizado por responsável técnico.
- [ ] Janela de observação pós-go-live definida (mínimo de 24 horas).
