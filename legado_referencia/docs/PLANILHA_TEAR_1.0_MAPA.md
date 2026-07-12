# Mapa Funcional — Planilha TEAR V.1 (canônica)

> **Fonte analisada:** `[ELÃ] TEAR V.1.xlsx` (planilha canônica indicada pelo cliente — versão funcional de produção).
> **Natureza:** referência funcional de negócio (somente leitura). Documento descritivo da Fase 1.
> **Escopo:** apenas compreensão e documentação da estrutura. Não propõe alterações nem toca em código/arquitetura.
> **Não confundir com** `docs/SYSTEM_MAP.md`, que descreve a arquitetura de código do TEAR V2 (camadas, entrypoints).
>
> _Nota: substitui uma análise anterior deste mesmo arquivo, que fora feita sobre uma cópia divergente (`[ELÃ] PROJETO TEAR 1.0.xlsx`). Esta é a fonte correta._

---

## Visão geral da planilha

A planilha TEAR V.1 é o sistema operacional (em produção) que gerencia o **ciclo mensal de colaboração** entre a marca (Estúdio Elã, sediada em **Nova Friburgo**) e suas influenciadoras/parceiras. Ela cobre o processo de ponta a ponta:

1. **Captação** — a candidata preenche um Google Forms (aba `FORMS`).
2. **Cadastro-mestre** — o admin promove/curadoria os dados para a `BASE DE DADOS`, que enriquece endereço via script e recebe o contrato (fee, entregáveis, canais, prazo).
3. **Geração do mês** — ao "ligar" (STATUS `ON`) uma parceira num novo mês, ela flui para as abas operacionais: `ATIVAÇÕES` (agenda de conteúdo), `FLUXO LOGÍSTICO` (envio de produtos), `BRIEFING` (detalhe por peça) e `PAGAMENTOS` (fee/pix/status).
4. **Arquivamento** — quando um conteúdo é `postado` ou um pagamento é `pago`, o registro é arquivado em **Histórico**.

Característica marcante: **a planilha se auto-documenta.** Cada aba possui uma linha especial cujas células começam com `>`, descrevendo a origem (linhagem) e a regra de cada coluna. Grande parte das regras de negócio abaixo foi extraída dessas anotações.

### Abas (6)

| # | Aba | Papel | Linhas com dado real* |
|---|---|---|---|
| 1 | `FORMS` | Captação (intake bruto do Google Forms) | 16 |
| 2 | `BASE DE DADOS` | Cadastro-mestre + contrato (entidade central) | 4 |
| 3 | `FLUXO LOGÍSTICO` | Envio físico de produtos por mês | 2 |
| 4 | `ATIVAÇÕES` | Agenda/execução de peças de conteúdo | 17 |
| 5 | `BRIEFING` | Detalhamento por peça (look, data, aprovação) | 5 |
| 6 | `PAGAMENTOS` | Fee, PIX e status de pagamento por mês | 6 |

\* As abas têm centenas de linhas pré-formatadas (grade vazia); os números acima são as linhas efetivamente preenchidas com dados reais nesta cópia.

### Chaves de integração observadas

- **`NOME`** — chave de junção de fato entre `BASE DE DADOS`, `ATIVAÇÕES`, `BRIEFING`, `PAGAMENTOS` e `FLUXO LOGÍSTICO`. **Não existe ID numérico**; a identidade é o nome da parceira.
- **`MÊS`** — chave do ciclo (string: `JULHO`, `JUNHO`, …). O "ciclo" não é uma entidade própria; é representado pelo nome do mês.

---

## Mapa das abas

### 1. `FORMS`

- **Objetivo:** capturar os dados brutos submetidos pela candidata via Google Forms.
- **Responsabilidade:** ponto de entrada (intake). Matéria-prima do cadastro, não fonte de verdade.
- **Quem alimenta:** Google Forms (uma linha por submissão).
- **Quem consome:** `BASE DE DADOS`, via mapeamento de colunas feito por script.
- **Colunas:** `Carimbo de data/hora` (A), `como prefere ser chamada` (B), `e-mail` (C), `chave PIX` (D), `razão social` (E), `CNPJ` (F), `CEP` (G), `número` (H), `complemento` (I), `@dropdown` (J).
- **Dependências:** origem (nenhuma a montante).
- **Regras percebidas:** uma submissão = uma linha; identidade + dados fiscais + PIX + endereço coletados juntos; sem chave (ligação com a base por nome/e-mail).

### 2. `BASE DE DADOS` — entidade central

- **Objetivo:** cadastro-mestre curado das parceiras, com endereço enriquecido e o contrato (fee, entregáveis, canais, prazo, links).
- **Responsabilidade:** **fonte de verdade sobre a parceira e seu contrato.** Origem dos dados que abastecem pagamentos, logística, ativações e briefing.
- **Quem alimenta:** parte puxada de `FORMS` (via script), parte enriquecida por script (endereço), parte preenchida pelo admin (contrato).
- **Quem consome:** `PAGAMENTOS` (fee, pix, nome), `FLUXO LOGÍSTICO` (endereço, nome), `ATIVAÇÕES` e `BRIEFING` (quem/quantidades).
- **Colunas e linhagem (extraída da própria planilha):**

  | Col | Campo | Origem / Regra |
  |---|---|---|
  | A | STATUS | Menu **ON/OFF**. Linha fica **verde** quando ON, **vermelha** quando OFF. Governa se a parceira entra no mês. |
  | B | NOME | Puxado de `FORMS!B`, ordenado alfabeticamente. |
  | C | CUPOM | Gerado pelo **admin** após cadastro (padrão `NOME+10`). Deseja-se editável por planilha **ou app**. |
  | D | RAZÃO | Puxado de `FORMS!E`. |
  | E | CNPJ | Puxado de `FORMS!F`. |
  | F | EMAIL | Puxado de `FORMS!C`. |
  | G | PIX | Puxado de `FORMS!D`. |
  | H | CEP | Puxado de `FORMS!G`. |
  | I | RUA | **Automação via script** (a partir do CEP). |
  | J | NUMERO | Puxado de `FORMS!H`. |
  | K | COMPLEMENTO | Puxado de `FORMS!I`. |
  | L | BAIRRO | Automação via script. |
  | M | CIDADE | Automação via script. |
  | N | UF | Automação via script. |
  | O | ENDEREÇO | **Formatado via script** (concatenação dos campos). |
  | P | FEE | Preenchido pelo **admin**. Editável por planilha ou app. |
  | Q | REEL | Qtd. de reels — **admin**. |
  | R | CARROSSEL | Qtd. de carrosséis — **admin**. |
  | S | STORIES | Qtd. de stories — **admin**. |
  | T | VALOR EXTENSO | **Automático via script** (FEE por extenso). |
  | U | LOOKS | Qtd. de looks — **admin**. |
  | V | LOOKS EXTENSO | **admin**. |
  | W | CANAIS | Canais de veiculação — **admin** (ex.: Instagram; Instagram e TikTok e anúncios). |
  | X | PRAZO | Duração do contrato — **admin** (ex.: `1 (um) ano`, `6 (seis) meses`). |
  | Y | CIDADE | **Sempre "Nova Friburgo"** (cidade-base da marca). |
  | Z | DATA | Data em que o contrato foi gerado. |
  | AA | MÊS | **Sempre o mês seguinte ao dia da geração** do contrato (gerou hoje → refere-se a AGOSTO). |
  | AB | PUXAR LOOKS | Link para a planilha externa de looks. |
  | AC | PASTA DRIVE | Link para a pasta do Drive da parceira. |

- **Regras percebidas:** STATUS ON/OFF controla a inclusão no mês; endereço é enriquecido a partir do CEP por script; contrato (fee/entregáveis/canais/prazo) é preenchido pelo admin; `MÊS` obedece à regra do "mês seguinte".

### 3. `FLUXO LOGÍSTICO`

- **Objetivo:** controlar o envio físico dos produtos às parceiras no mês.
- **Responsabilidade:** rastreamento de entrega.
- **Quem alimenta:** admin (rastreio manual) + carimbo automático de data.
- **Quem consome:** acompanhamento de recebimento (pré-requisito para a produção).
- **Colunas:** `NOME` (A), `ENDERECO` (B), `STATUS REVISÃO` (C, ex.: `Aguardando Confirmação`), `MÊS` (D), `RASTREIO` (E, link brcomerce), `DATA DE ENVIO` (F, "carimbo automático"), `STATUS LOGISTICA` (G).
- **Dependências:** `BASE DE DADOS` (nome/endereço), ciclo por `MÊS`.
- **Regras percebidas:** `RASTREIO` é preenchido **manualmente** pelo admin; `STATUS LOGISTICA` deveria ser puxado **via API** (referência à "estrutura de api feita na primeira planilha").

### 4. `ATIVAÇÕES`

- **Objetivo:** agenda e execução de cada peça de conteúdo, por parceira e mês.
- **Responsabilidade:** cronograma + máquina de estados da produção.
- **Quem alimenta:** admin (datas e status); geração do mês traz os nomes.
- **Quem consome:** `BRIEFING` (as datas fluem para lá) e o Histórico (arquivamento).
- **Colunas:** `NOME` (A), `MÊS` (B), `FORMATO` (C), `DATA_APROVACAO` (D), `DATA` (E), `STATUS` (F), `LINK` (G).
- **`FORMATO` (valores):** `REEL`, `CARROSSEL`, `STORIES`, `STORIES_1`, `STORIES_2` (stories numerados quando há mais de um).
- **`STATUS` (valores):** `em aberto`, `aprovado`, `ajustes`, `falta drive`, `postado`.
- **Dependências:** quantidade de linhas por parceira/mês deriva das quantidades da `BASE DE DADOS` (REEL/CARROSSEL/STORIES).
- **Regras percebidas (da planilha):**
  - Em um novo mês, os nomes entram aqui **ordenados por ordem alfabética e depois cronológica**.
  - As datas (`DATA`, col E) são **enviadas para a aba BRIEFING**.
  - Quando o material é subido na pasta, o **link da pasta do mês vai para a coluna G**.
  - Quando um conteúdo é marcado `postado`, ele é **arquivado → Histórico**.

### 5. `BRIEFING`

- **Objetivo:** detalhar cada peça do mês (look, data, texto e aprovação) por parceira.
- **Responsabilidade:** documento de orientação criativa + cálculo de datas de aprovação.
- **Quem alimenta:** admin (resumo e textos "sobre"); looks e datas são puxados.
- **Quem consome:** a parceira/produção (orientação) e o controle de aprovação.
- **Colunas:** `NOME` (A), `RESUMO DO MÊS` (B), `LOOK REEL/CARROSSEL/STORIES 1/STORIES 2` (C–F), `DATA REEL/CARROSSEL/STORIES 1/STORIES 2` (G–J), `SOBRE REEL/CARROSSEL/STORIES 1/STORIES 2` (K–N), `APROVAÇÃO REEL/CARROSSEL/STORIES 1/STORIES 2` (O–R).
- **Dependências:** `ATIVAÇÕES` (datas, col E), planilha externa de **looks** (link em `BASE DE DADOS.PUXAR LOOKS`).
- **Regras percebidas (da planilha):**
  - Se `ON` no início do mês, ordenar por ordem alfabética.
  - `RESUMO DO MÊS` e `SOBRE …` são escritos individualmente pelo **admin** (planilha ou painel).
  - `LOOK …` é **puxado da planilha de looks** (ver funcionamento do script antigo).
  - `DATA …` é **puxada de `ATIVAÇÕES!E`**, e o formato correto é descoberto pela coluna `FORMATO` (col C) da ativação.
  - **`APROVAÇÃO … = DATA do reel − 7 dias`. Se cair sábado ou domingo, joga para a segunda-feira seguinte.**

### 6. `PAGAMENTOS`

- **Objetivo:** controlar o pagamento do fee de cada parceira no mês.
- **Responsabilidade:** status financeiro + geração da mensagem de cobrança.
- **Quem alimenta:** dados puxados da base/briefing; status marcado pelo admin.
- **Quem consome:** o fluxo de pagamento e o Histórico.
- **Colunas:** `NOME` (A), `MÊS` (B), `FEE` (C), `PIX` (D), `STATUS` (E), `PAGAMENTO` (F), `MENSAGEM` (G).
- **`STATUS` (valores):** `em aberto`, `aguardando`, `falta nf`, `falta drive`, `pago`.
- **Dependências:** `BASE DE DADOS` (nome, fee, pix) e `BRIEFING` (mês).
- **Regras percebidas (da planilha):**
  - `NOME`, `FEE`, `PIX` são **puxados da `BASE DE DADOS`**; `MÊS` vem do briefing.
  - `MENSAGEM` é um **texto formatado para WhatsApp** gerado automaticamente para solicitar o pagamento.
  - Quando `STATUS = pago`, o pagamento é **arquivado → Histórico**.

---

## Relacionamentos entre abas

```
                         FORMS  (intake)
                           │  script mapeia colunas (B,C,D,E,F,G,H,I)
                           ▼
                  ┌─────────────────────────┐
                  │      BASE DE DADOS       │  entidade central (chave: NOME)
                  │  contrato + endereço     │  ciclo: MÊS (mês seguinte)
                  └───────────┬─────────────┘
        FEE/PIX/NOME │  NOME/ENDEREÇO │  NOME + qtds (REEL/CARROSSEL/STORIES)
                     ▼                ▼                       ▼
              ┌────────────┐  ┌───────────────┐      ┌──────────────┐
              │ PAGAMENTOS │  │ FLUXO LOGÍST. │      │  ATIVAÇÕES   │
              │ (NOME,MÊS) │  │  (NOME,MÊS)   │      │  (NOME,MÊS)  │
              └────────────┘  └───────────────┘      └──────┬───────┘
                                                            │ DATA (col E) + FORMATO (col C)
                                                            ▼
                                                     ┌──────────────┐
                                                     │   BRIEFING   │◄── planilha de LOOKS (externa)
                                                     │  (NOME,MÊS)  │    (link em BASE.PUXAR LOOKS)
                                                     └──────────────┘
```

Chaves:

- **`NOME`** liga `BASE`, `PAGAMENTOS`, `FLUXO LOGÍSTICO`, `ATIVAÇÕES`, `BRIEFING`.
- **`MÊS`** agrupa tudo que é operacional de um mesmo ciclo.
- **`FORMATO`** (em `ATIVAÇÕES`) determina qual slot de look/data/aprovação é preenchido em `BRIEFING`.

---

## Fluxo entre domínios

```
Captação (FORMS)
      ↓   script mapeia + admin cura
Cadastro / Contrato (BASE DE DADOS)   ──  STATUS ON  +  MÊS = mês seguinte
      ↓   "geração do mês" traz a parceira para o operacional
      ├──────────────► Logística (FLUXO LOGÍSTICO)   → envia produtos
      │
      └──► Ativações (ATIVAÇÕES)  → agenda peças (REEL/CARROSSEL/STORIES)
                 ↓   datas (col E) + formato (col C)
            Briefing (BRIEFING)   → look + texto + aprovação (data−7, evita fim de semana)
                 ↓   produção → upload → status "postado"
            Pagamentos (PAGAMENTOS) → fee + pix + status; mensagem WhatsApp
                 ↓
            Histórico  (arquivamento quando "postado" / "pago")
```

Isso corresponde ao fluxo de domínio esperado: **Cadastro → Ativações → Logística → Briefing → Conteúdo → Pagamentos**, com **Histórico** como destino final dos itens concluídos.

---

## Regras de negócio identificadas

1. **Ciclo mensal por nome de mês** — o ciclo é o `MÊS` (string); todo operacional pertence a um mês.
2. **Regra do "mês seguinte"** — `BASE.MÊS` é sempre o mês seguinte ao dia em que o contrato é gerado.
3. **STATUS ON/OFF governa a geração** — só parceiras `ON` entram no mês; cor da linha reflete o estado (verde/vermelho).
4. **Cidade-base fixa** — `Y = Nova Friburgo` sempre (origem logística/fiscal da marca).
5. **Enriquecimento de endereço por CEP** — RUA/BAIRRO/CIDADE/UF derivados do CEP via script; `ENDEREÇO` é a concatenação formatada.
6. **Cupom padronizado** — `NOME + 10`, gerado pelo admin.
7. **Entregáveis por tipo** — quantidades de REEL/CARROSSEL/STORIES definem quantas ativações a parceira tem no mês.
8. **Formato de stories numerado** — `STORIES_1`, `STORIES_2` quando há mais de um.
9. **Datas do briefing puxadas das ativações** — `BRIEFING.DATA_x = ATIVAÇÕES.DATA`, roteadas pelo `FORMATO`.
10. **Aprovação = data − 7 dias, evitando fim de semana** — se o resultado cair em sábado/domingo, joga para a segunda seguinte.
11. **Máquina de estados de conteúdo** — `em aberto → aprovado/ajustes/falta drive → postado` (arquiva).
12. **Máquina de estados de pagamento** — `em aberto → aguardando/falta nf/falta drive → pago` (arquiva).
13. **Rastreio manual, status logístico via API** — código de rastreio é colado à mão; status deveria vir de API (brcomerce).
14. **Mensagem de cobrança automática** — texto de WhatsApp formatado gerado para solicitar pagamento.
15. **Arquivamento em Histórico** — conteúdo `postado` e pagamento `pago` saem do operacional para o Histórico.

---

## Dependências

| Aba | Depende de | É consumida por |
|---|---|---|
| FORMS | Google Forms | BASE DE DADOS (script) |
| BASE DE DADOS | FORMS + script (endereço) + admin (contrato) | PAGAMENTOS, FLUXO LOGÍSTICO, ATIVAÇÕES, BRIEFING |
| FLUXO LOGÍSTICO | BASE (nome/endereço), API de rastreio | acompanhamento de entrega |
| ATIVAÇÕES | BASE (quantidades), admin (datas) | BRIEFING, Histórico |
| BRIEFING | ATIVAÇÕES (datas), planilha de looks | produção / aprovação |
| PAGAMENTOS | BASE (fee/pix/nome), BRIEFING (mês) | Histórico |

Cadeia crítica: **BASE DE DADOS** é o eixo — nome, contrato, endereço, quantidades e o mês nascem ali. Um erro na base propaga para as quatro abas operacionais.

---

## Pontos fortes da arquitetura atual

- **Linhagem auto-documentada** — cada coluna declara sua origem/regra na linha `>`. Isso reduz drasticamente a ambiguidade na modelagem do V2.
- **Separação intake × cadastro × operação** — `FORMS` (bruto) → `BASE` (curado) → abas operacionais é uma boa divisão de responsabilidades.
- **Modelo orientado a mês** — a operação mensal é explícita e casa com o "geração do mês" já em curso no V2.
- **Entregáveis granulares** — conteúdo modelado por tipo (reel/carrossel/stories) e por look.
- **Máquinas de estado explícitas** — ativações e pagamentos têm status bem definidos, com regra clara de arquivamento.
- **Regras temporais formalizadas** — "mês seguinte" e "aprovação = data − 7 (evitando fim de semana)" são regras de negócio concretas e testáveis.
- **Automação já mapeada** — enriquecimento de endereço por CEP, valor por extenso, mensagem de cobrança: pontos de automação já identificados pelo próprio usuário.

---

## Inconsistências encontradas

> Observações factuais, sem propor correção.

1. **Identidade por NOME, sem ID** — a chave de junção entre todas as abas é o nome da parceira. Frágil a grafias divergentes (ex.: `PATIXA TELO` vs `Patixa Telo`) e a homônimos.
2. **Ciclo por string de mês** — `MÊS` como texto (`JULHO`) não distingue anos e é sensível a maiúsculas/acentuação; não há entidade "ciclo" com início/fim.
3. **PIX heterogêneo** — ora CNPJ, ora telefone, ora e-mail, ora string livre; sem tipo definido (mesmo em `PAGAMENTOS.PIX`).
4. **CEP/CNPJ com perda de formato** — armazenados como número (notação científica, ex.: `2.861E7`, `5.44E13`), perdendo zeros à esquerda, hífen e barra.
5. **Dados de teste/lixo em FORMS** — linhas como `ghbjn / hbnjm` convivem com cadastros reais.
6. **Dupla coluna CIDADE na BASE** — `M = CIDADE` (do endereço, via script) e `Y = CIDADE` (sempre "Nova Friburgo"); mesmo rótulo, semânticas diferentes.
7. **`RAZÃO` mistura identidade** — em FORMS/BASE, a "razão social" às vezes traz nome de exibição ou CNPJ colado (`PATIXA 17597043775`).
8. **Quantidades por extenso** — `VALOR EXTENSO`, `LOOKS EXTENSO`, `PRAZO` guardam texto ("setecentos e vinte reais", "1 (um) ano"), redundantes com os campos numéricos e sujeitos a erro de digitação.
9. **Fee duplicado** — `BASE.FEE` e `PAGAMENTOS.FEE` coexistem; a fonte de verdade é a base, mas há cópia manual/puxada.
10. **Endereço duplicado** — presente em `BASE.ENDEREÇO` e `FLUXO LOGÍSTICO.ENDERECO`.
11. **`STATUS LOGISTICA` vazio / dependente de API não implementada** — a coluna existe mas o preenchimento via API é apenas uma intenção anotada.
12. **Coluna `@dropdown` (FORMS!J)** — presente sem uso/semântica clara.
13. **Histórico referenciado mas ausente** — o arquivamento ("vai para histórico") é citado em ativações e pagamentos, mas **não há aba Histórico** nesta planilha.
14. **Regras de negócio embutidas em anotações** — lógica crítica (mês seguinte, aprovação data−7, cor por status) vive como comentário `>` na grade, não como código versionado.
15. **Grade pré-formatada com centenas de linhas vazias** — infla o arquivo e dificulta distinguir "sem dado" de "linha real".

---

## Oportunidades de melhoria (apenas observações)

> Pontos de atenção para a Fase 2. **Nenhuma alteração é proposta aqui.**

- **Chave estável de parceira** — considerar um identificador próprio, em vez de depender do nome como chave de junção.
- **Entidade "Ciclo" tipada** — representar o mês/ano como um ciclo com início e fim, em vez de string de mês.
- **Tipagem e validação na leitura** — CEP, CNPJ e PIX normalizados/validados na camada de acesso (alinhado ao princípio de ACL já adotado no V2: o domínio não conhece a planilha).
- **Campos "extenso" derivados** — valor/prazo por extenso podem ser calculados a partir do número, evitando redundância manual.
- **Fonte única para fee e endereço** — deixar claro que a base é a verdade e as demais abas apenas referenciam.
- **Formalizar as regras temporais** — "mês seguinte" e "aprovação = data − 7 evitando fim de semana" como regras de domínio testáveis (não como anotação na planilha).
- **Aba/entidade Histórico** — dar lugar explícito ao arquivamento de conteúdo `postado` e pagamento `pago`.
- **Integração de rastreio (brcomerce)** — o `STATUS LOGISTICA` via API é uma automação já desejada e ainda pendente.
- **Distinguir as duas "CIDADE"** — separar cidade do endereço da cidade-base da marca.

---

*Fim do mapa funcional da planilha TEAR V.1 — Fase 1 (documentação). Aguardando aprovação para a Fase 2.*
