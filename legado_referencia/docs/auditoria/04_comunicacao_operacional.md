# Auditoria Vertical — Contexto 4: Comunicação Operacional

> Fase 2 · Passo 4 · Auditoria puramente analítica. **Nenhum código foi alterado.**
> Fontes de invariante: `SYSTEM_TRUTH.md` §3; `CLAUDE.md` §2, §5; `docs/V2_ROADMAP.md`.
> Linhas conferidas em 2026-07-09 contra `main` @ `897e2dc`.

## Escopo

| Arquivo | Linhas | Função | Tamanho |
|---|---|---|---|
| `mae/Código.js` | 396-410 | `gerarSolicitacaoPagamento()` | 15 linhas |
| `mae/Código.js` | 411-442 | `gerarMensagemRevisao()` | 32 linhas |

**47 linhas. É o contexto inteiro.**

Nenhuma aba própria. Nenhuma entidade persistida. Nenhum teste. Nenhuma dependência do Portal.

---

## 1. Fluxo Funcional

Este contexto não tem fluxo de dados no sentido em que os outros cinco têm. **Ele não tem saída digital.** O canal de saída é o sistema nervoso do operador: ler a tela, apertar `Ctrl+C`, trocar de aplicativo, apertar `Ctrl+V`.

### 1.1 `gerarSolicitacaoPagamento()` — cobrança por PIX

```
Menu " Financeiro & PIX → 2. Copiar Mensagem de PIX (Aba Pagamentos)"
  → gerarSolicitacaoPagamento()                       Código.js:396
      guarda: aba ativa === PAGAMENTOS, senão ui.alert e sai
      linha  = célula ativa (r >= 2)
      lê VALOR_TOTAL, MES_REFERENCIA, INFLU_KEY, CHAVE_PIX
      formata valor: "R$ " + toFixed(2).replace('.', ',')
      monta string com markdown de WhatsApp (*negrito*)
      ┌────────────────────────────────────────┐
      │ sh.getRange(r, h['MENSAGEM_PIX'])      │  ← ÚNICO efeito persistente
      │   .setValue(msg)                       │     de todo o contexto
      └────────────────────────────────────────┘
      ui.prompt('Copie a mensagem de cobrança (Ctrl+C ou Cmd+C):', msg, OK)
```

Saída literal:

```
*SOLICITAÇÃO DE PAGAMENTO*
*Ref:* AGOSTO
*Influ:* Fulana De Tal
*Valor:* R$ 1500,00
*PIX:* fulana@email.com
```

### 1.2 `gerarMensagemRevisao()` — confirmação de dados de envio

```
Menu " Logística & Envios → 2. Copiar Dados de Confirmação (WhatsApp)"
  → gerarMensagemRevisao()                            Código.js:411
      guarda: aba ativa === FLUXO LOGÍSTICO, senão ui.alert e sai
      influName = sh.getRange(row, 1).getValue()      ← coluna 1, POSICIONAL
      abre BASE DE DADOS, getHeaderMap
      dataBase.find(INFLU_KEY == influName)           ← varredura linear
      lê INFLUENCIADORA_ENDERECO, CHAVE_PIX
      ui.prompt('Copie a mensagem abaixo...', msg, OK)
                                                       ← NÃO persiste nada
```

Saída literal:

```
*CONFIRMAÇÃO DE DADOS (ESTÚDIO ELÃ)*

Oi, linda! Tudo bem? Passando para confirmar seus dados para o envio dos looks e agendamento financeiro:

 *ENDEREÇO:* RUA X, 100, BAIRRO - CIDADE/UF, 00000-000
 *CHAVE PIX:* fulana@email.com

Está certinho? Conseguir me dar o ok?
```

### 1.3 O que este contexto realmente é

Duas funções que **leem estado de outros contextos e produzem texto**. Não enviam nada, não registram que enviaram, não sabem se foi enviado, não sabem se houve resposta.

`ui.prompt(titulo, msg, ButtonSet.OK)` é usado como *caixa de texto selecionável* — não para capturar entrada. O valor de retorno é descartado nas duas funções. É um hack de UI do Apps Script: não existe API nativa de "copiar para a área de transferência" no lado do servidor.

---

## 2. Entidades e Regras de Negócio

### Entidades

**Nenhuma.** Este contexto não possui agregado, não possui identidade, não possui ciclo de vida.

O que existe é uma quase-entidade acidental: a coluna **`MENSAGEM_PIX`** em `PAGAMENTOS` (`Código.js:407`), declarada em `setupERP()` (`Código.js:1028`). É o único vestígio persistente de uma comunicação. E ela:

- é **escrita** por `gerarSolicitacaoPagamento()`;
- é **lida** por ninguém — nem `getPagamentos()` (`WebApp.js:386`), nem `arquivarGenerico()` explicitamente (é copiada por nome, junto com todas as outras, para `HISTÓRICO DE PAGAMENTOS`);
- **não tem timestamp**, não tem destinatário, não tem status de envio.

Ou seja: `MENSAGEM_PIX` registra que uma mensagem foi *gerada*, jamais que foi *enviada*.

### Regras que o código de fato executa

1. **RN-21** — A mensagem só é gerada a partir da célula ativa. É uma operação de UI, um registro por vez.
2. **RN-22** — `gerarSolicitacaoPagamento()` exige que a aba ativa seja `PAGAMENTOS`; `gerarMensagemRevisao()` exige `FLUXO LOGÍSTICO`.
3. **RN-23** — `formatarTitleCase()` (`Código.js:1006`) é aplicada ao nome da influenciadora na cobrança, mas **não** na mensagem de revisão (que nem usa o nome).
4. **RN-24** — Endereço e PIX ausentes viram os literais `"NÃO CADASTRADO"` / `"NÃO CADASTRADA"` (`Código.js:433-434`). A mensagem é gerada mesmo assim.

### Vocabulário do domínio

Um detalhe que merece registro, porque a Linguagem Ubíqua importa: as mensagens são escritas em **segunda pessoa, tom afetivo e gênero feminino fixo** — `"Oi, linda!"`, `"Está certinho?"`. Isso não é um acidente de implementação. É a voz da marca, hardcoded numa string de 32 linhas de Apps Script.

Qualquer módulo de comunicação da V2 herda esse requisito: **as mensagens têm autoria editorial**. Não são notificações transacionais.

---

## 3. Aderência às Invariantes

### ✅ Respeitadas

- **Guarda de aba antes de qualquer leitura.** As duas funções verificam `sh.getName()` e abortam com `ui.alert` (`Código.js:398, 416-419`).
- **Guarda de linha de cabeçalho.** `if (r < 2) return` / `if (row < 2) return`.
- **`BASE DE DADOS` resolvida por `getHeaderMap()`** em `gerarMensagemRevisao()` (`Código.js:427`). Conforme `SYSTEM_TRUTH.md` §4.
- **Nada é enviado.** O sistema não tem, hoje, nenhuma capacidade de disparar mensagem para terceiro. Sob a ótica de risco, isso é uma **propriedade**, não um defeito: não há vetor de spam, não há vazamento acidental, não há custo de API. Toda comunicação passa por um humano que lê o texto antes de enviar.

### ❌ Violações e divergências

#### COM-01 · 🟠 **`gerarSolicitacaoPagamento()` quebra se `MENSAGEM_PIX` não existir**

`Código.js:403-407`:

```js
const valor = sh.getRange(r, h['VALOR_TOTAL']).getValue();
...
sh.getRange(r, h['MENSAGEM_PIX']).setValue(msg);
```

Nenhuma guarda `if (h['MENSAGEM_PIX'])`. Se a coluna não existir no cabeçalho, `h['MENSAGEM_PIX']` é `undefined`, e `getRange(r, undefined)` **lança exceção não tratada** — a função não tem `try/catch`. O usuário vê um erro cru do Apps Script.

O mesmo vale para `VALOR_TOTAL`, `MES_REFERENCIA`, `INFLU_KEY`, `CHAVE_PIX` (L403-405).

Compare com o padrão defensivo adotado no resto do repositório — `SidebarBackend.js:87` (`if (h[campo] && ...)`), `Código.js:128-132` (`if (hBrief['INFLU_KEY'])`), `WebApp.js:479` (`h['FORMATO'] ? ... : ""`). Este contexto ficou de fora do endurecimento.

Probabilidade baixa (a coluna é criada por `setupERP()`), impacto baixo (erro visível, não corrupção). Registro por consistência.

#### COM-02 · 🟡 **`gerarMensagemRevisao()` lê `INFLU_KEY` por posição**

`Código.js:423`:

```js
const influName = sh.getRange(row, 1).getValue();
```

Coluna 1 de `FLUXO LOGÍSTICO`, hardcoded — enquanto a função, três linhas abaixo (L427), resolve `BASE DE DADOS` por `getHeaderMap()`. Inconsistência dentro da mesma função.

É a terceira ocorrência do mesmo padrão no sistema: `sincronizarLooks()` (`Código.js:467`, `rb[0]`), a flag `ON`/`OFF` (`r[0]`, sete call-sites) e esta. Todas resistiram à migração de 2026-07-07 porque nenhuma delas está em `BASE DE DADOS`.

Relacionado: `INV-10` em `03_execucao_operacional.md` — `FLUXO LOGÍSTICO` é a aba menos protegida do sistema. É escrita por array posicional e lida por índice literal.

#### COM-03 · 🟡 **`gerarMensagemRevisao()` propaga dados corrompidos sem saber**

A mensagem confirma **`INFLUENCIADORA_ENDERECO`** (`Código.js:433`). Essa coluna é derivada, e — conforme `01_gestao_parceiros.md`, V-03 — **fica desatualizada sempre que a parceira muda o CEP pelo Portal**, porque `updatePerfil()` não a recalcula e o `onEdit` que deveria fazê-lo não tem autorização para `UrlFetchApp`.

Consequência encadeada:

```
parceira muda CEP no Portal
  → BASE.CEP atualizado, BASE.INFLUENCIADORA_ENDERECO desatualizado
  → gerarMensagemRevisao() lê o endereço antigo
  → operador envia WhatsApp: "Está certinho?"
  → parceira responde "sim" (o endereço que ela vê é... o antigo)
  → look é despachado para o endereço errado
```

A mensagem de confirmação, que existe precisamente para prevenir erro de endereço, **confirma o erro**. Não é bug deste contexto — é uma consequência de V-03 que só se torna visível aqui. Registro para que a correção de V-03 seja priorizada com o peso certo.

#### COM-04 · 🟡 **`MENSAGEM_PIX` sobrescreve sem histórico e viaja para o arquivo morto**

`gerarSolicitacaoPagamento()` sobrescreve a célula a cada execução (`Código.js:407`). Gerar a cobrança duas vezes descarta a primeira.

Quando `arquivarGenerico()` move a linha de `PAGAMENTOS` para `HISTÓRICO DE PAGAMENTOS` (`Código.js:754`), copia `MENSAGEM_PIX` por nome — a coluna existe nas duas abas (`Código.js:1028-1029`). Portanto o texto integral da cobrança, **com a chave PIX da parceira**, é replicado no histórico permanente.

Não é vazamento (a chave PIX já está em coluna própria nas duas abas). Mas é duplicação de dado pessoal sem propósito de leitura — nenhum código lê `MENSAGEM_PIX`, em nenhuma das duas abas.

---

## 4. Lixo Técnico e Riscos

| # | Item | Local | Natureza |
|---|---|---|---|
| L-25 | `MENSAGEM_PIX` — escrita, nunca lida, replicada no histórico | `Código.js:407, 1028-1029` | Dado morto com PII |
| L-26 | Retorno de `ui.prompt()` descartado nas duas funções | `Código.js:408, 437` | `prompt` usado como `alert` selecionável |
| L-27 | Sem `try/catch`, sem `Logger.log`, sem guarda `if (h[col])` | `Código.js:396-442` | Único par de funções de `Código.js` fora do endurecimento de 2026-07-07 |
| L-28 | `SpreadsheetApp.getUi()` chamado 3× em `gerarSolicitacaoPagamento` | `Código.js:398, 408` | Trivial, mas denota código não revisado |
| L-29 | Nome do menu diz "Adobe/WhatsApp" no banner de seção | `Código.js:394` | `// 6. ADOBE/WHATSAPP: MENSAGENS E RELATÓRIOS` — "Adobe" não tem relação com nada no sistema. Resíduo de outra época. |

### Acoplamentos

Curiosamente, **são os mais limpos do sistema**. As duas funções são `[Exclusivo]`: leem de outros contextos, escrevem quase nada, não são chamadas por ninguém além do menu. Nenhum teste depende delas; nenhuma delas depende de teste.

O acoplamento real é **invisível e semântico**: `gerarMensagemRevisao()` depende da corretude de `INFLUENCIADORA_ENDERECO`, um dado derivado que ninguém garante (COM-03).

---

## 5. Avaliação especial — um contexto que ainda não existe

### 5.1 O diagnóstico

Dos seis Bounded Contexts do Projeto Tear, cinco existem no código e precisam ser **desemaranhados**. Este precisa ser **construído**.

O que existe hoje são **dois geradores de string**, com 47 linhas somadas, cujo canal de entrega é a área de transferência do sistema operacional. Não há:

| Capacidade | Existe? |
|---|---|
| Registro de que uma mensagem foi enviada | ❌ (`MENSAGEM_PIX` registra *geração*, não envio) |
| Timestamp de envio | ❌ |
| Destinatário estruturado (telefone, e-mail) | ❌ — `getPerfil()` devolve `telefone: ""` hardcoded (`WebApp.js:546`) |
| Status de entrega / leitura / resposta | ❌ |
| Idempotência (não reenviar) | ❌ |
| Template versionado | ❌ (string literal no meio da função) |
| Fila / retry | ❌ |
| Trilha de auditoria | ❌ |
| Consentimento / opt-out | ❌ |

**A ausência de `telefone` é o achado mais concreto deste documento.** `getPerfil()` (`WebApp.js:546`) devolve `telefone: ""` — um campo fantasma no contrato do Portal. `BASE DE DADOS` não tem coluna de telefone (não consta em `INTEGRIDADE_BASE_COLUNAS_ESPERADAS`, `SchemaExporter.js:230-234`, nem em `onFormSubmit()`, `Código.js:843`).

O sistema envia mensagens de WhatsApp **sem armazenar um único número de telefone.** O operador sabe o número porque já está conversando com a pessoa. Essa é a "integração".

### 5.2 O que precisa ser construído do zero, se a V2 exigir notificação ativa

Em ordem de dependência — cada camada exige a anterior:

**Camada 0 — Dado (pré-requisito absoluto)**
- Coluna `TELEFONE` em `BASE DE DADOS`, populada via `onFormSubmit()` e sidebar.
- Migração idempotente de menu, no padrão já estabelecido por `garantirColunaAnoReferenciaBriefing()` (`Código.js:616`).
- Coluna de consentimento (`OPT_IN_WHATSAPP`). LGPD: mensagem transacional para PJ tem base legal de execução de contrato, mas o registro do consentimento é o que se defende numa fiscalização.

**Camada 1 — Domínio**
```
MensagemTemplate            ← template + versão + variáveis declaradas
Notificacao                 ← agregado raiz: destinatário, template, payload,
                              status (PENDENTE|ENVIADA|FALHOU|ENTREGUE), timestamps
NotificacaoRepository       ← nova aba `NOTIFICAÇÕES` (Sheets continua sendo o banco, §12.1)
```

**Camada 2 — Gateway**
```
MensagemGateway (interface)
  ├─ ClipboardGateway       ← o comportamento ATUAL, preservado como implementação
  └─ WhatsAppGateway        ← novo. UrlFetchApp → Meta Cloud API ou provedor
```

Manter o `ClipboardGateway` não é conservadorismo: é a única forma de refatorar este contexto **sem mudar comportamento observável** (`CLAUDE.md` §12.4.1). O envio ativo vira uma segunda implementação, ativada por flag.

**Camada 3 — Disparo**
- `onEdit` **não serve**: trigger simples não tem `UrlFetchApp` (ver `03_execucao_operacional.md`, §5.2, armadilha 1).
- Trigger instalável ou execução por menu. Mesma restrição de plataforma já enfrentada por `SchemaExporter` (`SchemaExporter.js:14-17`) e `onFormSubmit` (`CLAUDE.md` §6).

### 5.3 Restrições da stack que a V2 herda (`CLAUDE.md` §12.1 — a stack não muda)

1. **Sem fila real.** Apps Script não tem broker. Retry vira coluna de status + trigger de tempo varrendo pendências.
2. **Cota de `UrlFetchApp`**: 20.000 chamadas/dia (conta gratuita). Não é gargalo para dezenas de parceiras; é para milhares.
3. **6 min de execução por trigger.** Um lote grande precisa de checkpoint.
4. **WhatsApp Business API exige aprovação de template pela Meta**, e cobra por conversa iniciada pelo negócio. O tom editorial atual (`"Oi, linda!"`) provavelmente **não passa** num template de categoria *utility* — templates transacionais são rígidos. Isso é um requisito de produto, não técnico, e precisa ser resolvido antes de qualquer linha de código.

### 5.4 Recomendação

**Não construir agora.** Este contexto não bloqueia nenhum outro, não tem débito técnico relevante (47 linhas, dois achados 🟡, um 🟠 de baixa probabilidade) e não é mencionado no `docs/V2_ROADMAP.md` como escopo.

O que fazer nesta fase, na ordem:

1. **Corrigir COM-03 na origem**, atacando V-03 (`01_gestao_parceiros.md`). A mensagem de confirmação de endereço estar confirmando um endereço obsoleto é o defeito de negócio mais caro deste documento — e a correção não vive aqui.
2. **Extrair os dois templates para constantes nomeadas.** Refatoração de risco zero, valor imediato: a voz da marca deixa de estar enterrada no meio de `getRange()`. Prepara a Camada 1 sem antecipar abstração (`CLAUDE.md` §12.3).
3. **Adicionar as guardas `if (h[col])` e um `try/catch` com `Logger.log`** (COM-01), alinhando ao padrão do resto do arquivo.
4. **Registrar `TELEFONE` como dívida de dado**, não de código. Sem ele, notificação ativa é impossível — e adicionar uma coluna é a mudança mais barata do sistema.

Quando a V2 pedir notificação, a decisão inicial não é técnica. É: **quem escreve a mensagem, e a Meta vai aprovar o texto?**

---

## Resumo executivo

| Achado | Severidade | Ação |
|---|---|---|
| COM-03 · Mensagem de confirmação de endereço propaga endereço obsoleto (consequência de V-03) | 🟠 Alto | Corrigir V-03 em Gestão de Parceiros |
| COM-01 · Sem guarda `if (h[col])`, sem `try/catch` — únicas funções de `Código.js` fora do endurecimento | 🟠 Baixa prob. | Alinhar ao padrão do arquivo |
| COM-02 · `INFLU_KEY` lida por índice literal (`getRange(row, 1)`) | 🟡 Médio | `LogisticaRepository` |
| COM-04 · `MENSAGEM_PIX` escrita, nunca lida, replicada no histórico com PII | 🟡 Baixo | Avaliar remoção da coluna |
| **Contexto inexistente** — 47 linhas, zero entidades, zero capacidade de envio, **zero telefones armazenados** | ℹ️ Estrutural | Não construir agora. Extrair templates. Registrar `TELEFONE` como dívida de dado. |
