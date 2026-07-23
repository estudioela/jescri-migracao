# VALIDACAO_AMBIENTE_REAL.md — Validação Técnica do Ambiente Real (FASE 1)

- **Papel:** validação técnica read-only do ambiente de hospedagem antes
  de qualquer tentativa de deploy do TEAR.
- **Data:** 2026-07-23.
- **Escopo desta rodada:** validação feita **de fora** (rede, DNS, portas
  TCP), a partir do ambiente de execução do agente — **sem acesso a
  shell/SSH autenticado no host** (motivo: ver "Bloqueador crítico"
  abaixo). Nenhum arquivo do projeto foi alterado, nenhum commit foi
  feito, nenhuma migration/config foi executada.
- **Relação com documentos anteriores:** `docs/deployment/LOCAWEB.md` e
  `docs/deployment/AUDITORIA_LOCAWEB.md` documentam o que o **painel**
  Locaweb mostra (via prints). Este documento valida o que é **observável
  pela rede, agora**, e aponta onde diverge do que os prints registravam.

---

## Bloqueador crítico — sem acesso a shell autenticado

Não foi possível executar nenhum comando dentro do host (`php -v`,
`composer --version`, `artisan`, `php -m`, `df -h`, etc.) porque:

- SSH exige autenticação por **senha ou chave pública** — confirmado
  agora por probe direto (ver seção SSH abaixo). Este agente não possui
  a senha (por instrução explícita do projeto, a senha nunca é
  documentada) nem uma chave pública cadastrada no painel (o painel não
  expõe campo de `authorized_keys`, conforme `LOCAWEB.md`).
- Não há variável de ambiente, `.netrc` ou GitHub Secret acessível a
  este agente com credenciais da Locaweb.

**Toda a seção "Validado" abaixo é limitada a evidência de rede
(DNS, TCP, headers HTTP).** As seções "PHP", "Composer", "Laravel",
"Banco (drivers internos)", "Extensões obrigatórias" e "Diretórios"
pedidas na missão **permanecem pendentes** — dependem de alguém com a
senha (ou chave) abrir uma sessão SSH e rodar os comandos, ou repassar
os prints do painel (como já feito em `AUDITORIA_LOCAWEB.md`/
`LOCAWEB.md`).

---

## 1. Sistema — o que foi possível confirmar

| Item | Valor | Como confirmado |
|---|---|---|
| SO do host Locaweb | Rocky Linux 8 | doc-confirmed (`LOCAWEB.md`, print do painel — não reconfirmado por SSH nesta rodada) |
| Hostname/usuário/HOME/diretório atual do agente | N/A | Este agente roda em ambiente de execução próprio (worktree local), não dentro do host Locaweb — não é o que a missão quer descobrir, e descobrir isso aqui não valida o ambiente de destino |
| Servidor web em frente ao host | `nginx/1.22.1` | code-confirmed agora (`curl -I` nos dois domínios temporários, ver §5) |

---

## 2. PHP

**Pendente de validação em ambiente** (precisa de shell autenticado).

- Versão relatada pelo painel: 8.3 [doc-confirmed, `LOCAWEB.md`/
  `AUDITORIA_LOCAWEB.md`, não reconfirmado por `php -v` nesta rodada].
- `php.ini` carregado, extensões (`php -m`), `memory_limit`,
  `upload_max_filesize`, `post_max_size`, `max_execution_time`: nenhum
  desses é exposto pelo painel nem por nenhuma sonda de rede possível
  sem shell. **Pendente.**

---

## 3. Composer

**Doc-confirmed, não reconfirmado nesta rodada:** `AUDITORIA_LOCAWEB.md`
§2.1 registra que uma auditoria anterior (via SSH) já confirmou Composer
**ausente globalmente** no host (Rocky Linux 8.10, PHP 8.4.22 —
observação: essa combinação de versão de PHP diverge do "8.3" relatado
no painel/`LOCAWEB.md`; não foi possível esclarecer a divergência sem
shell). Por `ADR-016`, isso deixou de ser bloqueio: `composer install`
roda no runner do CI, nunca no host.

---

## 4. Laravel

**Pendente de validação em ambiente** — depende de shell autenticado
para rodar `artisan` no host (e nem se aplica diretamente: por
`ADR-016`, o app não é executado via `artisan` diretamente no host para
build/instalação; o deploy é `rsync` de artefato já buildado no CI).

---

## 5. Rede, DNS e portas — validado agora (code-confirmed)

### 5.1 `elafashionmkt.com.br` (ambiente inicial de deploy documentado)

| Item | Resultado |
|---|---|
| `dig elafashionmkt.com.br A` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` — **IPs do GitHub Pages**, não do IP Locaweb (`179.188.55.78`) |
| `dig www.elafashionmkt.com.br` | `CNAME estudioela.github.io` + mesmos IPs GitHub Pages |
| `dig NS elafashionmkt.com.br` | `ns1/ns2/ns3.locaweb.com.br` (nameservers **são** da Locaweb) |
| `dig ftp.elafashionmkt.com.br` | **sem resposta** (subdomínio não resolve publicamente) |
| `curl -I https://elafashionmkt.com.br` | `301` → `https://www.elafashionmkt.com.br/`, header `server: GitHub.com`, `via: varnish`, `x-fastly-request-id` presente |
| `dig elafashionmkt1.hospedagemdesites.ws` (domínio temporário Locaweb) | `179.188.55.78` — resolve normalmente para o IP da hospedagem |
| `nc` no IP Locaweb `179.188.55.78:22/21/80` | Todas as 3 portas **respondem** (conexão TCP aceita) |
| Probe SSH (`ssh` sem credenciais) em `179.188.55.78` como `elafashionmkt1` | Servidor responde `Permission denied (publickey,password)` — **serviço SSH está ativo e aceitando tentativas agora**, oferece os dois métodos |

### 5.2 `estudioela.com` (domínio canônico planejado do TEAR)

| Item | Resultado |
|---|---|
| `dig estudioela.com A` | `185.199.108-111.153` — também IPs GitHub Pages |
| `dig portal.estudioela.com` | sem resposta (subdomínio não existe/não resolve) |
| `dig NS estudioela.com` | `ns1/ns2/ns3.wordpress.com` — **NS ainda é do WordPress.com**, não da Locaweb |
| `nc` no IP Locaweb `191.252.83.211:22/21` | Ambas as portas respondem |

### 5.3 Headers HTTP nos domínios temporários Locaweb

`elafashionmkt1.hospedagemdesites.ws` e `estudioela1.hospedagemdesites.ws`
retornam ambos `HTTP/1.1 403 Forbidden`, `Server: nginx/1.22.1` — sem
`index` publicado em `public_html` de nenhuma das duas hospedagens
(consistente com "nenhum deploy feito ainda").

---

## 6. Divergência crítica encontrada nesta rodada

**O domínio `elafashionmkt.com.br` NÃO está apontando para a
infraestrutura Locaweb agora** — está servindo via GitHub Pages
(`estudioela.github.io`), apesar de:

- `LOCAWEB.md` (revisão de hoje, 2026-07-23, baseada em prints do
  painel capturados entre 13:42–13:44) afirmar "DNS: Apontamento
  Locaweb (já configurado, não pendente)" para este domínio.
- Os nameservers do domínio (`ns1-3.locaweb.com.br`) **serem** da
  Locaweb — ou seja, a zona DNS é gerenciada pela Locaweb, mas o
  registro A/CNAME dentro dessa zona aponta para fora (GitHub Pages),
  não para o IP de hospedagem compartilhada (`179.188.55.78`).

Duas leituras possíveis, **não é possível decidir qual é a correta sem
informação do responsável do projeto**:

1. O apontamento mudou entre a captura dos prints (13:42–13:44 de hoje)
   e o momento desta validação (mais tarde no mesmo dia) — alguém
   redirecionou a zona DNS para o GitHub Pages depois dos prints.
2. O print do painel mostra o *status configurado na Locaweb* (que
   nameservers apontam para lá), mas não necessariamente reflete o
   registro A/CNAME real dentro da zona — os dois podem estar
   dessincronizados por natureza (o painel mostraria "apontamento
   ativo" só pelo NS estar correto, sem validar o conteúdo do registro).

**Impacto:** se o objetivo é fazer o primeiro deploy/homologação do
TEAR em `elafashionmkt.com.br` como documentado em `LOCAWEB.md`, o
tráfego real desse domínio **não chega ao host Locaweb hoje** — chega a
um site diferente hospedado no GitHub Pages. O host Locaweb
(`179.188.55.78`) está de pé e acessível (SSH/FTP/HTTP respondem), só
não é o destino do domínio público agora.

O host Locaweb segue acessível diretamente pelo domínio temporário
(`elafashionmkt1.hospedagemdesites.ws` → `179.188.55.78`) — um deploy
de homologação pode ser testado por esse caminho sem depender do DNS
do domínio principal.

---

## 7. Recursos disponíveis (confirmados nesta rodada, evidência de rede)

- Host Locaweb de `elafashionmkt.com.br` está no ar: portas 22 (SSH), 21
  (FTP) e 80 (HTTP) respondem no IP `179.188.55.78`.
- Host Locaweb de `estudioela.com` também está no ar: portas 22 e 21
  respondem no IP `191.252.83.211`.
- SSH em ambos os hosts está **ativo agora** (aceita tentativa de
  autenticação, não recusa a conexão) — diferente do estado
  "Desabilitado" registrado no print de `LOCAWEB.md` §SSH; pode ter sido
  habilitado manualmente depois daquele print (a janela é de 3h).
- Nameservers de `elafashionmkt.com.br` confirmados como Locaweb.
- Domínios temporários de ambas as hospedagens resolvem e respondem
  (nginx 403, sem conteúdo publicado).

## 8. Recursos ausentes / não confirmáveis nesta rodada

- Nenhuma informação de shell interno (PHP, extensões, Composer,
  Laravel/artisan, drivers de banco, diretórios internos, permissões,
  symlinks) — **bloqueada pela falta de credenciais SSH**, não por
  limitação técnica do host.
- Nenhuma confirmação de que `portal.estudioela.com` existe como
  subdomínio (não resolve).
- Nenhuma confirmação de quota de disco/CPU/processos — mesma causa.

---

## 9. Riscos

1. **Crítico — domínio principal não aponta para o host de destino.**
   `elafashionmkt.com.br` serve conteúdo de terceiro (GitHub Pages), não
   do host Locaweb. Precisa de decisão humana: corrigir DNS antes do
   deploy, ou confirmar que o deploy vai usar o domínio
   temporário/`estudioela.com` em vez deste.
2. **Alto — impossibilidade de validação profunda sem credenciais.**
   Toda a validação de PHP/Composer/Laravel/banco pedida pela missão
   depende de alguém com a senha da Locaweb abrir a sessão SSH (painel)
   e repassar a saída dos comandos, ou autorizar este agente com uma
   credencial temporária.
3. **Médio — SSH ativo, mas por senha/tempo limitado.** Confirmado
   agora que o serviço aceita conexão; consistente com o risco já
   registrado em `AUDITORIA_LOCAWEB.md` §4.1 (janela de 3h, sem chave
   pública).
4. **Baixo — `estudioela.com` com NS ainda em WordPress.com.** Consistente
   com o que já era esperado (`AUDITORIA_LOCAWEB.md` §1.2, "DNS
   Pendente"); confirma que a migração de DNS para a Locaweb ainda não
   aconteceu para este domínio.

---

## 10. Recomendações

1. **Não prosseguir para deploy real em `elafashionmkt.com.br` sem
   antes confirmar com o responsável do projeto** se a divergência de
   DNS (§6) é intencional ou um apontamento que precisa ser corrigido —
   isso é bloqueador de negócio, não técnico, e esta é exatamente a
   categoria de decisão que exige parar e perguntar (regra de negócio
   inédita / conflito insolúvel entre requisitos).
2. Para validar PHP/Composer/Laravel/extensões/diretórios/banco
   internamente, alguém precisa: habilitar o SSH no painel (se já não
   estiver — evidência de rede sugere que **está** ativo agora) e
   fornecer a este agente (ou executar e colar) a saída de:
   `php -v`, `php --ini`, `php -m`, `php -i | grep -E
   "memory_limit|upload_max_filesize|post_max_size|max_execution_time"`,
   `which composer`, `composer --version`, `ls -la
   /home/elafashionmkt1/`, `df -h`.
3. Testar o deploy de homologação usando o domínio temporário
   (`elafashionmkt1.hospedagemdesites.ws`) enquanto a divergência de DNS
   do domínio principal não é resolvida — evita bloquear a Etapa de
   homologação por causa do problema de DNS.
4. Não há necessidade de reconfirmar `AUDITORIA_LOCAWEB.md`/
   `LOCAWEB.md` quanto ao que já foi capturado por print — este
   documento é complementar (evidência de rede), não substitui a
   auditoria via painel.

---

## Conclusão

- **Ambiente reprovado para deploy imediato**, por dois bloqueadores
  independentes:
  1. Divergência crítica de DNS em `elafashionmkt.com.br` (§6) — decisão
     do responsável do projeto necessária antes de prosseguir.
  2. Impossibilidade de completar a validação técnica interna (PHP,
     Composer, Laravel, banco, extensões, diretórios) por falta de
     credenciais SSH neste ambiente de execução (§1–§4, §8).
- O host de hospedagem em si está no ar e acessível (rede/portas
  confirmadas, §5, §7) — o reprovado é a *validação completa* e o
  *apontamento do domínio*, não a existência da infraestrutura.
