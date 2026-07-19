# PASSO 1 — DOMÍNIO
## ENTREGA A — CURADORIA

### Objetivo

Definir quais informações do legado representam conhecimento permanente do domínio do TEAR e devem compor a documentação oficial do projeto.

Esta etapa não produz a documentação definitiva. Seu objetivo é apenas selecionar, organizar e refinar o conhecimento extraído do legado.

---

# Escopo desta seção

Esta seção deve responder apenas às seguintes perguntas:

- O que é o TEAR?
- Qual problema ele resolve?
- Quais entidades existem no domínio?
- Como essas entidades se relacionam?
- Quais conceitos são fundamentais para compreender o sistema?

Qualquer informação que não responda a uma dessas perguntas deverá ser movida para outra seção ou descartada.

---

# Conteúdo aprovado para preservação

## Objetivo do sistema

**Preservar.**

O TEAR existe para centralizar e organizar toda a operação de marketing de influência, transformando um processo operacional distribuído em um sistema único, rastreável e escalável.

---

## Problemas de negócio

**Preservar com consolidação.**

Os diversos problemas descritos no legado serão resumidos em quatro objetivos principais:

- Centralização das informações.
- Rastreabilidade operacional.
- Automação dos processos.
- Integridade dos dados.

Não é necessário manter descrições repetidas ou específicas da implementação anterior.

---

## Entidades do domínio

As seguintes entidades permanecem como parte do domínio do negócio:

- Parceira
- Onboarding
- Colaboração Mensal
- Briefing
- Entrega
- Logística
- Pagamento
- Usuário

---

## Agregado principal

A **Colaboração Mensal** passa a ser considerada o agregado central do domínio.

Ela concentra toda a operação de uma parceira durante uma competência e reúne:

- Briefing
- Entregas
- Logística
- Pagamentos

Todas as demais operações existem em função dela.

---

## Identidade das entidades

Toda entidade relevante deve possuir uma identidade permanente e imutável.

Nesta seção não serão descritas implementações técnicas, apenas o conceito de identidade persistente.

Os detalhes de identificação serão documentados posteriormente na seção de Modelo de Dados.

---

## Regras de domínio

Permanecem nesta seção apenas regras que definem o funcionamento do negócio, como:

- Apenas parceiras elegíveis participam de novos ciclos.
- Cada colaboração pertence a uma única competência.
- O Snapshot Comercial é imutável após a abertura do ciclo.

Regras relacionadas à infraestrutura ou tecnologia serão movidas para outras seções.

---

# Conteúdo removido desta seção

Não fazem parte do domínio e serão removidos:

- Google Sheets
- Google Apps Script
- LockService
- Abas técnicas
- CSVs
- Banco de dados
- PostgreSQL
- Supabase
- Next.js
- NestJS
- APIs
- OAuth
- Google
- Cloud Storage
- ViaCEP
- BrasilAPI
- Autocrat
- ACL
- DDD
- Mundo A / Mundo B

Esses assuntos pertencem à arquitetura, infraestrutura ou implementação.

---

# Ajustes editoriais

## Cadastro

O termo **Cadastro** será substituído por **Onboarding**, por representar melhor o processo de entrada de uma nova parceira no sistema.

---

## Obrigação Financeira

Será simplificado para **Pagamento**, mantendo uma linguagem mais natural e consistente em todo o projeto.

---

# Estrutura prevista para a documentação final

A seção "Domínio" do TEAR.md deverá conter apenas:

1. Objetivo do sistema
2. Problemas que resolve
3. Entidades do domínio
4. Relacionamentos entre entidades
5. Conceitos fundamentais

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Objetivo do TEAR | Preservar |
| Problemas de negócio | Consolidar |
| Parceira | Preservar |
| Onboarding | Renomear (antes Cadastro) |
| Colaboração Mensal | Tornar agregado principal |
| Briefing | Preservar |
| Entrega | Preservar |
| Logística | Preservar |
| Pagamento | Simplificar nomenclatura |
| Usuário | Preservar |
| Identidades permanentes | Preservar |
| Regras essenciais do domínio | Preservar |
| Tecnologia e infraestrutura | Remover desta seção |

---

## Critério de aprovação

A curadoria estará concluída quando todas as informações desta seção representarem exclusivamente conhecimento permanente do negócio, sem qualquer dependência de tecnologia, linguagem, framework ou infraestrutura.

# 1. DOMÍNIO

## Visão Geral

O TEAR é uma plataforma para gestão do ciclo completo de parcerias entre uma marca e suas influenciadoras.

Seu propósito é transformar um processo operacional distribuído em um fluxo único, organizado, rastreável e padronizado, permitindo que todas as etapas de uma colaboração sejam executadas dentro de um único ecossistema.

O sistema não existe para gerenciar planilhas, arquivos ou ferramentas específicas. Seu objetivo é representar o negócio de forma independente da tecnologia utilizada.

---

## Objetivos

O TEAR possui quatro objetivos permanentes:

- Centralizar todas as informações da operação.
- Garantir rastreabilidade de todas as atividades.
- Automatizar processos operacionais repetitivos.
- Preservar a integridade e o histórico dos dados.

Esses objetivos permanecem válidos independentemente da tecnologia utilizada para implementar o sistema.

---

## Entidades do Domínio

### Parceira

Representa a influenciadora que possui uma relação comercial ativa com a marca.

A Parceira concentra as informações permanentes da colaboração, como identidade, dados cadastrais e condições comerciais.

---

### Onboarding

Representa o processo de entrada de uma nova Parceira no ecossistema.

Seu objetivo é transformar uma candidata em uma Parceira apta a participar das operações do sistema.

Após sua conclusão, deixa de existir como processo ativo.

---

### Colaboração Mensal

É a unidade central do domínio.

Representa a participação de uma Parceira durante uma competência específica.

Toda operação do sistema acontece dentro de uma Colaboração Mensal.

Ela reúne todos os elementos necessários para executar uma campanha daquele período.

---

### Briefing

Representa o conjunto de orientações criativas que definem o que deverá ser produzido durante uma Colaboração Mensal.

Cada briefing estabelece objetivos, prazos e direcionamentos para a produção do conteúdo.

---

### Entrega

Representa uma peça individual de conteúdo prevista para uma Colaboração Mensal.

Cada entrega possui seu próprio ciclo de acompanhamento até sua conclusão.

---

### Logística

Representa toda movimentação física necessária para execução da campanha, incluindo envio e recebimento de produtos relacionados à colaboração.

---

### Pagamento

Representa a obrigação financeira decorrente da execução da Colaboração Mensal.

Seu ciclo acompanha a evolução financeira da parceria até sua conclusão.

---

### Usuário

Representa qualquer pessoa que interage com o sistema.

Cada usuário possui uma identidade permanente que permite sua identificação durante toda a vida útil da plataforma.

---

## Relacionamentos Fundamentais

O domínio é organizado a partir da Colaboração Mensal.

Uma Parceira pode participar de diversas Colaborações Mensais ao longo do tempo.

Cada Colaboração Mensal reúne:

- um Briefing;
- uma ou mais Entregas;
- um processo de Logística, quando necessário;
- um Pagamento correspondente.

Todos esses elementos existem exclusivamente dentro de uma Colaboração Mensal.

---

## Conceitos Fundamentais

### Competência

Período de referência utilizado para organizar uma Colaboração Mensal.

Toda colaboração pertence obrigatoriamente a uma única competência.

---

### Elegibilidade

Uma Parceira somente participa de uma nova Colaboração Mensal quando atende aos critérios definidos pelo negócio.

---

### Snapshot Comercial

No momento da criação da Colaboração Mensal, as condições comerciais da Parceira são registradas e passam a representar aquela competência.

Esse registro permanece inalterado durante todo o ciclo da colaboração.

---

### Identidade Permanente

Toda entidade relevante possui uma identidade única e imutável durante toda sua existência.

Alterações cadastrais nunca modificam sua identidade.

---

## Princípios do Domínio

O domínio do TEAR é construído sobre os seguintes princípios:

- O negócio é independente da tecnologia.
- A Colaboração Mensal é o centro da operação.
- O histórico operacional deve ser preservado.
- As regras de negócio possuem prioridade sobre decisões técnicas.
- Toda informação deve possuir uma única fonte de verdade.

# PASSO 2 — FLUXOS
## ENTREGA A — CURADORIA

### Objetivo

Identificar e consolidar os fluxos permanentes do domínio do TEAR, removendo dependências tecnológicas, detalhes operacionais e particularidades da implementação legada.

Esta etapa define **como o negócio funciona**, independentemente da tecnologia utilizada para implementá-lo.

---

# Escopo desta seção

A seção "Fluxos" deverá responder apenas às seguintes perguntas:

- Como uma parceria nasce?
- Como uma campanha acontece?
- Como ela é encerrada?
- Em que ordem os eventos ocorrem?
- Quais dependências existem entre os processos?

Tudo que representar interface, banco de dados, APIs ou infraestrutura será removido.

---

# Conteúdo aprovado para preservação

## Fluxo de Onboarding

**Preservar.**

Representa a entrada de uma nova Parceira no ecossistema.

O fluxo deve existir independentemente do método utilizado para autenticação ou coleta dos dados.

---

## Atualização de Perfil

**Preservar.**

A Parceira deve possuir um fluxo próprio para atualização de suas informações permanentes.

Os mecanismos de validação pertencem à implementação e não ao domínio.

---

## Definição das Condições Comerciais

**Preservar.**

Antes de participar de uma campanha, toda Parceira precisa possuir condições comerciais definidas.

Essas condições servirão de base para a criação da Colaboração Mensal.

---

## Criação da Colaboração Mensal

**Preservar integralmente.**

Este é o fluxo mais importante do sistema.

A abertura de uma nova competência materializa uma nova Colaboração Mensal para cada Parceira elegível.

Todas as operações posteriores dependem desse momento.

---

## Planejamento da Campanha

**Adaptar.**

O legado utiliza o termo "Geração de Briefing".

O domínio trata esse processo como o planejamento operacional da campanha.

O briefing passa a ser consequência desse planejamento.

---

## Produção de Conteúdo

**Preservar com simplificação.**

Upload, revisão, aprovação e publicação pertencem ao mesmo fluxo de produção.

Não há necessidade de separá-los em processos independentes.

---

## Logística

**Preservar.**

Representa toda movimentação física necessária para execução da campanha.

Os detalhes de rastreamento não pertencem ao domínio.

---

## Pagamento

**Preservar.**

Representa o fluxo financeiro da colaboração.

A forma de pagamento, instituição financeira ou integração utilizada não fazem parte deste documento.

---

## Encerramento da Competência

**Preservar integralmente.**

Quando todos os processos da Colaboração Mensal forem concluídos, a competência será encerrada e passará a compor o histórico permanente do sistema.

Este fluxo fecha completamente o ciclo operacional.

---

# Fluxo macro do domínio

Após a consolidação, o fluxo principal do TEAR passa a ser:

```text
Onboarding
      ↓
Configuração Comercial
      ↓
Abertura da Competência
      ↓
Criação da Colaboração Mensal
      ↓
Planejamento
      ↓
Produção
      ↓
Logística
      ↓
Pagamento
      ↓
Encerramento
      ↓
Histórico
```

Este fluxo representa o ciclo completo do negócio.

---

# Conteúdo removido desta seção

Não pertencem aos fluxos de domínio:

- Login Google
- OAuth
- Sessões
- APIs externas
- ViaCEP
- BrasilAPI
- Upload para Drive
- Google Drive
- Planilhas
- Apps Script
- Eventos internos
- Locks
- Cron Jobs
- Filas
- Banco de Dados
- SQL
- Webhooks
- Storage

Todos esses elementos pertencem à implementação.

---

# Ajustes editoriais

## Geração de Briefing

Será incorporada ao fluxo de Planejamento da Campanha.

O briefing deixa de ser tratado como um processo isolado.

---

## Upload + Aprovação

Serão considerados partes de um único fluxo denominado Produção de Conteúdo.

---

## Histórico

Não será tratado como um fluxo independente.

Será considerado o estado final natural de qualquer Colaboração Mensal encerrada.

---

# Estrutura prevista para a documentação final

A seção "Fluxos" do TEAR.md deverá conter apenas:

1. Visão Geral do Ciclo Operacional
2. Fluxo de Onboarding
3. Fluxo de Configuração Comercial
4. Fluxo de Criação da Colaboração Mensal
5. Fluxo de Planejamento
6. Fluxo de Produção
7. Fluxo de Logística
8. Fluxo de Pagamento
9. Fluxo de Encerramento

---

# Resultado da curadoria

| Fluxo | Decisão |
|--------|----------|
| Onboarding | Preservar |
| Atualização de Perfil | Preservar |
| Configuração Comercial | Preservar |
| Criação da Colaboração Mensal | Tornar fluxo principal |
| Planejamento | Consolidar |
| Produção de Conteúdo | Consolidar |
| Logística | Preservar |
| Pagamento | Preservar |
| Encerramento da Competência | Preservar |
| Histórico | Tornar estado final |
| Infraestrutura técnica | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os fluxos representarem exclusivamente o comportamento do negócio, formando um ciclo operacional contínuo, independente de tecnologia, banco de dados ou plataforma de execução.

# 2. FLUXOS

## Visão Geral

O TEAR organiza toda a operação de uma parceria em um fluxo contínuo e padronizado.

Cada Colaboração Mensal percorre um ciclo completo, desde a entrada da Parceira até o arquivamento definitivo da competência. Todos os processos possuem início, evolução e encerramento claramente definidos, garantindo previsibilidade operacional e rastreabilidade durante todo o ciclo.

---

## Fluxo Operacional

O ciclo operacional do TEAR é composto pelas seguintes etapas:

```text
Onboarding
      ↓
Configuração Comercial
      ↓
Abertura da Competência
      ↓
Criação da Colaboração Mensal
      ↓
Planejamento da Campanha
      ↓
Produção de Conteúdo
      ↓
Logística
      ↓
Pagamento
      ↓
Encerramento da Competência
      ↓
Histórico
```

Cada etapa depende da conclusão da anterior e prepara a seguinte.

---

## Onboarding

O ciclo inicia com o ingresso de uma nova Parceira no ecossistema.

Durante essa etapa são coletadas as informações necessárias para sua identificação e operação dentro do sistema.

Ao final do processo, a candidata torna-se uma Parceira apta a participar das campanhas.

---

## Configuração Comercial

Após o ingresso da Parceira, são definidas suas condições comerciais.

Essa configuração estabelece os parâmetros que serão utilizados nas futuras Colaborações Mensais, como formatos de conteúdo, remuneração e demais condições da parceria.

Uma Parceira somente poderá participar de campanhas após possuir uma configuração comercial válida.

---

## Abertura da Competência

Cada campanha inicia com a abertura de uma nova competência.

Nesse momento, o sistema identifica todas as Parceiras elegíveis e prepara uma nova operação para cada uma delas.

A abertura da competência representa o início oficial do ciclo operacional daquele período.

---

## Colaboração Mensal

Para cada Parceira elegível é criada uma Colaboração Mensal.

Ela representa a execução completa da parceria durante uma competência específica.

Toda atividade realizada pelo sistema ocorre dentro dessa colaboração.

---

## Planejamento da Campanha

Com a Colaboração Mensal criada, inicia-se o planejamento da campanha.

Nesta etapa são definidos:

- objetivos da campanha;
- orientações criativas;
- entregas previstas;
- cronograma operacional.

Ao término do planejamento, a Parceira possui todas as informações necessárias para iniciar a produção.

---

## Produção de Conteúdo

A Parceira produz os materiais previstos para a campanha.

Durante esse fluxo, cada entrega percorre seu ciclo de acompanhamento até atingir seu estado de conclusão.

Toda produção permanece vinculada à Colaboração Mensal correspondente.

---

## Logística

Quando a campanha exige movimentação física de produtos, inicia-se o fluxo logístico.

Esse processo acompanha toda a movimentação necessária para permitir a execução da campanha.

A logística existe apenas quando necessária para a Colaboração Mensal.

---

## Pagamento

Após a conclusão das obrigações da campanha, inicia-se o fluxo financeiro.

O pagamento representa a liquidação da obrigação comercial estabelecida entre a marca e a Parceira.

Cada pagamento pertence exclusivamente à Colaboração Mensal que lhe deu origem.

---

## Encerramento da Competência

Quando todas as atividades da Colaboração Mensal forem concluídas, a competência é encerrada.

O encerramento representa o término definitivo daquele ciclo operacional.

Após essa etapa, nenhuma atividade operacional permanece pendente.

---

## Histórico

Toda Colaboração Mensal encerrada passa automaticamente a integrar o histórico permanente do sistema.

O histórico preserva a memória operacional da plataforma e garante a rastreabilidade completa de todas as campanhas realizadas.

Uma competência arquivada representa um registro definitivo da operação executada.

---

## Princípios dos Fluxos

Os fluxos do TEAR seguem os seguintes princípios:

- Todo processo possui início, evolução e encerramento.
- Toda operação acontece dentro de uma Colaboração Mensal.
- Cada competência representa um ciclo operacional independente.
- Nenhuma etapa pode existir sem depender da etapa anterior.
- O histórico é a consequência natural do encerramento de uma competência.
- Todo fluxo deve ser rastreável do início ao fim.

# PASSO 3 — MODELO DE DADOS
## ENTREGA A — CURADORIA

### Objetivo

Definir quais informações fazem parte do modelo permanente de dados do TEAR, separando conceitos de negócio de decisões de implementação.

Esta etapa não define tabelas, SQL, tipos de dados ou banco de dados específico. Seu objetivo é identificar **quais informações o sistema precisa conhecer** para representar corretamente o domínio.

---

# Escopo desta seção

Esta seção deverá responder apenas às seguintes perguntas:

- Quais informações o TEAR precisa armazenar?
- Como essas informações se relacionam?
- Quais dados são permanentes?
- Quais dados são temporários?
- O que nunca pode ser perdido?
- O que pertence apenas ao legado?

Toda decisão sobre tecnologia será removida desta etapa.

---

# Conteúdo aprovado para preservação

## Identidade

**Preservar integralmente.**

Toda entidade principal deve possuir uma identidade permanente.

Essa identidade nunca depende de atributos como nome, e-mail ou telefone.

Ela existe exclusivamente para garantir continuidade e rastreabilidade.

---

## Relacionamentos

**Preservar.**

O relacionamento entre as entidades faz parte do domínio.

Devem permanecer:

- Parceira → Colaborações Mensais
- Colaboração Mensal → Briefing
- Colaboração Mensal → Entregas
- Colaboração Mensal → Logística
- Colaboração Mensal → Pagamentos

Esses relacionamentos são independentes da forma como serão implementados.

---

## Dados permanentes

**Preservar.**

São considerados permanentes:

- identidade da Parceira;
- condições comerciais vigentes na abertura da competência;
- histórico das campanhas;
- histórico financeiro;
- registros das entregas;
- histórico logístico.

Esses dados jamais devem ser descartados durante a operação normal do sistema.

---

## Snapshot Comercial

**Preservar integralmente.**

No momento da criação da Colaboração Mensal, as condições comerciais da Parceira devem ser registradas para aquela competência.

Alterações futuras não modificam registros já existentes.

---

## Competência

**Preservar.**

Toda Colaboração Mensal pertence obrigatoriamente a uma única competência.

A competência organiza cronologicamente toda a operação.

---

# Conteúdo adaptado

## INFLU_KEY

Será tratado apenas como um conceito de identidade legada.

O documento não deve citar nomes de colunas ou campos específicos.

Esses detalhes pertencem à implementação.

---

## SUB

Também será tratado apenas como um exemplo de identidade permanente.

O documento não deve depender de um provedor específico de autenticação.

---

## Endereço

Passa a ser tratado apenas como informação de perfil da Parceira.

Como será armazenado será decidido durante a implementação.

---

## PIX

Permanece como informação financeira da Parceira.

Sua estrutura técnica não pertence ao domínio.

---

# Conteúdo removido

Não fazem parte desta seção:

- PostgreSQL
- Supabase
- UUID
- Foreign Keys
- JSON
- Índices
- SQL
- Tipos de dados
- Normalização
- JOIN
- ACID
- Constraints
- Views
- Migrations
- Tabelas físicas
- Colunas físicas
- Banco relacional
- Banco NoSQL

Esses assuntos pertencem ao projeto técnico.

---

# Ajustes editoriais

## Modelo lógico

Esta seção descreve apenas o modelo lógico do domínio.

O modelo físico será produzido futuramente durante a arquitetura técnica.

---

## Dados históricos

O conceito de histórico deixa de ser tratado como armazenamento.

Passa a representar um estado permanente do domínio.

---

## Dados temporários

Sessões, autenticação, tokens e estados transitórios deixam de fazer parte desta documentação.

São responsabilidades da infraestrutura.

---

# Estrutura prevista para a documentação final

A seção "Modelo de Dados" do TEAR.md deverá conter apenas:

1. Princípios do Modelo de Dados
2. Identidade
3. Informações Permanentes
4. Relacionamentos
5. Competência
6. Snapshot Comercial
7. Dados Históricos

---

# Resultado da curadoria

| Item | Decisão |
|-------|----------|
| Identidade permanente | Preservar |
| Relacionamentos do domínio | Preservar |
| Snapshot Comercial | Preservar |
| Competência | Preservar |
| Dados permanentes | Preservar |
| Dados históricos | Preservar |
| Informações de perfil | Adaptar |
| Campos físicos | Remover |
| Banco de dados | Remover |
| SQL | Remover |
| Tecnologia de persistência | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando o modelo representar exclusivamente as informações que o negócio precisa preservar, sem qualquer dependência de banco de dados, linguagem de programação ou tecnologia de armazenamento.

# 3. MODELO DE DADOS

## Visão Geral

O modelo de dados do TEAR representa as informações permanentes do negócio.

Seu objetivo é garantir que toda operação realizada pela plataforma possa ser identificada, relacionada, consultada e preservada ao longo do tempo, independentemente da tecnologia utilizada para armazená-la.

O modelo é orientado pelo domínio e não pela infraestrutura.

---

## Princípios

O modelo de dados do TEAR é construído sobre os seguintes princípios:

- Toda entidade possui identidade permanente.
- Toda informação possui uma única fonte de verdade.
- O histórico nunca é sobrescrito.
- Relações entre entidades refletem relações do negócio.
- Alterações futuras nunca modificam fatos históricos.
- O modelo deve representar o domínio, e não a implementação.

---

## Identidade

Toda entidade principal possui uma identidade única, permanente e imutável.

Essa identidade existe durante todo o ciclo de vida da entidade e não depende de atributos como nome, e-mail, telefone ou qualquer outra informação sujeita a alteração.

Ela garante continuidade, rastreabilidade e consistência em toda a plataforma.

---

## Informações Permanentes

O TEAR preserva permanentemente as seguintes informações:

### Parceira

Mantém os dados permanentes da influenciadora, incluindo sua identidade, informações cadastrais e condições comerciais vigentes.

---

### Colaboração Mensal

Representa toda a operação realizada por uma Parceira durante uma competência específica.

Constitui a principal unidade de persistência do domínio.

---

### Briefing

Registra as orientações criativas que deram origem à produção da campanha.

Uma vez iniciado o ciclo operacional, permanece associado à Colaboração Mensal.

---

### Entrega

Registra cada conteúdo previsto para a campanha, preservando seu histórico de execução.

Cada Entrega pertence exclusivamente a uma Colaboração Mensal.

---

### Logística

Registra toda movimentação física relacionada à campanha.

Sempre permanece vinculada à Colaboração Mensal correspondente.

---

### Pagamento

Registra a obrigação financeira originada pela colaboração.

Cada pagamento permanece associado à competência em que foi gerado.

---

## Relacionamentos

O modelo organiza seus relacionamentos a partir da Colaboração Mensal.

Uma Parceira pode possuir diversas Colaborações Mensais ao longo do tempo.

Cada Colaboração Mensal reúne:

- um Briefing;
- uma ou mais Entregas;
- zero ou um processo de Logística;
- um Pagamento correspondente.

Esses relacionamentos representam vínculos permanentes do domínio.

---

## Competência

Toda Colaboração Mensal pertence obrigatoriamente a uma única competência.

A competência organiza cronologicamente toda a operação da plataforma e estabelece o contexto temporal da colaboração.

Nenhuma Colaboração Mensal pode existir fora de uma competência.

---

## Snapshot Comercial

No momento da criação da Colaboração Mensal, as condições comerciais da Parceira são registradas para aquela competência.

Esse registro representa o estado comercial vigente naquele instante.

Alterações posteriores nas condições da Parceira não modificam snapshots já existentes.

Cada Colaboração Mensal preserva permanentemente sua configuração original.

---

## Histórico

O histórico representa a memória permanente da operação.

Nenhum registro concluído é substituído ou descartado.

Sempre que houver evolução de uma entidade, um novo estado será registrado sem alterar os fatos anteriormente consolidados.

Esse princípio garante rastreabilidade completa de toda a vida operacional da plataforma.

---

## Fonte Única de Verdade

Cada informação do domínio possui um único local responsável por sua manutenção.

Duplicações, sincronizações paralelas e múltiplas versões da mesma informação não fazem parte do modelo do TEAR.

Toda consulta deve possuir uma origem única, consistente e confiável.

---

## Princípios do Modelo

O modelo de dados do TEAR segue os seguintes princípios:

- Toda entidade possui identidade permanente.
- Toda informação pertence a uma única fonte de verdade.
- O histórico é imutável.
- Relacionamentos representam o domínio do negócio.
- A Colaboração Mensal é o centro do modelo.
- Nenhuma decisão de armazenamento influencia o domínio.
- O modelo permanece independente de banco de dados, linguagem, framework ou infraestrutura.

# PASSO 4 — REGRAS DE NEGÓCIO
## ENTREGA A — CURADORIA

### Objetivo

Identificar, consolidar e organizar todas as regras permanentes que governam o funcionamento do TEAR.

Esta etapa define **o que pode ou não acontecer dentro do sistema**, independentemente de tecnologia, interface ou implementação.

---

# Escopo desta seção

A seção "Regras de Negócio" deverá responder apenas às seguintes perguntas:

- Quais condições precisam ser satisfeitas para uma operação ocorrer?
- Quais estados são válidos?
- Quais situações são proibidas?
- Quais comportamentos devem permanecer verdadeiros ao longo do tempo?

Toda decisão técnica será removida desta etapa.

---

# Conteúdo aprovado para preservação

## Elegibilidade da Parceira

**Preservar integralmente.**

Uma Parceira somente poderá participar de uma nova Colaboração Mensal quando atender aos critérios definidos pelo negócio.

Elegibilidade é um conceito do domínio e não da implementação.

---

## Uma Colaboração por Competência

**Preservar integralmente.**

Uma Parceira não pode possuir mais de uma Colaboração Mensal para a mesma competência.

Essa regra garante unicidade da operação.

---

## Snapshot Comercial

**Preservar integralmente.**

As condições comerciais utilizadas na abertura da competência permanecem imutáveis durante toda a Colaboração Mensal.

Mudanças futuras produzem efeito apenas em competências futuras.

---

## Dependência entre Etapas

**Preservar.**

Nenhuma etapa pode iniciar antes da conclusão das dependências necessárias.

Cada fluxo respeita a ordem natural do ciclo operacional.

---

## Histórico Permanente

**Preservar.**

Após o encerramento de uma competência, seus registros tornam-se permanentes.

Nenhum fato histórico pode ser removido ou alterado.

---

## Integridade Referencial do Domínio

**Preservar.**

Toda entidade operacional deve estar vinculada a uma Colaboração Mensal válida.

Não podem existir registros órfãos no domínio.

---

# Conteúdo adaptado

## Aprovação

Os estados específicos utilizados no legado deixam de fazer parte da documentação.

Permanece apenas o conceito de evolução controlada entre estados.

---

## Pagamentos

O domínio preserva apenas a regra de existência de um fluxo financeiro.

Meios de pagamento, integrações bancárias ou plataformas externas pertencem à implementação.

---

## Logística

O domínio considera apenas a existência de movimentação física quando necessária.

Transportadoras, códigos de rastreio e integrações externas não pertencem às regras de negócio.

---

# Conteúdo removido

Não pertencem às regras do domínio:

- OAuth
- Login
- Sessão
- Tokens
- APIs
- Banco de Dados
- SQL
- Drive
- Apps Script
- Triggers
- Cron Jobs
- Locks
- Webhooks
- Cache
- Filas
- Frameworks

Esses elementos pertencem exclusivamente à arquitetura técnica.

---

# Ajustes editoriais

## Estados

Os estados serão descritos de forma conceitual.

A nomenclatura técnica utilizada pela implementação não fará parte desta documentação.

---

## Validações

Validações técnicas deixam de ser documentadas.

Permanecem apenas validações que representam regras reais do negócio.

---

## Erros

Mensagens de erro, exceções e códigos internos não pertencem às regras de negócio.

---

# Estrutura prevista para a documentação final

A seção "Regras de Negócio" do TEAR.md deverá conter apenas:

1. Princípios Gerais
2. Regras de Elegibilidade
3. Regras da Colaboração Mensal
4. Regras do Ciclo Operacional
5. Regras de Persistência Histórica
6. Restrições do Domínio

---

# Resultado da curadoria

| Regra | Decisão |
|--------|----------|
| Elegibilidade | Preservar |
| Uma colaboração por competência | Preservar |
| Snapshot Comercial | Preservar |
| Ordem dos fluxos | Preservar |
| Histórico imutável | Preservar |
| Integridade do domínio | Preservar |
| Estados técnicos | Adaptar |
| Validações técnicas | Remover |
| Infraestrutura | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todas as regras representarem exclusivamente restrições e comportamentos do negócio, permanecendo válidas independentemente da tecnologia utilizada para implementar o TEAR.

# 4. REGRAS DE NEGÓCIO

## Visão Geral

As regras de negócio do TEAR definem os comportamentos que devem permanecer verdadeiros independentemente da tecnologia utilizada para implementar o sistema.

Elas representam as restrições permanentes do domínio e garantem consistência, previsibilidade e integridade em toda a operação da plataforma.

---

## Princípios Gerais

Toda decisão operacional do TEAR deve respeitar os seguintes princípios:

- O domínio possui prioridade sobre a implementação.
- Toda operação pertence a uma única Colaboração Mensal.
- Todo registro deve ser rastreável.
- O histórico operacional é permanente.
- O sistema deve preservar a integridade dos dados em qualquer situação.

---

## Regras de Elegibilidade

Uma Parceira somente poderá participar de uma nova Colaboração Mensal quando atender aos critérios de elegibilidade definidos pelo negócio.

A elegibilidade é avaliada antes da abertura de cada competência e representa a autorização para iniciar um novo ciclo operacional.

Parceiras não elegíveis permanecem cadastradas, mas não participam da competência correspondente.

---

## Regras da Colaboração Mensal

A Colaboração Mensal é a unidade operacional do TEAR.

Para preservar a consistência do domínio, aplicam-se as seguintes regras:

- Cada Colaboração Mensal pertence a uma única Parceira.
- Cada Colaboração Mensal pertence a uma única competência.
- Uma Parceira não pode possuir mais de uma Colaboração Mensal para a mesma competência.
- Toda operação realizada pelo sistema deve estar vinculada a uma Colaboração Mensal existente.

---

## Regras do Snapshot Comercial

No momento da criação da Colaboração Mensal, as condições comerciais vigentes da Parceira são registradas.

Após esse registro:

- o Snapshot Comercial torna-se permanente;
- alterações futuras na Parceira não modificam competências anteriores;
- cada competência preserva sua configuração original.

Esse princípio garante fidelidade histórica das relações comerciais.

---

## Regras do Ciclo Operacional

O fluxo operacional do TEAR deve respeitar uma sequência lógica de evolução.

Nenhuma etapa pode ser iniciada sem que suas dependências tenham sido satisfeitas.

Cada etapa representa uma evolução válida da Colaboração Mensal e nunca um processo isolado.

O encerramento da competência somente pode ocorrer após a conclusão de todas as obrigações previstas para aquela colaboração.

---

## Regras de Integridade

Toda informação operacional deve possuir contexto e relacionamento válidos.

Como consequência:

- nenhuma Entrega pode existir sem uma Colaboração Mensal;
- nenhum Pagamento pode existir sem uma Colaboração Mensal;
- nenhum processo Logístico pode existir sem uma Colaboração Mensal;
- nenhum Briefing pode existir sem uma Colaboração Mensal.

Essas relações garantem a integridade do domínio.

---

## Regras do Histórico

O histórico representa o registro permanente da operação.

Após o encerramento de uma competência:

- seus registros tornam-se definitivos;
- fatos históricos não podem ser sobrescritos;
- alterações futuras geram novos estados, nunca modificações retroativas.

A preservação do histórico é obrigatória para toda entidade do domínio.

---

## Restrições do Domínio

O TEAR não permite:

- mais de uma Colaboração Mensal para a mesma Parceira na mesma competência;
- registros operacionais sem contexto;
- perda de rastreabilidade;
- alteração de fatos históricos consolidados;
- duplicidade da mesma informação em múltiplas origens.

Essas restrições garantem a consistência do sistema ao longo de toda sua evolução.

---

## Princípios das Regras de Negócio

As regras de negócio do TEAR seguem os seguintes princípios:

- Toda regra representa uma necessidade do negócio.
- Toda restrição deve preservar a integridade do domínio.
- O histórico possui caráter permanente.
- A Colaboração Mensal é o centro de todas as validações.
- A evolução do sistema nunca pode invalidar fatos históricos.
- Nenhuma decisão técnica pode alterar as regras fundamentais do domínio.

# PASSO 5 — PRESERVAÇÃO
## ENTREGA A — CURADORIA

### Objetivo

Definir quais informações, decisões e registros devem ser preservados ao longo da evolução do TEAR para garantir continuidade, rastreabilidade e manutenção do conhecimento do produto.

Esta seção não trata de backup, infraestrutura ou armazenamento. Seu objetivo é estabelecer **o que jamais deve ser perdido**, independentemente da tecnologia utilizada. Essa separação entre conhecimento de negócio e implementação é uma prática reconhecida na documentação arquitetural e na preservação de sistemas legados.  [oai_citation:0‡arXiv](https://arxiv.org/abs/2605.18684?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Preservação" deverá responder apenas às seguintes perguntas:

- Quais conhecimentos são permanentes?
- O que deve sobreviver a uma reescrita do sistema?
- Quais documentos possuem valor histórico?
- Quais decisões nunca devem ser esquecidas?
- O que pode ser descartado sem comprometer o produto?

Toda decisão sobre infraestrutura de backup, versionamento de arquivos ou banco de dados será removida desta etapa.

---

# Conteúdo aprovado para preservação

## Conhecimento do Domínio

**Preservar integralmente.**

O entendimento do negócio representa o ativo mais importante do TEAR.

Inclui:

- linguagem do domínio;
- entidades;
- fluxos;
- regras de negócio;
- modelo conceitual.

Esse conhecimento deve permanecer válido mesmo diante de mudanças completas na implementação.

---

## Decisões Arquiteturais

**Preservar.**

Toda decisão arquitetural relevante deve possuir registro, contexto e justificativa.

A decisão preservada é o raciocínio, e não necessariamente a tecnologia utilizada.

---

## Histórico do Produto

**Preservar.**

Mudanças relevantes na evolução do sistema devem permanecer documentadas.

O objetivo é compreender por que determinada decisão foi tomada e quais impactos ela produziu.

---

## Vocabulário do Domínio

**Preservar integralmente.**

A linguagem utilizada pelo negócio deve permanecer consistente em toda a documentação.

Alterações de nomenclatura devem ocorrer apenas quando representarem uma evolução real do domínio.

---

## Princípios Fundamentais

**Preservar integralmente.**

Os princípios que orientam o projeto representam conhecimento permanente e devem sobreviver a qualquer reimplementação do sistema.

---

# Conteúdo adaptado

## Legado

O código legado deixa de ser considerado referência obrigatória.

Permanece apenas como fonte de consulta para extração de conhecimento do domínio.

---

## Documentação Histórica

A documentação antiga será preservada apenas quando registrar conhecimento que ainda permaneça válido.

Documentos redundantes, contraditórios ou exclusivamente técnicos poderão ser descartados.

---

## Protótipos

Protótipos possuem valor temporário.

Somente decisões incorporadas oficialmente ao domínio passam a integrar a documentação permanente.

---

# Conteúdo removido

Não fazem parte da preservação do conhecimento:

- código-fonte legado;
- branches de Git;
- commits;
- backups;
- dumps de banco de dados;
- arquivos temporários;
- logs operacionais;
- builds;
- artefatos de deploy;
- dependências de frameworks;
- configurações específicas de ambiente.

Esses elementos pertencem à infraestrutura e ao ciclo de desenvolvimento.

---

# Ajustes editoriais

## Conhecimento acima da tecnologia

Toda informação preservada deve ser compreensível independentemente da linguagem de programação, framework ou banco de dados adotado.

---

## Evolução contínua

A documentação oficial representa o estado atual do conhecimento.

Versões anteriores permanecem como referência histórica, mas não substituem a documentação vigente.

---

## Fonte oficial

Cada conhecimento permanente deve possuir um único documento oficial responsável por sua manutenção.

Duplicações documentais devem ser evitadas.

---

# Estrutura prevista para a documentação final

A seção "Preservação" do TEAR.md deverá conter apenas:

1. Objetivo da Preservação
2. Conhecimentos Permanentes
3. Decisões Arquiteturais
4. Histórico do Produto
5. Documentação Oficial
6. Critérios para Descarte
7. Princípios de Preservação

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Conhecimento do domínio | Preservar |
| Linguagem do domínio | Preservar |
| Decisões arquiteturais | Preservar |
| Histórico do produto | Preservar |
| Princípios do projeto | Preservar |
| Legado como referência | Adaptar |
| Protótipos | Adaptar |
| Código-fonte legado | Remover |
| Infraestrutura | Remover |
| Backups e artefatos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando estiver claramente definido quais conhecimentos constituem o patrimônio permanente do TEAR e devem ser preservados ao longo de toda a evolução do projeto, independentemente da tecnologia empregada.  [oai_citation:1‡dpconline.b-cdn.net](https://dpconline.b-cdn.net/digipres/implement-digipres/digital-preservation-documentation-guide?utm_source=chatgpt.com)

# 5. PRESERVAÇÃO

## Visão Geral

A preservação no TEAR tem como objetivo garantir que o conhecimento do produto permaneça íntegro, compreensível e reutilizável durante toda a evolução do sistema.

O patrimônio do projeto não é representado apenas pelo código-fonte, mas principalmente pelo conhecimento acumulado sobre o domínio, suas regras, decisões e princípios. A documentação existe para tornar esse conhecimento compartilhável, reduzindo dependência de pessoas e garantindo continuidade do desenvolvimento ao longo do tempo.  [oai_citation:0‡dpconline.org](https://www.dpconline.org/digipres/implement-digipres/digital-preservation-documentation-guide/digital-preservation-documentation-what-why-who?utm_source=chatgpt.com)

---

## Conhecimento Permanente

São considerados ativos permanentes do TEAR:

- o domínio do negócio;
- a linguagem ubíqua;
- as entidades do domínio;
- os fluxos operacionais;
- o modelo conceitual de dados;
- as regras de negócio;
- os princípios arquiteturais;
- as decisões estruturantes do projeto.

Esses elementos representam a identidade do sistema e devem permanecer válidos mesmo que toda a implementação seja substituída.

---

## Decisões Arquiteturais

Toda decisão arquitetural relevante deve ser registrada juntamente com seu contexto e sua motivação.

A preservação concentra-se na justificativa da decisão, permitindo compreender por que determinado caminho foi adotado e quais problemas buscava resolver.

Mudanças tecnológicas não invalidam o histórico das decisões anteriormente registradas.

---

## Histórico do Produto

A evolução do TEAR constitui parte do patrimônio do projeto.

Mudanças significativas de escopo, domínio, arquitetura ou comportamento devem ser registradas para preservar o contexto histórico da evolução do sistema.

O histórico permite compreender a trajetória do produto sem depender da memória de seus participantes.

---

## Documentação Oficial

Cada conhecimento permanente deve possuir um único documento oficial responsável por sua manutenção.

A documentação oficial representa o estado atual do projeto e serve como referência para decisões futuras.

Documentos auxiliares podem existir para apoiar o desenvolvimento, mas não substituem a documentação oficial.

---

## Legado

O sistema legado possui valor exclusivamente como fonte de conhecimento.

Sua função é preservar contexto histórico, regras anteriormente adotadas e informações úteis para compreensão do domínio.

O legado não representa um padrão obrigatório de arquitetura, tecnologia ou implementação.

Toda reutilização deve ocorrer de forma consciente e somente quando agregar valor ao projeto atual.

---

## Critérios para Preservação

Uma informação deve ser preservada quando:

- representa conhecimento permanente do domínio;
- fundamenta uma decisão arquitetural relevante;
- influencia regras de negócio;
- explica comportamentos importantes do sistema;
- reduz dependência de conhecimento tácito;
- facilita a evolução futura da plataforma.

---

## Critérios para Descarte

Uma informação pode ser descartada quando:

- descreve apenas detalhes de implementação;
- depende exclusivamente de uma tecnologia específica;
- perdeu validade para o domínio atual;
- foi substituída por documentação oficial mais recente;
- representa apenas conhecimento operacional temporário.

O descarte nunca deve comprometer a compreensão do domínio ou da evolução do produto.

---

## Evolução da Documentação

A documentação do TEAR deve evoluir continuamente junto com o sistema.

Sempre que uma mudança modificar o domínio, os fluxos, o modelo de dados, as regras de negócio ou a arquitetura, a documentação correspondente deverá ser atualizada para refletir o novo estado oficial do projeto.

A documentação é parte integrante do produto e não um artefato secundário.  [oai_citation:1‡dpconline.b-cdn.net](https://dpconline.b-cdn.net/digipres/implement-digipres/digital-preservation-documentation-guide?utm_source=chatgpt.com)

---

## Princípios de Preservação

A preservação do TEAR segue os seguintes princípios:

- O conhecimento possui maior valor que a tecnologia.
- O domínio deve sobreviver à implementação.
- A documentação oficial representa a única fonte de verdade.
- Toda decisão relevante deve possuir contexto e justificativa.
- O histórico do produto deve permanecer compreensível.
- O legado é uma referência de conhecimento, não uma restrição arquitetural.
- A documentação deve evoluir continuamente com o sistema.
- O patrimônio intelectual do projeto deve permanecer acessível, consistente e reutilizável ao longo de toda sua evolução.  [oai_citation:2‡dpconline.org](https://www.dpconline.org/digipres/implement-digipres/policy-toolkit/policy-template/policy-principles-recommended?utm_source=chatgpt.com)

# PASSO 6 — REVISÃO ARQUITETURAL
## ENTREGA A — CURADORIA

### Objetivo

Avaliar criticamente a arquitetura proposta para o TEAR, consolidando apenas decisões que fortaleçam a longevidade, a simplicidade, a manutenibilidade e a evolução do sistema.

Esta etapa não define a arquitetura final. Seu objetivo é selecionar quais decisões arquiteturais permanecerão como diretrizes oficiais do projeto e quais práticas do legado serão descartadas.

---

# Escopo desta seção

A seção "Revisão Arquitetural" deverá responder apenas às seguintes perguntas:

- Quais princípios arquiteturais devem orientar o TEAR?
- Quais decisões do legado permanecem válidas?
- Quais decisões devem ser substituídas?
- Quais características de qualidade possuem prioridade?
- Quais riscos arquiteturais precisam ser evitados?

Esta seção não descreve tecnologias específicas nem implementações detalhadas.

---

# Conteúdo aprovado para preservação

## Arquitetura orientada ao domínio

**Preservar integralmente.**

Toda decisão arquitetural deve existir para atender ao domínio do negócio.

A arquitetura nunca deve impor limitações ao modelo de negócio.

---

## Independência tecnológica

**Preservar integralmente.**

O domínio, os fluxos, o modelo de dados e as regras de negócio devem permanecer independentes de linguagens, frameworks, provedores ou bancos de dados.

A implementação poderá evoluir sem alterar a documentação do domínio.

---

## Separação de responsabilidades

**Preservar.**

Cada componente da arquitetura deve possuir uma única responsabilidade claramente definida.

A separação entre domínio, aplicação, infraestrutura e interface deve permanecer explícita.

---

## Arquitetura evolutiva

**Preservar.**

O sistema deve permitir evolução incremental sem exigir reescritas frequentes.

Novas funcionalidades devem ampliar a arquitetura existente, e não substituí-la integralmente.

---

## Registro das decisões

**Preservar integralmente.**

Toda decisão arquitetural relevante deve possuir contexto, justificativa e consequências documentadas.

O objetivo é preservar o raciocínio por trás da decisão, prática amplamente recomendada pelo uso de Architecture Decision Records (ADRs).  [oai_citation:0‡Google Cloud Documentation](https://docs.cloud.google.com/architecture/architecture-decision-records?hl=en&utm_source=chatgpt.com)

---

# Conteúdo adaptado

## Google Apps Script

Deixa de ser a arquitetura de referência.

Passa a representar apenas uma implementação histórica utilizada durante a primeira geração do sistema.

---

## Google Sheets

Deixa de ser considerado componente arquitetural.

Passa a ser tratado apenas como uma possível tecnologia de persistência.

---

## Organização em camadas

O conceito permanece.

A estrutura específica utilizada pelo legado poderá ser substituída por outra equivalente, desde que preserve a separação de responsabilidades.

---

## Integrações externas

Integrações deixam de fazer parte da arquitetura central.

Passam a ser componentes periféricos que podem ser substituídos sem afetar o domínio.

---

# Conteúdo removido

Não pertencem à arquitetura conceitual:

- Frameworks específicos
- Linguagens de programação
- Bibliotecas
- Provedores de nuvem
- Serviços de autenticação
- Ferramentas de deploy
- Estruturas de pastas
- Convenções internas de código
- Configurações de ambiente
- Scripts operacionais

Esses elementos pertencem ao projeto técnico.

---

# Ajustes editoriais

## Arquitetura ≠ Implementação

A documentação arquitetural deve explicar **por que** o sistema é organizado de determinada maneira.

A implementação descreve **como** essa arquitetura será construída.

---

## Decisões antes das tecnologias

Toda tecnologia adotada deve ser consequência de uma decisão arquitetural.

Nunca o contrário.

---

## Qualidade arquitetural

As decisões deverão priorizar:

- simplicidade;
- baixo acoplamento;
- alta coesão;
- facilidade de evolução;
- rastreabilidade;
- testabilidade;
- clareza estrutural.

---

# Estrutura prevista para a documentação final

A seção "Revisão Arquitetural" do TEAR.md deverá conter apenas:

1. Objetivos Arquiteturais
2. Princípios Arquiteturais
3. Decisões Estruturantes
4. Características de Qualidade
5. Limites Arquiteturais
6. Evolução da Arquitetura

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Arquitetura orientada ao domínio | Preservar |
| Independência tecnológica | Preservar |
| Separação de responsabilidades | Preservar |
| Arquitetura evolutiva | Preservar |
| Registro de decisões arquiteturais | Preservar |
| Organização em camadas | Adaptar |
| Integrações externas | Adaptar |
| Apps Script como arquitetura | Remover |
| Google Sheets como arquitetura | Remover |
| Frameworks e infraestrutura | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando a arquitetura do TEAR estiver definida por princípios e decisões permanentes, independentes de tecnologias específicas, permitindo que o sistema evolua continuamente sem perder consistência estrutural. A documentação deve registrar o contexto e a justificativa das decisões arquiteturais para facilitar sua compreensão e evolução futura.  [oai_citation:1‡Google Cloud Documentation](https://docs.cloud.google.com/architecture/architecture-decision-records?hl=en&utm_source=chatgpt.com)

# 6. REVISÃO ARQUITETURAL

## Objetivos Arquiteturais

A arquitetura do TEAR existe para sustentar a evolução do produto ao longo do tempo.

Sua principal responsabilidade é permitir que o domínio do negócio permaneça estável enquanto tecnologias, ferramentas e implementações evoluem.

Toda decisão arquitetural deve priorizar a longevidade, a simplicidade e a capacidade de adaptação do sistema.

---

## Princípios Arquiteturais

A arquitetura do TEAR é guiada pelos seguintes princípios:

- O domínio é independente da tecnologia.
- O negócio conduz a arquitetura, nunca o contrário.
- Cada componente possui uma responsabilidade claramente definida.
- O baixo acoplamento é preferível à conveniência imediata.
- A alta coesão facilita manutenção e evolução.
- Toda decisão estrutural deve possuir justificativa documentada.
- O sistema deve permanecer compreensível para novos colaboradores.

Esses princípios orientam toda decisão arquitetural futura.

---

## Decisões Estruturantes

As seguintes decisões são consideradas permanentes para o projeto:

### Domínio como núcleo

O domínio representa o centro da arquitetura.

Todos os demais componentes existem para atender às necessidades do domínio, sem introduzir dependências que comprometam sua evolução.

---

### Separação de Responsabilidades

A arquitetura deve separar claramente:

- domínio;
- aplicação;
- infraestrutura;
- interfaces;
- integrações.

Cada camada possui responsabilidades próprias e comunica-se apenas por contratos bem definidos.

---

### Independência Tecnológica

Nenhuma tecnologia específica faz parte da arquitetura do TEAR.

Linguagens, frameworks, bancos de dados, provedores de nuvem ou ferramentas podem ser substituídos sem alterar os princípios arquiteturais do sistema.

---

### Evolução Incremental

A arquitetura deve permitir crescimento contínuo.

Novas funcionalidades devem ampliar a estrutura existente sempre que possível, evitando reescritas completas motivadas apenas por mudanças tecnológicas.

---

## Características de Qualidade

Toda decisão arquitetural deverá priorizar os seguintes atributos de qualidade:

- simplicidade;
- manutenibilidade;
- extensibilidade;
- testabilidade;
- rastreabilidade;
- consistência;
- baixo acoplamento;
- alta coesão.

Esses atributos orientam a avaliação de alternativas arquiteturais e reduzem o risco de acúmulo de dívida técnica.  [oai_citation:0‡Instituto de Engenharia de Software CMU](https://www.sei.cmu.edu/library/principles-for-evaluating-the-quality-attributes-of-a-software-architecture/?utm_source=chatgpt.com)

---

## Limites Arquiteturais

A arquitetura do TEAR estabelece os seguintes limites:

- o domínio não depende da infraestrutura;
- regras de negócio não dependem de interfaces;
- integrações externas são componentes periféricos;
- decisões tecnológicas não alteram o modelo de domínio;
- dados do domínio possuem uma única fonte de verdade.

Esses limites preservam a estabilidade da arquitetura diante da evolução tecnológica.

---

## Registro das Decisões

Toda decisão arquitetural relevante deve possuir registro permanente contendo:

- contexto;
- problema;
- decisão adotada;
- justificativa;
- consequências esperadas.

O objetivo não é registrar tecnologia, mas preservar o raciocínio que levou à decisão, prática amplamente recomendada pelo uso de *Architecture Decision Records (ADRs)*.  [oai_citation:1‡Documentação AWS](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html?utm_source=chatgpt.com)

---

## Evolução da Arquitetura

A arquitetura do TEAR deve evoluir continuamente.

Sempre que mudanças significativas ocorrerem no domínio, nas regras de negócio ou na organização estrutural do sistema, a arquitetura deverá ser revisada para refletir o novo estado oficial do projeto.

Mudanças tecnológicas, por si só, não justificam alterações arquiteturais.

---

## Critérios para Avaliação Arquitetural

Toda proposta de mudança arquitetural deve responder positivamente às seguintes perguntas:

- Preserva a independência do domínio?
- Reduz ou mantém o nível de acoplamento?
- Mantém responsabilidades bem definidas?
- Facilita a evolução futura do sistema?
- Preserva a rastreabilidade do domínio?
- Pode ser compreendida por novos colaboradores?
- Possui justificativa arquitetural documentada?

Mudanças que não atendam a esses critérios devem ser reavaliadas antes de sua adoção.  [oai_citation:2‡Instituto de Engenharia de Software CMU](https://www.sei.cmu.edu/library/a-structured-approach-for-reviewing-architecture-documentation/?utm_source=chatgpt.com)

---

## Princípios da Arquitetura

A arquitetura do TEAR segue os seguintes princípios permanentes:

- O domínio é o ativo mais importante do sistema.
- Arquitetura é uma consequência do negócio.
- Simplicidade é preferível à complexidade.
- Decisões devem privilegiar longevidade em vez de conveniência imediata.
- A documentação deve registrar o **porquê** das decisões, e não apenas o **como**.
- A evolução da arquitetura deve ocorrer de forma incremental e consciente.
- A arquitetura deve permanecer independente de tecnologias específicas.
- O conhecimento arquitetural é parte integrante do patrimônio do projeto.