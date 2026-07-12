# Mapa da Arquitetura — Projeto Tear (V2)

10 arquivos principais no escopo global único do Apps Script.
`.js` local = `.gs` no editor (clasp converte na subida).

## Camadas

```
FRONT-END (HTML)          BACK-END (.js)        Papel
Index.html  ............   Roteador.js .......   entrypoints api* + doGet/include + _exigirAdmin
Styles.html ............   Controllers.js ....   *Controller  → envelope {success, data|error}
Templates.html .........   Services.js .......   *Service     → regra de negócio, valida, orquestra
                           Repositories.js ...   *Repository  → ÚNICA camada que toca SpreadsheetApp
                           Modelos.js ........   entidades + Dto + Senha
                           Infra.js ..........   Config (PLANILHAS), PlanilhaHelpers, EventDispatcher
                           DevTools.js .......   Setup / Migração / SanityCheck (utilitários de editor)
```

## Fluxo de uma chamada

```
google.script.run.apiX(args)
  → Roteador.apiX          (_comEnvelope; _exigirAdmin nas operações admin)
  → _montarControllerDeX
  → Controller.handleX     (try/catch → envelope)
  → Service                (regra + validação)
  → Repository             (SpreadsheetApp)
  ← { success, data | error }
```

## Dependências entre camadas

```
Roteador → Controllers → Services → Repositories → Infra / Modelos
```

- Só o Repository lê/escreve planilha.
- Só o Controller (e `_comEnvelope`) convertem exceção em envelope; camadas internas lançam.

## Entrypoints (todos `function` de topo — contrato do google.script.run)

Entrypoints de autenticação e portal:

`apiLogin`, `apiSessaoAtual`, `apiLogout`,
`apiListarCiclos`,
`apiListarAtivacoesDoCiclo`,
`apiListarPagamentosDoCiclo`,
`apiListarHistoricoDoCiclo`.

Entrypoints administrativos:

`apiBuscarParceira`,
`apiSalvarParceira`,
`adminDefinirSenha`,
`apiListarCiclosAdmin`,
`apiListarAtivacoesAdmin`,
`apiAlterarEstadoAtivacaoAdmin`.

Operações de atualização:

`apiAlterarEstadoDaAtivacao`.

Infraestrutura do Web App:

`doGet`,
`include`.

## Front-end

- Roteador de views: `ROTAS[nome] → {titulo, template}`; `navegar()` clona `<template>` em `#tear-view`.
- Slots `data-lista`/`data-campo` → `CARREGADORES`/`RENDERIZADORES`. `chamar()` embrulha `google.script.run` em Promise.
- Wizard de cadastro: casca única + schema `CAMPOS_PARCEIRA`; estado `WIZARD` é a fonte única; os 3 passos são sub-estado de uma rota, não rotas.

---

## Princípios Arquiteturais

- Apenas Repositories acessam SpreadsheetApp.
- Services implementam regras de negócio.
- Controllers coordenam casos de uso.
- Front-end nunca acessa planilhas diretamente.
- Toda comunicação ocorre através do Roteador.
- PROJECT_PHILOSOPHY.md governa o comportamento dos agentes.
