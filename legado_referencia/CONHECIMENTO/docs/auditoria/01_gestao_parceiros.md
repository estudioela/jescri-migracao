# Auditoria Vertical — Contexto 1: Gestão de Parceiros

> Fase 2 · Passo 4 · Auditoria puramente analítica. **Nenhum código foi alterado.**
> Fontes de invariante: `SYSTEM_TRUTH.md` §2, §3, §4; `SYSTEM_MAP.md`; `CLAUDE.md` §3, §7.
> Linhas conferidas em 2026-07-09 contra `main` @ `897e2dc`.

## Escopo

| Arquivo | Linhas | Papel |
|---|---|---|
| `mae/SidebarBackend.js` | 20-101 | CRUD de influenciadora pelo ERP (sidebar) |
| `mae/WebApp.js` | 155-237 | `login()`, `validarToken()`, `logout()` |
| `mae/WebApp.js` | 523-616 | `getPerfil()`, `updatePerfil()` |
| `mae/WebApp.js` | 697-746 | `getInfluKeyByCupom(Cached)`, `getNomeInfluByCupomCached()` |
| `mae/Código.js` | 77-84 | `abrirPaginaCadastro()` |
| `mae/Código.js` | 829-930 | `onFormSubmit()`, `atualizarEnderecoLinhaSelecionada()`, `preencherEnderecoPorCEP()` |
| `mae/Código.js` | 931-958 | `organizarEPintarBase()` |
| `mae/Index.html` | 941-996 | sessão do cliente |
| `mae/Index.html` | 1074-1118 | `fazerLogin()` |
| `mae/Index.html` | 1511-1572 | `carregarPerfil()`, `salvarPerfil()` |

Aba de domínio: **`BASE DE DADOS`** (agregado raiz), com `CADASTROS` como zona de pouso.

---

## 1. Fluxo Funcional

### 1.1 Entrada — Cadastro (ingestão externa)

```
Google Form (repo estudioela/estudioela, fora deste repo)
  → aba CADASTROS (append bruto pelo Google)
  → onFormSubmit(e)                       Código.js:829
      getV("CHAMADA"|"MAIL"|"PIX"|"RAZAO"|"CNPJ"|"CEP"|"NUMERO"|"COMPLEMENTO")
      normaliza: INFLU_KEY→UPPER, EMAIL→lower, RAZAO→UPPER
      CNPJ/PIX/CEP/NUMERO prefixados com "'" (força texto na célula)
      se CEP tem 8 dígitos → UrlFetchApp → brasilapi.com.br/api/cep/v1/{cep}
          preenche RUA, BAIRRO, CIDADE, UF, INFLUENCIADORA_ENDERECO
      nova[0] = "OFF"                     ← nasce sempre inativa
  → sheetBase.appendRow(nova)
  → organizarEPintarBase()                Código.js:931
```

O parceiro entra **desativado** (`nova[0] = "OFF"`, L875). Só um humano promove para `ON` editando a coluna A. Essa é a fronteira real do contexto: *existir na base* ≠ *estar ativo numa campanha*.

### 1.2 Autenticação (Portal)

```
Index.html:fazerLogin()      L1077
  → chamar('login', cupom, senha)
  → WebApp.js:login()        L155
      bloqueio: cache["tentativas_"+CUPOM] >= 5 → MUITAS_TENTATIVAS
      LockService.waitLock(10000) para ler BASE inteira
      varre linhas: CUPOM (upper/trim) == cupom
      senha esperada = CNPJ.replace(/\D/g,"").substring(0,5)
      sucesso → token = Utilities.getUuid()
                cache.put(token, cupom, 21600)   ← 6h
      falha   → cache.put("tentativas_"+CUPOM, n+1, 900)
  → Index.html:persistirSessao(token, nome)   L941
      localStorage.setItem('ela_portal_session_token', token)   ⚠️
```

`validarToken()` (L214) faz **renovação deslizante**: cada chamada autenticada reescreve o token no cache por mais 6h. Uma sessão ativa nunca expira.

### 1.3 Leitura e escrita de perfil

`getPerfil()` (L523) devolve 11 campos editáveis + bloco `somenteLeitura` (`cupom`, `valorTotal`).
`updatePerfil()` (L569) grava **apenas 5**: `CHAVE_PIX`, `EMAIL`, `CEP`, `NUMERO`, `COMPLEMENTO`, sob `LockService`.

### 1.4 Saída

- Para **Planejamento**: `INFLU_KEY`, `VALOR_TOTAL`, `CHAVE_PIX`, `REELS_TEXTO`/`CARROSSEL_TEXTO`/`STORIES_TEXTO`, `INFLU_SHEET_URL`, flag `ON`.
- Para **Execução**: `INFLU_KEY` (via `getInfluKeyByCupomCached`), nome (via `getNomeInfluByCupomCached`, para nomear a pasta do Drive).
- Para **Comunicação**: `INFLUENCIADORA_ENDERECO`, `CHAVE_PIX`.

---

## 2. Entidades e Regras de Negócio

### Entidade: **Influenciadora / Parceira** (agregado raiz)

| Atributo | Coluna | Escrito por | Lido por |
|---|---|---|---|
| Identidade de negócio | `INFLU_KEY` | `onFormSubmit`, sidebar | todos os contextos |
| Identidade de acesso | `CUPOM` | sidebar | `login`, `getPerfil`, `getInfluKey*` |
| Credencial | `INFLUENCIADORA_CNPJ` | `onFormSubmit` | `login` (prefixo de 5) |
| Flag de atividade | coluna **A** (posicional) | humano | `gerarNovoMesCompleto`, `lancarPagamentosDoMes`, `sincronizarLooks`, `getListaInfluenciadoras`, `organizarEPintarBase` |
| Endereço | `CEP`,`RUA`,`BAIRRO`,`CIDADE`,`UF`,`NUMERO`,`COMPLEMENTO`,`INFLUENCIADORA_ENDERECO` | `onFormSubmit`, `preencherEnderecoPorCEP`, `updatePerfil` (parcial) | Comunicação, Planejamento (FLUXO) |
| Financeiro | `CHAVE_PIX`, `VALOR_TOTAL` | sidebar, `updatePerfil` (só PIX) | Financeiro, Comunicação |
| Contrato de entrega | `REELS_TEXTO`, `CARROSSEL_TEXTO`, `STORIES_TEXTO` | sidebar | `gerarNovoMesCompleto` |

### Regras que o código de fato executa

1. **RN-01** — Parceira nasce `OFF`. (`Código.js:875`)
2. **RN-02** — Senha do Portal = 5 primeiros dígitos do CNPJ. (`WebApp.js:189`)
3. **RN-03** — 5 tentativas erradas bloqueiam o cupom por 900 s. (`WebApp.js:12-13, 165-167, 206`)
4. **RN-04** — Sessão dura 6 h, com renovação deslizante ilimitada. (`WebApp.js:195, 221`)
5. **RN-05** — A parceira só edita 5 campos. Nome, CNPJ, cupom e valor são imutáveis pelo Portal. (`WebApp.js:590-594`)
6. **RN-06** — `INFLU_KEY` é a chave de junção entre contextos; `CUPOM` é a chave de autenticação. **São colunas diferentes.**
7. **RN-07** — Ordenação da base: `ON` no topo, depois `INFLU_KEY` A→Z; verde `#D9EAD3` / vermelho `#F4CCCC`. (`Código.js:937-956`)

---

## 3. Aderência às Invariantes

### ✅ Respeitadas

- **Resolução por nome de cabeçalho** (`SYSTEM_TRUTH.md` §4). `login`, `getPerfil`, `updatePerfil`, `getInfluKeyByCupom`, `getNomeInfluByCupomCached` usam `getHeaderMap()`. `MAP.BASE` guarda só `NOME_ABA`. Confirmado em `WebApp.js:31-38, 173, 530, 576, 699, 735`.
- **Contrato de erro** (`CLAUDE.md` §3). `login()` devolve `CREDENCIAIS_INVALIDAS` / `MUITAS_TENTATIVAS` / `ERRO_INTERNO`; `fazerLogin()` (`Index.html:1102-1108`) faz `switch` exatamente sobre esses códigos.
- **Lock só onde escreve.** `getPerfil` lê sem lock; `updatePerfil` usa `LockService`. `login` usa lock na leitura — herança, mas inofensiva.
- **Não enumera usuário.** Cupom inexistente e senha errada retornam o mesmo `CREDENCIAIS_INVALIDAS`.

### ❌ Violações e divergências

#### V-01 · 🔴 **CRÍTICO — Token de sessão em `localStorage`, contrariando o próprio banner**

`mae/Index.html:847` declara:

```js
/* ==========================================================
   ESTADO GLOBAL (em memória, nunca localStorage/sessionStorage)
   ========================================================== */
```

`mae/Index.html:941-945` faz o oposto:

```js
function persistirSessao(token, nome){
  try{
    localStorage.setItem(SESSION_STORAGE_KEY_TOKEN, token || '');
    localStorage.setItem(SESSION_STORAGE_KEY_NOME, nome || '');
  } catch(e){ /* ... */ }
```

E `tentarRestaurarSessao()` (L974-980) lê de volta a cada carregamento da página.

**Por que isso é crítico, e não cosmético:**

1. O token é um **bearer token puro**: `validarToken()` (`WebApp.js:214`) só faz `cache.get(token)` e devolve o cupom. Não há binding com IP, User-Agent, fingerprint ou nonce. Quem tem a string, é a parceira.
2. A sessão é de **6 h com renovação deslizante** (`WebApp.js:221`). Um token roubado e mantido em uso **nunca expira**.
3. `localStorage` é legível por **qualquer JavaScript no mesmo origin**. E há superfície de injeção real: `renderPendencias()` (`Index.html:1201-1203`) monta HTML por concatenação e interpola `item.idAtivacao` **sem passar por `escaparHtml()`** — `escaparHtml` é aplicado a `item.formato`, mas não ao id. `idAtivacao` vem de `getPendencias()` (`WebApp.js:270`), que o lê da coluna `ID` da planilha. Um valor de célula com aspas simples quebra o atributo `onclick`.
4. `logout()` (`WebApp.js:227`) remove o token do cache do servidor — mas `sairDoApp()` (`Index.html:966`) é *fire-and-forget*: limpa o `localStorage` primeiro e dispara `google.script.run.logout(token)` sem aguardar. Se a chamada falhar, o token continua válido no servidor por até 6 h, agora sem que ninguém saiba dele.

**O que não sei, e importa:** se o banner é um comentário órfão (a persistência foi adicionada depois e ninguém apagou a linha) ou se a persistência violou uma decisão de segurança consciente. `SYSTEM_TRUTH.md` §2 documenta o token no `CacheService` do **servidor** e **não menciona persistência no cliente** — o que sugere a segunda hipótese, mas não prova.

**Isto é decisão do usuário, não do agente.** Nenhuma linha foi tocada.

Mitigação mínima, se a persistência for mantida: escapar `idAtivacao` no `onclick`, tornar `logout()` bloqueante antes de limpar o storage, e considerar `sessionStorage` (morre com a aba) em vez de `localStorage` (sobrevive ao reboot).

#### V-02 · 🟠 **A "senha" não é de baixa entropia — é informação pública**

`CLAUDE.md` §3 e `WebApp.js:9-11` descrevem a senha como *"prefixo do CNPJ (baixa entropia, não é um segredo gerado)"*, e o bloqueio de 5 tentativas existe para impedir a varredura de 10⁵ combinações.

O enquadramento subestima o problema. **CNPJ é dado público** — consultável na Receita Federal a partir da razão social, que é o nome da influenciadora. Os 5 primeiros dígitos são a raiz do CNPJ, a parte mais previsível. Um atacante que saiba quem é a parceira não precisa de força bruta: **acerta na primeira tentativa**, e o bloqueio de tentativas nunca dispara.

O único segredo real do sistema é o `CUPOM`. E o cupom circula em campanhas públicas de marketing — é literalmente feito para ser divulgado.

Não estou propondo mudança agora; estou registrando que a defesa documentada (rate limiting) protege contra a ameaça errada.

#### V-03 · 🟠 **`updatePerfil()` corrompe o endereço derivado**

`updatePerfil()` (`WebApp.js:590-594`) grava `CEP`, `NUMERO` e `COMPLEMENTO` diretamente, e **não recalcula** `RUA`, `BAIRRO`, `CIDADE`, `UF` nem `INFLUENCIADORA_ENDERECO`.

Existe um mecanismo que deveria cobrir isso — `onEdit()` (`Código.js:293-295`) observa `CEP`/`NUMERO`/`COMPLEMENTO` em `BASE DE DADOS` e chama `preencherEnderecoPorCEP()`. **Mas ele não dispara aqui**, por dois motivos independentes:

1. `onEdit` é um **trigger simples** — não é acionado por escritas feitas via script (`setValue()` de outra execução), só por edição humana na UI.
2. Mesmo quando dispara, `preencherEnderecoPorCEP()` chama `UrlFetchApp.fetch()` (`Código.js:908`). **Triggers simples não têm autorização para `UrlFetchApp`.** Isso está confirmado no próprio repositório: `SchemaExporter.js:19-23` documenta exatamente esse fenômeno para `DriveApp`, e é a razão de existir um trigger instalável separado.

Consequência concreta: a influenciadora muda o CEP no Portal. `CEP` na planilha vira o novo. `RUA`, `CIDADE`, `UF` e `INFLUENCIADORA_ENDERECO` continuam com o endereço antigo. O look é enviado para o endereço errado — porque `gerarNovoMesCompleto()` (`Código.js:134`) copia `INFLUENCIADORA_ENDERECO` para `FLUXO LOGÍSTICO`, e `gerarMensagemRevisao()` (`Código.js:433`) lê a mesma coluna para confirmar dados no WhatsApp.

Grau de confiança: **alto** para o item 2 (documentado no repo); **alto** para o item 1 (comportamento de plataforma). Verificável sem tocar código: a lista `triggersInstalados` no `SYSTEM_SCHEMA.md` gerado pelo `SchemaExporter` mostra se existe um `onEdit` instalável.

**Corolário forte:** a existência do item de menu `" 2. Preencher Endereço por CEP (Aba Base)"` (`Código.js:46`) é a evidência de que alguém já percebeu, na prática, que o automático não funciona — `atualizarEnderecoLinhaSelecionada()` (`Código.js:889`) roda a mesma função a partir do menu, onde há autorização.

#### V-04 · 🟡 **Flag `ON`/`OFF` lida por posição (`r[0]`), não por nome**

`SYSTEM_TRUTH.md` §4 celebra a unificação: *"TODAS as abas são resolvidas por nome de cabeçalho via `getHeaderMap()`"*. Há uma exceção não documentada, e é justamente a coluna que decide quem entra na campanha:

| Local | Código |
|---|---|
| `Código.js:105` | `baseData.filter(r => r[0] === true \|\| r[0].toString().toUpperCase() === 'ON')` |
| `Código.js:372` | `dataBase.filter(r => r[0] === true \|\| ...)` |
| `Código.js:456` | `(r[0] === true \|\| r[0].toString().toUpperCase() === 'ON')` |
| `Código.js:938` | `sort([{column: 1, ascending: false}, ...])` |
| `Código.js:946` | `sh.getRange(2, 1, lastRow-1, 1)` |
| `Código.js:292` | `if (col === 1) organizarEPintarBase()` |
| `SidebarBackend.js:41-42` | `String(r[0]).toUpperCase().trim()` |

**Inserir uma coluna à esquerda de `BASE DE DADOS` desativa silenciosamente todas as influenciadoras.** Nenhuma campanha é gerada, nenhum pagamento é lançado, e o checklist de integridade do `SchemaExporter` **não detecta** — ele valida presença de nomes (`SchemaExporter.js:230-234`), e a coluna de status **não tem nome na lista esperada**.

Este é o mesmo risco #1 que `SYSTEM_TRUTH.md` §4 declara *"eliminado"*. Ele foi eliminado para 13 colunas de `BASE DE DADOS`. Sobreviveu na coluna A.

#### V-05 · 🟡 `SidebarBackend.js` usa `INFLU_KEY` como identificador de UI, com fallback posicional

`getListaInfluenciadoras()` (L34), `getDadosInfluenciadora()` (L53) e `salvarDadosSidebarV2()` (L79) fazem `const colNome = h['INFLU_KEY'] || 2;`. O fallback `|| 2` é um índice posicional cru. Se `INFLU_KEY` for renomeada, a sidebar passa a ler a coluna 2 sem avisar.

Além disso, `getListaInfluenciadoras()` (L43) devolve `"NOME (OFF)"` — a string de apresentação carrega o estado. `getDadosInfluenciadora(nome)` (L54) faz `String(nome).trim().toUpperCase()` e **não remove o sufixo `" (OFF)"`**, portanto selecionar uma influenciadora inativa na sidebar retorna `null`. Não confirmei o comportamento do `Sidebar.html` (fora do escopo desta leitura), mas o backend, isolado, não casa.

---

## 4. Lixo Técnico e Riscos

| # | Item | Local | Natureza |
|---|---|---|---|
| L-01 | `telefone: ""` retornado sempre vazio, hardcoded | `WebApp.js:546` | Campo fantasma no contrato |
| L-02 | `dataPrevista: ""` idem (contrato de pagamento) | `WebApp.js:427` | — |
| L-03 | `so.valoresCache` — fallback para uma chave que **nenhum backend produz** | `Index.html:1534` | Resíduo de contrato morto |
| L-04 | `getInfluKeyByCupom()` (L697) só é chamado por `getInfluKeyByCupomCached()` (L720) | `WebApp.js` | Função pública que deveria ser privada |
| L-05 | `LOOKS_QTD`, `CANAIS`, `PRAZO` — lidas/gravadas só pela sidebar, sem nenhum consumidor | `SidebarBackend.js:68-70, 94-96` | Documentado como intencional (L13-17). Dados órfãos. |
| L-06 | `preencherEnderecoPorCEP()` engole toda exceção em `catch(e){}` vazio | `Código.js:928` | Falha silenciosa. Único ponto do arquivo sem `Logger.log` no catch, depois do endurecimento de 2026-07-07. |
| L-07 | `login()` toma `LockService` para uma leitura | `WebApp.js:175-182` | Serializa logins concorrentes sem corrida real a proteger — o padrão oposto foi aplicado em `getPerfil`/`getPendencias` (comentário explícito em L246-247). Inconsistência residual. |
| L-08 | Cache compartilha namespace: `token` (UUID), `"tentativas_"+cupom`, `"influkey_"+cupom`, `"nomeinflu_"+cupom` | `WebApp.js:163, 195, 717, 731` | Colisão improvável (UUID vs. prefixo), mas o `CacheService` do script é global. Um cupom literalmente chamado `influkey_X` colidiria. |

### Acoplamentos nocivos

- **`onFormSubmit()` faz três coisas**: mapeia `CADASTROS`→`BASE` (Gestão de Parceiros), chama uma API externa de CEP (infraestrutura) e dispara `organizarEPintarBase()` (apresentação). São três responsabilidades num `try` só.
- **`getNomeInfluByCupomCached()` existe apenas para Execução Operacional.** É chamada exclusivamente por `obterOuCriarPastaDestino()` (`WebApp.js:813`), para nomear a pasta do Drive. Vive em Gestão de Parceiros por acidente de proximidade ao `getInfluKeyByCupomCached`.
- **`organizarEPintarBase()` é chamada de dentro do `onEdit()`** (`Código.js:292`) a cada edição da coluna A. Faz `sort()` + `flush()` + `setBackgrounds()` da aba inteira. É a operação mais cara do ERP, disparada pelo evento mais frequente.

---

## 5. Recomendações de Migração (V2)

### 5.1 Serviços puros a extrair

```
ParceiroRepository            ← isola TODO acesso a BASE DE DADOS (diretriz CLAUDE.md §12.3)
  buscarPorCupom(cupom)
  buscarPorInfluKey(key)
  listarAtivas()              ← encapsula a leitura de status (mata V-04)
  atualizarCamposPermitidos(cupom, campos)

AutenticacaoService           ← puro, testável, sem SpreadsheetApp
  verificarCredencial(cnpj, senha)
  contarTentativa(cupom) / estaBloqueado(cupom)

SessaoService
  criar(cupom) / validar(token) / revogar(token)

EnderecoService              ← única porta para brasilapi.com.br
  resolverPorCep(cep) → {rua, bairro, cidade, uf}
  montarEnderecoCompleto(partes) → string
```

`EnderecoService` resolve V-03 na raiz: hoje a lógica de montagem do endereço está **duplicada** em `onFormSubmit()` (`Código.js:865-869`) e `preencherEnderecoPorCEP()` (`Código.js:921-925`), com formatação idêntica escrita duas vezes. Unificando, `updatePerfil()` passa a chamá-la e o endereço derivado nunca mais diverge do CEP.

### 5.2 Tratamento das funções contaminadas que tocam este contexto

**`onEdit()` — bloco `BASE DE DADOS` (`Código.js:291-296`).** É a fatia mais fácil de extrair de toda a função. Duas ações independentes (repintar; recalcular endereço), ambas disparadas por coluna. Vira:

```js
if (name === ABAS.BASE) return ParceiroEventHandler.aoEditar(e, h);
```

⚠️ **Ao extrair, decidir explicitamente o que fazer com V-03.** Mover `preencherEnderecoPorCEP` para um trigger instalável dá autorização a `UrlFetchApp` e faz o auto-CEP funcionar **pela primeira vez** — o que é uma **mudança de comportamento observável** e portanto violação de `CLAUDE.md` §12.4.1. Não é refatoração: é correção de bug. Precisa de PR próprio, decisão do usuário e provavelmente aviso à operação (endereços vão começar a se mover sozinhos).

**`gerarNovoMesCompleto()`** consome este contexto apenas como leitor (`influON`, `Código.js:105-115`). Na quebra, recebe `ParceiroRepository.listarAtivas()` como entrada e não conhece mais `BASE DE DADOS`.

### 5.3 Ordem sugerida de entrega

1. `EnderecoService` — extração pura, sem mudança de comportamento, testável isoladamente. **Zero risco.**
2. `ParceiroRepository.listarAtivas()` — mata `r[0]` (V-04) em cinco call-sites de uma vez. Comportamento idêntico se a coluna A continuar sendo a primeira.
3. `AutenticacaoService` + `SessaoService` — só depois de o usuário decidir sobre V-01 e V-02. Refatorar autenticação antes de decidir o modelo de sessão é retrabalho garantido.
4. Sidebar (`SidebarBackend.js:20-101`) → arquivo próprio. É `[Legado Compartilhado]` puro: basta cortar o arquivo em dois, nenhuma função muda.

### 5.4 Cobertura de teste existente

`test/webapp-autenticacao.test.js` e `test/webapp-perfil.test.js` cobrem os fluxos de `WebApp.js`. **Não há teste para `SidebarBackend.js`** (nenhum teste carrega esse arquivo — confirmado no Passo 3). Antes de fatiar a sidebar, escrever a rede de segurança: `CLAUDE.md` §12.4.7.

---

## Resumo executivo

| Achado | Severidade | Ação |
|---|---|---|
| V-01 · Token bearer em `localStorage`, 6 h deslizantes, contra o próprio banner | 🔴 Crítico | Decisão do usuário |
| V-02 · Senha derivável de dado público (CNPJ); rate limit protege a ameaça errada | 🟠 Alto | Decisão do usuário |
| V-03 · `updatePerfil()` desincroniza endereço; auto-CEP via `onEdit` provavelmente nunca funcionou | 🟠 Alto | Verificar triggers, depois PR de correção |
| V-04 · Flag `ON`/`OFF` posicional (`r[0]`) em 7 call-sites | 🟡 Médio | `ParceiroRepository.listarAtivas()` |
| V-05 · Fallback `\|\| 2` e sufixo `" (OFF)"` na sidebar | 🟡 Médio | Cobrir com teste antes de tocar |
