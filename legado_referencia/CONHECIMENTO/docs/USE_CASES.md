# Casos de Uso — TEAR V2

> **Fontes (exclusivas):** [`docs/PLANILHA_TEAR_1.0_MAPA.md`](./PLANILHA_TEAR_1.0_MAPA.md), [`docs/DOMAIN_MODEL.md`](./DOMAIN_MODEL.md), [`docs/INVARIANTS.md`](./INVARIANTS.md), [`docs/EVENT_CATALOG.md`](./EVENT_CATALOG.md) e as *Diretrizes de Engenharia*.
> **Natureza:** casos de uso de **negócio** — pré-condições, fluxo principal, fluxos alternativos e pós-condições. Referenciam invariantes (`INV-n`) e eventos do catálogo; não os recopiam (Diretriz §3).
> **Escopo:** Fase 2.5. Não altera os documentos de referência. Sem código, tecnologia ou framework.
> **Ator "Admin"** = operação do Estúdio Elã. **"Sistema"** = comportamento de domínio automático. **"Externo"** = candidata, transportadora ou serviço de CEP (sempre via ACL).

---

## Índice

**Captação e cadastro:** UC-01 Registrar inscrição · UC-02 Promover inscrição · UC-03 Rejeitar inscrição · UC-04 Gerar/atualizar contrato · UC-05 Ativar/desativar parceira
**Ciclo:** UC-06 Gerar o mês · UC-14 Encerrar o ciclo
**Conteúdo:** UC-07 Agendar ativação · UC-08 Reagendar ativação · UC-09 Publicar briefing · UC-10 Avançar produção do conteúdo
**Logística:** UC-11 Registrar envio e acompanhar entrega
**Financeiro:** UC-12 Solicitar pagamento · UC-13 Confirmar pagamento
**Suporte:** UC-15 Arquivar item terminal

---

## Captação e cadastro

### UC-01 — Registrar inscrição
- **Ator:** Candidata (externo).
- **Objetivo:** registrar a candidatura bruta.
- **Pré-condições:** nenhuma.
- **Fluxo principal:**
  1. A candidata submete o formulário (nome pretendido, e-mail, PIX, razão social, documento, CEP, número, complemento).
  2. O sistema registra **uma** Inscrição preservando fielmente o submetido → `InscriçãoRecebida`.
- **Fluxos alternativos:**
  - **A1 — Dados incompletos/lixo:** a Inscrição é registrada mesmo assim (é intake). A triagem (UC-02/03) decide. Não há validação que rejeite no intake — dados de teste convivem com reais (mapa, inconsistência #5).
  - **A2 — Recandidatura:** a mesma pessoa submete de novo → nova Inscrição. A deduplicação ocorre na promoção (UC-02, INV-2), **não** aqui.
- **Pós-condições:** existe uma Inscrição pendente de triagem. Nenhuma Parceira é criada (P-1: sem promoção automática).

### UC-02 — Promover inscrição a parceira
- **Ator:** Admin (curadoria).
- **Objetivo:** transformar uma candidatura aprovada em Parceira, cunhando sua identidade estável.
- **Pré-condições:** existe uma Inscrição; o admin decidiu aprová-la.
- **Fluxo principal:**
  1. O admin seleciona a Inscrição e confirma a promoção.
  2. O sistema **verifica se já existe Parceira para aquela pessoa** (INV-2). Não existindo, cunha a **identidade estável** (INV-1) → `InscriçãoPromovida`.
  3. Materializa a Parceira com nome de exibição, dados fiscais e endereço bruto → `ParceiraCadastrada`.
  4. Dispara enriquecimento de endereço por CEP (ACL) → `EndereçoEnriquecido` (P-2) e geração do cupom `NOME+10` → `CupomGerado` (P-3).
- **Fluxos alternativos:**
  - **A1 — Já existe Parceira para a pessoa:** a promoção **não** cria segunda identidade; vincula/atualiza a existente (INV-2). Evita divisão/fusão de identidade e pagamento à pessoa errada.
  - **A2 — Chave de deduplicação indisponível:** se não há e-mail/documento confiável para deduplicar, a promoção exige **revisão humana** antes de cunhar identidade (INV-2, `A CONFIRMAR`).
  - **A3 — CEP/documento malformado na origem:** o Value Object **rejeita** o valor truncado (INV-25); o campo vai para revisão, não é completado por suposição.
  - **A4 — PIX ambíguo:** classificado como "a classificar", pendente de confirmação humana (INV-26); não se adivinha o tipo.
- **Pós-condições:** existe **no máximo uma** Parceira por pessoa, com identidade estável. Endereço e cupom em processamento.

### UC-03 — Rejeitar inscrição
- **Ator:** Admin.
- **Objetivo:** descartar formalmente uma candidatura (lixo, incompleta, fora de perfil).
- **Pré-condições:** existe uma Inscrição não promovida.
- **Fluxo principal:** o admin rejeita a Inscrição → `InscriçãoRejeitada`; ela sai da fila de triagem com rastro de rejeição.
- **Pós-condições:** a Inscrição está encerrada; nenhuma Parceira criada. (Preenche a lacuna do caminho negativo — Event Storming L7.)

### UC-04 — Gerar / atualizar contrato
- **Ator:** Admin.
- **Objetivo:** definir ou alterar fee, entregáveis (reels/carrosséis/stories/looks), canais e prazo.
- **Pré-condições:** Parceira cadastrada.
- **Fluxo principal (geração inicial):**
  1. O admin preenche os termos e a **data de geração**.
  2. O sistema fixa o Contrato e calcula a Referência Mensal-alvo = mês seguinte (INV-7) → `ContratoGerado` (P-4).
- **Fluxo principal (atualização):**
  1. O admin altera os termos → `ContratoAtualizado`.
  2. A alteração vale a partir de agora; **Ciclos já gerados não mudam** (INV-27, P-14) — garantido pelos snapshots (INV-12/13).
- **Fluxos alternativos:**
  - **A1 — Virada de ano:** geração em dezembro → Referência Mensal de janeiro do **ano seguinte** (INV-7).
  - **A2 — Prazo vencido:** *(a confirmar — INV-28)* se o negócio adotar vigência, uma Parceira com contrato expirado deixa de ser elegível à geração até renovação. Hoje nada consome o prazo.
- **Pós-condições:** a Parceira tem Contrato vigente; os operacionais futuros usarão seus valores como snapshot.

### UC-05 — Ativar / desativar parceira
- **Ator:** Admin.
- **Objetivo:** controlar a participação da Parceira nos Ciclos.
- **Pré-condições:** Parceira cadastrada com Contrato.
- **Fluxo principal:** o admin liga (`ATIVA`) ou desliga (`INATIVA`) o status → `ParceiraAtivada` / `ParceiraDesativada`. Só Parceiras `ATIVA` entram na geração (INV-6).
- **Fluxos alternativos:**
  - **A1 — Desativação no meio do mês:** *(a confirmar — regra ausente, Business Analyst R1)* o operacional já gerado (Ativações/Envio/Pagamento) **permanece** por padrão, pois os snapshots já foram tirados; o que muda é a **não-participação nos próximos** Ciclos. A política de cancelamento/pró-rata do mês corrente precisa de decisão de negócio.
- **Pós-condições:** o status governa a próxima geração; Ciclos já abertos não são afetados retroativamente.

---

## Ciclo

### UC-06 — Gerar o mês *(caso de uso central)*
- **Ator:** Admin.
- **Objetivo:** abrir um Ciclo e materializar o operacional das Parceiras ativas.
- **Pré-condições:** há Parceiras `ATIVA`; a Referência Mensal-alvo está definida (mês seguinte).
- **Fluxo principal:**
  1. O admin dispara a geração.
  2. O sistema garante a unicidade do Ciclo para a Referência Mensal (INV-3/4) → `CicloGerado`.
  3. Para cada Parceira `ATIVA` (INV-6), materializa **de forma idempotente** (INV-5):
     - Ativações em número igual às quantidades do Contrato — reels + carrosséis + stories; **looks não geram Ativação** (INV-9);
     - Esqueleto de Briefing com um `ItemDeBriefing` por peça, pareado por (Formato, ordinal) (INV-10);
     - Um Envio (endereço a congelar no despacho, INV-14);
     - Um Pagamento com fee/PIX **congelados** (snapshot, INV-13) e mensagem de cobrança derivada (P-11).
  4. Ordena a agenda (alfabética → cronológica, P-6).
- **Fluxos alternativos:**
  - **A1 — Reexecução da geração (crítico):** rodar de novo para o mesmo Ciclo **não** sobrescreve nada já materializado — datas, status `POSTADO`, pagamentos `PAGO`, briefings publicados são preservados; só se cria o que falta (INV-5). *Este é o principal risco de corrupção do sistema (Data Modeling R-2); a geração é reconciliação, não recriação.*
  - **A2 — Parceira ativada após a geração:** uma reexecução **adiciona** o operacional dessa Parceira ao Ciclo já aberto, sem tocar nos demais (INV-5).
  - **A3 — Parceira sem entregáveis (quantidades = 0):** *(a confirmar — Business Analyst C2)* cria 0 Ativações e 0 itens de briefing; se ainda cria Envio/Pagamento é decisão de negócio.
  - **A4 — Contrato com 3+ stories:** gera `STORIES_1..N` e N itens de briefing (INV-11, `A CONFIRMAR` o máximo). A capacidade **não** é limitada a 2 slots como na planilha.
- **Pós-condições:** o Ciclo existe uma única vez; cada Parceira ativa tem seu operacional consistente (INV-8, INV-9, INV-10); nada preexistente foi perdido.

### UC-14 — Encerrar o ciclo `[A CONFIRMAR]`
- **Ator:** Admin ou Sistema (temporal).
- **Objetivo:** marcar formalmente o fim do mês operacional.
- **Pré-condições:** fim do `PeriodoOperacional` **ou** decisão do admin.
- **Fluxo principal:** o Ciclo é encerrado → `CicloEncerrado` (P-15).
- **Fluxos alternativos:**
  - **A1 — Itens pendentes na virada:** *(a confirmar — Business Analyst F4/R6)* peças não postadas / pagamentos não pagos ao encerrar: arrastam para o mês seguinte, ficam como pendência, ou bloqueiam o encerramento? Decisão de negócio.
- **Pós-condições:** o mês está fechado; relatórios do Ciclo consolidados. **Preenche a lacuna** "o Ciclo nunca fecha" (Event Storming L1). Se o encerramento é manual ou automático fica em aberto.

---

## Conteúdo

### UC-07 — Agendar ativação
- **Ator:** Admin.
- **Objetivo:** definir a data prevista de publicação de uma peça.
- **Pré-condições:** a Ativação existe (criada em UC-06); status `EM_ABERTO`.
- **Fluxo principal:**
  1. O admin define a data de publicação da Ativação → `AtivaçãoAgendada`.
  2. O Briefing recebe a data no item correspondente, pareado por (Formato, ordinal) (P-7, INV-10).
  3. O sistema calcula a data de aprovação = publicação − 7, evitando fim de semana (INV-21) → `DataDeAprovaçãoCalculada` (P-8).
- **Fluxos alternativos:**
  - **A1 — Peça sem data ainda:** o item de briefing fica sem aprovação calculada até a data existir (Business Analyst C7).
- **Pós-condições:** a peça tem data de publicação e aprovação coerentes no Briefing.

### UC-08 — Reagendar ativação
- **Ator:** Admin.
- **Objetivo:** mudar a data de publicação de uma peça já agendada.
- **Pré-condições:** a Ativação tem data; ainda não é terminal.
- **Fluxo principal:**
  1. O admin altera a data → `AtivaçãoReagendada`.
  2. O Briefing **recalcula** a data e a aprovação do item correspondente (INV-22, P-7/P-8).
- **Pós-condições:** não existe aprovação calculada sobre data obsoleta. *(Fecha a lacuna mais citada: mudança de data que não se propagava — DDD I4/M-Ev1, Data Modeling O-3.)*

### UC-09 — Publicar briefing
- **Ator:** Admin.
- **Objetivo:** disponibilizar a orientação criativa da Parceira no Ciclo.
- **Pré-condições:** existe Briefing (esqueleto de UC-06); resumo do mês e "sobre" preenchidos; looks referenciados do acervo externo.
- **Fluxo principal:** o admin publica → `BriefingPublicado`. Alterações posteriores → `BriefingAtualizado`.
- **Fluxos alternativos:**
  - **A1 — Look alterado no acervo após publicação:** *(a confirmar — DDD V5)* se o acervo externo muda, a orientação publicada pode divergir; decidir se o look também é congelado na publicação.
- **Pós-condições:** a orientação está disponível para produção/aprovação.

### UC-10 — Avançar a produção do conteúdo
- **Ator:** Admin.
- **Objetivo:** conduzir a peça pela máquina de estados até `POSTADO`.
- **Pré-condições:** Ativação `EM_ABERTO`; *(a confirmar — gate)* produto recebido, se o recebimento for pré-requisito da produção (P-10, OA-7).
- **Fluxo principal:**
  1. Admin aprova → `ConteúdoAprovado`.
  2. Admin anexa o link do material da pasta do mês → `MaterialAnexado`.
  3. Admin marca `POSTADO` → `ConteúdoPostado` (terminal); dispara arquivamento (UC-15).
- **Fluxos alternativos:**
  - **A1 — Ajustes:** admin marca `AJUSTES` → `AjusteSolicitado`; a peça **retorna** ao fluxo quando refeita (INV-17, retorno `A CONFIRMAR`), não salta para `POSTADO`.
  - **A2 — Falta material no Drive:** estado `FALTA_DRIVE`; resolve-se quando o link é anexado, retornando ao fluxo (INV-17).
  - **A3 — Reabertura pós-terminal:** *(a confirmar — Business Analyst E4)* marcar `POSTADO` por engano: existe estorno auditável ou é proibido? Hoje "não retorna" (INV-16); a exceção operacional precisa de decisão.
- **Pós-condições:** a peça está postada e arquivada, ou em pendência explícita com caminho de retorno.

---

## Logística

### UC-11 — Registrar envio e acompanhar entrega
- **Ator:** Admin (registro/rastreio manual); Transportadora (externo, via ACL).
- **Objetivo:** despachar o produto e acompanhar até a entrega.
- **Pré-condições:** Envio criado em UC-06; endereço da Parceira disponível (`EndereçoEnriquecido`).
- **Fluxo principal:**
  1. Admin registra o envio; o endereço de entrega é **congelado no despacho** (INV-14) → `EnvioRegistrado`; carimbo automático da data de envio.
  2. Admin cola o código de rastreio (manual) → rastreio informado.
  3. A transportadora atualiza o status (ACL) → `RastreioAtualizado`; ao indicar entrega → `ProdutoEntregue` (P-9).
  4. Admin/sistema confirma o recebimento → `RecebimentoConfirmado`, liberando a produção (P-10).
- **Fluxos alternativos:**
  - **A1 — Integração de rastreio inexistente:** enquanto a API (brcomerce) não existe (inconsistência #11), o status é atualizado manualmente; `ProdutoEntregue` sem gatilho externo automático (OA-E3).
  - **A2 — Extravio / rastreio parado:** *(a confirmar — Business Analyst C3)* o `StatusLogistica` nunca chega a "entregue": trava a produção? E o pagamento? Falta política de exceção logística.
  - **A3 — Reenvio (segundo pacote):** *(a confirmar — Data Modeling C-2)* o modelo é 1 Envio por (Parceira, Ciclo); um segundo rastreio não teria onde ir. Avaliar Envio 1→N com um "principal".
  - **A4 — Endereço muda entre geração e despacho:** vale o endereço no **despacho** (INV-14), não o da geração.
- **Pós-condições:** o produto está a caminho/entregue com rastreio; recebimento confirmado habilita a produção.

---

## Financeiro

### UC-12 — Solicitar pagamento
- **Ator:** Admin.
- **Objetivo:** emitir a cobrança do fee do mês.
- **Pré-condições:** Pagamento criado em UC-06 (fee/PIX em snapshot, INV-13); mensagem de cobrança derivada (P-11).
- **Fluxo principal:** o admin solicita → `PagamentoSolicitado`, usando a mensagem de WhatsApp pronta.
- **Fluxos alternativos:**
  - **A1 — Bloqueios documentais:** `FALTA_NF` e/ou `FALTA_DRIVE` impedem avançar; **podem coexistir** (INV-18). Semântica de `AGUARDANDO` a confirmar (Business Analyst E5/E6).
  - **A2 — Gate conteúdo→pagamento:** *(a confirmar — OA-7)* se o pagamento exige conteúdo `POSTADO`, a solicitação/confirmação depende das Ativações do (Parceira, Ciclo).
- **Pós-condições:** a cobrança foi emitida; o pagamento aguarda confirmação ou resolução de pendências.

### UC-13 — Confirmar pagamento
- **Ator:** Admin.
- **Objetivo:** registrar o pagamento efetuado.
- **Pré-condições:** Pagamento sem bloqueios pendentes (NF e material entregues, INV-18).
- **Fluxo principal:** o admin marca `PAGO` → `PagamentoConfirmado` (terminal); dispara arquivamento (UC-15).
- **Fluxos alternativos:**
  - **A1 — Nunca há NF:** *(a confirmar — Business Analyst C5)* MEI/pessoa física sem NF: o pagamento trava indefinidamente ou há exceção (pagar sem NF)?
  - **A2 — Pagamento parcial:** *(a confirmar — Business Analyst C4)* a máquina só tem `PAGO` (binário); adiantamento/parcial não é representável hoje.
- **Pós-condições:** o pagamento está pago e arquivado atomicamente (INV-16).

---

## Suporte

### UC-15 — Arquivar item terminal
- **Ator:** Sistema (`PoliticaDeArquivamento`).
- **Objetivo:** mover um item que atingiu estado terminal para o Histórico.
- **Pré-condições:** uma Ativação atingiu `POSTADO` **ou** um Pagamento atingiu `PAGO`.
- **Fluxo principal:** o item é arquivado em **transição atômica única** (INV-16) → `ItemArquivado` / `PagamentoArquivado`; sai do operacional e passa ao Histórico com os dados necessários preservados.
- **Fluxos alternativos:**
  - **A1 — Falha no meio (prevenida por design):** por ser atômico, o item **nunca** fica simultaneamente no operacional e no Histórico (evita pagar duas vezes) nem desaparece (INV-16). Um arquivamento em dois passos seria violação.
  - **A2 — Granularidade:** arquiva-se **por peça** (Ativação individual), não o Briefing inteiro; o Briefing não é arquivado enquanto houver peça não terminal (Data Modeling R-4).
- **Pós-condições:** o item está no Histórico (imutável) e fora do fluxo ativo; consultável como acervo.

---

## Observações Arquiteturais

**OA-U1 — Fluxos alternativos marcados `A CONFIRMAR` são decisões de negócio pendentes**, não omissões do modelo. Concentram-se em: ciclo de vida da Inscrição já coberto (UC-02/03); desativação no meio do mês (UC-05 A1); encerramento do Ciclo e itens pendentes (UC-14); gates recebimento→produção (UC-10 pré-cond., UC-11) e conteúdo→pagamento (UC-12 A2); exceções logísticas e financeiras (UC-11 A2/A3, UC-13 A1/A2). Devem ser validados com a operação antes de virarem contrato fechado.

**OA-U2 — O caso de uso mais sensível é UC-06 (gerar o mês).** Concentra as invariantes coletivas (INV-5, 6, 8, 9, 10, 13) e o maior risco de corrupção (reexecução destrutiva). A idempotência (A1/A2) é obrigatória, não opcional.

**OA-U3 — Simetria com o catálogo.** Cada caso de uso mapeia comandos e eventos de [`EVENT_CATALOG.md`](./EVENT_CATALOG.md); cada regra crítica cita a invariante de [`INVARIANTS.md`](./INVARIANTS.md). Nenhuma regra é redefinida aqui (Diretriz §3: link, não cópia).

---

*Fim dos Casos de Uso — TEAR V2 (Fase 2.5). Documento de consolidação; não altera os documentos de referência.*
