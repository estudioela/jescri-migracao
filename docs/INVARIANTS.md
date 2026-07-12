# Invariantes de Domínio — TEAR V2

> **Fontes (exclusivas):** [`docs/PLANILHA_TEAR_1.0_MAPA.md`](./PLANILHA_TEAR_1.0_MAPA.md) (contrato funcional), [`docs/DOMAIN_MODEL.md`](./DOMAIN_MODEL.md) (modelo de domínio) e as *Diretrizes de Engenharia para o Projeto Tear*.
> **Natureza:** regras que **nunca** podem ser violadas. São o núcleo de correção do domínio — devem ser impostas por construção/verificação (Diretriz §5: "prefira erros de compilação a erros de runtime"), nunca por disciplina manual.
> **Escopo:** Fase 2.5 — consolidação arquitetural. Não altera os documentos de referência; complementa-os. Nenhuma linha de código, tecnologia ou framework é proposta.
> **Convenção:** cada invariante traz **enunciado**, **porquê**, **onde é imposta** (ponto único responsável) e **status** (`FIRME` = derivável do contrato funcional; `A CONFIRMAR` = depende de validação com a operação antes de fechar). Invariantes `A CONFIRMAR` **não** devem ser preenchidas por suposição.

---

## Como ler este documento

- Uma invariante é uma proposição que o sistema mantém verdadeira em **todo** estado observável — antes e depois de qualquer operação.
- "Onde é imposta" nomeia o **único** guardião responsável (Diretriz §4/§5: ponto único obrigatório). Se uma invariante não tem guardião claro, ela é uma dívida — está marcada.
- Severidade indica o **impacto de uma violação** (dinheiro, envio errado, perda de trabalho), não a probabilidade.

---

## 1. Identidade e unicidade

### INV-1 — Identidade estável da Parceira `[FIRME]`
**Enunciado:** toda Parceira possui uma identidade própria e imutável, independente do nome de exibição. Nenhuma junção entre agregados usa o nome como chave.
**Porquê:** o nome é frágil a grafias divergentes e homônimos (mapa, inconsistência #1: `PATIXA TELO` vs `Patixa Telo`). Renomear jamais pode dividir ou fundir o histórico de uma pessoa.
**Onde é imposta:** no ato de promoção Inscrição→Parceira (cunhagem da identidade). Depois disso, a identidade é somente-leitura.
**Severidade:** ALTA. Convergência: Domain Expert, DDD (D1), Data Modeling (I-1/I-3).

### INV-2 — Uma Parceira por pessoa `[A CONFIRMAR]`
**Enunciado:** uma mesma pessoa origina **no máximo uma** Parceira, ainda que submeta o formulário mais de uma vez.
**Porquê:** duas Inscrições promovidas para a mesma pessoa recriam a fragmentação de identidade que INV-1 elimina, com risco de **pagamento à pessoa errada** (Data Modeling, R-7/K-2).
**Onde é imposta:** na promoção — verificação de Parceira preexistente antes de cunhar nova identidade. **Chave de deduplicação a definir** (nome é insuficiente; candidatos: e-mail + documento fiscal). Depende de haver e-mail/documento confiável e único nos dados atuais.
**Severidade:** ALTA.

### INV-3 — Ciclo único por Referência Mensal `[FIRME]`
**Enunciado:** não existem dois Ciclos para a mesma Referência Mensal (mês + ano).
**Porquê:** o Ciclo é o escopo de todo o operacional; duplicá-lo duplica agenda, envios e pagamentos do mês.
**Onde é imposta:** no serviço de geração/abertura de Ciclo, com unicidade sobre (mês, ano) — não sobre a string do mês (mapa, inconsistência #2).
**Severidade:** ALTA. (DDD, I5.)

### INV-4 — Referência Mensal sempre carrega o ano `[FIRME]`
**Enunciado:** um Ciclo é sempre identificado por (mês, ano); nunca por nome de mês isolado.
**Porquê:** "JULHO" não distingue anos e é sensível a acentuação/caixa (mapa, inconsistência #2).
**Onde é imposta:** no Value Object `ReferenciaMensal`, que é a única forma de referir um Ciclo.
**Severidade:** MÉDIA.

---

## 2. Ciclo e geração do mês

### INV-5 — A geração do mês é idempotente e aditiva `[FIRME]`
**Enunciado:** executar a geração do mês para um Ciclo mais de uma vez **nunca** sobrescreve, zera ou recria agregados já materializados (Ativações com datas/status, Briefings publicados, Pagamentos, Envios). Reexecutar só cria o que ainda **não existe** (p.ex. uma Parceira ativada depois da primeira geração).
**Porquê:** este é o risco de corrupção de maior impacto operacional identificado (Data Modeling, R-2) e coincide com uma preocupação já registrada no projeto ("regenerar mês"). Uma segunda geração ingênua apagaria todo o trabalho do mês — datas preenchidas, status `POSTADO`, pagamentos `PAGO`.
**Onde é imposta:** no serviço `GeradorDeCicloMensal`, como operação de reconciliação (cria ausentes, preserva existentes). É o **ponto único obrigatório** da geração.
**Severidade:** ALTA (crítica). Elevada a invariante de primeira linha — o modelo de domínio não a tornava explícita.

### INV-6 — Só Parceiras ATIVAS entram no Ciclo `[FIRME]`
**Enunciado:** a geração de um Ciclo inclui **exatamente** as Parceiras com status `ATIVA` no momento da geração; nenhuma Parceira `INATIVA` gera operacional.
**Porquê:** STATUS ON/OFF governa a participação (mapa, regra #3).
**Onde é imposta:** `GeradorDeCicloMensal`.
**Severidade:** ALTA.

### INV-7 — Regra do "mês seguinte" `[FIRME]`
**Enunciado:** a Referência Mensal de um Ciclo é o mês **imediatamente seguinte** ao dia da geração, com transição correta de ano (geração em dezembro → janeiro do ano seguinte).
**Porquê:** regra explícita do contrato funcional (mapa, regra #2). A borda dezembro→janeiro é um ponto de falha real (Data Modeling, R-5).
**Onde é imposta:** `CalculadoraDeReferenciaMensal`, operando sobre (mês, ano) como unidade indivisível.
**Severidade:** MÉDIA.

### INV-8 — Todo agregado operacional pertence a exatamente um Ciclo e uma Parceira `[FIRME]`
**Enunciado:** toda Ativação, Briefing, Envio e Pagamento referencia, por identidade, exatamente um Ciclo existente e uma Parceira existente. Não há operacional órfão.
**Porquê:** o substrato de origem (planilha) não tem integridade referencial; nada impede um item apontar para Ciclo/Parceira inexistente (Data Modeling, K-1/R-6).
**Onde é imposta:** na criação (geração do mês valida as referências) e proibindo remoção de Parceira/Ciclo que deixe itens pendurados. Enquanto o substrato não impuser isso por construção, é **dívida técnica declarada**, não disciplina silenciosa (Diretriz §7, pergunta 5).
**Severidade:** ALTA.

---

## 3. Correspondência Ativação ↔ Briefing (a Peça)

### INV-9 — Quantidade de Ativações = quantidades do Contrato `[FIRME]`
**Enunciado:** o número de Ativações de uma Parceira num Ciclo é exatamente a soma das quantidades **produtoras de peça** do Contrato — reels + carrosséis + stories. **Looks não geram Ativação.**
**Porquê:** mapa, regra #7. `LOOKS` é insumo do Briefing, não peça de conteúdo (Domain Expert; Data Modeling, C-2). Contar looks como Ativação criaria peças-fantasma.
**Onde é imposta:** `GeradorDeCicloMensal`, ao materializar as Ativações a partir de `QuantidadesDeEntrega`.
**Severidade:** ALTA.

### INV-10 — Correspondência 1↔1 entre Ativação e ItemDeBriefing por (Formato, ordinal) `[FIRME]`
**Enunciado:** para cada (Parceira, Ciclo), existe uma bijeção entre as Ativações e os itens de Briefing, pareados por **Formato + ordinal**. Não há Ativação sem item de briefing correspondente, nem item órfão. `STORIES_1` casa com o item de stories nº 1, `STORIES_2` com o nº 2, e assim por diante.
**Porquê:** o pareamento **posicional** herdado da planilha (slots fixos `STORIES 1`/`STORIES 2`, mapa aba BRIEFING) sobrescreve a data de um stories quando há dois, gerando aprovação fora de prazo (Data Modeling, C-1/R-8). O ordinal deve fazer parte da chave de pareamento, não ser um slot fixo.
**Onde é imposta:** na geração do Briefing e em qualquer reagendamento — o item é localizado pela identidade da Ativação (idealmente) ou por (Formato, ordinal), nunca por posição de coluna.
**Severidade:** ALTA. Convergência: Domain Expert, DDD (E1), Data Modeling (C-1), Event Storming (L12).

### INV-11 — Ordinal de stories é ilimitado `[A CONFIRMAR]`
**Enunciado:** o número de stories por Parceira num Ciclo não tem limite fixo de 2; o ordinal cresce conforme a quantidade contratada.
**Porquê:** o Contrato admite quantidade livre de stories, mas o Briefing da planilha só tem dois slots (mapa, aba BRIEFING). Um contrato com 3+ stories deixaria peças sem briefing (Data Modeling, C-3; Business Analyst, C1).
**Onde é imposta:** modelagem do Formato e da coleção de `ItemDeBriefing` (coleção de tamanho N, não slots fixos).
**Severidade:** MÉDIA. **A confirmar:** máximo de stories previsto em contrato.

---

## 4. Snapshot vs. referência (verdade histórica)

### INV-12 — Política única de congelamento na geração `[FIRME — resolve contradição do modelo]`
**Enunciado:** todo dado que um agregado operacional deriva do Contrato/Parceira é **congelado (snapshot)** no momento em que o agregado é materializado, e não muda retroativamente quando a Parceira muda depois.
**Porquê:** o modelo de domínio é **contraditório** — §3.7 diz que o Pagamento é "referência" viva ao fee; §9 e §3.2 dizem "snapshot" e "Ciclos já gerados não são retroativamente alterados". Referência viva permitiria a cobrança de julho exibir o fee alterado em agosto (Data Modeling, O-1/R-3; DDD, V3/D3/D4). Arbitragem do Arquiteto: **vale snapshot**, coerente com §3.2 e com a natureza financeira do dado.
**Onde é imposta:** em cada agregado, no ato de criação (`CicloGerado`). Ver detalhamento em INV-13/INV-14.
**Severidade:** ALTA.

### INV-13 — Fee e PIX do Pagamento são snapshot `[FIRME]`
**Enunciado:** o fee e a chave PIX de um Pagamento são fixados no momento da geração do Ciclo e não se alteram por mudanças posteriores no Contrato da Parceira.
**Porquê:** o que foi acordado para aquele mês é o que se paga; alterar contrato não pode reescrever cobranças de meses já gerados (mapa, inconsistência #9; §3.2 do modelo).
**Onde é imposta:** materialização do Pagamento na geração. Substitui a redação "referência" de DOMAIN_MODEL §3.7 (registrado em Observações Arquiteturais — o modelo em si não é alterado).
**Severidade:** ALTA.

### INV-14 — Endereço de entrega é snapshot no despacho `[A CONFIRMAR]`
**Enunciado:** o endereço de um Envio é o Endereço da Parceira congelado no momento do **despacho** da remessa.
**Porquê:** se a Parceira muda de endereço entre a geração do mês e o envio, o produto deve ir ao endereço vigente no despacho, não ao da geração (Data Modeling, O-2). O modelo diz "no momento do envio" (§3.6), o que é compatível — mas o instante exato (geração vs. despacho) precisa ser fixado.
**Onde é imposta:** registro do Envio / marcação de despacho.
**Severidade:** MÉDIA. **A confirmar:** instante do snapshot (recomendação do Arquiteto: despacho).

### INV-15 — Campos "por extenso" são sempre derivados `[FIRME]`
**Enunciado:** valor por extenso, looks por extenso e afins são **calculados** a partir do dado numérico; nunca armazenados como verdade paralela nem usados como fonte.
**Porquê:** na planilha coexistem número e extenso e podem divergir por digitação (mapa, inconsistência #8). O numérico é a fonte.
**Onde é imposta:** `ConversorDeValorPorExtenso` (função pura). Na migração, o extenso legado é **descartado e recalculado**, não copiado.
**Severidade:** BAIXA.

### INV-16 — O Histórico é um registro terminal e imutável `[A CONFIRMAR na forma]`
**Enunciado:** um item arquivado (Ativação `POSTADO`, Pagamento `PAGO`) está **no operacional XOR no Histórico** — nunca nos dois, nunca em nenhum. O arquivamento é atômico. O Histórico preserva os dados suficientes do item (não um ponteiro que possa apontar para dado mutável/ausente).
**Porquê:** arquivamento em dois passos (copiar+apagar) com falha entre eles pode fazer um pagamento aparecer como aberto **e** pago (risco de **pagar duas vezes**) ou sumir (Data Modeling, K-3/R-4). Registro financeiro histórico não pode depender de referência viva.
**Onde é imposta:** `PoliticaDeArquivamento`, como transição atômica única.
**Severidade:** ALTA. **A confirmar:** se "arquivar" remove do operacional (recomendado) ou apenas marca — decisão de negócio (Domain Expert, A3).

---

## 5. Máquinas de estado

### INV-17 — Transições de Ativação restritas ao grafo declarado `[A CONFIRMAR — grafo incompleto]`
**Enunciado:** o estado de uma Ativação só muda por transições explicitamente permitidas. `POSTADO` é terminal (não retorna ao fluxo ativo).
**Porquê:** o modelo declara `EM_ABERTO → {APROVADO | AJUSTES | FALTA_DRIVE} → POSTADO`, mas **não define os retornos**: `AJUSTES` (conteúdo reprovado) e `FALTA_DRIVE` (material não subido) são pendências que devem **voltar** ao fluxo quando resolvidas, não saltar para `POSTADO` (Business Analyst, E1/E2). Um grafo linear é ambíguo.
**Onde é imposta:** o próprio agregado Ativação (consistência forte intra-agregado).
**Severidade:** ALTA. **A confirmar:** grafo completo de transições (quais retornos são permitidos).

### INV-18 — Transições de Pagamento restritas; bloqueios podem coexistir `[A CONFIRMAR]`
**Enunciado:** o estado de um Pagamento só muda por transições permitidas; `PAGO` é terminal. `FALTA_NF` e `FALTA_DRIVE` são **bloqueios documentais** que impedem `PAGO`, e podem ocorrer simultaneamente.
**Porquê:** o modelo lista `EM_ABERTO → {AGUARDANDO | FALTA_NF | FALTA_DRIVE} → PAGO` como se fossem estados exclusivos e sequenciais, mas faltar NF **e** faltar material são condições que coexistem (Business Analyst, E5). Modelá-las como um único estado esconde isso.
**Onde é imposta:** agregado Pagamento.
**Severidade:** MÉDIA. **A confirmar:** se `FALTA_NF`/`FALTA_DRIVE` são estados ou um conjunto de pendências; semântica de `AGUARDANDO` (aguarda a Parceira ou a marca).

### INV-19 — Enums são conjuntos fechados `[FIRME]`
**Enunciado:** nenhum fluxo trata "qualquer outro caso" silenciosamente. Um novo formato/status/canal exige tratamento explícito em todos os pontos afetados.
**Porquê:** Diretriz §5 (prefira erro de compilação a erro de runtime).
**Onde é imposta:** definição dos enums e dos pontos que os consomem.
**Severidade:** MÉDIA.

### INV-20 — Conjuntos de enum não confirmados não são preenchidos por suposição `[FIRME]`
**Enunciado:** `StatusLogistica`, `StatusRevisaoLogistica` e `TipoChavePix` só recebem seus casos completos após confirmação com a operação/transportadora. Até lá, permanecem explicitamente abertos.
**Porquê:** inventar casos cria um contrato falso (modelo de domínio, §9; Diretriz §5).
**Onde é imposta:** disciplina de modelagem; qualquer valor fora do conjunto confirmado é rejeitado, não adivinhado.
**Severidade:** MÉDIA.

---

## 6. Regra temporal de aprovação

### INV-21 — Aprovação = publicação − 7 dias, evitando fim de semana `[FIRME]`
**Enunciado:** a data de aprovação de cada peça é a data de publicação menos 7 dias; se cair em sábado ou domingo, desloca para a segunda-feira seguinte.
**Porquê:** regra explícita e testável (mapa, regra #10; modelo §3.5).
**Onde é imposta:** `CalculadoraDeDataDeAprovacao`, invariante **do Briefing** (não é uma regra transversal difusa — DDD, R1).
**Severidade:** ALTA.

### INV-22 — Mudança de data de publicação recalcula a aprovação `[FIRME]`
**Enunciado:** sempre que a data de publicação de uma Ativação muda, a data de aprovação do item de Briefing correspondente é **recalculada**. Não pode existir aprovação calculada sobre uma data de publicação obsoleta.
**Porquê:** hoje só há evento de **agendamento** inicial (`AtivaçãoAgendada`); nada propaga uma alteração posterior de data, deixando a aprovação permanentemente desatualizada (DDD, I4/M-Ev1; Data Modeling, O-3; Event Storming, L12). Ver evento `AtivaçãoReagendada` no catálogo.
**Onde é imposta:** reação do Briefing ao evento de reagendamento.
**Severidade:** ALTA.

### INV-23 — Tratamento de feriados na regra data−7 `[A CONFIRMAR]`
**Enunciado:** *(pendente)* a regra data−7 considera apenas fim de semana; feriados nacionais/municipais **não** estão tratados no contrato funcional.
**Porquê:** uma aprovação pode cair em feriado, e deslocar para segunda pode reduzir a antecedência efetiva abaixo dos 7 dias (Business Analyst, C6). O contrato funcional só fala de sábado/domingo — não invento a regra de feriado.
**Severidade:** MÉDIA. **A confirmar:** feriados entram? Há antecedência mínima garantida?

---

## 7. Dados tipados na fronteira

### INV-24 — O domínio nunca recebe dado bruto ambíguo `[FIRME]`
**Enunciado:** PIX, documento fiscal e CEP entram no domínio já tipados e validados. O domínio jamais manipula o texto bruto.
**Porquê:** Diretriz §2 (ACL); mapa, inconsistências #3/#4.
**Onde é imposta:** ponto de contato único de entrada (normalizador de fronteira). **A confirmar:** que exista um único normalizador, não validação espalhada por agregado (Data Modeling, T-4).
**Severidade:** ALTA.

### INV-25 — Value Objects rejeitam valores malformados; nunca completam por suposição `[FIRME]`
**Enunciado:** `Endereço`, `DocumentoFiscal` e `ChavePix` **rejeitam** um valor com dígitos faltando; não preenchem zeros à esquerda nem "corrigem" por adivinhação.
**Porquê:** CEP/CNPJ já vieram truncados na origem (notação científica — perda irreversível de zeros/hífen, mapa inconsistência #4). Completar com zeros produziria endereço/documento errado e **envio para o lugar errado** (Data Modeling, T-1). A recuperação exige revalidar contra a fonte menos corrompida (Forms) ou revisão humana — não normalização cega.
**Onde é imposta:** construção dos Value Objects + passo de migração dedicado.
**Severidade:** ALTA.

### INV-26 — Classificação de PIX é conservadora `[FIRME]`
**Enunciado:** quando o tipo de uma chave PIX é ambíguo (ex.: 11 dígitos = CPF **ou** telefone), a chave é marcada como "a classificar" e exige confirmação humana. O sistema **nunca adivinha** o tipo.
**Porquê:** PIX toca dinheiro; classificar telefone como CPF leva a **pagamento em chave errada** (Data Modeling, T-2). Estende a INV-20 ao `TipoChavePix`.
**Onde é imposta:** normalizador de fronteira + revisão na migração.
**Severidade:** ALTA. **A confirmar:** haverá revisão humana das chaves ambíguas.

---

## 8. Contrato e cupom

### INV-27 — Alterações de contrato não são retroativas `[FIRME]`
**Enunciado:** alterar o Contrato de uma Parceira vale a partir da alteração; Ciclos já gerados mantêm os termos vigentes quando foram gerados (garantido pelos snapshots — INV-12/13).
**Porquê:** modelo §3.2.
**Onde é imposta:** agregado Parceira + snapshots dos operacionais.
**Severidade:** ALTA.

### INV-28 — Vigência do contrato governa elegibilidade `[A CONFIRMAR]`
**Enunciado:** *(pendente)* o `PRAZO` do contrato (ex.: "1 ano") define um período de vigência; ao expirar, a Parceira deixa de ser elegível à geração até renovação.
**Porquê:** hoje **nada consome o prazo** — uma Parceira com contrato vencido continuaria entrando no mês (Business Analyst, R2; Domain Expert/DDD, Contrato temporal V1). Isso levanta a questão de o Contrato ser Value Object (como no modelo) ou **entidade com vigência**.
**Severidade:** ALTA. **A confirmar:** o negócio precisa de vigência/histórico contratual? Se sim, o Contrato passa a ter início/fim (decisão de domínio adiada — ver Observações).

### INV-29 — Cupom com valor padrão derivado, unicidade a definir `[A CONFIRMAR]`
**Enunciado:** o cupom nasce do padrão determinístico `NOME+10`, mas é **editável** pelo admin.
**Porquê:** o modelo o trata como Value Object derivado imutável (§4), mas o contrato funcional diz "deseja-se editável" (mapa, BASE col C) — há tensão entre determinístico e editável (DDD, V2). Se editável, o cupom tem valor default derivado, não é função pura permanente do nome.
**Severidade:** MÉDIA. **A confirmar:** o cupom é único? Edição sobrescreve o padrão? Como se resolve colisão de nomes?

---

## 9. Cidade-base

### INV-30 — Cidade-base é constante da marca, distinta do endereço da Parceira `[FIRME]`
**Enunciado:** a origem logística/fiscal é sempre Nova Friburgo, e nunca é confundida com a cidade do endereço de entrega da Parceira.
**Porquê:** a planilha colide os dois sob o mesmo rótulo "CIDADE" (mapa, inconsistência #6).
**Onde é imposta:** constante de domínio da marca (o Arquiteto **rejeita** modelá-la como invariante entre agregados — é um Value Object/constante da marca usado pelo Envio, não uma regra transversal; DDD, R1).
**Severidade:** BAIXA.

---

## Observações Arquiteturais

> Registro de tensões e decisões que **não** alteram `DOMAIN_MODEL.md` nem `PLANILHA_TEAR_1.0_MAPA.md` (ambos permanecem como referência), conforme instrução da Fase 2.5.

**OA-1 — Contradição "snapshot vs. referência" no modelo.** `DOMAIN_MODEL.md` §3.7 descreve o fee do Pagamento como "referência" à Parceira, enquanto §9/§3.2 falam em "snapshot" e não-retroatividade. Este documento arbitra **snapshot** (INV-12/13). A redação do modelo permanece como está; a decisão vale para a implementação.

**OA-2 — Ativação × Briefing como duas identidades da mesma Peça.** O modelo mantém os dois agregados separados "por fidelidade ao contrato funcional" e adia a unificação para "a fase de arquitetura" (§9). Cinco revisores classificam a separação como decisão **de domínio**, não só de arquitetura, por risco de divergência de dados. Decisão do Arquiteto para esta fase: **não unificar agora**, mas impor INV-10 (bijeção por Formato+ordinal) e INV-22 (recálculo em reagendamento). A unificação plena (uma entidade Peça com duas facetas) fica como recomendação forte para a fase de implementação — reduz um agregado, um evento de coordenação e a entidade `ItemDeBriefing`.

**OA-3 — Proposta de agregado `ParticipaçãoNoCiclo` — não aceita.** O DDD Reviewer propôs um novo agregado que possua o conjunto de peças/itens de uma (Parceira, Ciclo) para hospedar as invariantes coletivas (INV-9, INV-10). **Decisão do Arquiteto: rejeitada por ora.** Justificativa: introduzir um agregado só para hospedar contagem adiciona complexidade e uma transação ampla; as mesmas invariantes coletivas podem ser garantidas no **ponto único da geração** (`GeradorDeCicloMensal`, INV-5/9/10), coerente com Diretriz §5 (controle em ponto obrigatório). Reavaliar apenas se surgir comportamento contínuo (não só de criação) que exija um guardião vivo do conjunto.

**OA-4 — Histórico: conceito de primeira classe vs. projeção.** Três revisores (Domain Expert A3, DDD A3, Data Modeling K-3) recomendam rebaixar o Histórico de agregado a **estado terminal + read model**. O modelo o trata como "conceito de suporte" (§3.8), o que é compatível. Decisão: manter o Histórico como registro terminal atômico (INV-16); **não** modelá-lo como agregado com comportamento próprio. Consulta ("acervo") é read model.

**OA-5 — Bounded Contexts — recomendação estratégica, não imposta agora.** O DDD Reviewer identifica ao menos quatro contextos (Captação/Cadastro, Operação de Conteúdo, Logística, Financeiro). Alinha-se à Diretriz §4 ("crescer por domínio de negócio"). Como delimitar contextos é decisão de **arquitetura** — fora do escopo desta fase — fica **registrado** como direção para a implementação, sem reestruturar o modelo agora.

**OA-6 — Marca/Remetente como conceito ausente.** A Cidade-base e o polo dos Contratos/Envios/Pagamentos hoje se reduzem à constante "Nova Friburgo" (Domain Expert). Se surgir mais de uma marca, será preciso um conceito de Marca/Remetente. Registrado; sem ação nesta fase (uma única marca).

**OA-7 — Gates inter-processo pendentes de confirmação.** Dois bloqueios são sugeridos pelos revisores mas **não** estão fechados no contrato funcional: (a) recebimento do produto como pré-requisito da produção (o mapa diz "pré-requisito para a produção", linha 102 — mas a forma de imposição não está definida); (b) conteúdo `POSTADO` como pré-condição para `PAGO` (inferido da presença de `FALTA_DRIVE` no pagamento). Não os elevo a invariante firme sem confirmação — ver USE_CASES (fluxos alternativos) e a lista de dúvidas.

---

## Índice de severidade (visão rápida)

| Sev. | Invariantes |
|---|---|
| **ALTA** | INV-1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 16, 17, 21, 22, 24, 25, 26, 27, 28 |
| **MÉDIA** | INV-4, 7, 11, 14, 18, 19, 20, 23, 29 |
| **BAIXA** | INV-15, 30 |

**Invariantes que mais protegem contra corrupção de alto impacto:** INV-5 (idempotência da geração), INV-2/INV-1 (identidade na promoção), INV-13 (snapshot de fee), INV-10 (pareamento por ordinal), INV-16 (arquivamento atômico), INV-25/26 (rejeição de dado malformado / PIX conservador).

---

*Fim das Invariantes — TEAR V2 (Fase 2.5). Documento de consolidação arquitetural; não altera os documentos de referência.*
