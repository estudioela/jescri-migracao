# ELÃ | influência

Sistema de gestão do Programa de Parcerias do **Estúdio Elã**, desenvolvido em **Google Apps Script** e **Google Sheets**.

O ELÃ | influência centraliza toda a operação do programa de influenciadoras, desde o cadastro das parceiras até a geração de documentos, acompanhamento das colaborações, logística, pagamentos e autenticação de usuários.

Todo o código-fonte é versionado neste repositório e sincronizado com o Google Apps Script através do `clasp`.

---

# Objetivo

O objetivo do ELÃ | influência é fornecer uma plataforma única para gerenciamento do ciclo operacional das parcerias comerciais do Estúdio Elã.

Entre suas principais responsabilidades estão:

- gerenciamento das parceiras;
- controle das colaborações mensais;
- distribuição de briefings;
- acompanhamento das entregas;
- controle logístico;
- gestão financeira;
- autenticação de usuários;
- geração de documentos;
- administração do Portal da Parceira.

O sistema foi projetado para manter as regras de negócio desacopladas da infraestrutura física utilizada para persistência dos dados.

---

# Principais Características

- Arquitetura em camadas baseada em DDD.
- Backend executado em Google Apps Script.
- Persistência utilizando Google Sheets.
- Autenticação via Google OAuth.
- Separação entre domínio e infraestrutura.
- Resolução dinâmica de cabeçalhos das planilhas.
- Estrutura organizada por módulos de negócio.
- Versionamento completo via Git e GitHub.
- Sincronização com Apps Script utilizando `clasp`.

---

# Visão Geral da Arquitetura

A arquitetura do sistema segue uma separação clara entre interface, aplicação, domínio e persistência.

O fluxo principal de execução é:

```text
Usuário

↓

Frontend

↓

Entrypoint

↓

Controller

↓

Service

↓

Repository

↓

ACL

↓

Google Sheets
```

Cada camada possui responsabilidade única e comunica-se apenas com a camada imediatamente inferior.

Essa organização reduz o acoplamento entre os componentes e facilita a evolução do sistema.

---

# Estrutura Geral do Projeto

O código-fonte encontra-se organizado principalmente dentro da pasta `src/`.

```text
src/
├── entrypoint/
├── modulos/
├── shared/
└── ui/

docs/    — ver "Documentação" mais abaixo para a árvore completa

test/
```

Cada módulo representa um conjunto de funcionalidades do domínio e concentra suas respectivas camadas de Controller, Service, Repository, ACL e Domain.

A documentação técnica encontra-se centralizada na pasta `docs/`.

---

# Estrutura do Repositório

O repositório está organizado por responsabilidade, separando código-fonte, documentação, testes e ferramentas de apoio.

```text
.
├── src/
│   ├── entrypoint/
│   ├── modulos/
│   ├── shared/
│   └── ui/
│
├── docs/     — ver "Documentação" mais abaixo para a árvore completa
│
├── test/
├── scripts/
├── knowledge/
└── README.md
```

## Diretórios Principais

| Diretório | Responsabilidade |
|-----------|------------------|
| `src/` | Código-fonte da aplicação |
| `src/entrypoint/` | Pontos de entrada do Apps Script |
| `src/modulos/` | Módulos de negócio organizados em arquitetura por camadas |
| `src/shared/` | Componentes compartilhados e infraestrutura |
| `src/ui/` | Interface HTML do Portal |
| `docs/` | Documentação oficial do projeto (ver árvore completa em "Documentação") |
| `test/` | Testes automatizados |
| `scripts/` | Ferramentas auxiliares utilizadas durante o desenvolvimento |

---

# Stack Tecnológica

O ELÃ | influência utiliza tecnologias nativas do ecossistema Google para reduzir complexidade operacional e facilitar a manutenção.

## Backend

- Google Apps Script
- JavaScript ES5/ES6
- HTML Service

## Persistência

- Google Sheets

## Interface

- HTML
- CSS
- JavaScript

## Controle de Versão

- Git
- GitHub
- clasp

---

# Organização Arquitetural

O sistema adota uma arquitetura em camadas, na qual cada componente possui uma responsabilidade bem definida.

```text
Frontend

↓

Entrypoint

↓

Controller

↓

Service

↓

Repository

↓

ACL

↓

Google Sheets
```

As principais responsabilidades de cada camada são:

| Camada | Responsabilidade |
|---------|------------------|
| Frontend | Interface com o usuário |
| Entrypoint | Receber chamadas externas |
| Controller | Orquestrar os casos de uso |
| Service | Executar regras de negócio |
| Repository | Abstrair a persistência |
| ACL | Traduzir o domínio para a estrutura física da planilha |
| Google Sheets | Persistência dos dados |

Essa separação reduz o acoplamento entre os componentes e facilita a evolução do sistema.

---

# Documentação

A documentação do projeto encontra-se organizada em diferentes níveis. Ver
a seção "Documentos Principais" mais abaixo para a lista completa.

## Decisões Arquiteturais

As decisões permanentes de engenharia encontram-se registradas na pasta:

```text
docs/adrs/
```

Cada ADR documenta uma decisão arquitetural relevante para a evolução do projeto.

---

# Estado Atual

O projeto encontra-se em desenvolvimento contínuo.

O acompanhamento das atividades, decisões e evolução funcional é realizado através da documentação oficial e dos ADRs do repositório.

Mudanças arquiteturais significativas devem ser registradas por meio de um novo ADR antes de serem implementadas.

---

# Primeiros Passos

## Pré-requisitos

Antes de iniciar o desenvolvimento, é necessário possuir:

- Google Apps Script
- Node.js
- npm
- `clasp` instalado globalmente
- Git
- Visual Studio Code

Também é necessário possuir acesso ao projeto Google Apps Script e à planilha oficial do Portal.

---

## Clonando o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd projeto-tear
```

---

## Instalando Dependências

Caso existam dependências do projeto:

```bash
npm install
```

---

## Login no Google Apps Script

```bash
clasp login
```

Verifique se o projeto está vinculado corretamente:

```bash
clasp status
```

---

## Enviando Alterações

Após realizar alterações no código:

```bash
clasp push
```

Para criar uma nova versão:

```bash
clasp version "Descrição da versão"
```

O processo de publicação da Web App deve seguir o fluxo operacional definido pela equipe do projeto.

---

# Desenvolvimento

## Organização do Código

Antes de implementar qualquer funcionalidade, recomenda-se compreender a arquitetura descrita em:

- `docs/architecture/ARQUITETURA_CAMADAS.md`
- `docs/domain/DOMAIN.md`
- `docs/architecture/DATA_MODEL.md`

Novas funcionalidades devem respeitar a arquitetura em camadas adotada pelo projeto.

---

## Boas Práticas

Durante o desenvolvimento, recomenda-se:

- manter a separação entre as camadas da aplicação;
- evitar acesso direto ao Google Sheets fora das ACLs;
- concentrar regras de negócio nos Services;
- utilizar os Repositories como única abstração de persistência;
- registrar decisões arquiteturais relevantes através de novos ADRs.

---

# Documentação

A documentação oficial do projeto encontra-se organizada da seguinte forma:

```text
docs/
├── adrs/         — decisões arquiteturais (nunca reabertas sem novo ADR)
├── specs/        — especificação de cada SPEC-NNN implementada
├── architecture/ — modelo de dados, persistência e contratos de camada
├── domain/       — domínio (Sistema A / GAS)
├── design/       — sistema de design e fluxos de UX (Sistema B)
├── history/      — Contrato Soberano e histórico de migração
├── deployment/   — arquitetura e runbooks de produção (Sistema B)
├── release/      — checklists e critérios de go-live
├── reports/      — auditorias e handoffs ainda ativos (não históricos)
├── planning/     — roadmaps, backlog e especificações funcionais
├── governance/   — auditorias de governança do próprio repositório
├── archive/      — relatórios e planos históricos já superados
└── _workspace/   — TASK_ROUTER.md (fonte única de estado) e checklists

knowledge/
├── README.md
├── archive/      — pesquisa de referência e artefatos de processo já consumidos
├── references/   — pesquisa técnica profunda (OAuth, sessão, identidade)
└── sistema-b/    — baseline de arquitetura/domínio do tear-v2-app
```

## Documentos Principais

| Documento | Descrição |
|-----------|-----------|
| `README.md` | Visão geral do projeto |
| `CLAUDE.md` | Contrato operacional para agentes de IA |
| `PROJECT_GOVERNANCE.md` | Governança de processo |
| `docs/_workspace/TASK_ROUTER.md` | Fonte única de estado de cada SPEC |
| `docs/PRD.md` | Requisitos de produto |
| `docs/history/CONTRATO_SOBERANO.md` | Domínio soberano (termos, VOs, agregados) |
| `docs/adrs/` | Registro das decisões arquiteturais |
| `docs/specs/` | Especificação de cada SPEC-NNN |
| `docs/deployment/` | Arquitetura e implementação de produção |
| `docs/release/` | Checklists de go-live e release readiness |
| `docs/reports/` | Auditorias e handoffs ativos |
| `docs/planning/` | Roadmaps, backlog e especificações funcionais |
| `docs/governance/` | Auditorias de governança do repositório |

---

# Contribuição

Toda alteração no projeto deve preservar os princípios arquiteturais estabelecidos.

Mudanças estruturais significativas devem ser acompanhadas da atualização da documentação correspondente e, quando aplicável, do respectivo ADR.

---

# Licença

Este repositório segue a política de licenciamento definida pelo Estúdio Elã.

Caso uma licença específica seja adotada futuramente, este documento deverá ser atualizado.

---

# Créditos

Projeto desenvolvido pelo **Estúdio Elã**.

A documentação técnica e arquitetural foi construída a partir da análise do código-fonte, dos ADRs e da engenharia reversa realizada durante o desenvolvimento do ELÃ | influência.