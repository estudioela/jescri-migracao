# Mapa de Conhecimento (MK) do Projeto TEAR

## 1. Visão Geral do Sistema

O Projeto TEAR é um sistema de gestão integrada, focado na automação de processos relacionados a influenciadores e campanhas, utilizando o Google Sheets como base de dados e o Google Apps Script para a lógica de negócio e automações. O sistema evoluiu de uma versão anterior (`PLANILHA ANTIGA`) para a versão atual (`[ELÃ] PROJETO TEAR 1.0`), buscando maior modularidade, segurança e automação. Ele integra funcionalidades de cadastro de influenciadores, gestão de ativações, logística, pagamentos e comunicação com um portal externo.

O sistema atua como um ERP (Enterprise Resource Planning) para o gerenciamento de campanhas de influência, com módulos para planejamento, financeiro, logística, cadastros e um portal de apoio para influenciadores. A arquitetura é baseada em planilhas como fonte de dados e scripts que orquestram as operações, incluindo a interação com o Google Drive para gerenciamento de arquivos e APIs externas para serviços como consulta de CEP.

## 2. Estrutura das Planilhas

A estrutura do sistema é centrada em planilhas do Google Sheets, que servem como base de dados. A evolução do projeto trouxe uma reorganização e consolidação das abas, visando uma maior clareza e separação de responsabilidades. A análise revelou a existência de uma `PLANILHA ANTIGA` e uma `[ELÃ] PROJETO TEAR 1.0` (referenciada como a nova planilha), além de CSVs que representam as abas finais da nova planilha.

### 2.1. Comparativo das Abas das Planilhas

A tabela a seguir detalha a evolução das abas entre a planilha antiga e a nova, com base nos arquivos extraídos [1].

| Funcionalidade / Domínio | Planilha Antiga (Aba/CSV) | Nova Planilha (Aba/CSV) | Observações / Evolução |
|---|---|---|---|
| **Cadastro de Influenciadores** | `CADASTROS.csv`, `BASE_DE_DADOS.csv` | `Parceiros_Influenciadoras.csv`, `Respostas_ao_formulário_1.csv` | A nova estrutura consolida o cadastro em `Parceiros_Influenciadoras`, utilizando `Respostas_ao_formulário_1` como entrada raw de formulários [1]. |
| **Ativações de Campanhas** | `ATIVAÇÕES.csv` | `Ativacoes.csv` | A aba principal de ativações foi mantida, indicando a continuidade da funcionalidade central de gestão de campanhas [1]. |
| **Briefing de Campanhas** | `BRIEFING.csv` | (Não diretamente visível como aba principal) | O `BRIEFING` parece ter sido substituído por uma lógica de `BriefingService` que puxa dados externos ou é gerado dinamicamente, não sendo mais uma aba central de dados [2]. |
| **Logística de Envios** | `FLUXO_LOGÍSTICO.csv`, `HISTÓRICO_LOGÍSTICO.csv` | `Logistica.csv` | A logística foi consolidada em uma única aba `Logistica`, com o histórico gerenciado por scripts ou outras abas de histórico [1], [2]. |
| **Pagamentos** | `PAGAMENTOS.csv`, `HISTÓRICO_DE_PAGAMENTOS.csv` | (Não diretamente visível como aba principal) | Similar ao briefing, a aba `PAGAMENTOS` pode ter sido substituída por uma lógica de `PagamentoService` que interage com `Planos_Colaboracao` e `Ativacoes`. As referências no `Código.js` indicam que as abas `PAGAMENTOS` e `HISTÓRICO_PAG` ainda são utilizadas [2]. |
| **Ciclos de Campanhas** | (Não explícito) | `Ciclos.csv` | Introdução de uma aba `Ciclos` dedicada para gerenciar campanhas, melhorando a organização e o planejamento [1]. |
| **Planos de Colaboração** | (Não explícito) | `Planos_Colaboracao.csv` | Nova aba para formalizar os planos de colaboração, adicionando robustez à negociação e acompanhamento [1]. |
| **Configurações/Automações** | `DO_NOT_DELETE_-_AutoCrat_Job_Se.csv`, `NVScriptsProperties.csv` | (Integrado via Apps Script) | As configurações de scripts e automações foram internalizadas no Apps Script, eliminando a necessidade de abas dedicadas para isso [2]. |

## 3. Responsabilidade de Cada Aba

Com base na análise dos arquivos e do código Apps Script, as principais abas da nova planilha (`[ELÃ] PROJETO TEAR 1.0`) e suas responsabilidades são:

*   **`Parceiros_Influenciadoras`**: Armazena o cadastro principal de influenciadores, incluindo dados como ID, nome, status do contrato, categoria, cupom, quantidade de entregáveis, valor total do contrato, endereço e hash da senha [1].
*   **`Respostas_ao_formulário_1`**: Atua como uma aba de entrada raw para novos cadastros ou atualizações de influenciadores, recebendo dados diretamente de um formulário [2].
*   **`Ciclos`**: Define os ciclos de campanhas, com informações como ID do ciclo, nome, data de início da logística e data de fim da operação [1].
*   **`Planos_Colaboracao`**: Contém os detalhes dos planos de colaboração, vinculando influenciadores a ciclos e especificando a quantidade de entregáveis e o valor do cachê [1].
*   **`Ativacoes`**: Gerencia as ativações de campanhas, incluindo ID da ativação, ID do ciclo, ID da influenciadora, tipo de conteúdo, estado principal, look de referência, datas e links para briefing e upload de conteúdo [1].
*   **`Logistica`**: Controla o status e os detalhes logísticos dos envios, como ID da logística, ID do ciclo, ID da influenciadora, endereço de entrega, código de rastreio, data de envio e status da logística [1].
*   **`BASE DE DADOS` (Jescri)**: Esta é a planilha de destino para a migração de dados de influenciadores, contendo informações como STATUS, INFLU_KEY, CUPOM, RAZAO_SOCIAL, EMAIL, CHAVE_PIX, CNPJ, CEP, NUMERO e COMPLEMENTO [2].

## 4. Fluxo Completo entre Abas

O fluxo de dados entre as abas é orquestrado principalmente pelos scripts do Apps Script. Um fluxo simplificado pode ser descrito da seguinte forma:

1.  **Cadastro Inicial**: Um influenciador preenche um formulário externo, cujas respostas são registradas na aba `Respostas_ao_formulário_1` [2].
2.  **Migração/Sincronização**: O script `SincronizadorTear.js` processa as novas entradas em `Respostas_ao_formulário_1` e as migra para a `BASE DE DADOS` da Jescri, criando novos registros de influenciadores [2].
3.  **Planejamento de Ciclos**: A equipe define novos `Ciclos` de campanhas, que servem como base para as ativações [1].
4.  **Definição de Planos**: `Planos_Colaboracao` são criados, associando influenciadores a ciclos específicos e definindo os termos da colaboração [1].
5.  **Criação de Ativações**: Com base nos ciclos e planos, `Ativacoes` são geradas, detalhando as tarefas e entregáveis para cada influenciador em uma campanha [1].
6.  **Gestão Logística**: Para ativações que envolvem envio de produtos, registros são criados na aba `Logistica`, acompanhando o status do envio [1].
7.  **Acompanhamento de Conteúdo**: O status do conteúdo das ativações é atualizado, e links para upload de arquivos são gerenciados, possivelmente com integração ao Google Drive [2].
8.  **Pagamentos**: Com base nas ativações concluídas e planos de colaboração, os pagamentos são processados, com registros na aba `PAGAMENTOS` (referenciada no `Código.js`) [2].

## 5. Fonte da Verdade de Cada Dado

A 
identificação da fonte da verdade para cada dado é crucial para a integridade do sistema. Com base na análise, as fontes primárias de verdade são:

*   **Dados de Influenciadores**: A aba `Parceiros_Influenciadoras` é a fonte da verdade para os dados cadastrais consolidados dos influenciadores. A aba `Respostas_ao_formulário_1` serve como uma fonte de dados brutos de entrada [1], [2].
*   **Dados de Ciclos**: A aba `Ciclos` é a fonte da verdade para a definição e status dos ciclos de campanha [1].
*   **Dados de Planos de Colaboração**: A aba `Planos_Colaboracao` é a fonte da verdade para os termos e valores acordados com os influenciadores [1].
*   **Dados de Ativações**: A aba `Ativacoes` é a fonte da verdade para o status e detalhes de cada ativação de campanha [1].
*   **Dados de Logística**: A aba `Logistica` é a fonte da verdade para o status e detalhes dos envios [1].
*   **Dados de Pagamentos**: A aba `PAGAMENTOS` (referenciada no `Código.js`) é a fonte da verdade para os registros de pagamentos [2].
*   **Lógica de Negócio**: O código do Apps Script (especialmente `Modelos.js`, `Services.js`, `Controllers.js`) é a fonte da verdade para as regras de negócio, transições de estado e automações [2].
*   **Configurações do Sistema**: O objeto `SETUP` no `Código.js` e as constantes em `Infra.js` são a fonte da verdade para configurações globais, nomes de abas e estados [2].

## 6. Regras de Negócio Encontradas

As regras de negócio explícitas são aquelas que podem ser diretamente inferidas do código do Apps Script e da estrutura das planilhas [2].

### 6.1. Regras de Migração e Sincronização

*   **Migração Seletiva**: Apenas registros de influenciadores da planilha `[ELÃ] PROJETO TEAR 1.0` que não possuem email correspondente na planilha `[JESCRI] INFLUÊNCIA 360º` são migrados. Isso garante que não haja duplicação de influenciadores já existentes na base principal [2].
*   **Status Inicial**: Novos registros migrados recebem o `STATUS` "OFF" na planilha de destino, indicando que precisam de alguma ação ou validação posterior [2].
*   **Padronização de Chave**: O campo `INFLU_KEY` é convertido para maiúsculas durante a migração, garantindo consistência na identificação dos influenciadores [2].
*   **Enriquecimento de Dados**: Existe uma regra de negócio pendente para enriquecimento de dados de endereço via CEP, que deve ser implementada no `Services.js`. Isso indica uma funcionalidade futura para automatizar a completude dos dados [2].

### 6.2. Regras de Autenticação e Sessão

*   **Segurança de Senhas**: As senhas são armazenadas como `salt$hash` (SHA-256), com um salt único para cada parceira. Esta é uma melhoria significativa em relação à V1, que armazenava o CNPJ em texto puro como senha [2].
*   **Senha Padrão**: A senha padrão para uma parceira é definida pelos 5 primeiros dígitos do CNPJ, uma regra herdada da V1 para facilitar o provisionamento inicial [2].
*   **Controle de Acesso**: O sistema registra tentativas de login e bloqueia o acesso após um número máximo de tentativas (`LOGIN_MAX_TENTATIVAS`), prevenindo ataques de força bruta [2].
*   **Sessões Temporárias**: As sessões de login possuem um tempo de vida (TTL) absoluto e um TTL de renovação, gerenciados pelo `CacheRepository`, garantindo que as sessões inativas expirem e que as ativas sejam renovadas [2].

### 6.3. Regras de Transição de Estados

*   **Máquina de Estados de Ativação**: As ativações seguem um fluxo de estados bem definido (`PLANEJAMENTO` -> `PRONTA_PARA_ENVIO` -> `AGUARDANDO_RECEBIMENTO` -> `EM_PRODUCAO` -> `AGUARDANDO_APROVACAO` -> `APROVADA` -> `AGENDADA` -> `PUBLICADA` -> `AGUARDANDO_UPLOAD_HD` -> `CONCLUIDA` -> `ELEGIVEL_PARA_PAGAMENTO` -> `ARQUIVADA`). O sistema impede transições inválidas, garantindo a consistência do fluxo de trabalho [2].
*   **Máquina de Estados de Logística**: Os itens de logística seguem um fluxo de estados (`PENDENTE` -> `AGUARDANDO_ENVIO` -> `ENVIADO` -> `ENTREGUE` -> `CANCELADO`). Similar às ativações, transições inválidas são bloqueadas [2].
*   **Cancelamento Universal**: O estado `CANCELADO` na logística é um estado terminal e pode ser alcançado de qualquer estado ativo, permitindo flexibilidade na gestão de problemas logísticos [2].

### 6.4. Regras de Estrutura de Planilha e Acesso a Dados

*   **Acesso Abstrato a Dados**: O acesso aos dados das planilhas é feito por nome de cabeçalho, não por índice. Isso torna o sistema robusto a mudanças na ordem das colunas, um problema comum em planilhas [2].
*   **Nomes de Abas Centralizados**: Os nomes das abas são definidos em constantes (`PLANILHAS` em `Infra.js`), garantindo consistência e facilitando a manutenção do código [2].
*   **Cores com Significado**: As cores utilizadas nas planilhas (verde para ON, vermelho para OFF, cores de cabeçalho) não são meramente estéticas, mas indicam o status operacional ou tipo de dado, conforme definido em `SETUP.CORES` no `Código.js` [2].
*   **Setup Automatizado**: A função `setupERP()` em `Código.js` automatiza a configuração inicial do ERP, verificando e criando abas operacionais e de histórico, e garantindo a existência de colunas específicas (`ID`, `ANO_REFERENCIA`) [2].

### 6.5. Regras de Automação e Integração

*   **Estrutura de Pastas no Drive**: O `DriveService` automatiza a criação de pastas raiz para parceiros (`[TEAR] {nome}`) e subpastas para ciclos mensais no Google Drive, com lógica fail-safe para lidar com erros [2].
*   **Upload de Arquivos Resumível**: O sistema suporta upload de arquivos grandes para o Google Drive usando a funcionalidade de upload resumível, atualizando os links na planilha de ativações após a conclusão [2].
*   **Processamento de Formulários**: O gatilho `onFormSubmit` processa envios de formulários do Google Forms, criando ou atualizando registros de parceiros na planilha [2].
*   **Menu Personalizado**: A função `onOpen()` cria um menu personalizado no Google Sheets, oferecendo acesso rápido a diversas funcionalidades do ERP, como planejamento mensal, financeiro, logística e cadastros [2].
*   **Sincronização de Looks**: O `BriefingService` puxa e formata informações de looks de planilhas externas, integrando-as ao processo de briefing [2].

## 7. Regras Implícitas

As regras implícitas são aquelas inferidas a partir da observação da estrutura, nomenclatura e fluxo, mesmo que não explicitamente declaradas como regras de negócio no código [2].

*   **Linguagem Visual de Cores**: A utilização consistente de cores (ex: verde para ativo, vermelho para inativo) sugere uma linguagem visual para o usuário da planilha, indicando estados ou categorias de forma intuitiva. O significado operacional de cada cor precisa ser documentado [2].
*   **Sequência de Colunas e Abas**: A ordem das colunas e abas pode indicar um fluxo operacional ou uma hierarquia de dados. Por exemplo, a sequência de colunas em `Parceiros_Influenciadoras.csv` (`ID_Influenciadora`, `Nome`, `Status_Contrato`, etc.) sugere a prioridade e o agrupamento de informações para o processo de cadastro [1].
*   **Nomenclatura Consistente**: A padronização de nomes (ex: `ID_Influenciadora`, `ID_Ciclo`, `INFLU_KEY`) sugere a existência de chaves primárias e relacionamentos entre as entidades, facilitando a compreensão do modelo de dados [2].
*   **Comentários de Células como Regras**: A instrução original enfatiza que "Muitas regras do sistema foram escritas diretamente nas células" através de comentários, validações, fórmulas e formatações condicionais. Isso implica que esses elementos são fontes primárias de regras de negócio e devem ser analisados e documentados cuidadosamente [2].
*   **Dependência de Dados de Formulário**: A presença da aba `Respostas_ao_formulário_1.csv` na nova planilha e a função `onFormSubmit` no `Roteador.js` indicam que o cadastro de novos influenciadores ou a atualização de dados pode ser iniciado a partir de um formulário externo, que alimenta a planilha [1], [2].
*   **Separação de Responsabilidades por Camadas**: A modularização do código em `Repositories` (acesso a dados), `Services` (lógica de negócio), `Controllers` (interface de API) e `Roteador` (ponto de entrada) implica uma regra implícita de separação de responsabilidades, onde cada camada tem um papel bem definido e coeso [2].
*   **Manutenção de Histórico**: A existência de abas como `HISTÓRICO_DE_CONTEÚDOS` e `HISTÓRICO_DE_PAGAMENTOS` (mencionadas no `Código.js`) e a lógica de arquivamento (`menuArquivarTudo`) sugerem uma regra de negócio de manutenção de histórico para auditoria, rastreabilidade e análise de dados passados [2].

## 8. Fluxos Operacionais

Os fluxos operacionais descrevem a sequência de ações e interações dentro do sistema para atingir um objetivo de negócio. Eles são inferidos da combinação da estrutura das planilhas e da lógica do Apps Script.

### 8.1. Fluxo de Cadastro e Onboarding de Influenciadores

1.  **Preenchimento do Formulário**: Um potencial influenciador preenche um formulário online (externo ao Google Sheets). [2]
2.  **Registro de Respostas**: As respostas do formulário são automaticamente registradas na aba `Respostas_ao_formulário_1` da planilha `[ELÃ] PROJETO TEAR 1.0`. [1]
3.  **Migração para Base Principal**: O script `SincronizadorTear.js` é executado (provavelmente via gatilho `onFormSubmit` ou agendamento), verificando novos registros em `Respostas_ao_formulário_1`. [2]
4.  **Criação/Atualização de Parceiro**: Se o email do influenciador não existir na `BASE DE DADOS` da Jescri, um novo registro é criado na aba `Parceiros_Influenciadoras` com os dados do formulário. [1], [2]
5.  **Enriquecimento de Endereço (Pendente)**: O `Services.js` deve ser responsável por enriquecer os dados de endereço via ViaCEP, completando informações como rua, bairro, etc. [2]
6.  **Criação de Pasta no Drive**: O `DriveService` cria uma pasta raiz no Google Drive para o novo influenciador (`[TEAR] {nome do influenciador}`). [2]

### 8.2. Fluxo de Gestão de Campanhas (Ciclos e Ativações)

1.  **Criação de Ciclo**: Um administrador cria um novo ciclo de campanha na aba `Ciclos`, definindo seu período. [1]
2.  **Geração de Subpastas no Drive**: O `CicloService` (via `apiGerarCicloMensal` no `Roteador.js`) cria subpastas mensais para cada parceiro dentro de suas pastas raiz no Google Drive. [2]
3.  **Definição de Planos de Colaboração**: Planos são criados na aba `Planos_Colaboracao`, associando influenciadores a ciclos e definindo os entregáveis e valores. [1]
4.  **Criação de Ativações**: Com base nos planos, ativações são geradas na aba `Ativacoes`, detalhando as tarefas específicas para cada influenciador dentro do ciclo. [1]
5.  **Acompanhamento de Status**: O status de cada ativação é atualizado na aba `Ativacoes`, seguindo a máquina de estados definida em `Modelos.js`. [1], [2]
6.  **Upload de Conteúdo**: Influenciadores podem fazer upload de conteúdo para o Google Drive através do portal, e os links são registrados na aba `Ativacoes`. [2]
7.  **Aprovação de Conteúdo**: O status do conteúdo é atualizado para `APROVADA` ou `EM_AJUSTES` após revisão humana. [2]

### 8.3. Fluxo de Logística

1.  **Registro de Envio**: Quando uma ativação requer envio de produtos, um registro é criado na aba `Logistica`. [1]
2.  **Atualização de Status**: O status da logística é atualizado (`PENDENTE`, `AGUARDANDO_ENVIO`, `ENVIADO`, `ENTREGUE`, `CANCELADO`) na aba `Logistica`, seguindo a máquina de estados. [1], [2]
3.  **Atualização de Rastreio**: O sistema pode integrar com serviços de rastreio (ex: BRComerce via `Código.js`) para atualizar automaticamente os códigos de rastreio e status. [2]

### 8.4. Fluxo de Pagamentos

1.  **Ativação Concluída**: Uma ativação atinge o estado `CONCLUIDA` ou `ELEGIVEL_PARA_PAGAMENTO`. [2]
2.  **Cálculo de Pagamento**: O `PagamentoService` calcula o valor devido com base nos `Planos_Colaboracao` e `Ativacoes` concluídas. [2]
3.  **Registro de Pagamento**: Um registro de pagamento é criado ou atualizado na aba `PAGAMENTOS`. [2]
4.  **Atualização de Status**: O status do pagamento é atualizado (`em aberto`, `pago`, etc.). [2]

## 9. Eventos Automáticos

Os eventos automáticos são gatilhos ou funções que são executadas sem intervenção manual direta, geralmente em resposta a uma ação ou em um agendamento [2].

*   **`onOpen()`**: Executado ao abrir a planilha, cria o menu personalizado do ERP. [2]
*   **`onFormSubmit(e)`**: Gatilho que é executado quando um formulário do Google Forms é enviado. Ele processa os dados do formulário para criar ou atualizar registros de parceiros na planilha. [2]
*   **`processarMigracaoTear()`**: Função no `SincronizadorTear.js` que migra dados de influenciadores de uma planilha para outra. Embora não explicitamente definido como um gatilho automático no código fornecido, sua natureza sugere que pode ser executado por um gatilho `onFormSubmit` ou por um gatilho de tempo. [2]
*   **`atualizarRastreiosBRComerce()`**: Função no `Código.js` que atualiza rastreios automaticamente, provavelmente acionada por um gatilho de tempo. [2]
*   **`setupERP()`**: Função no `Código.js` que configura a estrutura inicial da planilha, verificando e criando abas de histórico faltantes. Pode ser acionada manualmente ou como parte de um processo de inicialização. [2]
*   **`exportarSchemaCompleto()` / `instalarTriggersSchemaExporter()`**: Funções no `SchemaExporter.js` e `Código.js` para exportar o schema da planilha e instalar gatilhos relacionados, sugerindo automação na documentação do schema. [2]

## 10. Dependências

As dependências do sistema podem ser categorizadas em internas (entre módulos do Apps Script) e externas (serviços do Google ou APIs de terceiros) [2].

### 10.1. Dependências Internas (Apps Script Modules)

*   **`SincronizadorTear.js`**: Depende de `SpreadsheetApp` e `Logger`. [2]
*   **`Modelos.js`**: Depende de `Utilities` (para hash e UUID). [2]
*   **`Infra.js`**: Depende de `SpreadsheetApp`. [2]
*   **`Repositories.js`**: Depende de `SpreadsheetApp`, `CacheService`, `Utilities`, e funções de `Infra.js` (`lerAbaComCabecalho`, `indiceDaColuna`, `linhaParaObjeto`, `linhasComChave`). [2]
*   **`Services.js`**: Depende de `Repositories.js`, `Infra.js` (`EventDispatcher`, `PLANILHAS`, `ESTADOS_ATIVACAO`, `ESTADOS_LOGISTICA`), `Modelos.js` (`Ativacao`, `Logistica`, funções de senha), e serviços do Google (`DriveApp`, `CacheService`, `UrlFetchApp`). [2]
*   **`Controllers.js`**: Depende de `Services.js`, `Infra.js` (`EventDispatcher`), `Modelos.js` (`Ativacao`, `Logistica`). [2]
*   **`Roteador.js`**: Depende de `Controllers.js`, `Services.js`, `Repositories.js`, e serviços do Google (`HtmlService`, `SpreadsheetApp`, `ScriptApp`). [2]
*   **`WebApp.js` (MAE_APPS_SCRIPT)**: Depende de `HtmlService`, `SpreadsheetApp`, `DriveApp`, `UrlFetchApp`, `LockService`, `Infra.js` (`PLANILHAS`), `Repositories.js` (`CacheRepository`), `Modelos.js` (`Ativacao`). [2]
*   **`Código.js` (MAE_APPS_SCRIPT)**: Depende de `SpreadsheetApp`, `HtmlService`, `DriveApp`, `Infra.js` (`SETUP.ABAS`, `SETUP.CORES`). [2]

### 10.2. Dependências Externas

*   **Google Sheets**: Base de dados principal para todas as informações do sistema. [1]
*   **Google Apps Script**: Ambiente de execução para toda a lógica de negócio e automações. [2]
*   **Google Drive**: Utilizado para armazenamento de arquivos de conteúdo de influenciadores e para a estrutura de pastas. [2]
*   **Google Forms**: Utilizado como fonte de entrada de dados para o cadastro de influenciadores. [2]
*   **ViaCEP**: API externa mencionada para enriquecimento de dados de endereço (pendente de implementação). [2]
*   **BRComerce**: Serviço externo para atualização automática de rastreios (mencionado no `Código.js`). [2]

## 11. Integrações

As integrações são os pontos onde o sistema interage com outros sistemas ou serviços, tanto internos quanto externos [2].

*   **Google Sheets API**: O Apps Script interage extensivamente com a API do Google Sheets para ler, escrever e manipular dados nas planilhas. [2]
*   **Google Drive API**: Utilizado para criar pastas, fazer upload de arquivos e gerenciar permissões de acesso aos conteúdos dos influenciadores. [2]
*   **Google Forms**: Integração para receber dados de formulários e processá-los no sistema. [2]
*   **ViaCEP**: Integração planejada para enriquecer dados de endereço. [2]
*   **BRComerce**: Integração para automatizar a atualização de status de rastreio de logística. [2]
*   **Portal do Influenciador (Frontend)**: O `WebApp.js` e `Roteador.js` expõem APIs para o frontend (HTML/JavaScript) do portal, permitindo que os influenciadores façam login, visualizem suas ativações, logística e planos, e façam upload de arquivos. [2]

## 12. Estrutura do Apps Script

A estrutura do Apps Script é modular, organizada em diferentes arquivos `.js` e `.html`, cada um com uma responsabilidade específica. Essa modularidade visa facilitar a manutenção e a compreensão do código [2].

### 12.1. Módulos Principais (TEAR_APPS_SCRIPT)

*   **`SincronizadorTear.js`**: Lógica de migração e sincronização de dados entre planilhas. [2]
*   **`Modelos.js`**: Definição de classes de domínio (Ativacao, Logistica), máquinas de estado e funções utilitárias de segurança (senhas) e data. [2]
*   **`Infra.js`**: Constantes globais (nomes de abas, estados), funções utilitárias para interação com planilhas e `EventDispatcher`. [2]
*   **`Repositories.js`**: Camada de abstração para acesso a dados das planilhas (Parceiro, Ciclo, Ativacao, Plano, Pagamento, Briefing, Cache, Logistica). [2]
*   **`Services.js`**: Lógica de negócio de alto nível, orquestrando repositórios e aplicando regras complexas (Auth, Parceiro, Ciclo, Ativacao, Pagamento, Briefing, Drive, ViaCep). [2]
*   **`Controllers.js`**: Camada de interface que expõe as funcionalidades dos serviços, validando payloads e roteando requisições. [2]
*   **`Roteador.js`**: Ponto de entrada principal para APIs e requisições HTTP, gerenciando autenticação e autorização (admin). Contém o gatilho `onFormSubmit`. [2]
*   **`Index.html`, `Styles.html`, `Templates.html`**: Componentes da interface do usuário (frontend) do portal. [2]
*   **`DevTools.js`**: Provavelmente contém ferramentas de desenvolvimento ou depuração. [2]
*   **`appsscript.json`**: Arquivo de manifesto do projeto Apps Script, definindo permissões e configurações. [2]

### 12.2. Módulos Adicionais (MAE_APPS_SCRIPT)

*   **`WebApp.js`**: Ponto de entrada para a aplicação web principal, servindo o `Index.html` e expondo funções para interação com o frontend, incluindo upload de arquivos para o Drive. [2]
*   **`Código.js`**: Funções utilitárias e lógicas de automação para o ERP Influência 360º, incluindo menu personalizado, processamento de formulários, sincronização de looks e setup inicial da planilha. [2]
*   **`PortalUi.js`**: Integração da UI do portal com o Apps Script server-side, permitindo abrir o portal em um modal. [2]
*   **`SchemaExporter.js`**: Funções para exportar o schema da planilha em JSON e Markdown, e listar triggers instalados. [2]
*   **`Index.html`, `styles_core.html`, `styles_theme.html`, `Sidebar.html`, `SidebarPagamento.html`**: Componentes da interface do usuário (frontend) do portal e das sidebars. [2]

## 13. Fluxo entre Funções

O fluxo de execução entre as funções do Apps Script segue um padrão de camadas:

1.  **Entrada (Roteador/WebApp/Gatilhos)**: As requisições externas (HTTP `doGet`, chamadas de API, `onFormSubmit`, `onOpen`) chegam ao `Roteador.js` ou `WebApp.js` ou são acionadas por gatilhos. [2]
2.  **Controladores**: O `Roteador.js` ou `WebApp.js` instanciam e chamam os `Controllers.js` apropriados (Auth, Ativacao, Logistica, Parceiro), passando o payload da requisição. [2]
3.  **Serviços**: Os `Controllers.js` delegam a lógica de negócio aos `Services.js` correspondentes, que contêm a inteligência de negócio e orquestram as operações. [2]
4.  **Repositórios**: Os `Services.js` interagem com os `Repositories.js` para acessar e persistir dados nas planilhas. [2]
5.  **Infraestrutura/Modelos**: Os `Repositories.js` e `Services.js` utilizam funções utilitárias de `Infra.js` (acesso a abas, colunas) e classes de `Modelos.js` (entidades, máquinas de estado, funções de segurança). [2]
6.  **Serviços do Google/APIs Externas**: Os `Services.js` e `Repositories.js` interagem diretamente com os serviços nativos do Google Apps Script (`SpreadsheetApp`, `DriveApp`, `CacheService`, `UrlFetchApp`) e, quando necessário, com APIs externas (ViaCEP, BRComerce). [2]

## 14. Arquivos Responsáveis por Cada Domínio

Para cada domínio de negócio, há um conjunto principal de arquivos responsáveis por sua lógica e persistência [2].

| Domínio de Negócio | Arquivos Principais | Descrição |
|---|---|---|
| **Influenciadores/Parceiros** | `ParceiroRepository.js`, `ParceiroService.js`, `ParceiroController.js`, `SincronizadorTear.js`, `onFormSubmit` (em `Roteador.js`), `Parceiros_Influenciadoras` (aba) | Gerenciamento de cadastro, dados e migração de influenciadores. |
| **Ciclos de Campanhas** | `CicloRepository.js`, `CicloService.js`, `CicloController.js`, `Ciclos` (aba) | Criação, listagem e gestão de ciclos de campanhas. |
| **Planos de Colaboração** | `PlanoRepository.js`, `Planos_Colaboracao` (aba) | Definição e gestão dos termos de colaboração com influenciadores. |
| **Ativações de Campanhas** | `AtivacaoRepository.js`, `AtivacaoService.js`, `AtivacaoController.js`, `Ativacao` (classe em `Modelos.js`), `Ativacoes` (aba) | Criação, acompanhamento de status e gestão de entregáveis das ativações. |
| **Logística** | `LogisticaRepository.js`, `LogisticaService.js`, `LogisticaController.js`, `Logistica` (classe em `Modelos.js`), `Logistica` (aba) | Gerenciamento de envios, rastreio e status logístico. |
| **Pagamentos** | `PagamentoRepository.js`, `PagamentoService.js`, `PagamentoController.js`, `PAGAMENTOS` (aba, referenciada em `Código.js`) | Cálculo, registro e gestão de pagamentos a influenciadores. |
| **Autenticação/Sessão** | `AuthService.js`, `AuthController.js`, `CacheRepository.js`, funções de senha em `Modelos.js` | Login, logout, gerenciamento de sessões e segurança de senhas. |
| **Interface do Usuário (Portal)** | `Index.html`, `Styles.html`, `Templates.html` (TEAR), `WebApp.js`, `Index.html`, `styles_core.html`, `styles_theme.html`, `Sidebar.html`, `SidebarPagamento.html` (MAE) | Componentes frontend e lógica de interação com o portal e sidebars. |
| **Utilitários/Infraestrutura** | `Infra.js`, `Código.js` (MAE), `DevTools.js`, `SchemaExporter.js` | Funções de apoio, constantes globais, setup inicial, ferramentas de desenvolvimento e exportação de schema. |

## 15. Problemas Encontrados

Durante a análise, foram identificados diversos problemas e pontos de atenção que representam riscos ou desafios para a manutenção e evolução do sistema [2].

### 15.1. Dependência de APIs Instáveis / Externas

*   **Onde ocorre**: `Services.js` (menciona `ViaCepService`), `WebApp.js` (integração com Google Drive API para upload resumível), `Código.js` (integração com BRComerce). [2]
*   **Impacto**: Falhas ou indisponibilidade dessas APIs podem interromper processos críticos como cadastro de endereços, upload de arquivos e sincronização de dados de rastreio. [2]
*   **Risco**: Médio a Alto, dependendo da criticidade da API. [2]
*   **Frequência**: Variável, dependendo da estabilidade da API externa. [2]
*   **Gravidade**: Média a Alta. [2]
*   **Possível Direção de Melhoria**: Implementar mecanismos de resiliência como *retry mechanisms* com *backoff exponencial*, *circuit breakers*, *caching* de respostas de APIs estáveis (ex: dados de CEP), e monitoramento proativo da saúde das APIs externas. Considerar alternativas ou *fallback* para APIs críticas. [2]

### 15.2. Enriquecimento de CEP Pendente

*   **Onde ocorre**: Comentário no `SincronizadorTear.js` na linha de `RUA`. [2]
*   **Impacto**: Dados de endereço incompletos ou inconsistentes na planilha `[JESCRI] INFLUÊNCIA 360º`, exigindo correção manual ou impactando processos logísticos. [2]
*   **Risco**: Médio. [2]
*   **Frequência**: Alta, para cada novo registro migrado ou cadastrado. [2]
*   **Gravidade**: Média. [2]
*   **Possível Direção de Melhoria**: Priorizar a implementação do `ViaCepService` no `Services.js` e integrá-lo ao processo de migração/cadastro para automatizar o preenchimento de endereços. [2]

### 15.3. Duplicação de Dados / Múltiplas Fontes de Verdade

*   **Onde ocorre**: Transição da `PLANILHA ANTIGA` para a `[ELÃ] PROJETO TEAR 1.0` (ex: `CADASTROS.csv` e `BASE_DE_DADOS.csv` na antiga vs. `Parceiros_Influenciadoras.csv` na nova). O `SincronizadorTear.js` migra dados de uma planilha para outra, o que pode gerar duplicação se não houver um controle rigoroso. [1], [2]
*   **Impacto**: Inconsistência de dados, dificuldade em determinar a "fonte da verdade" para uma informação, erros em relatórios e processos dependentes. [2]
*   **Risco**: Alto. [2]
*   **Frequência**: Contínua, se a migração não for idempotente ou se houver entradas manuais em ambas as fontes. [2]
*   **Gravidade**: Alta. [2]
*   **Possível Direção de Melhoria**: Definir uma única fonte de verdade para cada tipo de dado. Se a migração é um processo contínuo, garantir que seja idempotente e que a planilha de origem seja tratada como um *staging area*, não como uma fonte primária após a migração. Implementar validações para evitar entradas duplicadas. [2]

### 15.4. Regras Espalhadas / Lógica de Negócio em Células

*   **Onde ocorre**: Instrução original menciona "Muitas regras do sistema foram escritas diretamente nas células" (comentários, validações, fórmulas, formatações condicionais). [2]
*   **Impacto**: Dificuldade de manutenção, risco de erros humanos ao modificar a planilha, dificuldade de auditoria e de replicação da lógica em um novo sistema. [2]
*   **Risco**: Alto. [2]
*   **Frequência**: Contínua, pois a lógica está embutida na planilha. [2]
*   **Gravidade**: Alta. [2]
*   **Possível Direção de Melhoria**: Extrair todas as regras de negócio das células e documentá-las formalmente. Migrar a lógica para o Apps Script (`Services` ou `Modelos`) sempre que possível, tornando-a versionável, testável e mais robusta. [2]

### 15.5. Automações Frágeis / Dependência de Ordem de Carga do Apps Script

*   **Onde ocorre**: `Modelos.js` e `Infra.js` mencionam explicitamente a não garantia da ordem de carga dos arquivos no Apps Script, usando `function` declarations e `static get` para mitigar isso. [2]
*   **Impacto**: Comportamento imprevisível do sistema, erros em tempo de execução que são difíceis de depurar. [2]
*   **Risco**: Médio. [2]
*   **Frequência**: Potencialmente a cada *deploy* ou modificação de script. [2]
*   **Gravidade**: Média a Alta. [2]
*   **Possível Direção de Melhoria**: Manter a prática atual de usar `function` declarations e `static get` para mitigar o problema. Idealmente, refatorar para um sistema de módulos mais robusto se o Apps Script permitir ou considerar uma migração para uma plataforma que ofereça controle explícito sobre a ordem de execução/dependências. [2]

### 15.6. Gerenciamento de Locks em Operações Críticas

*   **Onde ocorre**: `WebApp.js` utiliza `LockService.getScriptLock().waitLock(10000)` para operações como `finalizarEnvioResumable`. [2]
*   **Impacto**: Se o *lock* não for liberado corretamente (ex: erro inesperado), outras execuções podem ficar presas, resultando em gargalos ou falhas de processamento. O *timeout* de 10 segundos pode não ser suficiente em casos de alta concorrência. [2]
*   **Risco**: Médio. [2]
*   **Frequência**: Baixa, mas com potencial de impacto significativo. [2]
*   **Gravidade**: Média. [2]
*   **Possível Direção de Melhoria**: Revisar a lógica de *locks* para garantir que sejam sempre liberados. Considerar mecanismos de fila ou processamento assíncrono para operações que podem ser concorrentes, reduzindo a necessidade de *locks* de script. Monitorar logs para identificar *locks* persistentes. [2]

## 16. Dívidas Técnicas

As dívidas técnicas são escolhas de design ou implementação que, embora possam ter acelerado o desenvolvimento no curto prazo, criam custos adicionais no futuro. Algumas foram explicitamente mencionadas ou inferidas [2].

*   **Enriquecimento de CEP Pendente**: A falta de implementação do `ViaCepService` no `SincronizadorTear.js` é uma dívida técnica que resulta em dados de endereço incompletos. [2]
*   **Regras de Negócio em Células**: A prática de manter regras de negócio em comentários, validações e fórmulas de células é uma dívida técnica significativa, dificultando a manutenção e a evolução do sistema. [2]
*   **Dependência da Ordem de Carga do Apps Script**: Embora mitigada com `function` declarations e `static get`, a dependência inerente à ordem de carga do Apps Script é uma dívida técnica que limita a modularidade e a robustez do sistema. [2]
*   **Ausência de `ID` e `ANO_REFERENCIA` em Versões Anteriores**: O `Código.js` menciona a adição de `ID` (UUID estável) e `ANO_REFERENCIA` para corrigir problemas de corrida e distinção de campanhas, indicando que a ausência anterior era uma dívida técnica. [2]
*   **Ausência de Justificativa para Exclusão de Testes**: A diretriz de engenharia menciona que "Uma exclusão sem explicação é dívida técnica invisível", indicando que a falta de documentação para exclusões de testes é uma dívida técnica. [2]

## 17. Pontos de Atenção

São aspectos que merecem observação e consideração especial para garantir a saúde e a evolução do projeto [2].

*   **Padronização Futura**: As diretrizes de padronização (nomes de abas em caixa alta, cabeçalhos em caixa alta, nomenclatura consistente, única fonte de verdade) devem ser rigorosamente aplicadas durante a reconstrução do sistema para evitar inconsistências. [2]
*   **Linguagem Visual das Cores**: O significado operacional das cores nas planilhas precisa ser formalmente documentado para garantir que todos os usuários e desenvolvedores compreendam seu propósito. [2]
*   **Validação Humana**: A instrução original menciona "Itens que precisam de validação humana". É crucial identificar e documentar quais etapas do fluxo de trabalho exigem intervenção e validação manual, e se há oportunidades para automatização ou semi-automatização. [2]
*   **Escalabilidade do Google Sheets**: Embora o Google Sheets seja flexível, ele possui limites de linhas, colunas e desempenho. À medida que o Projeto TEAR cresce, a escalabilidade da planilha pode se tornar um gargalo, especialmente com a complexidade das automações. [2]
*   **Segurança do `ADMIN_TOKEN`**: O `ADMIN_TOKEN` usado no `Roteador.js` para funções administrativas é um ponto crítico de segurança. Sua gestão e proteção são fundamentais para evitar acessos não autorizados. [2]

## 18. Inconsistências

As inconsistências são divergências ou contradições que podem levar a erros ou comportamentos inesperados [2].

*   **Nomes de Abas entre `PLANILHAS` e `SETUP.ABAS`**: Embora `Infra.js` defina `PLANILHAS` e `Código.js` defina `SETUP.ABAS`, há uma sobreposição e potencial para inconsistência se não forem mantidos sincronizados. Por exemplo, `CADASTROS` é referenciado em ambos. [2]
*   **`BRIEFING` como Aba vs. `BriefingService`**: A `PLANILHA ANTIGA` tinha uma aba `BRIEFING.csv`, mas na nova estrutura, o `BriefingService` parece puxar dados externos. A ausência de uma aba `BRIEFING` explícita na nova planilha, enquanto o `Código.js` ainda referencia `SETUP.ABAS.BRIEFING`, pode gerar confusão. [1], [2]
*   **`PAGAMENTOS` como Aba vs. `PagamentoService`**: Similar ao briefing, a aba `PAGAMENTOS` não é diretamente visível nos CSVs da nova planilha, mas é referenciada no `Código.js` e no `PagamentoService`. Isso sugere que a aba existe, mas talvez não seja uma fonte de dados primária para todos os processos, ou sua função mudou. [1], [2]
*   **Enriquecimento de CEP**: A menção de que o enriquecimento de CEP está "pendente no `Services.js`" no `SincronizadorTear.js` indica uma inconsistência entre a funcionalidade desejada e a implementada. [2]

## 19. Itens que Precisam de Validação Humana

Com base nas instruções e na análise, os seguintes itens exigem validação humana [2]:

*   **Significado Operacional das Cores**: A interpretação e o significado exato das cores utilizadas nas planilhas (células, cabeçalhos, status, preenchimentos, destaques, bordas, agrupamentos visuais) precisam ser validados por um especialista de negócio. [2]
*   **Regras de Negócio em Comentários de Células**: Todas as regras de negócio encontradas em comentários de células, validações, fórmulas e formatações condicionais precisam ser revisadas e confirmadas por um especialista. [2]
*   **Dúvidas Registradas**: Qualquer dúvida explícita registrada durante a análise (ex: sobre funcionalidades, fluxo, ou dados) precisa ser validada e esclarecida por um humano. [2]
*   **Funcionalidades Parcialmente Implementadas/Quebradas/Não Utilizadas**: A identificação de código morto, legado, funcionalidades parcialmente implementadas, quebradas ou nunca utilizadas no Apps Script precisa ser validada para determinar seu status e se devem ser mantidas, removidas ou corrigidas. [2]
*   **Inconsistências de Dados**: Quaisquer inconsistências de dados ou de fluxo identificadas entre as planilhas ou no código precisam ser validadas para entender sua origem e impacto. [2]
*   **Padrões Repetidos e Linguagem Visual Implícita**: A identificação de padrões repetidos e de uma linguagem visual implícita nas planilhas precisa ser validada para confirmar sua existência e significado. [2]

## 20. Conclusão Arquitetural

O Projeto TEAR, em sua versão atual, representa um sistema em transição, com uma base funcional sólida construída sobre o Google Sheets e Apps Script. A arquitetura demonstra um esforço claro em modularizar o código, separar responsabilidades e automatizar processos, o que é fundamental para sua sustentabilidade.

**Pontos Fortes:**

*   **Modularidade do Código**: A divisão em `Repositories`, `Services`, `Controllers` e `Roteador` é um avanço significativo para a organização e manutenção do código. [2]
*   **Segurança Aprimorada**: A implementação de hash de senhas com salt é uma melhoria crucial na segurança em relação à versão anterior. [2]
*   **Automação de Processos**: Diversas automações, como a criação de pastas no Drive, upload de arquivos e processamento de formulários, contribuem para a eficiência operacional. [2]
*   **Máquinas de Estado**: A definição de máquinas de estado para `Ativacao` e `Logistica` garante a consistência e a validação dos fluxos de trabalho. [2]
*   **Robustez a Mudanças Estruturais**: O acesso a dados por nome de coluna, em vez de índice, torna o sistema mais resiliente a alterações na estrutura das planilhas. [2]

**Pontos Fracos e Desafios:**

*   **Dependência de Planilhas como Banco de Dados**: Embora funcional, o uso de planilhas como base de dados principal impõe limitações de escalabilidade, desempenho e integridade referencial, especialmente para um sistema que se propõe a ser um ERP. [2]
*   **Regras de Negócio Espalhadas**: A persistência de regras de negócio em células da planilha (comentários, fórmulas) é um risco significativo para a manutenção, auditoria e evolução do sistema. [2]
*   **Gerenciamento de Dependências Externas**: A dependência de APIs externas (ViaCEP, BRComerce) e a forma como falhas são tratadas (fail-safe) precisam ser robustecidas com mecanismos de resiliência. [2]
*   **Dívida Técnica Acumulada**: A existência de dívidas técnicas, como o enriquecimento de CEP pendente e a necessidade de padronização, indica áreas que exigem atenção para evitar custos futuros. [2]
*   **Inconsistências e Duplicações**: A transição entre versões e a natureza do Google Sheets podem levar a inconsistências e duplicações de dados, exigindo um esforço contínuo para manter uma única fonte de verdade. [2]

**Recomendações para Reconstrução Futura:**

O documento de diretrizes de engenharia [2] já aponta para a necessidade de uma reconstrução completa do ERP. Para isso, as seguintes direções arquiteturais são recomendadas:

1.  **Migração para um Banco de Dados Relacional**: Para superar as limitações do Google Sheets, uma migração para um banco de dados relacional (mencionado como futura migração no objetivo) é fundamental para garantir escalabilidade, integridade e desempenho. [2]
2.  **Centralização da Lógica de Negócio**: Todas as regras de negócio devem ser extraídas das planilhas e implementadas no código (preferencialmente em uma camada de serviços ou domínio), tornando-as testáveis, versionáveis e mais fáceis de manter. [2]
3.  **Implementação de Mecanismos de Resiliência**: Para dependências externas, implementar padrões como *retry*, *circuit breaker* e *caching* para garantir a robustez do sistema. [2]
4.  **Automação de Testes**: Aumentar a cobertura de testes automatizados para todas as camadas do sistema, especialmente para a lógica de negócio e transições de estado. [2]
5.  **Documentação Contínua e Viva**: Manter a documentação atualizada, com foco na lógica de negócio e nas decisões arquiteturais, utilizando ferramentas que facilitem a geração e a manutenção (como o `SchemaExporter.js` já faz para o schema). [2]
6.  **Reforço da Padronização**: Garantir que as diretrizes de padronização sejam aplicadas rigorosamente em todas as novas implementações. [2]

Este Mapa de Conhecimento serve como a base única para toda a reconstrução futura do Projeto TEAR, fornecendo uma compreensão aprofundada de sua arquitetura funcional, regras de negócio e desafios existentes. [2]

## Referências

[1] Arquivos CSV exportados das planilhas `PLANILHA ANTIGA.xlsx` e `[ELÃ] PROJETO TEAR 1.0.xlsx`.
[2] Análise do código-fonte do Google Apps Script (`TEAR_APPS_SCRIPT` e `MAE_APPS_SCRIPT`) e do documento `DIRETRIZES_DE_ENGENHARIA_PARA_O_PROJETO_TEAR.md`.
