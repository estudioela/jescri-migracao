# SYSTEM_MAP.md — Mapa arquitetural do Projeto Tear

## Objetivo

Este documento descreve a arquitetura funcional atual do sistema.

Ele define a responsabilidade de cada área de dados e os arquivos responsáveis por sua manipulação.

Não contém histórico de alterações, correções ou decisões temporárias.

---

# Inventário de abas

| Aba | Responsabilidade |
|---|---|
| BASE DE DADOS | Cadastro mestre de influenciadoras |
| CADASTROS | Entrada bruta de novos cadastros |
| BRIEFING | Planejamento de conteúdo |
| FLUXO LOGÍSTICO | Controle de envio de produtos |
| ATIVAÇÕES | Execução operacional de campanhas |
| PAGAMENTOS | Controle financeiro |
| HISTÓRICO DE CONTEÚDOS | Arquivo de ativações concluídas |
| HISTÓRICO DE PAGAMENTOS | Arquivo financeiro |
| HISTÓRICO LOGÍSTICO | Arquivo logístico |
| Abas legado | Histórico externo identificado dinamicamente |

---

# 1. BASE DE DADOS

## Responsabilidade

Cadastro principal das influenciadoras.

É a fonte de dados cadastrais utilizada pelo ERP e Portal.

## Escrita

- `Código.js`
  - `onFormSubmit`
  - atualização de endereço
  - organização da base

- `SidebarBackend.js`
  - atualização cadastral

- `WebApp.js`
  - atualização de perfil pelo Portal

## Leitura

- `Código.js`
  - geração de ciclos
  - pagamentos
  - operações administrativas

- `SidebarBackend.js`
  - consultas administrativas

- `WebApp.js`
  - login
  - perfil
  - dados do Portal

---

# 2. CADASTROS

## Responsabilidade

Receber dados brutos provenientes do formulário externo.

## Escrita

Controlada pelo Google Forms.

## Leitura

- `Código.js:onFormSubmit`

---

# 3. BRIEFING

## Responsabilidade

Armazena o planejamento criativo das entregas.

Contém informações de conteúdo, formatos e orientações.

## Escrita

- `Código.js`
  - geração de ciclo
  - sincronização de informações

- `onEdit`
  - alterações manuais

## Leitura

- `WebApp.js`
  - carregamento do briefing no Portal

---

# 4. FLUXO LOGÍSTICO

## Responsabilidade

Controle operacional de envio e recebimento de produtos.

## Escrita

- `Código.js`

## Leitura

- operações internas do ERP

---

# 5. ATIVAÇÕES

## Responsabilidade

Representa cada entrega de conteúdo em execução.

É a unidade operacional central do sistema.

## Escrita

- `Código.js`
  - criação de ativações
  - atualização operacional
  - arquivamento

- `WebApp.js`
  - envio de materiais

## Leitura

- `WebApp.js`
  - pendências
  - histórico
  - acompanhamento

- `Código.js`
  - operações administrativas

---

# 6. PAGAMENTOS

## Responsabilidade

Controle financeiro das campanhas.

## Escrita

- `Código.js`
  - geração financeira
  - solicitações
  - arquivamento

## Leitura

- `WebApp.js`
  - consulta de pagamentos

- `Código.js`
  - operações financeiras

---

# 7. HISTÓRICO DE CONTEÚDOS

## Responsabilidade

Armazenar ativações finalizadas.

## Escrita

- `Código.js:arquivarGenerico`

## Leitura

- `WebApp.js:getHistorico`

---

# 8. HISTÓRICO DE PAGAMENTOS

## Responsabilidade

Armazenar pagamentos finalizados.

## Escrita

- `Código.js:arquivarGenerico`

## Leitura

- `WebApp.js:getHistorico`

---

# 9. HISTÓRICO LOGÍSTICO

## Responsabilidade

Armazenar operações logísticas concluídas.

## Escrita

- `Código.js:arquivarGenerico`

## Leitura

Nenhuma função identificada atualmente.

---

# 10. Abas legado

## Responsabilidade

Consultar dados históricos anteriores à consolidação.

## Escrita

Nenhuma.

## Leitura

- `WebApp.js:getHistorico`
- funções auxiliares de descoberta de histórico

---

# Referência cruzada de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `mae/Código.js` | ERP, automações, ciclos, operações administrativas |
| `mae/WebApp.js` | Backend do Portal |
| `mae/SidebarBackend.js` | Operações das interfaces administrativas |
| `mae/PortalUi.gs` | Abertura do Portal dentro da planilha |
| `mae/Index.html` | Interface do Portal |
| `mae/SchemaExporter.js` | Exportação estrutural do sistema |
| `mae/QaShadow.js` | Testes de validação isolados |

---

# Regra arquitetural

Cada conceito possui uma única fonte de verdade.

A documentação descreve responsabilidades atuais.

Histórico de mudanças pertence ao CHANGELOG.
Decisões arquiteturais pertencem ao KNOWN_DECISIONS.
Estado atual pertence ao PROJECT_STATUS.
