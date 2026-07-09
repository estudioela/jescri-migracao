# PLANO DE TESTES — Jescri ERP + Portal de Influenciadoras

> Data: 2026-07-07. Baseado em `docs/AUDITORIA_TECNICA_2026-07-07.md` e leitura direta do código (`mae/*.js`, `mae/*.gs`, `mae/Index.html`). **Nenhum teste foi implementado ainda** — este documento é só a estratégia, para aprovação antes da execução. Nenhuma alteração de código foi feita.

---

## 0. Restrição de plataforma que molda toda a estratégia

Google Apps Script não tem test runner nativo, não roda em Node.js, e depende de globais só disponíveis em produção (`SpreadsheetApp`, `DriveApp`, `CacheService`, `PropertiesService`, `LockService`, `UrlFetchApp`, `ScriptApp`, `HtmlService`, `ContentService`, `Utilities`). Além disso `clasp run` **não funciona neste projeto** (causa raiz documentada em `SYSTEM_TRUTH.md` item 4 — devMode exige ser dono do script). Isso significa:

- Testes de **unidade** só são viáveis fora do Apps Script (Node.js + Jest), rodando o mesmo código-fonte com os globais do GAS **mockados**.
- Testes de **integração/E2E reais** só podem rodar de duas formas: (a) dentro do próprio Apps Script, via uma função "orquestradora" chamada manualmente ou por trigger (é o que `QaShadow.js` já faz parcialmente), ou (b) via HTTP contra uma deployment real (`doGet`/`doPost`), de fora do Apps Script.
- Não existe ambiente de staging técnico (risco #5 da auditoria) — qualquer teste de integração/E2E real hoje corre contra a planilha de produção. **Proponho criar uma planilha de QA dedicada** (cópia estrutural, não os dados reais) como pré-requisito da Fase 6 — detalhado abaixo, é a mudança de infraestrutura mais significativa deste plano e será submetida à sua aprovação separadamente antes de ser criada.

---

## 1. Mapeamento de funcionalidades por testabilidade

### 1.1. Backend — funções puras (sem I/O, GAS ou não)

| Função | Arquivo | Testável hoje via Jest puro |
|---|---|---|
| `calcularDataAprovacao(dataInput)` | `Código.js` ~L305 | Sim |
| `getHeaderMap(sh)` | `Código.js` ~L772 | Sim (mock de `sh` simples) |
| `montarLinha(h, campos)` | `Código.js` ~L783 | Sim |
| `parseMesAno(textoBruto)` | `Código.js` ~L795 | Sim |
| `textToNumber(t)` | `Código.js` ~L805 | Sim |
| `formatarTitleCase(t)` | `Código.js` ~L819 | Sim |
| `normalizarStatusAtivacao(statusBruto)` | `WebApp.js` ~L788 | Sim |
| `normalizarStatusPagamento(statusBruto)` | `WebApp.js` ~L806 | Sim |
| `extrairValorNumerico(valorStr)` | `WebApp.js` ~L823 | Sim |
| `nomeFormatoPasta(formato)` | `WebApp.js` ~L839 | Sim |
| `formatarData(data)` | `WebApp.js` ~L815 | Quase — usa `Utilities.formatDate` (1 mock simples) |

### 1.2. Backend — regras de negócio com I/O (planilha), testáveis com dados mockados

`login`, `validarToken`, `logout`, `getPendencias`, `getBriefing`, `getPagamentos`, `getHistorico`, `getPerfil`, `updatePerfil`, `listarPeriodos`, `iniciarEnvioResumable`, `finalizarEnvioResumable`, `encontrarLinhaAtivacaoPorId`, `getInfluKeyByCupom(Cached)`, `detectarAbasHistoricoLegado`. Todas testáveis simulando `getDataRange().getValues()`/`getRange().getValue()` com um "sheet fake" (array 2D + funções que o leem) — sem depender de planilha real.

### 1.3. Backend — automações orientadas a evento (triggers)

`onEdit`, `onFormSubmit`, `arquivarGenerico`, `organizarEPintarBase`, `preencherEnderecoPorCEP`, `sincronizarLooks`, `atualizarRastreiosBRComerce`. Testáveis a nível de **lógica pura interna** via mocks (ex.: a lógica de decisão dentro de `onEdit`), mas o comportamento completo (disparo real, leitura/escrita efetiva) só é verificável de forma confiável rodando contra uma planilha real (Fase 6).

### 1.4. Front-end — funções puras (dentro de `<script>` em `Index.html`)

`formatarData` (alvo do fix do bug 18.1), `formatarMoeda`, `escaparHtml`, `primeiroNome`, `formatarTamanho`, `periodoAtual`, montagem de `STATUS_LABELS`/`ETAPA_ORDEM`. Hoje inline no HTML — **testáveis via Jest+JSDOM extraindo/carregando o `<script>`** sem necessidade de navegador real.

### 1.5. Front-end — fluxos de interface (DOM, navegação, upload)

Login, navegação entre telas, seleção/progresso/erro de upload, renderização de cards/tracker. Só testáveis de forma realista com um navegador (Playwright), pois dependem de CSS/layout real (ex.: o bug de alinhamento do tracker já documentado no `CLAUDE.md` só seria pego visualmente ou por E2E, não por unit test).

---

## 2. Fluxos críticos (ranqueados por risco × frequência de uso)

| # | Fluxo | Por que é crítico |
|---|---|---|
| 1 | **Login** | Autenticação de baixa entropia por design; ponto de entrada único; qualquer regressão bloqueia todas as influenciadoras |
| 2 | **Envio de material (upload resumable)** | Multi-etapa (iniciar→PUT chunks→finalizar), já teve 2 incidentes reais documentados (404 por `uploadUrl` ausente; "Failed to fetch" por violação de validação de dados) |
| 3 | **Exibição de datas** (18.1) | Bug confirmado nesta auditoria, afeta toda a UI |
| 4 | **Pendências/Briefing** (filtragem por período + controle de acesso) | Dados sensíveis por influenciadora; erro de filtro vaza dados de outra pessoa |
| 5 | **Pagamentos (normalização de status)** | Vocabulário tem que casar entre backend e front (`STATUS_PAGAMENTO`); já é ponto de risco documentado |
| 6 | **Arquivamento (`arquivarGenerico`)** | Acoplamento posicional silencioso (dívida técnica #4); move dados irreversivelmente entre abas |
| 7 | **Ciclo mensal (`gerarNovoMesCompleto`)** | Gera toda a operação do mês; erro aqui afeta todas as influenciadoras simultaneamente |
| 8 | **Histórico (agregação + abas legado)** | Lógica de detecção dinâmica de abas, mais frágil por natureza |
| 9 | **Perfil (leitura/edição)** | Único ponto de escrita direta da influenciadora em `BASE DE DADOS` |
| 10 | **`onFormSubmit` (cadastro)** | Depende de trigger não verificável por código; silencioso em caso de erro |

---

## 3. Estratégia de testes por camada

| Camada | O quê | Ferramenta | Roda onde | Frequência recomendada |
|---|---|---|---|---|
| **Unitário** | Funções puras (back e front) | Jest (+ JSDOM p/ front) | Node.js, local/CI | A cada commit/PR |
| **Unitário c/ mocks de I/O** | Regras de negócio com planilha simulada | Jest + mocks manuais de `SpreadsheetApp`/`CacheService`/etc. | Node.js, local/CI | A cada commit/PR |
| **Integração real (GAS)** | Triggers, arquivamento, ciclo mensal, contra planilha de QA dedicada | Funções orquestradoras dentro do próprio Apps Script (extensão do `QaShadow.js`) | Apps Script, planilha de QA | Antes de merge em `main` / antes de deploy |
| **E2E (HTTP)** | `doGet`/`doPost` reais, jornada completa via chamadas HTTP | Node.js (`fetch`/`axios`) + Jest, contra deployment de QA | Local/CI, apontando para ambiente de QA | Antes de deploy em produção |
| **E2E (navegador)** | Jornada do usuário na UI real (login→upload→pagamentos→histórico→perfil) | Playwright | Local/CI, contra ambiente de QA | Antes de deploy em produção / regressão visual |
| **Regressão** | Reexecução do conjunto unitário+integração+E2E crítico | Composição dos anteriores | CI (GitHub Actions) | A cada PR (unit) + antes de cada deploy (integração/E2E) |

**Por que essa combinação e não outra**: dado que `clasp run` não funciona (não dá pra rodar o código do GAS "de fora" com dados reais de forma simples) e não há staging técnico, a única forma de cobrir triggers/arquivamento/ciclo mensal com confiança real é rodar o próprio código dentro do Apps Script contra uma planilha de QA — daí a Fase 6 abaixo ser pré-requisito de qualquer teste de integração/E2E de verdade, não um "nice to have".

---

## 4. Casos de teste — amostra representativa por fluxo crítico

### 4.1. Login (`login()`, `WebApp.js`)

| Tipo | Caso |
|---|---|
| Positivo | Cupom + senha corretos → `ok:true`, token retornado, `nome` correto |
| Positivo | Cupom em minúsculas/com espaços → login funciona (normalização) |
| Negativo | Senha errada → `CREDENCIAIS_INVALIDAS`, contador de tentativas incrementa |
| Negativo | Cupom inexistente → `CREDENCIAIS_INVALIDAS` (não revela se cupom existe) |
| Negativo | 5ª tentativa errada consecutiva → `MUITAS_TENTATIVAS`, bloqueio de 15min |
| Negativo | Cupom ou senha vazios → `CREDENCIAIS_INVALIDAS` sem tocar a planilha |
| Borda | CNPJ com menos de 5 dígitos na planilha → senha esperada é o que sobrar (substring) |
| Borda | Login bem-sucedido reseta contador de tentativas anterior |

### 4.2. Upload resumable (`iniciarEnvioResumable`/`finalizarEnvioResumable`, `WebApp.js` + `enviarArquivoResumable`, `Index.html`)

| Tipo | Caso |
|---|---|
| Positivo | Fluxo completo: iniciar → PUT único chunk → finalizar → `STATUS_CONTEUDO="ajustes"` |
| Positivo | Arquivo maior que `CHUNK_SIZE` (8MB) → múltiplos PUTs com `Content-Range`, resposta 308 intermediária |
| Negativo | `idAtivacao` de outra influenciadora → `ACESSO_NEGADO` |
| Negativo | `idAtivacao` inexistente → `ATIVACAO_NAO_ENCONTRADA` |
| Negativo | Token expirado no meio do processo → `SESSAO_EXPIRADA` |
| Negativo | Google Drive não retorna header `Location` → `FALHA_INICIAR_UPLOAD` com detalhe (regressão do bug já corrigido) |
| Negativo | `STATUS_CONTEUDO` gravado precisa estar sempre dentro dos 5 valores aceitos pela validação de dados da célula (regressão do bug de 2026-07-06) |
| Borda | Múltiplos arquivos selecionados — progresso agregado corretamente por arquivo |
| Borda | Upload cancelado/erro no meio → estado de erro exibido, "tentar novamente" funcional |

### 4.3. Exibição de datas (front + back, bug 18.1)

| Tipo | Caso |
|---|---|
| Regressão (o próprio bug) | Data `05/07/2026` (dia ≤ 12) deve exibir `05/07/2026`, não `07/05/2026` |
| Borda | Todos os dias 1-12 de um mês qualquer — dia e mês não podem ser trocados |
| Borda | Dias 13-31 — devem continuar corretos após o fix (não quebrar o que já funcionava "por acidente") |
| Borda | Valor vazio/nulo → exibe `-` (comportamento atual preservado) |
| Borda | Virada de ano (31/12 → 01/01) |
| Borda | Ano bissexto, 29/02 |

### 4.4. Normalização de status (`normalizarStatusAtivacao`/`normalizarStatusPagamento`)

| Tipo | Caso |
|---|---|
| Positivo | `"aprovado"` → `APROVADO` (não `EM_APROVACAO`, testa a ordem de checagem documentada no código) |
| Positivo | `"postado"`/`"publicado"` → `PUBLICADO` |
| Positivo | `"ajustes"` → `EM_APROVACAO` (valor real gravado pelo sistema desde 2026-07-06) |
| Positivo | `"em aberto"`/`"falta drive"` → `AGUARDANDO_MATERIAL` |
| Borda | String vazia → `AGUARDANDO_MATERIAL` (fallback) |
| Positivo | `PAGAMENTOS`: `"pago"` → `PAGO` (checado antes de `"aprovado"`) |

### 4.5. Arquivamento (`arquivarGenerico`)

| Tipo | Caso |
|---|---|
| Positivo | Linha com status-chave (`"postado"`/`"pago"`/`"entregue"`) é movida para a aba de histórico, cabeçalho igual |
| Positivo | `DATA_PAGAMENTO` preenchida só se estava vazia |
| Negativo | Coluna de status não existe na aba → retorna 0, não quebra |
| Borda | Múltiplas linhas arquiváveis na mesma execução — todas movidas, nenhuma pulada (laço de trás para frente) |
| Borda (regressão da dívida técnica #4) | Ordem de colunas diferente entre aba origem/destino — teste que **documenta** o comportamento atual (falha esperada), não necessariamente corrigido nesta fase |

### 4.6. Perfil (`getPerfil`/`updatePerfil`)

| Tipo | Caso |
|---|---|
| Positivo | Atualização de 1 campo isolado não afeta os demais |
| Negativo | Token inválido → `SESSAO_EXPIRADA` |
| Negativo | Cupom sem correspondência → `PERFIL_NAO_ENCONTRADO` |
| Borda | Campos `undefined` no payload não sobrescrevem valor existente (checagem `!== undefined`) |

*(Casos completos e exaustivos para os 10 fluxos críticos serão detalhados durante a implementação de cada fase — esta amostra cobre o padrão a seguir.)*

---

## 5. Ferramentas recomendadas

| Ferramenta | Papel | Justificativa |
|---|---|---|
| **Jest** | Test runner unitário (back e front) | Padrão de mercado, mocking nativo (`jest.fn()`), snapshot testing útil para datas/formatação, zero configuração de transpilação (código já é ES6+ puro) |
| **jsdom** (via Jest) | DOM simulado para testar funções puras extraídas de `Index.html` | Permite carregar o `<script>` do HTML num ambiente DOM sem navegador real |
| **Mocks manuais de GAS** (arquivo `test/mocks/gas-globals.js`, escrito por nós) | Simular `SpreadsheetApp`, `CacheService`, `PropertiesService`, `LockService`, `Utilities`, `DriveApp`, `UrlFetchApp`, `ScriptApp` | Não há biblioteca madura e mantida que cubra 100% da API GAS usada aqui; mocks manuais e enxutos (só o que o projeto usa) são mais previsíveis que uma dependência externa de terceiros para isso |
| **Playwright** | E2E via navegador real (Portal) | Suporta Chromium/Firefox/WebKit, screenshots automáticos em falha (pega regressões visuais como o bug de alinhamento do tracker já documentado), API moderna e estável |
| **Node `fetch`/`axios` + Jest** | E2E via HTTP direto (`doGet`/`doPost`) sem navegador | Mais rápido que Playwright para validar contrato JSON puro; complementa (não substitui) o E2E de navegador |
| **QaShadow.js (já existe)** | Validação de contrato + integridade real, dentro do próprio Apps Script | Já implementado; será **expandido** (Fase 6) para rodar funções reais contra a planilha de QA, não só fixtures |
| **GitHub Actions** | CI para rodar a camada unitária a cada PR | Já há branch protection em `main`; adicionar um workflow de CI é natural e de baixo risco (não toca produção) |

**Não recomendado neste momento**: frameworks de teste específicos de GAS de terceiros pouco mantidos (ex. `gas-local`) — a superfície de API do projeto é pequena o suficiente para mocks manuais serem mais simples de auditar e manter do que uma dependência externa.

---

## 6. Cobertura ideal por módulo

| Módulo | Métrica | Meta |
|---|---|---|
| Funções puras (back: `calcularDataAprovacao`, normalizadores, `montarLinha`, `parseMesAno`, `textToNumber`, `formatarTitleCase`, `extrairValorNumerico`, `nomeFormatoPasta`) | Linhas/branches (Jest) | 100% |
| Funções puras (front: `formatarData`, `formatarMoeda`, `escaparHtml`, `primeiroNome`, `formatarTamanho`) | Linhas/branches (Jest+JSDOM) | 100% |
| Regras de negócio com I/O mockado (`login`, `getPendencias`, `getBriefing`, `getPagamentos`, `getHistorico`, `getPerfil`, `updatePerfil`, `listarPeriodos`, `iniciarEnvioResumable`, `finalizarEnvioResumable`) | Branches (todos os `erro:` possíveis + caminho feliz) | ≥ 85% linhas, 100% dos branches de erro nomeados |
| Triggers (`onEdit`, `onFormSubmit`) | Cenários (não linha) | 1 teste de integração real por ramo tratado (BRIEFING, ATIVAÇÕES×2, BASE×2, PAGAMENTOS, FLUXO) |
| Arquivamento/ciclo mensal | Cenários de integração real | Golden path + 2 bordas (coluna ausente, ordem de coluna divergente) |
| E2E navegador (jornadas) | Cobertura por jornada, não por linha | Login, pendências→briefing→upload, pagamentos, histórico, perfil — golden path + 1-2 negativos cada |

Não faz sentido perseguir "% de cobertura" para triggers e fluxos de integração — a métrica certa ali é **cenário coberto**, não linha executada.

---

## 7. Ordem de implementação proposta e riscos mitigados

| Fase | Conteúdo | Risco mitigado | Esforço estimado |
|---|---|---|---|
| **1. Fundação** | `package.json` + Jest + estrutura de mocks GAS mínima (`test/mocks/`) | Nenhum diretamente — desbloqueia todas as fases seguintes | 0,5–1 dia |
| **2. Unit — funções puras backend** | Testes de `calcularDataAprovacao`, normalizadores, `montarLinha`, `parseMesAno`, `textToNumber`, `formatarTitleCase`, `extrairValorNumerico`, `nomeFormatoPasta`, `formatarData` (back) | Regressão silenciosa em regras de data/status/moeda usadas em múltiplos fluxos | 1–1,5 dia |
| **3. Fix + teste do bug de data (18.1)** | TDD: teste que reproduz o bug → correção → teste passa, vira regressão permanente | O bug de maior impacto visível ao usuário identificado na auditoria | 0,5–1 dia |
| **4. Unit — funções puras front-end** | Testes via Jest+JSDOM de `formatarMoeda`, `escaparHtml`, `primeiroNome`, `formatarTamanho`, `formatarData` (front, pós-fix) | Regressões visuais silenciosas na formatação exibida | 1 dia |
| **5. Unit — regras de negócio com I/O mockado** | `login`, `getPendencias`, `getBriefing`, `getPagamentos`, `getHistorico`, `getPerfil`, `updatePerfil`, `iniciarEnvioResumable`, `finalizarEnvioResumable`, controle de acesso (`ACESSO_NEGADO`) | Vazamento de dados entre influenciadoras, bypass de autorização, regressão nas regras de filtro por período | 3–4 dias |
| **6. Ambiente de QA + integração real** | Criar planilha de QA dedicada (estrutura idêntica, dados fictícios) + expandir `QaShadow.js` para rodar funções **reais** (não só fixtures) contra ela: `onEdit`, `onFormSubmit`, `arquivarGenerico`, `gerarNovoMesCompleto` | Os fluxos mais frágeis e difíceis de isolar (triggers, arquivamento posicional, ciclo mensal) — hoje sem nenhuma cobertura automatizada real | 3–5 dias (inclui aprovação e criação da planilha) |
| **7. E2E navegador (Playwright)** | Jornadas completas apontando para a deployment de QA: login→pendências→briefing→upload→pagamentos→histórico→perfil | Regressões de UI/UX e de integração front↔back reais (ex.: bug de alinhamento do tracker, CSS quebrado, upload real falhando) | 3–4 dias |
| **8. CI + regressão contínua** | GitHub Actions rodando Fases 2-5 a cada PR; documentar checklist manual para Fases 6-7 antes de cada deploy em produção | Ausência de qualquer verificação automática antes de merge (dívida técnica #7 da auditoria) | 1–2 dias |

**Total estimado**: ~14–19 dias de esforço técnico (sequencial; fases 2-5 podem ser paralelizadas se houver mais de uma pessoa).

**Pré-requisito que exige sua aprovação separada antes da Fase 6**: a criação de uma planilha de QA dedicada é a única forma real de testar triggers/arquivamento/ciclo mensal com segurança, mas é uma mudança de infraestrutura (novo artefato no Drive, possivelmente um novo deployment do Web App apontando para ela) — trarei uma proposta concreta (estrutura, como popular dados fictícios, como isolar do script de produção) para aprovação quando chegarmos nessa fase, não antes.

---

## 8. Resumo para aprovação

- **Frameworks**: Jest (unit, back e front), Playwright (E2E navegador), Node `fetch` (E2E HTTP), extensão do `QaShadow.js` já existente (integração real dentro do Apps Script).
- **Ordem**: fundação → unit puro (back) → fix+teste do bug de data → unit puro (front) → unit com I/O mockado → ambiente de QA + integração real → E2E navegador → CI.
- **Cobertura**: 100% em funções puras, ≥85% + 100% dos branches de erro em regras de negócio com I/O, cobertura por cenário (não linha) em triggers/E2E.
- **Maior decisão pendente**: criação de uma planilha de QA dedicada (Fase 6) — não farei isso sem sua aprovação explícita quando chegarmos lá.

Nenhum teste foi implementado. Aguardando sua aprovação (ou ajustes) desta estratégia antes de iniciar a Fase 1.
