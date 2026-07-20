# Auditoria de Regras de Negócio — Legado vs. TEAR V2

**Tipo:** Auditoria (Business Analyst). Não altera código, não propõe arquitetura.
**Data:** 2026-07-20.

## Nota metodológica — qual é o "antes" e qual é o "depois"

Este repositório contém **dois sistemas que já se chamaram "TEAR V2" em algum
momento**, e isso precisa ficar explícito antes de qualquer comparação:

- **Sistema A** (`src/`, Google Sheets + Apps Script) — reescrita DDD do
  sistema de planilha original, especificada em `docs/specs/SPEC-001` a
  `SPEC-035`, governada por `CONTRATO_SOBERANO.md` e ADRs. **É o sistema em
  produção hoje** (`docs/_workspace/TASK_ROUTER.md` §3, log de SPEC-035,
  2026-07-19: OAuth validado, 7 Parceiras reais importadas).
- **Sistema B** (`tear-v2-app/`, Laravel 13 + React 19) — MVP novo,
  documentado em `docs/HANDOFF_PRODUCTIZACAO_TEAR_V2.md` e
  `docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`. **Ainda não está em produção.**
  Nasceu, segundo o próprio `TASK_ROUTER.md` §15, "sem nenhuma SPEC, ADR ou
  entrada neste roteador".

Para efeito desta auditoria:

- **"Operação antiga" / "legado"** = Sistema A (`src/`), incluindo a camada
  física original mapeada em `docs/history/PLANILHA_TEAR_2.0_MAPA.md`
  (planilha `TEAR_V2_OFICIAL.xlsx`). O código de `src/` é tratado como a
  articulação mais confiável das regras de negócio do legado, porque já
  passou por um processo formal de extração de regras (SPEC-001 a SPEC-035,
  aprovado pelo PO) — mais confiável do que reler a planilha bruta.
- **"Sistema novo TEAR V2"** = Sistema B (`tear-v2-app/`). É este que está
  sendo produtizado e é o alvo real da pergunta "o que pode ter se perdido na
  migração".

Fontes lidas: `docs/HANDOFF_PRODUCTIZACAO_TEAR_V2.md`,
`docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`,
`docs/PLANO_IMPLEMENTACAO_TEAR_V2.5.md`, `docs/PRD.md`,
`docs/_workspace/TASK_ROUTER.md`, `docs/RELATORIO_SPRINT_1_FUNDACAO_DADOS.md`,
`docs/PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md`,
`docs/ROADMAP_MESTRE_TEAR_V2.md`, `CONTRATO_SOBERANO.md`,
`docs/specs/SPEC-001/002/003/005/009/012/016/020/023/025/027/030/032/034/035.md`,
`docs/history/PLANILHA_TEAR_2.0_MAPA.md`, `knowledge/sistema-b/*.md`,
todos os módulos de `src/modulos/*.js` e `src/ui/*.html`, e as migrations e
controllers de `tear-v2-app/backend` relevantes a cada categoria (lidos e
conferidos diretamente, não apenas citados por terceiros).

---

# Regras preservadas

O que o TEAR V2 (Sistema B) já mantém corretamente em relação ao legado.

## 1. Cadastro de influenciadoras
- Nasce sempre `Inativa`; ativação é sempre um ato administrativo separado
  (`Parceira::aprovar($admin)`, único ponto de escrita do status) — preserva
  a RN-01 do legado (`src/modulos/Parceira.js`, `Parceira.js` linhas 30-39).
- `User` só é criado no momento da aprovação (convite por token, sem senha em
  texto claro) — evita usuários órfãos de cadastros nunca aprovados.
- CEP resolvido automaticamente (ViaCEP, timeout 3s) e **falha do serviço não
  bloqueia o salvamento** — mesmo comportamento degradável do legado
  (`Perfil.js` linhas 179-236).
- Ausência de CPF é uma decisão consciente nos dois sistemas — TEAR é B2B,
  não há cadastro de pessoa física como consumidor final.
- Validação de dígito verificador de CNPJ — o Sistema B **melhora** o
  legado, que não validava formato/checksum de CNPJ em nenhum lugar.
- RBAC de leitura por papel + dono (`ParceiraPolicy`) implementado.
- Consentimento LGPD (`consentimentos`) e histórico de alteração por campo
  (`historico_alteracoes`) — **não existiam no legado**; é uma melhoria
  genuína, tratada como P0 no próprio `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`
  §5/§18 porque a influenciadora vai editar seus próprios dados sem
  supervisão.

## 2. Campanhas
- Só Parceira `Ativa` pode ser vinculada a uma campanha (`Rule::exists
  status=Ativa`) — preserva a regra "só Ativa entra em novo ciclo".
- Visibilidade da influenciadora é sempre filtrada pelo `parceira_id` da
  sessão autenticada, nunca por parâmetro vindo do cliente — mesmo padrão de
  segurança do legado (`PortalDeConteudoService.js` linhas 144-148).
- Não há `destroy` em nenhum recurso novo; remoção é sempre lógica
  (`status → CANCELADA`), com FKs `restrictOnDelete()` — coerente com a
  postura do legado de nunca apagar dado operacional (`INV-02` do legado).

## 3. Briefings
- O modelo de blocos por tipo de conteúdo foi **corrigido** no Sprint 1
  (2026-07-20, migration
  `2026_07_20_130000_reorganize_briefings_para_1n_por_tipo`) para 1:N por
  `tipo` (`FEED`/`REELS`/`STORIES`/`TIKTOK`/`UGC`), generalizando o modelo de
  4 blocos fixos do legado (Reel/Carrossel/Stories 1/Stories 2) e cobrindo
  formatos que o legado nunca teve (TikTok, UGC).

## 5. Logística
- Nenhuma regra específica preservada — ver "Regras perdidas" abaixo; o
  módulo simplesmente ainda não existe no Sistema B.

## 6. Pagamentos
- Existe um fluxo funcional ponta-a-ponta testado manualmente (`status`
  `PENDENTE → APROVADO → PAGO`, `aprovado_por`/`aprovado_em` registrados).

## 7. Contratos
- Nenhuma regra operacional preservada (não implementado em nenhum dos dois
  sistemas hoje). O desenho proposto no Sistema B (template editável sem
  deploy, placeholders, versionamento imutável por emissão) é coerente com
  os campos de mesclagem que o legado já usava — ver "Regras perdidas".

---

# Regras perdidas

## 1. Cadastro de influenciadoras

- **Razão social ausente.** O legado captura `razão social` como campo
  distinto do nome/apelido (`INFLUENCIADORA_RAZAO_SOCIAL` em
  `BASE DE DADOS`, e no próprio formulário de entrada do Google Forms). A
  tabela `parceiras` do Sistema B (migration
  `2026_07_19_190000_create_parceiras_table.php`, confirmada por leitura
  direta) só tem `nome` — não existe `razao_social` em nenhuma migration ou
  controller do `tear-v2-app` (confirmado por `git grep`, zero ocorrências).
  Sem razão social distinta do nome de exibição, contrato não pode ser
  gerado corretamente para PJs cujo nome fantasia difere da razão social.
- **Campos de uso de imagem ausentes.** `canais_uso_imagem` e
  `prazo_uso_imagem` (escopo e prazo de licenciamento de imagem — campos de
  mesclagem obrigatórios do contrato no legado, `Documento.js` linhas
  117-170) não existem em nenhum lugar do `tear-v2-app` (confirmado por
  `git grep`, zero ocorrências). Sem eles, mesmo o contrato mínimo do
  legado não pode ser reproduzido.
- **`valor_extenso` (valor por extenso) ausente** — mesmo problema, campo de
  mesclagem contratual que não tem equivalente no Sistema B.
- **Flag "sinalizada" (`SIM/NÃO`) sem equivalente.** No legado, esse campo
  controla a elegibilidade para geração do documento "Briefing Formal"
  (`Parceira.js` linha ~498-505). Não há campo equivalente no Sistema B —
  não é possível hoje replicar essa regra de elegibilidade.
- **Nenhuma regra de deduplicação de identidade documentada.** O legado tem
  `ChaveInfluenciadora` com normalização explícita (trim, colapso de espaço,
  comparação case-insensitive). No Sistema B, `nome` é `unique()` no banco,
  mas sem normalização — duas entradas como `"Ana Silva"` e `"ana  silva"`
  não seriam detectadas como duplicatas.
- **Janela de escrita aberta.** `ParceiraController::store`/`update` ficou
  aberto a qualquer usuário autenticado (não só o dono) durante o Sprint 1;
  fechado parcialmente para `PATCH` no commit mais recente (`a81eb19`,
  2026-07-20) — registrado como dívida em
  `docs/RELATORIO_SPRINT_1_FUNDACAO_DADOS.md` §4.1. Tratar como risco em
  aberto até confirmação de que todos os verbos estão fechados.

## 2. Campanhas

- **Não existe compilação mensal em lote.** A operação central do legado —
  "Compilar Mês" (`CompiladorDoMes.executar`, `ColaboracaoMensal.js` linhas
  524-582) — cria, em um único ato administrativo idempotente, uma
  Colaboração Mensal para **toda** Parceira `Ativa` de uma vez, com
  congelamento automático das condições comerciais daquele mês
  (`CondicaoComercialSnapshot`). No Sistema B não existe nenhum processo em
  lote equivalente: `Campanha` e `ParticipacaoNaCampanha` são criadas e
  vinculadas manualmente, uma a uma, sem noção de "mês de referência"
  (`data_inicio`/`data_fim` são datas livres, não `AAAA-MM`). **Isso não é
  um detalhe de implementação — é uma mudança de processo operacional**: o
  time que hoje aciona "Compilar Mês" uma vez por mês passaria a precisar
  criar/vincular manualmente uma participação por influenciadora por
  campanha.
- **Nenhum congelamento ("snapshot") das condições comerciais.** No legado,
  uma vez compilado o mês, alterações posteriores nas condições comerciais
  da Parceira não retroagem sobre meses já compilados (`RN-06`). No Sistema
  B, `valor_contratado`/`reels_qtd`/etc. vivem direto em
  `participacoes_na_campanha`, editáveis a qualquer momento — não há
  mecanismo de congelamento, então uma edição tardia pode alterar
  silenciosamente o valor de uma campanha já em andamento ou até já paga.
- **Nenhum estado terminal/selado com critério de conclusão.** O legado só
  permite selar (arquivar) uma competência quando todas as Entregas estão
  `Publicado`, todos os Envios `Entregue` e todas as Obrigações `Pago`
  (`Arquivamento.js`, RN-07). No Sistema B, `status = ENCERRADA/CANCELADA`
  é uma transição manual sem nenhum critério de completude verificado.
- **Papel `GESTOR_MARCA` / Portal da Marca inexistente** — já documentado
  como decisão de escopo pendente (`TASK_ROUTER.md` §15,
  `PLANO_TECNICO_SPRINT_2…` §5), citado aqui apenas para registro, não é uma
  regra "perdida" e sim uma decisão de produto ainda não tomada.

## 3. Briefings

- **Cálculo automático da data de aprovação interna não existe.** É uma das
  regras mais concretas e verificáveis do legado (`CalculadoraDeAprovacao`,
  `Briefing.js` linhas 277-321, `RN-01`): `data de aprovação interna = data
  de postagem − 7 dias`; se cair em sexta, sábado ou domingo, empurra para a
  segunda-feira seguinte. Não há nenhuma lógica equivalente em
  `tear-v2-app` — a data teria que ser calculada manualmente pela equipe, com
  risco real de deadline interno cair em fim de semana sem ninguém perceber.
- **Nenhum espelhamento automático da data de aprovação para a Logística**
  (`EntregaService.espelharAprovacoes` no legado) — consequência direta de
  o módulo de Logística ainda não existir no Sistema B (ver categoria 5).
- **Suposição não confirmada com o negócio:** o tipo `FEED` do briefing
  reutiliza `carrossel_qtd` como sua contagem contratada
  (`RELATORIO_SPRINT_1…` §2.7/§4.4) — assumido pela equipe técnica, não
  validado com o PO. Se "Feed" e "Carrossel" tiverem sentidos operacionais
  diferentes, a contagem de entregáveis contratados fica errada.
- **Inconsistência de vocabulário entre módulos:** `Material.tipo` usa
  `REELS/STORIES/FOTOS/OUTROS`, enquanto `Briefing.tipo` usa
  `FEED/REELS/STORIES/TIKTOK/UGC`. Não há correspondência 1:1 — um material
  do tipo `TIKTOK`, `UGC` ou `FEED` não tem como ser classificado
  corretamente, e `FOTOS`/`OUTROS` não têm briefing correspondente.

## 4. Produtos e looks

Nem o legado nem o Sistema A (produção atual) jamais modelaram produto,
variante ou estoque — "Looks" no legado é só uma contagem de peças
contratadas (`LOOKS_QTD`) e um campo de texto livre no briefing. Portanto
**não há regra de negócio "perdida" aqui** — é território novo nos dois
sistemas. O que existe é uma especificação (`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`
§9-§10) para a automação por URL, ainda sem nenhuma tabela/model criada.
Como o pedido da auditoria é identificar regras que **precisam existir antes**
dessa automação, o achado relevante é: essas regras já estão especificadas,
mas nunca foram implementadas ou testadas — ver Recomendações.

## 5. Logística

- **O módulo inteiro não existe no Sistema B.** O próprio
  `docs/HANDOFF_PRODUCTIZACAO_TEAR_V2.md` §2/§4 descreve Logística como um
  "placeholder honesto — sem fluxo real em nenhum lugar do sistema".
  Enquanto isso, o legado (Sistema A, em produção) tem um módulo `Envio`
  completo, com duas máquinas de estado independentes (revisão de dados:
  `AguardandoConfirmacao → Confirmado`; jornada física: `Pendente →
  Expedido → Entregue | Cancelado`), regra de não persistir
  endereço/PIX no registro de envio (só leitura ao vivo do cadastro,
  `INV-04`), e geração de mensagem de repasse manual para o operador.
  **Esta é a maior lacuna funcional encontrada nesta auditoria**: hoje,
  toda operação real de retirada/envio depende do Sistema A; se o
  Sistema B assumir a operação sem esse módulo, não há como processar
  envio de produto para nenhuma influenciadora.
- Nenhum equivalente à ficha operacional (retirada/envio com endereço,
  dados da influenciadora e do produto) existe ainda — está apenas
  especificada (`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §11), com a ressalva
  explícita de que depende do módulo de Produtos (categoria 4), que também
  não existe.

## 6. Pagamentos

- **Não existe gate de aprovação de conteúdo antes da liberação de
  pagamento.** Este é o achado mais crítico da categoria. No legado, a
  transição `EmAberto → Aprovado` de uma obrigação mensal exige que
  **todas** as Entregas da Parceira naquele mês estejam `Aprovado` ou
  `Publicado` (decisão do PO, "Q-04, opção B",
  `PagamentoService.exigirConteudoAprovado`, linhas 698-725; erro dedicado
  `PG-05` quando violado). No Sistema B, `PagamentoController::update`
  (`tear-v2-app/backend/app/Http/Controllers/Api/PagamentoController.php`,
  lido diretamente) troca `status` para `APROVADO` ou `PAGO` **sem nenhuma
  verificação cruzada** com o estado de aprovação do material/briefing —
  qualquer chamada válida à rota move o pagamento adiante, mesmo que o
  conteúdo contratado ainda não tenha sido aprovado ou entregue.
- **Camada de autorização do próprio *form request* está aberta.**
  `StorePagamentoRequest::authorize()` e `UpdatePagamentoRequest::authorize()`
  retornam `true` incondicionalmente (lido diretamente nos dois arquivos) —
  qualquer restrição de papel, se existir, está inteiramente delegada a
  middleware de rota não confirmado nesta auditoria. Isso é uma ausência de
  defesa em profundidade em um ponto que no legado é estritamente
  administrador-only.
- **Modelo 1:1 por participação, não por competência.** `pagamentos.
  participacao_id` é `unique()` — um pagamento por participação de
  campanha, diferente do modelo do legado (uma obrigação por Parceira Ativa
  por mês de referência, agregando todas as campanhas daquele mês). Se uma
  influenciadora participar de duas campanhas no mesmo mês, o Sistema B gera
  dois pagamentos independentes onde o legado geraria um só — pode ser
  desejável, mas é uma mudança de modelo financeiro que precisa de decisão
  explícita do negócio, não uma herança automática.
- **Sem distinção Mensal/Avulso.** O legado trata pagamento avulso (ad-hoc,
  sem mês de referência, liberado a critério do administrador,
  explicitamente fora do gate de conteúdo) como um tipo separado. Sem esse
  conceito no Sistema B, não há como hoje registrar um pagamento
  extraordinário sem forçá-lo pelo mesmo fluxo de uma participação de
  campanha.
- **Visão "previsto vs. pago" adiada.** Explicitamente postergada
  (`PLANO_TECNICO_SPRINT_2…` §6.5, "RF-030 fica para entrega futura") — não
  é uma perda silenciosa, está documentada como pendência conhecida.

## 7. Contratos

- **Não implementado em nenhum dos dois sistemas hoje**, mas por motivos
  diferentes: no legado (Sistema A, em produção), a geração de contrato
  existe só como um stub de texto puro (`GeradorDeDocumentosTexto`,
  `Documento.js` linhas 613-693), substituindo o AutoCrat real que a
  planilha original usava (confirmado pela aba de infraestrutura
  `"DO NOT DELETE - AutoCrat Job Se"` em
  `docs/history/PLANILHA_TEAR_2.0_MAPA.md` §11) — **essa já era uma
  regressão registrada como dívida técnica antes mesmo do Sistema B
  existir** (`D-01` em `SPEC-023`), não algo causado pela migração atual.
  No Sistema B, não há nenhuma linha de código — apenas a especificação em
  `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §13/§15 (template editável pelo
  admin sem deploy, placeholders, PDF, envio para assinatura externa,
  imutabilidade por versão emitida).
- Mesmo o modelo mínimo do legado depende de campos que hoje não existem no
  cadastro do Sistema B (razão social, canais e prazo de uso de imagem,
  valor por extenso — ver categoria 1). **Isso significa que, mesmo se o
  módulo de Contratos for implementado no Sistema B hoje, ele não teria de
  onde puxar os dados necessários** sem primeiro fechar a lacuna de
  cadastro.
- Decisões abertas em ambos os sistemas, nunca assumidas por nenhum dos
  dois: provedor de assinatura digital, cláusulas obrigatórias, versões de
  contrato por tipo de campanha, política de vigência/rescisão.

---

# Riscos

Onde a lacuna entre o legado e o TEAR V2 pode causar problema operacional
real se o Sistema B assumir a operação como está hoje.

1. **Pagamento liberado sem conteúdo aprovado.** Como não há gate
   equivalente ao `Q-04`/`PG-05` do legado, um operador (ou um bug de UI) pode
   mover um pagamento para `APROVADO`/`PAGO` mesmo sem a influenciadora ter
   entregue ou aprovado o material contratado. É o risco financeiro mais
   direto encontrado nesta auditoria.
2. **Ruptura no processo mensal de compilação.** A ausência do "Compilar
   Mês" em lote significa que, se a operação migrar para o Sistema B sem
   substituto, a equipe perde a capacidade de criar/congelar condições
   comerciais para todas as influenciadoras ativas de uma vez — vira
   trabalho manual, um a um, com risco de esquecer influenciadoras ativas
   fora de qualquer campanha daquele mês.
3. **Deadline interno de aprovação caindo em fim de semana sem alerta.** Sem
   o cálculo automático de data de aprovação (−7 dias + ajuste para
   segunda), a regra vira dependente de cálculo manual — erro humano
   silencioso, sem nenhum sintoma até o prazo já ter estourado.
4. **Impossibilidade de gerar contrato ou ficha de retirada** mesmo que os
   módulos sejam construídos, porque o cadastro não tem razão social, dados
   de uso de imagem nem valor por extenso — bloqueio descoberto tarde, no
   meio da implementação de Contratos/Logística, se não for endereçado
   antes.
5. **Zero cobertura de logística no Sistema B.** Se houver qualquer
   pressão para acelerar o cutover do Sistema A para o Sistema B antes do
   módulo de Logística existir, a operação de envio de produto para
   fotografar/divulgar simplesmente para de funcionar.
6. **Duplicidade/fragmentação de identidade de influenciadora.** Sem
   normalização de nome (trim/case-insensitive) no Sistema B, cadastros
   duplicados por variação de digitação não são detectados — pode gerar
   pagamento ou contrato para o registro errado.
7. **Janela de escrita insegura no cadastro de Parceira** (mencionada na
   categoria 1) — se não confirmada como totalmente fechada, qualquer
   usuário autenticado pode ter alterado dados de outra Parceira durante o
   período em que a rota esteve aberta.
8. **Contrato do legado já era regressão da planilha original.** Vale
   registrar como risco de expectativa: mesmo o Sistema A "em produção" não
   oferece geração real de contrato hoje (é texto puro, sem AutoCrat/Docs).
   Se o negócio assume que essa capacidade "já existe e só precisa ser
   portada", a expectativa está errada — precisa ser construída do zero em
   ambos os sistemas.

---

# Recomendações

## P0 — impacta operação atual (bloqueante para qualquer cutover do Sistema A para o Sistema B)

1. Implementar o gate de aprovação de conteúdo antes de liberar pagamento
   (`PagamentoController::update`), equivalente à regra `Q-04`/`PG-05` do
   legado — hoje o pagamento pode ser aprovado sem checar o estado do
   material/briefing.
2. Confirmar (ou fechar, se ainda aberto) a autorização de escrita em
   `ParceiraController::store`/`update` e nos *form requests* de Pagamento
   (`authorize()` retorna `true` incondicionalmente hoje) — restringir por
   papel/dono antes de qualquer uso real com dados sensíveis.
3. Adicionar `razao_social`, `canais_uso_imagem`, `prazo_uso_imagem` e
   `valor_extenso` (ou equivalente calculado) ao cadastro de Parceira —
   pré-requisito de dado para Contratos e para qualquer geração documental
   futura, independente de quando o módulo de Contratos for construído.
4. Decidir e implementar um substituto para a compilação mensal em lote
   (ou confirmar formalmente que o modelo por campanha/participação
   individual é a decisão definitiva de produto) — hoje é uma lacuna de
   processo, não só de código.

## P1 — melhoria importante

5. Implementar o cálculo automático da data de aprovação interna
   (postagem −7 dias, ajuste de fim de semana) no módulo de Briefing do
   Sistema B.
6. Confirmar com o negócio a suposição de que `FEED` reutiliza
   `carrossel_qtd`, e alinhar os enums de `Material.tipo` e `Briefing.tipo`.
7. Especificar e construir o módulo de Logística (ficha de
   retirada/envio) — mesmo uma versão simplificada, dado que hoje o
   Sistema B não tem nenhum fluxo real.
8. Adicionar normalização de identidade (trim + case-insensitive) na
   checagem de duplicidade de `nome`/Parceira.
9. Modelar explicitamente a distinção Mensal/Avulso em Pagamentos, ou
   confirmar que o modelo 1:1 por participação substitui essa necessidade.
10. Avaliar se falta um mecanismo de congelamento ("snapshot") das
    condições comerciais de uma participação de campanha, para evitar que
    edição tardia altere retroativamente uma campanha em andamento ou já
    paga.

## P2 — futuro SaaS

11. Construir o módulo de Produtos/Variantes/Estoque e a automação por URL
    conforme já especificado (`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`
    §9-§10), respeitando as regras já definidas ali: nome extraído da URL é
    só referência, nunca fonte operacional; salvar exige variante
    confirmada (cor obrigatória, tamanho obrigatório quando há mais de uma
    opção); disponibilidade checada no momento da confirmação, não da
    extração.
12. Construir o módulo de Contratos (template editável, placeholders, PDF,
    assinatura externa) conforme especificado — mas só depois do item P0-3
    (campos de cadastro necessários) estar resolvido.
13. Papel `GESTOR_MARCA` / Portal da Marca — decisão de escopo de produto
    ainda pendente, sem regra de negócio herdada do legado para orientar
    (o legado nunca teve conceito de Marca).
14. Definir política de retenção/expurgo de dados (LGPD) — já registrada
    como pendência aberta desde o Sistema A (`Q-09`) e ainda não resolvida
    em nenhum dos dois sistemas.
