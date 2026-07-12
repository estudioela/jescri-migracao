# MK 04 — Reconstrução: Projeto TEAR

## 1. Visão Geral para Reconstrução

A reconstrução do Projeto TEAR deve ser guiada pela premissa de que o Google Sheets, embora funcional como protótipo e interface inicial, não é uma solução escalável ou robusta para um ERP de marketing de influência. O objetivo é migrar a lógica de negócio e os dados para uma arquitetura mais moderna e sustentável, mantendo a essência operacional e funcional do sistema atual. [2]

## 2. O que Deve Permanecer

Certos aspectos do Projeto TEAR atual demonstraram ser eficazes e devem ser preservados na reconstrução, servindo como requisitos funcionais e não funcionais. [2]

### 2.1. Regras de Negócio e Fluxos Operacionais
*   **Máquinas de Estado**: As máquinas de estado para `Ativação` e `Logística` são bem definidas e devem ser replicadas na nova arquitetura, garantindo a consistência dos fluxos de trabalho. [2]
*   **Fluxo de Geração de Mês**: A lógica de "explosão" de dados para `Ativações`, `Logística` e `Pagamentos` no início de cada ciclo mensal é um pilar operacional e deve ser mantida. [2]
*   **Autenticação e Autorização**: O conceito de `ADMIN_TOKEN` para operações administrativas e a autenticação de influenciadoras via `CUPOM` e senha devem ser preservados, com melhorias de segurança. [2]
*   **Fail-Safe em Integrações**: A filosofia de "falhar silenciosamente" para APIs externas não críticas (como `ViaCEP` ou `DriveService` para criação de pastas) deve ser mantida, mas com melhor monitoramento e *logging*. [2]

### 2.2. Semântica e Intenção da Interface
*   **Linguagem Visual das Cores**: O significado operacional das cores (ON/OFF, cabeçalhos) deve ser traduzido para a nova interface, mantendo a clareza visual para os usuários. [2]
*   **Organização Lógica de Dados**: A forma como os dados são agrupados e apresentados nas abas atuais (ex: dados mestres de influenciadores, dados de ativações) reflete uma compreensão do negócio e deve influenciar o design da nova interface. [2]

## 3. O que Deve Mudar / Desaparecer

A maioria dos aspectos relacionados à implementação atual no Google Sheets e Apps Script deve ser substituída por soluções mais adequadas. [2]

### 3.1. Infraestrutura e Persistência
*   **Google Sheets como Banco de Dados**: O uso de planilhas como base de dados primária deve desaparecer. Deve ser substituído por um **Banco de Dados Relacional** (ex: PostgreSQL, MySQL) para garantir escalabilidade, integridade referencial, desempenho e segurança. [2]
*   **Lógica de Negócio em Células**: Todas as regras de negócio embutidas em comentários, validações, fórmulas e formatações condicionais de células devem ser extraídas e migradas para a camada de aplicação. [2]
*   **Dependência da Ordem de Carga do Apps Script**: A necessidade de padrões de codificação específicos para contornar a ordem de carga do Apps Script deve desaparecer com a adoção de um ambiente de desenvolvimento modular. [2]

### 3.2. Interface e Interação
*   **Interface Administrativa no Google Sheets**: A interface de gestão para a equipe Elã deve ser substituída por um **Dashboard Administrativo** dedicado (Web App), oferecendo melhor UX, controle de acesso e funcionalidades. [2]
*   **Portal do Influenciador (HTML/JS em Apps Script)**: O portal atual deve ser reescrito como um **Frontend Moderno** (Web App ou Mobile App), desacoplado do Apps Script, para melhor desempenho, escalabilidade e experiência do usuário. [2]

### 3.3. Automação e Integração
*   **Gatilhos do Apps Script**: Os gatilhos de tempo e de eventos (`onFormSubmit`, `onEdit`) devem ser substituídos por **Cron Jobs** (para tarefas agendadas) e **Webhooks** (para eventos externos) em um ambiente de servidor. [2]
*   **`SincronizadorTear.js`**: A lógica de migração de dados deve ser integrada ao processo de *onboarding* de influenciadores no novo sistema, eliminando a necessidade de um script de sincronização separado. [2]

## 4. Dívidas Técnicas e Riscos

As dívidas técnicas e os riscos identificados na análise devem ser endereçados proativamente na fase de reconstrução. [2]

### 4.1. Dívidas Técnicas
*   **Enriquecimento de CEP Pendente**: A implementação do `ViaCepService` deve ser concluída e integrada ao processo de cadastro de influenciadores. [2]
*   **Regras de Negócio em Células**: A maior dívida técnica, que exige a extração e codificação de todas as regras de negócio em um ambiente controlável. [2]
*   **Ausência de Testes Automatizados**: A falta de testes automatizados no sistema atual é uma dívida técnica que deve ser paga com a implementação de uma suíte de testes abrangente na nova arquitetura. [2]

### 4.2. Riscos
*   **Inconsistência de Dados**: O risco de inconsistência e duplicação de dados, inerente ao uso de planilhas, deve ser mitigado com a adoção de um banco de dados relacional e validações rigorosas na camada de aplicação. [2]
*   **Dependência de APIs Externas Instáveis**: O risco de falhas em APIs externas deve ser mitigado com a implementação de mecanismos de resiliência (retries, circuit breakers) e monitoramento. [2]
*   **Segurança do `ADMIN_TOKEN`**: A gestão do `ADMIN_TOKEN` e de outras credenciais deve ser feita de forma segura, utilizando variáveis de ambiente ou um serviço de gerenciamento de segredos. [2]
*   **Escalabilidade do Google Sheets**: O risco de gargalos de desempenho e limites de dados do Google Sheets será eliminado com a migração para um banco de dados. [2]

## 5. Arquitetura Recomendada para Reconstrução

A arquitetura proposta para a reconstrução do Projeto TEAR visa um sistema modular, escalável, seguro e de fácil manutenção. [2]

### 5.1. Camadas da Nova Arquitetura
1.  **Frontend (Portal do Influenciador e Dashboard Admin)**:
    *   **Tecnologia**: Frameworks modernos (ex: React, Vue, Angular) para o Portal do Influenciador (mobile-first) e o Dashboard Administrativo. [2]
    *   **Responsabilidade**: Interface do usuário, consumo de APIs, validações de entrada, apresentação de dados. [2]
2.  **Backend (API de Negócio)**:
    *   **Tecnologia**: Linguagem de programação robusta (ex: Python com FastAPI/Django, Node.js com Express, Go) para construir uma API RESTful ou GraphQL. [2]
    *   **Responsabilidade**: Implementação de toda a lógica de negócio (extraída do Apps Script e das células), orquestração de serviços, autenticação e autorização, comunicação com o banco de dados e serviços externos. [2]
    *   **Estrutura**: Seguir o padrão de `Controllers`, `Services` e `Repositories` já estabelecido no Apps Script, mas em um ambiente de servidor. [2]
3.  **Banco de Dados**: 
    *   **Tecnologia**: Banco de dados relacional (ex: PostgreSQL, MySQL/TiDB). [2]
    *   **Responsabilidade**: Persistência de todos os dados do sistema, garantindo integridade referencial, transações ACID e escalabilidade. [2]
4.  **Serviços Externos e Integrações**:
    *   **Google Drive API**: Para gerenciamento de arquivos e pastas. [2]
    *   **APIs de Terceiros**: ViaCEP, BRComerce, e outros serviços que possam surgir. [2]
    *   **Serviço de E-mail**: Para notificações e comunicação. [2]
5.  **Automação e Agendamento**:
    *   **Tecnologia**: Cron Jobs (para tarefas agendadas, ex: geração de ciclo mensal, atualização de rastreios) e Webhooks (para eventos assíncronos, ex: submissão de formulário). [2]
    *   **Responsabilidade**: Execução de tarefas em segundo plano e resposta a eventos externos. [2]

### 5.2. Migração de Dados
*   **Estratégia**: A migração de dados das planilhas para o novo banco de dados deve ser planejada cuidadosamente, com scripts de migração que validem e transformem os dados. [2]
*   **Histórico**: Dados históricos devem ser migrados para o novo banco de dados, mantendo a capacidade de auditoria e análise. [2]

### 5.3. Segurança
*   **Autenticação e Autorização**: Implementar um sistema de autenticação robusto (ex: OAuth2, JWT) e controle de acesso baseado em papéis (RBAC). [2]
*   **Gerenciamento de Segredos**: Utilizar um serviço de gerenciamento de segredos para armazenar chaves de API e credenciais. [2]

### 5.4. Monitoramento e Logging
*   Implementar ferramentas de monitoramento de desempenho e *logging* centralizado para identificar e resolver problemas proativamente. [2]

## Referências

[1] Arquivos CSV exportados das planilhas `PLANILHA ANTIGA.xlsx` e `[ELÃ] PROJETO TEAR 1.0.xlsx`.
[2] Análise do código-fonte do Google Apps Script (`TEAR_APPS_SCRIPT` e `MAE_APPS_SCRIPT`) e do documento `DIRETRIZES_DE_ENGENHARIA_PARA_O_PROJETO_TEAR.md`.
