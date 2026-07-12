# DOMAIN MODEL V2 — Projeto TEAR

> **Modela o negócio, não a planilha.** Este documento descreve exclusivamente o
> domínio do TEAR. A grafia física das abas/colunas vive **apenas** na seção 5 (ACL).
> Persistência física: [`PLANILHA_TEAR_2.0_MAPA.md`](PLANILHA_TEAR_2.0_MAPA.md).
> Governança: [`DIRETRIZES_DE_ENGENHARIA_PARA_O_PROJETO_TEAR.md`](DIRETRIZES_DE_ENGENHARIA_PARA_O_PROJETO_TEAR.md).
> Fontes oficiais: [`CONTRATO_SOBERANO.md`](CONTRATO_SOBERANO.md). Data: 2026-07-12.

---

## 1. Princípio de modelagem

O domínio **não conhece** nomes de colunas. Ele fala a linguagem do negócio; uma
**Camada Anticorrupção (ACL)** — ponto único e obrigatório (Diretrizes §5) — traduz
domínio ↔ persistência. Colunas que não carregam conceito de negócio (infra de
add-on, campos de formatação) **não** aparecem aqui. Conceitos essenciais que não
existem como coluna (ex.: o **Compilador do Mês**, a **elegibilidade de pagamento**)
**aparecem**, pois explicam o funcionamento do sistema.

Do Contrato Soberano decorre: **não existem `Ciclo` nem `Plano de Colaboração`**. O
**Mês de Referência** é um Value Object em memória, não uma entidade persistida.

---

## 2. Linguagem Ubíqua

- **Parceira** — influenciadora com quem o TEAR mantém uma colaboração ativa. É o
  centro do domínio: identidade estável, dados de contato, condições comerciais.
- **Cadastro** — manifestação de interesse ainda não efetivada; candidata a Parceira.
- **Colaboração Mensal** — o compromisso de uma Parceira em um Mês de Referência:
  produzir conteúdo acordado em troca de produto + cachê. Conceito agregador do mês
  (não é uma tabela; materializa-se em Briefing, Ativações, Logística e Pagamento).
- **Mês de Referência** — período de competência (MM/AAAA) de uma Colaboração.
- **Compilador do Mês** — operação que, partindo da Parceira, instancia a Colaboração
  Mensal (Briefing, Ativações, Logística, Pagamento) para um Mês de Referência.
- **Briefing** — o roteiro de conteúdo que a Parceira deve seguir no mês.
- **Ativação** — um entregável de conteúdo individual (ex.: reel, carrossel, stories).
- **Envio Logístico** — a jornada do produto físico até a Parceira.
- **Pagamento** — o cachê devido à Parceira pela Colaboração do mês.
- **Arquivamento** — encerramento de uma competência: seus registros tornam-se
  Histórico imutável.

> Termos **banidos** do vocabulário: *Ciclo*, *Plano de Colaboração*.

---

## 3. Value Objects

Definidos por seus atributos, imutáveis, sem identidade persistente.

- **ChaveInfluenciadora** — identidade estável de uma Parceira, usada para relacionar
  a Colaboração Mensal à sua dona. Igualdade por valor.
- **MesReferencia** — competência MM/AAAA. Comparável e ordenável. Substituto
  conceitual do antigo Ciclo: existe só em memória e como carimbo nas operações.
- **PIX** — instrumento de recebimento da Parceira. Dado sensível (PII).
- **CNPJ** — identificação fiscal da Parceira. Dado sensível (PII).
- **Endereco** — destino físico de entrega da Parceira. Dado sensível (PII).
- **CondicaoComercial** — o que foi acordado com a Parceira: cachê e escopo de
  entregáveis (quantidade de reels/carrosséis/stories, looks). É atributo da Parceira,
  não de um plano separado — origem única do valor do Pagamento.

> PII (PIX, CNPJ, Endereco) nunca é logada nem versionada (Diretrizes §5).

---

## 4. Agregados e Entidades

Fronteiras aditivas: adicionar um domínio novo não força tocar nos outros
(Diretrizes §7.4). As entidades operacionais referenciam a Parceira pela
`ChaveInfluenciadora` + `MesReferencia`.

### Agregado raiz — **Parceira**
Fonte única da verdade do negócio. Guarda identidade, contato, `Endereco`, `PIX`,
`CondicaoComercial` e o estado de vínculo (ativa/inativa). Não depende das operações;
elas dependem dela.

### **Cadastro** (entidade de entrada)
Pré-Parceira. Ao ser aceito, promove-se a Parceira. Ciclo de vida curto.

### Agregado por competência — **Colaboração Mensal**
Não é uma tabela; é a fronteira lógica que reúne, para uma Parceira × Mês:
- **Briefing** — um por Parceira/mês.
- **Ativacao** — entregável com identidade própria e um estado de produção.
- **EnvioLogistico** — um envio com estado de jornada (do preparo à entrega).
- **Pagamento** — o cachê do mês, com estado próprio; seu valor **espelha a
  `CondicaoComercial` da Parceira** (nunca um plano à parte).

### **Histórico** (registros imutáveis)
Ao arquivar uma competência, Ativações/Logística/Pagamentos viram Histórico
somente-leitura, preservando o passado sem poluir o operacional corrente.

---

## 5. Especificação da ACL (única ponte com a persistência física)

Aqui — e **somente aqui** — o domínio encosta na grafia da planilha. Regra:
**uma ACL por aba**; nenhum outro ponto do código cita nome físico de coluna;
resolução por cabeçalho, nunca por índice.

### 5.1 `ChaveInfluenciadora` (o descompasso resolvido de vez)
| Aba física | Coluna física |
|---|---|
| `BASE DE DADOS` | `INFLU_KEY` |
| `ATIVAÇÕES` | `INFLU_KEY` |
| `PAGAMENTOS` | `INFLU_KEY` |
| `HISTÓRICO DE CONTEÚDOS` / `HISTÓRICO DE PAGAMENTOS` / `HISTÓRICO LOGÍSTICO` | `INFLU_KEY` |
| `FLUXO LOGÍSTICO` | `INFLU KEY` *(com espaço)* |
| `BRIEFING` | `INFLUENCIADORA` *(nome distinto)* |

### 5.2 `MesReferencia`
| Aba física | Coluna física |
|---|---|
| `BASE DE DADOS`, `ATIVAÇÕES`, `PAGAMENTOS`, históricos | `MES_REFERENCIA` |
| `FLUXO LOGÍSTICO` | `MES REFERENCIA` *(com espaço)* |
| `ATIVAÇÕES`, `PAGAMENTOS`, históricos | complemento `ANO_REFERENCIA` |
| `BRIEFING` | *(sem carimbo — Briefing do mês corrente)* |

### 5.3 Demais conceitos → colunas
| Conceito de domínio | Aba física | Coluna física |
|---|---|---|
| `Parceira.status` | `BASE DE DADOS` | `STATUS` |
| `CondicaoComercial.valor` | `BASE DE DADOS` | `VALOR_TOTAL` |
| `CondicaoComercial` (entregáveis) | `BASE DE DADOS` | `REELS_TEXTO`, `CARROSSEL_TEXTO`, `STORIES_TEXTO`, `LOOKS_QTD` |
| `Endereco` | `BASE DE DADOS` | `INFLUENCIADORA_ENDERECO` (+ CEP/RUA/NUMERO/COMPLEMENTO/BAIRRO/CIDADE/UF) |
| `PIX` | `BASE DE DADOS` / `PAGAMENTOS` | `CHAVE_PIX` |
| `CNPJ` | `BASE DE DADOS` | `INFLUENCIADORA_CNPJ` |
| `Ativacao.estado` | `ATIVAÇÕES` | `STATUS_CONTEUDO` |
| `Ativacao` (arquivo) | `ATIVAÇÕES` | `LINK_ARQUIVO` |
| `Ativacao.id` | `ATIVAÇÕES` | `ID` |
| `EnvioLogistico.estado` | `FLUXO LOGÍSTICO` | `STATUS LOGISTICA` |
| `EnvioLogistico` (rastreio) | `FLUXO LOGÍSTICO` | `RASTREIO` |
| `EnvioLogistico.endereco` | `FLUXO LOGÍSTICO` | `ENDERECO` |
| `Pagamento.valor` | `PAGAMENTOS` | `VALOR_TOTAL` |
| `Pagamento.estado` | `PAGAMENTOS` | `STATUS_PAGAMENTO` |
| `Arquivamento.data` | abas `HISTÓRICO …` | `DATA_ARQUIVAMENTO` |

### 5.4 Fora do domínio (a ACL ignora)
`CADASTROS` traz rótulos longos de formulário (traduzidos na promoção a Parceira);
`NVScriptsProperties` e `DO NOT DELETE - AutoCrat Job Se` são infra de add-on — **não
são conceito de negócio** e não têm representação no domínio.

---

## 6. Eventos de Domínio

Fatos de negócio, nomeados no passado e imutáveis. Descrevem a transição observável,
não a mecânica de planilha.

- **CadastroRecebido** — uma candidata manifestou interesse.
- **ParceiraPromovida** — um Cadastro tornou-se Parceira ativa.
- **MesCompilado** — a Colaboração Mensal foi instanciada para um Mês de Referência.
- **BriefingPublicado** — o roteiro do mês ficou disponível à Parceira.
- **ConteudoEnviado** — a Parceira entregou o arquivo de uma Ativação.
- **ConteudoAprovado** — uma Ativação foi aprovada.
- **ProdutoDespachado** — o produto físico foi postado (rastreável).
- **ProdutoEntregue** — a entrega foi confirmada.
- **PagamentoLiberado** — a Colaboração do mês tornou-se elegível ao cachê.
- **PagamentoConfirmado** — o cachê foi pago.
- **CompetenciaArquivada** — a competência foi encerrada e virou Histórico.

---

## 7. Pendências de design (a confirmar antes de codar)

1. **Domínios fechados de estado** de Parceira, Conteúdo, Logística e Pagamento —
   enumerar os valores reais (Diretrizes §5: lista fechada que quebra o build).
2. **Grafia canônica de `MesReferencia`** e regra de derivação a partir de
   `MES_REFERENCIA` + `ANO_REFERENCIA`.
3. **Regra de elegibilidade** de `PagamentoLiberado` a partir dos estados das
   Ativações — confirmar com o negócio.
4. **Promoção Cadastro → Parceira**: mapeamento dos rótulos de `CADASTROS`.
