# PLANO DE MIGRAÇÃO — PROJETO TEAR (V1 → V2)

> **Fase 3: Síntese e Ação.** Consolidação executiva das seis auditorias verticais de `docs/auditoria/`.
> Documento de **plano**, não de verdade. Não duplica `SYSTEM_TRUTH.md`, `SYSTEM_MAP.md`, `FLOW.md` ou `CLAUDE.md` — referencia. Onde diverge deles, a divergência está marcada como tal e a ação é corrigir a fonte, não este arquivo (`CLAUDE.md` §11, regra "não criar nova fonte de verdade").
> Âncora de código: `main` @ `897e2dc`. Todas as citações de linha vêm dos relatórios de auditoria, conferidas naquele commit.
> Regime: `CLAUDE.md` §12 (MODO V2 — EVOLUÇÃO AUTORIZADA). Limites de §12.4 **não relaxados por nenhum item deste plano**.

---

## Sumário da postura

O sistema não precisa ser reescrito. Precisa ser **desemaranhado**, e há exatamente uma coisa impedindo isso: quatro funções carregam responsabilidade de três ou mais contextos ao mesmo tempo, e a função mais perigosa do repositório (`arquivarGenerico()`) é chamada por quatro lugares, atravessa três contextos e não tem um único teste.

A ordem correta não é "refatorar e depois testar". É **testar, extrair, e só então corrigir** — porque três dos quatro achados 🔴 vivem precisamente nas funções sem cobertura (`salvarPagamentoExtra()`, `arquivarGenerico()`, `SidebarBackend.js` inteiro). Isso não é coincidência (`05_operacao_financeira.md` §5.5).

Antes de qualquer refatoração, existe um Episódio 0: quatro correções que não esperam a arquitetura.

---

# 1. EPISÓDIO 0 — HOTFIXES IMUNOLÓGICOS (AÇÃO IMEDIATA NA V1)

Quatro ações, executáveis contra `main` hoje, sem depender de uma única linha da arquitetura V2. Cada uma é um PR próprio (`CLAUDE.md` §12.5).

## 1.0 Divergência de escopo — leia antes de executar

O escopo pedido nomeia "os 4 achados críticos". Os relatórios classificam **cinco** achados como 🔴, e o CEP não é um deles:

| Achado | Severidade real | Está no Episódio 0? |
|---|---|---|
| INV-06 · XSS em `renderPendencias` | 🔴 Crítico | ✅ H1 |
| FIN-01 · `ANO_REFERENCIA` em `salvarPagamentoExtra` | 🔴 Crítico | ✅ H2 |
| INT-01 · QA Shadow falso positivo | 🔴 Crítico (governança) | ✅ H4 |
| V-03 · CEP no `onEdit` | 🟠 **Alto, não crítico** | ✅ H3 (por decisão de escopo) |
| **V-01 · Token bearer em `localStorage`** | 🔴 Crítico | ❌ **omitido** |
| **INV-01 · `BRIEFING` sobrescrito + `temBriefing:true`** | 🔴 Crítico | ❌ **omitido** |

**V-01 não pode ser omitido junto com H1.** Os dois achados se compõem, e o relatório `03_execucao_operacional.md` (INV-06) é explícito: *"XSS armazenado + bearer token em `localStorage` = sequestro de sessão de qualquer parceira que abra o Portal."* H1 remove o vetor de injeção **hoje conhecido**. V-01 é o amplificador: token puro, sem binding de IP/UA, sessão de 6 h com renovação deslizante que **nunca expira**, e `logout()` fire-and-forget que deixa o token vivo no servidor se a chamada falhar.

Corrigir só H1 é fechar uma porta e deixar o cofre aberto. As três mitigações de V-01 nomeadas em `01_gestao_parceiros.md` §V-01 são baratas e **duas delas cabem no Episódio 0**:

- `sairDoApp()` (`Index.html:966`) passa a **aguardar** `logout()` antes de limpar o storage (hoje limpa primeiro, dispara depois).
- Trocar `localStorage` por `sessionStorage` (morre com a aba; hoje sobrevive ao reboot).
- Reavaliar a renovação deslizante ilimitada de `validarToken()` (`WebApp.js:221`) — teto absoluto de sessão.

**São decisão do usuário, não do agente** (`01_gestao_parceiros.md` é enfático). Ficam registradas aqui como H5, fora do escopo pedido, aguardando decisão. **INV-01 é decisão de modelagem** (três saídas em `02_planejamento_operacional.md` §5.2) e não é hotfix.

---

## H1 · XSS armazenado em `renderPendencias()` (INV-06)

**Fonte:** `03_execucao_operacional.md` INV-06 · 🔴
**Arquivo:** `mae/Index.html:1201-1203`; origem do dado em `mae/WebApp.js:267-270`

### O defeito

```js
botoes += '<button ... onclick="abrirBriefing(\''+item.idAtivacao+'\')">Ver briefing</button>';
```

`escaparHtml()` (`Index.html:1220`) é aplicada a `item.formato` (L1207) e **não** a `item.idAtivacao`. O id é o valor bruto da célula `ID` de `ATIVAÇÕES`, editável por qualquer pessoa com escrita no ERP. `backfillIdAnoAba_()` (`Código.js:717`) só preenche células **vazias** — um valor arbitrário pré-existente sobrevive à migração.

### ⚠️ Correção proposta pelo relatório é insuficiente

`03_execucao_operacional.md` §5.3 propõe *"`escaparHtml(item.idAtivacao)` — PR de uma linha"*. **Isso provavelmente não fecha o buraco**, e a razão é sutil:

O valor é interpolado dentro de um atributo `onclick`, isto é, num contexto **JavaScript aninhado em HTML**. O parser HTML decodifica referências de caractere no valor do atributo **antes** de entregar a string ao parser JS. Se `escaparHtml()` for um escapador de entidades HTML — o que seu nome e seu uso em contexto de texto (L1207) indicam — então o payload `'); alert(1); //` vira `&#39;); alert(1); //` no source, o HTML decodifica de volta para `'); alert(1); //`, e o JS executa.

**Escapar para HTML não protege um contexto JS.** É o pitfall clássico de `onclick` inline.

### Especificação técnica

Três camadas, todas necessárias:

**H1.a — Fronteira do servidor (defesa em profundidade).** Em `getPendencias()` (`WebApp.js:267-270`), validar o formato do id antes de emitir:

```
idLinha aceito  ⟺  /^[0-9a-fA-F-]{36}$/  (UUID de Utilities.getUuid)
                 ∨  /^ROW\d+$/            (fallback de transição, INV-12)
caso contrário  →  emitir "" e registrar Logger.log com a linha ofensora
```

Contrato preservado: `idAtivacao` continua sendo string. Um id malformado hoje é um XSS; depois, é um botão inerte + um log. Ganho líquido.

**H1.b — Eliminar o `onclick` inline (a correção real).** Trocar interpolação em atributo de evento por `data-*` + delegação:

```
<button class="btn-briefing" data-id="<escaparHtml(item.idAtivacao)>">Ver briefing</button>
```
com **um** listener delegado no contêiner de pendências lendo `e.target.dataset.id`.

Aqui `escaparHtml()` é suficiente e correta, porque o valor nunca é reparseado como JavaScript — `dataset` devolve a string já decodificada, sem passar por um parser JS. As funções `abrirBriefing()` / `abrirEnviarMaterial()` são internas ao front: **nenhuma mudança no contrato `Index.html` ↔ `WebApp.js`** (§12.4.1 preservado).

**H1.c — Teste de caracterização.** Em `test/index-front-puras.test.js` (já exercita `renderPendencias`), asserção com o payload literal `'); alert(1); //` no `idAtivacao`, verificando que o HTML gerado não contém `alert` fora de um valor de atributo escapado.

### Verificação obrigatória antes do PR

Abrir `mae/Index.html:1220` e **ler a implementação de `escaparHtml()`**. Se ela já faz escape para contexto JS (backslash em `'`, `\`, `\n`), H1.b pode ser reduzido. Se é entity-escape puro, H1.b é obrigatório.
*(Esta leitura é proibida nesta sessão de síntese por regra de contexto; é o primeiro passo do PR de execução.)*

**Impacto observável:** nenhum, para todo `ID` que seja UUID — ou seja, todos, hoje. Risco de regressão: baixo.

---

## H2 · `salvarPagamentoExtra()` omite `ANO_REFERENCIA` (FIN-01)

**Fonte:** `05_operacao_financeira.md` FIN-01 · 🔴 — *"Está produzindo dado errado hoje."*
**Arquivo:** `mae/SidebarBackend.js:110-114`

### O defeito, ponta a ponta

A sidebar grava 5 campos e não grava `ANO_REFERENCIA`. A célula fica vazia. Então:

- `listarPeriodos()` (`WebApp.js:678-680`) gera a chave `"AGOSTO|"` → `{mes:"AGOSTO", ano:null}`, **um período distinto** de `"AGOSTO|2026"`.
- O seletor do Portal passa a exibir `agosto` **e** `agosto/2026`.
- Selecionando `agosto` (ano `null`), `getPagamentos()` (`WebApp.js:411`) avalia `!anoFiltro === true` e **desliga o filtro de ano** — a parceira vê todos os agostos de todos os anos somados, com `totalPrevisto` inflado.
- Selecionando `agosto/2026`, o pagamento extra (`rowAno = null`) **não aparece**.

Um pagamento extra cria um período fantasma, some do período correto, e o fantasma soma dinheiro de anos diferentes.

### Especificação técnica

**H2.a — Rede de segurança primeiro (`CLAUDE.md` §12.4.7, inegociável).**
Nenhum teste carrega `SidebarBackend.js` hoje (confirmado em `01_gestao_parceiros.md` §5.4 e `05_operacao_financeira.md` §5.5). Criar `test/sidebar-pagamento-extra.test.js` caracterizando o comportamento **atual** (célula vazia) antes de mudar uma linha.

**H2.b — Origem do ano.** Duas opções; **a decisão é do usuário**:

| Opção | Custo | Risco |
|---|---|---|
| (i) `SidebarPagamento.html` passa a enviar `obj.ano` | Toca a UI da sidebar | Baixo, explícito |
| (ii) Derivar de `obj.mes` via `parseMesAno()`, caindo no ano corrente | Zero UI. Reusa `Código.js:982` (pura, já testada) | Herda RN-09: `"AGOSTO"` → ano corrente. Errado se lançarem agosto/2025 em 2026 |

**Recomendação: (ii)**, alinhada ao padrão já vigente no sistema (`parseMesAno()`, RN-09), com `Logger.log` do ano derivado. Migrar para (i) quando a sidebar for tocada por outro motivo.

**H2.c — Backfill.** As linhas já gravadas continuam com ano vazio. Função de menu idempotente e não-destrutiva, no padrão exato de `garantirColunaAnoReferenciaBriefing()` (`Código.js:616`) e `backfillIdAnoAba_()` (`Código.js:710`):

```
backfillAnoReferenciaPagamentos()
  → preenche SOMENTE células ANO_REFERENCIA vazias
  → em PAGAMENTOS (aba viva): deriva de DATA_PAGAMENTO; se ausente, ano corrente
  → em HISTÓRICO DE PAGAMENTOS: deriva de DATA_PAGAMENTO; se ausente, DEIXA VAZIO
  → ui.alert de confirmação antes; relatório de quantas linhas tocou
```

A assimetria é deliberada e segue a regra já estabelecida em `backfillIdAnoAba_()`: *"em histórico sem data aproveitável, fica vazio, **nunca chuta**"* (`CLAUDE.md` §3). O custo é que períodos fantasma remanescentes no histórico sobrevivem ao backfill. **Levar ao usuário**: chutar o ano no histórico é reescrever registro financeiro passado.

**Impacto observável (§12.4.1 — exige aprovação):** o período fantasma some do seletor; pagamentos extras passam a aparecer no mês correto; `totalPrevisto` deixa de somar anos distintos. **O comportamento atual é o defeito** — mas a mudança é visível para a parceira e precisa de go-ahead.

---

## H3 · Endereço derivado dessincroniza; auto-CEP nunca funcionou (V-03)

**Fonte:** `01_gestao_parceiros.md` V-03 · 🟠 Alto · e sua consequência `04_comunicacao_operacional.md` COM-03 · 🟠
**Arquivos:** `mae/WebApp.js:590-594` (`updatePerfil`), `mae/Código.js:293-295` (`onEdit`), `mae/Código.js:889-928` (`preencherEnderecoPorCEP`)

### O defeito

`updatePerfil()` grava `CEP`, `NUMERO`, `COMPLEMENTO` e **não recalcula** `RUA`, `BAIRRO`, `CIDADE`, `UF`, `INFLUENCIADORA_ENDERECO`. O mecanismo que deveria cobrir isso — `onEdit()` observando `CEP` — **não dispara**, por duas razões independentes e ambas de plataforma:

1. `onEdit` é **trigger simples**: não é acionado por `setValue()` de outra execução, só por edição humana na UI.
2. Mesmo disparando, `preencherEnderecoPorCEP()` chama `UrlFetchApp.fetch()` (`Código.js:908`), e **triggers simples não têm autorização para `UrlFetchApp`**. O próprio repositório documenta o fenômeno para `DriveApp` em `SchemaExporter.js:19-23` — é a razão de existir um trigger instalável separado.

**Corolário (o repo já sabia):** o item de menu `"2. Preencher Endereço por CEP (Aba Base)"` (`Código.js:46`) existe exatamente porque o automático não funciona.

E o custo real aparece em outro contexto: `gerarMensagemRevisao()` lê `INFLUENCIADORA_ENDERECO` para perguntar *"Está certinho?"* no WhatsApp. **A mensagem que existe para prevenir erro de endereço confirma o endereço errado**, e o look é despachado para o lugar errado (COM-03).

### Pré-checagem sem tocar código

Confirmar no `SYSTEM_SCHEMA.md` gerado pelo `SchemaExporter` (campo `triggersInstalados`, `SchemaExporter.js:334`) se existe algum `onEdit` **instalável** apontando para `Código.js`. Se existir, a razão nº 2 permanece mas a nº 1 cai, e o diagnóstico muda. Custo: zero.

### Especificação técnica — o que **não** fazer

**Não mover `preencherEnderecoPorCEP()` para um trigger instalável no Episódio 0.** `01_gestao_parceiros.md` §5.2 é explícito: isso faria o auto-CEP funcionar **pela primeira vez**, o que é mudança de comportamento observável (§12.4.1), exige PR próprio, decisão do usuário e aviso à operação — *"endereços vão começar a se mover sozinhos"*.

### Especificação técnica — o que fazer

**H3.a — Extrair `EnderecoService` (risco zero).** A lógica de montagem do endereço está **duplicada**, com formatação idêntica escrita duas vezes: `onFormSubmit()` (`Código.js:865-869`) e `preencherEnderecoPorCEP()` (`Código.js:921-925`).

```
EnderecoService                       ← puro + um gateway
  resolverPorCep(cep) → {rua, bairro, cidade, uf}     [CepGateway → brasilapi]
  montarEnderecoCompleto(partes) → string             [PURO, testável sem mock]
```

`01_gestao_parceiros.md` §5.3 classifica como *"extração pura, sem mudança de comportamento, testável isoladamente. **Zero risco.**"* É o primeiro item da fila.

**H3.b — `updatePerfil()` passa a recalcular o endereço.** O Web App roda com autorização plena — `UrlFetchApp` já é usado ali (`iniciarEnvioResumable()`, `WebApp.js:888`). A restrição de trigger simples **não se aplica** a este caminho.

⚠️ **Detalhe de implementação que a arquitetura ingênua erra:** `updatePerfil()` grava sob `LockService`. Fazer a chamada HTTP à `brasilapi` **dentro** do lock serializa todos os salvamentos de perfil atrás de uma rede de terceiro. Ordem obrigatória:

```
1. resolverPorCep(cep)              ← FORA do lock, chamada de rede
2. LockService.waitLock(10000)
3. gravar CEP/NUMERO/COMPLEMENTO + campos derivados
4. releaseLock()  (finally)
```

**Modo de falha:** se a `brasilapi` falhar ou der timeout, **gravar o CEP e não tocar os campos derivados**, com `Logger.log` do erro. Nunca falhar o salvamento do perfil por causa de uma API externa. Nunca escrever um endereço parcial.

**H3.c — Fechar o `catch` vazio (L-06).** `preencherEnderecoPorCEP()` (`Código.js:928`) engole toda exceção em `catch(e){}` vazio. É um dos **dois últimos** catches vazios de `Código.js` que ficaram de fora do endurecimento de 2026-07-07 (o outro é `sincronizarLooks()`, `Código.js:476`, INV-03). Adicionar `Logger.log`, paridade com `onEdit()` (L307) e `onFormSubmit()` (L878).

**Impacto observável (§12.4.1 — exige aprovação):** ao mudar o CEP pelo Portal, os campos derivados passam a se atualizar. É a correção que faz o sistema parar de mentir. Contido, síncrono, no Web App — **não** liga o auto-CEP no ERP.

---

## H4 · QA Shadow: `aprovado: true` não significa o que `SYSTEM_TRUTH.md` §6 afirma (INT-01)

**Fonte:** `06_inteligencia_operacional.md` INT-01 · 🔴 Crítico (governança)
**Arquivo a editar:** `SYSTEM_TRUTH.md` §6. **Arquivo a NÃO tocar:** `mae/QaShadow.js`.

### 🛑 ALERTA — a ação é editar a documentação, não o código

`runQA_E2E()` (`QaShadow.js:143`) coleta 14 verificações. **Doze são fixtures constantes:**

```js
function simularLoginQA() {
  return { ok: true, token: 'QA-TOKEN-INFLUENCER-SIMULADO', ... };   // ok:true é literal
}
```

E `coletarFalhasQA()` (`QaShadow.js:185-199`) testa `ok === false` contra doze constantes `true`. **Não existe caminho de execução em que essas doze reprovem.** Logo:

> `runQA_E2E().aprovado` é determinado **exclusivamente** por `sistema.integridade` e `sistema.schemaExporter` — isto é: (1) as abas de `SETUP.ABAS` existem, (2) as 13 colunas esperadas existem em `BASE DE DADOS`, (3) `gerarSchemaPlanilha()` roda sem lançar.

Isso é um **smoke test de estrutura**. É valioso. **Não é um teste E2E**, e não valida contrato — validar contrato exigiria comparar o shape da fixture com o shape retornado pela função real, e **nada compara**.

### A afirmação incorreta

`SYSTEM_TRUTH.md` §6, bullet "Validação pós-deploy `@29`", afirma hoje:

> *"QA Shadow rodado manualmente na planilha real logo após o deploy `@29` — **aprovado, 0 falhas, 2896ms**. Confirma que os fixes de performance (cache de influKey/nome por cupom, remoção de lock em funções só-leitura, cache de abas legado, `onEdit()` saindo mais cedo) não quebraram o contrato validado pelo QA Shadow."*

**A conclusão não se sustenta.** Nenhum dos quatro fixes citados é exercitado por `runQA_E2E()`: `getInfluKeyByCupomCached`, `getPendencias`, `listarAbasHistoricoLegado` e `onEdit` **não são chamados**. Um `aprovado: true` naquele deploy significa apenas que as abas e colunas continuavam lá.

### Especificação técnica

**H4.a — Sinalizar antes de editar.** `CLAUDE.md` §11.3 exige: *"se houver divergência, sinalizar ao usuário **antes** de alterar código ou doc — não corrigir silenciosamente os dois lados na mesma tarefa sem dizer qual estava errado."* **Este documento é o sinal.** A edição só ocorre com o go-ahead.

**H4.b — Corrigir `SYSTEM_TRUTH.md` §6.** Substituir a frase acima por, em espírito:

> *QA Shadow rodado manualmente após o deploy `@29` — aprovado, 0 falhas, 2896ms. **Escopo real do que isso valida:** as abas de `SETUP.ABAS` existem, as 13 colunas esperadas existem em `BASE DE DADOS`, e `gerarSchemaPlanilha()` roda sem lançar. As doze simulações de `runQA_E2E()` retornam `ok:true` literal e não exercitam código de produção — ver `docs/auditoria/06_inteligencia_operacional.md` INT-01. **Os fixes de performance daquele deploy não foram cobertos por esta validação**; a cobertura deles vem da suíte Jest (`test/`, desde 2026-07-07).*

**H4.c — Não tocar `QaShadow.js` agora.** A redução do módulo à essência (deletar as 12 simulações + as 4 funções `*Headless` de L-36, renomear para `HealthCheck`, sobrando ~60 linhas que fazem exatamente o mesmo) é a recomendação (1) de `06_inteligencia_operacional.md` §5.2 — e é **Onda 3**, não hotfix. Deletar código correto para corrigir uma frase errada é a troca errada.

**Impacto observável:** zero. Nenhuma linha de código muda.

---

## Bloco de estabilidade — Episódio 0 (`CLAUDE.md` §11, saída obrigatória)

```
Status de estabilidade: RISCO (controlado — 3 dos 4 hotfixes mudam comportamento observável)
Impacto em performance: nenhum
Impacto em governança: sim — SYSTEM_TRUTH.md §6 contém afirmação não sustentada pelo código (H4)
Risco de estado implícito: não
Recomendação final: seguir, com aprovação explícita do usuário em H2, H3 e H4 (§12.4.1 / §11.3);
                    H1 pode seguir sem espera. H5 (V-01) aguarda decisão e não deve ficar parado.
```

---

# 2. MAPEAMENTO DA ARQUITETURA ALVO (V2 — PROJETO TEAR)

## 2.0 A restrição que define tudo: Apps Script não tem módulos

Antes de desenhar fronteiras, é preciso dizer o que "módulo" significa nesta stack (`CLAUDE.md` §12.1 — a stack não muda):

- **Não existe `import`/`export`.** Todos os arquivos `.js` do projeto compartilham **um único escopo global**. `clasp push` os concatena.
- Logo, **fronteira aqui é disciplina, não mecanismo.** O compilador não vai reprovar `BriefingRepository` chamando `getSheetByName('ATIVAÇÕES')`. Só um teste vai (§4).
- **Ordem de carga:** o runtime avalia o topo de todos os arquivos antes de invocar qualquer entry point. Referenciar o namespace de outro módulo **no topo** de um arquivo é frágil; **dentro de funções**, é seguro. `SchemaExporter.js:244,253` já convive com isso via guardas `typeof X !== 'undefined'`.
  → **Regra arquitetural nº 1: nenhum módulo referencia outro módulo em código de topo de arquivo. Só dentro de função.**
- **`mae/.claspignore` é allowlist explícita** (`CLAUDE.md` §6, incidente 2026-07-05). Arquivo novo em `mae/` **não sobe** se não estiver listado. Modularizar cria dezenas de arquivos novos.
  → **Um módulo esquecido no `.claspignore` não falha no CI, não falha no push: falha em produção, como `ReferenceError`, na primeira chamada.** É o modo de falha mais caro desta migração inteira. Trava automática em §4.3.

## 2.1 Fronteiras dos contextos e das funções `[Exclusivas]`

Seis Bounded Contexts, um agregado raiz cada (exceto Comunicação e Inteligência). A regra de ouro: **uma aba, um repositório, um contexto.**

```
mae/
├── app/                          ← orquestradores finos. Entry points. Sem regra de negócio.
│   ├── WebApp.js                 doGet + endpoints google.script.run (contrato §12.4.1)
│   ├── Código.js                 onOpen, onEdit (despachante), onFormSubmit
│   └── PortalUi.gs               abrirPortalModal()
│
├── core/                         ← [Shared Kernel] — ver §2.2
│
├── dominio/
│   ├── parceiros/                agregado: Influenciadora · aba BASE DE DADOS + CADASTROS
│   │     ParceiroRepository       buscarPorCupom · buscarPorInfluKey · listarAtivas
│   │                              atualizarCamposPermitidos
│   │     AutenticacaoService      verificarCredencial · contarTentativa · estaBloqueado   [PURO]
│   │     EnderecoService          montarEnderecoCompleto [PURO] · resolverPorCep [gateway]
│   │     ParceiroSidebarBackend   getListaInfluenciadoras · getDadosInfluenciadora · salvarDadosSidebarV2
│   │
│   ├── planejamento/             agregado: Briefing de Campanha · aba BRIEFING
│   │     BriefingRepository       buscarPorParceiraEPeriodo · substituirCampanha · atualizarLooks
│   │                              propagarDataAprovacao
│   │     BriefingService          selecionarTextoPorFormato [PURO, RN-11]
│   │                              casaAno [PURO, RN-12 — hoje DUPLICADA em 2 lugares]
│   │
│   ├── execucao/                 agregado: Ativação · abas ATIVAÇÕES + FLUXO LOGÍSTICO
│   │     AtivacaoRepository       buscarPorId · listarPorParceiraEPeriodo · criarLote
│   │                              registrarUpload · atualizarStatus
│   │     StatusAtivacaoService    normalizar [PURO] · podeReceberUpload [NOVO → INV-08]
│   │                              VALORES_VALIDOS_CELULA  ← validação da célula, explícita no código
│   │     LogisticaRepository      criarLote · marcarEnvio
│   │
│   ├── financeiro/               agregado: Pagamento · aba PAGAMENTOS
│   │     PagamentoRepository      listarPorParceiraEPeriodo · criarLote · criarExtra
│   │                              existeParaPeriodo  ← habilita a guarda de FIN-06
│   │     StatusPagamentoService   normalizar [PURO] · ETAPAS  ← fonte única do vocabulário
│   │     ValorService             extrairNumerico [PURO] · formatarBRL [PURO]
│   │
│   ├── comunicacao/              sem agregado · 47 linhas · ver §2.4
│   │     MensagemTemplates        constantes nomeadas (a voz da marca, hoje enterrada em getRange)
│   │     ClipboardGateway         o comportamento ATUAL, preservado como implementação
│   │
│   └── inteligencia/             abas HISTÓRICO * + legado · observa os outros cinco
│         HistoricoRepository      listarAtivacoes · listarPagamentos · periodosDisponiveis
│                                  detectarAbasLegado
│         IntegridadeService       verificar [quase PURO] · COLUNAS_ESPERADAS_BASE
│         SchemaService            gerarSchema · calcularHash [PURO] · gerarMarkdown [PURO]
│                                  formatarValorParaJson [PURO]
│         HealthCheck              ex-QaShadow, reduzido (Onda 3, ver H4.c)
│
└── gateways/                     ← única porta para o mundo externo. Isola V3 (§12.3).
      CepGateway.js               brasilapi.com.br
      RastreioGateway.js          api.brcomerce.com.br
      LooksExternosGateway.js     SpreadsheetApp.openByUrl (planilhas de terceiros)
      DriveStorageGateway.js      DriveApp + upload resumable
      SchemaStorageGateway.js     DriveApp (SYSTEM_SCHEMA.*)
```

**Não renomear `Código.js` nem `WebApp.js`.** Toda a documentação (`CLAUDE.md` §3, `FLOW.md`, `SYSTEM_TRUTH.md`) e todo o `test/` referenciam esses caminhos. Eles permanecem, esvaziados até virarem orquestradores finos. Renomear é big-bang (§12.5 proíbe).

### Realocações que resolvem acoplamento sem mudar comportamento

| Função | Hoje | Vai para | Motivo |
|---|---|---|---|
| `getNomeInfluByCupomCached()` | `WebApp.js:735` (Gestão de Parceiros) | consumida por `execucao/` via `ParceiroRepository` | *"Vive em Gestão de Parceiros por acidente de proximidade"* (`01`, §4) |
| `salvarPagamentoExtra()` | `SidebarBackend.js:102` | `dominio/financeiro/` | `[Legado Compartilhado]`: dois contextos, zero funções misturadas (`05`, §4) |
| `getListaInfluenciadoras()` + 3 | `SidebarBackend.js:20-101` | `dominio/parceiros/` | idem. Basta cortar o arquivo em dois |
| `nomeFormatoPasta()` | `WebApp.js:798` | `gateways/DriveStorageGateway` | é regra de storage, não de domínio |

`SidebarBackend.js` **não é um contexto**: é um arquivo com dois contextos dentro. Cortá-lo em dois é a extração mais mecânica do repositório — nenhuma função muda de corpo. **Mas hoje não tem um único teste** (`01` §5.4). Rede de segurança antes (§12.4.7). Coincide com H2.a.

## 2.2 Estratégia para o `[Shared Kernel / Core]`

O Core hospeda o que é **genuinamente transversal** e nada mais. Um kernel que cresce é um monólito com outro nome. Critério de admissão, e ele é estreito:

> Entra no Core se, e somente se: (a) é usado por **≥ 2 contextos**, **e** (b) não contém **nenhum literal de nome de aba**, **e** (c) não conhece nenhum agregado.

```
core/
  Planilha.js         getHeaderMap()  ← Código.js:962. A fonte de verdade da resolução por nome.
                      montarLinha()   ← mata INV-10 (FLUXO posicional) e L-31 por construção
  Formatacao.js       formatarData() · formatarTitleCase()
  Calendario.js       parseMesAno() [PURO, RN-09] · calcularDataAprovacao() [PURO, RN-10]
                      ORDEM_MESES     ← hoje solta em WebApp.js:42-46
  Sessao.js           criar() · validar() · revogar()   ← token, CacheService, TTL explícito
  Periodo.js          PeriodoService  ← ver §2.3, o órfão
  Arquivamento.js     ArquivamentoService  ⚠️ ver abaixo — o item mais perigoso do plano
```

**`normalizarStatusAtivacao()` e `normalizarStatusPagamento()` NÃO entram no Core.** São vocabulário de domínio (falham o critério (c)). Vivem em `execucao/` e `financeiro/`. Empurrá-las para o Core é como os dois contextos passam a compartilhar um vocabulário que não é deles — exatamente o acoplamento que a V2 existe para desfazer.

**Chame primeiro o que já é puro.** `calcularDataAprovacao`, `parseMesAno`, `normalizarStatus*`, `extrairValorNumerico`, `nomeFormatoPasta` **já são funções puras hoje, e já têm teste** (`test/codigo-webapp-puras.test.js`, `test/webapp-pagamentos.test.js`, `test/codigo-gerar-novo-mes.test.js`). Mover é literalmente recortar e colar. Risco: zero. É por aí que se começa.

E as quatro puras de `SchemaExporter.js` (`calcularHashEstado`, `formatarValorParaJson`, `gerarMarkdownDoSchema`, `normalizarCabecalhoIntegridade`) são ~120 linhas de lógica pura **sem um único teste** e sem precisar de um único mock — *"a fruta mais baixa do repositório inteiro"* (`06`, §5.1).

### `arquivarGenerico()` — isolamento e o risco de concorrência

`Código.js:769-824`. **É a função mais perigosa do repositório**, e a razão é a combinação, não qualquer item isolado:

- É `[Core]` de verdade: chamada por **quatro** lugares — `onEdit` bloco ATIVAÇÕES (`L232`), `onEdit` bloco PAGAMENTOS (`L299`), `menuArquivarTudo()` (`L753`), e `arquivarFluxo()` ← `atualizarRastreiosBRComerce()` (`L514`).
- Atravessa **três contextos** (Execução, Financeiro, Inteligência).
- Tem **histórico de bug de coluna** (cópia posicional gravando `LINK_ARQUIVO` na coluna de `DATA_ARQUIVAMENTO` — `CLAUDE.md` §3).
- Tem **zero testes** (`06` §5.5).
- **Não tem lock** (INT-08), e o loop faz `appendRow()` **antes** de `deleteRow()`, 2 chamadas de API por linha, dentro de um trigger `onEdit` com teto de **30 s** (INV-09, FIN-04).

**Modo de falha concreto:** o operador marca `postado` (dispara `onEdit`) e, enquanto o trigger roda, clica em "Executar Limpeza e Arquivamento Geral". Ambas as execuções leem `getDataRange()`, ambas veem a linha, ambas fazem `appendRow` → **duplicata no histórico**; ambas fazem `deleteRow(i+1)` → a segunda **apaga a linha errada**, porque os índices deslocaram. E uma linha duplicada em `HISTÓRICO DE PAGAMENTOS` é **contabilizada duas vezes** por `extrairPagamentos()` (FIN-04). Dinheiro.

**Especificação do `ArquivamentoService`:**

```
core/Arquivamento.js

ArquivamentoService.arquivar(abaOrigem, abaDestino, colunaStatus, valoresGatilho, carimbarData)

  1. lock = LockService.getScriptLock()
     if (!lock.tryLock(10000)) { Logger.log('arquivamento pulado — ocupado'); return {pulado:true}; }
  2. try:
       lê origem UMA vez (getDataRange)
       mapeia origem→destino POR NOME (preserva o fix de 2026-07-08 — não regredir)
       acumula linhas elegíveis em memória
       destino.getRange(...).setValues(bloco)        ← 1 chamada, não N
       deleteRows() em FAIXAS CONTÍGUAS, de baixo para cima  ← minimiza chamadas
  3. finally: lock.releaseLock()
```

Quatro decisões, cada uma com sua razão:

**(a) `tryLock` + pular, não `waitLock` + esperar.** `onEdit` tem teto de 30 s; um `waitLock(30000)` consumiria o orçamento inteiro esperando. Pular é **seguro por uma propriedade do domínio**: o arquivamento é *convergente* — move **todas** as linhas elegíveis por status, não só a editada (RN-20). Se esta execução pula, a próxima edição de `postado` ou o `menuArquivarTudo()` recolhe o resto. É exatamente o padrão que `SchemaExporter` já adota (RN-33, `tryLock(5000)` → PULA).

**(b) `appendRow` antes de `deleteRow`, mantido.** Sob falha no meio, o pior caso é **duplicação, nunca perda** (`03`, INV-09). Inverter a ordem trocaria duplicação por perda de dado — proibido por §12.4.6. Manter, e documentar no código que a ordem é deliberada.

**(c) `ArquivamentoService` é `SpreadsheetApp`-only. Invariante dura.** É alcançável a partir de `onEdit`, que é **trigger simples**: sem `UrlFetchApp`, sem `DriveApp`. Uma única dependência dessas introduzida aqui quebra o arquivamento automático em produção, silenciosamente (o `catch` de `onEdit` engole). → **Trava automática obrigatória, §4.2.**

**(d) Zero literais de nome de aba.** Recebe origem e destino por parâmetro. É o que a torna genuinamente Core, e é **verificável por grep** (§4.1).

**Sequenciamento inegociável:** `arquivarGenerico()` sem teste é o maior risco isolado do repositório (`06` §5.5). **Teste primeiro** (caracterização do comportamento atual, incluindo a cópia por nome). **Depois** o lock — e adicionar lock **muda comportamento sob concorrência** (hoje duas execuções duplicam; depois, uma espera ou pula): é correção de bug, PR próprio, não refatoração (`06` §5.3).

## 2.3 Estratégia de estrangulamento — as 5 funções `[Contaminadas]`

Padrão único, aplicado às cinco: **o nome da função é a costura.** A entrada pública (`onEdit`, `getHistorico`, o item de menu) é contrato intocável — com o front, com o menu, com os triggers instalados fora do código-fonte. Mantém-se o nome e esvazia-se o corpo, delegando aos módulos novos. Nenhuma execução paralela é necessária: o comportamento é idêntico e a suíte Jest é a rede.

---

### ① `onEdit()` — `Código.js:187-315` · o ponto de contaminação máxima

Faz **quatro coisas de três contextos** só no bloco `ATIVAÇÕES` (L230-289): arquiva (Inteligência), calcula `DATA_APROVACAO` (Execução), **escreve dentro de `BRIEFING`** (Planejamento, L249-281) e reordena a aba (Execução). 60 linhas num único `if`.

O `guard clause` de L199-200 (`ABAS_TRATADAS.indexOf(name) === -1`) **já é um despachante embrionário**. A quebra natural:

```js
function onEdit(e) {
  if (!e || !e.range) return;
  try {
    const ctx = montarContextoEdicao(e);          // sh, name, row, col, h
    if (!ctx) return;
    const handler = HANDLERS_POR_ABA[ctx.name];   // mapa explícito
    if (handler) handler(ctx);
  } catch (err) { Logger.log(err); }
}
```

**Três armadilhas, todas capazes de quebrar produção silenciosamente:**

1. **`onEdit` é trigger simples.** Nenhum serviço alcançável por um handler pode ter `UrlFetchApp` ou `DriveApp` no caminho síncrono. Isso restringe `ArquivamentoService` (§2.2c) e **mata a tentação** de chamar `EnderecoService.resolverPorCep()` a partir do handler de `BASE` (é exatamente V-03). → Trava §4.2.
2. **A semântica de `return` difere entre blocos.** O bloco `BRIEFING` (L227) e o bloco `postado` (L234) **encerram a função** — "primeiro que casa vence". Os blocos `BASE`, `PAGAMENTOS` e `FLUXO` (L291-306) são `if` sem `else` — "todos que casam executam". Hoje não colidem (nomes de aba distintos), mas a semântica é diferente e **um mapa `HANDLERS_POR_ABA` impõe silenciosamente a primeira**. Caracterizar em teste **antes**.
3. **O bloco `ATIVAÇÕES` escreve em `BRIEFING`.** Não é Execução. Vira chamada explícita a `BriefingRepository.propagarDataAprovacao(influKey, mes, ano, formato, data)` — nunca um `getSheetByName('BRIEFING')` de dentro do handler de ativação. A busca linear sobre `getDataRange()` inteiro sai do handler.

Ordem de extração, do mais fácil ao mais difícil: `PAGAMENTOS` (3 linhas, `05` §5.2) → `BASE` (`01` §5.2) → `FLUXO` → `BRIEFING` → `ATIVAÇÕES`.

---

### ② `gerarNovoMesCompleto()` — `Código.js:85-166` · destruição e criação sem rollback

Escreve em quatro abas de três contextos e lê `BASE`. Pior: **mistura destruição e criação numa transação sem rollback** — se falhar entre `L122` (`clearContent()` de `BRIEFING`) e `L159` (`setValues()`), o briefing do mês anterior **já foi perdido** e o novo não existe (`02` §4).

Vira orquestrador puro:

```js
function gerarNovoMesCompleto() {
  const {mes, ano} = parseMesAno(ui.prompt(...));           // core/Calendario
  const ativas = ParceiroRepository.listarAtivas();          // ← mata V-04 (r[0]) em 1 call-site
  BriefingRepository.substituirCampanha(mes, ano, ativas);   // ← clearContent + append, 1 ponto de rollback
  LogisticaRepository.criarLote(ativas, mes);                // ← ganha montarLinha() → mata INV-10
  PagamentoRepository.criarLote(ativas, mes, ano);           // ← lancarPagamentosDoMes chama ISTO → mata L-31
  AtivacaoRepository.criarLote(ativas, mes, ano);
  exportarSchemaAoIniciarNovoMes();
}
```

Quatro dívidas morrem de graça na extração: **INV-05** (5 `setValue()` por parceira viram um `setValues()`), **INV-10** (`FLUXO` posicional ganha `montarLinha()` — a ordem de colunas hoje já coincide com a nomeada, então comportamento preservado), **L-31** (`lancarPagamentosDoMes()` é ~80% cópia; as duas portas convergem), e o `clearContent()` fica **dentro** do repositório, junto do append — o único lugar onde a transação pode um dia ganhar rollback.

**Não adicionar a guarda de FIN-06 aqui.** Rodar duas vezes hoje duplica ativações e pagamentos; depois, bloquearia. É mudança de comportamento (§12.4.1), PR próprio, provavelmente com `ui.alert` no padrão de `limparHistoricoOficial()`.

---

### ③ `listarPeriodos()` — `WebApp.js:648-696` · o órfão

Não pertence a nenhum dos seis contextos. É uma **projeção de leitura** sobre quatro abas de três contextos, existente só para popular um seletor de UI. E é cara: `carregarPagamentos()` chama `listarPeriodos()` (varre 4+N abas) e em seguida `getPagamentos()` **relê `PAGAMENTOS` inteira** — duas leituras completas por navegação (`05` §4).

Inverte-se a dependência: o Core **pergunta** a cada repositório, em vez de conhecer as abas.

```js
// core/Periodo.js
PeriodoService.listarDisponiveis(influKey) {
  return uniao(
    AtivacaoRepository.periodosDisponiveis(influKey),
    PagamentoRepository.periodosDisponiveis(influKey),
    HistoricoRepository.periodosDisponiveis(influKey)
  ).ordenarDecrescente();   // única regra própria: ORDEM_MESES
}
```

Nenhum contexto conhece o outro. `ORDEM_MESES` (`WebApp.js:42-46`) sai do limbo e vira a única regra do serviço. **Depende de H2**: com `ANO_REFERENCIA` vazio, `periodosDisponiveis()` continua emitindo o período fantasma. Ordenar `listarPeriodos` **depois** de FIN-01.

---

### ④ `getHistorico()` — `WebApp.js:445-522` · a mais fácil do sistema

A contaminação **já está fisicamente separada** em duas funções aninhadas: `extrairAtivacoes()` (Execução, L469) e `extrairPagamentos()` (Financeiro, L490). Extração quase mecânica.

```js
function getHistorico(token, mes, ano) {
  const cupom = validarToken(token);  if (!cupom) return SESSAO_EXPIRADA;
  const influKey = ParceiroRepository.influKeyPorCupom(cupom);
  return { ok: true,
    ativacoes:  HistoricoRepository.listarAtivacoes(influKey, mes, ano),
    pagamentos: HistoricoRepository.listarPagamentos(influKey, mes, ano) };
}
```

⚠️ `06` §5.3 sugere adicionar a guarda `if (!influKey) return USUARIO_NAO_ENCONTRADO` *"de quebra"*. **Não fazer na mesma entrega.** Isso é FIN-03 — muda comportamento observável (o front passa a receber erro onde antes via lista vazia) e cai sob §12.4.1. Commit separado, decisão do usuário.

⚠️ Ao extrair, **decidir sobre INT-02/FIN-02**: `extrairAtivacoes()` afirma `status: "PUBLICADO"` e `extrairPagamentos()` afirma `etapa: "PAGO"` — **literais**, sem ler a célula. Para as abas oficiais a premissa se sustenta (`arquivarGenerico()` só move `postado`/`pago`). Para as **abas legado** — descobertas por assinatura de cabeçalho, não por garantia de conteúdo — não há nada que a sustente. Uma aba legado com `STATUS_PAGAMENTO = 'em aberto'` é exibida à parceira como **PAGO**. É afirmação financeira falsa. Manter o literal preserva comportamento; ler o status corrige e muda. **Não decidir sozinho.**

---

### ⑤ `Index.html` — bloco HISTÓRICO · `renderHistoricoAtivacoes` (L1477) + `renderHistoricoPagamentos` (L1495)

**Já são duas funções independentes.** Emparelhadas com ④, formam **um fluxo completo, das duas pontas, num PR pequeno e reversível** — exatamente o regime de §12.5. `06` §5.3: *"É o melhor primeiro PR da V2."* A leitura do código, em duas auditorias independentes, confirmou.

---

## 2.4 Comunicação Operacional: um contexto que ainda não existe

47 linhas, zero entidades, zero capacidade de envio, e — o achado mais concreto de `04` — **zero telefones armazenados**. `getPerfil()` devolve `telefone: ""` hardcoded (`WebApp.js:546`); `BASE DE DADOS` não tem coluna de telefone. O sistema "envia WhatsApp" porque um humano lê a tela e aperta `Ctrl+C`.

**Não construir agora** (`04` §5.4). Não bloqueia nenhum outro contexto. O que fazer, na ordem:

1. **Corrigir COM-03 na origem, atacando V-03** → é o H3. O defeito de negócio mais caro do documento não vive neste contexto.
2. **Extrair os dois templates para constantes nomeadas.** Risco zero. A voz da marca (`"Oi, linda!"`, segunda pessoa, gênero feminino fixo) deixa de estar enterrada no meio de um `getRange()`. **Não é acidente de implementação — é requisito**: as mensagens têm autoria editorial, não são notificações transacionais.
3. **Guardas `if (h[col])` + `try/catch` com `Logger.log`** (COM-01). São as **únicas funções de `Código.js` fora do endurecimento de 2026-07-07**.
4. **Registrar `TELEFONE` como dívida de dado**, não de código.

Quando a V2 pedir notificação ativa, a primeira decisão **não é técnica**: é *quem escreve a mensagem, e a Meta vai aprovar o texto?* Templates *utility* são rígidos; `"Oi, linda!"` provavelmente não passa.

---

# 3. BACKLOG SEQUENCIAL DE MIGRAÇÃO

Princípio de ordenação, e é um só: **ordene por facilidade de reversão, não por valor entregue.** O valor é o mesmo em qualquer ordem — a arquitetura final não muda. O que muda é o custo de descobrir que se errou. Um PR de leitura pura que dá errado se reverte com `git revert`. Um PR que tocou `gerarNovoMesCompleto()` e apagou o `BRIEFING` de 30 parceiras não se reverte com nada.

Daí a ordem: **do que só lê → para o que só desenha → para o que escreve → para o que escreve dentro de um trigger.**

Pré-condição de todas as ondas: `npm test` verde, `FLOW.md` atualizado no mesmo PR (§12.2), commit imediato após teste verde (§12.4.8).

---

### Onda 0 · Rede de segurança (bloqueante)

Não é refatoração. É a condição para que as ondas 1–4 sejam reversíveis com confiança.

| # | Entrega | Por quê |
|---|---|---|
| 0.1 | Teste de caracterização de `arquivarGenerico()` | `[Core]`, 4 chamadores, 3 contextos, histórico de bug de coluna, **zero testes**. Maior risco isolado do repo |
| 0.2 | Harness de teste para `SidebarBackend.js` | Nenhum teste carrega o arquivo. FIN-01 e V-05 vivem aí |
| 0.3 | Testes das 4 puras de `SchemaExporter.js` | ~120 linhas puras, zero mocks necessários, zero testes hoje. *A fruta mais baixa* |
| 0.4 | Teste de caracterização de `onEdit()` — semântica `return` vs. `if` sem `else` | Armadilha ② de §2.3.① |

**Reversão:** trivial (só adiciona arquivos em `test/`). **Impacto em produção:** nenhum.
Os hotfixes H1–H4 do Episódio 0 rodam **em paralelo** a esta onda; 0.2 é pré-requisito de H2.

---

### Onda 1 · HISTÓRICO — o fluxo mais fácil, das duas pontas

| # | Entrega |
|---|---|
| 1.1 | Mover as puras já testadas para `core/` e `dominio/*/`: `parseMesAno`, `calcularDataAprovacao`, `normalizarStatus*`, `extrairValorNumerico`, `nomeFormatoPasta`. **Recortar e colar** |
| 1.2 | `HistoricoRepository` ← `getHistorico()` + `extrairAtivacoes` + `extrairPagamentos` + `detectarAbasHistoricoLegado` |
| 1.3 | `getHistorico()` vira orquestrador de 6 linhas; `renderHistorico*` no front acompanha |
| 1.4 | `ArquivamentoService` ← `arquivarGenerico()`, **sem lock ainda**. Só isolamento + batch `setValues`/`deleteRows` |

**Por que primeiro.** É o único fluxo do sistema que **não escreve em lugar nenhum** (1.2/1.3). Já tem cobertura (`test/webapp-historico.test.js`). Já vem pré-fatiado em duas funções aninhadas. E o front já tem dois renderizadores independentes — logo o PR fecha um fluxo **completo, das duas pontas**, que é o regime de §12.5.

**Reversão:** `git revert`. Nenhum dado escrito, nenhum estado migrado. Se o Portal quebrar, quebra numa tela de leitura.

⚠️ Não incluir: a guarda de FIN-03, a decisão de INT-02, o `LockService` de INT-08. Todos mudam comportamento. Commits/PRs separados.

---

### Onda 2 · INTERFACE — o front, sem tocar o servidor

| # | Entrega |
|---|---|
| 2.1 | Extrair as puras do front para um módulo testável: `escaparHtml`, `atualizarLabelMes`, formatadores |
| 2.2 | Inverter a dependência do `[Core]` temporal: `mudarMes()` (`Index.html:1137-1139`) tem **um `if` para cada uma das três telas** — o Core conhece seus consumidores. Vira registro de callback |
| 2.3 | Limpar contratos mortos: `so.valoresCache` (L1534), `res.mesReferencia`/`res.dataPostagem` (L1247/1250), `STATE.cacheBriefing` (L860), `STATE.arquivoSelecionado` (L853) — **fallbacks para chaves que nenhum backend produz** |
| 2.4 | `StatusPagamentoService.ETAPAS` como fonte única; `ETAPA_ORDEM` (`Index.html:875`) deixa de ser mantido em sincronia manual |

**Por que segundo.** Não escreve na planilha. O raio de explosão é uma tela. E 2.1 é pré-requisito de H1.b.

⚠️ **Duas armadilhas.**
`CLAUDE.md` §2 registra: *"Não existem mais `PortalApp.html`, `views_*.html`, `components_*.html` — foram **consolidados** aqui."* §12.2 autoriza explicitamente quebrar `Index.html`. Mas alguém já fragmentou e depois desfez. **Antes de re-fragmentar, achar por que** (`git log -- mae/Index.html`) e registrar em `FLOW.md`. Preferir extrair **lógica JS pura** (testável via `test/index-front-puras.test.js`) sem tocar a estrutura HTML/CSS.
E `.tracker{align-items:flex-start}` é zona proibida (`CLAUDE.md` §3): **não trocar para `center`**, foi causa raiz de bug já corrigido.

---

### Onda 3 · ORQUESTRAÇÃO — repositórios e gateways

| # | Entrega |
|---|---|
| 3.1 | `ParceiroRepository` + `listarAtivas()` → **mata V-04 (`r[0]`) em 7 call-sites de uma vez** |
| 3.2 | `EnderecoService` + `CepGateway` (já entregue por H3.a; consolidar) |
| 3.3 | `PagamentoRepository` — `criarLote` unifica `gerarNovoMesCompleto` e `lancarPagamentosDoMes` (mata L-31) |
| 3.4 | `AtivacaoRepository` + `DriveStorageGateway` |
| 3.5 | `BriefingRepository` + `BriefingService.casaAno()` → **mata a duplicação de RN-12** entre `WebApp.js:346` e `Código.js:264-267` |
| 3.6 | `LogisticaRepository` + `RastreioGateway` + `LooksExternosGateway`; fechar os `catch(e){}` vazios (INV-03, INV-11) |
| 3.7 | `HealthCheck` ← redução de `QaShadow.js` (H4.c) + remoção das 4 funções `*Headless` (L-36, código morto para um `clasp run` que não funciona) |
| 3.8 | Cortar `SidebarBackend.js` em dois arquivos, por contexto |

**Por que terceiro.** Escreve na planilha, mas **cada repositório é validável isoladamente** contra a suíte, e nenhum toca `onEdit`. `listarAtivas()` (3.1) é o maior retorno por linha do plano inteiro: sete call-sites posicionais (`r[0]`) que o checklist do `SchemaExporter` **não detecta** — ele valida presença de nome, e a coluna de status **não tem nome na lista esperada**. *"Inserir uma coluna à esquerda de `BASE DE DADOS` desativa silenciosamente todas as influenciadoras."*

**Reversão:** por repositório. Nenhum PR toca mais de um agregado.

⚠️ `BriefingService.casaAno()`: a mesma regra (RN-12) escrita **duas vezes, com sintaxes diferentes**, em arquivos diferentes. É uma bomba-relógio de divergência — mas unificá-la exige que os dois lados casem hoje. `02` §3 confirma: *"comparei linha a linha"*. Teste antes.

---

### Onda 4 · CONTAMINAÇÕES — `onEdit` e o ciclo mensal

| # | Entrega |
|---|---|
| 4.1 | `onEdit()` → despachante + `HANDLERS_POR_ABA`. Ordem interna: `PAGAMENTOS` → `BASE` → `FLUXO` → `BRIEFING` → `ATIVAÇÕES` |
| 4.2 | `BriefingRepository.propagarDataAprovacao()` — a escrita cruzada sai do handler de ativação |
| 4.3 | `gerarNovoMesCompleto()` → orquestrador de 7 linhas |
| 4.4 | `listarPeriodos()` → `PeriodoService.listarDisponiveis()` (**depois de H2**) |
| 4.5 | `LockService` em `ArquivamentoService` (INT-08) — **PR próprio, é correção de bug** |

**Por que último, e não é conservadorismo.** Aqui mora tudo o que não perdoa:
- `onEdit` é **trigger simples**: sem `UrlFetchApp`, sem `DriveApp`, teto de 30 s, e o `catch` **engole o erro** — uma quebra aqui é **invisível** até alguém notar que nada mais é arquivado.
- `gerarNovoMesCompleto()` chama `clearContent()` em `BRIEFING` **sem rollback**. Um bug aqui destrói o briefing de todas as parceiras ativas.
- `onFormSubmit()` e o `onEdit` instalável do `SchemaExporter` dependem de **triggers configurados fora do código-fonte** (`CLAUDE.md` §6) — não verificáveis por leitura, e `clasp run` não funciona neste projeto para testá-los.

Reverter um PR de Onda 4 **não desfaz um `deleteRow()`**. Por isso 0.1 e 0.4 são bloqueantes, e por isso esta onda vem depois de três ondas inteiras de aquecimento com a mesma suíte de testes.

---

### Dependências entre ondas

```
Onda 0 ──┬──────────────────────────────────────────────► (bloqueante para todas)
         │
H2 ──────┼──────────────────────────────► 4.4 (PeriodoService precisa de ANO_REFERENCIA correto)
         │
H3.a ────┼──────────► 3.2
         │
2.1 ─────┼──────────► H1.b (escaparHtml extraído e testado)
         │
0.1 ─────┼──────────► 1.4 ──────────────► 4.5 (lock só depois do teste e do isolamento)
         │
1.2 ─────┴──────────► 4.4 (HistoricoRepository.periodosDisponiveis)
```

---

# 4. ESTRATÉGIA DE GARANTIA DE ADERÊNCIA

A pergunta é: *como impedir que a V2 crie novos acoplamentos invisíveis?*

A resposta honesta começa por reconhecer o que **não** vai nos salvar. Não há compilador: Apps Script tem escopo global único e nenhum `import` (§2.0). Não há code review que sobreviva a seis meses de sessões de agente. E `CLAUDE.md` §9-§12 são **instruções para o agente**, não travas — um agente distraído as ignora e nada acontece.

O que resta é a única coisa que já provou funcionar neste repositório: **a suíte Jest em CI** (`.github/workflows/tests.yml`, PR obrigatório em `main`, `enforce_admins: true`). Se uma regra arquitetural não é um teste que reprova, ela é uma sugestão.

Proposta: **seis travas automáticas**, todas testes Jest comuns rodando na suíte existente. Nenhuma ferramenta nova, nenhuma dependência nova (§12.1).

## 4.1 Matriz de fronteiras — a trava principal

Um manifesto legível por máquina, `docs/arquitetura/fronteiras.json`, declara quem pode tocar qual aba:

| Módulo | Abas permitidas |
|---|---|
| `dominio/parceiros/*` | `BASE DE DADOS`, `CADASTROS` |
| `dominio/planejamento/*` | `BRIEFING` |
| `dominio/execucao/*` | `ATIVAÇÕES`, `FLUXO LOGÍSTICO` |
| `dominio/financeiro/*` | `PAGAMENTOS` |
| `dominio/inteligencia/*` | `HISTÓRICO *` + legado |
| `core/*` | **nenhuma** |
| `app/*` | **nenhuma** |

O teste lê cada arquivo-fonte e reprova se encontrar um literal de nome de aba, ou uma referência `SETUP.ABAS.X` / `MAP.X.NOME_ABA`, fora da lista. Consequências diretas:

- `ArquivamentoService` **não pode conter um único literal de aba** — é o que garante que ele seja genuinamente genérico, recebendo origem/destino por parâmetro (§2.2d).
- O handler de `ATIVAÇÕES` **não consegue** fazer `getSheetByName('BRIEFING')`; é obrigado a passar por `BriefingRepository` (armadilha ③ de §2.3.①).
- Um acoplamento novo entre contextos vira **CI vermelho no PR**, não um achado numa auditoria daqui a seis meses.

Corolário barato, mesma mecânica: **grep por acesso posicional** (`r[0]`, `rb[0]`, `getRange(row, 1)`) em `dominio/*`. Fecha V-04, INV-02, INV-10 e COM-02 **permanentemente** — as quatro sobreviveram à migração de 2026-07-07 só porque ninguém estava olhando fora de `BASE DE DADOS`.

## 4.2 Trava de trigger simples — a que evita a quebra silenciosa

**A regra:** nenhum código alcançável a partir de `onEdit()` pode referenciar `UrlFetchApp`, `DriveApp` ou `SpreadsheetApp.openByUrl`.

Trigger simples não tem essas autorizações, e o `catch` de `onEdit` engole a exceção: a violação **não aparece em teste, não aparece no push, não aparece no log** — aparece como "o arquivamento parou de funcionar" três semanas depois.

Implementação pragmática, sem grafo de chamadas completo: os módulos registrados em `HANDLERS_POR_ABA`, mais suas dependências declaradas (incluindo `ArquivamentoService`), formam um conjunto fechado; o teste reprova se qualquer arquivo do conjunto mencionar os símbolos proibidos.

Isto é exatamente V-03 sendo convertido de bug recorrente em invariante executável. `SchemaExporter.js:19-23` já documenta o fenômeno — o que faltava era a trava.

## 4.3 Trava de allowlist do `.claspignore` — a que evita o `ReferenceError` em produção

Um teste que assere: **todo arquivo `mae/**/*.js` rastreado pelo git está listado em `mae/.claspignore`.**

Sem isso, a modularização — que cria dezenas de arquivos — tem um modo de falha calado e caro: o módulo passa no CI (Jest lê do disco), passa no `clasp push` (sem erro, só não sobe), e explode como `ReferenceError` na primeira chamada **em produção** (`CLAUDE.md` §12.4.4). É o incidente de 2026-07-05 esperando para acontecer ao contrário.

## 4.4 Teste de contrato Portal ↔ WebApp

§12.4.1 declara os contratos intocáveis. Torne-o executável: um teste *snapshot* sobre as **chaves** de retorno de cada endpoint (`login`, `getPendencias`, `getBriefing`, `getPagamentos`, `getHistorico`, `getPerfil`, `updatePerfil`, `listarPeriodos`, `iniciarEnvioResumable`, `finalizarEnvioResumable`) e sobre o **vocabulário de códigos de erro** (`CREDENCIAIS_INVALIDAS`, `MUITAS_TENTATIVAS`, `SESSAO_EXPIRADA`, `ACESSO_NEGADO`, `ATIVACAO_NAO_ENCONTRADA`, `USUARIO_NAO_ENCONTRADO`, `ERRO_INTERNO`).

Adicionar, remover ou renomear uma chave reprova. **O snapshot só muda com decisão explícita do usuário** — que é precisamente a regra de §12.4.1, agora com dentes. Também congela `temBriefing` (L-18) até INV-01 ser decidido.

## 4.5 Trava de vocabulário único

`normalizarStatusPagamento()` (`WebApp.js:765`) e `ETAPA_ORDEM` (`Index.html:875`) precisam usar o mesmo vocabulário — hoje mantidos em sincronia **manualmente, em arquivos diferentes**, com `CLAUDE.md` §3 avisando do perigo. Um teste que extrai os dois e compara custa vinte linhas e mata um footgun documentado.

Idem `SETUP.ABAS` (`Código.js`) vs. `MAP.*.NOME_ABA` (`WebApp.js`): **dois mapas declaram os mesmos nomes de aba independentemente**, e `CLAUDE.md` §8 avisa que "podem divergir". Testar a igualdade.

## 4.6 Trava de governança — a contrapartida de §12.2

Verificação de CI: **um PR que toca `mae/` toca também `FLOW.md`.** É a contrapartida obrigatória que §12.2 já exige em prosa (*"exploração autorizada não é licença para deixar o mapa desatualizado"*), convertida em check. Bypass explícito via label `sem-impacto-em-fluxo`, para não virar teatro.

## 4.7 O que essas travas **não** cobrem

Honestidade sobre o limite, porque uma trava em que se confia demais é pior que nenhuma:

- **Não existe staging.** A planilha e o script são únicos (`SYSTEM_TRUTH.md` §5.6). As travas rodam contra mocks; o comportamento real contra a planilha viva só é observado em produção.
- **Triggers instaláveis são invisíveis ao código.** `onFormSubmit()` e o `onEdit` do `SchemaExporter` são configurados fora do repo. Nenhum teste os vê. `clasp run` não funciona neste projeto (causa raiz investigada, `CLAUDE.md` §6 — **não repetir a investigação**).
- **`.claspignore` protege o push, não o deploy.** Deployment é pinado por versão (`@34`); `clasp push` só atualiza HEAD. Mudanças em `WebApp.js`/`Index.html` **só chegam às influenciadoras com um `clasp deploy` explícito**.
- **Nenhuma trava substitui a decisão do usuário** nos oito achados que mudam comportamento observável (H2, H3, FIN-02/INT-02, FIN-03, FIN-06, INV-07, INV-08, INT-03).

---

## Bloco de estabilidade — plano completo (`CLAUDE.md` §11 / §12.6)

```
Status de estabilidade: OK (plano); RISCO (Episódio 0 e Onda 4, ambos com mitigação explícita)
Impacto em performance: leve, positivo — Onda 3 remove 2 leituras completas de planilha por
                        navegação (listarPeriodos + getPagamentos) e substitui O(n) appendRow/
                        deleteRow por setValues em bloco no arquivamento
Impacto em governança: sim — SYSTEM_TRUTH.md §6 (H4, afirmação não sustentada pelo código);
                       CLAUDE.md §12.2 exige atualizar FLOW.md a cada PR (trava 4.6)
Risco de estado implícito: não — nenhum cache novo introduzido; PeriodoService e ArquivamentoService
                           são stateless; lock com TTL explícito e política de skip documentada
Recomendação final: seguir. Onda 0 é bloqueante. H1 sem espera; H2/H3/H4 aguardam aprovação
                    explícita do usuário. H5 (V-01, token em localStorage) aguarda decisão e
                    NÃO deve permanecer parado — compõe com o XSS de H1.
```

---

## Rastreabilidade — achado → onda

| Achado | Sev. | Onde é tratado |
|---|---|---|
| INV-06 · XSS em `renderPendencias` | 🔴 | **H1** |
| FIN-01 · `ANO_REFERENCIA` ausente | 🔴 | **H2** + backfill |
| INT-01 · QA Shadow falso positivo | 🔴 | **H4** (doc) · 3.7 (código) |
| V-01 · Token bearer em `localStorage` | 🔴 | **H5 — aguarda decisão do usuário** |
| INV-01 · `BRIEFING` sobrescrito, `temBriefing:true` | 🔴 | **Decisão de modelagem** (`02` §5.2) · trava 4.4 congela |
| V-03 / COM-03 · endereço derivado obsoleto | 🟠 | **H3** · 3.2 |
| INT-08 / INV-09 / FIN-04 · `arquivarGenerico` sem lock | 🟠 | 0.1 → 1.4 → **4.5** |
| INT-02 / FIN-02 · `"PUBLICADO"`/`"PAGO"` literais | 🟠 | Decisão do usuário, na Onda 1 |
| INT-03 · `limparHistoricoOficial` não limpa legado | 🟠 | Decisão do usuário (§12.4.6) |
| FIN-03 · `influKey` nulo → R$ 0,00 silencioso | 🟠 | Commit separado, Onda 1 |
| INV-07 · upload sem limite de tamanho/tipo | 🟠 | Política de negócio · 3.4 |
| INV-08 · upload regride status terminal | 🟠 | `StatusAtivacaoService.podeReceberUpload` · 3.4 |
| INV-02 · `sincronizarLooks` posicional | 🟠 | 3.5 · 3.6 |
| INV-03 / INV-11 · `catch(e){}` vazios | 🟠 | 3.6 · H3.c |
| V-02 · senha derivável de dado público | 🟠 | Decisão do usuário |
| INT-04 · token QA em query string | 🟠 | Rotação após uso |
| V-04 · flag `ON`/`OFF` posicional (7 sites) | 🟡 | **3.1** · trava 4.1 |
| INV-10 / COM-02 · `FLUXO` posicional | 🟡 | 3.6 · trava 4.1 |
| INV-12 · fallback `ROWn` | 🟡 | 3.4, após confirmar 0 `ID` vazios |
| FIN-05 · `idPagamento` = nº da linha | 🟡 | Dívida conhecida. Bloqueia escrita futura pelo Portal |
| FIN-06 · duplicata em `lancarPagamentosDoMes` | 🟡 | PR próprio, após 3.3 |
| INV-04 · `includes()` frouxo no cabeçalho | 🟡 | 4.1, após teste de caracterização |
| INV-05 · 5 `setValue()` por parceira | 🟡 | Sai de graça em 4.3 |
| INT-05 / INT-06 / INT-07 | 🟡 | 3.7 |
| V-05 · fallback `\|\| 2` na sidebar | 🟡 | 0.2 → 3.8 |
| L-01…L-42 · lixo técnico | ℹ️ | Ondas 2 e 3, junto do módulo correspondente |
| L-35 · `totalPago` quase sempre R$ 0,00 | ℹ️ | **Pergunta ao usuário**: é o desejado? |

---

**Fontes:** `docs/auditoria/01_gestao_parceiros.md` … `06_inteligencia_operacional.md` · `SYSTEM_TRUTH.md` · `SYSTEM_MAP.md` · `FLOW.md` · `CLAUDE.md` (§3, §6, §7, §11, §12)
