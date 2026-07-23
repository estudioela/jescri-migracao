# LOCAWEB.md — Inventário de Infraestrutura

- **Papel:** documento de referência permanente sobre a infraestrutura
  Locaweb do projeto TEAR.
- **Fonte primária desta revisão:** 10 prints do painel Locaweb
  (`docs/infrastructure/assets/`, capturados em 2026-07-23 entre 13:42 e
  13:44), fornecidos pelo responsável do projeto. Os documentos
  `docs/deployment/AUDITORIA_LOCAWEB.md` e
  `docs/deployment/ARQUITETURA_PRODUCAO.md` foram usados só para
  conferência/cruzamento, **não** como fonte primária desta revisão —
  onde divergem dos prints, ver seção "Divergências encontradas".
- **Convenção de pasta:** mantido em `docs/deployment/`, mesma pasta de
  `AUDITORIA_LOCAWEB.md`/`ARQUITETURA_PRODUCAO.md`/`PLANO_DE_IMPLANTACAO.md`
  (`docs/infrastructure/` não existe no projeto).
- **Cada afirmação abaixo cita o print de origem** entre colchetes. Onde a
  informação não é visível em nenhum print, está marcada como
  **"Pendente de validação em ambiente."**

---

## Estratégia de domínio (decisão do responsável do projeto, 2026-07-23)

Não é uma divergência — é uma decisão de sequenciamento:

- **`elafashionmkt.com.br`** — infraestrutura física/hospedagem já
  identificada nos prints. **Ambiente inicial** para deploy,
  homologação, estabilização e testes de produção do TEAR.
- **`estudioela.com`** — domínio **canônico planejado** do produto
  (`portal.estudioela.com`, per `PLANO_DE_IMPLANTACAO.md` Etapa 1).
  Migração futura por alias/apontamento de hospedagem, **sem** mudança de
  infraestrutura física.

Todos os achados abaixo (PHP, SSH, FTP, banco, etc.) refletem
**`elafashionmkt.com.br`**, por ser o alvo real do deploy inicial — os 10
prints fornecidos são todos dessa hospedagem, nenhum de `estudioela.com`.

---

# Visão geral da infraestrutura

- **Provedor:** Locaweb.
- **Hospedagem confirmada nos prints:** `elafashionmkt.com.br` — ambiente
  inicial de deploy/homologação (ver seção acima).
- **Domínio canônico planejado:** `estudioela.com` /
  `portal.estudioela.com` (migração futura, fora do escopo desta
  auditoria de prints).
- **Painel:** `painelhospedagem.locaweb.com.br`, conta `73068156`,
  usuário `dperrut` [dashboard, ssl-modal, dominios, git-config, db-wizard, ssh, php-config, netscheduler, ftp].

---

# Hospedagem

| Item | Valor | Print |
|---|---|---|
| Plano | Hospedagem I Linux | dashboard |
| Data de contratação | 28/12/2025 | dashboard |
| Sistema Operacional | Rocky Linux 8 | dashboard |
| IP compartilhado | 179.188.55.78 | dashboard, ssh |
| Diretório raiz | `/home/elafashionmkt1/` | dashboard, ftp |
| Domínio temporário | `elafashionmkt1.hospedagemdesites.ws` | dashboard |
| Domínios | 1/ilimitado | dashboard |
| Domínio principal | `elafashionmkt.com.br` — Ativo, Tipo: Apontamento | dominios |
| DNS | Apontamento Locaweb (**já configurado**, não pendente) | dashboard |
| Proteção WAF | Ativa | dashboard |
| Backup automático | Não ativado (botão "Ativar" disponível) | dashboard |
| Webmail | Disponível ("Acessar webmail") | dashboard |

---

# PHP

- **Versão atual:** 8.3 [dashboard, php-config].
- **Como alterar:** painel → Configurações → PHP → "Selecionar versão" →
  "Aplicar versão". Aviso do painel: aguardar 15 minutos após a troca
  para o servidor atualizar [php-config].
- **Extensões identificadas:** nenhuma lista de extensões (`php -m`) é
  exposta nessa tela do painel — só o número da versão.
  **Pendente de validação em ambiente** (precisa de SSH habilitado).
- **Observações:** o painel não mostra aqui nenhuma informação sobre
  Composer — ver seção "Git"/"Limitações".

---

# Banco de Dados

| Motor | Status no wizard | Print |
|---|---|---|
| MySQL Server | 0/10 utilizados no plano — disponível | db-wizard |
| PostgreSQL | **"Nenhum banco de dados disponível"** | db-wizard |
| Microsoft SQL Server | Listado como opção; nenhuma indicação textual de disponibilidade capturada no print | db-wizard |

- **Limites do plano:** até 10 bancos (contador "0/10" é do MySQL;
  não fica claro no print se o limite de 10 é compartilhado entre todos
  os motores ou por motor — **Pendente de validação em ambiente.**
- **Tecnologia escolhida pela arquitetura do projeto:**
  `ARQUITETURA_PRODUCAO.md` §2 decide PostgreSQL gerenciado — **ver
  divergência crítica abaixo.**
- **Observações:** nenhum banco foi criado nesta hospedagem até o
  momento do print.

---

# SSH

| Item | Valor | Print |
|---|---|---|
| Disponível | Sim | ssh |
| Status no momento do print | Desabilitado | ssh |
| Como habilitar | Botão "Habilitar" em Configurações → SSH | ssh |
| Duração da sessão | 3 horas | ssh |
| Renovação | Manual | ssh |
| Host/URL principal | `ftp.elafashionmkt.com.br` | ssh |
| URL alternativa | `ftp.elafashionmkt1.hospedagemdesites...` (truncado no print) | ssh |
| Usuário | `elafashionmkt1` | ssh |
| IP | 179.188.55.78 | ssh |
| **Porta** | **22** | ssh |
| Autenticação | Mesma senha do FTP ("Alterar senha FTP") — **confirmado: não há campo de chave pública/`authorized_keys` no painel** | ssh |

---

# FTP

| Item | Valor | Print |
|---|---|---|
| Disponível | Sim | ftp |
| Host | `ftp.elafashionmkt.com.br` | ftp |
| URL alternativa | `ftp.elafashionmkt1.hospedagemdesites.ws` | ftp |
| Usuário | `elafashionmkt1` | ftp |
| Pasta raiz | `/home/elafashionmkt1/` | ftp |
| **Porta** | **21** | ftp |
| Web FTP (gerenciador de arquivos via navegador) | **Existe** — "Acessar" (sem necessidade de cliente externo) | ftp |
| Cliente recomendado | FileZilla (link de download, produto de terceiros, não é ferramenta própria da Locaweb) | ftp |
| FTP multiusuário | **Não incluso** — upsell pago ("Contratar") | ftp |

(Senha não documentada, por instrução.)

---

# Git

- **Recurso do painel:** "Publicar via Git" (Configurações → Publicar via
  Git), única tecnologia listada: **GitHub** [git-config].
- **O que realmente faz:** gera um template de **GitHub Action que só
  faz upload FTP** — confirma o achado de `AUDITORIA_LOCAWEB.md` §4.2 de
  que não é Git real (sem execução de comando remoto, sem hook
  pós-deploy) [git-config].
- **Template exato gerado pelo painel:**
  ```yaml
  name: Deploy via ftp
  on: push
  jobs:
    deploy:
      name: Deploy
      runs-on: ubuntu-latest
      steps:
      - uses: actions/checkout@v2
      - name: FTP Deploy Locaweb
        uses: locaweb/ftp-deploy@1.0.0
        with:
          host: ${{ secrets.HOST }}
          user: ${{ secrets.USER }}
          password: ${{ secrets.PASS }}
          localDir: "dist"
  ```
  [git-config]
- **Parâmetros da action** [git-config]:

  | Parâmetro | Descrição | Obrigatório | Padrão |
  |---|---|---|---|
  | `host` | Host | Sim | N/A |
  | `user` | Usuário de FTP | Sim | N/A |
  | `password` | Senha | Sim | N/A |
  | `localDir` | Diretório do projeto a copiar | Não | `.` |
  | `remoteDir` | Diretório da hospedagem que recebe os arquivos (usar `web` se hospedagem Windows) | Não | `public_html` |
  | `forceSsl` | Forçar encriptação SSL | Não | `false` |
  | `options` | Opções adicionais do `lftp` | Não | `''` |

---

# GitHub Actions

- A única integração oficial oferecida pelo painel Locaweb para GitHub
  Actions é o gerador de template acima (upload FTP via
  `locaweb/ftp-deploy@1.0.0`) [git-config].
- Não há nos prints nenhuma evidência de suporte a deploy via SSH
  disparado pelo painel, API oficial de deploy, nem integração nativa
  além do FTP.
- O workflow já commitado no projeto
  (`.github/workflows/tear-v2-deploy.yml`, mecânica de `rsync`/SSH +
  `releases/`/symlink, decidida em `ADR-016`) **não usa** esse template
  nativo da Locaweb — é uma solução própria do projeto que usa o SSH
  manual do painel, não o "Publicar via Git".

---

# SSL

| Item | Valor | Print |
|---|---|---|
| Certificado SSL atual | Não possui / Inativo | dashboard, dominios, ssl-modal |
| Opção 1 | **SSL Locaweb** (produto próprio, rotulado "Recomendado", com painel de gestão e suporte 24/7) | ssl-modal |
| Opção 2 | **Let's Encrypt** — gratuito, "não possui painel para gestão" | ssl-modal |
| Endereço SSL compartilhado (fallback sem certificado próprio) | `https://elafashionmkt1.websiteseguro.com` | dashboard |
| DNS | Apontamento Locaweb já configurado | dashboard |

- **Procedimento de ativação:** botão "Emitir Let's Encrypt" direto no
  modal (gratuito) ou "Gerenciar SSL Locaweb" (produto pago recomendado
  pelo painel) [ssl-modal]. Como o DNS de `elafashionmkt.com.br` já está
  apontado (diferente do que `AUDITORIA_LOCAWEB.md` registrava para
  `estudioela.com`, que estava "DNS Pendente"), a emissão do Let's
  Encrypt não deveria estar bloqueada por DNS aqui — não confirmado por
  print se o clique em "Emitir Let's Encrypt" completa sem erro.
  **Pendente de validação em ambiente** (execução real do clique).

---

# Scheduler

- **Crontab nativo:** não aparece em nenhum dos 10 prints fornecidos —
  a confirmação de que existe vem só de `AUDITORIA_LOCAWEB.md` (não
  desta revisão). **Pendente de validação em ambiente/print.**
- **"Tarefas via HTTP" (Netscheduler):** **confirmado existir** — recurso
  próprio do painel Locaweb, "Realize requisições via HTTP de maneira
  agendada e repetitiva, sem intervenção manual." Nenhuma tarefa
  agendada no momento do print [netscheduler]. Isso responde a uma
  pergunta antes pendente: a Locaweb **tem**, sim, um agendador via HTTP
  nativo, além do crontab tradicional (se este último se confirmar).

---

# Recursos disponíveis

- PHP 8.3, configurável pelo painel [php-config]
- MySQL Server (0/10 usados) [db-wizard]
- SSH (com restrições — ver seção própria) [ssh]
- FTP (host, porta 21, 1 usuário) [ftp]
- Web FTP / gerenciador de arquivos via navegador [ftp]
- SSL Let's Encrypt gratuito (emissão) e SSL Locaweb pago [ssl-modal]
- Scheduler via HTTP (Netscheduler) [netscheduler]
- WAF ativa por padrão [dashboard]
- Webmail [dashboard]
- Domínios ilimitados (1 já em uso) [dashboard]
- "Publicar via Git" (na prática, deploy por FTP automatizado via GitHub
  Actions) [git-config]

# Recursos indisponíveis

- **PostgreSQL** — "Nenhum banco de dados disponível" no wizard, para
  esta hospedagem [db-wizard]. Ver divergência crítica abaixo.
- **FTP multiusuário** — upsell pago, não incluso [ftp]
- **SSH por chave pública** — só usuário/senha, sem campo de
  `authorized_keys` visível no painel [ssh]
- **Backup automático** — existe como recurso, mas não está ativado
  [dashboard]
- **Deploy remoto real via "Publicar via Git"** — o recurso existe, mas
  não executa comandos no servidor, só upload FTP [git-config]

---

# Limitações

- Hospedagem compartilhada (Hospedagem I Linux) — sem Docker, sem root,
  sem systemd (herdado de `AUDITORIA_LOCAWEB.md`, não fotografado
  diretamente, mas consistente com o painel de um plano de entrada).
- SSH temporário (3h, renovação manual) e só por senha — confirmado
  agora com porta (22) e mecanismo exatos [ssh].
- "Publicar via Git" não é deploy real — só FTP, sem hook remoto
  [git-config].
- FTP multiusuário é pago — só 1 usuário FTP/SSH hoje [ftp].
- **PostgreSQL indisponível** nesta hospedagem — ver divergência crítica.
- SSL não emitido ainda; produto recomendado pelo painel (SSL Locaweb) é
  pago — alternativa gratuita (Let's Encrypt) existe mas sem painel de
  gestão [ssl-modal].
- Backup nativo não ativado [dashboard].

---

# Informações pendentes de validação

- Extensões PHP (`php -m`) — não expostas nesta tela do painel.
- Se o limite "10 bancos" é total ou por motor de banco de dados.
- Disponibilidade real do Microsoft SQL Server (sem indicação textual
  capturada no print).
- Existência de crontab nativo (fora dos 10 prints desta revisão —
  só documentado anteriormente em `AUDITORIA_LOCAWEB.md`).
- Emissão efetiva do Let's Encrypt (clique não executado nesta
  auditoria).
- Quota de disco/CPU/processos simultâneos — não aparece em nenhum
  print.
- IP/CIDR do proxy reverso da Locaweb (`TRUSTED_PROXIES`) — não capturado.
- Host/porta do relay SMTP incluso — não capturado nesta rodada de
  prints.
- Se as mesmas condições (SSH, PHP, banco, FTP) se replicam
  identicamente quando o domínio canônico (`estudioela.com`) for
  configurado/migrado — nenhum print é dessa hospedagem/domínio.

---

# Divergências encontradas

## 1. PostgreSQL indisponível — diverge de `ARQUITETURA_PRODUCAO.md` e `AUDITORIA_LOCAWEB.md`

- **Print:** db-wizard mostra, para `elafashionmkt.com.br` (hospedagem
  agora confirmada como ambiente inicial real de deploy), a mensagem
  **"Nenhum banco de dados disponível"** para PostgreSQL.
- **`AUDITORIA_LOCAWEB.md` §1.1** afirma: *"Banco de dados | MySQL,
  PostgreSQL e MS SQL disponíveis; 0/10 bancos usados | PostgreSQL
  confirmado disponível"* — e descreve as duas hospedagens da conta como
  *"tecnicamente idênticas (mesmo plano, mesmo tier)"*.
- **`ARQUITETURA_PRODUCAO.md` §2** decide, como arquitetura aprovada e
  "definitiva": *"PostgreSQL gerenciado, oferecido pelo próprio plano
  Locaweb."*
- **Não vou decidir qual fonte está correta.** Isso é uma divergência
  direta entre o que o painel mostra agora (via print, para a
  hospedagem que será de fato usada no deploy inicial) e o que os dois
  documentos de arquitetura/auditoria registram. Se o print refletir a
  realidade, a decisão de `ARQUITETURA_PRODUCAO.md` §2 pode estar
  tecnicamente inviável na hospedagem `elafashionmkt.com.br` — precisa de
  decisão do responsável do projeto (mesma questão já levantada
  anteriormente nesta sessão sobre MySQL vs. PostgreSQL, agora com
  evidência de print em vez de só uma instrução verbal).

## 2. DNS já apontado — diverge do estado documentado para o domínio-alvo anterior

- **Print (dashboard, dominios):** `elafashionmkt.com.br` já está com
  "DNS: Apontamento Locaweb" e "Ativo" — **não está pendente.**
- **`AUDITORIA_LOCAWEB.md` §1.2** registrava DNS **pendente** — mas para
  `estudioela.com`, não para `elafashionmkt.com.br`. Não é uma
  divergência real (são domínios diferentes), mas é uma boa notícia
  relevante: o ambiente inicial já tem DNS resolvido, o que elimina a
  etapa de espera de propagação de DNS do caminho crítico do primeiro
  deploy.

## 3. Nenhum print da hospedagem `estudioela.com`

- Todos os 10 prints fornecidos são exclusivamente de
  `elafashionmkt.com.br`. Nenhuma informação nova foi obtida sobre
  `estudioela.com` nesta revisão — tudo que se sabe sobre ela continua
  vindo só de `AUDITORIA_LOCAWEB.md` (não recapturado por print).

---

# Conclusão desta revisão

## Capacidades confirmadas (por print, nesta revisão)

PHP 8.3 ativo; MySQL disponível (0/10); SSH existente (desabilitado por
padrão, 3h, senha, porta 22); FTP existente (porta 21, host/usuário
confirmados); Web FTP (gerenciador via navegador) existente; "Publicar
via Git" = upload FTP via GitHub Actions (template exato capturado);
Scheduler via HTTP (Netscheduler) existente; SSL não emitido, com duas
opções (Let's Encrypt grátis, SSL Locaweb pago); WAF ativa; DNS de
`elafashionmkt.com.br` já apontado.

## Pendentes

Extensões PHP; limite real de bancos (total vs. por motor);
disponibilidade de MS SQL; existência de crontab nativo (não capturado
nesta rodada); emissão efetiva de SSL; quota de disco/CPU; IP do proxy
reverso; host/porta SMTP; réplica das mesmas configurações quando
`estudioela.com` for migrado.

## A infraestrutura está apta para iniciar o deploy do TEAR?

Separando o que os prints comprovam (fato) do que depende de decisão do
responsável do projeto (arquitetura):

**Fatos observados na infraestrutura (`elafashionmkt.com.br`), por
print:**
- MySQL está disponível (0/10 usados).
- PostgreSQL não aparece disponível no wizard de bancos de dados desta
  hospedagem, no momento do print.
- SSH, FTP, Web FTP, "Publicar via Git" (upload FTP via GitHub Actions),
  Scheduler HTTP (Netscheduler), SSL (Let's Encrypt/SSL Locaweb) e DNS
  estão todos confirmados como existentes e compatíveis.

**Decisão de arquitetura que ainda depende do responsável do projeto:**
- `ARQUITETURA_PRODUCAO.md` §2 elegeu PostgreSQL gerenciado como banco
  de produção — isso é uma escolha de arquitetura do projeto, não uma
  limitação absoluta da infraestrutura. O fato de o wizard não listar
  PostgreSQL como disponível nesta hospedagem não prova, por si só, que
  o motor é tecnicamente impossível ali (pode ser necessário habilitar
  via suporte, por exemplo) — só prova que hoje, nesta tela, ele não
  aparece disponível.
- Cabe ao responsável do projeto decidir o próximo passo: investigar
  com o suporte Locaweb a disponibilidade de PostgreSQL nesta
  hospedagem, ou revisar a decisão de arquitetura para MySQL (motor já
  confirmado disponível).

Nenhum dos recursos restantes (SSH, FTP, Git/deploy, scheduler, SSL,
DNS) impõe impedimento — todos estão confirmados como compatíveis.
