# TEAR V2.5 — Plano Final de Congelamento Operacional (P0-2)

**Data:** 2026-07-20
**Papel do autor:** Tech Lead de execução (agente).
**Escopo:** exclusivamente `tear-v2-app/` (Laravel 13 + React/Vite). Não
toca no Portal legado GAS (`src/`) nem em `CONTRATO_SOBERANO.md`.
**Status: decisão de arquitetura. Nenhum código, migration ou tela foi
criado/alterado para produzir este documento.**

## 0. Fontes desta análise

Este documento não reabre debate já resolvido nas três sessões
anteriores desta mesma trilha — consolida e fecha a decisão a partir
delas, mais leitura direta do schema atual:

1. `docs/archive/pagamento-snapshot/PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` — já rejeitou
   `campanha_snapshots` e `ativacao_mensal`, já concluiu que a
   granularidade correta é `ParticipacaoNaCampanha`, já propôs
   `congelado_em`.
2. `docs/archive/pagamento-snapshot/ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md` — já confirmou
   que `Pagamento` não suporta recorrência hoje (constraint de banco) e
   que isso é ortogonal ao congelamento.
3. `docs/archive/pagamento-snapshot/CHECKPOINT_POS_ANALISE_PAGAMENTO_SNAPSHOT.md` — checkpoint que
   registra as decisões acima como já tomadas, recomendando avançar com
   "(a) só `congelado_em`" independente da resposta do PO sobre
   recorrência.
4. `docs/archive/auditorias/AUDITORIA_MODELO_DADOS_TEAR_V2.md` — schema completo, 18
   migrations, risco 4 (log de auditoria acoplado a `Parceira`, não
   polimórfico).
5. `docs/planning/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.6/§3.7 — desenho
   de comportamento (não schema físico) de Logística e Contratos, que
   consomem o congelamento.
6. `docs/planning/ROADMAP_MESTRE_TEAR_V2.md` Parte 2, Fase 3/4 — schema físico já
   antecipado para `products`/`product_variants`/`shipments`/
   `contracts` (ainda não construído).
7. Leitura direta nesta sessão: migrations de `participacoes_na_campanha`,
   `historico_alteracoes`, `parceiras`, `medidas_influenciadora`.

**O que este documento resolve que os três anteriores deixaram em
aberto:** os documentos-fonte já decidiram *onde* congelar
(Participação) e propuseram `congelado_em` como trava de edição dos
campos que já vivem em `participacoes_na_campanha`
(`valor_contratado`, quantidades). Mas nenhum deles respondeu à
pergunta central deste mandato — **"o histórico deve permanecer íntegro
mesmo quando o cadastro vivo da influenciadora mudar"** — porque
`congelado_em` sozinho **não protege dado que mora em outra tabela**
(`parceiras`: nome, CNPJ, endereço, chave PIX). Uma trava de edição em
`participacoes_na_campanha` não impede que `Parceira` mude amanhã e a
participação antiga, ao ser lida via FK, mostre o endereço novo em vez
do endereço usado na época do envio. Isso é o gap que fecha a decisão
abaixo.

---

## 1. Resumo executivo

- **Onde congelar:** por `ParticipacaoNaCampanha` — nunca por Campanha
  inteira. Confirmado, não reaberto (três documentos-fonte concordam).
- **Modelo escolhido:** uma variante refinada da **Opção A** do
  enunciado — colunas aditivas em `participacoes_na_campanha`
  (`congelado_em`, `congelado_por`, e um novo campo `dados_congelados`
  em JSON) — **não** uma entidade `Snapshot` separada (Opção B).
- **O que muda em relação ao que já estava proposto:** os documentos
  anteriores tratavam "congelamento" só como *trava de edição* dos
  campos que já vivem na própria `Participacao`. Este documento separa
  duas coisas que precisam de tratamento diferente:
  - Campos que **já vivem exclusivamente** em `participacoes_na_campanha`
    (`valor_contratado`, quantidades) → resolvidos por **trava de
    edição** (não precisam de cópia, já são donos únicos do dado).
  - Campos que vivem em **outra tabela compartilhada e mutável**
    (`Parceira`: nome, CNPJ, chave PIX, endereço) → resolvidos por
    **cópia** no momento do congelamento, porque `Parceira` continua
    viva e pode mudar depois — sem cópia, o histórico não é íntegro.
- **Nenhuma tabela nova de "snapshot" ou "mês".** Apenas 3 colunas
  aditivas em `participacoes_na_campanha` + uma tabela pequena de
  auditoria (`historico_alteracoes_participacao`, mesmo padrão já usado
  para `Parceira`).
- **Não implementado.** Aguardando aprovação explícita, conforme
  mandato.

---

## 2. Onde deve ocorrer o congelamento (Opção A vs. Opção B)

| Critério | Opção A — campos na Participação | Opção B — entidade `Snapshot` própria |
|---|---|---|
| Consistência com o schema atual | Segue o padrão já usado no projeto (`endereco_completo` recalculado em `Parceira`, `drive_file_url` como snapshot gravado em `Material`) — dado derivado vive como coluna adicional na própria linha, não em tabela irmã | Introduziria um padrão novo, sem precedente em `tear-v2-app` |
| Cardinalidade | 1:1 real — uma participação congela **uma vez** (não há re-congelamento nem múltiplos snapshots por participação no modelo já confirmado, dado que não existe pagamento recorrente hoje) | Modelagem 1:N pressupõe múltiplos snapshots por participação — cardinalidade que não existe neste domínio hoje; over-engineering para o problema real |
| Custo de migration | Baixo — 3 colunas nullable, aditivo puro, zero risco de quebra | Médio — nova tabela, nova FK, novo relacionamento Eloquent, novos endpoints só para leitura do snapshot |
| Leitura pela API/Frontend | Participação continua sendo o único objeto consultado (`GET /participacoes/{id}` já devolve tudo) | Exigiria join ou segunda chamada (`GET /participacoes/{id}/snapshot`) sempre que o frontend precisar mostrar dado congelado — complexidade sem benefício, já que é sempre 1:1 |
| Precedente do legado | `CondicaoComercialSnapshot` do Sistema A (`SPEC-005.md` §6) já é por Parceira × MesReferência, mas isso existia porque lá "mês" é um agregado recorrente real — não é o caso aqui (pagamento não é recorrente hoje, confirmado em `docs/archive/pagamento-snapshot/ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md`) | Replicaria a forma do legado sem replicar o motivo (recorrência) que a justifica lá |
| Extensibilidade futura (Sprint 3: produto/variante) | Basta ampliar o JSON `dados_congelados` (sem migration nova) | Exigiria nova coluna ou nova versão de schema na tabela `Snapshot` |

**Decisão: Opção A.** Uma entidade `Snapshot` separada só se justificaria
se (a) uma participação pudesse ser congelada mais de uma vez (não é o
caso — não há recorrência hoje, confirmado), ou (b) o volume/estrutura
do dado congelado fosse grande e nested o suficiente para não caber
como JSON em uma coluna (não é o caso — é um punhado de campos
cadastrais). Nenhuma das duas condições se aplica.

---

## 3. Quais informações devem ser congeladas

Distinção central desta análise: **trava de edição** (para dado que já
é exclusivo da participação) vs. **cópia** (para dado que vive em outra
tabela e pode mudar independentemente).

| Informação | Onde vive hoje | Tratamento | Justificativa |
|---|---|---|---|
| `valor_contratado`, `reels_qtd`/`carrossel_qtd`/`stories_qtd`/`tiktok_qtd`/`ugc_qtd` | `participacoes_na_campanha` (coluna própria) | **Trava de edição** (bloquear `UPDATE` após `congelado_em`) | Já é dono exclusivo do dado — não há outra tabela mutável de onde isso "vaza" para o passado. Copiar seria redundante. |
| Dados da influenciadora (`nome`, `cnpj`, `chave_pix`, `email`, `telefone`, `instagram`) | `parceiras` (tabela compartilhada, editável a qualquer momento pela própria influenciadora a partir do Sprint 2/Portal) | **Cópia** para `dados_congelados` (JSON) no momento do congelamento | `Parceira` é um registro vivo, reaproveitado por N participações ao longo do tempo. Se ela mudar de PIX ou corrigir o nome amanhã, uma participação já paga não pode "herdar" retroativamente esse valor novo. |
| Endereço usado no envio (`cep/rua/bairro/cidade/uf/numero/complemento/endereco_completo`) | `parceiras` (mesma tabela, mesmo risco) | **Cópia** para `dados_congelados` | Mesmo argumento do item acima — endereço é o exemplo mais concreto citado no mandato: se a influenciadora mudar de endereço depois do envio, o registro histórico não pode mostrar o endereço novo como se tivesse sido o usado. |
| Tamanho/medida (`medidas_influenciadora`) | Tabela própria, **já append-only por design** (cada alteração é uma linha nova, nunca sobrescreve) | **Referenciar a versão vigente** no momento do congelamento — copiar o `id` da linha de medida usada (ou os valores resolvidos) para `dados_congelados` | A tabela já resolve "qual era a medida na época" por versionamento de linha; falta só fixar **qual linha** era a vigente quando esta participação congelou, para não depender de recalcular "qual era a última medida antes da data X" toda vez que o histórico for consultado. |
| Briefing (`orientacoes`, `prazo`, `referencias`, por tipo) | `briefings` (tabela própria, 1:N, FK direta em `participacao_id`) | **Trava de edição** (não cópia) | Já é exclusivo da participação (nunca compartilhado entre participações) — mesma lógica de `valor_contratado`. Bloquear edição do Briefing quando a participação-mãe estiver congelada é suficiente; não precisa duplicar o conteúdo em `dados_congelados`. |
| Produto/variante escolhidos (quando existir — Sprint 3) | Futura tabela `products`/`product_variants` (catálogo compartilhado, mutável — preço/nome/disponibilidade podem mudar) | **Cópia** da variante confirmada (nome, cor, referência/SKU, preço no momento) para `dados_congelados` | Mesmo argumento de `Parceira`: catálogo é dado vivo e compartilhado; a escolha feita para esta participação não pode mudar se o catálogo mudar depois. |
| Endereço/ficha logística (quando existir — Sprint 3) | Futura tabela `shipments` | **Nenhum tratamento novo necessário** — ver §7 (a ficha logística já nasce como registro imutável por desenho, não precisa de segundo congelamento) | A ficha logística documentada em `docs/planning/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.6 já copia produto/endereço/nome no momento da geração — ela **é** o snapshot daquele envio, não algo que precisa ser congelado de novo. |
| Pagamento (`valor`, `status`) | `pagamentos`, 1:1 com participação | **Nenhuma trava** — ver §8 | O gate de aprovação (P0-1) e a máquina de estados `PENDENTE→APROVADO→PAGO` precisam continuar avançando **depois** do congelamento comercial. Congelar bloquearia o próprio fluxo de pagamento. |
| `congelado_por` (quem congelou), `congelado_em` (quando) | Novo, em `participacoes_na_campanha` | Metadado, gravado uma vez | Necessário para auditoria e para exibir "congelada em X por Y" na tela. |

---

## 4. Campos que permanecem vivos (nunca congelados)

- **`Marca`, `Campanha`** — não têm termos comerciais próprios (confirmado
  em `docs/archive/pagamento-snapshot/PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` §2); continuam totalmente
  editáveis independentemente do congelamento de qualquer participação.
- **`status` de `Material`** (`PENDENTE/APROVADO/REPROVADO`) — continua
  transicionando normalmente após o congelamento comercial; é fluxo
  operacional de conteúdo, não termo comercial.
- **`status` de `Pagamento`** (`PENDENTE/APROVADO/PAGO`) — idem, precisa
  continuar avançando após o congelamento (ver §8).
- **Cadastro vivo da `Parceira`** — a influenciadora continua podendo
  editar seu próprio cadastro (Sprint 2) a qualquer momento; o
  congelamento não trava a tabela `parceiras`, só impede que uma
  participação **já congelada** herde a mudança retroativamente.
- **Tipo/enum de `Briefing`** — a estrutura (5 tipos) não é afetada;
  só o conteúdo específico daquela participação, após congelada, para de
  ser editável.

---

## 5. Entidades afetadas

| Entidade | Mudança |
|---|---|
| `participacoes_na_campanha` | +3 colunas: `congelado_em` (timestamp, nullable), `congelado_por` (FK `users`, nullable), `dados_congelados` (json, nullable) |
| `historico_alteracoes_participacao` (nova) | Mesma forma de `historico_alteracoes` (que hoje é fixa em `Parceira`), aplicada a `participacao_id` — registra tentativas de alteração pré- e pós-congelamento |
| `ParticipacaoNaCampanha` (model) | Novo método `congelar(User $por)`; `scope`/checagem de "está congelada" usada pelo Form Request de update |
| `Parceira` (model) | Nenhuma mudança de schema — só é lida (não alterada) no momento de gerar o snapshot |
| `medidas_influenciadora` | Nenhuma mudança de schema — só referenciada (via `id` da linha vigente) no snapshot |
| `Briefing`, `Material`, `Pagamento` | Nenhuma mudança de schema. `Briefing` ganha checagem de "participação congelada" no Form Request de update (trava, não cópia). `Material`/`Pagamento` não são afetados. |

---

## 6. Migrations necessárias (descrição, não implementação)

1. **Alterar `participacoes_na_campanha`:**
   ```
   $table->timestamp('congelado_em')->nullable();
   $table->foreignId('congelado_por')->nullable()->constrained('users')->nullOnDelete();
   $table->json('dados_congelados')->nullable();
   ```
   Aditivo puro — nenhuma coluna existente muda, nenhuma constraint
   quebra, nenhum dado existente precisa de backfill (participações já
   criadas ficam com os três campos `null`, equivalente a "não
   congelada").

2. **Nova tabela `historico_alteracoes_participacao`:**
   ```
   $table->id();
   $table->foreignId('participacao_id')->constrained('participacoes_na_campanha')->restrictOnDelete();
   $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
   $table->string('campo');
   $table->text('valor_anterior')->nullable();
   $table->text('valor_novo')->nullable();
   $table->string('ip', 45)->nullable();
   $table->timestamp('created_at');
   ```
   Réplica estrutural de `historico_alteracoes` (mesma forma, `UPDATED_AT`
   nulo). **Não** se propõe generalizar `historico_alteracoes` para
   polimórfico agora — já sinalizado como risco 4 em
   `docs/archive/auditorias/AUDITORIA_MODELO_DADOS_TEAR_V2.md` como mudança maior que atravessa
   `Parceira` também, e deve ser avaliada à parte (candidato a ADR
   quando Sprint 3 pedir auditoria transversal para mais entidades, não
   só Participação).

Nenhuma migration foi criada nesta sessão — apenas descrita.

---

## 7. Impacto na API

- **Novo endpoint de ação:** `POST /participacoes/{participacao}/congelar`
  — autorizado a `ADMIN` (mesmo padrão de policy já usado em
  `ParceiraPolicy`). Executa, numa transação: lê `Parceira` relacionada +
  `medidaAtual()`, monta `dados_congelados`, grava `congelado_em`/
  `congelado_por`.
- **`GET /participacoes/{id}`:** payload passa a incluir `congelado_em`,
  `congelado_por`, `dados_congelados` (quando presentes). Nenhuma quebra
  de contrato — são campos novos, não substituem nenhum campo existente.
- **`PUT/PATCH /participacoes/{id}`:** Form Request passa a rejeitar
  (422) alteração de `valor_contratado`/quantidades quando
  `congelado_em` já estiver setado. Mensagem de erro explícita
  ("Participação congelada — termos comerciais não podem ser alterados").
- **`PUT/PATCH /briefings/{id}`:** mesma checagem, via
  `participacao.congelado_em`.
- **Nenhuma rota de `Material`/`Pagamento` é afetada.**

---

## 8. Impacto no Frontend

- Tela de Participação ganha um badge "Congelada em {data} por {usuário}"
  quando `congelado_em` estiver presente.
- Campos de valor/quantidades tornam-se somente leitura (desabilitados)
  quando congelada — refletindo o 422 do backend, não como única fonte
  de verdade (a trava real é no backend; o frontend só evita a tentativa
  inútil).
- Novo botão de ação "Congelar participação" — provavelmente no momento
  em que a participação é confirmada/ativada, mas **o gatilho exato
  (automático ao ativar vs. ação manual dedicada) é decisão pendente**,
  ver §11.
- Onde a tela hoje mostra dado de `Parceira` "ao vivo" (ex. endereço,
  nome) para uma participação já congelada, passa a mostrar
  `dados_congelados` em vez do cadastro vivo — para não contradizer a
  garantia de integridade histórica. Telas de cadastro da própria
  `Parceira` continuam mostrando sempre o dado vivo (não são afetadas).

---

## 9. Impacto em contratos (Sprint 3, ainda não implementado)

Confirma e refina `docs/archive/pagamento-snapshot/PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` §3: os
placeholders do contrato (`{{nome}}`, `{{cnpj}}`, `{{endereco}}`,
`{{valor_total}}`) devem ler de `dados_congelados` + `valor_contratado`/
quantidades da participação — nunca do cadastro vivo de `Parceira` — para
que um contrato já gerado não mude retroativamente se a influenciadora
editar o próprio cadastro depois.

**Ponto novo, não resolvido pelos documentos anteriores:** o que acontece
se alguém tentar gerar um contrato para uma participação **ainda não
congelada**? Duas opções, nenhuma decidida aqui:
(a) bloquear a geração até a participação ser congelada explicitamente;
(b) a própria ação de gerar contrato congela a participação
automaticamente, como efeito colateral. Ver §11 — decisão pendente do
responsável do projeto, a ser fechada quando o Sprint 3 (Contratos)
abrir formalmente, não antes.

---

## 10. Impacto em logística (Sprint 3, ainda não implementado)

A ficha de retirada (`docs/planning/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.6) já é
desenhada para copiar produto/variante/endereço/nome **no momento da
geração** — ela nasce imutável por construção, sem depender deste
congelamento. O acoplamento correto é o inverso do que se poderia supor:
- Se a participação **já estiver congelada** quando a ficha for gerada,
  a ficha deve ler o endereço de `dados_congelados` (garante consistência
  entre contrato e ficha).
- Se a participação **ainda não estiver congelada**, a ficha lê o
  cadastro vivo no momento da geração (comportamento já correto e
  suficiente, já que a própria ficha se torna o registro imutável a
  partir daquele instante).

**Risco a registrar, não resolver aqui:** se ficha logística e
congelamento de participação puderem acontecer em ordens diferentes
(alguém gera a ficha antes de congelar a participação, e o endereço
usado na ficha diverge do que depois entra em `dados_congelados`), os
dois registros podem contar histórias ligeiramente diferentes do mesmo
envio. Mitigação recomendada quando Sprint 3 abrir: gerar a ficha
logística **é** um dos gatilhos válidos de congelamento automático (ver
§11), não dois eventos independentes.

---

## 11. Impacto em pagamentos

**Nenhum.** Confirmado por `docs/archive/pagamento-snapshot/ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md`:
`Pagamento` é 1:1 com participação, sem coluna de competência, sem
recorrência hoje. O congelamento comercial (`valor_contratado`) e o
ciclo de vida do pagamento (`PENDENTE→APROVADO→PAGO`) são independentes:
- O gate de aprovação (P0-1, já implementado) continua rodando pela
  regra já existente (todo `Material` da participação aprovado) —
  nenhuma mudança.
- `Pagamento.valor` pode continuar referenciando `valor_contratado` da
  participação; como este último fica travado após o congelamento, o
  valor do pagamento também fica implicitamente estável — sem precisar
  de nenhuma trava própria em `pagamentos`.
- Se a resposta do PO sobre recorrência mensal (pergunta ainda aberta,
  não resolvida por este documento) vier a ser "sim, existe
  recorrência", o congelamento da participação continua servindo de
  base — cada parcela mensal seria filha da mesma participação já
  congelada, sem exigir redesenho deste modelo.

---

## 12. Critérios de aceite

1. `participacoes_na_campanha` ganha `congelado_em`, `congelado_por`,
   `dados_congelados` — todos nullable, aditivos, sem afetar nenhuma
   linha existente.
2. Existe uma ação explícita e autorizada (`ADMIN`) que congela uma
   participação, capturando em `dados_congelados` os campos cadastrais
   de `Parceira` (nome, cnpj, chave_pix, endereço completo, telefone,
   instagram) e a medida vigente no momento — validado por teste
   automatizado.
3. Após congelada, uma tentativa de `PUT/PATCH` alterando
   `valor_contratado` ou qualquer quantidade contratada retorna erro e
   não persiste a mudança — validado por teste automatizado.
4. Após congelada, uma tentativa de alterar `Briefing` vinculado a essa
   participação retorna erro — validado por teste automatizado.
5. Alterar o cadastro vivo de `Parceira` (ex. endereço, PIX) **depois**
   de uma participação já estar congelada **não altera** o que a
   participação congelada expõe via API (`dados_congelados` permanece
   com o valor da época) — validado por teste automatizado, é o
   critério que prova a garantia central deste mandato.
6. `Material` e `Pagamento` vinculados a uma participação congelada
   continuam transicionando de estado normalmente (`aprovar`/`reprovar`,
   `PENDENTE→APROVADO→PAGO`) — validado por teste automatizado,
   provando que o congelamento não trava o fluxo operacional.
7. `historico_alteracoes_participacao` registra toda alteração (aceita
   ou rejeitada) de campo comercial da participação, no mesmo padrão já
   usado para `Parceira`.
8. Nenhuma tabela nova de "snapshot" ou "mês" foi criada — só as colunas
   aditivas e a tabela de histórico descritas em §6.

---

## 13. Plano de implementação (alto nível)

1. Migration: 3 colunas em `participacoes_na_campanha` + tabela
   `historico_alteracoes_participacao`.
2. Model `ParticipacaoNaCampanha`: método `congelar(User $por)` — lê
   `Parceira` e `medidaAtual()`, monta `dados_congelados`, grava os 3
   campos numa transação; método auxiliar `estaCongelada(): bool`.
3. Form Requests de `ParticipacaoNaCampanha` e `Briefing`: adicionar
   checagem de `estaCongelada()` antes de permitir update dos campos
   comerciais/de conteúdo.
4. Controller: novo endpoint `congelar`, policy restringindo a `ADMIN`.
5. Serviço de histórico: gravar em `historico_alteracoes_participacao`
   tanto alterações aceitas (pré-congelamento) quanto tentativas
   rejeitadas (pós-congelamento), mesmo padrão do serviço já existente
   para `Parceira` (`AtualizarCadastroComConsentimentoService`).
6. Frontend: badge de status, campos read-only condicionais, botão de
   ação, leitura de `dados_congelados` nas telas que hoje mostram dado
   vivo de `Parceira` para participações já congeladas.
7. Testes automatizados cobrindo os 8 critérios de aceite de §12,
   incluindo o cenário central (alteração de cadastro vivo não vaza
   para participação já congelada).
8. Documentar a decisão (esta decisão de arquitetura, já aprovada em 4
   sessões de análise consecutivas) como nota de ADR curta, já que é uma
   mudança de schema persistente — recomendado, não bloqueante, dado que
   o domínio soberano com ADR obrigatório é o do Portal legado, não o de
   `tear-v2-app`.

---

## 14. Decisões que ainda dependem do responsável do projeto

Nenhuma delas bloqueia a implementação do congelamento em si — ficam
registradas para não serem assumidas por omissão:

1. **Gatilho do congelamento:** automático (ex. ao ativar a participação
   ou ao gerar contrato/ficha logística) vs. ação manual dedicada
   (botão "Congelar"). Ver §8, §9, §10.
2. **Contrato para participação não congelada:** bloquear geração até
   congelar, ou congelar automaticamente como efeito colateral da
   geração. Ver §9.
3. **Recorrência de pagamento mensal** — pergunta já registrada em
   `docs/archive/pagamento-snapshot/ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md`, não resolvida por
   este documento; não bloqueia o congelamento (§11), mas é a próxima
   decisão pendente da fila P0-3.
4. **Generalização de `historico_alteracoes` para polimórfico** — este
   documento propõe uma tabela irmã por ora (§6); a generalização é
   maior e deve ser avaliada quando mais entidades (Sprint 3) precisarem
   do mesmo padrão de auditoria.

---

## 15. Resumo executivo (para aprovação)

**Recomendação técnica:** implementar o congelamento como descrito
(§2-§13) — é aditivo, de baixo risco, fecha a lacuna real identificada
neste mandato (dado vivo de `Parceira` vazando para histórico já
congelado), e não depende de nenhuma das decisões pendentes de §14.

**Aguardando aprovação explícita do responsável do projeto antes de
qualquer migration, model ou tela ser criada**, conforme instrução do
mandato. Nenhum código foi escrito, nenhuma migration criada e nenhuma
arquitetura alterada para produzir este documento.
