# V2 — Roadmap operacional (evolução sobre a stack atual)

> **Decisão fundadora (2026-07-08)**: a V2 **não é migração de infraestrutura**. A stack permanece: GitHub Pages (front) + Google Apps Script (backend) + Google Sheets (banco) + Google Drive (arquivos) + Git/GitHub (versionamento).
> Autorização formal: **`CLAUDE.md` §12 — MODO V2, EVOLUÇÃO AUTORIZADA**.
> Objetivo: uma V2 sólida, organizada, escalável e profissional dentro dessa arquitetura. A **V3** (infraestrutura própria) só será planejada quando a V2 estiver madura.
> Pesquisa de V3 suspensa e preservada: `docs/V2_ESPECIFICACAO_TECNICA.md` + repo `estudioela/plataforma`, tag `v3-research-parked`. **Não implementar.**

---

## 1. Escopo

**Dentro**: arquitetura de código, modularização, débito técnico, UX/UI, funcionalidades novas, documentação, robustez, manutenibilidade, preparação para a V3.

**Fora (suspenso)**: Supabase · PostgreSQL · ETL · migração de banco · Next.js · schema de nova infraestrutura.

**Preparação para a V3 = uma diretriz só**: isolar o acesso a dados atrás de uma camada de repositório, para que trocar Sheets por um banco real, na V3, altere **somente essa camada**. Nada além disso é antecipado.

---

## 2. Regras que governam toda entrega

Derivadas de `CLAUDE.md` §12.4 e §12.5. Não são recomendações.

1. **Comportamento observável não muda.** Contratos `Index.html` ↔ `WebApp.js` (códigos de erro, formato de retorno), nomes de abas e cabeçalhos, valores de validação de célula, URL pública. Refatorar muda a forma, nunca o que o sistema faz.
2. **Teste é a rede de segurança.** Nenhuma entrega com teste vermelho. **Nenhuma entrega altera asserção de negócio existente** — se um teste precisa mudar, o comportamento mudou, e isso é quebra de compatibilidade.
3. **Uma entrega = um fluxo = um PR.** Pequena, independente, reversível, validável isoladamente. Se não puder ser validada antes da próxima, está grande demais.
4. **`FLOW.md` atualizado no mesmo PR** do fluxo tocado.
5. **Commit imediato após teste verde.**
6. **`clasp push`/`clasp deploy` só com aprovação explícita do usuário**, uma a uma. Arquivo novo em `mae/` só sobe se estiver na allowlist `mae/.claspignore`.
7. **Zona proibida (§7) intacta.** `main` protegido. `pages-portal` é produção ao vivo.

---

## 3. Plano incremental

Cada etapa abaixo é um PR. As etapas de um mesmo bloco são **independentes entre si** depois que a primeira do bloco existir — podem ser feitas em qualquer ordem, por sessões diferentes.

### Bloco 0 — Rede de segurança (pré-requisito de tudo)

| # | Entrega | Aceite |
|---|---|---|
| **0.1** | Confirmar `npm test` verde e mapear quais fluxos **não** têm cobertura | Relatório de lacunas de cobertura por fluxo |
| **0.2** | *Characterization tests* para os fluxos descobertos sem cobertura | Cada fluxo do §4 do `CLAUDE.md` tem ao menos um teste que congela seu comportamento atual |

> Sem 0.2, refatorar um fluxo é apostar. Só refatore o que estiver coberto.

---

### Bloco 1 — Camada de acesso a dados (`mae/Repo.js`)

Maior retorno: mata acoplamento **e** é a única preparação real para a V3.

| # | Entrega | Depende de | Aceite |
|---|---|---|---|
| **1.1** | Criar `mae/Repo.js` e migrar **só o fluxo Perfil** (`getPerfil`/`updatePerfil`, aba `BASE DE DADOS`) | 0.2 | Perfil não chama `SpreadsheetApp` direto; testes verdes sem asserção alterada; `Repo.js` na allowlist `.claspignore` |
| **1.2** | Migrar **Login/sessão** (`login`, `logout`, `validarToken`) | 1.1 | Lockout e códigos de erro (`CREDENCIAIS_INVALIDAS`, `MUITAS_TENTATIVAS`) idênticos |
| **1.3** | Migrar **Pendências/Períodos** (`getPendencias`, `listarPeriodos`, aba `ATIVAÇÕES`) | 1.1 | Regra D-7 útil preservada |
| **1.4** | Migrar **Briefing** (`getBriefing`) | 1.1 | Casamento `MES`+`ANO_REFERENCIA` e cadeia de fallback de `RESUMO_MES` preservados |
| **1.5** | Migrar **Pagamentos** (`getPagamentos`, `normalizarStatusPagamento`) | 1.1 | Vocabulário `PENDENTE`/`APROVADO`/`PAGO` intacto nos dois lados |
| **1.6** | Migrar **Histórico** (`getHistorico`, `listarAbasHistoricoLegado`) | 1.1 | Detecção de abas legado e contagem sem duplicação |
| **1.7** | Migrar **Upload** (`iniciarEnvioResumable`, `finalizarEnvioResumable`) | 1.1 | Resolução de linha por ID estável mantida; `STATUS_CONTEUDO` continua gravando valor **dentro** da validação de célula |
| **1.8** | Migrar **ERP** (`gerarNovoMesCompleto`, `arquivarGenerico`) em `Código.js` | 1.1 | Cópia por nome de cabeçalho preservada; ciclo mensal idêntico |

**Aceite do bloco**: nenhuma chamada a `SpreadsheetApp` fora de `Repo.js` nos fluxos migrados.

---

### Bloco 2 — Modularizar o front-end do Portal

`mae/Index.html` é um arquivo único com todo HTML+CSS+JS. O HtmlService suporta *includes* (`createTemplateFromFile` + `include()`) — dá para quebrar sem trocar infraestrutura.

| # | Entrega | Depende de | Aceite |
|---|---|---|---|
| **2.1** | Extrair CSS para `mae/styles.html` + helper `include()` em `doGet` | 0.2 | Portal renderiza idêntico; `?mode=qa` intacto; `.tracker{align-items:flex-start}` preservado |
| **2.2** | Extrair o núcleo JS (router, `chamar()`, sessão) para `mae/scripts.html` | 2.1 | Nenhuma mudança de comportamento |
| **2.3** | Extrair as telas em parciais (`mae/views_*.html`), uma por PR | 2.2 | Uma tela por PR, verificada visualmente |

> **Atenção histórica**: esses nomes já existiram e foram deliberadamente consolidados em `Index.html`. Recriá-los é uma **reversão consciente**, não resgate de legado. Registrar como tal no PR e no `CLAUDE.md` §2.

---

### Bloco 3 — Separar responsabilidades no backend

| # | Entrega | Depende de | Aceite |
|---|---|---|---|
| **3.1** | Extrair `mae/Auth.js` (login, logout, token, lockout) | 1.2 | `doGet` mantém o fallback **incondicional** para o Portal em qualquer request sem `mode=qa` válido |
| **3.2** | Extrair regras de negócio puras (D-7, seleção de briefing por formato, normalização de status) para módulo testável sem `SpreadsheetApp` | 1.3–1.5 | Regras testáveis sem planilha; testes rodam mais rápido |
| **3.3** | Reduzir `WebApp.js` a roteamento + orquestração | 3.1, 3.2 | Nenhuma regra de negócio nem `SpreadsheetApp` em `WebApp.js` |

---

### Bloco 4 — Staging (trilha paralela, maior ganho de robustez)

Hoje **não existe staging**: `clasp deploy` atinge produção e `pages-portal` atinge `portal.estudioela.com` na hora.

| # | Entrega | Depende de | Aceite |
|---|---|---|---|
| **4.1** | Planilha de teste (cópia estrutural, sem dados reais) — **ação manual do usuário** | — | Planilha existe e está compartilhada |
| **4.2** | Deployment de teste separado (`clasp deploy` sem `-i`) + seleção de ambiente via `PropertiesService` | 4.1 | Login, briefing, upload e pagamentos exercitáveis ponta a ponta sem tocar dados reais |

Pode correr em paralelo aos blocos 1–3 e passa a validá-los.

---

### Bloco 5 — UX/UI

Depende do Bloco 2 (sem modularização, cada mudança de UI é cirurgia em arquivo monolítico). Referência visual em `docs/design-reference/`. Escopo específico a definir com o usuário.

---

### Bloco 6 — Funcionalidades novas

| # | Entrega | Depende de | Aceite |
|---|---|---|---|
| **6.1** | **Módulo de Contratos** (substitui o AutoCrat) | 1.1, 3.1 | Gera contrato a partir dos dados da influenciadora; estado de assinatura rastreado em aba própria |

Demais funcionalidades: **escopo ainda não definido pelo usuário**. É a maior incógnita restante do roadmap.

---

## 4. Dependências (resumo)

```
0.1 → 0.2 → ┬─ 1.1 → {1.2 … 1.8}  (independentes entre si)
            └─ 2.1 → 2.2 → 2.3
1.2 → 3.1 ┐
1.3–1.5 → 3.2 ├→ 3.3
2.x → Bloco 5 (UX)
1.1 + 3.1 → 6.1 (Contratos)
Bloco 4 (staging): paralelo; valida todos os demais
```

## 5. Riscos conhecidos (herdados, continuam válidos)

- **`clasp push` substitui o conteúdo remoto por completo.** Arquivo novo em `mae/` só sobe se estiver em `mae/.claspignore` (allowlist). Arquivo removido do repo some do script vivo.
- **`clasp run` não funciona** neste projeto (a conta é editora, não dona). Funções de menu exigem execução manual do usuário. Não reinvestigar sem motivo novo.
- **`main` é protegido de verdade.** Nunca contornar.
- **`pages-portal` é produção sem staging** (até o Bloco 4).
- **Perda de trabalho não-commitado**: um `clasp pull` externo já reverteu alterações testadas.
- **Erros de validação de célula escapam de `try/catch`** (flush diferido) — causa raiz do "Failed to fetch" no upload.
- **Bug de data (troca dia/mês)** já corrigido em `formatarData()` — não reintroduzir com parser genérico.
- **`onFormSubmit` depende de trigger instalável** configurado fora do código-fonte. Não verificável por código.

## 6. Dívidas técnicas adiáveis

- Abas legado de histórico (nome variável, detecção dinâmica) — consolidar depois.
- `mae/PortalUi.js` e `mae_backup_antes_clasp/` não versionados no working dir — investigar e limpar.
- `docs/BRIEFING_MANUAL_USUARIO.md` e `docs/PROMPT_CLAUDE_DESIGN.md` não versionados — decidir destino.
- Observabilidade além do Execution Log.
- Divergência de data `LÊ PENHA/JULHO/reel` (BRIEFING 04/08/2026 × ATIVAÇÕES 23/07/2026) — **pendente de decisão do usuário**.

## 7. Fluxo de trabalho por entrega

1. Identificar **fluxo → arquivo → função**.
2. Garantir cobertura de teste do comportamento atual (Bloco 0). Se não houver, criar antes.
3. Refatorar até o teste passar **sem alterar asserções de negócio**.
4. `npm test` verde → **commit imediato**.
5. Atualizar `FLOW.md` (e `CLAUDE.md`, se a estrutura mudou) **no mesmo PR**.
6. Branch + PR para `main`; CI verde.
7. `clasp push` / `clasp deploy` **só com aprovação explícita**.
8. Emitir a saída obrigatória de estabilidade (`CLAUDE.md` §11).

## 8. Primeiro passo

**Etapa 0.1** — rodar `npm test` e mapear os fluxos sem cobertura. Nenhuma refatoração antes de 0.2.
