# SYSTEM_TRUTH.md — Estado real do sistema Jescri

> Documento oficial do estado atual do sistema.
>
> Responde: "Como o sistema funciona atualmente?"
>
> Não contém histórico de alterações, investigações ou decisões antigas.

---

# 1. Visão geral

O Projeto Tear é um ERP + Portal de Influenciadoras desenvolvido em Google Apps Script.

Arquitetura atual:

- Backend executado em Google Apps Script.
- Front-end do Portal em `mae/Index.html`.
- Dados armazenados em Google Sheets.
- Arquivos armazenados em Google Drive.
- Versionamento realizado via Git.
- Deploy realizado via clasp.

O sistema possui dois contextos principais:

- ERP administrativo dentro da planilha.
- Portal utilizado pelas influenciadoras.

---

# 2. Fluxo de autenticação

Fluxo atual:
Index.html
|
| google.script.run
|
WebApp.js:login()
|
| consulta BASE DE DADOS
|
| valida credenciais
|
Sessão autenticada

Responsabilidades:

`mae/Index.html`

- Tela de login.
- Controle de sessão.
- Navegação do Portal.

`mae/WebApp.js`

- Validação de acesso.
- Criação de sessão.
- Recuperação de dados da influenciadora.

---

# 3. Fonte principal de dados

A planilha Google é a fonte operacional do sistema.

Principais abas:

| Aba | Responsabilidade |
|---|---|
| BASE DE DADOS | Cadastro principal de influenciadoras |
| CADASTROS | Entrada de novos cadastros |
| BRIEFING | Planejamento de conteúdo |
| ATIVAÇÕES | Controle das entregas |
| FLUXO LOGÍSTICO | Controle de envio |
| PAGAMENTOS | Controle financeiro |
| HISTÓRICO DE CONTEÚDOS | Arquivo de entregas concluídas |
| HISTÓRICO DE PAGAMENTOS | Arquivo financeiro |
| HISTÓRICO LOGÍSTICO | Arquivo logístico |

Detalhamento estrutural:

`SYSTEM_MAP.md`

Schema atual:

`SYSTEM_SCHEMA.md`

---

# 4. Componentes principais

## Código.js

Responsabilidade:

ERP administrativo.

Funções:

- menus;
- automações;
- geração de ciclos;
- processamento de planilhas;
- arquivamentos.

---

## WebApp.js

Responsabilidade:

Backend do Portal.

Funções:

- autenticação;
- consultas;
- atualização de perfil;
- briefing;
- pagamentos;
- histórico;
- uploads.

---

## Index.html

Responsabilidade:

Interface do Portal.

Funções:

- telas;
- navegação;
- chamadas ao backend.

---

## SidebarBackend.js

Responsabilidade:

Operações administrativas das sidebars.

---

## PortalUi.gs

Responsabilidade:

Abrir o Portal dentro da planilha.

---

## SchemaExporter.js

Responsabilidade:

Gerar representação atual do schema da planilha.

---

## QaShadow.js

Responsabilidade:

Executar validações controladas.

---

# 5. Fluxos principais

## Geração de ciclo

Responsável:

`Código.js:gerarNovoMesCompleto()`

Executa:

- criação de registros;
- preparação de briefing;
- criação de ativações;
- preparação financeira.

---

## Upload de materiais

Fluxo:

Portal

↓

WebApp.js

↓

Google Drive

↓

Atualização da ativação

---

## Arquivamento

Fluxo:

Registro concluído

↓

Aba operacional

↓

Aba histórica

Responsável:

`Código.js:arquivarGenerico()`

---

# 6. Estado atual

## Arquitetura

Consolidada.

A estrutura principal está definida e documentada.

---

## Documentação

Consolidada.

Responsabilidades:

- CLAUDE.md
  - operação de agentes IA.

- SYSTEM_MAP.md
  - arquitetura.

- SYSTEM_TRUTH.md
  - estado atual.

- PROJECT_STATUS.md
  - visão executiva.

- KNOWN_DECISIONS.md
  - decisões.

- CHANGELOG_DE_DESENVOLVIMENTO.md
  - histórico.

---

## Testes

Estruturados.

Existem:

- testes automatizados;
- QA Shadow;
- validação de schema.

---

# 7. Riscos atuais

## Dependência de configuração manual

Triggers instaláveis dependem da configuração correta no Apps Script.

---

## Ausência de staging isolado

Existe validação, porém não existe ambiente completo separado de produção.

---

## Divergência entre Git e Apps Script

Git é a fonte oficial do código.

O Apps Script possui ciclo próprio de publicação.

---

## Dependência da estrutura da planilha

Alterações em:

- nomes de abas;
- cabeçalhos;
- estrutura de dados;

podem afetar o sistema.

---

# 8. Versionamento

Estado atual:

- Código versionado no Git.
- Deploy via clasp.
- Apps Script como ambiente de execução.

Baseline:

`v1.0-stable`

---

# 9. Regra de atualização documental

Alterações devem atualizar o documento correto:

- Arquitetura:
  `SYSTEM_MAP.md`

- Estado atual:
  `SYSTEM_TRUTH.md`

- Decisões:
  `KNOWN_DECISIONS.md`

- Histórico:
  `CHANGELOG_DE_DESENVOLVIMENTO.md`

- Operação de IA:
  `CLAUDE.md`
