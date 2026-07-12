# MK 03 — Modelo Técnico: Projeto TEAR

## 1. Arquitetura do Google Apps Script

O Projeto TEAR é construído sobre o ecossistema do Google Workspace, utilizando o Google Sheets como interface de dados e o Google Apps Script como camada de lógica de negócio e automação. A arquitetura é modular, dividida em dois projetos Apps Script principais: `TEAR_APPS_SCRIPT` (o core do sistema) e `MAE_APPS_SCRIPT` (módulos auxiliares e o portal do influenciador). [2]

### 1.1. Estrutura de Módulos e Responsabilidades

A modularização do código em arquivos `.js` e `.html` busca organizar as responsabilidades, embora a natureza do Apps Script (escopo global compartilhado e ordem de carga não garantida) exija padrões de codificação específicos (ex: `function` declarations, `static get`). [2]

| Módulo / Arquivo | Projeto | Responsabilidade Principal | Descrição Detalhada |
|---|---|---|---|
| `Modelos.js` | TEAR | **Domínio e Regras de Transição** | Define as entidades de negócio (`Ativacao`, `Logistica`), suas propriedades e as máquinas de estado com transições permitidas. Contém utilitários de segurança (hash de senhas) e manipulação de datas. [2] |
| `Infra.js` | TEAR | **Configuração e Utilitários de Planilha** | Armazena constantes globais (nomes de abas, estados), funções auxiliares para leitura e escrita em planilhas (acesso por nome de cabeçalho, não por índice) e o `EventDispatcher` para comunicação interna. [2] |
| `Repositories.js` | TEAR | **Acesso e Persistência de Dados** | Abstrai a interação direta com o Google Sheets. Cada repositório (ex: `ParceiroRepository`, `AtivacaoRepository`) é responsável por operações CRUD (Criar, Ler, Atualizar, Deletar) em uma aba específica, garantindo que a lógica de negócio não precise conhecer os detalhes da planilha. [2] |
| `Services.js` | TEAR | **Lógica de Negócio de Alto Nível** | Contém a inteligência de negócio, orquestrando as operações dos repositórios e aplicando regras complexas. Exemplos incluem `AuthService` (login/logout), `ParceiroService` (cadastro/atualização de parceiros), `CicloService` (geração de ciclos mensais) e `DriveService` (automação de pastas no Drive). [2] |
| `Controllers.js` | TEAR | **Interface de API e Roteamento** | Expõe as funcionalidades dos serviços, validando payloads e roteando requisições. Cada controller (ex: `AuthController`, `AtivacaoController`) gerencia um conjunto de ações relacionadas a uma entidade de negócio. [2] |
| `Roteador.js` | TEAR | **Entrypoint HTTP e Gatilhos** | É o ponto de entrada principal para requisições HTTP (`doGet`) e gatilhos de formulário (`onFormSubmit`). Gerencia a autenticação e autorização (admin) para as APIs expostas. [2] |
| `SincronizadorTear.js` | TEAR | **Migração de Dados Legados** | Responsável pela migração inicial e contínua de dados de influenciadores da planilha `[ELÃ] PROJETO TEAR 1.0` para a `[JESCRI] INFLUÊNCIA 360º`, aplicando regras de negócio específicas para evitar duplicação. [2] |
| `WebApp.js` | MAE | **Portal do Influenciador (Backend)** | Serve o frontend do portal (`Index.html`) e expõe funções para interação com o Google Drive (upload resumível de arquivos) e com os dados das ativações, sob autenticação do influenciador. [2] |
| `Código.js` | MAE | **Utilitários e Automações Globais** | Contém funções de menu personalizado (`onOpen`), processamento de formulários, sincronização de looks, setup inicial da planilha (`setupERP`) e automações como atualização de rastreios. Define o objeto `SETUP` com configurações globais e cores. [2] |
| `SchemaExporter.js` | MAE | **Documentação de Schema** | Funções para exportar a estrutura da planilha (schema) em JSON e Markdown, e listar gatilhos instalados, auxiliando na documentação técnica. [2] |

## 2. Eventos e Gatilhos

O sistema utiliza gatilhos do Google Apps Script para automatizar a execução de funções em resposta a eventos específicos. [2]

| Gatilho / Evento | Função Associada | Descrição | Frequência / Condição |
|---|---|---|---|
| `onOpen()` | `onOpen()` (em `Código.js`) | Cria um menu personalizado na interface do Google Sheets, oferecendo acesso rápido a funcionalidades administrativas e operacionais. | Ao abrir a planilha. [2] |
| `onFormSubmit(e)` | `onFormSubmit(e)` (em `Roteador.js`) | Processa os dados de formulários do Google Forms, criando ou atualizando registros de parceiros na planilha. | Ao submeter um formulário vinculado. [2] |
| `onEdit(e)` | `onEdit(e)` (em `Código.js`) | Dispara para qualquer edição em qualquer aba da planilha. Utilizado para aplicar formatação condicional (cores ON/OFF) e outras lógicas de interface em tempo real. | A cada edição de célula. [2] |
| Gatilho de Tempo | `processarMigracaoTear()` | Migra dados de influenciadores da planilha `[ELÃ] PROJETO TEAR 1.0` para a `[JESCRI] INFLUÊNCIA 360º`. | Não explicitamente definido, mas sugerido para ser agendado periodicamente. [2] |
| Gatilho de Tempo | `atualizarRastreiosBRComerce()` | Atualiza automaticamente os status de rastreio de logística. | Não explicitamente definido, mas sugerido para ser agendado periodicamente. [2] |
| Gatilho de Tempo | `exportarSchemaAoIniciarNovoMes()` | Exporta o schema da planilha após a geração de um novo mês. | Agendado para ocorrer após `gerarNovoMesCompleto()`. [2] |

## 3. Dependências e Integrações

O Projeto TEAR depende de diversos serviços do Google e integrações com APIs externas para operar. [2]

### 3.1. Dependências Internas (Google Workspace)
*   **Google Sheets**: Base de dados primária e interface de usuário para a equipe administrativa. [1]
*   **Google Apps Script**: Ambiente de execução para toda a lógica de negócio, automações e APIs. [2]
*   **Google Drive**: Utilizado para armazenamento de arquivos de conteúdo de influenciadores e para a organização de pastas por parceiro e ciclo. [2]
*   **Google Forms**: Fonte de entrada de dados para o cadastro inicial de influenciadores. [2]
*   **CacheService**: Utilizado para gerenciar sessões de login e tentativas de autenticação, melhorando o desempenho e a segurança. [2]
*   **LockService**: Empregado em operações críticas (ex: upload de arquivos) para evitar condições de corrida e garantir a integridade dos dados em ambientes multiusuário. [2]
*   **UrlFetchApp**: Usado para fazer requisições HTTP a APIs externas, como o Google Drive API para uploads resumíveis. [2]

### 3.2. Integrações Externas
*   **ViaCEP**: API externa para enriquecimento de dados de endereço (funcionalidade planejada, mas ainda pendente de implementação no `Services.js`). [2]
*   **BRComerce**: Serviço externo para atualização automática de status de rastreio de logística (mencionado no `Código.js`). [2]
*   **Portal do Influenciador (Frontend)**: O `WebApp.js` e `Roteador.js` expõem APIs para o frontend (HTML/JavaScript) do portal, permitindo que os influenciadores interajam com o sistema. [2]

## 4. Automações Chave

As automações são a espinha dorsal do Projeto TEAR, reduzindo a carga de trabalho manual e garantindo a consistência dos processos. [2]

*   **Geração de Ciclo Mensal**: A função `gerarNovoMesCompleto()` no `Código.js` automatiza a criação de todas as linhas de `Ativações`, `Logística` e `Pagamentos` para o mês, com base nas influenciadoras ativas e seus contratos. [2]
*   **Provisionamento de Pastas no Drive**: O `DriveService` automatiza a criação de pastas raiz para parceiros (`[TEAR] {nome}`) e subpastas mensais no Google Drive, garantindo uma organização padronizada dos arquivos. [2]
*   **Upload Resumível de Arquivos**: O `WebApp.js` e o `DriveService` implementam um mecanismo de upload resumível para arquivos grandes para o Google Drive, atualizando os links na planilha de ativações. [2]
*   **Sincronização de Looks**: O `BriefingService` puxa e formata informações de looks de planilhas externas, integrando-as ao processo de briefing sem a necessidade de entrada manual. [2]
*   **Configuração Inicial do ERP**: A função `setupERP()` no `Código.js` automatiza a verificação e criação de abas operacionais e de histórico, garantindo a estrutura mínima necessária para o sistema. [2]
*   **Autenticação e Sessão**: O `AuthService` e `CacheRepository` gerenciam o login, logout e sessões dos usuários, incluindo o bloqueio de tentativas de login e a expiração de sessões. [2]

## Referências

[1] Arquivos CSV exportados das planilhas `PLANILHA ANTIGA.xlsx` e `[ELÃ] PROJETO TEAR 1.0.xlsx`.
[2] Análise do código-fonte do Google Apps Script (`TEAR_APPS_SCRIPT` e `MAE_APPS_SCRIPT`) e do documento `DIRETRIZES_DE_ENGENHARIA_PARA_O_PROJETO_TEAR.md`.
