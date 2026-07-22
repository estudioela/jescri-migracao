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
| Papel no negócio | Site/agência (marca "ELÃ MKT") | Domínio do produto TEAR (`influencia.estudioela.com`) |
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
  hospedagens ativas no painel técnico. **Pendência administrativa:**
  confirmar com o suporte/faturamento da Locaweb se `estudioela.com` está
  de fato coberto por essa mesma assinatura (bundle) ou se há uma cobrança
  separada não exibida nessa tela — não é bloqueio técnico, é só uma
  divergência entre painel técnico e painel de faturamento que vale
  esclarecer antes do go-live para não haver surpresa de cobrança.

---

## 2. Compatibilidade com o TEAR (`ARQUITETURA_PRODUCAO.md`)

| Requisito da arquitetura | Status | Motivo |
|---|---|---|
| PHP 8.3 | ✅ Totalmente compatível | Já é a versão ativa nas duas hospedagens |
| PostgreSQL gerenciado | ✅ Totalmente compatível | Disponível para criação, até 10 bancos |
| SSH para deploy | ⚠️ Parcialmente compatível | Existe, mas desabilitado por padrão, expira em 3h, renovação manual, autenticação por senha (não por chave) — incompatível com deploy 100% automatizado sem intervenção humana a cada execução |
| Deploy via Git (GitHub Actions) | ⚠️ Parcialmente compatível | O recurso "Publicar via Git" do painel é só um template de FTP upload (`locaweb/ftp-deploy`), não executa comandos remotos. A estratégia de `ARQUITETURA_PRODUCAO.md` §3 (symlink swap + `composer install`/`migrate` remotos via SSH) **não pode ser feita por esse recurso** — só via SSH manual/scriptado, sujeito à limitação acima |
| Crontab (`schedule:run`, `queue:work`, backup) | ✅ Totalmente compatível | Nativo, sem uso ainda |
| Storage local (disco) | ⚠️ A confirmar | Painel não expõe quota em GB; sem SSH habilitado não dá para checar `df -h` |
| Google Drive (upload de Material) | ✅ Totalmente compatível | Não depende da Locaweb, é integração externa via Service Account |
| SMTP incluso no plano | ⚠️ A confirmar | Seção de e-mail existe no painel ("Email Locaweb"), mas não foi possível localizar host/porta do relay SMTP nesta auditoria — ver §3 |
| SSL gratuito (Let's Encrypt) | ✅ Totalmente compatível | Confirmado no painel, mas emissão para `estudioela.com` está bloqueada até o DNS ser apontado |
| Domínio `influencia.estudioela.com` | ⚠️ Parcialmente compatível | Hospedagem correta existe, mas domínio pai (`estudioela.com`) ainda não tem DNS apontado nem subdomínio criado |
| WAF (proteção de borda) | ⚠️ A validar em execução | Ativa por padrão — pode gerar falso positivo em upload de Material ou em rotas de API/Sanctum; precisa ser testado após o primeiro deploy |

**Conclusão de compatibilidade:** a infraestrutura contratada é
**adequada para o TEAR sem custo adicional**, como já assumido em
`ARQUITETURA_PRODUCAO.md`. Os dois pontos que exigem adaptação de
*workflow* (não de plano/dinheiro) são o SSH temporário/por senha e o
"Git" que na verdade é FTP — ambos afetam a estratégia de deploy descrita
em `ARQUITETURA_PRODUCAO.md` §3 e precisam de uma decisão de arquitetura
(ver §5).

---

## 3. O que ainda precisa ser criado/decidido

- [ ] Banco de dados PostgreSQL de produção (não criado — Etapa 3 do
      `PLANO_DE_IMPLANTACAO.md`)
- [ ] Apontamento de DNS de `estudioela.com` para a Locaweb (Etapa 4)
- [ ] Subdomínio `influencia.estudioela.com` dentro da hospedagem
      `estudioela.com`
- [ ] Certificado SSL (Let's Encrypt) para o subdomínio — só depois do DNS
- [ ] Habilitar SSH (ação manual no painel, válida por 3h — decidir se o
      fluxo de deploy vai depender de habilitação manual a cada release ou
      se será feito só para deploys pontuais + tarefas administrativas)
- [ ] Confirmar disponibilidade de Composer via SSH (`which composer`) —
      só possível com SSH habilitado
- [ ] Confirmar quota de disco (`df -h` via SSH, ou perguntar ao suporte)
- [ ] Confirmar host/porta do relay SMTP incluso no plano (seção "Email
      Locaweb" do painel, ou suporte)
- [ ] Decidir estratégia real de deploy dado que "Publicar via Git" é só
      FTP: (a) manter SSH manual scriptado por release, (b) usar o
      FTP-deploy nativo só para os assets estáticos e rodar
      `migrate`/`cache` manualmente via SSH quando necessário, ou (c)
      outra abordagem — decisão de arquitetura, não desta auditoria
- [ ] Esclarecer com o suporte/faturamento da Locaweb por que
      `estudioela.com` não aparece como linha separada em "Alterar Planos"
- [ ] Variáveis de ambiente reais (`.env` de produção) — dependem dos
      itens acima
- [ ] GitHub Secrets para deploy (host/usuário/senha FTP e/ou credenciais
      SSH) — só depois da decisão de estratégia de deploy
- [ ] Ativar backup (hoje "Ativar", não habilitado) nas duas hospedagens
- [ ] Chave de Service Account do Google Drive no `.env` — fora do escopo
      Locaweb

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
localmente/CI e subir o `vendor/` pronto — mitigação segue válida e
provavelmente necessária dado que não há confirmação ainda de que
`composer install --no-dev` completo rode dentro dos limites do plano de
entrada.

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

### 4.6 Divergência painel técnico × faturamento
`estudioela.com` existe e funciona no painel técnico, mas não aparece como
linha de cobrança separada em "Alterar Planos" — zero risco técnico
imediato, mas pode indicar cobrança agrupada, desconto, ou erro de
exibição que vale esclarecer com o suporte antes do go-live.

---

## 5. Checklist de decisão

| # | Decisão necessária | Quem decide |
|---|---|---|
| 1 | Estratégia de deploy dado que "Git" = FTP-only (SSH manual por release vs. FTP + SSH pontual vs. outra) | Responsável do projeto (decisão de arquitetura, pode exigir novo ADR) |
| 2 | Se o fluxo de deploy vai depender de habilitar SSH manualmente a cada release, ou só para manutenção pontual | Responsável do projeto |
| 3 | Esclarecer com a Locaweb a cobertura de faturamento de `estudioela.com` | Responsável do projeto (contato com suporte Locaweb) |
| 4 | Ativar ou não o backup nativo da Locaweb como camada extra | Responsável do projeto |

**Nenhuma dessas decisões bloqueia o restante da Etapa 2** (SSH, Composer,
Postgres — itens de validação técnica). Elas bloqueiam especificamente a
Etapa 6 (estratégia de deploy) do `PLANO_DE_IMPLANTACAO.md` e podem exigir
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
a automação de deploy planejada em `ARQUITETURA_PRODUCAO.md` §3 precisa
ser ajustada para lidar com SSH temporário/por senha — isso é decisão de
arquitetura de deploy, não motivo para trocar de hospedagem ou pagar mais.

**Próximo passo recomendado:** seguir a Etapa 2 do
`PLANO_DE_IMPLANTACAO.md` habilitando o SSH (ação do responsável do
projeto no painel) para validar Composer, quota de disco e conexão ao
Postgres — e, em paralelo, decidir a estratégia de deploy (checklist §5,
item 1) antes de chegar à Etapa 6.
