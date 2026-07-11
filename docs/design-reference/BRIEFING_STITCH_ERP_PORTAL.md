# Briefing técnico — Redesenho visual do ERP + Portal Jescri (para IA de design / Stitch)

> Documento de análise. Nenhum código foi alterado para produzi-lo. Toda a lógica de negócio
> descrita abaixo é a que já existe hoje em `mae/`. Nenhuma tela, campo ou regra aqui é inventada —
> tudo foi extraído lendo o código-fonte diretamente.

---

## 0. Achado-chave antes de tudo

**O Design System da Elã já existe, documentado, e já foi parcialmente implementado — mas nunca chegou a
substituir a versão em produção.**

Dentro do próprio projeto (`mae/legacy/portal-stitch-ui/stitch_portal_est_dio_el_ui/est_dio_el/DESIGN.md`)
existe um manifesto de design system completo, com tokens de cor, tipografia, espaçamento e regras de
componente. A partir dele foi gerada uma segunda versão do Portal (`mae/PortalApp.html` +
`portal_router.html` + `portal_api.html` + `views_*.html` + `components_*.html`), funcionalmente completa e
ligada às mesmas funções de backend (`login`, `getPendencias`, `getBriefing` etc.) — mas essa versão só é
acessível hoje via um **modal aberto de dentro da planilha** (menu "🖥️ Portal de Apoio → 6. Abrir Portal
(Modal)"). A versão realmente publicada como Web App pública (a que a influenciadora usa no celular) é
`Index.html`, uma versão mais antiga, com CSS próprio (bordô/champagne, Playfair Display + Montserrat), que
não segue esse design system.

Ou seja: **o Stitch não precisa inventar uma identidade visual do zero.** Ele precisa aplicar o design
system que já está documentado e parcialmente construído, à superfície completa de telas do sistema
(incluindo as que nunca foram desenhadas, como o lado ERP/admin).

Este achado é usado na Seção 6 e no Prompt Final.

---

## 1. Arquitetura geral do sistema

### 1.1 Visão geral

O projeto é um único script Google Apps Script (`scriptId 1fE8w10O3MwHvfa4gLgJvcUXD4HIWKNL0ar5YMmjzMamujRfwqiPfcLyK`),
container-bound a uma planilha Google Sheets ("[JESCRI] INFLUÊNCIA 360º" — a "Mãe"). Ele tem **duas metades**:

1. **ERP** — roda dentro do Google Sheets, operado pela equipe Estúdio Elã via menu customizado, edição de
   células (automações `onEdit`) e sidebars/modais em `HtmlService`. Não tem login próprio: o controle de
   acesso é o compartilhamento nativo da planilha.
2. **Portal de Influenciadoras** — um Web App publicado (`doGet`/`doPost` em `WebApp.js`), acessado por
   navegador/celular pelas influenciadoras, com login próprio via cupom + senha (5 primeiros dígitos do
   CNPJ). Não usa nenhuma conta Google — a sessão é um token opaco guardado em `CacheService` (6h,
   renovação deslizante).

As duas metades compartilham a mesma planilha como fonte de dados. Não há banco de dados externo, API
REST própria (fora do shim doPost) nem serviços de terceiros além de: BrasilAPI (busca de CEP),
BRComerce (rastreio de encomendas) e Google Drive (armazenamento de mídia enviada pelas influenciadoras).

### 1.2 Módulos existentes

| Módulo | Arquivo(s) | Papel |
|---|---|---|
| Motor do ERP | `Código.js` | Menu (`onOpen`), automações de planilha (`onEdit`, `onFormSubmit`), geração de campanha mensal, arquivamento/histórico, mensagens de cobrança/WhatsApp, enriquecimento de endereço por CEP |
| API do Portal | `WebApp.js` | `doGet` (serve `Index.html`), `doPost` + `API_ACOES` (shim JSON para chamadas HTTP diretas), `login`, `getPendencias`, `getBriefing`, `getPagamentos`, `getHistorico`, `getPerfil`, `updatePerfil`, upload resumable (`iniciarEnvioResumable`/`finalizarEnvioResumable`) |
| Frontend Portal (produção) | `Index.html` | SPA mobile, single-file, CSS próprio (bordô/champagne) — **é o que está no ar hoje** |
| Frontend Portal (design-system, não publicado) | `PortalApp.html`, `portal_router.html`/`raw_portal_router.html`, `portal_api.html`/`raw_portal_api.html`, `portal_styles.html`/`raw_portal_styles.html`, `components_*.html`, `views_*.html` | Mesma superfície funcional que `Index.html`, mas construída sobre o Design System da Elã. Aberta hoje só via modal (`abrirPortalModal`) |
| Sincronização Mãe → Portal | `Sincronizador.js` | Espelha `BASE DE DADOS` (Mãe) para a aba `BASE DE APOIO` (hoje também na própria Mãe, ver histórico de incidente abaixo), e os históricos de conteúdo/pagamento |
| Sincronização reversa Portal → Mãe | `Código.js: puxarAtualizacoesDoPortal` | Traz de volta cadastros/atualizações feitas no Portal (endereço, PIX, e-mail) para a Mãe |
| Sincronização legada (obsoleta) | `Portal.js`, `SincronizarPortal.js` | Apontam para uma planilha externa ("Planilha de Apoio", ID `1289Eu3hk...`) que **não existe mais** (foi excluída — foi a causa-raiz de uma queda de login recente). Ficaram como código morto, não desconectado do menu ainda em `Portal.js` (`lancarParaPortal`), mas apontando para um destino inacessível |
| Sidebars administrativas | `SidebarBackend.js` + `Sidebar.html` + `SidebarPagamento.html` | Formulários simples dentro do Sheets: editar cadastro de uma influenciadora; lançar pagamento avulso/UGC |
| Fragmento de UI "admin/command center" | `mae/legacy/portal-stitch-ui/.../views/admin.html` | Protótipo Stitch de um dashboard administrativo (dados fictícios, nunca ligado ao backend real) — não existe hoje nenhum equivalente funcional no ERP |

### 1.3 Fluxo de navegação (alto nível)

```
                     ┌─────────────────────────┐
                     │   Google Sheets (Mãe)    │
                     │  planilha "[JESCRI] ..." │
                     └───────────┬─────────────┘
                                 │ onOpen()
                     ┌───────────▼─────────────┐
                     │  Menu " ERP ELÃ 6.2"     │  ← única porta de entrada do ERP
                     │  (Código.js)             │
                     └─────┬─────────┬──────────┘
             ┌─────────────┘         └───────────────┐
   Planejamento/Financeiro/           Sidebars (modais dentro do Sheets)
   Logística/Cadastros                - Editar influenciadora
   (ações diretas em cada aba)        - Lançar pagamento extra
                                      Portal de Apoio (submenu):
                                      - Enviar/puxar dados do Portal
                                      - Abrir Portal (Modal) → PortalApp.html


                     ┌─────────────────────────┐
                     │   Web App público        │  ← porta de entrada do Portal
                     │   (doGet → Index.html)   │
                     └───────────┬─────────────┘
                                 │
                    tela-login → tela-pendencias (home)
                                 ├── tela-briefing → tela-upload
                                 ├── tela-pagamentos
                                 ├── tela-historico
                                 └── tela-perfil
```

### 1.4 Permissões / perfis de acesso

Só existem dois perfis reais, sem granularidade adicional (sem "gerente" vs "operador", sem
"influenciadora tier 1/2/3" — isso é só um dado de exibição, não uma permissão):

- **Equipe Estúdio Elã** — acesso à planilha Google (controlado fora do app, pelo compartilhamento do
  Sheets). Dentro do ERP, qualquer pessoa com acesso à planilha tem acesso a **todas** as funções do menu.
  Não há distinção de papéis dentro do próprio ERP.
- **Influenciadora** — autenticada por cupom + senha (5 primeiros dígitos do CNPJ, sem hashing —
  observação de segurança, fora do escopo desta análise de UX). Só enxerga seus próprios dados (filtrados
  por `INFLU_KEY`/cupom). Sem papel de admin dentro do Portal.

### 1.5 Integrações externas

- **BrasilAPI** (`brasilapi.com.br/api/cep/v1/...`) — preenchimento automático de endereço a partir do CEP,
  tanto no cadastro via formulário (`onFormSubmit`) quanto na edição manual na aba BASE e na atualização de
  perfil vinda do Portal.
- **BRComerce** (`api.brcomerce.com.br/tracking/...`) — rastreio automático de encomendas na aba
  `FLUXO LOGÍSTICO`.
- **Google Drive** — pasta raiz de entregas (`PASTA_MAE_ID`), com subpastas por influenciadora → mês →
  formato de conteúdo, criadas sob demanda; upload feito via Resumable Upload API do Drive diretamente do
  navegador da influenciadora (contorna o limite de payload do Apps Script).
- **Formulário Google externo** (`estudioela.com/cliente/jescri-cadastro/`) — cadastro de novas
  influenciadoras, que cai na aba `CADASTROS` e é processado por `onFormSubmit`.

### 1.6 Relação ERP ↔ Portal

O Portal **lê e escreve na mesma planilha Mãe** (não é um sistema separado com seu próprio banco). O
"Sincronizador" existe porque, historicamente, o Portal era publicado a partir de uma segunda planilha
("Planilha de Apoio") e precisava de um mecanismo de cópia de dados nos dois sentidos. Essa segunda
planilha foi excluída em algum momento; a correção recente reapontou o sincronizador para tratar
`BASE DE APOIO` como uma aba-espelho dentro da própria Mãe. Isso significa que, arquiteturalmente, **a
divisão ERP/Portal hoje é uma divisão de telas, não de dados** — é uma oportunidade de simplificação, mas
fora do escopo desta tarefa (só documentação/UX).

---

## 2. Fluxo completo do usuário, por perfil

### 2.1 Perfil: Influenciadora (Portal)

1. Acessa o link do Web App → **Login** (cupom + senha).
2. Cai na **Home/Pendências** — lista de ativações do mês corrente, com navegador de mês (◀ mês ▶).
3. Para cada ativação pendente, pode:
   - Abrir o **Briefing** (texto do que precisa produzir, datas de entrega/postagem) → a partir daí, ir
     para **Enviar material**.
   - Ir direto para **Enviar material** sem ver o briefing.
4. Em **Enviar material**: seleciona 1+ arquivos (foto/vídeo) → acompanha barra de progresso por arquivo →
   tela de sucesso → volta para Pendências.
5. Pela navegação inferior, pode ir a qualquer momento para:
   - **Pagamentos** — total previsto/pago do mês selecionado + lista de lançamentos com um tracker de 3
     etapas (Material enviado → Aguardando pagamento → Pago).
   - **Histórico** — versão "somente leitura" de ativações e pagamentos já arquivados (passados),
     também navegável por mês.
   - **Perfil** — dados cadastrais (nome/CNPJ/cidade/UF/rua — só leitura) + campos editáveis (chave PIX,
     e-mail, CEP, número, complemento) + dado só-leitura (cupom, valor total do contrato).
6. Sessão expira em 6h de inatividade → qualquer chamada ao servidor detecta e devolve para o Login
   automaticamente, com limpeza de estado local.

Esse é o fluxo inteiro do Portal — não há mais telas além destas 7 (login, pendências, briefing, upload,
pagamentos, histórico, perfil).

### 2.2 Perfil: Equipe Estúdio Elã (ERP)

O fluxo aqui não é linear como um app — é orientado a menu, dentro do Google Sheets, e cada item é uma
ação isolada:

**Início de mês (fluxo mais crítico):**
1. Menu → "Iniciar Novo Mês" → prompt pedindo o nome do mês.
2. Sistema lê todas as influenciadoras marcadas ON na aba BASE, limpa o rascunho de BRIEFING, e gera em
   lote: linhas de ATIVAÇÕES (uma por reel/carrossel/stories contratado), linhas de FLUXO LOGÍSTICO, linhas
   de PAGAMENTOS.
3. Equipe então trabalha diretamente nas abas geradas: preenche datas de ativação (dispara cálculo
   automático de data de aprovação, -7 dias, ajustado para não cair em fim de semana), acompanha status.

**Ao longo do mês:**
- Edição de status em ATIVAÇÕES/PAGAMENTOS/FLUXO dispara arquivamento automático para as abas de
  HISTÓRICO quando o status vira "postado"/"pago"/"entregue" (`onEdit`).
- "Puxar Looks da Planilha Externa" — busca de uma planilha por influenciadora (via `INFLU_SHEET_URL`) os
  looks aprovados por formato, e escreve na aba BRIEFING.
- "Lançar Pagamentos Avulsos do Mês" — gera lançamentos extras a partir da aba BASE.
- "Copiar Mensagem de PIX" / "Copiar Dados de Confirmação (WhatsApp)" — geram texto pronto para copiar e
  colar manualmente no WhatsApp (não há envio automático).
- "Atualizar Rastreios Automáticos" — consulta BRComerce e atualiza status de entrega.
- Sidebars: "Editar Dados da Influenciadora" (formulário lateral) e "Lançar Pagamento Extra/UGC".
- Submenu "Portal de Apoio": enviar/puxar dados entre Mãe e Portal, testar conexão, e abrir o Portal como
  modal para visualização/teste.

**Cadastro de novas influenciadoras:**
- Via formulário Google externo → cai em CADASTROS → `onFormSubmit` normaliza, busca CEP, cria linha OFF em
  BASE. Equipe então ativa manualmente (muda status para ON) quando pronta para entrar em campanha.

**Manutenção/limpeza:**
- "Executar Limpeza e Arquivamento Geral" — roda o arquivamento para as 3 abas de uma vez, sob demanda.
- "Estruturar Planilha (Setup Inicial)" — cria abas de histórico faltantes com cabeçalho padrão.

---

## 3. Todas as telas existentes

### 3.1 Portal de Influenciadoras (7 telas — existem em 2 implementações, mesma estrutura funcional)

#### Tela: Login
- **Finalidade:** autenticar a influenciadora.
- **Informações exibidas:** logotipo/nome da marca.
- **Ações:** preencher cupom, preencher senha, submeter (botão ou Enter).
- **Formulário:** 2 campos (cupom texto, senha — teclado numérico).
- **Estados:** erro inline ("cupom ou senha inválidos" / "preencha cupom e senha" / erro genérico com
  código); botão em estado "entrando..." desabilitado durante a chamada.
- **Sem navegação inferior** (tela isolada).

#### Tela: Pendências (Home)
- **Finalidade:** mostrar as ativações de conteúdo do mês selecionado.
- **Informações exibidas:** saudação com primeiro nome; seletor de mês (◀ JULHO ▶, com limites
  jan–dez); lista de cards, um por ativação.
- **Cada card mostra:** formato (REEL/CARROSSEL/STORIES_1/STORIES_2), selo de status colorido
  (Aguardando material / Em aprovação / Aprovado / Publicado), data de entrega, data de postagem.
- **Ações por card:** "Ver briefing" (se existir) e "Enviar material" (sempre).
- **Estados:** carregando (placeholder de texto), vazio ("nenhuma ativação neste mês"), erro de
  carregamento.

#### Tela: Briefing
- **Finalidade:** detalhar o que deve ser produzido para uma ativação específica.
- **Informações exibidas:** título/formato, tags de mês/formato/data de entrega/data de postagem, texto
  livre do briefing (varia por formato: reel, carrossel, stories 1, stories 2).
- **Ações:** voltar; "Enviar material" (leva para Upload já com a ativação selecionada).
- **Estados:** carregando; "briefing não encontrado para este formato/mês" (mensagem vinda do backend).

#### Tela: Enviar material (Upload)
- **Finalidade:** enviar arquivo(s) de mídia (foto/vídeo) para uma ativação.
- **Ações:** escolher arquivo(s) (múltiplos), ver nome/tamanho selecionado, iniciar envio, tentar
  novamente em caso de falha, voltar para pendências ao final.
- **Estados:** seleção (botão de enviar desabilitado até escolher arquivo) → progresso (barra de % +
  nome do arquivo atual, "arquivo X de N") → sucesso (ícone de check + mensagem) → erro (mensagem
  específica + botão de retry). Upload é resumable (chunks de 8MB, com continuação em caso de
  interrupção parcial via HTTP 308).
- **Sem navegação inferior** (fluxo modal/dedicado).

#### Tela: Pagamentos
- **Finalidade:** acompanhamento financeiro do mês selecionado.
- **Informações exibidas:** seletor de mês; card de resumo (total previsto / total pago); lista de
  lançamentos.
- **Cada item mostra:** valor, tracker visual de 3 etapas (Material enviado → Aguardando pagamento →
  Pago) com a etapa atual destacada, data de pagamento (se já pago).
- **Estados:** carregando, vazio ("nenhum pagamento neste mês"), erro.

#### Tela: Histórico
- **Finalidade:** versão somente-leitura de ativações e pagamentos já arquivados.
- **Informações exibidas:** seletor de mês; duas seções (Ativações, Pagamentos), cada uma com lista de
  itens simples (formato/valor + data).
- **Sem ações** além de navegar (não tem "ver briefing" nem "enviar material" — itens de histórico não
  têm briefing associado).

#### Tela: Perfil
- **Finalidade:** ver dados cadastrais e editar os campos permitidos.
- **Informações exibidas (somente leitura):** nome, CNPJ, cidade, UF, rua, cupom, valor total do
  contrato.
- **Campos editáveis:** chave PIX, e-mail, CEP, número, complemento.
- **Ações:** salvar alterações.
- **Estados:** mensagem de erro ao salvar; toast de sucesso.
- **Observação de dados sensíveis:** a versão design-system (via `configurarVisualDoPortal` em
  `Código.js`) já injeta na planilha um aviso de risco ao lado da chave PIX/CEP ("pagamentos enviados para
  chave incorreta não podem ser estornados") e uma checkbox "DADOS_REVISADOS" — mas isso existe só na
  camada da planilha, **não aparece hoje na tela de Perfil do Portal** em nenhuma das duas
  implementações.

### 3.2 ERP — "telas" dentro do Google Sheets

Não são páginas web tradicionais, mas cada uma é uma superfície de interação distinta que precisa virar
tela num redesenho:

#### "Tela": Menu principal (ERP ELÃ 6.2)
- Menu hierárquico com 4 grupos (Planejamento & Campanhas, Financeiro & PIX, Logística & Envios,
  Cadastros & Configurações) + submenu Portal de Apoio. 15 ações ao todo.

#### "Tela": Prompt "Iniciar Novo Mês"
- Modal nativo do Sheets pedindo um texto (nome do mês) com OK/Cancelar.

#### "Tela"/planilha: BASE DE DADOS
- Grade de cadastro de influenciadoras: status ON/OFF (com cor de linha verde/vermelha automática),
  cupom, nome, e-mail, PIX, CNPJ, endereço completo (preenchido automaticamente por CEP), quantidade de
  reels/carrossel/stories contratados, valor total, link da pasta no Drive, link da planilha de looks.

#### "Tela"/planilha: ATIVAÇÕES
- Uma linha por peça de conteúdo contratada: influenciadora, mês, formato, data de aprovação (calculada),
  data de ativação/postagem, status, link(s) de arquivo enviado.

#### "Tela"/planilha: BRIEFING
- Uma linha por influenciadora/mês, com colunas de "sobre" por formato (reel/carrossel/stories 1/stories
  2) e colunas de data de aprovação por formato, além dos looks aprovados.

#### "Tela"/planilha: PAGAMENTOS
- Influenciadora, mês, valor, chave PIX, status, data de pagamento, mensagem de cobrança gerada.

#### "Tela"/planilha: FLUXO LOGÍSTICO
- Influenciadora, endereço, status de revisão de dados, mês, código de rastreio, data de envio, status
  logístico (atualizado via BRComerce).

#### "Tela"/planilha: HISTÓRICO (3 abas espelho — conteúdo, pagamento, logístico)
- Cópia congelada das linhas arquivadas, com data de arquivamento.

#### Modal: Sidebar "Editar Dados da Influenciadora"
- Select de influenciadora (com sufixo "(OFF)" para inativas) + campos: cupom, valor/cachê, quantidade de
  reels/carrossel/stories, quantidade de looks, prazo de uso de imagem, canais de uso, link da planilha de
  looks. Botão salvar, mensagem de status inline.

#### Modal: Sidebar "Pagamento Extra (UGC)"
- Campo de influenciadora com autocomplete (datalist), mês de referência, valor, chave PIX. Botão
  "Adicionar à Fila".

#### Modal: "Abrir Portal (Modal)"
- Abre a versão design-system do Portal (`PortalApp.html`) dentro de um modal de 1000×800 — usado hoje
  como forma de a equipe visualizar/testar o Portal sem sair da planilha.

#### Não existe hoje (mas há um protótipo desenhado, não ligado a dados reais)
- Um **dashboard administrativo** ("command center") com métricas agregadas (campanhas ativas, total de
  influenciadoras, pagamentos pendentes, aprovações urgentes), lista de campanhas ativas e atividade do
  roster — existe como mockup Stitch com dados fictícios (`views/admin.html` no bundle legado), nunca
  ligado ao backend real. É a peça que mais falta para o ERP deixar de depender só do Google Sheets.

---

## 4. Componentes reutilizáveis (candidatos a Design System)

Extraídos do padrão repetido entre as 7 telas do Portal e do que já está formalizado em `DESIGN.md`:

- **Shell de app** — header (voltar + marca + navegação desktop + sair), navegação inferior mobile (4
  itens com ícone + label), footer.
- **Seletor de mês** — `◀ MÊS ▶`, com estado desabilitado nos extremos (janeiro/dezembro), reaproveitado
  em Pendências, Pagamentos e Histórico.
- **Card de ativação** — formato + selo de status + duas datas + botões de ação.
- **Selo/pill de status** — 4 variações de cor (aguardando, em aprovação, aprovado, publicado); mesmo
  padrão semântico deveria valer para status de pagamento e logística.
- **Card de resumo financeiro** — dois valores lado a lado (previsto/pago).
- **Tracker de etapas horizontal** — usado em Pagamentos (3 etapas), candidato natural também para
  status de aprovação de conteúdo e status logístico.
- **Item de histórico** — linha simples com título + metadado + (opcional) selo.
- **Bloco de perfil** — título de seção + lista de pares label/valor (somente leitura) ou label/input
  (editável).
- **Caixa de upload / dropzone** — estado de seleção, progresso (barra + %), sucesso, erro com retry.
- **Toast** — mensagem temporária, usado para erros de comunicação e confirmações.
- **Botão primário (pill, cor secundária) / botão secundário (hairline)** — já formalizados no
  `DESIGN.md` como a única exceção de borda arredondada do sistema.
- **Input com label acima + hairline inferior** (sem caixa fechada) — padrão de formulário em todo o
  Design System.
- **Menu hierárquico com submenus** (lado ERP) — hoje só existe como menu nativo do Sheets; é o
  equivalente ERP de uma sidebar/nav de admin e deveria virar um componente de navegação real no
  redesenho.
- **Modal de prompt de texto único** (ex: nome do mês) — hoje é um modal nativo do Sheets; precisa de um
  componente de modal/dialog no novo sistema.
- **Tabela de dados densa com cor de status por linha** (BASE, ATIVAÇÕES, PAGAMENTOS, FLUXO) — é o
  componente que mais precisa de tradução cuidadosa: hoje é literalmente uma planilha.

---

## 5. Oportunidades de UX (sem alterar nenhuma regra de negócio)

- **Duas linguagens visuais coexistindo sem necessidade.** `Index.html` (em produção) e a versão
  design-system (`PortalApp.html` e afins, hoje só um modal interno) resolvem exatamente o mesmo
  problema com CSS e identidade diferentes. Isso não é uma regra de negócio — é dívida de UX que o
  redesenho deveria eliminar unificando em uma única linguagem (a do Design System).
- **Mistura de idioma inconsistente.** A versão design-system usa rótulos em inglês minúsculo em alguns
  pontos (`home`, `payments`, `profile`, `terms/privacy/contact`) e português em outros (`histórico`,
  `pagamentos` como texto de dado) — sem critério aparente. Deveria ser unificado em um só idioma para
  o público final (influenciadoras brasileiras).
- **ERP inteiramente dependente da UI nativa do Google Sheets.** Toda a operação diária da equipe
  (gerar mês, lançar pagamento, revisar status) acontece editando células cruas, sem nenhuma visão
  agregada ("quantas ativações estão aguardando aprovação agora?", "quem está com pagamento atrasado?").
  O protótipo "command center" já indica a direção certa, mas nunca foi conectado a dados reais — é a
  maior oportunidade de melhoria de todo o sistema.
- **Feedback de ações críticas é só um `alert()`/prompt nativo do navegador ou do Sheets.** Ações como
  "Iniciar Novo Mês" (que reescreve 3 abas inteiras) ou "Executar Limpeza e Arquivamento Geral" não têm
  nenhuma pré-visualização do impacto (quantas linhas serão geradas/movidas) antes de confirmar — só um
  alerta de texto sim/não.
- **Mensagens de erro técnicas vazando para a influenciadora.** Em `Index.html`, um erro de login não
  mapeado aparece como `"Erro: " + código_bruto` (ex.: `ERRO_INTERNO`) — informação de debug, não uma
  mensagem compreensível para o usuário final.
- **Envio de material sem confirmação do que já foi enviado antes.** A tela de Upload não mostra
  histórico de arquivos já enviados para aquela ativação (só existe o link acumulado internamente, na
  planilha, em `LINK_ARQUIVO`) — a influenciadora não tem como conferir o que já mandou sem perguntar à
  equipe.
- **Densidade de informação alta e sem hierarquia nas planilhas operacionais** (BASE DE DADOS,
  ATIVAÇÕES) — 20+ colunas simultâneas, sem agrupamento visual além de cor de fundo por status. Uma
  versão web dessas telas se beneficiaria de agrupar por seção (dados pessoais / financeiro / conteúdo
  contratado) e ocultar colunas técnicas (IDs de pasta do Drive, por exemplo) do que a equipe vê por
  padrão.
- **Ações destrutivas/irreversíveis sem estado de confirmação forte.** "Executar Limpeza e Arquivamento
  Geral" move e apaga linhas permanentemente; hoje só é protegida por um alerta padrão do navegador.
- **Etapas manuais que poderiam ser automáticas na interface (não na regra de negócio):** "Copiar
  Mensagem de PIX" e "Copiar Dados de Confirmação" geram um texto que a pessoa tem que colar manualmente
  no WhatsApp fora do sistema — a regra de negócio (gerar o texto) não muda, mas a interface poderia
  oferecer um botão "copiar" e indicar visualmente que o texto foi copiado, em vez de depender de um
  prompt de navegador com o texto selecionável.
- **Responsividade:** a versão de produção (`Index.html`) é mobile-first, mas trava em `max-width:480px`
  mesmo em telas maiores — em desktop/tablet sobra uma faixa enorme de espaço vazio. A versão
  design-system já resolve isso parcialmente (breakpoints `md:`), mas ainda não tem uma versão pensada
  para desktop no lado ERP.
- **Acessibilidade:** bom uso de `aria-label` em botões de ícone na versão design-system; falta
  equivalente na versão em produção (`Index.html`) — os botões de seta do seletor de mês não têm label
  para leitor de tela. Contraste de texto secundário sobre fundo (`--cor-texto-suave` / `on-surface-variant`)
  deve ser conferido contra WCAG AA em ambas as paletas.
- **Aviso de dados sensíveis desconectado da tela onde faz sentido.** O aviso de risco sobre chave PIX
  incorreta e a checkbox "dados revisados" já existem na camada de planilha (`configurarVisualDoPortal`),
  mas não aparecem na tela de Perfil do Portal, que é onde a influenciadora realmente edita esse dado.

---

## 6. Requisitos para a nova interface (briefing para a IA de UI)

### 6.1 Telas que precisam existir

**Portal (mobile-first, mas responsivo até desktop):**
1. Login (cupom + senha)
2. Home/Pendências (lista de ativações do mês, navegação por mês)
3. Briefing (detalhe de uma ativação)
4. Enviar material (upload com progresso, incl. múltiplos arquivos)
5. Pagamentos (resumo do mês + lista com tracker de etapas)
6. Histórico (ativações e pagamentos arquivados, somente leitura)
7. Perfil (dados fixos + campos editáveis, incluindo o aviso de risco sobre PIX/CEP)

**ERP (desktop-first, equipe interna):**
8. Dashboard/"command center" — visão agregada (campanhas do mês, pendências de aprovação, pagamentos
   em aberto, atalho para as ações mais usadas do menu) — **tela nova, não existe hoje funcionalmente**,
   mas há um protótipo visual de referência.
9. Gestão de influenciadoras (equivalente web da aba BASE DE DADOS + sidebar de edição) — listagem com
   status ON/OFF, busca, e formulário de edição completo (todos os campos hoje na sidebar).
10. Gestão de ativações/campanha do mês (equivalente web da aba ATIVAÇÕES + BRIEFING) — por
    influenciadora e por formato, com o mesmo fluxo de "iniciar novo mês".
11. Financeiro (equivalente web da aba PAGAMENTOS + lançamento avulso/UGC + geração de mensagem de PIX).
12. Logística (equivalente web da aba FLUXO LOGÍSTICO, incluindo status de rastreio).
13. Fluxo "Iniciar novo mês" como um wizard/modal dedicado (hoje é um prompt de texto único).

### 6.2 Componentes que precisam existir
Ver lista completa na Seção 4. Prioritários: shell (header + nav + footer), seletor de mês, card de
ativação, pill de status, tracker de etapas, bloco de perfil (leitura + edição), dropzone de upload,
toast, tabela de dados densa com filtros (para o lado ERP), modal/dialog, botão primário (pill) e
secundário (hairline).

### 6.3 Como as telas se relacionam
- Portal: fluxo linear a partir do login, com 4 destinos principais acessíveis a qualquer momento pela
  navegação inferior (Pendências, Pagamentos, Histórico, Perfil); Briefing e Upload são sub-telas de
  Pendências, sem nav própria.
- ERP: não tem login — é acessado por quem já tem a planilha aberta/tem acesso à nova ferramenta web.
  Dashboard é o hub; as 4 áreas de gestão (influenciadoras, campanha, financeiro, logística) são
  irmãs entre si, acessíveis por uma navegação lateral ou superior fixa.

### 6.4 Prioridades por fluxo
1. **Login → Pendências → Enviar material** (Portal): é o coração do sistema — sem isso, a influenciadora
   não cumpre a campanha. Prioridade máxima.
2. **Iniciar novo mês** (ERP): dispara toda a operação mensal; segunda prioridade.
3. **Pagamentos** (ambos os lados): sensível o suficiente (dinheiro) para exigir clareza total de estado.
4. Perfil, Histórico, Logística, Gestão de influenciadoras: importantes, mas de menor frequência de uso.

### 6.5 Informações obrigatórias (não podem faltar em nenhuma tela que as envolva)
- Status de aprovação de conteúdo (4 estados fixos: aguardando material, em aprovação, aprovado,
  publicado) sempre visível onde há uma ativação listada.
- Datas de entrega e de postagem/aprovação sempre juntas (nunca uma sem a outra) nos cards de ativação.
- Total previsto e total pago sempre exibidos juntos na tela de Pagamentos (nunca só um dos dois).
- Cupom e valor total do contrato são somente leitura — nunca podem virar campos editáveis na tela de
  Perfil.
- Aviso de risco ao lado de qualquer campo de chave PIX (dado financeiro sensível e não estornável).

### 6.6 Elementos críticos que nunca podem ser removidos
- O conjunto de 4 status de conteúdo e o conjunto de 3 etapas de pagamento — são o vocabulário de estado
  de todo o sistema, vindos diretamente do backend (`normalizarStatusAtivacao`,
  `normalizarStatusPagamento`); a UI pode redesenhar a aparência, nunca reduzir/renomear os estados.
- Upload resumable com progresso por arquivo — a mecânica de negócio (chunks, continuação após
  interrupção) já existe no backend; a UI só precisa expor estado, não pode simplificar para "só um
  spinner".
- Sessão expira e devolve ao login automaticamente — esse comportamento tem que continuar visível/
  comunicado ao usuário (não pode virar uma falha silenciosa).
- Distinção entre dados somente-leitura e editáveis no Perfil — nunca misturar visualmente os dois
  grupos a ponto de parecer que tudo é editável.
- No ERP, qualquer ação que hoje é "arquivar"/mover linhas permanentemente (limpeza geral, arquivamento
  automático) precisa manter uma confirmação explícita antes de executar.

---

## PROMPT FINAL PARA O STITCH

```
Contexto do projeto: Portal de Influenciadoras + ERP interno da Estúdio Elã (agência de marketing de
influência). Este é um redesenho visual de um sistema já existente e funcional em produção — não é um
produto novo. Toda a lógica de negócio, dados, nomes de campos e regras abaixo já existem hoje e devem
ser preservados exatamente como estão. Sua tarefa é *apenas* desenhar a interface.

DESIGN SYSTEM OBRIGATÓRIO (Estúdio Elã) — siga integralmente, não proponha uma identidade visual
alternativa:
- Estilo: minimalismo estrito com toque neo-brutalista, inspirado em editoriais de moda europeus.
  Prioriza espaço em branco como elemento estrutural. Sem sombras, sem gradientes, sem blur.
- Cores: base neutra quente tipo papel — superfícies em tons de #fcf8f8 / #f6f3f2 / #f1edec / #ebe7e7 /
  #e5e2e1; texto principal #1c1b1b, texto secundário #444748/#747878; cor de destaque/ação bordô
  #bc0004 (texto sobre ela sempre branco); erro #ba1a1a. Hairlines (bordas de 1px) em
  rgba(116,120,120,0.2) para separar seções — é a principal ferramenta de hierarquia, no lugar de
  cartões com sombra.
- Tipografia: títulos e destaques em EB Garamond, peso leve (300), sempre minúsculo, com padrão
  alternado de itálico em algumas letras (ex.: "estúdio elã" com i, ú, i, o, e, ã em itálico) como
  assinatura de marca; corpo de texto em Helvetica Neue, minúsculo; labels e metadados em Archivo
  Narrow, minúsculo, com leve tracking. Ícones: Material Symbols Outlined, peso 300, traço fino, nunca
  preenchidos.
- Forma: cantos retos (0px de raio) em todos os elementos, EXCETO o botão de ação primária, que é a
  única exceção permitida e deve ser um pill (raio 999px). Ícones com traço geométrico fino.
- Elevação: estritamente 2D — nunca usar sombra ou blur para separar camadas; usar blocos de cor sólida
  e hairlines.
- Movimento: transições sutis, fade-up de 300–600ms com easing cubic-bezier(0.4, 0, 0.2, 1), nunca
  elástico/bounce.
- Idioma da interface: português do Brasil, minúsculo (seguindo a mesma convenção tipográfica lowercase
  do sistema), sem misturar com inglês.

TELAS A PROJETAR:

Portal da Influenciadora (mobile-first, responsivo até desktop, navegação inferior fixa no mobile):
1. Login — campos: cupom, senha (label "5 primeiros dígitos do CNPJ"). Estados de erro e carregando.
2. Home/Pendências — saudação com nome, seletor de mês, lista de cards de ativação (formato, selo de
   status entre 4 estados fixos: aguardando material / em aprovação / aprovado / publicado, data de
   entrega, data de postagem, botões "ver briefing" e "enviar material").
3. Briefing — detalhe de uma ativação: mês, formato, data de entrega, data de postagem, texto livre do
   briefing, botão para ir a Enviar material.
4. Enviar material — seleção de múltiplos arquivos (foto/vídeo), barra de progresso por arquivo, tela de
   sucesso, tela de erro com opção de tentar novamente.
5. Pagamentos — seletor de mês, cards de total previsto/pago, lista de lançamentos com tracker visual de
   3 etapas (material enviado → aguardando pagamento → pago) e data de pagamento quando aplicável.
6. Histórico — seletor de mês, duas listas somente-leitura (ativações e pagamentos já arquivados).
7. Perfil — bloco de dados fixos (nome, CNPJ, cidade, UF, rua, cupom, valor total do contrato — todos
   somente leitura, visualmente distintos dos campos editáveis), bloco de campos editáveis (chave PIX,
   e-mail, CEP, número, complemento) com aviso de atenção junto ao campo de chave PIX e de CEP
   (mudança de chave PIX incorreta não pode ser estornada; mudança de CEP afeta o envio logístico).

ERP interno (desktop-first, equipe da agência, navegação lateral ou superior fixa):
8. Dashboard/painel geral — métricas do mês (campanhas ativas, influenciadoras no roster, pagamentos
   pendentes, aprovações urgentes), lista de campanhas/ativações que precisam de atenção, atividade
   recente do roster de influenciadoras.
9. Gestão de influenciadoras — listagem com busca e status ativo/inativo, tela de edição com: cupom,
   valor do cachê, quantidade contratada de reels/carrossel/stories, quantidade de looks, prazo de uso
   de imagem, canais de uso, link da planilha de looks, dados cadastrais (nome, e-mail, CNPJ, PIX,
   endereço).
10. Campanha do mês — wizard/tela para iniciar um novo mês (nome do mês + confirmação do que será
    gerado), e visão das ativações geradas por influenciadora/formato com os mesmos 4 estados de status
    do Portal.
11. Financeiro — lista de pagamentos do mês com os mesmos 3 estados de etapa do Portal, ação de lançar
    pagamento avulso/extra (UGC), e geração de mensagem de cobrança pronta para copiar.
12. Logística — lista de envios com endereço, código de rastreio, status logístico, data de envio.

REGRAS INEGOCIÁVEIS:
- Não invente, renomeie ou remova nenhum estado de status (os 4 de conteúdo e os 3 de pagamento são
  fixos, vêm do sistema).
- Não invente campos de dados que não foram listados acima.
- Cupom e valor total do contrato são sempre somente leitura no Perfil — nunca torná-los editáveis.
- Preserve a separação clara entre dados somente-leitura e dados editáveis em qualquer tela de
  cadastro/perfil.
- Ações destrutivas ou irreversíveis (iniciar novo mês, arquivar/limpar dados) precisam de um passo de
  confirmação explícito na interface.
- Este é um redesenho de UI/UX — não proponha mudanças de regra de negócio, de fluxo de aprovação
  financeira, ou de dados coletados.

Entregue os layouts em alta fidelidade, mobile-first para as telas do Portal e desktop-first para as
telas do ERP, prontos para revisão de design antes de qualquer implementação.
```
