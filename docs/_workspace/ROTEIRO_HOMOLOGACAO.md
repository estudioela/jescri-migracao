# Roteiro de Homologação Manual — Portal TEAR V2

FASE 7 pós-SPECs. Documento de apoio operacional para um **humano** validar,
clicando na Web App publicada e na planilha, que cada fluxo principal
funciona de ponta a ponta antes de operar com Parceiras reais. Não é um
teste automatizado, não substitui a suíte (`npm run check`) nem o
`docs/_workspace/DEPLOY_CHECKLIST.md` (pré-deploy).

**Base de construção:** `docs/_workspace/TASK_ROUTER.md` §3 (lista de SPECs
`[x]` concluídas), as seções "Casos de Uso"/§17 "Tratamento de Erros" de cada
`docs/specs/SPEC-NNN.md` correspondente, `src/entrypoint/Portal.js`
(`doGet` — parâmetros `?pagina=` aceitos, e as funções expostas a
`google.script.run`), as telas de `src/ui/*.html` e
`docs/_workspace/DEPLOY_CHECKLIST.md` (nomes exatos de aba/coluna).

> **Correção (2026-07-18):** esta seção listava SPEC-020/030/034 e a
> Importação Inicial da Base como "pendentes, não homologáveis por não
> existirem" — desatualizado. As quatro estão `[x]` Implementadas desde
> 2026-07-17 (`TASK_ROUTER.md` §3): SPEC-003 (Importação Inicial),
> SPEC-020 (Gestão de Pagamentos), SPEC-030 (Financeiro e Histórico no
> Portal), SPEC-034 (Arquivamento Geral Manual). Este roteiro ainda não
> cobre os fluxos dessas 4 SPECs nem as telas novas (`pagamentos.html`,
> `documentos.html`, `admin.html`, `dashboard.html`, `financeiro.html`) —
> pendência de ampliação deste documento, não bloqueia a homologação do
> login (Jornada 3, Passo 3.1) que é o foco atual.

---

## 0. Antes de começar

- **URL da Web App:** obter em Apps Script Editor → *Implantar* → *Gerenciar
  implantações* (ou `clasp deployments`), a implantação ativa marcada como
  Web App.
- **Acesso à Web App** (correção 2026-07-18 — esta seção estava
  desatualizada): `appsscript.json` tem `"executeAs": "USER_DEPLOYING",
  "access": "ANYONE"` desde 2026-07-17 (`TASK_ROUTER.md` §8) — qualquer
  pessoa com conta Google (não precisa ser a conta que fez o deploy) pode
  abrir a URL; o Google exige escolher/logar numa conta Google só para
  passar do próprio gate de acesso do Apps Script, **antes** de chegar ao
  código do Portal (`ANYONE`, não `ANYONE_ANONYMOUS`) — confirmado por
  requisição direta ao `/exec` sem sessão, que redireciona para
  `accounts.google.com`. Login efetivo no Portal continua exigindo o fluxo
  OAuth federado (SPEC-035/ADR-013) depois desse gate.
- **Acesso de edição à planilha "Portal Ela"** (ADR-010), com as 8 abas
  físicas e cabeçalhos exatos já provisionados (`BASE DE DADOS`,
  `COLABORACOES`, `BRIEFING`, `ENTREGAS`, `ENVIOS`, `DOCUMENTOS`, `SESSOES`,
  `BLOQUEIOS` — lista completa de colunas em `DEPLOY_CHECKLIST.md` §1).
- Navegação entre as telas do Portal da Parceira é feita **trocando o
  parâmetro `?pagina=` na URL** (o próprio app troca sozinho após
  login/logout/links internos); as telas internas da equipe também são
  acessadas assim.
- Convenção de nomes usada abaixo: `INFLU_KEY` é o identificador da Parceira
  na planilha (= o texto digitado no cadastro); `parceiraId` nas telas é
  sempre esse mesmo valor.

---

## Jornada 1 — Equipe: Cadastro e Compilação do Mês

### Passo 1.1 — Cadastrar uma Parceira nova
- **Onde:** URL da Web App sem parâmetro (`?pagina` ausente) → tela
  "TEAR — Cadastro de Parceira".
- **Ação:** preencher o único campo do formulário, "Nome da Parceira" (ex.:
  `Parceira Teste Homologação`), clicar **Cadastrar**.
- **Resultado esperado:** mensagem `Parceira "Parceira Teste Homologação"
  cadastrada como Inativa.`; formulário limpa e volta o foco ao campo nome.
- **Verificar na planilha:** aba `BASE DE DADOS` ganha uma linha nova com
  `INFLU_KEY` = nome digitado e `STATUS = OFF`. Todos os outros campos
  (CUPOM, CNPJ, endereço, valor, quantidades) nascem vazios — o cadastro só
  aceita nome (RF-001/RN-01, SPEC-001); não há campo de CEP nesta tela.

### Passo 1.2 — Ativar manualmente a Parceira (limitação registrada, não é bug)
- **Nota explícita (achado FASE 2, TASK_ROUTER §3 SPEC-002):** não existe
  tela para isso. `Parceira.ativar()`/`.inativar()` e os erros GP-01/02/03
  estão descritos na SPEC-002 mas **sem nenhum Service/Controller/UI que os
  exponha**. A única forma hoje é editar a planilha diretamente.
- **Ação (na planilha, não na Web App):** abrir a aba `BASE DE DADOS`,
  localizar a linha pelo `INFLU_KEY` cadastrado no Passo 1.1, editar a
  célula da coluna `STATUS` de `OFF` para `ON`.
- **Preencher também nesta etapa** (necessário para os próximos passos —
  sem isso a compilação e o login falham, e isso **não é bug do sistema**):
  - `CUPOM` — identificador de login (ex.: `PARCEIRATESTE`).
  - `INFLUENCIADORA_CNPJ` — pelo menos 5 dígitos numéricos (ex.:
    `12.345.678/0001-99`); os **5 primeiros dígitos** (`12345`) serão a
    senha do Portal (RN-16, adaptador legado provisório).
  - `VALOR_TOTAL` — número puro (ex.: `1000`). **Se ficar vazio ou não
    numérico, a compilação do mês falha para TODAS as Parceiras Ativas**
    com erro `VALOR_TOTAL inválido em 'BASE DE DADOS'...` — não é um erro
    isolado desta Parceira.
  - Pelo menos um entregável contratado, ex. `REELS_TEXTO = 2 reels` (senão
    a Parceira compila sem nenhum bloco de Briefing/Entrega/Envio e as
    Jornadas 2 e 3 não têm o que mostrar).
  - Opcional, para testar o Perfil na Jornada 3: `EMAIL`, `CHAVE_PIX`, `CEP`.
- **Resultado esperado:** a Parceira passa a ser lida como `Ativa` por todo
  módulo que consulta `STATUS` (compilação SPEC-005, documentos SPEC-023).

### Passo 1.3 — Compilar o mês
- **Onde:** `?pagina=compilar-mes`.
- **Ação:** preencher "Competência (MesReferencia)" com o mês corrente (ex.
  `2026-07`, seletor de mês) e clicar **Compilar Mês**.
- **Resultado esperado:** mensagem `Competência 2026-07 compilada: N
  colaboração(ões).` e lista com `parceiraId — estado — R$ valor`.
- **Verificar na planilha:** `COLABORACOES` ganha uma linha por Parceira
  Ativa; `BRIEFING` e `ENTREGAS` ganham um bloco/linha por formato
  contratado; `ENVIOS` ganha uma linha por Parceira — efeito colateral do
  evento `MesCompilado` (cablagem feita na composição do Entrypoint).
- **Caso de borda (CM-01/RN-09):** repetir a compilação da **mesma**
  competência → mensagem `... já estava compilada (idempotente).`, sem
  nenhum efeito colateral novo (nenhuma linha duplicada).

---

## Jornada 2 — Equipe: Briefing, Entrega, Envio, Documentos

### Passo 2.1 — Preencher e publicar Briefing
- **Onde:** `?pagina=briefing`.
- **Ação:** preencher "Competência (AAAA-MM)" e "Parceira" (o `INFLU_KEY`
  exato) e clicar **Carregar briefing**. Devem aparecer os blocos criados
  na compilação (um `fieldset` por formato contratado, ex. "Reels").
  Preencher, em cada bloco: Look/peça, Data de entrega, Data de postagem,
  Orientação criativa. Clicar **Publicar briefing**.
- **Resultado esperado:** mensagem `Briefing publicado.`; cada bloco mostra
  "Aprovação interna (derivada)" calculada (RN-01 SPEC-009: 7 dias antes da
  postagem; se cair sexta → +3 dias, sábado → +2, domingo → +1).
- **Erro esperado (equivalente a BR-01):** se a competência/Parceira não
  tiver Colaboração compilada, a tela mostra `Briefing inexistente para a
  competência — compile o mês primeiro.`

### Passo 2.2 — Listar Entregas e simular envio de material pela equipe
- **Onde:** `?pagina=entrega`.
- **Ação:** preencher Competência (e, opcional, Parceira), clicar **Listar
  entregas**. Numa Entrega em estado `AguardandoMaterial`, preencher "Link
  do material" (URL) e clicar **Enviar material**.
- **Resultado esperado:** estado muda para `EmRevisao`; mensagem `Material
  enviado — Entrega em revisão.`
- **Ação seguinte:** clicar **Aprovar** (só aparece em `EmRevisao`) → estado
  `Aprovado`; depois **Publicar** → estado terminal, `Arquivada em: <data>`.
- **Pode pular este passo** e simular o envio pela própria Parceira na
  Jornada 3 (Passo 3.3, UC-027.03) — os dois caminhos levam ao mesmo estado
  `EmRevisao`.

### Passo 2.3 — Confirmar endereço e registrar rastreio de Envio
- **Onde:** `?pagina=envio`.
- **Ação:** preencher Competência + Parceira, clicar **Listar envios**.
  Clicar **Confirmar endereço**.
- **Resultado esperado:** aparece a seção "Endereço para envio manual" com o
  texto de confirmação (endereço + PIX cadastrados, D-03 SPEC-016); a
  revisão passa de `AguardandoConfirmacao` para `Confirmado`.
- **Ação:** preencher "Código de rastreio" e clicar **Registrar rastreio**.
- **Resultado esperado:** jornada passa `Pendente → Expedido`; campo
  "Envio" preenche a data de hoje automaticamente se estava vazio (RN-02).
- **Ação:** clicar **Atualizar status** (só aparece em `Expedido`).
- **Resultado esperado hoje:** o adaptador de rastreio é manual/fake e
  **sempre devolve "não entregue"** — o status **não** muda para `Entregue`
  nesta homologação. Isso é o comportamento documentado (SPEC-016 D-02,
  adaptador manual provisório), **não é bug**.

### Passo 2.4 — Gerar Contrato/Briefing formal (sem tela — SPEC-023)
- **Nota:** não existe UI para isso; é chamado só via `google.script.run`
  direto. Duas formas práticas de testar:
  1. **Apps Script Editor:** abrir o projeto, escrever/rodar uma função de
     teste temporária que chama `gerarContrato({parceiraId: 'INFLU_KEY'})`
     ou `gerarBriefingFormal({parceiraId: 'INFLU_KEY', mesReferencia:
     '2026-07'})`, e ler o resultado em *Ver registros de execução*.
  2. **Console do navegador:** com qualquer tela do Portal aberta, abrir o
     DevTools e rodar
     `google.script.run.withSuccessHandler(console.log).gerarContrato({parceiraId:'INFLU_KEY'})`.
- **Pré-condição gerarContrato (RN-01 SPEC-023):** Parceira precisa estar
  `Ativa` (`STATUS = ON`).
- **Pré-condição gerarBriefingFormal (RN-02 SPEC-023):** Parceira precisa
  estar sinalizada — editar manualmente a coluna `SIM/NÃO` da `BASE DE
  DADOS` para `SIM` antes de testar.
- **Resultado esperado:** envelope `{success:true, data:{...}}`; nova linha
  na aba `DOCUMENTOS` (`INFLU_KEY`, `TIPO_DOCUMENTO`, `MES_REFERENCIA`,
  `REFERENCIA` — referência opaca, sem PII na aba).
- **Erros esperados:** `parceiraId` inexistente → `DC-01`; dados de
  mesclagem ausentes → `DC-02`.

---

## Jornada 3 — Parceira: Portal completo

### Passo 3.1 — Login (federado Google, ADR-013 — OAuth Authorization Code)
- **Pré-requisito:** `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
  provisionadas e **Authorized redirect URIs** (URL `/exec` do deployment)
  registradas no GCP Console — `DEPLOY_CHECKLIST.md` §2 e subseção "GCP
  Console (ADR-013)". Para entrar como Influenciadora: Parceira `Ativa`
  com identidade vinculável (`EMAIL` preenchido, fluxo de vinculação
  SPEC-035) ou já vinculada (`SUB_PROVIDER`).
- **Onde:** `?pagina=portal-login` (também é a rota default da URL `/exec`
  sem parâmetro de página).
- **Ação:** clicar **Entrar com Google**.
- **Resultado esperado (ida):** o navegador **sai do iframe do Portal e
  navega top-level** para `accounts.google.com` (tela de escolha de conta
  do Google). A saída da página do Portal é o comportamento novo do
  ADR-013, não é bug. Escolher a conta.
- **Resultado esperado (volta):** o Google redireciona automaticamente de
  volta para a URL `/exec` com `code` e `state` na query; a tela de login
  processa a entrada sozinha (troca do código no backend) e conclui:
  - conta de **Administrador** → painel admin (`?pagina=admin`);
  - **Influenciadora vinculada** → dashboard (`?pagina=portal-dashboard`).
- **Caso de borda (recarregar a página de retorno):** recarregar/F5 na URL
  de retorno — o `code`/`state` daquela URL já foram consumidos → a tela
  mostra a mensagem orientando a **recomeçar o login**
  (`ERR_AUTH_STATE_INVALIDO`) e o botão **Entrar com Google** volta a
  ficar visível. **Comportamento esperado** (`state` de uso único,
  anti-CSRF — ADR-013), **não é bug**.
- **Caso de borda (demora > 10 minutos):** iniciar o login e só concluir a
  escolha de conta no Google **mais de 10 minutos** depois → mesmo
  comportamento de recomeço acima (o `state` expira no cache — TTL de 10
  min do `GuardiaoDeEstadoOAuth`). Também não é bug.
- **Nota (modelo legado):** o formulário cupom + 5 dígitos do CNPJ
  (SPEC-025 RN-16) e seus casos AC-01/AC-02 **não têm mais UI** — o
  backend `entrarNoPortal` permanece implementado/testado, mas o login do
  Portal é exclusivamente federado desde SPEC-035/ADR-013.

### Passo 3.2 — Ver Pendências
- **Ação:** após o login, a tela "Pendências da Competência" carrega
  sozinha.
- **Resultado esperado:** lista os itens da competência compilada na
  Jornada 1 (mesmos rótulos de formato, ex. "Reels"), cada um com seu
  estado atual — deve refletir qualquer ação já feita na Jornada 2 (ex. se
  o Passo 2.2 aprovou/publicou uma Entrega, ela não aparece mais aqui —
  `listarPendencias` exclui `Publicado`, SPEC-027 §2).

### Passo 3.3 — Ler briefing de um item e enviar material
- **Ação:** observar o item — se o Briefing do Passo 2.1 foi publicado,
  aparecem Look/Entrega/Postagem; senão, `Briefing ainda não disponível.`
- **Ação:** num item em `AguardandoMaterial`, preencher "Link do material"
  e clicar **Enviar material**.
- **Resultado esperado:** mensagem `Material enviado.`; ao recarregar, o
  item some da lista de pendências abertas (mesmo efeito do UC-012.02,
  agora disparado pela Parceira via UC-027.03).
- **Erro esperado (PC-02):** não reproduzível pela UI normal (o comando só
  monta com dados do próprio item renderizado) — é uma proteção de
  backend contra manipulação do payload para apontar a uma Entrega de
  outra Parceira.

### Passo 3.4 — Ir para Perfil, editar CEP/PIX/e-mail
- **Ação:** clicar **Meu perfil** no menu superior. A tela mostra E-mail,
  Chave PIX, CEP, Número, Complemento, e (somente leitura) Rua/Bairro/
  Cidade/UF.
- **Ação:** alterar o CEP para um CEP real válido (ex. `01310-100`) e o
  Número; clicar **Salvar**.
- **Resultado esperado:** Rua/Bairro/Cidade/UF recompostos automaticamente
  a partir do novo CEP (RN-01 SPEC-032); mensagem `Perfil salvo.`
- **Caso de borda PP-03 (degradável):** informar um CEP inválido/inexistente
  — o salvamento de PIX/e-mail/número/complemento deve continuar
  funcionando; aparece o aviso `Endereço pode estar incompleto — verifique
  o CEP.`
- **Risco conhecido a observar (ADR-011, proposto/não aceito):** a resolução
  de CEP é uma chamada HTTP síncrona feita **sob a trava global** do Portal
  — se demorar ou falhar, login/logout/pendências de **outras** Parceiras
  no mesmo instante podem sofrer timeout. Não é reproduzível
  deterministicamente num teste manual solo; só registrar se notar
  lentidão anormal ao salvar CEP com outra sessão ativa em paralelo.

### Passo 3.5 — Logout e confirmar bloqueio de sessão
- **Ação:** clicar **Sair**.
- **Resultado esperado:** volta para `?pagina=portal-login`; a sessão local
  é limpa.
- **Verificação de bloqueio:** tentar acessar `?pagina=portal-pendencias`
  novamente sem logar — sem token local, a própria tela redireciona sozinha
  para o login; um token antigo reaproveitado manualmente deve retornar
  `PC-01`/`AC-03` ("Sessão expirada, faça login novamente.").

### Passo 3.6 — Testar bloqueio de 5 tentativas isoladamente (SPEC-025 CB-01)
- **Não homologável pela UI desde SPEC-035/ADR-013:** o bloqueio por
  tentativas (`JanelaDeBloqueio`, aba `BLOQUEIOS`) pertence ao modelo de
  credencial legado (cupom+senha), que não tem mais tela de login — e não
  se aplica ao login federado (token assinado criptograficamente, SPEC-035
  §9.2-A). Continua coberto pela suíte automatizada (`entrarNoPortal`);
  nada a validar manualmente aqui.

---

## 4. Pendências conhecidas (não são bugs do roteiro)

Antes de reportar algo como bug, confirme se não é uma destas limitações já
registradas:

- **Sem tela de gestão/edição de Parceira** (SPEC-002: alterar vínculo,
  editar Condição Comercial) — hoje só editando `BASE DE DADOS` direto na
  planilha. Achado da FASE 2: `Parceira.ativar()`/`.inativar()` e os erros
  `GP-01/02/03` estão na SPEC mas sem nenhum Service/Controller/Repository
  de escrita que os exponha.
- **Sem tela de geração de documentos** (SPEC-023) — `gerarContrato`/
  `gerarBriefingFormal` só são chamáveis via `google.script.run` direto
  (Apps Script Editor ou console do navegador), sem UI.
- **`appsscript.json` com `access: ANYONE`** (resolvido 2026-07-17, corrigido
  aqui em 2026-07-18 — este item estava desatualizado, ver nota em §0):
  qualquer conta Google abre a Web App; o Portal em si continua exigindo
  login federado (SPEC-035/ADR-013) para ver dados.
- **ADR-011 (proposto, não aceito):** a trava global do Portal
  (`LockService.getScriptLock`) serializa também a chamada síncrona de CEP
  do editar-Perfil — risco de timeout cruzado entre Parceiras diferentes
  durante uma edição de CEP lenta. Mitigado (só chama quando o CEP muda),
  não eliminado.
- **Decisões abertas do PO (🟠):**
  - **Q-07** — modelo de autenticação definitivo do Portal; hoje é um
    adaptador legado provisório (cupom + 5 primeiros dígitos do CNPJ),
    reconhecidamente de baixa entropia.
  - **Q-08** — papéis/permissões distintos dentro da equipe; hoje é
    tratado como operador único.
  - **Q-09** — LGPD (retenção/expurgo de PII) deveria estar resolvida
    **antes** de o Portal expor dados; segue pendente formalmente
    (SPEC-025/027/032 já implementadas e expondo PII no meio-tempo).
  - **Q-05/P4** — regra de inativação de Parceira com pendências abertas de
    um ciclo em andamento não está definida; não testar esse cenário
    esperando um comportamento específico.
  - **Q-03** (SPEC-012) — rótulos crus de `EmRevisao`/`Publicado` a
    confirmar com a operação; podem não bater com os nomes do legado
    ("ajustes"/"postado").
- **SPEC-020/030/034 e Importação Inicial da Base — implementadas
  (correção 2026-07-18):** este item dizia que não existiam; estão `[x]`
  desde 2026-07-17. Seus fluxos e telas (`pagamentos.html`,
  `documentos.html` sem tela própria para geração — via `google.script.run`
  direto, ver Passo 2.4) ainda não têm passos dedicados neste roteiro.
- **Rastreio automático nunca confirma entrega nesta versão** (SPEC-016
  D-02): o adaptador de rastreio é manual/fake, sempre devolve "não
  entregue" — "Atualizar status" nunca arquiva um Envio sozinho hoje.

---

## Resumo

3 jornadas, 15 passos numerados (1.1–1.3, 2.1–2.4, 3.1–3.6), cobrindo 10 das
14 SPECs concluídas (`001, 002, 005, 009, 012, 016, 023, 025, 027, 032`),
com casos de borda e códigos de erro (`CM-01`, `BR-01`, `AC-01/02`,
`PC-01/02`, `PP-03`, `DC-01/02`) onde aplicável.

**Correção (2026-07-18):** o repositório tem hoje 13 telas reais em
`src/ui/*.html` (`admin`, `briefing`, `cadastro-parceira`, `compilar-mes`,
`dashboard`, `documentos`, `entrega`, `envio`, `financeiro`, `login`,
`pagamentos`, `pendencias`, `perfil` — fora os parciais `*-head.html`,
compartilhados via `include()`), não as 8 originais deste roteiro. `admin`/
`dashboard`/`financeiro`/`documentos`/`pagamentos` (Sprint Portal MVP
Online e SPEC-020/030/034) ainda não têm passo dedicado aqui — ampliação
pendente, não bloqueia a homologação do login (foco atual, ver §0/Passo
3.1). Estado ao vivo do login em produção (deploy, Script Properties,
GCP Console, próximos passos): `TASK_ROUTER.md`, nota da SPEC-035 datada
2026-07-18 — fonte única, não duplicar aqui.
