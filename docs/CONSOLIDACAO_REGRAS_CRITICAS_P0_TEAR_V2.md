# Consolidação de Regras Críticas P0 — TEAR V2

**Tipo:** Plano (etapa 1 de 3 antes do Portal completo).
**Base:** `docs/AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md` (auditoria aprovada em
2026-07-20).
**Sequência acordada:**

1. **Consolidar regras críticas P0** — este documento.
2. **Ajustar modelo de operação** — mudanças de dados/regras no
   `tear-v2-app/backend` que este documento especifica, ainda sem tocar o
   Portal.
3. **Construir portal em cima disso** — só depois de 1 e 2 fechados, para não
   construir tela sobre modelo que ainda vai mudar.

Cada bloco abaixo traz: regra de origem (legado), estado atual (Sistema B),
requisito consolidado, modelo de dados afetado, critério de aceite e, quando
aplicável, uma pergunta que precisa de decisão do PO antes da etapa 2 —
marcada como 🟠, seguindo a mesma convenção usada nas SPECs do Sistema A.

---

## P0-1 — Trava de pagamento por aprovação de conteúdo

**Regra de origem (legado, `PagamentoService.exigirConteudoAprovado`):**
`EmAberto → Aprovado` só é permitido se todas as Entregas da Parceira
naquela competência estiverem `Aprovado` ou `Publicado`. Zero entregas no
mês = elegível por vacuidade. Erro dedicado (`PG-05`) quando violado.

**Estado atual (Sistema B):** `PagamentoController::update` troca `status`
livremente entre `PENDENTE`/`APROVADO`/`PAGO`, sem checar `Material` ou
`Briefing`. `authorize()` dos form requests retorna `true` sempre.

**Requisito consolidado:**
- Antes de `status` mudar para `APROVADO`, verificar que todo `Material`
  vinculado à `ParticipacaoNaCampanha` daquele pagamento está em estado
  aprovado (equivalente a `Aprovado`/`Publicado` do legado).
- Se não houver nenhum `Material` esperado para a participação, a transição
  é permitida (mesma vacuidade do legado).
- Violação deve gerar erro de negócio explícito e legível (não um 500
  genérico), equivalente ao `PG-05`.
- Restringir a transição de status a papéis administrativos — hoje qualquer
  usuário autenticado com acesso à rota consegue aprovar.

**Modelo de dados afetado:** `pagamentos` (nenhuma coluna nova
necessária); leitura cruzada de `materiais`/`briefings` da mesma
`participacao_id`.

**Critério de aceite:** tentar aprovar um pagamento com material pendente
retorna erro e não altera o status; aprovar com todo material aprovado
funciona; participação sem material esperado aprova normalmente.

🟠 **Pergunta para o PO:** o legado usa "Aprovado *ou* Publicado" como
suficiente (publicação não é obrigatória para liberar pagamento). Confirmar
se essa é a regra desejada no Sistema B, ou se a operação quer publicação
obrigatória antes de pagar.

---

## P0-2 — Dados contratuais

**Regra de origem (legado, `Documento.js` `CamposDeMesclagem`):** geração de
contrato exige razão social, CNPJ, endereço, quantidades contratadas, valor
(numeral e por extenso), canais e prazo de uso de imagem, cidade e data de
assinatura — todos obrigatórios, falha rápida se ausentes.

**Estado atual (Sistema B):** `parceiras` não tem `razao_social`,
`canais_uso_imagem`, `prazo_uso_imagem` nem `valor_extenso`. Quantidades
contratadas já existem, mas em `participacoes_na_campanha`
(`reels_qtd`/`carrossel_qtd`/`stories_qtd`/`tiktok_qtd`/`ugc_qtd`), não em
`parceiras` — mudança de local que precisa ser considerada no desenho do
merge de contrato, não necessariamente um erro.

**Requisito consolidado:**
- Adicionar a `parceiras`: `razao_social` (string, distinta de `nome`),
  `canais_uso_imagem` (texto/enum a definir), `prazo_uso_imagem` (texto ou
  data).
- `valor_extenso`: decidir se é campo persistido ou calculado on-demand a
  partir de `valor_contratado`/`valor` (numeral → extenso é uma função
  determinística; não precisa necessariamente ser coluna).
- `cidade_assinatura`/`data_assinatura`: são dados do evento de assinatura,
  não do cadastro — modelar como parte do futuro registro de contrato (P2
  na auditoria), não como coluna de `parceiras`. Citado aqui só para
  registrar a dependência.
- Este item **não implementa** o módulo de Contratos (isso é P2) — apenas
  garante que o cadastro tenha os dados que o módulo de Contratos vai
  precisar quando for construído, evitando retrabalho de schema depois.

**Modelo de dados afetado:** `parceiras` (novas colunas nullable, sem
quebrar cadastros existentes).

**Critério de aceite:** cadastro de Parceira aceita e persiste os três
campos novos; nenhum cadastro existente quebra (colunas nullable).

🟠 **Pergunta para o PO:** `canais_uso_imagem` no legado era texto livre
vindo de planilha. Confirmar se no Sistema B deve virar uma lista fechada de
opções (ex.: Instagram, TikTok, site, mídia paga) ou continuar texto livre.

---

## P0-3 — Snapshot / compilação mensal

**Regra de origem (legado, `CompiladorDoMes` + `CondicaoComercialSnapshot`):**
um único ato administrativo cria, para toda Parceira `Ativa`, uma
Colaboração Mensal com as condições comerciais congeladas naquele instante;
idempotente (recompilar não sobrescreve); edições posteriores na Parceira
não retroagem sobre meses já compilados.

**Estado atual (Sistema B):** não existe conceito de mês de referência nem
de compilação em lote. `Campanha` tem datas livres; `ParticipacaoNaCampanha`
é criada e editada manualmente, uma a uma, sem congelamento.

**Requisito consolidado — dividido em duas decisões separadas, porque
misturam modelo de dados com modelo de processo:**

1. **Congelamento (snapshot), independente de haver ou não compilação em
   lote:** ao confirmar/ativar uma `ParticipacaoNaCampanha`, os valores
   comerciais (`valor_contratado`, quantidades por formato) devem parar de
   ser editáveis livremente, ou toda edição posterior deve gerar um
   histórico auditável (reaproveitando o padrão já existente de
   `historico_alteracoes` usado em Parceira) — para que uma alteração
   tardia não altere silenciosamente uma campanha em andamento ou já paga.
2. **Compilação em lote:** avaliar se algum processo deve replicar
   "vincular todas as Parceiras Ativas a uma campanha/período de uma vez",
   ou se o modelo atual (vínculo manual por campanha) é a decisão de
   produto definitiva. Esta é a decisão de maior impacto operacional do
   documento — não deve ser assumida silenciosamente.

**Modelo de dados afetado:** `participacoes_na_campanha` (mecanismo de
congelamento — coluna de estado tipo `congelado_em`/`status` adicional, ou
reuso do padrão de histórico já existente); possível necessidade de reação
em lote sobre `parceiras.status = Ativa`.

**Critério de aceite:** editar valor/quantidade de uma participação
congelada é bloqueado ou gera registro auditável explícito; decisão sobre
compilação em lote está documentada e aprovada antes da etapa 2 avançar
neste ponto específico.

🟠 **Pergunta para o PO (bloqueante para este item específico, não para os
demais):** a operação quer manter o ritmo de "todo mês, vincular todas as
influenciadoras ativas de uma vez" (modelo do legado), ou o modelo por
campanha individual (atual do Sistema B) já reflete como a operação
funciona hoje na prática? A resposta muda o desenho de tela do Portal
(passo 3), então precisa ser resolvida antes dele.

---

## P0-4 — Logística

**Regra de origem (legado, `Envio.js`):** módulo completo com duas máquinas
de estado independentes (revisão de dados de entrega; jornada física de
envio), endereço/PIX nunca persistidos no registro de envio (só lidos ao
vivo do cadastro no momento da confirmação), geração de mensagem de repasse
manual para o operador.

**Estado atual (Sistema B):** módulo inexistente — nenhuma tabela, nenhuma
rota, nenhuma tela.

**Requisito consolidado (versão mínima viável para operar, não a paridade
completa do legado):**
- Uma entidade de Envio por `ParticipacaoNaCampanha` (ou por Parceira ×
  Campanha, a confirmar), com um status simples de jornada:
  `Pendente → Expedido → Entregue` (+ `Cancelado`).
- Endereço de entrega lido do cadastro da Parceira no momento da consulta,
  **nunca duplicado/persistido** na tabela de Envio — repete a regra de
  proteção de PII do legado (`INV-04`), que é mais rígida do que o legado
  original de Pagamentos (que persistia PIX diretamente) e deve ser tratada
  como padrão a seguir, não como opcional.
- Campo de código de rastreio (texto livre, opcional).
- Sem integração real de transportadora nesta fase — mensagem de repasse
  manual para o operador é aceitável (o próprio legado nunca teve
  integração real; é dívida técnica antiga, não uma barra que o Sistema B
  precisa superar agora).

**Modelo de dados afetado:** nova tabela `envios` (ou nome equivalente),
FK para `participacoes_na_campanha`, sem colunas de endereço/PIX.

**Critério de aceite:** é possível registrar um envio, mudar seu status até
`Entregue`, e consultar o endereço de destino sem que ele fique gravado na
tabela de envio.

---

## P0-5 — Regras de briefing

**Regra de origem (legado, `CalculadoraDeAprovacao`):** `data de aprovação
interna = data de postagem − 7 dias`; se cair em sexta, sábado ou domingo,
empurra para a segunda-feira seguinte. Sempre derivada, nunca editável
manualmente.

**Estado atual (Sistema B):** nenhuma lógica de cálculo de data de
aprovação existe; `Briefing` tem `prazo` como campo livre.

**Requisito consolidado:**
- Ao definir/editar a data de postagem de um `Briefing`, calcular
  automaticamente a data de aprovação interna com a mesma regra (−7 dias,
  ajuste de fim de semana para segunda-feira).
- Este valor deve ser sempre derivado (recalculado quando a data de
  postagem muda), nunca um campo livre editável diretamente — mesma
  invariante do legado (`INV-03`).
- Resolver, junto com o PO, a suposição não confirmada já registrada na
  auditoria: se `FEED` deve reutilizar `carrossel_qtd` como contagem
  contratada, ou ter contagem própria.

**Modelo de dados afetado:** `briefings` — adicionar coluna derivada
`data_aprovacao_interna` (calculada, não recebida via input do usuário).

**Critério de aceite:** criar/editar um briefing com data de postagem numa
sexta/sábado/domingo gera data de aprovação interna na segunda-feira
seguinte; datas em dias úteis geram exatamente −7 dias corridos.

🟠 **Pergunta para o PO:** confirmar o mapeamento `FEED` ↔ `carrossel_qtd`
mencionado acima — necessário antes de fechar a etapa 2 para este item.

---

## Ordem sugerida para a etapa 2 (Ajustar modelo de operação)

Sem dependência técnica forte entre os 5 itens — podem ser feitos em
paralelo por diferentes desenvolvedores. A ordem abaixo prioriza risco
financeiro e bloqueio de dados primeiro:

1. **P0-1** (trava de pagamento) — maior risco financeiro direto, menor
   escopo de mudança (lógica, sem schema novo).
2. **P0-2** (dados contratuais) — schema aditivo simples, destrava P2 de
   Contratos mais cedo.
3. **P0-5** (regras de briefing) — lógica isolada, sem dependência de
   decisão de PO além do mapeamento FEED.
4. **P0-4** (logística) — maior escopo (tabela nova + fluxo novo), mas sem
   decisão de PO pendente.
5. **P0-3** (snapshot/compilação) — feito por último porque tem a decisão
   de PO de maior impacto (modelo de compilação em lote vs. individual) e
   pode mudar o desenho de tela do Portal; não vale travar os outros 4 itens
   esperando essa resposta.

## Perguntas em aberto para o PO (resumo)

| # | Pergunta | Bloqueia |
|---|---|---|
| 1 | Publicação obrigatória para liberar pagamento, ou aprovação basta (como no legado)? | P0-1 |
| 2 | `canais_uso_imagem`: lista fechada ou texto livre? | P0-2 |
| 3 | Manter compilação mensal em lote (modelo legado) ou vínculo individual por campanha (modelo atual)? | P0-3 e desenho do Portal |
| 4 | `FEED` reutiliza `carrossel_qtd` ou tem contagem própria? | P0-5 |

Nenhuma dessas perguntas bloqueia o início da etapa 2 como um todo — cada
uma bloqueia apenas o item específico indicado. Itens sem pergunta em aberto
podem começar imediatamente.
