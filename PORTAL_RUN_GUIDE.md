# Portal TEAR V2 — Guia de Execução Local

> Escrito em 2026-07-19, branch `feat/ui-design-system-ela`. Objetivo: colocar
> o portal em pé para validação visual real, sem depender de deploy.

## 1. Caminho mais rápido: preview local (recomendado)

O repo já tem um servidor de preview que serve `src/ui/*.html` direto do
disco, sem OAuth e sem Apps Script — simula `google.script.run` com dados de
exemplo. É o caminho certo para validar o Design System Elã nesta branch,
porque o deploy de produção ainda está em `main` (sem as migrações desta
sessão).

```bash
npm run preview
```

- Sobe em `http://localhost:8787/` (porta configurável via `PORT=xxxx npm run preview`).
- Lê os arquivos a cada request — edição em `src/ui/*.html` reflete no
  próximo refresh do navegador, sem restart do servidor.
- Injeta um selo "PREVIEW — dados simulados" no canto inferior direito de
  toda página, para nunca confundir com produção.

### URLs por tela

| Tela | URL |
|---|---|
| Login | `http://localhost:8787/?pagina=portal-login` |
| Dashboard (Portal da Parceira) | `http://localhost:8787/?pagina=portal-dashboard` |
| Perfil | `http://localhost:8787/?pagina=portal-perfil` |
| Pendências | `http://localhost:8787/?pagina=portal-pendencias` |
| Financeiro | `http://localhost:8787/?pagina=portal-financeiro` |
| Admin (Equipe) | `http://localhost:8787/?pagina=admin` |
| Briefing | `http://localhost:8787/?pagina=briefing` |
| Entrega | `http://localhost:8787/?pagina=entrega` |
| Envio | `http://localhost:8787/?pagina=envio` |
| Pagamentos | `http://localhost:8787/?pagina=pagamentos` |
| Compilar mês | `http://localhost:8787/?pagina=compilar-mes` |
| Documentos | `http://localhost:8787/?pagina=documentos` |

Sem `?pagina=`, o servidor cai em `portal-login`.

### Dados simulados

Ficam hardcoded em `scripts/preview-server.mjs` (constante `DATA` dentro do
`MOCKS`). Cobrem os principais contratos: pendências, financeiro, histórico,
perfil, usuários pendentes, entregas, envios, pagamentos, compilação de mês,
briefing. Login simulado já entra "autenticado" (token `preview-token`,
papel `ADMINISTRADOR`) em qualquer página exceto `portal-login`.

**Login real não é testável aqui** — `iniciarLoginComGoogle`/
`entrarComCodigoOAuth` retornam dados mockados fixos, não passam pelo fluxo
OAuth de verdade. Para validar o fluxo de login/redirect real, use o Web App
publicado (seção 2).

### Encerrar

O servidor roda em foreground; `Ctrl+C` no terminal onde foi iniciado. Se
subiu em background, `pkill -f preview-server.mjs` ou localizar o PID com
`lsof -i :8787`.

## 2. Ambiente real: Web App do Apps Script

- **Script ID**: `12AxJsKHEr9GV3y6t0vIgHsghoUKM1hhTEe9j_0QW3fFRzxHcLAhwrhBZ` (`.clasp.json`).
- `clasp` está instalado e autenticado neste ambiente (`clasp deployments`
  funcionou sem novo login).
- **5 deployments existentes**, o de produção é:
  - `AKfycbwUhR1P7ZQlf9l_gf5PdlXrxwVU4oyefWwIEg4oPUwpeHTqOo-iA6sB7bjnBvq58s0Q4g`
    — `@33`, rotulado "ADR-015 consolidacao real (v32) - producao".
  - URL: `https://script.google.com/macros/s/AKfycbwUhR1P7ZQlf9l_gf5PdlXrxwVU4oyefWwIEg4oPUwpeHTqOo-iA6sB7bjnBvq58s0Q4g/exec`
- **Importante**: esse deployment reflete o código que foi publicado por
  último via `clasp push`/`clasp deploy` — **não inclui necessariamente** as
  migrações visuais desta branch (`feat/ui-design-system-ela`), que ainda
  não foram mescladas a `main` nem publicadas. Para ver o DS Elã em produção
  seria necessário `clasp push` a partir desta branch — **não fazer isso
  sem aprovação**, pois sobrescreve o Web App de produção real usado pela
  equipe/parceiras.
- Login real (Google OAuth) só funciona neste ambiente, não no preview local.

## 3. Como testar

1. `npm install` (se ainda não rodado — `node_modules` deve conter `jest` e `eslint`).
2. `npm run check` — lint + suíte de testes (719 testes na última execução
   registrada). Roda sem precisar do preview de pé.
3. `npm run preview` e abrir as URLs da tabela acima no navegador.
4. Validar por tela: carregamento, navegação (nav aninhada, botão Sair),
   estilos do DS Elã (tipografia, cores, componentes), erros no console do
   navegador, quebras de layout — especialmente os pontos já sinalizados em
   `UI_FINAL_REVIEW.md` (nav em 3 linhas, badges sem cor, `financeiro.html`).
5. Para login real ponta a ponta, usar a URL do Web App de produção (seção
   2) — mas essa não reflete o DS Elã desta branch enquanto não houver merge
   + deploy.

## 4. Pré-requisitos

- Node.js + `npm install` já satisfeitos neste ambiente (checado: `jest`,
  `eslint` presentes em `node_modules`).
- `clasp` instalado globalmente (`/opt/homebrew/bin/clasp`) e autenticado —
  necessário só para o caminho da seção 2, não para o preview local.
- Nenhum dado de planilha real é necessário para o preview (tudo mockado).
