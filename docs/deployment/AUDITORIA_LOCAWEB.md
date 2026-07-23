# AUDITORIA_LOCAWEB.md — Auditoria de Infraestrutura Locaweb (Etapa 2 do Go-Live)

**Papel:** Auditoria técnica (CTO / Infra)
**Data:** 2026-07-22
**Escopo:** Levantamento read-only do painel Locaweb (Central do Cliente +
Painel de Hospedagens), via acesso já logado do responsável do projeto.
**Nenhuma configuração foi alterada.** Nenhum banco, domínio, SSH, SSL ou
recurso foi criado/habilitado durante esta auditoria — só leitura.

**Achado estrutural, antes de tudo:** a conta Locaweb (cód. cliente
`1101016193`, usuário `dperrut`) tem **duas hospedagens Linux ativas**, não
uma:

| | `elafashionmkt.com.br` | `estudioela.com` |
|---|---|---|
| Papel no negócio | Site/agência (marca "ELÃ MKT") | Domínio do produto TEAR (`portal.estudioela.com`) |
| Plano | Hospedagem I Linux | Hospedagem I Linux |
| Usuário FTP/SSH | `elafashionmkt1` | `estudioela1` |
| Diretório raiz | `/home/elafashionmkt1/` | `/home/estudioela1/` |
| IP compartilhado | `179.188.55.78` | `191.252.83.211` |

Isso confirma que a hospedagem correta para o TEAR já existe e é a
`estudioela.com` — **não há necessidade de contratar, migrar ou fazer
upgrade de nada** para dar continuidade ao Go-Live. Ambas as hospedagens
são tecnicamente idênticas (mesmo plano, mesmo tier, contratadas na mesma
data). Detalhe na §2.

---

## 1. Inventário completo

### 1.1 Plano contratado (idêntico nas duas hospedagens)

| Item | Valor | Observação |
|---|---|---|
| Tipo de hospedagem | Hospedagem I Linux (compartilhada) | Entry-level do catálogo Locaweb, sem Docker/root/systemd — confirma `ARQUITETURA_PRODUCAO.md` §1 |
| Sistema operacional | Rocky Linux 8 | |
| PHP | 8.3 (ativo) | Aviso do painel oferece upgrade opcional — **não aplicar sem necessidade**, 8.3 já é o que a stack Laravel 12 assume |
| Banco de dados | MySQL, PostgreSQL e MS SQL disponíveis; 0/10 bancos usados | PostgreSQL confirmado disponível — nenhum banco criado ainda |
| SSH | Disponível, mas **desabilitado por padrão** | Ver risco crítico em §4.1 |
| Git | "Publicar via Git" existe, mas **não é git real** | Ver risco crítico em §4.2 |
| Composer | Não verificável sem SSH habilitado | Pendente — ver §3 |
| Cron | Crontab nativo Linux disponível, 0 tarefas agendadas | Aceita e-mail de log de execução |
| SSL | Let's Encrypt gratuito via painel | Emissão depende de DNS já apontado (ver §1.2) |
| DNS | Painel Locaweb faz o apontamento | Cada hospedagem tem seu próprio domínio principal |
| Gerenciamento de domínio | 1 domínio principal por hospedagem, subdomínios ilimitados | Registro de `estudioela.com` está nesta conta, mas **não** o de `elafashionmkt.com.br` isoladamente — na verdade os dois domínios aparecem em `Registro de Domínio`; `estudioela.com` está associado à hospedagem homônima |
| Armazenamento | Não exposto numericamente no painel (sem quota de disco visível em GB) | Pendente — só via SSH/suporte, ver §3 |
| WAF | Ativa por padrão nas duas hospedagens | Ver risco em §4.4 |
| Backup automático | **Não ativado** (link "Ativar" nas duas) | Ver risco em §4.5 |
| FTP multiusuário | Não incluso — é upsell pago ("Contratar") | Só 1 usuário FTP/SSH por hospedagem hoje |

### 1.2 Estado específico de cada hospedagem

**`elafashionmkt.com.br`** (não é o alvo do deploy do TEAR, mas já operacional):
- DNS: **Apontamento Locaweb** (já configurado e funcionando)
- Certificado SSL: Inativo (nunca emitido)
- Domínio temporário: `elafashionmkt1.hospedagemdesites.ws`

**`estudioela.com`** (hospedagem-alvo do TEAR):
- DNS: **Pendente de configuração** — banner do painel: "Configure seu DNS
  para que seu site fique acessível"
- Certificado SSL: bloqueado com status **"DNS Pendente"** (Let's Encrypt
  só emite depois do DNS apontado)
- Domínio temporário: `estudioela1.hospedagemdesites.ws`
- Nenhum subdomínio (`influencia`) criado ainda em "Domínios" desta
  hospedagem

### 1.3 Central do Cliente / faturamento

- Cadastro: Pessoa Jurídica, CNPJ `44.277.880/0001-13`, razão social
  Daniel Perrut Dos Reis.
- 2FA ativada na conta (bom sinal de segurança).
- Em "Alterar Planos" só aparece **uma** linha de "Hospedagem de Sites"
  (Hospedagem I Linux, R$ 130,80/ano) e **um** registro de domínio
  (`elafashionmkt.com.br`, R$ 64,90/ano) — apesar de existirem duas
  hospedagens ativas no painel técnico. **Explicado pelo responsável do
  projeto (2026-07-22):** `estudioela.com` foi originalmente adquirido/
  gerenciado no WordPress.com; a hospedagem lá foi cancelada e o domínio
  trazido para a Locaweb (sem certeza se foi transferência de
  administração ou só mudança de apontamento) — isso explica a divergência
  de exibição entre o painel técnico e o de faturamento. O domínio funciona
  normalmente na Locaweb hoje. **Não é bloqueio técnico nem administrativo
  — não requer mais investigação.**

---

## 2. Compatibilidade com o TEAR (`ARQUITETURA_PRODUCAO.md`)

| Requisito da arquitetura | Status | Motivo |
|---|---|---|
| PHP 8.3 | ✅ Totalmente compatível | Já é a versão ativa nas duas hospedagens |
| PostgreSQL gerenciado | ✅ Totalmente compatível | Disponível para criação, até 10 bancos |
| SSH para deploy | ⚠️ Parcialmente compatível | Existe, mas desabilitado por padrão, expira em 3h, renovação manual, autenticação por senha (não por chave) — incompatível com deploy 100% automatizado sem intervenção humana a cada execução |
| Deploy via Git (GitHub Actions) | ⚠️ Parcialmente compatível | O recurso "Publicar via Git" do painel é só um template de FTP upload (`locaweb/ftp-deploy`), não executa comandos remotos. A estratégia de `ARQUITETURA_PRODUCAO.md` §3 (symlink swap + `migrate` remoto via SSH) **não pode ser feita por esse recurso** — só via SSH manual/scriptado, sujeito à limitação acima. `composer install` deixou de fazer parte do que rodaria remotamente — decisão `ADR-016`, roda só no runner do CI |
| Crontab (`schedule:run`, `queue:work`, backup) | ✅ Totalmente compatível | Nativo, sem uso ainda |
| Storage local (disco) | ⚠️ A confirmar | Painel não expõe quota em GB; sem SSH habilitado não dá para checar `df -h` |
| Google Drive (upload de Material) | ✅ Totalmente compatível | Não depende da Locaweb, é integração externa via OAuth de conta dedicada (`ADR-017`, não Service Account) |
| SMTP incluso no plano | ⚠️ A confirmar | Seção de e-mail existe no painel ("Email Locaweb"), mas não foi possível localizar host/porta do relay SMTP nesta auditoria — ver §3 |
| SSL gratuito (Let's Encrypt) | ✅ Totalmente compatível | Confirmado no painel, mas emissão para `estudioela.com` está bloqueada até o DNS ser apontado |
| Domínio `portal.estudioela.com` | ⚠️ Parcialmente compatível | Hospedagem correta existe, mas domínio pai (`estudioela.com`) ainda não tem DNS apontado nem subdomínio criado |
| WAF (proteção de borda) | ⚠️ A validar em execução | Ativa por padrão — pode gerar falso positivo em upload de Material ou em rotas de API/Sanctum; precisa ser testado após o primeiro deploy |

**Conclusão de compatibilidade:** a infraestrutura contratada é
**adequada para o TEAR sem custo adicional**, como já assumido em
`ARQUITETURA_PRODUCAO.md`. Os dois pontos que exigem adaptação de
*workflow* (não de plano/dinheiro) são o SSH temporário/por senha e o
"Git" que na verdade é FTP — ambos afetam a estratégia de deploy descrita
em `ARQUITETURA_PRODUCAO.md` §3 e precisam de uma decisão de arquitetura
(ver §5).

### 2.1 Checklist técnico Laravel/React × infraestrutura real

Cruzamento entre o que o código de `tear-v2-app` realmente exige
(`composer.json`, `config/database.php`, `config/queue.php`,
`config/session.php`, `bootstrap/app.php`, `.env.production.example`,
`frontend/package.json`/`vite.config.ts`) e o que a auditoria confirmou no
painel:

| Requisito | Origem no código | Status confirmado pela auditoria | Ação necessária |
|---|---|---|---|
| PHP `^8.3` | `backend/composer.json` | ✅ CONFIRMADO — 8.3 ativo nas duas hospedagens | Nenhuma |
| `pdo_pgsql`/`pgsql` | `config/database.php`, `.env.production.example` (`DB_CONNECTION=pgsql`) | ⚠️ PENDENTE — não checado (precisa SSH) | Habilitar SSH e rodar `php -m \| grep pgsql` |
| `ext-mbstring`, `ext-openssl`, `ext-ctype`, `ext-filter`, `ext-hash`, `ext-session`, `ext-tokenizer` | `composer.lock` (exigidas por `laravel/framework`) | ⚠️ PENDENTE — não checado | `php -m` via SSH após habilitação |
| `ext-fileinfo` | `composer.lock` (`league/flysystem-local`), usado por `FILESYSTEM_DISK=local` | ⚠️ PENDENTE — não checado | Idem |
| `ext-gd`, `ext-zip`, `ext-intl`, `ext-bcmath` | Não usados de fato em `app/` (só "suggest" opcional de libs de terceiros) | ✅ Não é requisito real do app hoje | Nenhuma — não bloqueia Go-Live |
| Fila (`QUEUE_CONNECTION=database`) | `config/queue.php` (default `database`) | ✅ CONFIRMADO — Crontab nativo disponível, sem Redis necessário | Criar entrada de crontab para `queue:work --stop-when-empty` |
| Scheduler (`schedule:run`) | `bootstrap/app.php`/`routes/console.php` (padrão Laravel 12, sem `Kernel.php`) | ✅ CONFIRMADO — Crontab nativo, 0 tarefas hoje | Criar entrada de crontab `* * * * * php artisan schedule:run` |
| Sessão `database` + cookie same-origin (Sanctum SPA) | `config/session.php`, `.env.production.example` (`SESSION_DOMAIN=portal.estudioela.com`) | ⚠️ PENDENTE — depende do DNS/subdomínio ainda não criado | Apontar DNS e criar subdomínio antes de validar |
| `TRUSTED_PROXIES` (proxy reverso Locaweb) | `bootstrap/app.php` (`$middleware->trustProxies(...)`) | ⚠️ PENDENTE — IP/CIDR do proxy não levantado nesta auditoria | Obter IP(s) do proxy via SSH/suporte Locaweb |
| Composer disponível no servidor | Mitigação de risco em `ARQUITETURA_PRODUCAO.md` §14 | ✅ RESOLVIDO — confirmado ausente no host (Rocky Linux 8.10, PHP 8.4.22); deixou de ser dependência (`ADR-016`) | Nenhuma — `vendor/` é gerado no runner do CI e enviado via `rsync`, host nunca executa Composer |
| SMTP relay incluso | `.env.production.example` (`MAIL_MAILER=smtp`, host/porta `CHANGE_ME`) | ⚠️ A CONFIRMAR — seção "Email Locaweb" existe no painel, host/porta não localizados nesta auditoria | Levantar host/porta/credenciais na seção de e-mail do painel |
| Node/npm só em build time (CI) | `frontend/package.json` (`build:locaweb`), `vite.config.ts` (`outDir: ../backend/public/build`) | ✅ CONFIRMADO no código — bate com a arquitetura, sem Node em runtime no servidor | Nenhuma |
| Quota de disco/CPU para `composer install --no-dev` | Risco em `ARQUITETURA_PRODUCAO.md` §14 | ✅ RESOLVIDO — deixou de ser risco: `composer install` não roda mais no host em nenhum cenário (`ADR-016`), independente da quota real do plano | Nenhuma |

---

## 3. O que ainda precisa ser criado/decidido

- [ ] Banco de dados PostgreSQL de produção (não criado — Etapa 3 do
      `PLANO_DE_IMPLANTACAO.md`)
- [ ] Apontamento de DNS de `estudioela.com` para a Locaweb (Etapa 4)
- [ ] Subdomínio `portal.estudioela.com` dentro da hospedagem
      `estudioela.com`
- [ ] Certificado SSL (Let's Encrypt) para o subdomínio — só depois do DNS
- [ ] Habilitar SSH (ação manual no painel, válida por 3h — decidir se o
      fluxo de deploy vai depender de habilitação manual a cada release ou
      se será feito só para deploys pontuais + tarefas administrativas)
- [x] ~~Confirmar disponibilidade de Composer via SSH (`which composer`)~~
      — confirmado ausente no host; deixou de ser bloqueio, `ADR-016`
      move `composer install` para o runner do CI
- [ ] Confirmar quota de disco (`df -h` via SSH, ou perguntar ao suporte)
- [ ] Levantar IP(s)/CIDR do proxy reverso da Locaweb para `TRUSTED_PROXIES`
      (`backend/bootstrap/app.php` já lê a variável, só falta o
      valor real — via SSH ou suporte)
- [ ] Confirmar host/porta do relay SMTP incluso no plano (seção "Email
      Locaweb" do painel, ou suporte)
- [x] ~~Decidir estratégia real de deploy dado que "Publicar via Git" é só
      FTP~~ — decidido em `docs/adrs/ADR-016-composer-no-ci-deploy-manual.md`:
      mantém `rsync`/SSH (releases/ + symlink `current`, já implementado),
      Composer só no CI, disparo do workflow manual (`workflow_dispatch`)
      em vez de automático por push
- [x] ~~Esclarecer com o suporte/faturamento da Locaweb por que
      `estudioela.com` não aparece como linha separada em "Alterar
      Planos"~~ — explicado pelo responsável do projeto (domínio migrado
      do WordPress.com), sem investigação adicional necessária.
- [ ] Variáveis de ambiente reais (`.env` de produção) — dependem dos
      itens acima
- [ ] GitHub Secrets para deploy (host/usuário/senha FTP e/ou credenciais
      SSH) — só depois da decisão de estratégia de deploy
- [ ] Ativar backup (hoje "Ativar", não habilitado) nas duas hospedagens
- [ ] Credenciais OAuth da conta dedicada do Google Drive (`ADR-017`) no
      `.env` — fora do escopo Locaweb

---

## 4. Riscos identificados

### 4.1 SSH temporário e por senha (crítico)
SSH vem **desabilitado por padrão**, precisa ser habilitado manualmente
pelo painel, dura **3 horas** e a renovação é **manual** — não há
renovação automática nem API para habilitar via CI. Além disso, a
autenticação usa a **mesma senha do FTP**, não par de chaves. Isso quebra
a premissa de deploy 100% automatizado por SSH descrita em
`ARQUITETURA_PRODUCAO.md` §3. Impacto: todo deploy que dependa de `composer
install --no-dev`, `artisan migrate` ou cache warmup remoto vai exigir que
alguém habilite o SSH manualmente antes (ou aceitar rodar isso por FTP
scriptado com `expect`/similar, o que é frágil).

### 4.2 "Publicar via Git" não é deploy real (crítico)
O recurso do painel gera um template de GitHub Actions que faz só
**upload FTP** do diretório `dist` para `public_html` via
`locaweb/ftp-deploy`. Não há hook de pós-deploy, não executa comandos no
servidor. A estratégia de `releases/<id>/` + symlink `current` (deploy
atômico) do `ARQUITETURA_PRODUCAO.md` §3 **não é suportada nativamente**
por esse recurso — precisa ser implementada via SSH manual/scriptado, que
por sua vez esbarra no risco §4.1.

### 4.3 Hospedagem compartilhada sem confirmação de limites de recurso
Sem SSH habilitado não foi possível confirmar limites de CPU/memória/
processos simultâneos nem quota de disco. `ARQUITETURA_PRODUCAO.md` §14 já
previa esse risco e sugeriu, como mitigação, rodar `composer install`
localmente/CI e subir o `vendor/` pronto. **Resolvido por `ADR-016`:** essa
mitigação deixou de ser uma alternativa condicional e virou a implementação
adotada — `composer install` roda sempre no runner do CI, nunca no host,
então o limite de CPU/memória do plano para essa etapa específica deixou
de ser um risco (o host nunca precisa executá-la). Uma auditoria
subsequente já confirmou, à parte, que o host **não tem Composer instalado
globalmente** — o que por si só já inviabilizava a mecânica original,
independente de quota.

### 4.4 WAF ativa por padrão pode interferir com API/upload
A "Proteção WAF" (recurso novo da Locaweb) está ativa por padrão nas duas
hospedagens. Regras de WAF genéricas podem gerar falso positivo em rotas
de API JSON (Sanctum), em uploads de Material, ou em payloads maiores —
precisa ser testado no primeiro deploy real, não dá para prever pelo
painel sem tráfego de teste.

### 4.5 Backup não está ativado
O backup nativo da Locaweb aparece como "Ativar" (não habilitado) nas duas
hospedagens. A estratégia de `ARQUITETURA_PRODUCAO.md` §7 já não depende
dele (usa `pg_dump` via Crontab + upload pro Drive), mas vale considerar
ativar como camada extra de redundância, já que não tem custo adicional
aparente — a confirmar se é gratuito no plano atual antes de ativar (não
habilitado nesta auditoria, por instrução).

### 4.6 ~~Divergência painel técnico × faturamento~~ — resolvido, não é risco
`estudioela.com` existe e funciona no painel técnico, mas não aparece como
linha de cobrança separada em "Alterar Planos". Explicado pelo responsável
do projeto: o domínio veio do WordPress.com (hospedagem cancelada lá,
domínio trazido para a Locaweb) — explica a divergência de exibição.
Domínio funciona normalmente. Sem risco técnico ou administrativo, não
requer mais investigação.

---

## 5. Checklist de decisão

| # | Decisão necessária | Quem decide |
|---|---|---|
| 1 | Estratégia de deploy dado que "Git" = FTP-only (SSH manual por release vs. FTP + SSH pontual vs. outra) | Responsável do projeto (decisão de arquitetura, pode exigir novo ADR) |
| 2 | Se o fluxo de deploy vai depender de habilitar SSH manualmente a cada release, ou só para manutenção pontual | Responsável do projeto |
| 3 | Ativar ou não o backup nativo da Locaweb como camada extra | Responsável do projeto |

~~Item anterior "esclarecer cobertura de faturamento de `estudioela.com`"~~
— resolvido pelo responsável do projeto (§1.3): domínio migrado do
WordPress.com, sem risco administrativo.

### 5.1 Recomendação para o item 1 (estratégia de deploy) — decidido em `ADR-016`

**Atualização (`ADR-016`, 2026-07-22): decisão tomada — não é (B) como
recomendado abaixo.** Uma auditoria subsequente do host confirmou SSH
**disponível** (ainda que de habilitação manual/temporária, ~3h) e
Composer **ausente globalmente**. Com SSH confirmado utilizável, a decisão
foi manter `rsync`/SSH (já implementado, transporte criptografado e
resumível) em vez de introduzir FTP — a única mudança necessária foi mover
`composer install` para o runner do CI (elimina o bloqueio confirmado de
Composer ausente) e tornar o disparo do workflow manual
(`workflow_dispatch`, em vez de automático por push), já que a janela de
SSH de 3h não é garantida no momento de um push. Ver `ADR-016` para a
decisão completa e as alternativas descartadas.

A análise original abaixo (feita quando o SSH parecia desabilitado por
padrão, antes da confirmação de disponibilidade) permanece como registro
histórico do raciocínio da época:

Análise comparativa entre 4 alternativas, dado que SSH é temporário/por
senha e "Publicar via Git" é só FTP:

| Alternativa | Custo | Segurança | Esforço de manutenção (solo) | Risco de erro humano |
|---|---|---|---|---|
| (A) Deploy 100% manual via SSH a cada release | Zero | Boa (nenhum segredo SSH em CI) | Alto (ritual completo a cada release) | Médio |
| **(B) Híbrido — FTP automatizado (código+build+`vendor/` do CI) + SSH manual só para `migrate`/cache** | Zero | Boa (só segredo FTP, já necessário; SSH nunca em CI) | **Baixo** (SSH só quando há mudança de schema/dependência) | **Baixo** |
| (C) Automatizar a habilitação do SSH via scraping/RPA do painel | Zero (mas frágil) | Ruim (exige guardar senha da Central do Cliente em CI) | Alto (manter automação de UI frágil) | Alto (quebra silenciosamente) |
| (D) Manter symlink+SSH automatizado original, sincronizando manualmente habilitação + disparo do workflow | Zero | Ruim (senha de SSH como GitHub Secret de longa duração) | Médio-alto (coordenar timing humano+CI) | Alto (janela de 3h errada) |

**Recomendação (a validar pelo responsável do projeto): opção (B).**
FTP automatizado via GitHub Actions cobre a maioria dos deploys — código
PHP + build do frontend + `vendor/` **também gerado no CI e enviado via
FTP** (isso também mitiga o risco §4.3 de `composer install` não caber nos
limites do plano compartilhado). SSH manual fica reservado só para o que
é raro e sensível: `artisan migrate --force` e cache warmup, disparados
apenas quando há migration nova ou mudança em `composer.lock`. Isso
aproveita o `.github/workflows/tear-v2-deploy.yml` só na etapa de build
(`npm ci && npm run build`), substitui o job de SSH/rsync/symlink por
upload FTP, e reduz `scripts/deploy-locaweb.sh` a um
runbook manual (sem `release_id`/symlink, operando no diretório vivo),
usado só nas ocasiões raras que exigem SSH. Perde-se a atomicidade real de
release (FTP sobrescreve em lugar) — aceitável dado o perfil de tráfego
administrativo baixo já assumido em `ARQUITETURA_PRODUCAO.md`. As
alternativas (C) e (D) foram descartadas: (C) por trocar um problema
pequeno por uma superfície de risco maior (senha de painel em CI); (D) por
não reduzir esforço operacional, só deslocar a complexidade para
sincronização manual de timing.

~~**Esta é uma recomendação, não uma decisão tomada**~~ — decidida e
implementada em `ADR-016` (variante diferente da opção B acima, ver nota
no início desta seção): `tear-v2-deploy.yml`/`deploy-locaweb.sh` já
refletem a mecânica adotada.

**Nenhuma dessas decisões bloqueia o restante da Etapa 2** (SSH, Composer,
Postgres — itens de validação técnica). Elas bloqueiam especificamente a
Etapas 9–11 (secrets/estrutura/primeiro deploy) do `PLANO_DE_IMPLANTACAO.md` e podem exigir
revisão pontual de `ARQUITETURA_PRODUCAO.md` §3 (não uma reabertura total
da arquitetura — só da mecânica de deploy).

---

## 6. Decisão sobre aptidão da infraestrutura

**A infraestrutura contratada (hospedagem `estudioela.com`, Hospedagem I
Linux) é apta para hospedar o TEAR, sem necessidade de upgrade de plano,
contratação de novo serviço ou custo recorrente adicional.** Isso confirma
a restrição soberana de "zero custo recorrente adicional" de
`ARQUITETURA_PRODUCAO.md` §0.

A única ressalva real é de **mecânica de deploy**, não de capacidade: o
plano não oferece SSH persistente por chave nem deploy via git real, então
a automação de deploy planejada em `ARQUITETURA_PRODUCAO.md` §3 foi
ajustada para lidar com SSH temporário/por senha e Composer ausente —
decisão registrada em `ADR-016`, não motivo para trocar de hospedagem ou
pagar mais.

**Próximo passo recomendado:** seguir a Etapa 2 do
`PLANO_DE_IMPLANTACAO.md` habilitando o SSH (ação do responsável do
projeto no painel) para validar quota de disco, extensões PHP e conexão ao
Postgres (Composer já não é mais uma validação necessária, `ADR-016`) —
a estratégia de deploy (checklist §5, item 1) já está decidida; falta
cadastrar os secrets do GitHub e rodar o primeiro `workflow_dispatch`
(Etapas 9–11).
