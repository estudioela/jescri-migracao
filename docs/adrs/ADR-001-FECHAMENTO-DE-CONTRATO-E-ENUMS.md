# ADR-001 — Fechamento de Contrato: Enums, MesReferencia e Promoção

- **Status:** Aceita
- **Data:** 2026-07-12
- **Contexto de origem:** pendências §7 de [`DOMAIN_MODEL_V2.md`](../../DOMAIN_MODEL_V2.md)
- **Fonte de verdade:** `TEAR_V2_OFICIAL.xlsx` (Contrato Soberano)

---

## Contexto

O `DOMAIN_MODEL_V2.md` deixou em aberto: (1) os domínios fechados de estado, (2) a
grafia canônica de `MesReferencia`, (3) a regra de promoção `CADASTROS → Parceira`.
Seguindo a diretriz "impedir mecanicamente o erro" (Diretrizes §5), inspecionamos as
linhas reais da planilha oficial em vez de adivinhar.

### Princípio orientador (vale para toda esta ADR)

> **A seed é evidência do negócio, não especificação do domínio.**
> Os valores lidos da planilha comprovam *que* certos estados existem — não *definem
> sozinhos* o conjunto fechado. Modelamos o **comportamento esperado do sistema**, não
> exceções para a amostra atual.

Regras contratuais decorrentes:

1. Os valores observados representam **o estado atual dos dados** (evidência).
2. O código usa **Enum fechado** para cada dimensão de estado.
3. **Valor desconhecido → erro de validação.** Nunca aceito, mapeado a default nem
   ignorado silenciosamente (falha alto, identificando aba/coluna/valor).
4. **Ampliar um Enum exige uma nova ADR.** Nenhum estado novo entra em código sem
   registro aqui — a lista fechada é a rede de segurança.

---

## 1. Raio-X dos dados reais (evidência da seed)

| Aba | Coluna física | Valores observados na seed (ocorrências) |
|---|---|---|
| `BASE DE DADOS` | `STATUS` | `OFF` (19), `ON` (3) |
| `FLUXO LOGÍSTICO` | `STATUS REVISÃO` | `Aguardando Confirmação` (2) |
| `FLUXO LOGÍSTICO` | `STATUS LOGISTICA` | `EXPEDIDO` (2) |
| `ATIVAÇÕES` | `STATUS_CONTEUDO` | `em aberto` (15), `aprovado` (2) |
| `PAGAMENTOS` | `STATUS_PAGAMENTO` | `em aberto` (6) |

**Inconsistências transversais observadas:**
- **Casing heterogêneo:** `em aberto`/`aprovado` (minúsculo), `EXPEDIDO` (maiúsculo),
  `Aguardando Confirmação` (Title Case), `ON`/`OFF` (maiúsculo).
- **Mês** gravado como **nome pt-BR maiúsculo** (`JULHO`), não `07/2026`.
- **Ano** (`ANO_REFERENCIA`) gravado como **número com decimal** (`2026.0`).
- `MES_REFERENCIA` vazio em `BASE DE DADOS` na amostra (carimbado nas operações).

> Evidência ≠ conjunto fechado: dimensões como logística e pagamento têm estados de
> negócio ainda não exercitados pela seed. Eles fazem parte do domínio (seção 2); seus
> **rótulos crus persistidos** ficam marcados como *a confirmar* onde não observados.

---

## 2. Decisão — Enums de domínio e coerção

O domínio opera sobre **estados canônicos** (Enum fechado). A ACL coage o valor físico
cru → canônico de forma **case-insensitive, trimmed e acento-normalizada**. Para toda
inconsistência de grafia definimos três coisas: **canônico** (domínio), **normalização**
(ACL) e **persistido** (o que fica na planilha).

**Normalização geral na ACL (leitura):** `trim` → colapso de espaços internos →
casefold (ignora maiúsc/minúsc) → comparação contra a tabela de crus da dimensão.
Sem correspondência → erro de validação.

### 2.1 Vínculo da Parceira — `BASE DE DADOS.STATUS`
| Canônico (domínio) | Crus aceitos (normalizados) | Persistido | Terminal? |
|---|---|---|---|
| `Ativa` | `on` | `ON` | não |
| `Inativa` | `off` | `OFF` | não |

### 2.2 Conteúdo — `ATIVAÇÕES.STATUS_CONTEUDO`
| Canônico | Crus aceitos | Persistido | Terminal? |
|---|---|---|---|
| `EmAberto` | `em aberto` | `em aberto` | não |
| `Aprovado` | `aprovado` | `aprovado` | não |
| `Arquivado` | *a confirmar* | *a confirmar* | **sim** |

### 2.3 Pagamento — `PAGAMENTOS.STATUS_PAGAMENTO`
| Canônico | Crus aceitos | Persistido | Terminal? |
|---|---|---|---|
| `EmAberto` | `em aberto` | `em aberto` | não |
| `Pago` | *a confirmar* | *a confirmar* | **sim** |

### 2.4 Logística — `FLUXO LOGÍSTICO` (duas dimensões independentes)
**Revisão de dados — `STATUS REVISÃO`:**
| Canônico | Crus aceitos | Persistido | Terminal? |
|---|---|---|---|
| `AguardandoConfirmacao` | `aguardando confirmacao` (acento-insensível) | `Aguardando Confirmação` | não |
| `Confirmado` | *a confirmar* | *a confirmar* | sim |

**Jornada física — `STATUS LOGISTICA`:**
| Canônico | Crus aceitos | Persistido | Terminal? |
|---|---|---|---|
| `Expedido` | `expedido` | `EXPEDIDO` | não |
| `Pendente` | *a confirmar* | *a confirmar* | não |
| `Entregue` | *a confirmar* | *a confirmar* | sim |
| `Cancelado` | *a confirmar* | *a confirmar* | sim |

> Linhas *a confirmar* são pendência de negócio, **não** estados inventados para a seed:
> o rótulo cru persistido será fixado por nova ADR quando o estado ocorrer ou o negócio
> o especificar. Até lá, o Enum canônico existe; a coerção do cru correspondente falha
> como "desconhecido" — comportamento correto, não exceção.

### Consequências (Enums)
- **Impacto positivo:** um único ponto (ACL) blinda o sistema contra casing/acentos;
  o resto do código raciocina sobre um Enum estável; erro de dado sujo é imediato e localizável.
- **Limitações:** a tabela precisa ser mantida em dia; estados sem rótulo cru confirmado
  não podem ser **persistidos** até nova ADR.
- **Riscos conhecidos:** se a planilha passar a usar um rótulo novo (ex.: `entregue`),
  a operação falha até a ADR de ampliação — falha barulhenta, por design, não silenciosa.
- **Estratégia de evolução:** novo valor observado → nova ADR acrescenta a linha
  (canônico/crus/persistido) → só então o código é ampliado.

---

## 3. Decisão — `MesReferencia`

- **Físico:** nome do mês pt-BR maiúsculo (`JULHO`) + `ANO_REFERENCIA` numérico (`2026.0`).
- **Canônico do domínio:** `AAAA-MM` (ex.: `2026-07`) — ordenável e comparável.

| Aspecto | Canônico | Normalização (ACL, leitura) | Persistido |
|---|---|---|---|
| Mês | `01`–`12` | nome pt-BR casefold/acento-insensível → número (`JANEIRO`=01 … `DEZEMBRO`=12); desconhecido → erro | `NOME_MÊS` maiúsculo |
| Ano | inteiro `AAAA` | coerção numérica → inteiro (`2026.0` → `2026`) | inteiro |
| Composto | `AAAA-MM` | compõe ano+mês | duas colunas separadas |

- **Escrita (ACL):** canônico `AAAA-MM` → (`NOME_MÊS` maiúsculo, ano inteiro).
- **Sem repositório:** `MesReferencia` é Value Object em memória (não há aba de ciclo).

### Consequências (MesReferencia)
- **Impacto positivo:** ordenação/comparação triviais e livres de idioma; imune ao
  formato float do ano e ao idioma do nome do mês.
- **Limitações:** depende de uma tabela fixa de nomes de mês pt-BR; entrada em outro
  idioma/abreviação não é aceita sem ADR.
- **Riscos conhecidos:** ano ausente (não há regra de fallback definida) → erro
  explícito; abreviações (`JUL`) não mapeadas hoje.
- **Estratégia de evolução:** se a planilha migrar para `MM/AAAA` numérico, muda-se
  **apenas** a normalização na ACL; o canônico do domínio permanece `AAAA-MM`.

---

## 4. Decisão — Promoção `CADASTROS → Parceira`

### 4.1 Herdado do formulário (cópia/tradução direta)
| `CADASTROS` | → `BASE DE DADOS` |
|---|---|
| `como prefere ser chamada …` | `INFLU_KEY` (identidade) |
| `seu melhor e-mail …` | `EMAIL` |
| `chave PIX` | `CHAVE_PIX` |
| `razão social` | `INFLUENCIADORA_RAZAO_SOCIAL` |
| `CNPJ` | `INFLUENCIADORA_CNPJ` |
| `CEP` | `CEP` |
| `número …` | `NUMERO` |
| `complemento …` | `COMPLEMENTO` |

### 4.2 Preenchido pelo admin na promoção (não existe no formulário)
- **Vínculo:** `STATUS` (definir `ON`).
- **Condição comercial:** `VALOR_TOTAL` (fee), `REELS_TEXTO`, `CARROSSEL_TEXTO`,
  `STORIES_TEXTO`, `LOOKS_QTD`, `CANAIS_USO_IMAGEM`, `PRAZO_USO_IMAGEM`, `CUPOM`.
- **Enriquecimento de endereço** (form só traz CEP/número/complemento): `RUA`, `BAIRRO`,
  `CIDADE`, `UF`, `INFLUENCIADORA_ENDERECO`.
- **Contrato/assinatura:** `CIDADE_ASSINATURA`, `DATA_ASSINATURA`, `MES_REFERENCIA`.
- **Infra/links:** `INFLU_SHEET_URL`, `PASTA_DRIVE_LINK`, `SIM/NÃO`.
- **Derivados (por extenso):** `VALOR_TOTAL_EXTENSO`, `LOOKS_QTD_TEXTO`.

> **Regra:** a Parceira só é operável (elegível ao Compilador do Mês) com `STATUS = ON`
> **e** Condição Comercial (fee + entregáveis) preenchida.

### Consequências (Promoção)
- **Impacto positivo:** separa nitidamente dado do formulário de dado curado pelo admin;
  a fronteira de responsabilidade fica explícita.
- **Limitações:** a promoção não é totalmente automatizável — exige curadoria humana
  (fee, entregáveis, endereço enriquecido).
- **Riscos conhecidos:** promover sem Condição Comercial gera Parceira "meio pronta";
  mitigado pela regra de elegibilidade acima.
- **Estratégia de evolução:** se o formulário passar a capturar campos hoje manuais,
  eles migram da seção 4.2 para 4.1 via nova revisão — aditivo, sem quebrar o resto.

---

## 5. Pendências de negócio (a confirmar; não bloqueiam esta ADR)

1. Rótulos crus persistidos dos estados marcados *a confirmar* (§2).
2. Confirmação de que `STATUS REVISÃO` e `STATUS LOGISTICA` são máquinas independentes.
3. Regra de fallback de ano ausente em `MesReferencia`.
4. Regra de elegibilidade de `Pago` a partir dos estados de `ATIVAÇÕES`.
