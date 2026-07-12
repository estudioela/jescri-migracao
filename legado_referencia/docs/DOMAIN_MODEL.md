# Modelo de Domínio — TEAR V2

> **Fontes (exclusivas):** [`docs/PLANILHA_TEAR_1.0_MAPA.md`](./PLANILHA_TEAR_1.0_MAPA.md) (contrato funcional) e as *Diretrizes de Engenharia para o Projeto Tear*.
> **Natureza:** modelo conceitual de **domínio de negócio**. Não descreve tecnologia, armazenamento, Apps Script, planilhas nem código.
> **Regra de não-duplicação (Diretriz §3):** o detalhe coluna-a-coluna vive no mapa funcional; aqui referenciamos, não recopiamos.
> **Escopo:** Fase 2 — definição de entidades, agregados, value objects, enums, serviços de domínio, eventos e regras transversais. Nenhuma alteração é proposta.

---

## 1. Contexto e Linguagem Ubíqua

O TEAR opera um **programa mensal de colaboração** entre a marca e suas **Parceiras** (influenciadoras). A cada mês (**Ciclo**) a marca envia produtos, orienta a criação de conteúdo, acompanha a produção e remunera as parceiras.

| Termo | Significado no domínio |
|---|---|
| **Parceira** | Influenciadora contratada. Entidade-mestre; possui contrato, endereço e cupom. |
| **Ciclo** | Mês de operação. Unidade temporal a que todo trabalho operacional pertence. |
| **Referência Mensal** | O par (mês, ano) que identifica um Ciclo. |
| **Inscrição** | Candidatura bruta de uma pessoa que deseja se tornar Parceira. |
| **Contrato** | Termos acordados: fee, entregáveis, canais e prazo. |
| **Entregável / Peça** | Uma unidade de conteúdo a produzir (reel, carrossel, stories). |
| **Ativação** | O agendamento e o acompanhamento de execução de uma Peça no Ciclo. |
| **Briefing** | A orientação criativa de uma Parceira para um Ciclo (look, texto, datas, aprovação). |
| **Envio** | A remessa física de produtos à Parceira no Ciclo. |
| **Pagamento** | A remuneração do fee da Parceira referente a um Ciclo. |
| **Histórico** | O acervo dos itens que atingiram estado terminal (postado / pago). |
| **Cidade-base** | Nova Friburgo — origem logística e fiscal da marca. |

**Chaves da linguagem (observadas no contrato funcional):**
- No sistema atual a identidade da Parceira é o **nome**, e o Ciclo é a **string do mês**. Este modelo eleva ambos a **identidades próprias e estáveis** (ver §7, Regras Transversais) — decisão de modelagem de domínio, não de tecnologia.

---

## 2. Mapa de Agregados (visão geral)

```
        ┌──────────────┐        promoção        ┌──────────────────────────────┐
        │  Inscrição   │ ─────────────────────► │           Parceira           │  (mestre)
        └──────────────┘                        │  Contrato · Endereço · Cupom │
                                                └──────────────┬───────────────┘
                                                               │ referência (por identidade)
                        ┌──────────────┐                       │
                        │    Ciclo     │ ──────────────────────┤ escopo temporal
                        │ (mês, ano)   │                       │
                        └──────┬───────┘                       │
             geração do mês    │                               │
        ┌───────────┬──────────┼──────────────┬────────────────┘
        ▼           ▼          ▼              ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
  │  Envio   │ │ Ativação │ │ Briefing │ │  Pagamento   │
  │(Parc×Cic)│ │ (Peça)   │ │(Parc×Cic)│ │  (Parc×Cic)  │
  └──────────┘ └────┬─────┘ └────▲─────┘ └──────────────┘
                    │  data prevista + formato
                    └────────────┘  (Briefing consome da Ativação)
        estado terminal (postado / pago) ──────────► Histórico
```

Cada agregado referencia **Parceira** e **Ciclo** por identidade — nunca contém o outro agregado. Consistência forte vale **dentro** de cada agregado; entre agregados a coordenação é por **eventos de domínio**.

---

## 3. Entidades e Agregados

### 3.1 Inscrição *(agregado — raiz: Inscrição)*

- **Objetivo:** registrar a candidatura bruta de alguém que deseja se tornar Parceira.
- **Responsabilidades:** preservar fielmente o que foi submetido; permitir triagem/promoção para Parceira; não ser fonte de verdade operacional.
- **Atributos:** identidade da inscrição; data da submissão; nome pretendido; e-mail; chave PIX (bruta); razão social; documento fiscal (bruto); endereço bruto (CEP, número, complemento).
- **Relacionamentos:** origina **no máximo uma** Parceira (promoção). Sem escopo de Ciclo.
- **Regras de negócio:** uma submissão = uma Inscrição; dados podem estar incompletos/inconsistentes (é intake); a promoção a Parceira é um ato deliberado de curadoria, não automático.
- **Eventos que produz:** `InscriçãoRecebida`.
- **Eventos que consome:** —
- **Dependências:** nenhuma a montante.
- **Observações:** a ligação Inscrição→Parceira hoje é feita por nome/e-mail; o domínio prevê uma promoção explícita que estabelece a identidade estável da Parceira.

### 3.2 Parceira *(agregado — raiz: Parceira)* — **entidade central**

- **Objetivo:** representar a influenciadora contratada e seu contrato vigente.
- **Responsabilidades:** ser a fonte de verdade sobre identidade, contrato, endereço e cupom; determinar se participa de um Ciclo (status); fornecer os parâmetros (quantidades, fee, canais, prazo) que abastecem a geração do mês.
- **Atributos:**
  - Identidade estável; **nome de exibição**; **status** (`StatusParceira`);
  - **Cupom** (VO);
  - **Endereço** (VO, já enriquecido/normalizado);
  - **Contrato** (VO — ver §4): fee, quantidades de entrega, canais, prazo;
  - Referências externas de apoio: acervo de looks e pasta de materiais *(atributos de referência; o conteúdo delas está fora deste agregado)*.
- **Relacionamentos:** referenciada por Ativação, Briefing, Envio e Pagamento (por identidade). Origina-se de uma Inscrição.
- **Regras de negócio:**
  - **Status ON/OFF governa a participação:** apenas Parceiras **Ativas** entram na geração de um Ciclo.
  - **Cupom** segue padrão determinístico derivado do nome (ver `GeradorDeCupom`, §6).
  - **Endereço** é sempre completo e normalizado no domínio (o enriquecimento a partir do CEP é responsabilidade de uma camada externa — §6/§7).
  - Alterações de contrato valem a partir do momento da alteração; Ciclos já gerados não são retroativamente alterados.
- **Eventos que produz:** `ParceiraCadastrada`, `ParceiraAtivada`, `ParceiraDesativada`, `ContratoAtualizado`.
- **Eventos que consome:** —
- **Dependências:** Inscrição (origem); serviço externo de endereço (via ACL) para compor o Endereço.
- **Observações:** o "razão social" e o "nome de exibição" são conceitos distintos e não devem colidir (ver inconsistência #7 do mapa funcional).

### 3.3 Ciclo *(agregado — raiz: Ciclo)*

- **Objetivo:** representar um mês de operação e servir de escopo temporal a todo o trabalho.
- **Responsabilidades:** definir a Referência Mensal e a janela operacional; ser o gatilho da "geração do mês".
- **Atributos:** identidade; **Referência Mensal** (VO: mês+ano); data de geração; **Período Operacional** (VO: início da logística, fim da operação).
- **Relacionamentos:** agrupa todas as Ativações, Briefings, Envios e Pagamentos daquele mês.
- **Regras de negócio:**
  - **Regra do "mês seguinte":** a Referência Mensal de um Ciclo é o mês **seguinte** ao dia da sua geração (gerou em julho → Ciclo refere-se a agosto). Ver `CalculadoraDeReferenciaMensal` (§6).
  - Um Ciclo é único por Referência Mensal (não há dois Ciclos para o mesmo mês/ano).
- **Eventos que produz:** `CicloGerado`.
- **Eventos que consome:** —
- **Dependências:** conjunto de Parceiras Ativas no momento da geração.
- **Observações:** hoje o Ciclo é apenas o nome do mês; elevá-lo a entidade com mês+ano remove a ambiguidade entre anos (inconsistência #2 do mapa).

### 3.4 Ativação *(agregado — raiz: Ativação)* — a Peça de conteúdo

- **Objetivo:** agendar e acompanhar a execução de **uma** Peça de conteúdo de uma Parceira em um Ciclo.
- **Responsabilidades:** guardar formato, data prevista e o estado de produção; transicionar de estado conforme a produção avança; sinalizar conclusão (postado).
- **Atributos:** identidade; referência à Parceira; referência ao Ciclo; **Formato** (`FormatoConteudo`, com ordinal quando houver mais de um stories); **data prevista de publicação**; **data de aprovação registrada**; **status** (`StatusAtivacao`); link do material.
- **Relacionamentos:** pertence a (Parceira, Ciclo). É a origem das datas que o Briefing consome.
- **Regras de negócio:**
  - A **quantidade** de Ativações de uma Parceira num Ciclo deriva das quantidades do Contrato (reels/carrosséis/stories).
  - **Máquina de estados:** `EM_ABERTO → {APROVADO | AJUSTES | FALTA_DRIVE} → POSTADO`.
  - Ao atingir **`POSTADO`**, a Peça é arquivada no Histórico (estado terminal).
  - Stories múltiplos são distinguidos por ordinal (`STORIES_1`, `STORIES_2`).
- **Eventos que produz:** `AtivaçãoAgendada`, `ConteúdoAprovado`, `AjusteSolicitado`, `ConteúdoPostado`.
- **Eventos que consome:** `CicloGerado` (é criada na geração do mês).
- **Dependências:** Parceira (quantidades) e Ciclo (escopo).
- **Observações:** Ativação e Briefing são **duas faces da mesma Peça** — execução (aqui) e orientação criativa (Briefing). São mantidos separados por fidelidade ao contrato funcional; a dependência de data entre eles é explicitada como evento (§8). Ver Observação global em §9.

### 3.5 Briefing *(agregado — raiz: Briefing)*

- **Objetivo:** consolidar a orientação criativa de uma Parceira para um Ciclo.
- **Responsabilidades:** reunir o resumo do mês e, por Peça, o look, o texto de orientação, a data de publicação e a **data de aprovação calculada**.
- **Atributos:**
  - Identidade; referência à Parceira; referência ao Ciclo; **resumo do mês**;
  - Coleção de **ItemDeBriefing** (entidade interna), um por Peça: Formato; **look**; texto de orientação ("sobre"); **data de publicação**; **data de aprovação** (calculada).
- **Relacionamentos:** pertence a (Parceira, Ciclo); consome dados das Ativações da mesma (Parceira, Ciclo); referencia o **acervo de looks** (fonte externa apontada pela Parceira).
- **Regras de negócio:**
  - O **resumo do mês** e o texto "sobre" são autorais (definidos pela operação).
  - A **data de publicação** de cada item vem da Ativação correspondente, roteada pelo **Formato**.
  - **Regra de aprovação:** `data de aprovação = data de publicação − 7 dias`; se cair em **sábado/domingo**, desloca para a **segunda-feira** seguinte. Ver `CalculadoraDeDataDeAprovacao` (§6).
  - Os looks são referenciados a partir do acervo externo (não são conteúdo próprio deste agregado).
- **Eventos que produz:** `BriefingPublicado`, `BriefingAtualizado`.
- **Eventos que consome:** `AtivaçãoAgendada` (para obter data e formato).
- **Dependências:** Ativação (datas/formato); acervo de looks (externo, via referência da Parceira).
- **Observações:** `ItemDeBriefing` é entidade **dentro** do agregado Briefing (não tem vida própria fora dele).

### 3.6 Envio *(agregado — raiz: Envio)* — Logística

- **Objetivo:** controlar a remessa física de produtos a uma Parceira em um Ciclo.
- **Responsabilidades:** registrar endereço de entrega, código de rastreio, data de envio e o estado de revisão/entrega.
- **Atributos:** identidade; referência à Parceira; referência ao Ciclo; **endereço de entrega** (VO); **código de rastreio** (VO, inclui transportadora); data de envio; **status de revisão** (`StatusRevisaoLogistica`); **status logístico** (`StatusLogistica`).
- **Relacionamentos:** pertence a (Parceira, Ciclo). O endereço de entrega deriva do Endereço da Parceira no momento do envio.
- **Regras de negócio:**
  - O **código de rastreio** é fornecido manualmente pela operação.
  - O **status logístico** é atualizado a partir da transportadora (fonte externa; ver ACL em §6/§7).
  - Um Envio por Parceira por Ciclo.
- **Eventos que produz:** `EnvioRegistrado`, `RastreioAtualizado`, `ProdutoEntregue`.
- **Eventos que consome:** `CicloGerado`.
- **Dependências:** Parceira (endereço); serviço externo de rastreio (via ACL).
- **Observações:** o status logístico depende de integração externa hoje inexistente (inconsistência #11 do mapa) — modelado como evento consumido de fonte externa.

### 3.7 Pagamento *(agregado — raiz: Pagamento)*

- **Objetivo:** controlar a remuneração do fee de uma Parceira referente a um Ciclo.
- **Responsabilidades:** manter o valor devido, a chave de recebimento e o estado do pagamento; disponibilizar a mensagem de cobrança.
- **Atributos:** identidade; referência à Parceira; referência ao Ciclo; **fee** (VO Dinheiro); **chave PIX** (VO); **status** (`StatusPagamento`); data do pagamento; **mensagem de cobrança** (derivada).
- **Relacionamentos:** pertence a (Parceira, Ciclo). Fee e PIX originam-se do Contrato/Parceira.
- **Regras de negócio:**
  - **Fee e chave PIX** refletem o Contrato da Parceira (a fonte de verdade é a Parceira; aqui é referência).
  - **Máquina de estados:** `EM_ABERTO → {AGUARDANDO | FALTA_NF | FALTA_DRIVE} → PAGO`.
  - Ao atingir **`PAGO`**, o Pagamento é arquivado no Histórico (estado terminal).
  - A **mensagem de cobrança** é um texto derivado dos dados do Pagamento (ver `GeradorDeMensagemDeCobranca`, §6).
- **Eventos que produz:** `PagamentoSolicitado`, `PagamentoConfirmado`.
- **Eventos que consome:** `CicloGerado`.
- **Dependências:** Parceira (fee, PIX).
- **Observações:** o fee aparece tanto na Parceira quanto no Pagamento; o domínio trata a Parceira como fonte e o Pagamento como snapshot do Ciclo (evita a duplicação da inconsistência #9 do mapa).

### 3.8 Histórico *(conceito de suporte)*

- **Objetivo:** ser o acervo dos itens que atingiram estado terminal.
- **Responsabilidades:** preservar Ativações `POSTADO` e Pagamentos `PAGO` fora do fluxo operacional ativo, para consulta.
- **Atributos:** referência ao item arquivado, ao Ciclo e ao momento do arquivamento.
- **Regras de negócio:** um item entra no Histórico **apenas** ao atingir estado terminal; itens arquivados não retornam ao fluxo ativo.
- **Eventos que produz:** —
- **Eventos que consome:** `ConteúdoPostado`, `PagamentoConfirmado`.
- **Dependências:** `PoliticaDeArquivamento` (§6).
- **Observações:** o Histórico é **referenciado** no contrato funcional, mas **não existe** como aba na planilha (inconsistência #13). Aqui ele é um conceito de domínio de primeira classe.

---

## 4. Value Objects

Objetos definidos por seu valor, imutáveis, sem identidade própria.

| Value Object | Composição | Regras / invariantes |
|---|---|---|
| **ReferenciaMensal** | mês, ano | Identifica o Ciclo; comparável e ordenável cronologicamente. |
| **PeriodoOperacional** | início da logística, fim da operação | Início ≤ fim. |
| **Contrato** | fee (Dinheiro), quantidades (QuantidadesDeEntrega), canais (conjunto de `CanalDeVeiculacao`), prazo (PrazoContratual) | Substituído por inteiro ao alterar; fee ≥ 0; quantidades ≥ 0. |
| **QuantidadesDeEntrega** | qtd. reels, qtd. carrosséis, qtd. stories, qtd. looks | Inteiros não-negativos; determinam o nº de Ativações do Ciclo. |
| **PrazoContratual** | duração do contrato | Ex.: 6 meses, 1 ano. |
| **Dinheiro** | valor, moeda | ≥ 0; a forma "por extenso" é **derivada**, não armazenada como verdade paralela. |
| **Cupom** | código | Derivado do nome da Parceira (padrão determinístico). |
| **Endereço** | CEP, logradouro, número, complemento, bairro, cidade, UF, forma canônica | Completo e normalizado; a forma canônica é derivada dos componentes. |
| **ChavePix** | valor, `TipoChavePix` | O tipo classifica e valida o formato do valor. |
| **DocumentoFiscal** | número, tipo (CNPJ/CPF) | Normalizado e validado por tipo. |
| **CodigoDeRastreio** | código, transportadora | Formato depende da transportadora. |

> Detalhe de origem de cada campo: ver mapa funcional (§ *Mapa das abas*).

---

## 5. Enums (conjuntos fechados)

Conforme **Diretriz §5** ("prefira erros de compilação a erros de runtime"), todo enum é um **conjunto fechado**: adicionar um novo caso deve obrigar o tratamento explícito de todos os fluxos afetados.

| Enum | Casos | Origem no contrato funcional |
|---|---|---|
| **StatusParceira** | `ATIVA`, `INATIVA` | STATUS ON/OFF da base. |
| **FormatoConteudo** | `REEL`, `CARROSSEL`, `STORIES` (com ordinal quando múltiplos) | FORMATO das ativações. |
| **StatusAtivacao** | `EM_ABERTO`, `APROVADO`, `AJUSTES`, `FALTA_DRIVE`, `POSTADO` | STATUS das ativações. |
| **StatusPagamento** | `EM_ABERTO`, `AGUARDANDO`, `FALTA_NF`, `FALTA_DRIVE`, `PAGO` | STATUS de pagamentos. |
| **StatusRevisaoLogistica** | `AGUARDANDO_CONFIRMACAO`, `CONFIRMADO` | STATUS REVISÃO da logística *(conjunto parcialmente observado — ver Observações)*. |
| **StatusLogistica** | *(definido pela transportadora; a confirmar)* | STATUS LOGISTICA (fonte externa). |
| **TipoChavePix** | `CPF`, `CNPJ`, `EMAIL`, `TELEFONE`, `ALEATORIA` | Classificação inferida do campo PIX heterogêneo. |
| **CanalDeVeiculacao** | `INSTAGRAM`, `TIKTOK`, `ANUNCIOS`, `NEWS` | CANAIS da base *(conjunto observado; pode crescer)*. |

**Observações sobre enums:**
- `StatusRevisaoLogistica` e `StatusLogistica` foram observados com poucos valores nos dados; seus conjuntos completos precisam de confirmação (não inventar casos).
- `TipoChavePix` **não existe** hoje na planilha (o PIX é texto livre); é uma classificação de domínio que dá tipo a um dado hoje ambíguo.

---

## 6. Serviços de Domínio

Operações de negócio que não pertencem naturalmente a uma única entidade.

| Serviço | Responsabilidade | Regra |
|---|---|---|
| **GeradorDeCicloMensal** ("geração do mês") | A partir de um Ciclo e das Parceiras **Ativas**, criar as Ativações (conforme quantidades do Contrato), o esqueleto do Briefing, os Envios e os Pagamentos do mês. | Só inclui Parceiras `ATIVA`; nº de Ativações = quantidades do Contrato; ordena a agenda (ver `OrdenadorDaAgenda`). |
| **CalculadoraDeReferenciaMensal** | Determinar a Referência Mensal de um Ciclo. | Mês **seguinte** ao dia da geração. |
| **CalculadoraDeDataDeAprovacao** | Calcular a data de aprovação de cada Peça do Briefing. | `publicação − 7 dias`; fim de semana → segunda-feira seguinte. |
| **GeradorDeCupom** | Produzir o cupom da Parceira. | Padrão determinístico derivado do nome. |
| **ConversorDeValorPorExtenso** | Derivar a forma "por extenso" de um Dinheiro. | Função pura do valor; nunca fonte de verdade paralela. |
| **GeradorDeMensagemDeCobranca** | Produzir o texto de cobrança de um Pagamento. | Função dos dados do Pagamento (nome, fee, PIX, mês). |
| **OrdenadorDaAgenda** | Ordenar Parceiras/Peças de um Ciclo. | Alfabética e, em seguida, cronológica. |
| **PoliticaDeArquivamento** | Arquivar itens em estado terminal. | Ativação `POSTADO` e Pagamento `PAGO` → Histórico. |

**Dependências externas (fora do domínio — via ACL, Diretriz §2):**
- **Enriquecimento de endereço por CEP** e **status de rastreio da transportadora** são **fontes externas**. O domínio consome o resultado (Endereço completo, StatusLogistica), mas **não conhece** o mecanismo. Cada uma tem um ponto de contato único (Diretriz §2).

---

## 7. Regras Transversais (cross-cutting)

Regras que valem em mais de um agregado e definem a coerência do sistema.

1. **Identidade estável da Parceira.** A junção entre agregados é por **identidade**, não por nome. O nome é atributo de exibição. (Corrige a fragilidade das inconsistências #1 do mapa.)
2. **Escopo por Ciclo.** Toda entidade operacional (Ativação, Briefing, Envio, Pagamento) pertence a **exatamente um** Ciclo, identificado por Referência Mensal (mês+ano). (Corrige a ambiguidade da inconsistência #2.)
3. **Participação por status.** Somente Parceiras `ATIVA` entram na geração de um Ciclo.
4. **Regra do "mês seguinte".** A Referência Mensal deriva da data de geração (mês seguinte).
5. **Regra de aprovação temporal.** `aprovação = publicação − 7 dias`, deslocando fim de semana para segunda.
6. **Cidade-base fixa.** Nova Friburgo é a origem logística/fiscal; distinta da cidade do endereço da Parceira. (Corrige a colisão de "CIDADE" da inconsistência #6.)
7. **Estados terminais arquivam.** Atingir `POSTADO` (conteúdo) ou `PAGO` (pagamento) move o item para o Histórico, de onde não retorna.
8. **Fonte única de verdade.** Fee, PIX e Endereço têm dono único (Parceira); demais agregados referenciam ou tiram snapshot, sem reescrever a verdade. (Corrige duplicações das inconsistências #9 e #10.)
9. **Tipagem de dados ambíguos na fronteira.** PIX, documento fiscal e CEP entram no domínio já tipados/validados; o domínio nunca lida com o dado bruto. (Alinha às inconsistências #3, #4.)
10. **Enums fechados.** Nenhum fluxo trata "qualquer outro caso" silenciosamente; novos formatos/status exigem tratamento explícito (Diretriz §5).

---

## 8. Catálogo de Eventos de Domínio

| Evento | Produzido por | Consumido por | Significado |
|---|---|---|---|
| `InscriçãoRecebida` | Inscrição | (triagem) | Nova candidatura registrada. |
| `ParceiraCadastrada` | Parceira | — | Inscrição promovida a Parceira. |
| `ParceiraAtivada` / `ParceiraDesativada` | Parceira | GeradorDeCicloMensal | Muda a participação nos próximos Ciclos. |
| `ContratoAtualizado` | Parceira | — | Termos alterados (valem para Ciclos futuros). |
| `CicloGerado` | Ciclo | Ativação, Briefing, Envio, Pagamento | Dispara a criação do operacional do mês. |
| `AtivaçãoAgendada` | Ativação | Briefing | Peça agendada; fornece data e formato ao Briefing. |
| `ConteúdoAprovado` | Ativação | — | Peça aprovada. |
| `AjusteSolicitado` | Ativação | — | Peça requer ajustes. |
| `ConteúdoPostado` | Ativação | Histórico | Estado terminal → arquivamento. |
| `BriefingPublicado` / `BriefingAtualizado` | Briefing | — | Orientação criativa disponível/alterada. |
| `EnvioRegistrado` | Envio | — | Remessa criada. |
| `RastreioAtualizado` | Envio | — | Novo status vindo da transportadora. |
| `ProdutoEntregue` | Envio | — | Entrega concluída. |
| `PagamentoSolicitado` | Pagamento | — | Cobrança emitida. |
| `PagamentoConfirmado` | Pagamento | Histórico | Estado terminal → arquivamento. |

---

## 9. Observações Globais

- **Ativação × Briefing são a mesma Peça vista de dois ângulos** (execução × orientação). O contrato funcional os mantém separados; este modelo preserva essa separação e torna explícita a dependência (evento `AtivaçãoAgendada`). Uma eventual unificação é **decisão para a fase de arquitetura**, não deste modelo — aqui apenas se registra a tensão.
- **Looks** vivem em um **acervo externo** referenciado pela Parceira; não são um agregado do TEAR. O Briefing os referencia.
- **Histórico** é conceito de domínio de primeira classe aqui, embora ausente como aba no contrato funcional.
- **Conjuntos de enum incompletos** (`StatusRevisaoLogistica`, `StatusLogistica`) e a **classificação de PIX** foram derivados dos dados observados; seus limites exatos precisam de confirmação antes de virarem contrato fechado — não devem ser preenchidos por suposição.
- **Nada aqui descreve tecnologia.** Armazenamento, integração e implementação são responsabilidade das fases seguintes; o domínio permanece agnóstico (Diretriz §2/§5).

---

*Fim do Modelo de Domínio — TEAR V2 (Fase 2). Aguardando aprovação para a fase seguinte.*
