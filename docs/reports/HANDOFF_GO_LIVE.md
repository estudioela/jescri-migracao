# HANDOFF_GO_LIVE.md — Auditoria Locaweb + Consolidação Documental

**Data:** 2026-07-22
**Referência de commit:** `93578f5` (branch `feat/ui-design-system-ela`,
já pushado para `origin/feat/ui-design-system-ela`, working tree limpa)
**Escopo:** `tear-v2-app/` (Laravel 12 + React 19), fase Macrofase A
(Go-Live interno), hospedagem Locaweb.

---

## 1. Objetivo da próxima sessão

Fechar a validação técnica da **Etapa 2** de
`docs/deployment/PLANO_DE_IMPLANTACAO.md` e decidir a estratégia de
deploy, para poder avançar às Etapas 3–4 (Postgres, DNS) e,
posteriormente, 9–11 (secrets, estrutura de diretórios, primeiro deploy).
Nenhuma dessas etapas foi iniciada — esta sessão foi só de auditoria e
documentação.

---

## 2. Estado atual do projeto

- **Código:** sem alterações nesta sessão. Última medição de qualidade
  (sessão anterior): backend 192/192 testes verdes, Pint limpo,
  `tsc -b`/`oxlint`/`vite build` do frontend limpos.
- **Documentação:** consolidada e commitada até `93578f5`. Working tree
  limpa, branch em dia com o remoto.
- **Infraestrutura Locaweb:** auditada via painel (read-only, nenhuma
  configuração alterada). Duas hospedagens Linux ativas na conta —
  `elafashionmkt.com.br` (agência) e `estudioela.com` (alvo do TEAR) —
  mesmo plano "Hospedagem I Linux", mesma data de contratação.
- **Domínio:** `influencia.estudioela.com` é a decisão definitiva de
  produção (travada em sessão anterior). DNS do domínio pai
  (`estudioela.com`) **ainda não está apontado** para a Locaweb.

---

## 3. Decisões já tomadas

1. **Hospedagem-alvo confirmada:** `estudioela.com`, sem necessidade de
   upgrade de plano, migração ou novo serviço contratado — mantém a
   restrição soberana de zero custo recorrente adicional
   (`ARQUITETURA_PRODUCAO.md` §0).
2. **Origem do domínio `estudioela.com` esclarecida** pelo responsável do
   projeto: migrado do WordPress.com (hospedagem cancelada lá, domínio
   trazido para a Locaweb). Explica a divergência entre o painel técnico
   (2 hospedagens) e o painel de faturamento (1 linha visível). Sem risco,
   item fechado — não requer mais investigação.
3. **Nenhuma decisão de arquitetura foi reaberta.** `ARQUITETURA_PRODUCAO.md`
   §1–§13 (hospedagem, banco, storage, Google Drive, SMTP, domínio, HTTPS,
   CI/CD, monitoramento) seguem válidas como estavam. Só a **mecânica de
   deploy** (§3) precisa de ajuste — não a decisão de usar Locaweb/Postgres/
   sem Docker.

---

## 4. Decisões pendentes (dependem exclusivamente do responsável do projeto)

| # | Decisão | Onde está a análise |
|---|---|---|
| 1 | Habilitar SSH no painel da hospedagem `estudioela.com` (ação manual, sessão de 3h) para permitir a validação técnica completa (Composer, extensões PHP, quota de disco, conexão Postgres, IP do proxy reverso) | `docs/deployment/AUDITORIA_LOCAWEB.md` §2.1 |
| 2 | Estratégia de deploy, dado que SSH é temporário/por senha e "Publicar via Git" do painel é só FTP | `docs/deployment/AUDITORIA_LOCAWEB.md` §5.1 — **recomendação já pronta**: modelo híbrido (FTP automatizado via CI para código/build/`vendor/`; SSH manual só para `migrate`/cache quando há mudança de schema/dependência) |
| 3 | Confirmar host/porta do relay SMTP incluso no plano | `docs/deployment/AUDITORIA_LOCAWEB.md` §3 (pendências) |
| 4 | Ativar ou não o backup nativo da Locaweb como camada extra de redundância | `docs/deployment/AUDITORIA_LOCAWEB.md` §4.5/§5 |
| 5 | (Baixa prioridade, não bloqueia o Go-Live) Arquivar `docs/architecture/DATABASE_MODEL.md` e `docs/domain/TEAR.md` (documentos órfãos/desatualizados) e/ou remover os 4 git worktrees obsoletos em `.claude/worktrees/` | Achados da auditoria final desta sessão |

---

## 5. Riscos conhecidos

1. **Mecânica de deploy planejada quebrada pela infraestrutura real** — a
   automação por SSH + symlink swap (`ARQUITETURA_PRODUCAO.md` §3,
   já codificada em `.github/workflows/tear-v2-deploy.yml` e
   `tear-v2-app/scripts/deploy-locaweb.sh`) presume SSH persistente por
   chave; o plano real só oferece SSH manual/temporário por senha.
   Mitigação recomendada documentada, decisão pendente (item 2 acima).
2. **Limites de recurso da hospedagem compartilhada não confirmados** —
   sem SSH habilitado, não foi possível checar `df -h`/limites de
   CPU-memória para `composer install --no-dev`. Mitigação já prevista:
   rodar `composer install` no CI e subir `vendor/` pronto.
3. **WAF ativa por padrão** pode gerar falso positivo em rotas de API
   (Sanctum) ou upload de Material — precisa ser testado no primeiro
   deploy real, não dá para prever pelo painel sem tráfego de teste.
4. Validação comercial concentrada em um único piloto ainda não
   confirmado; bus factor 1 (fundador único); migração de infraestrutura
   prevista para novembro coincide com pico sazonal da Jescri em dezembro.
   (Riscos de negócio, não técnicos — ver `ESTADO_SESSAO.md` §5.)

---

## 6. Ordem recomendada de execução

1. Responsável do projeto habilita SSH no painel (`estudioela.com`) →
   agente valida Composer, extensões PHP, disco, Postgres, proxy
   (fecha Etapa 2).
2. Decidir a estratégia de deploy (item 2 da tabela §4) — recomendação já
   pronta, só precisa de validação.
3. Etapa 3 — provisionar o PostgreSQL gerenciado.
4. Etapa 4 — apontar DNS de `estudioela.com` para a Locaweb (depende da
   Etapa 2 fechada) + criar subdomínio `influencia.estudioela.com`.
5. Etapas 5–8 — Google Shared Drive, SMTP, `APP_KEY`, `.env` real de
   produção.
6. Etapas 9–11 — secrets do GitHub Actions, estrutura de diretórios no
   host, primeiro deploy (homologação) — **só depois da decisão do item 2
   estar implementada em `tear-v2-deploy.yml`/`deploy-locaweb.sh`**.
7. Etapas 12–17 — provisionar admin, backup, fila/scheduler, uptime
   check, smoke test, corte para produção.

Detalhe etapa a etapa em `docs/deployment/PLANO_DE_IMPLANTACAO.md`.

---

## 7. Referências

- `docs/deployment/AUDITORIA_LOCAWEB.md` — auditoria completa da
  infraestrutura, checklist técnico (§2.1) e recomendação de deploy (§5.1).
- `docs/deployment/PLANO_DE_IMPLANTACAO.md` — runbook oficial de execução,
  Etapa 2 já atualizada com os achados desta sessão.
- `docs/deployment/ARQUITETURA_PRODUCAO.md` — decisões de arquitetura
  (não reabertas), §14 com nota do achado de execução.
- `docs/_workspace/TASK_ROUTER.md` §24–§25 — histórico completo desta
  sessão (auditoria + consolidação documental).
- `docs/_workspace/ESTADO_SESSAO.md` — snapshot rápido de estado, ler
  junto com este documento.
- Commit de referência: `93578f5` — `docs(deployment): consolida
  documentacao pos-auditoria Locaweb`.
