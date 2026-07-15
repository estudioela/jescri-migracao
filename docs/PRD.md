# PRD — TEAR V2
### Product Requirements Document
**Status do documento:** rascunho de Pesquisa (etapa SDD: *Research*) — base para Domain Model, User Stories, Features e SPECs.
**Fontes analisadas:** `projeto-tear-v1.xlsx` (planilha oficial), `app-scripts-projeto-tear-v1/` (Código.js, WebApp.js, SidebarBackend.js, Index.html, appsscript.json), `00_START_HERE.md`.
**Convenção:** todo fato de negócio abaixo cita sua fonte. Onde a fonte não confirma algo com certeza, o texto traz **Pendente de validação**.

As SPECs derivadas deste PRD são organizadas individualmente em `docs/specs/` e
ordenadas por `WORKFLOW.md`.

---

## 1. Visão do Produto

### 1.1 Propósito
O TEAR é o sistema de gestão do programa de parcerias com influenciadoras digitais da marca **Jescri** (moda íntima/sleepwear), operado pela agência **Estúdio Elã**. Ele administra o ciclo mensal completo de uma campanha de influência: cadastro da parceira, definição do que ela vai produzir (briefing), acompanhamento da produção de conteúdo, envio de produtos (logística), geração de contrato, pagamento e histórico.

*Fonte: `00_START_HERE.md` (linhas 126-144); mensagens de UI em `Código.js` (ex. "Portal Influenciadoras Jescri", `WebApp.js:142`); domínio de dados em `BASE DE DADOS` (nomes de campo como `INFLUENCIADORA_RAZAO_SOCIAL`, `LOOKS_QTD`).*

### 1.2 Problema resolvido
Hoje a operação inteira roda sobre uma única planilha Google Sheets com automações em Apps Script, com o dono do processo movendo dados manualmente entre WhatsApp, planilha e Google Drive. O TEAR V2 nasce para transformar essa operação — hoje funcional, mas manual e frágil — em um **produto**, mantendo o comportamento de negócio validado e sem regressão de regra.

*Fonte: `00_START_HERE.md`, seção "Objetivo Final" (linhas 126-144): "Transformar o sistema atual em um portal profissional, moderno e escalável".*

### 1.3 Objetivos
- Preservar 100% das regras de negócio já validadas no V1 (ver Seção 7).
- Entregar uma experiência profissional para a influenciadora (portal) e para a equipe da marca (gestão).
- Reduzir dependência de passos manuais hoje feitos por WhatsApp/planilha (ex.: cópia manual de mensagens de cobrança e confirmação de endereço).

*Pendente de validação: metas quantitativas de negócio (prazo, redução de tempo operacional, número de influenciadoras-alvo) não constam em nenhuma fonte analisada.*

---

## 2. Público-alvo

| Perfil | Responsabilidade no sistema | Necessidade principal |
|---|---|---|
| **Influenciadora** (parceira de conteúdo) | Recebe briefing mensal, produz conteúdo (Reel/Carrossel/Stories), envia material, acompanha pagamento e histórico | Saber o que precisa entregar, quando, e ver se já foi pago — sem depender de mensagem manual |
| **Equipe Jescri/Estúdio Elã** (gestão da marca) | Cadastra e ativa influenciadoras, define quantidades contratadas, escreve o briefing mensal, aprova conteúdo, dispara pagamentos, acompanha logística | Rodar o ciclo mensal inteiro (abrir mês, cobrar, aprovar, arquivar) com o mínimo de passos manuais |

*Fonte: menu do ERP em `Código.js` (linhas 25-76, `onOpen()`) mostra exatamente as ações que a equipe realiza; telas do portal em `Index.html` (login, pendências, briefing, upload, pagamentos, histórico, perfil) mostram o que a influenciadora vê.*

*Pendente de validação: se existe mais de uma pessoa na equipe Jescri/Elã com papéis diferentes (ex. financeiro vs. criação) — o código trata a equipe como um único operador do ERP, sem papéis/permissões diferenciados.*

---

## 3. Visão Geral do Sistema

O TEAR é composto por dois lados que compartilham a mesma base de dados:

1. **Motor de gestão** (usado pela equipe Jescri/Elã): cadastro de influenciadoras, abertura do ciclo mensal, briefing, aprovação de conteúdo, logística de envio de produto, financeiro e geração automática de documentos (contrato e briefing formal).
2. **Portal da Influenciadora**: login, lista de pendências do mês, leitura do briefing por formato, envio de material (upload), acompanhamento financeiro, histórico e edição do próprio perfil (dados bancários/endereço).

Os módulos se relacionam em torno de um **ciclo mensal** (um "mês de referência" + ano): ao abrir um novo mês, o sistema gera, para cada influenciadora ativa, as pendências de conteúdo, o registro de pagamento e o registro logístico daquele mês.

*Fonte: `Código.js`, função `gerarNovoMesCompleto()` (linhas 86-165) — é o "motor" que injeta linhas em `ATIVAÇÕES`, `FLUXO LOGÍSTICO` e `PAGAMENTOS` a partir da `BASE DE DADOS`.*

---

## 4. Objetivos do Produto

**Objetivos de negócio**
- Sustentar o programa de influenciadoras da Jescri sem depender de um único operador de planilha.
- Garantir que cada influenciadora ativa tenha, todo mês, contrato, briefing, cobrança e logística gerados de forma consistente.

**Objetivos operacionais**
- Reduzir passos manuais hoje feitos "fora do sistema" (cópia de mensagem de WhatsApp para cobrança e confirmação de endereço — *Fonte: `Código.js:397-439`, `gerarSolicitacaoPagamento()` e `gerarMensagemRevisao()`*).
- Manter rastreabilidade de todo conteúdo e pagamento arquivado (histórico com data de arquivamento — *Fonte: `Código.js:878-933`, `arquivarGenerico()`*).

**Objetivos dos usuários**
- Influenciadora: saber exatamente o que entregar, em qual prazo, e visualizar o status financeiro sem precisar perguntar.
- Equipe Jescri/Elã: abrir o mês, aprovar conteúdo e disparar pagamento com o mínimo de cliques.

---

## 5. Fluxos Principais

### 5.1 Cadastro de nova influenciadora
1. Influenciadora preenche formulário externo (`estudioela.com/cliente/jescri-cadastro/`).
2. Resposta cai na aba `CADASTROS`.
3. `onFormSubmit()` copia os dados para `BASE DE DADOS` com `STATUS = OFF` (inativa por padrão) e resolve o endereço automaticamente a partir do CEP (BrasilAPI).
4. Ativação (`STATUS = ON`) é um passo manual da equipe — não há função no código que faça essa mudança automaticamente.

*Fonte: `Código.js:78-81` (`abrirPaginaCadastro`), `:938-987` (`onFormSubmit`). Pendente de validação: critério que a equipe usa para decidir ativar ou não uma influenciadora recém-cadastrada.*

### 5.2 Abertura do ciclo mensal ("Iniciar Novo Mês")
1. Equipe informa mês e ano (ex. "AGOSTO 2026").
2. Sistema lê todas as influenciadoras com `STATUS = ON`.
3. Para cada uma: limpa o rascunho de briefing anterior; cria 1 linha de pendência de conteúdo por unidade contratada de Reel/Carrossel/Stories; cria 1 linha de pagamento (`em aberto`); cria 1 linha de logística (`Aguardando Confirmação`).

*Fonte: `Código.js:86-165`, `gerarNovoMesCompleto()`.*

### 5.3 Briefing
1. Equipe descreve, por influenciadora e por formato (Reel, Carrossel, Stories 1, Stories 2): o look/peça a ser usado, a data de entrega do material, a data de postagem e a orientação criativa.
2. A data de aprovação interna é calculada automaticamente a partir da data de postagem (ver RN-04).
3. Opcionalmente, a equipe pode puxar os "looks" definidos em uma planilha externa por influenciadora para dentro do briefing.

*Fonte: aba `BRIEFING` (cabeçalhos); `Código.js:206-229` (cálculo de aprovação por coluna editada); `:444-481` (`sincronizarLooks`).*

### 5.4 Produção e aprovação de conteúdo
1. Influenciadora vê suas pendências no Portal, abre o briefing do item e envia o material (upload direto para o Google Drive).
2. Ao concluir o envio, o status do item passa para `ajustes` ("material enviado, aguardando aprovação interna").
3. Equipe revisa e muda o status para `aprovado`.
4. Ao publicar, equipe marca como `postado`, e o item é movido automaticamente para o histórico.

*Fonte: `WebApp.js:1008-1051` (`finalizarEnvioResumable`, grava status `"ajustes"`); `Código.js:231-236` (arquivamento automático ao detectar "postado"); `WebApp.js:842-858` (`normalizarStatusAtivacao`, que documenta os 4 estados: aguardando material → em aprovação/ajustes → aprovado → publicado).*

### 5.5 Logística (envio do produto físico)
1. Ao abrir o mês, cada influenciadora ativa recebe uma linha de logística com status `Aguardando Confirmação`.
2. Equipe confirma endereço via mensagem de WhatsApp gerada pelo sistema, envia o produto e registra o código de rastreio.
3. Sistema consulta a API da transportadora (BRComerce) e atualiza o status de rastreio automaticamente.
4. Ao registrar o código de rastreio, a data de envio é preenchida automaticamente, se ainda vazia.
5. Quando o status indica entrega, o item é arquivado no histórico logístico.

*Fonte: `Código.js:412-439` (mensagem de confirmação), `:483-520` (`atualizarRastreiosBRComerce`), `:303-307` (data de envio automática), `:874-876` (`arquivarFluxo`).*

### 5.6 Financeiro / Pagamento
1. Todo pagamento mensal nasce como `em aberto`, com valor e chave PIX vindos do cadastro da influenciadora.
2. Equipe pode lançar pagamentos avulsos (extras/UGC) a qualquer momento, por influenciadora e período livre.
3. Sistema gera a mensagem de cobrança/PIX para envio manual.
4. Ao marcar como `pago`, o item é arquivado automaticamente no histórico financeiro.

*Fonte: `Código.js:359-410` (lançamento avulso e mensagem de cobrança); `SidebarBackend.js:102-139` (`salvarPagamentoExtra`); `Código.js:299-301` (arquivamento automático ao detectar "pago"); `WebApp.js:860-867` (`normalizarStatusPagamento`, estados: pendente → aprovado → pago).*

### 5.7 Geração automática de documentos (Contrato e Briefing formal)
1. Um job de mesclagem de documentos gera, para cada influenciadora com `STATUS = ON`, um contrato individual (Google Doc) preenchido com razão social, CNPJ, endereço, quantidades contratadas, valor (em número e por extenso), escopo/prazo de uso de imagem, e cidade/data de assinatura.
2. Um segundo job gera um documento de briefing formal por influenciadora, condicionado a uma coluna de sinalização (`SIM`).

*Fonte: aba `NVScriptsProperties`/`DO NOT DELETE - AutoCrat Job Se` — dois jobs configurados: `[JESCRI] CONTRATO` (condição `STATUS = ON`) e `[JESCRI] BRIEFING` (condição `SIM/NÃO = SIM`), com os campos de mesclagem listados nas colunas `Tags`.*

### 5.8 Encerramento / Arquivamento
Conteúdo publicado, pagamento pago e logística entregue saem das abas "vivas" e vão para abas de histórico correspondentes, com carimbo de data de arquivamento — preservando o registro para consulta posterior pela influenciadora (aba "Histórico" do Portal) e para auditoria.

*Fonte: `Código.js:878-933` (`arquivarGenerico`), `:861-872` (`menuArquivarTudo`).*

---

## 6. Módulos Funcionais

### 6.1 Cadastro & Base de Influenciadoras
- **Objetivo:** manter o cadastro de todas as influenciadoras (ativas e inativas) com dados cadastrais, bancários, contratuais e de endereço.
- **Funcionalidades:** formulário externo de cadastro; ativação/inativação (ON/OFF); edição de dados via painel interno; preenchimento automático de endereço por CEP.
- **Usuários envolvidos:** influenciadora (preenche o formulário inicial e depois edita alguns campos pelo Portal); equipe Jescri/Elã (ativa, edita, define valores e quantidades contratadas).
- **Regras de negócio:** RN-01, RN-02, RN-03, RN-11.
- **Dependências:** serviço externo de CEP (BrasilAPI).

### 6.2 Ciclo Mensal / Campanha
- **Objetivo:** abrir e orquestrar o mês de referência de uma campanha, distribuindo pendências para todos os módulos operacionais.
- **Funcionalidades:** iniciar novo mês (gera pendências de conteúdo, pagamento e logística); lançamento de pagamentos avulsos fora do ciclo padrão.
- **Usuários envolvidos:** equipe Jescri/Elã.
- **Regras de negócio:** RN-04, RN-05, RN-09.
- **Dependências:** Base de Influenciadoras (só influenciadoras `ON` entram no ciclo).

### 6.3 Briefing
- **Objetivo:** comunicar à influenciadora o que produzir em cada formato, com prazos e orientação criativa.
- **Funcionalidades:** briefing por influenciadora/mês, um bloco por formato (Reel, Carrossel, Stories 1, Stories 2); cálculo automático da data de aprovação interna; importação de "looks" de planilha externa por influenciadora.
- **Usuários envolvidos:** equipe Jescri/Elã (escreve); influenciadora (lê, no Portal).
- **Regras de negócio:** RN-04, RN-06.
- **Dependências:** Ciclo Mensal (o briefing é recriado a cada abertura de mês); Ativações (data de aprovação é espelhada entre os dois).

### 6.4 Conteúdo / Ativações
- **Objetivo:** rastrear cada entrega de conteúdo contratada (uma "ativação" por Reel/Carrossel/Stories) do estado inicial até a publicação.
- **Funcionalidades:** lista de pendências por influenciadora; envio de material (upload); mudança de status; ordenação cronológica automática.
- **Usuários envolvidos:** influenciadora (envia material); equipe Jescri/Elã (aprova, marca como postado).
- **Regras de negócio:** RN-06, RN-07, RN-08.
- **Dependências:** Google Drive (armazenamento do material enviado); Briefing (cada ativação tem um briefing correspondente).

### 6.5 Logística
- **Objetivo:** controlar o envio físico dos produtos (looks) para cada influenciadora do ciclo.
- **Funcionalidades:** confirmação de endereço; registro de rastreio; atualização automática de status via API de transportadora; arquivamento ao entregar.
- **Usuários envolvidos:** equipe Jescri/Elã.
- **Regras de negócio:** RN-10, RN-11.
- **Dependências:** API externa de rastreio (BRComerce); Base de Influenciadoras (endereço).

### 6.6 Financeiro / Pagamentos
- **Objetivo:** controlar o pagamento mensal contratado e pagamentos avulsos (extras/UGC) por influenciadora.
- **Funcionalidades:** lançamento automático mensal; lançamento avulso; geração de mensagem de cobrança; acompanhamento de status; arquivamento ao pagar.
- **Usuários envolvidos:** equipe Jescri/Elã.
- **Regras de negócio:** RN-05, RN-09, RN-12.
- **Dependências:** Base de Influenciadoras (valor e PIX); Ciclo Mensal.

### 6.7 Contratos (geração documental)
- **Objetivo:** gerar automaticamente o documento de contrato individual de cada influenciadora ativa, e o documento formal de briefing.
- **Funcionalidades:** mesclagem automática de dados cadastrais/contratuais em template de contrato; mesclagem de dados de briefing em documento formal.
- **Usuários envolvidos:** equipe Jescri/Elã (dispara/consome); influenciadora (assina/recebe, fora do sistema).
- **Regras de negócio:** RN-13.
- **Dependências:** Base de Influenciadoras; Briefing.

### 6.8 Portal da Influenciadora
- **Objetivo:** dar à influenciadora acesso autônomo às suas pendências, briefing, financeiro, histórico e dados de perfil.
- **Funcionalidades:** login (cupom + senha); lista de pendências do mês; leitura de briefing por item; upload de material; consulta de pagamentos (previsto x pago); histórico de conteúdo e pagamentos; edição de perfil (PIX, e-mail, endereço).
- **Usuários envolvidos:** influenciadora.
- **Regras de negócio:** RN-14, RN-15, RN-16, RN-17.
- **Dependências:** todos os módulos acima (o Portal é uma camada de leitura/escrita sobre eles).

### 6.9 Histórico / Arquivamento
- **Objetivo:** preservar registros concluídos (conteúdo publicado, pagamento pago, entrega logística concluída) fora das listas operacionais ativas, mantendo consulta histórica.
- **Funcionalidades:** arquivamento automático por gatilho de status; arquivamento manual em lote; carimbo de data de arquivamento.
- **Usuários envolvidos:** equipe Jescri/Elã (aciona/consome); influenciadora (consulta pelo Portal).
- **Regras de negócio:** RN-08, RN-12, RN-18.
- **Dependências:** Conteúdo/Ativações, Financeiro, Logística.

---

## 7. Regras de Negócio

**Cadastro (RN-01 a RN-03)**
- **RN-01:** Toda influenciadora nasce com `STATUS = OFF` ao vir do formulário de cadastro; a ativação (`ON`) é uma decisão manual da equipe. *Fonte: `Código.js:981` (`nova[0] = "OFF"`).*
- **RN-02:** O endereço completo é resolvido automaticamente a partir do CEP (rua, bairro, cidade, UF), tanto no cadastro inicial quanto em qualquer edição posterior de CEP/número/complemento. *Fonte: `Código.js:1008-1088` (bloco "ENDERECO SERVICE").*
- **RN-03:** Somente influenciadoras com `STATUS = ON` entram em qualquer novo ciclo mensal (conteúdo, pagamento, logística) ou em qualquer geração de contrato. *Fonte: `Código.js:106`, `:373`; condição do job AutoCrat de contrato (`STATUS = ON`).*

**Ciclo mensal e briefing (RN-04 a RN-06)**
- **RN-04:** A data de aprovação interna de um conteúdo é sempre 7 dias antes da data de postagem/ativação; se essa data cair numa sexta-feira, é adiada para a segunda-feira seguinte (+3 dias); se cair num sábado, +2 dias; se cair num domingo, +1 dia. *Fonte: `Código.js:317-345`, `calcularDataAprovacao()`.*
- **RN-05:** O texto digitado pela equipe para identificar o ciclo mensal (ex. "AGOSTO 2026") é interpretado como mês + ano; se nenhum ano for informado, assume-se o ano corrente. *Fonte: `Código.js:1138-1149`, `parseMesAno()`.*
- **RN-06:** Cada influenciadora ativa recebe, por mês, uma pendência de conteúdo por unidade contratada de cada formato (ex.: se contratou 2 Reels, nascem 2 pendências de Reel); Stories com mais de 1 unidade contratada viram `STORIES_1`, `STORIES_2` etc. *Fonte: `Código.js:141-155`.*

**Conteúdo (RN-07 e RN-08)**
- **RN-07:** O ciclo de vida de uma entrega de conteúdo tem 4 estados possíveis: aguardando material → em aprovação/ajustes (material enviado, revisão interna) → aprovado → publicado. *Fonte: `WebApp.js:842-858`, `normalizarStatusAtivacao()`.*
- **RN-08:** Ao ser marcado como publicado, o item de conteúdo é automaticamente removido da lista ativa e movido para o histórico, com data de arquivamento registrada. *Fonte: `Código.js:231-236`, `:878-933`.*

**Financeiro (RN-09 a RN-12)**
- **RN-09:** Todo pagamento lançado — seja no ciclo mensal automático, seja avulso — nasce com status `em aberto`. *Fonte: `Código.js:138`, `:384`; `SidebarBackend.js:134`.*
- **RN-10:** No Portal, o status financeiro exibido à influenciadora tem 3 estados: pendente → aprovado → pago (qualquer variação textual que não contenha "pago" ou "aprovado" é tratada como pendente). *Fonte: `WebApp.js:860-867`.*
- **RN-11:** Ao ser marcado como pago, o pagamento é automaticamente arquivado no histórico financeiro. *Fonte: `Código.js:299-301`.*
- **RN-12:** É possível lançar pagamentos avulsos (ex. UGC/extra) para qualquer influenciadora e período, fora do ciclo mensal padrão. *Fonte: `SidebarBackend.js:102-139`.*

**Logística (RN-13 e RN-14)**
- **RN-13:** Toda influenciadora ativa recebe, a cada abertura de mês, um registro logístico com status inicial "Aguardando Confirmação". *Fonte: `Código.js:135`.*
- **RN-14:** Ao ser marcado como entregue, o item logístico é automaticamente arquivado no histórico logístico. *Fonte: `Código.js:874-876`, `:864`.*

**Contratos (RN-15)**
- **RN-15:** O documento de contrato é gerado individualmente por influenciadora, apenas para as que estão com `STATUS = ON`; o documento de briefing formal é gerado apenas para influenciadoras sinalizadas com uma coluna de aprovação específica (`SIM`). *Fonte: configuração dos jobs AutoCrat (aba `NVScriptsProperties`/AutoCrat).*

**Portal / Segurança (RN-16 a RN-18)**
- **RN-16:** O acesso da influenciadora ao Portal é feito por cupom (código também usado como identificador comercial) + senha, sendo a senha os 5 primeiros dígitos do CNPJ cadastrado. *Fonte: `WebApp.js:155-212`, `login()`. Este é um segredo de baixa entropia por desenho atual — ver Seção 10 (Restrições).*
- **RN-17:** Após 5 tentativas de login incorretas para o mesmo cupom, o acesso fica bloqueado por 15 minutos. *Fonte: `WebApp.js:12-13`, `:163-167`.*
- **RN-18:** A sessão da influenciadora no Portal dura 6 horas, renovadas a cada interação (renovação deslizante). *Fonte: `WebApp.js:195`, `:221`.*

*Pendente de validação: nenhuma das regras acima define o que acontece quando uma influenciadora é desativada (`OFF`) no meio de um ciclo com pendências em aberto — o código não trata esse caso.*

---

## 8. Entidades do Domínio

### Influenciadora
**Definição:** parceira de conteúdo contratada pela Jescri para produzir e publicar material em troca de produto e/ou pagamento.
**Responsabilidade:** produzir o conteúdo contratado, manter seus próprios dados de contato/bancários/endereço atualizados.
**Relacionamentos:** tem muitos Pagamentos, muitas Ativações, muitos registros de Fluxo Logístico e um Briefing por ciclo mensal; gera um Contrato por ciclo (enquanto ativa).
*Campos confirmados: nome/chave, cupom, e-mail, CNPJ, chave PIX, endereço completo, valor total contratado, quantidade contratada de Reels/Carrossel/Stories, quantidade de looks, canais e prazo de uso de imagem, status (ON/OFF). Fonte: cabeçalhos de `BASE DE DADOS`.*

### Ciclo Mensal (Campanha)
**Definição:** período (mês + ano de referência) que organiza todas as entregas, pagamentos e envios de um determinado momento do programa.
**Responsabilidade:** ser a chave que agrupa Ativações, Pagamentos, Fluxo Logístico e Briefing do mesmo período.
**Relacionamentos:** um Ciclo Mensal tem muitas Ativações, um Pagamento e um registro de Fluxo Logístico por Influenciadora ativa.
*Fonte: colunas `MES_REFERENCIA`/`ANO_REFERENCIA`, presentes em `ATIVAÇÕES`, `PAGAMENTOS`, `FLUXO LOGÍSTICO`, `BRIEFING`.*

### Ativação (entrega de conteúdo)
**Definição:** uma unidade de conteúdo contratada num formato específico (Reel, Carrossel, Stories 1 ou Stories 2), a ser produzida por uma influenciadora num ciclo mensal.
**Responsabilidade:** representar o estado de produção daquele item específico, do briefing até a publicação.
**Relacionamentos:** pertence a uma Influenciadora e a um Ciclo Mensal; corresponde a um bloco específico dentro do Briefing daquele ciclo.
*Campos confirmados: identificador único, formato, data de aprovação, data de ativação/postagem, status de conteúdo, link do arquivo enviado. Fonte: cabeçalhos de `ATIVAÇÕES`.*

### Briefing
**Definição:** conjunto de orientações criativas e prazos, por formato, que a equipe Jescri define para uma influenciadora em um ciclo mensal.
**Responsabilidade:** comunicar o que produzir (peça/look, tema, data de entrega, data de postagem) para cada Ativação do ciclo.
**Relacionamentos:** pertence a uma Influenciadora e a um Ciclo Mensal; tem até 4 blocos (um por formato contratado).
*Fonte: cabeçalhos de `BRIEFING`.*

### Pagamento
**Definição:** registro financeiro de um valor devido a uma influenciadora, seja o valor mensal contratado, seja um valor avulso (extra/UGC).
**Responsabilidade:** rastrear o status de cobrança/pagamento de um valor específico.
**Relacionamentos:** pertence a uma Influenciadora; normalmente associado a um Ciclo Mensal (pode existir fora do ciclo padrão, como pagamento avulso).
*Fonte: cabeçalhos de `PAGAMENTOS`.*

### Envio Logístico (Fluxo Logístico)
**Definição:** registro do envio físico do produto/look da influenciadora em um determinado ciclo mensal.
**Responsabilidade:** rastrear endereço de entrega, confirmação, código de rastreio e status de entrega.
**Relacionamentos:** pertence a uma Influenciadora e a um Ciclo Mensal.
*Fonte: cabeçalhos de `FLUXO LOGÍSTICO`.*

### Contrato
**Definição:** documento formal gerado automaticamente para uma influenciadora ativa, consolidando os termos comerciais do ciclo (valor, quantidades contratadas, prazo/canais de uso de imagem, local e data de assinatura).
**Responsabilidade:** ser o registro legal da relação comercial vigente.
**Relacionamentos:** gerado a partir dos dados da Influenciadora; um documento por influenciadora ativa.
*Fonte: configuração do job AutoCrat `[JESCRI] CONTRATO`.*

### Material Enviado
**Definição:** o arquivo (imagem/vídeo) que a influenciadora envia como entrega de uma Ativação específica.
**Responsabilidade:** ser a evidência/arquivo final de uma entrega, armazenado em pasta própria por influenciadora/mês/formato.
**Relacionamentos:** pertence a uma Ativação.
*Fonte: `WebApp.js:887-949` (organização de pastas no Drive), `:951-1006` (upload).*

### Histórico
**Definição:** registro arquivado de uma Ativação, Pagamento ou Envio Logístico já concluído.
**Responsabilidade:** preservar, com data de arquivamento, o registro de algo que já saiu do fluxo ativo.
**Relacionamentos:** é uma cópia arquivada de uma Ativação, Pagamento ou Envio Logístico.
*Fonte: cabeçalhos de `HISTÓRICO DE CONTEÚDOS`, `HISTÓRICO DE PAGAMENTOS`, `HISTÓRICO LOGÍSTICO`.*

---

## 9. Requisitos Funcionais

### Cadastro & Base de Influenciadoras
- **RF-001:** O sistema deve permitir o cadastro de uma nova influenciadora via formulário externo, criando automaticamente seu registro com status inativo.
- **RF-002:** O sistema deve permitir à equipe ativar/inativar uma influenciadora.
- **RF-003:** O sistema deve preencher automaticamente o endereço completo a partir do CEP informado.
- **RF-004:** O sistema deve permitir à equipe editar os dados contratuais de uma influenciadora (valor, quantidades contratadas, prazo/canais de uso de imagem, planilha externa de looks).

### Ciclo Mensal
- **RF-005:** O sistema deve permitir à equipe iniciar um novo ciclo mensal informando mês e ano.
- **RF-006:** Ao iniciar um ciclo, o sistema deve gerar automaticamente, para cada influenciadora ativa, as pendências de conteúdo (uma por unidade contratada/formato), um registro de pagamento e um registro logístico.
- **RF-007:** O sistema deve permitir lançar pagamentos avulsos fora do ciclo mensal padrão.

### Briefing
- **RF-008:** O sistema deve permitir à equipe registrar, por influenciadora e por formato, o look, a data de entrega, a data de postagem e a orientação criativa.
- **RF-009:** O sistema deve calcular automaticamente a data de aprovação interna de cada item, a partir da data de postagem.
- **RF-010:** O sistema deve permitir importar os "looks" definidos numa planilha externa por influenciadora.

### Conteúdo / Ativações
- **RF-011:** O sistema deve exibir à influenciadora suas pendências de conteúdo do ciclo atual.
- **RF-012:** O sistema deve permitir à influenciadora enviar o material de uma pendência específica.
- **RF-013:** Ao concluir um envio, o sistema deve atualizar automaticamente o status do item para "em revisão".
- **RF-014:** O sistema deve permitir à equipe aprovar e marcar como publicado um item de conteúdo.
- **RF-015:** Ao marcar como publicado, o sistema deve mover automaticamente o item para o histórico.

### Logística
- **RF-016:** O sistema deve gerar, para cada influenciadora ativa, uma mensagem de confirmação de endereço e chave PIX.
- **RF-017:** O sistema deve permitir o registro do código de rastreio de um envio.
- **RF-018:** O sistema deve consultar automaticamente o status de rastreio junto à transportadora.
- **RF-019:** Ao identificar entrega concluída, o sistema deve mover automaticamente o item para o histórico logístico.

### Financeiro
- **RF-020:** O sistema deve gerar automaticamente o pagamento mensal de cada influenciadora ativa ao abrir o ciclo.
- **RF-021:** O sistema deve gerar uma mensagem de cobrança/PIX para um pagamento específico.
- **RF-022:** Ao marcar um pagamento como pago, o sistema deve movê-lo automaticamente para o histórico financeiro.
- **RF-023:** O sistema deve exibir à influenciadora o total previsto e o total já pago no período selecionado.

### Contratos
- **RF-024:** O sistema deve gerar automaticamente um documento de contrato individual para cada influenciadora ativa, com os dados comerciais vigentes.
- **RF-025:** O sistema deve gerar automaticamente um documento de briefing formal para as influenciadoras sinalizadas para recebê-lo.

### Portal da Influenciadora
- **RF-026:** O sistema deve autenticar a influenciadora por cupom e senha.
- **RF-027:** O sistema deve bloquear temporariamente o acesso após tentativas de login malsucedidas repetidas.
- **RF-028:** O sistema deve permitir à influenciadora consultar seu histórico de conteúdo e pagamentos por período.
- **RF-029:** O sistema deve permitir à influenciadora visualizar e editar seus próprios dados de perfil (PIX, e-mail, endereço).
- **RF-030:** O sistema deve permitir à influenciadora selecionar o período (mês/ano) que deseja consultar, entre os períodos em que ela teve atividade.

### Arquivamento
- **RF-031:** O sistema deve permitir à equipe disparar manualmente uma rotina de arquivamento geral de itens concluídos.
- **RF-032:** Todo item arquivado deve reter a data em que foi arquivado.

---

## 10. Requisitos Não Funcionais

- **Segurança:** a senha de acesso da influenciadora hoje é derivada do próprio CNPJ cadastrado (baixa entropia, não é um segredo gerado) — ver observação em RN-16. *Pendente de validação: se o TEAR V2 deve manter esse mesmo esquema ou substituí-lo por um mecanismo de autenticação mais forte é uma decisão de produto ainda não tomada nas fontes analisadas.*
- **Rastreabilidade:** toda Ativação deve ter um identificador único e estável, para que o envio de material e o histórico nunca percam a referência correta ao item original. *Fonte: `WebApp.js:238-261` (uso de UUID como `idAtivacao`).*
- **Auditoria:** todo registro arquivado deve preservar a data em que a transição de status ocorreu (data de arquivamento) — não é permitido perder essa informação ao mover um item para o histórico.
- **Disponibilidade de integrações externas:** o preenchimento de endereço depende de um serviço externo de CEP; o rastreio logístico depende de uma API externa de transportadora. O sistema deve continuar operável mesmo se uma dessas integrações estiver indisponível (falha não deve impedir salvar os dados principais). *Fonte: `Código.js:1047-1051` (tratamento de falha do serviço de CEP sem interromper o salvamento); `Código.js:500-511` (mesmo padrão no rastreio).*
- **Consistência de período:** cada campanha (mês+ano) deve ser distinguível de campanhas de mesmo mês em anos diferentes em todos os módulos (briefing, ativações, pagamentos). *Fonte: comentários e lógica de casamento por `MES_REFERENCIA + ANO_REFERENCIA` em `Código.js` e `WebApp.js`.*

*Pendente de validação: metas numéricas de desempenho/disponibilidade (tempo de resposta do Portal, uptime esperado) não constam em nenhuma fonte analisada.*

---

## 11. Restrições do Produto

- O sistema opera hoje para uma única marca (Jescri); não há suporte a múltiplas marcas/clientes no comportamento atual. *Fonte: nome da marca hardcoded em mensagens e templates (`Código.js`, `WebApp.js:2,142`).*
- A abertura de um novo ciclo mensal é sempre um gatilho manual da equipe — não existe agendamento automático recorrente no comportamento atual. *Fonte: `gerarNovoMesCompleto()` é acionada por item de menu, nunca por trigger de tempo.*
- A ativação de uma influenciadora recém-cadastrada é sempre manual — o sistema nunca ativa uma influenciadora sozinho.
- O sistema depende de dois serviços externos para funcionalidades específicas: resolução de CEP e rastreio de transportadora.

*Pendente de validação: restrições de LGPD/retenção de dados pessoais e bancários (CPF/CNPJ, chave PIX) não são tratadas em nenhuma fonte analisada — nenhuma política de retenção/expurgo de dado pessoal foi encontrada no código ou na planilha.*

---

## 12. Fora do Escopo

O comportamento a seguir **não existe** no sistema atual (V1) e, portanto, não deve ser assumido como requisito herdado — qualquer inclusão no TEAR V2 é uma decisão de produto nova, não uma regra de negócio já validada:

- Fluxo de negociação/recusa de briefing ou de looks pela influenciadora.
- Papéis e permissões diferentes dentro da equipe Jescri/Elã (o sistema hoje trata a equipe como um único operador).
- Integração com gateway de pagamento (o PIX é apenas informado/cobrado por mensagem; o pagamento em si acontece fora do sistema).
- Notificações automáticas (e-mail, push, WhatsApp automatizado) — hoje toda comunicação por WhatsApp é uma mensagem gerada para cópia manual.
- Suporte a múltiplas marcas/clientes.
- Aplicativo móvel nativo (o Portal atual é uma aplicação web).
- Painéis/dashboards de gestão para a equipe (o acompanhamento hoje é feito diretamente nas abas da planilha).

---

## 13. Roadmap

### MVP
Reproduzir, como produto, a operação já validada no V1 descrita nas Seções 5 a 9: cadastro e ativação de influenciadoras, ciclo mensal automático (conteúdo + pagamento + logística), briefing por formato, portal da influenciadora completo (pendências, upload, financeiro, histórico, perfil), geração automática de contrato e briefing formal, e arquivamento histórico.

### Versões futuras (evoluções previstas, citadas como objetivo do projeto)
- Painel administrativo para a equipe Jescri/Elã (fora do V1 atual). *Fonte: `00_START_HERE.md`, objetivo "painel administrativo".*
- Login e experiência "moderna" além do padrão cupom+CNPJ. *Fonte: `00_START_HERE.md`, objetivos "login da influenciadora" e "interface moderna".*
- Automação de notificações (reduzir dependência de mensagem manual de WhatsApp).

### Evoluções desejadas (não confirmadas como compromisso, apenas mencionadas como direção)
- Papéis/permissões diferenciadas dentro da equipe da marca.
- Suporte a múltiplas marcas/clientes na mesma instância do produto.

*Pendente de validação: não há, em nenhuma fonte analisada, uma priorização explícita ou prazos para as evoluções futuras — a lista acima é uma consolidação dos objetivos citados em `00_START_HERE.md`, sem ordem de prioridade confirmada.*

---

## Nota sobre capítulo adicionado

Foi incluída, ao final da Seção 7 e em cada seção relevante, uma marcação explícita de **Pendente de validação** sempre que uma pergunta do escopo original (Seção 9 do prompt de instruções) não pôde ser respondida com uma fonte concreta. Nenhuma regra de negócio, valor ou comportamento foi inferido sem evidência direta na planilha, no código ou na documentação fornecida.
