# PASSO 1 — COMO O DOMÍNIO É PERSISTIDO?
## ENTREGA A — CURADORIA

### Objetivo

Definir os princípios que orientam a persistência do domínio do TEAR, estabelecendo **o que precisa ser preservado ao longo do tempo**, sem assumir qualquer tecnologia, banco de dados, framework ou mecanismo de armazenamento.

Esta seção não descreve tabelas, documentos ou estruturas físicas. Seu propósito é estabelecer a visão conceitual da persistência do domínio, mantendo a separação entre regras de negócio e infraestrutura, conforme os princípios de *Persistence Ignorance* do Domain-Driven Design.  [oai_citation:0‡Microsoft Press Store](https://www.microsoftpressstore.com/articles/article.aspx?p=3192407&utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Como o Domínio é Persistido?" deverá responder apenas às seguintes perguntas:

- Quais informações do domínio precisam permanecer ao longo do tempo?
- O que constitui o estado persistente do TEAR?
- O que deve ser preservado entre diferentes ciclos operacionais?
- O que pertence ao domínio e o que pertence à infraestrutura?
- Quais princípios orientam a persistência do modelo?

Esta seção não define:

- banco de dados;
- tabelas;
- coleções;
- documentos;
- SQL;
- ORM;
- migrações;
- índices físicos;
- estratégias de implementação.

---

# Conteúdo aprovado para preservação

## Persistência das Entidades

**Preservar.**

Toda Entidade do domínio possui identidade própria e seu estado deve ser preservado durante todo o seu ciclo de vida.

Inclui:

- Marca;
- Parceira;
- Competência;
- Colaboração Mensal;
- Pagamento.

---

## Persistência dos Agregados

**Preservar.**

Os Agregados devem ser persistidos respeitando seus limites de consistência.

Cada Aggregate Root representa o ponto de entrada para recuperação e atualização de seu estado.

---

## Persistência dos Value Objects

**Preservar.**

Objetos de Valor não possuem identidade própria.

Seu estado é persistido juntamente com a Entidade ou Agregado ao qual pertencem.

---

## Persistência do Histórico

**Preservar integralmente.**

O domínio mantém histórico permanente das operações relevantes.

Informações históricas não devem ser descartadas quando permanecerem relevantes para auditoria, rastreabilidade ou evolução do negócio.

---

## Persistência dos Eventos de Domínio

**Preservar.**

Os Eventos de Domínio representam fatos históricos e podem ser preservados como parte da memória operacional do sistema.

Sua existência independe da adoção de arquitetura orientada a eventos.

---

# Conteúdo adaptado

## Estado Persistente

Passa a ser definido como o conjunto de informações necessárias para reconstruir corretamente o estado do domínio em qualquer momento futuro.

---

## Recuperação

A recuperação dos dados passa a ser entendida como reconstrução do estado das Entidades e Agregados, e não como simples leitura de registros.

---

# Conteúdo removido

Não pertencem a esta seção:

- PostgreSQL;
- MySQL;
- MariaDB;
- MongoDB;
- Firebase;
- Supabase;
- Prisma;
- TypeORM;
- Sequelize;
- SQL;
- procedures;
- triggers;
- views;
- migrations;
- particionamento;
- cache;
- replicação;
- infraestrutura de armazenamento.

Esses assuntos pertencem ao modelo físico e à documentação de infraestrutura.

---

# Ajustes editoriais

## Independência tecnológica

A persistência deve ser descrita exclusivamente sob a ótica do domínio.

Nenhuma definição desta seção poderá depender de uma tecnologia específica.

---

## Persistência ≠ Banco de Dados

Persistir significa preservar o estado do domínio.

O mecanismo utilizado para isso é uma decisão arquitetural posterior.

---

## Integridade do Domínio

Toda estratégia de persistência deve preservar:

- identidade das Entidades;
- consistência dos Agregados;
- imutabilidade dos Value Objects;
- histórico do domínio;
- rastreabilidade dos Eventos de Domínio.

---

# Estrutura prevista para a documentação final

A seção "Como o Domínio é Persistido?" deverá conter apenas:

1. Conceito de Persistência
2. Estado Persistente do Domínio
3. Elementos Persistidos
4. Reconstrução do Estado
5. Separação entre Domínio e Infraestrutura
6. Princípios da Persistência

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Entidades | Preservar |
| Agregados | Preservar |
| Value Objects | Preservar |
| Histórico | Preservar |
| Eventos de Domínio | Preservar |
| Estado Persistente | Adaptar |
| Recuperação do Estado | Adaptar |
| Tecnologias de banco | Remover |
| Infraestrutura | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando a documentação definir claramente **o que precisa ser persistido no domínio do TEAR**, estabelecendo princípios independentes de qualquer tecnologia de armazenamento e preservando a separação entre modelo de domínio e infraestrutura.

# 1. COMO O DOMÍNIO É PERSISTIDO?

## Conceito de Persistência

No TEAR, persistir significa preservar o estado do domínio ao longo do tempo, garantindo que as informações relevantes do negócio possam ser recuperadas de forma íntegra, consistente e completa sempre que necessário.

A persistência existe para manter a continuidade da operação do programa de marketing de influência, permitindo que o estado das Entidades, Agregados e seus relacionamentos seja reconstruído independentemente da duração de um ciclo operacional.

A forma como essa preservação é implementada constitui uma decisão de infraestrutura e não faz parte do modelo de domínio. O domínio permanece independente dos mecanismos utilizados para armazenar seus dados, seguindo o princípio de *Persistence Ignorance*.  [oai_citation:0‡Microsoft Learn](https://learn.microsoft.com/en-us/archive/msdn-magazine/2009/june/the-unit-of-work-pattern-and-persistence-ignorance?utm_source=chatgpt.com)

---

# Estado Persistente do Domínio

O estado persistente do TEAR corresponde ao conjunto de informações necessárias para reconstruir corretamente o domínio em qualquer momento.

Esse estado compreende:

- a identidade das Entidades;
- os atributos das Entidades;
- os Objetos de Valor associados;
- os relacionamentos entre Entidades;
- os Agregados e seus limites de consistência;
- o histórico das operações relevantes;
- os Eventos de Domínio registrados durante a evolução do negócio.

O estado persistente representa a memória oficial do domínio.

---

# Elementos Persistidos

## Marca

A Marca possui identidade própria e seu estado deve permanecer preservado durante todo o ciclo de vida do sistema.

---

## Parceira

A Parceira mantém seu histórico de participação no programa, independentemente da quantidade de Competências ou Colaborações Mensais das quais participou.

---

## Competência

Cada Competência constitui um ciclo operacional permanente do domínio e deve permanecer disponível para consulta histórica.

---

## Colaboração Mensal

Toda Colaboração Mensal representa uma unidade operacional permanente.

Seu estado deve permanecer preservado mesmo após o encerramento da Competência correspondente.

---

## Snapshot Comercial

O Snapshot Comercial é persistido juntamente com sua Colaboração Mensal.

Após sua criação, seu conteúdo nunca deve ser alterado.

---

## Pagamento

Todo Pagamento deve preservar seu ciclo de vida completo, incluindo seus estados e sua relação com a Colaboração Mensal que lhe deu origem.

---

## Eventos de Domínio

Os Eventos de Domínio podem ser preservados como registro permanente da evolução do negócio.

Eles documentam acontecimentos relevantes e fortalecem a rastreabilidade do sistema.

---

## Histórico

O Histórico representa a memória operacional do TEAR.

Informações historicamente relevantes não devem ser descartadas quando continuarem necessárias para auditoria, consulta ou reconstrução do contexto de negócio.

---

# Reconstrução do Estado

Persistir dados não significa apenas armazenar informações.

O objetivo principal é permitir que qualquer Entidade ou Agregado possa ser reconstruído exatamente como se encontrava em determinado momento da operação.

Essa reconstrução deve preservar:

- identidade;
- relacionamentos;
- regras de negócio aplicáveis;
- estados do ciclo de vida;
- histórico associado.

---

# Separação entre Domínio e Infraestrutura

O domínio define **o que** precisa ser preservado.

A infraestrutura define **como** essa preservação será realizada.

Essa separação garante que mudanças de tecnologia não alterem o significado das Entidades, dos Agregados ou das regras de negócio.

O modelo de domínio permanece estável mesmo quando o mecanismo de persistência evolui ou é substituído.  [oai_citation:1‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design?utm_source=chatgpt.com)

---

# Princípios da Persistência

A persistência do domínio do TEAR segue os seguintes princípios:

- Toda Entidade possui identidade persistente.
- Todo Agregado deve preservar sua consistência ao ser armazenado e recuperado.
- Objetos de Valor são persistidos juntamente com a Entidade ou Agregado ao qual pertencem.
- O Histórico constitui patrimônio informacional do domínio.
- Eventos de Domínio representam fatos históricos que podem integrar permanentemente a memória operacional.
- O estado persistente deve permitir a reconstrução completa do domínio.
- O modelo de persistência não deve introduzir regras de negócio.
- O domínio permanece independente de bancos de dados, ORMs, formatos de armazenamento ou qualquer tecnologia de infraestrutura.

Esses princípios asseguram que a persistência sirva ao domínio, preservando sua integridade, rastreabilidade e evolução sem comprometer sua independência tecnológica.  [oai_citation:2‡Microsoft Learn](https://learn.microsoft.com/en-us/archive/msdn-magazine/2009/june/the-unit-of-work-pattern-and-persistence-ignorance?utm_source=chatgpt.com)

# PASSO 2 — QUAIS ESTRUTURAS ARMAZENAM CADA AGREGADO?
## ENTREGA A — CURADORIA

### Objetivo

Definir quais estruturas de persistência são responsáveis por armazenar cada Aggregate Root do domínio do TEAR, estabelecendo seus limites conceituais de armazenamento sem assumir qualquer modelo físico, banco de dados ou tecnologia específica.

Nesta documentação, o termo **Estrutura de Persistência** representa uma unidade lógica responsável por preservar um Agregado completo e consistente.

Não corresponde necessariamente a uma tabela, coleção, documento ou arquivo.

---

# Escopo desta seção

A seção "Quais Estruturas Armazenam Cada Agregado?" deverá responder apenas às seguintes perguntas:

- Quais Agregados possuem armazenamento próprio?
- Quais informações pertencem ao mesmo Agregado?
- Quais Objetos de Valor são armazenados juntamente com seu Agregado?
- Quais Entidades dependem do Aggregate Root?
- Quais limites de persistência devem ser respeitados?

Esta seção não define:

- tabelas;
- coleções;
- documentos;
- joins;
- chaves estrangeiras;
- normalização;
- índices físicos;
- estratégias de banco de dados.

---

# Conteúdo aprovado para preservação

## Estrutura de Persistência da Marca

**Preservar.**

Armazena o estado completo do Agregado Marca.

Inclui exclusivamente informações pertencentes à própria Marca.

---

## Estrutura de Persistência da Parceira

**Preservar.**

Armazena o estado completo do Agregado Parceira.

Inclui:

- identidade;
- dados cadastrais;
- informações permanentes;
- Objetos de Valor pertencentes à Parceira.

Não incorpora Colaborações Mensais nem Pagamentos.

---

## Estrutura de Persistência da Competência

**Preservar.**

Armazena o estado da Competência como ciclo operacional.

Mantém apenas informações próprias da Competência.

As Colaborações Mensais permanecem externas ao seu armazenamento, sendo apenas relacionadas a ela.

---

## Estrutura de Persistência da Colaboração Mensal

**Preservar integralmente.**

Representa o principal Agregado operacional do domínio.

Armazena:

- estado da colaboração;
- Snapshot Comercial;
- etapas operacionais;
- relacionamento com Marca;
- relacionamento com Parceira;
- relacionamento com Competência.

Todo o comportamento operacional concentra-se neste Agregado.

---

## Estrutura de Persistência do Pagamento

**Preservar.**

Armazena o ciclo financeiro associado a uma única Colaboração Mensal.

Inclui:

- estado financeiro;
- histórico financeiro;
- relacionamento com a Colaboração Mensal.

---

# Conteúdo adaptado

## Objetos de Valor

Passam a ser armazenados sempre dentro da estrutura de persistência do Agregado ao qual pertencem.

Nunca possuem armazenamento independente.

---

## Eventos de Domínio

Podem ser preservados juntamente com o Agregado que os originou ou em uma estrutura histórica específica, desde que sua associação com o Aggregate Root permaneça íntegra.

A decisão física será arquitetural.

---

# Conteúdo removido

Não pertencem a esta seção:

- tabelas SQL;
- documentos NoSQL;
- coleções MongoDB;
- schemas PostgreSQL;
- buckets;
- arquivos JSON;
- Redis;
- ORM;
- mapeamentos físicos;
- particionamento.

Esses elementos pertencem exclusivamente ao modelo físico de dados.

---

# Ajustes editoriais

## Uma estrutura por Aggregate Root

Cada Aggregate Root possui sua própria estrutura lógica de persistência.

Essa estrutura representa a unidade de consistência do domínio.

---

## Limites de Consistência

Nenhuma estrutura deve armazenar informações pertencentes ao núcleo de outro Agregado.

Os relacionamentos são preservados sem violar os limites entre Agregados.

---

## Independência Tecnológica

As estruturas descritas nesta seção representam conceitos do domínio.

Sua implementação poderá ocorrer em qualquer mecanismo de persistência.

---

# Estrutura prevista para a documentação final

A seção "Quais Estruturas Armazenam Cada Agregado?" deverá conter apenas:

1. Conceito de Estrutura de Persistência
2. Estruturas dos Agregados
3. Conteúdo de cada Estrutura
4. Limites entre Estruturas
5. Objetos de Valor
6. Princípios das Estruturas de Persistência

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Estrutura da Marca | Preservar |
| Estrutura da Parceira | Preservar |
| Estrutura da Competência | Preservar |
| Estrutura da Colaboração Mensal | Preservar |
| Estrutura do Pagamento | Preservar |
| Objetos de Valor | Adaptar |
| Eventos de Domínio | Adaptar |
| Estruturas físicas | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando cada Aggregate Root possuir uma única estrutura lógica de persistência claramente definida, respeitando seus limites de consistência, preservando seus Objetos de Valor e mantendo completa independência de qualquer tecnologia ou modelo físico de armazenamento. Essa abordagem está alinhada ao princípio de que cada Aggregate é a unidade de consistência e persistência do domínio em DDD. 

# 2. QUAIS ESTRUTURAS ARMAZENAM CADA AGREGADO?

## Conceito de Estrutura de Persistência

No domínio do TEAR, uma Estrutura de Persistência representa a unidade lógica responsável por preservar o estado completo de um Aggregate Root.

Cada estrutura reúne todas as informações necessárias para manter a consistência de um Agregado durante todo o seu ciclo de vida, permitindo sua recuperação integral sempre que necessário.

Uma Estrutura de Persistência não corresponde obrigatoriamente a uma tabela, documento, coleção ou qualquer outro mecanismo físico de armazenamento.

Ela representa exclusivamente um conceito do modelo de domínio. A implementação física dessa estrutura é uma decisão arquitetural posterior. A recomendação de tratar cada Aggregate como unidade de consistência e persistência está alinhada às práticas de Domain-Driven Design. 

---

# Estruturas dos Agregados

## Estrutura de Persistência da Marca

A Estrutura de Persistência da Marca preserva todas as informações pertencentes ao Agregado Marca.

Seu conteúdo compreende exclusivamente dados próprios da Marca, necessários para representar sua identidade e seu estado operacional.

Nenhuma informação pertencente a outros Agregados integra esta estrutura.

---

## Estrutura de Persistência da Parceira

A Estrutura de Persistência da Parceira preserva o estado completo de uma Parceira.

Ela reúne:

- identidade da Parceira;
- informações cadastrais;
- dados permanentes;
- Objetos de Valor pertencentes à Parceira.

Colaborações Mensais, Competências e Pagamentos não são armazenados dentro dessa estrutura, permanecendo relacionados por referência ao respectivo Agregado.

---

## Estrutura de Persistência da Competência

A Estrutura de Persistência da Competência preserva o ciclo operacional correspondente a uma Competência.

Seu conteúdo compreende apenas informações inerentes ao próprio período operacional.

As Colaborações Mensais pertencentes à Competência permanecem armazenadas em suas próprias estruturas de persistência.

---

## Estrutura de Persistência da Colaboração Mensal

A Colaboração Mensal constitui o principal Agregado operacional do domínio.

Sua Estrutura de Persistência reúne todas as informações necessárias para representar integralmente uma colaboração.

Essa estrutura compreende:

- identidade da Colaboração Mensal;
- relacionamento com a Marca;
- relacionamento com a Parceira;
- relacionamento com a Competência;
- Snapshot Comercial;
- estados do ciclo de vida;
- etapas operacionais;
- informações necessárias para execução da colaboração.

Toda evolução operacional da colaboração ocorre dentro dos limites desse Agregado.

---

## Estrutura de Persistência do Pagamento

A Estrutura de Persistência do Pagamento preserva o ciclo financeiro originado por uma Colaboração Mensal.

Seu conteúdo compreende:

- identidade do Pagamento;
- estados financeiros;
- histórico financeiro;
- relacionamento com a Colaboração Mensal correspondente.

Cada Pagamento pertence exclusivamente a uma única Colaboração Mensal.

---

# Conteúdo de cada Estrutura

Cada Estrutura de Persistência deve armazenar apenas informações pertencentes ao seu próprio Agregado.

Esse conteúdo pode incluir:

- atributos da Entidade raiz;
- Objetos de Valor;
- estados internos;
- regras necessárias para reconstrução do estado do Agregado;
- referências para outros Agregados quando houver relacionamento entre eles.

Nenhuma estrutura deve incorporar diretamente o estado interno de outro Agregado.

---

# Limites entre Estruturas

Cada Aggregate Root define um limite de consistência próprio.

As Estruturas de Persistência respeitam esses mesmos limites.

Isso significa que:

- cada Agregado possui uma única estrutura lógica de persistência;
- alterações em um Agregado não modificam diretamente a estrutura interna de outro;
- relacionamentos entre Agregados são preservados sem violar seus limites de responsabilidade;
- a consistência é garantida individualmente por cada Aggregate Root.

Esses limites reduzem o acoplamento entre os diferentes componentes do domínio e preservam sua autonomia. 

---

# Objetos de Valor

Objetos de Valor não possuem Estrutura de Persistência própria.

Seu estado é preservado juntamente com o Agregado ao qual pertencem.

Eles acompanham integralmente o ciclo de vida da Entidade ou Aggregate Root que os contém e não podem existir de forma independente.

---

# Princípios das Estruturas de Persistência

As Estruturas de Persistência do TEAR seguem os seguintes princípios:

- Cada Aggregate Root possui exatamente uma Estrutura de Persistência.
- Cada estrutura representa uma unidade lógica de consistência.
- Objetos de Valor são armazenados juntamente com seu Agregado.
- Estruturas distintas não compartilham o estado interno de outros Agregados.
- Os relacionamentos entre Agregados preservam seus limites de responsabilidade.
- A recuperação de um Agregado deve reconstruir integralmente seu estado.
- As Estruturas de Persistência independem de qualquer tecnologia, banco de dados ou mecanismo físico de armazenamento.
- O modelo de persistência existe para preservar a integridade do domínio e não para refletir decisões de infraestrutura.

# PASSO 3 — QUAIS ATRIBUTOS PERTENCEM A CADA ENTIDADE?
## ENTREGA A — CURADORIA

### Objetivo

Definir quais atributos compõem cada Entidade do domínio do TEAR, estabelecendo quais informações pertencem ao estado de cada uma delas.

Esta seção descreve exclusivamente **atributos do domínio**, ou seja, informações que possuem significado para o negócio e que participam da representação do estado das Entidades.

Não descreve tipos de dados, formatos físicos, colunas, nomes de banco de dados ou detalhes de implementação.

---

# Escopo desta seção

A seção "Quais Atributos Pertencem a Cada Entidade?" deverá responder apenas às seguintes perguntas:

- Quais informações compõem cada Entidade?
- Quais atributos identificam seu estado?
- Quais atributos são permanentes?
- Quais atributos representam estados do negócio?
- Quais atributos pertencem a Objetos de Valor?

Esta seção não define:

- tipos SQL;
- VARCHAR;
- INTEGER;
- UUID;
- tamanho de campos;
- NULL;
- DEFAULT;
- constraints físicas;
- nomes de colunas.

---

# Conteúdo aprovado para preservação

## Marca

**Preservar.**

A Marca deverá possuir apenas atributos inerentes ao seu estado de negócio.

Exemplos de categorias:

- identificação;
- informações institucionais;
- configurações do programa;
- estado operacional.

---

## Parceira

**Preservar integralmente.**

A Parceira deverá concentrar atributos relacionados à sua participação no programa.

Inclui categorias como:

- identidade;
- informações pessoais;
- contatos;
- localização;
- situação no programa;
- dados permanentes.

Não incorpora atributos da Colaboração Mensal.

---

## Competência

**Preservar.**

A Competência deverá possuir atributos relacionados ao período operacional.

Inclui:

- identificação;
- período;
- situação;
- datas relevantes.

---

## Colaboração Mensal

**Preservar integralmente.**

Constitui a Entidade com maior quantidade de atributos do domínio.

Inclui categorias como:

- identidade;
- relacionamentos;
- Snapshot Comercial;
- estados do fluxo;
- planejamento;
- produção;
- logística;
- encerramento.

---

## Pagamento

**Preservar.**

Deverá conter atributos relacionados exclusivamente ao ciclo financeiro.

Inclui:

- identificação;
- valor;
- situação financeira;
- datas relevantes;
- relacionamento com a Colaboração Mensal.

---

# Conteúdo adaptado

## Objetos de Valor

Os atributos pertencentes aos Value Objects permanecem agrupados conceitualmente dentro da Entidade que os contém.

Não serão tratados como atributos independentes do domínio.

---

## Estados

Estados do ciclo de vida continuam sendo atributos das Entidades.

Não constituem Entidades separadas.

---

# Conteúdo removido

Não pertencem a esta seção:

- nomes de colunas;
- nomes de tabelas;
- tipos SQL;
- formatos JSON;
- DTOs;
- classes ORM;
- schemas;
- APIs;
- serialização;
- validações técnicas.

Esses elementos pertencem ao modelo físico ou técnico.

---

# Ajustes editoriais

## Atributos de Negócio

Somente atributos que possuem significado para o domínio devem integrar esta documentação.

---

## Agrupamento Conceitual

Os atributos deverão ser apresentados agrupados por responsabilidade de negócio, facilitando sua compreensão e futura evolução.

---

## Independência Tecnológica

Os atributos devem permanecer válidos independentemente da forma como forem armazenados ou implementados.

---

# Estrutura prevista para a documentação final

A seção "Quais Atributos Pertencem a Cada Entidade?" deverá conter apenas:

1. Conceito de Atributo
2. Atributos da Marca
3. Atributos da Parceira
4. Atributos da Competência
5. Atributos da Colaboração Mensal
6. Atributos do Pagamento
7. Objetos de Valor
8. Princípios dos Atributos

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Atributos da Marca | Preservar |
| Atributos da Parceira | Preservar |
| Atributos da Competência | Preservar |
| Atributos da Colaboração Mensal | Preservar |
| Atributos do Pagamento | Preservar |
| Objetos de Valor | Adaptar |
| Estados | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando cada Entidade possuir seus atributos de negócio claramente definidos, organizados por responsabilidade e completamente independentes de qualquer representação física ou tecnológica. Os atributos devem representar exclusivamente o estado do domínio e refletir a Linguagem Ubíqua estabelecida para o TEAR, em conformidade com os princípios de modelagem de Entidades em Domain-Driven Design. 

# 3. QUAIS ATRIBUTOS PERTENCEM A CADA ENTIDADE?

## Conceito de Atributo

No domínio do TEAR, um atributo representa uma informação que descreve o estado de uma Entidade em determinado momento do seu ciclo de vida.

Os atributos expressam características relevantes para o negócio e permitem compreender, identificar e reconstruir corretamente o estado de cada Entidade.

Somente informações que possuem significado para o domínio devem ser consideradas atributos.

Aspectos relacionados à implementação, persistência física ou representação técnica não fazem parte desta definição. Em Domain-Driven Design, os atributos representam o estado da Entidade, enquanto sua identidade permanece estável ao longo do tempo. 

---

# Atributos da Marca

A Entidade **Marca** possui atributos relacionados à sua identidade institucional e ao funcionamento do programa de marketing de influência.

Esses atributos podem ser agrupados nas seguintes categorias:

- identificação da Marca;
- informações institucionais;
- identidade comercial;
- configurações do programa;
- situação operacional.

Esses atributos representam exclusivamente informações pertencentes à própria Marca.

---

# Atributos da Parceira

A Entidade **Parceira** concentra as informações permanentes referentes à participante do programa.

Seus atributos podem ser organizados nas seguintes categorias:

- identificação;
- informações pessoais;
- informações de contato;
- localização;
- informações de participação no programa;
- situação operacional;
- informações permanentes da Parceira.

Os atributos da Parceira descrevem exclusivamente seu estado próprio e não incorporam informações pertencentes às Colaborações Mensais.

---

# Atributos da Competência

A Entidade **Competência** representa um ciclo operacional do programa.

Seus atributos compreendem:

- identificação da Competência;
- período operacional;
- datas relevantes;
- situação da Competência;
- informações necessárias para caracterizar o ciclo correspondente.

Esses atributos permitem representar completamente o estado de uma Competência.

---

# Atributos da Colaboração Mensal

A **Colaboração Mensal** constitui a principal Entidade operacional do domínio e, por consequência, concentra o maior conjunto de atributos.

Esses atributos podem ser agrupados nas seguintes categorias:

- identificação;
- referências para Marca;
- referências para Parceira;
- referência para Competência;
- Snapshot Comercial;
- planejamento da colaboração;
- produção;
- logística;
- acompanhamento operacional;
- estados do ciclo de vida;
- encerramento da colaboração.

Esses atributos descrevem integralmente a evolução operacional de uma Colaboração Mensal.

---

# Atributos do Pagamento

A Entidade **Pagamento** representa a obrigação financeira originada por uma Colaboração Mensal.

Seus atributos podem ser agrupados nas seguintes categorias:

- identificação;
- informações financeiras;
- valor devido;
- situação financeira;
- datas relevantes;
- relacionamento com a Colaboração Mensal correspondente.

Esses atributos permitem representar todo o ciclo financeiro associado ao pagamento.

---

# Objetos de Valor

Os Objetos de Valor não constituem Entidades independentes e, portanto, seus atributos são incorporados à Entidade ou ao Agregado ao qual pertencem.

Eles complementam a descrição do estado da Entidade, preservando as características próprias dos conceitos que representam.

Sua existência depende integralmente da Entidade que os contém.

---

# Estados como Atributos

Os estados do ciclo de vida fazem parte do conjunto de atributos das Entidades.

Eles representam a situação atual de uma Entidade dentro de seu processo de evolução e podem ser alterados conforme a aplicação das regras de negócio.

Os estados não constituem Entidades independentes nem possuem ciclo de vida próprio.

---

# Princípios dos Atributos

Os atributos das Entidades do TEAR seguem os seguintes princípios:

- Todo atributo possui significado para o domínio.
- Os atributos descrevem exclusivamente o estado da Entidade à qual pertencem.
- Nenhum atributo deve representar informações pertencentes ao núcleo de outra Entidade.
- Objetos de Valor agrupam atributos relacionados a um mesmo conceito do domínio.
- Estados do ciclo de vida são tratados como atributos da Entidade.
- Os atributos devem permitir a reconstrução completa do estado da Entidade.
- A definição dos atributos independe de qualquer banco de dados, formato de armazenamento ou tecnologia de implementação.
- A organização dos atributos deve refletir a Linguagem Ubíqua e preservar a clareza do modelo de domínio.

# PASSO 4 — QUAIS VALUE OBJECTS SÃO INCORPORADOS?
## ENTREGA A — CURADORIA

### Objetivo

Definir quais Objetos de Valor (Value Objects) são incorporados às Entidades e Agregados do domínio do TEAR, estabelecendo como conceitos compostos do negócio são representados e preservados.

Esta seção identifica exclusivamente os Value Objects pertencentes ao modelo de domínio.

Não descreve sua implementação, serialização ou forma de armazenamento.

A modelagem por Value Objects permite agrupar atributos que representam um mesmo conceito do negócio, sem identidade própria e definidos exclusivamente por seus valores. Essa abordagem é um dos pilares do *Domain-Driven Design*. 

---

# Escopo desta seção

A seção "Quais Value Objects São Incorporados?" deverá responder apenas às seguintes perguntas:

- Quais conceitos do domínio são representados como Objetos de Valor?
- A quais Entidades ou Agregados cada Value Object pertence?
- Quais informações permanecem agrupadas?
- Quais conceitos não possuem identidade própria?
- Como os Value Objects participam da persistência do domínio?

Esta seção não define:

- classes;
- estruturas JSON;
- tabelas;
- colunas;
- serialização;
- mapeamentos ORM;
- formatos físicos;
- implementação.

---

# Conteúdo aprovado para preservação

## Snapshot Comercial

**Preservar integralmente.**

Constitui o principal Value Object do domínio.

Representa o conjunto imutável das condições comerciais existentes no momento da criação de uma Colaboração Mensal.

Permanece incorporado exclusivamente à Colaboração Mensal.

---

## Informações de Contato

**Preservar.**

Quando tratadas como um conceito único do negócio, devem permanecer agrupadas como Value Object pertencente à Parceira.

---

## Localização

**Preservar.**

As informações de localização da Parceira podem ser representadas por um único Value Object, mantendo coesão e significado próprio.

---

## Período

**Preservar.**

As informações que caracterizam uma Competência como intervalo operacional podem ser agrupadas em um Value Object pertencente à Competência.

---

# Conteúdo adaptado

## Informações Financeiras

Sempre que representarem um conceito indivisível do domínio, poderão constituir um Value Object pertencente ao Pagamento.

---

## Datas Operacionais

Datas relacionadas a um mesmo conceito operacional poderão permanecer agrupadas quando fizer sentido para o domínio.

---

# Conteúdo removido

Não pertencem a esta seção:

- tipos primitivos isolados;
- identificadores;
- chaves técnicas;
- IDs;
- UUIDs;
- timestamps técnicos;
- versões de registro;
- campos de infraestrutura;
- metadados de persistência.

Esses elementos não representam Objetos de Valor do domínio.

---

# Ajustes editoriais

## Imutabilidade

Todo Value Object deve ser tratado como imutável.

Qualquer alteração em seu conteúdo implica a criação de uma nova instância conceitual.

---

## Ausência de Identidade

Value Objects não possuem identidade própria.

Seu significado deriva exclusivamente dos valores que representam.

---

## Pertencimento

Todo Value Object pertence obrigatoriamente a uma Entidade ou Aggregate Root.

Não pode existir de forma independente no domínio.

---

## Independência Tecnológica

Os Value Objects devem ser descritos exclusivamente sob a ótica do domínio, permanecendo independentes de qualquer mecanismo de persistência ou implementação.

---

# Estrutura prevista para a documentação final

A seção "Quais Value Objects São Incorporados?" deverá conter apenas:

1. Conceito de Value Object
2. Value Objects da Parceira
3. Value Objects da Competência
4. Value Objects da Colaboração Mensal
5. Value Objects do Pagamento
6. Incorporação às Entidades
7. Princípios dos Value Objects

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Snapshot Comercial | Preservar |
| Informações de Contato | Preservar |
| Localização | Preservar |
| Período | Preservar |
| Informações Financeiras | Adaptar |
| Datas Operacionais | Adaptar |
| IDs e metadados técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os conceitos do domínio que não possuem identidade própria estiverem claramente definidos como Value Objects, associados às respectivas Entidades ou Agregados e descritos de forma independente de qualquer tecnologia de implementação ou persistência.

# 4. QUAIS VALUE OBJECTS SÃO INCORPORADOS?

## Conceito de Value Object

No domínio do TEAR, um Value Object representa um conceito do negócio definido exclusivamente pelos valores que o compõem.

Diferentemente das Entidades, os Value Objects não possuem identidade própria nem ciclo de vida independente.

Seu propósito é agrupar informações que, juntas, representam um único conceito do domínio, aumentando a expressividade do modelo e preservando sua consistência.

Todo Value Object é imutável. Sempre que seu conteúdo precisar ser alterado, um novo Value Object deverá substituir o anterior. Além disso, Value Objects existem apenas como parte de uma Entidade ou Aggregate Root, nunca de forma independente.  [oai_citation:0‡rcommon.com](https://rcommon.com/docs/domain-driven-design/value-objects?utm_source=chatgpt.com)

---

# Value Objects da Parceira

## Informações de Contato

A Parceira incorpora um Value Object responsável por representar suas informações de contato.

Esse objeto agrupa, de forma coesa, todos os dados utilizados para comunicação com a participante.

Seu significado decorre do conjunto das informações e não de cada atributo isoladamente.

---

## Localização

A Parceira incorpora um Value Object destinado a representar sua localização.

Esse objeto reúne todas as informações geográficas necessárias para caracterizar a localização da participante dentro do domínio.

A Localização não possui identidade própria e existe exclusivamente como parte da Parceira.

---

# Value Objects da Competência

## Período

A Competência incorpora um Value Object que representa seu período operacional.

Esse objeto descreve o intervalo temporal correspondente ao ciclo da Competência.

Seu objetivo é representar o conceito de período como uma unidade indivisível do domínio.

---

# Value Objects da Colaboração Mensal

## Snapshot Comercial

O Snapshot Comercial constitui o principal Value Object do domínio do TEAR.

Ele representa o conjunto imutável das condições comerciais existentes no momento da criação da Colaboração Mensal.

Após sua incorporação à Colaboração Mensal, seu conteúdo permanece inalterado durante todo o ciclo de vida da colaboração, garantindo a preservação do contexto histórico em que o acordo foi estabelecido.

O Snapshot Comercial não possui existência independente nem pode ser compartilhado entre diferentes Colaborações Mensais.

---

# Value Objects do Pagamento

## Informações Financeiras

O Pagamento pode incorporar um Value Object responsável por representar informações financeiras que constituem um único conceito do domínio.

Esse objeto agrupa valores relacionados ao compromisso financeiro sem introduzir identidade própria.

---

## Datas Operacionais

Quando diversas datas representarem um único conceito operacional, elas poderão ser agrupadas em um Value Object.

Esse agrupamento reduz a fragmentação do modelo e preserva a coesão entre informações que evoluem conjuntamente.

---

# Incorporação às Entidades

Todo Value Object pertence obrigatoriamente a uma Entidade ou Aggregate Root.

Sua existência depende integralmente da Entidade que o incorpora.

Consequentemente:

- não possui identidade própria;
- não possui ciclo de vida independente;
- não é recuperado isoladamente;
- acompanha integralmente o ciclo de vida da Entidade ou Agregado ao qual pertence;
- é persistido juntamente com seu Agregado.

Essa relação fortalece a consistência do modelo e evita a criação de conceitos artificiais com identidade própria.  [oai_citation:1‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/implement-value-objects?utm_source=chatgpt.com)

---

# Princípios dos Value Objects

Os Value Objects incorporados ao TEAR seguem os seguintes princípios:

- Todo Value Object representa um conceito do domínio definido por seus valores.
- Value Objects não possuem identidade própria.
- Dois Value Objects com os mesmos valores representam o mesmo conceito do domínio.
- Value Objects são imutáveis.
- Toda alteração em seu conteúdo implica a criação de um novo Value Object.
- Todo Value Object pertence obrigatoriamente a uma Entidade ou Aggregate Root.
- Value Objects são persistidos juntamente com a Entidade que os incorpora.
- A definição dos Value Objects independe de qualquer tecnologia, banco de dados ou mecanismo de persistência.
- A utilização de Value Objects reduz a complexidade do modelo e torna a Linguagem Ubíqua mais expressiva e consistente.

# PASSO 5 — QUAIS CARDINALIDADES EXISTEM?
## ENTREGA A — CURADORIA

### Objetivo

Definir as cardinalidades existentes entre as Entidades e Agregados do domínio do TEAR, estabelecendo quantas ocorrências de um conceito podem se relacionar com outro segundo as regras de negócio.

As cardinalidades representam restrições conceituais do domínio e descrevem os limites dos relacionamentos entre as Entidades.

Esta seção não descreve a implementação desses relacionamentos nem mecanismos de persistência.

---

# Escopo desta seção

A seção "Quais Cardinalidades Existem?" deverá responder apenas às seguintes perguntas:

- Quantas ocorrências de uma Entidade podem relacionar-se com outra?
- Quais relacionamentos são obrigatórios?
- Quais relacionamentos são opcionais?
- Quais relacionamentos são exclusivos?
- Quais limites de participação existem entre as Entidades?

Esta seção não define:

- chaves estrangeiras;
- tabelas associativas;
- joins;
- constraints SQL;
- índices;
- mapeamentos ORM;
- implementação física.

---

# Conteúdo aprovado para preservação

## Marca ↔ Competência

**Preservar.**

Uma Marca pode possuir diversas Competências ao longo de sua operação.

Cada Competência pertence exclusivamente a uma única Marca.

Cardinalidade conceitual:

**1 : N**

---

## Marca ↔ Colaboração Mensal

**Preservar.**

Uma Marca pode originar diversas Colaborações Mensais.

Cada Colaboração Mensal pertence exclusivamente a uma Marca.

Cardinalidade conceitual:

**1 : N**

---

## Parceira ↔ Colaboração Mensal

**Preservar integralmente.**

Uma Parceira pode participar de diversas Colaborações Mensais ao longo do tempo.

Cada Colaboração Mensal está associada a uma única Parceira.

Cardinalidade conceitual:

**1 : N**

---

## Competência ↔ Colaboração Mensal

**Preservar integralmente.**

Uma Competência pode reunir diversas Colaborações Mensais.

Cada Colaboração Mensal pertence exatamente a uma Competência.

Cardinalidade conceitual:

**1 : N**

---

## Colaboração Mensal ↔ Pagamento

**Preservar.**

Cada Colaboração Mensal origina um único Pagamento correspondente.

Cada Pagamento refere-se exclusivamente a uma Colaboração Mensal.

Cardinalidade conceitual:

**1 : 1**

---

## Colaboração Mensal ↔ Snapshot Comercial

**Preservar.**

Cada Colaboração Mensal incorpora exatamente um Snapshot Comercial.

Esse Snapshot pertence exclusivamente àquela Colaboração.

Cardinalidade conceitual:

**1 : 1 (composição)**

---

# Conteúdo adaptado

## Objetos de Valor

Os Value Objects não possuem cardinalidade própria.

Sua existência depende da cardinalidade da Entidade que os incorpora.

---

## Eventos de Domínio

Eventos relacionam-se ao Agregado que os originou, mas sua quantidade não possui limite conceitual.

Sua cardinalidade será descrita apenas sob a perspectiva histórica.

---

# Conteúdo removido

Não pertencem a esta seção:

- cardinalidades físicas;
- tabelas intermediárias;
- relacionamentos de banco;
- cascatas;
- políticas de exclusão;
- otimizações de persistência;
- mecanismos de carregamento.

Esses elementos pertencem ao modelo lógico ou físico de dados.

---

# Ajustes editoriais

## Cardinalidade como Regra de Negócio

Cada cardinalidade deve refletir uma regra do domínio, e não uma limitação técnica.

---

## Relacionamentos Binários

Os relacionamentos serão apresentados entre pares de Entidades ou Agregados, indicando claramente seus limites mínimo e máximo.

---

## Independência Tecnológica

As cardinalidades descritas nesta seção permanecem válidas independentemente da tecnologia utilizada para implementar o modelo.

---

# Estrutura prevista para a documentação final

A seção "Quais Cardinalidades Existem?" deverá conter apenas:

1. Conceito de Cardinalidade
2. Cardinalidades entre Agregados
3. Cardinalidades entre Entidades
4. Cardinalidades envolvendo Value Objects
5. Relacionamentos obrigatórios e opcionais
6. Princípios das Cardinalidades

---

# Resultado da curadoria

| Relacionamento | Decisão |
|---------------|----------|
| Marca → Competência | Preservar |
| Marca → Colaboração Mensal | Preservar |
| Parceira → Colaboração Mensal | Preservar |
| Competência → Colaboração Mensal | Preservar |
| Colaboração Mensal → Pagamento | Preservar |
| Colaboração Mensal → Snapshot Comercial | Preservar |
| Value Objects | Adaptar |
| Eventos de Domínio | Adaptar |
| Aspectos físicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todas as relações entre Entidades e Agregados tiverem suas cardinalidades definidas de forma clara, refletindo exclusivamente as regras de negócio do domínio, sem depender de qualquer tecnologia de persistência ou implementação. A cardinalidade deve expressar quantas instâncias podem participar de um relacionamento e constituir parte integrante do modelo conceitual do domínio.  [oai_citation:0‡ScienceDirect](https://www.sciencedirect.com/topics/computer-science/relationship-modeling?utm_source=chatgpt.com)

# 5. QUAIS CARDINALIDADES EXISTEM?

## Conceito de Cardinalidade

No domínio do TEAR, a cardinalidade define quantas ocorrências de uma Entidade ou Aggregate Root podem participar de um determinado relacionamento.

Ela representa uma regra de negócio do domínio e estabelece os limites de participação entre os conceitos que compõem o modelo.

As cardinalidades existem para preservar a consistência do domínio e não dependem da forma como os relacionamentos serão implementados em um mecanismo de persistência. Em modelos conceituais, a cardinalidade expressa a participação máxima (um ou muitos) e, quando necessário, a obrigatoriedade da relação.  [oai_citation:0‡pressbooks.uiowa.edu](https://pressbooks.uiowa.edu/fundamentalsofdatabasemanagement/chapter/chapter-2/?utm_source=chatgpt.com)

---

# Cardinalidades entre Agregados

## Marca → Competência

Uma Marca pode possuir diversas Competências ao longo de sua operação.

Cada Competência pertence exclusivamente a uma única Marca.

**Cardinalidade:**

**Marca (1) → (N) Competência**

---

## Marca → Colaboração Mensal

Uma Marca pode originar diversas Colaborações Mensais.

Cada Colaboração Mensal pertence exclusivamente a uma única Marca.

**Cardinalidade:**

**Marca (1) → (N) Colaboração Mensal**

---

## Parceira → Colaboração Mensal

Uma Parceira pode participar de diversas Colaborações Mensais durante sua permanência no programa.

Cada Colaboração Mensal está associada exclusivamente a uma única Parceira.

**Cardinalidade:**

**Parceira (1) → (N) Colaboração Mensal**

---

## Competência → Colaboração Mensal

Uma Competência reúne diversas Colaborações Mensais executadas durante seu período operacional.

Cada Colaboração Mensal pertence exatamente a uma Competência.

**Cardinalidade:**

**Competência (1) → (N) Colaboração Mensal**

---

## Colaboração Mensal → Pagamento

Cada Colaboração Mensal origina um único ciclo financeiro.

Cada Pagamento corresponde exclusivamente à Colaboração Mensal que lhe deu origem.

**Cardinalidade:**

**Colaboração Mensal (1) → (1) Pagamento**

---

# Cardinalidades envolvendo Value Objects

## Colaboração Mensal → Snapshot Comercial

Cada Colaboração Mensal incorpora exatamente um Snapshot Comercial.

Esse Snapshot pertence exclusivamente à Colaboração Mensal na qual foi criado.

**Cardinalidade:**

**Colaboração Mensal (1) → (1) Snapshot Comercial**

Como se trata de um Value Object, sua existência depende integralmente da Colaboração Mensal.

---

## Parceira → Informações de Contato

Cada Parceira incorpora um único conjunto de Informações de Contato.

Esse conjunto não possui existência independente.

**Cardinalidade:**

**Parceira (1) → (1) Informações de Contato**

---

## Parceira → Localização

Cada Parceira incorpora uma única Localização representando seu estado atual.

A Localização existe apenas como parte da Parceira.

**Cardinalidade:**

**Parceira (1) → (1) Localização**

---

## Competência → Período

Cada Competência incorpora exatamente um Período.

O Período não existe fora da Competência.

**Cardinalidade:**

**Competência (1) → (1) Período**

---

## Pagamento → Informações Financeiras

Cada Pagamento incorpora um único conjunto de Informações Financeiras.

Essas informações pertencem exclusivamente ao respectivo Pagamento.

**Cardinalidade:**

**Pagamento (1) → (1) Informações Financeiras**

---

# Relacionamentos Obrigatórios e Opcionais

O modelo de domínio estabelece os seguintes princípios de participação:

### Relacionamentos obrigatórios

- Toda Competência pertence a uma Marca.
- Toda Colaboração Mensal pertence a uma Marca.
- Toda Colaboração Mensal pertence a uma Competência.
- Toda Colaboração Mensal pertence a uma Parceira.
- Todo Pagamento pertence a uma Colaboração Mensal.
- Todo Snapshot Comercial pertence a uma Colaboração Mensal.

### Relacionamentos opcionais

O domínio não estabelece relacionamentos opcionais entre seus Aggregate Roots principais.

As relações fundamentais do ciclo operacional são obrigatórias para garantir a integridade do processo de colaboração.

---

# Princípios das Cardinalidades

As cardinalidades do TEAR seguem os seguintes princípios:

- Toda cardinalidade representa uma regra do domínio.
- Cada relacionamento possui limites claramente definidos.
- Aggregate Roots relacionam-se preservando seus limites de consistência.
- Value Objects possuem cardinalidade dependente da Entidade que os incorpora.
- Um Value Object nunca existe de forma independente.
- As cardinalidades independem da tecnologia utilizada para persistência.
- Os relacionamentos preservam a autonomia de cada Aggregate Root.
- As cardinalidades contribuem para a integridade e a clareza do modelo conceitual do domínio.

# PASSO 6 — QUAIS RESTRIÇÕES DE INTEGRIDADE DEVEM EXISTIR?
## ENTREGA A — CURADORIA

### Objetivo

Definir as restrições de integridade que devem ser permanentemente preservadas pelo domínio do TEAR.

As restrições de integridade representam regras de negócio que nunca podem ser violadas. Elas garantem que o domínio permaneça sempre em um estado válido, independentemente da tecnologia utilizada para sua implementação.

No contexto de Domain-Driven Design, essas restrições correspondem aos **invariantes do domínio**, cuja responsabilidade de proteção pertence aos Aggregate Roots.  [oai_citation:0‡InformIT](https://www.informit.com/articles/article.aspx?p=2020371&seqNum=2&utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Quais Restrições de Integridade Devem Existir?" deverá responder apenas às seguintes perguntas:

- Quais estados do domínio nunca podem ser inválidos?
- Quais regras devem permanecer verdadeiras em qualquer momento?
- Quais relacionamentos são obrigatórios?
- Quais informações não podem perder consistência?
- Quais invariantes devem ser preservados pelos Agregados?

Esta seção não define:

- CHECK constraints;
- FOREIGN KEY;
- UNIQUE;
- gatilhos;
- validações de interface;
- validações de API;
- regras de banco de dados;
- implementação técnica.

---

# Conteúdo aprovado para preservação

## Integridade das Entidades

**Preservar.**

Toda Entidade deve manter identidade única e estado válido durante todo o seu ciclo de vida.

---

## Integridade dos Agregados

**Preservar integralmente.**

Cada Aggregate Root é responsável por garantir que seu Agregado nunca entre em estado inconsistente.

Todas as alterações devem preservar seus invariantes.

---

## Integridade dos Relacionamentos

**Preservar.**

Os relacionamentos obrigatórios definidos pelo domínio devem permanecer válidos durante todo o ciclo de vida das Entidades.

---

## Integridade dos Value Objects

**Preservar.**

Todo Value Object deve permanecer completo, coerente e imutável.

Não pode existir parcialmente preenchido nem separado da Entidade que o incorpora.

---

## Integridade Histórica

**Preservar.**

Informações históricas relevantes não podem ser alteradas de forma a comprometer a rastreabilidade do domínio.

---

# Conteúdo adaptado

## Snapshot Comercial

Deve permanecer imutável após sua criação.

Sua integridade consiste em preservar exatamente o contexto comercial vigente no momento em que a Colaboração Mensal foi iniciada.

---

## Estados do Ciclo de Vida

As transições de estado devem respeitar exclusivamente as regras do domínio.

Estados inválidos ou incompatíveis não podem ser alcançados.

---

# Conteúdo removido

Não pertencem a esta seção:

- constraints SQL;
- índices únicos;
- validações HTML;
- validações JavaScript;
- validações REST;
- regras ORM;
- serialização;
- infraestrutura de persistência.

Esses mecanismos implementam restrições, mas não definem as restrições do domínio.

---

# Ajustes editoriais

## Invariantes de Negócio

Toda restrição descrita nesta seção deverá representar uma regra permanente do negócio.

Não serão documentadas validações temporárias ou operacionais.

---

## Independência Tecnológica

As restrições deverão permanecer válidas independentemente da linguagem, framework ou banco de dados utilizados.

---

## Responsabilidade dos Agregados

Sempre que uma restrição envolver o estado interno de um Agregado, sua preservação será responsabilidade exclusiva do respectivo Aggregate Root.

---

# Estrutura prevista para a documentação final

A seção "Quais Restrições de Integridade Devem Existir?" deverá conter apenas:

1. Conceito de Restrição de Integridade
2. Integridade das Entidades
3. Integridade dos Agregados
4. Integridade dos Relacionamentos
5. Integridade dos Value Objects
6. Integridade Histórica
7. Princípios das Restrições de Integridade

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Integridade das Entidades | Preservar |
| Integridade dos Agregados | Preservar |
| Integridade dos Relacionamentos | Preservar |
| Integridade dos Value Objects | Preservar |
| Integridade Histórica | Preservar |
| Snapshot Comercial | Adaptar |
| Estados do Ciclo de Vida | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todas as restrições permanentes do domínio estiverem claramente identificadas como invariantes de negócio, definindo os estados válidos das Entidades, Agregados, relacionamentos e Objetos de Valor, sem depender de qualquer mecanismo técnico de implementação. Os Aggregate Roots serão reconhecidos como responsáveis por garantir essas invariantes e impedir que o domínio assuma estados inconsistentes.  [oai_citation:1‡InformIT](https://www.informit.com/articles/article.aspx?p=2020371&seqNum=2&utm_source=chatgpt.com)

# 6. QUAIS RESTRIÇÕES DE INTEGRIDADE DEVEM EXISTIR?

## Conceito de Restrição de Integridade

No domínio do TEAR, uma Restrição de Integridade representa uma regra permanente do negócio que deve permanecer verdadeira durante todo o ciclo de vida do sistema.

Essas restrições definem os estados válidos do domínio e impedem que Entidades, Agregados ou Objetos de Valor assumam condições inconsistentes.

No contexto de Domain-Driven Design, essas regras são conhecidas como **invariantes do domínio** e sua preservação é responsabilidade do respectivo Aggregate Root. Uma Entidade nunca deve existir em estado inválido.  [oai_citation:0‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

---

# Integridade das Entidades

Toda Entidade do domínio deve preservar sua identidade e permanecer em um estado válido durante todo o seu ciclo de vida.

Isso significa que:

- toda Entidade possui identidade única;
- toda Entidade representa um conceito válido do domínio;
- nenhuma Entidade pode existir parcialmente definida;
- alterações em seus atributos devem preservar sua consistência interna;
- a identidade da Entidade permanece estável durante toda sua existência.

---

# Integridade dos Agregados

Cada Aggregate Root é responsável por garantir a integridade de seu próprio Agregado.

Nenhuma alteração pode deixar o Agregado em estado inconsistente.

Como consequência:

- todas as regras internas do Agregado devem permanecer verdadeiras após qualquer operação;
- alterações devem preservar os limites de consistência definidos para o Agregado;
- nenhum objeto interno pode violar os invariantes estabelecidos;
- a consistência do Agregado deve ser garantida antes de qualquer mudança ser considerada concluída.  [oai_citation:1‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

---

# Integridade dos Relacionamentos

Os relacionamentos definidos pelo domínio devem permanecer coerentes durante todo o ciclo de vida das Entidades.

Assim:

- toda Colaboração Mensal pertence a uma única Marca;
- toda Colaboração Mensal pertence a uma única Competência;
- toda Colaboração Mensal pertence a uma única Parceira;
- todo Pagamento pertence exclusivamente à Colaboração Mensal que o originou;
- nenhuma relação obrigatória pode ser perdida enquanto a Entidade permanecer válida.

Essas restrições preservam a coerência estrutural do domínio.

---

# Integridade dos Value Objects

Todo Value Object deve permanecer íntegro durante toda sua existência.

Isso implica que:

- seu conteúdo representa um único conceito do domínio;
- seus valores permanecem coerentes entre si;
- sua identidade deriva exclusivamente de seus valores;
- ele não pode existir de forma independente;
- sua imutabilidade deve ser preservada.

Sempre que um Value Object precisar ser alterado, um novo objeto deverá representar o novo estado.

---

# Integridade Histórica

O domínio do TEAR preserva a integridade de suas informações históricas.

Dessa forma:

- registros históricos permanecem rastreáveis;
- fatos relevantes do domínio não são descaracterizados;
- a sequência histórica das operações permanece coerente;
- consultas futuras devem reconstruir corretamente o contexto operacional.

A integridade histórica garante que o domínio mantenha sua memória operacional ao longo do tempo.

---

# Snapshot Comercial

O Snapshot Comercial representa o contexto comercial vigente no momento da criação de uma Colaboração Mensal.

Após sua incorporação ao Agregado:

- seu conteúdo torna-se permanente;
- seu significado histórico permanece preservado;
- alterações posteriores nas condições comerciais da Marca não modificam o Snapshot existente.

Essa restrição assegura que decisões futuras possam ser compreendidas dentro do contexto em que foram originalmente estabelecidas.

---

# Estados do Ciclo de Vida

Os estados do ciclo de vida das Entidades devem evoluir exclusivamente conforme as regras do domínio.

Como consequência:

- toda transição deve partir de um estado válido;
- toda transição deve resultar em outro estado válido;
- estados incompatíveis não podem coexistir;
- não é permitido alcançar estados proibidos pelo domínio.

As restrições de transição preservam a consistência operacional do TEAR.

---

# Princípios das Restrições de Integridade

As restrições de integridade do TEAR seguem os seguintes princípios:

- Toda restrição representa uma regra permanente do negócio.
- Toda Entidade deve existir apenas em estado válido.
- Cada Aggregate Root é responsável por proteger seus próprios invariantes.
- Os relacionamentos obrigatórios devem permanecer íntegros durante todo o ciclo de vida das Entidades.
- Value Objects permanecem completos, coerentes e imutáveis.
- O Snapshot Comercial preserva permanentemente o contexto histórico da Colaboração Mensal.
- O histórico do domínio deve permanecer íntegro e rastreável.
- Toda mudança de estado deve preservar a consistência do domínio.
- As restrições de integridade independem de banco de dados, linguagem, framework ou mecanismo de persistência.
- A implementação técnica existe para cumprir essas restrições; ela não as define.

# PASSO 7 — QUAIS CAMPOS SÃO OBRIGATÓRIOS?
## ENTREGA A — CURADORIA

### Objetivo

Definir quais campos são obrigatórios para que cada Entidade, Aggregate Root e Value Object represente um estado válido do domínio do TEAR.

Um campo obrigatório é toda informação cuja ausência impede que um conceito do domínio exista de forma íntegra e consistente.

Nesta seção, obrigatoriedade significa uma exigência do negócio, e não uma restrição técnica de banco de dados, interface ou API. Em Domain-Driven Design, a obrigatoriedade decorre dos invariantes do domínio e deve ser garantida pelo próprio modelo de domínio.  [oai_citation:0‡DZF Web](https://dzfweb.gitbooks.io/microsoft-microservices-book/content/microservice-ddd-cqrs-patterns/domain-model-layer-validations.html?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Quais Campos São Obrigatórios?" deverá responder apenas às seguintes perguntas:

- Quais informações são indispensáveis para cada Entidade?
- Quais campos devem existir para preservar os invariantes do domínio?
- Quais campos podem ser opcionais?
- Em que momento um campo passa a ser obrigatório?
- Como a obrigatoriedade preserva a integridade do modelo?

Esta seção não define:

- NULL ou NOT NULL;
- constraints SQL;
- validações de formulário;
- validações de API;
- obrigatoriedade de interface;
- formatos de armazenamento;
- implementação técnica.

---

# Conteúdo aprovado para preservação

## Campos obrigatórios da Marca

**Preservar.**

A Marca deve possuir todos os campos necessários para representar sua identidade e seu estado operacional.

Sem essas informações, a Marca não constitui uma Entidade válida do domínio.

---

## Campos obrigatórios da Parceira

**Preservar integralmente.**

A Parceira deve possuir todos os campos indispensáveis para sua identificação e participação no programa.

Campos complementares poderão existir, mas não interferem na validade da Entidade.

---

## Campos obrigatórios da Competência

**Preservar.**

A Competência deve conter as informações mínimas necessárias para caracterizar um ciclo operacional.

Sem essas informações, não existe Competência válida.

---

## Campos obrigatórios da Colaboração Mensal

**Preservar integralmente.**

A Colaboração Mensal deve possuir todos os campos necessários para representar corretamente uma colaboração dentro do domínio.

Sua criação depende da presença de todas as informações essenciais definidas pelas regras de negócio.

---

## Campos obrigatórios do Pagamento

**Preservar.**

O Pagamento deve conter todas as informações indispensáveis para representar um compromisso financeiro válido.

---

# Conteúdo adaptado

## Value Objects

Os campos obrigatórios dos Value Objects decorrem do conceito que representam.

Um Value Object incompleto não constitui uma representação válida do domínio.

---

## Evolução do Ciclo de Vida

Alguns campos poderão tornar-se obrigatórios apenas em determinados estados da Entidade.

A obrigatoriedade poderá variar conforme a evolução do ciclo de vida, desde que respeite os invariantes do domínio.

---

# Conteúdo removido

Não pertencem a esta seção:

- obrigatoriedade de interface;
- validações HTML;
- validações JavaScript;
- campos obrigatórios da API;
- DTOs;
- formulários;
- banco de dados;
- serialização.

Esses aspectos pertencem às camadas de infraestrutura e apresentação.

---

# Ajustes editoriais

## Obrigatoriedade como Regra de Negócio

Todo campo obrigatório deverá existir porque o domínio necessita daquela informação para manter um conceito válido.

Jamais por exigência tecnológica.

---

## Estado Válido

Uma Entidade somente poderá existir quando todos os seus campos obrigatórios estiverem presentes conforme as regras do domínio.

---

## Independência Tecnológica

A obrigatoriedade dos campos permanece válida independentemente da linguagem, framework, banco de dados ou mecanismo de persistência adotado.

---

# Estrutura prevista para a documentação final

A seção "Quais Campos São Obrigatórios?" deverá conter apenas:

1. Conceito de Campo Obrigatório
2. Campos Obrigatórios da Marca
3. Campos Obrigatórios da Parceira
4. Campos Obrigatórios da Competência
5. Campos Obrigatórios da Colaboração Mensal
6. Campos Obrigatórios do Pagamento
7. Campos Obrigatórios dos Value Objects
8. Princípios dos Campos Obrigatórios

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Campos obrigatórios da Marca | Preservar |
| Campos obrigatórios da Parceira | Preservar |
| Campos obrigatórios da Competência | Preservar |
| Campos obrigatórios da Colaboração Mensal | Preservar |
| Campos obrigatórios do Pagamento | Preservar |
| Campos obrigatórios dos Value Objects | Adaptar |
| Obrigatoriedade por estado | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todas as Entidades, Agregados e Value Objects tiverem seus campos obrigatórios definidos exclusivamente sob a ótica do domínio, garantindo que nenhum objeto possa existir em estado inválido e preservando os invariantes de negócio independentemente de qualquer tecnologia de implementação.  [oai_citation:1‡DZF Web](https://dzfweb.gitbooks.io/microsoft-microservices-book/content/microservice-ddd-cqrs-patterns/domain-model-layer-validations.html?utm_source=chatgpt.com)

# 7. QUAIS CAMPOS SÃO OBRIGATÓRIOS?

## Conceito de Campo Obrigatório

No domínio do TEAR, um campo obrigatório é toda informação indispensável para que uma Entidade, Aggregate Root ou Value Object represente um conceito válido do negócio.

A obrigatoriedade de um campo decorre das regras do domínio e de seus invariantes, e não de restrições impostas por banco de dados, interfaces ou APIs.

Uma Entidade somente pode existir quando todos os campos necessários para caracterizar seu estado de negócio estiverem presentes. Em Domain-Driven Design, cabe ao próprio modelo de domínio impedir a existência de objetos em estado inválido.  [oai_citation:0‡DZF Web](https://dzfweb.gitbooks.io/microsoft-microservices-book/content/microservice-ddd-cqrs-patterns/domain-model-layer-validations.html?utm_source=chatgpt.com)

---

# Campos Obrigatórios da Marca

Para representar corretamente uma Marca no domínio do TEAR, são obrigatórias informações que permitam identificar sua existência e seu papel no programa.

Esses campos pertencem às seguintes categorias:

- identificação da Marca;
- informações institucionais;
- identidade comercial;
- situação operacional.

Sem essas informações, não existe uma Marca válida dentro do domínio.

---

# Campos Obrigatórios da Parceira

A Parceira somente pode integrar o programa quando possuir todas as informações mínimas necessárias para sua identificação e participação.

São obrigatórios campos pertencentes às seguintes categorias:

- identificação da Parceira;
- informações pessoais essenciais;
- informações de contato;
- localização;
- situação da participação no programa.

Informações complementares podem existir, mas sua ausência não invalida a existência da Entidade.

---

# Campos Obrigatórios da Competência

Toda Competência deve conter as informações necessárias para caracterizar um ciclo operacional.

São obrigatórios campos pertencentes às categorias:

- identificação da Competência;
- período operacional;
- situação da Competência.

Esses campos permitem distinguir uma Competência das demais e representar corretamente seu ciclo de vida.

---

# Campos Obrigatórios da Colaboração Mensal

A Colaboração Mensal representa a principal unidade operacional do domínio.

Sua criação depende da presença das informações essenciais que caracterizam uma colaboração válida.

São obrigatórios campos pertencentes às seguintes categorias:

- identificação da Colaboração Mensal;
- referência para a Marca;
- referência para a Parceira;
- referência para a Competência;
- Snapshot Comercial;
- situação inicial da colaboração.

Esses campos garantem que a Colaboração Mensal possa ser acompanhada durante todo o seu ciclo de vida.

---

# Campos Obrigatórios do Pagamento

Todo Pagamento deve possuir as informações mínimas necessárias para representar um compromisso financeiro válido.

São obrigatórios campos pertencentes às seguintes categorias:

- identificação do Pagamento;
- referência para a Colaboração Mensal;
- informações financeiras essenciais;
- situação financeira.

Sem essas informações, o domínio não reconhece a existência de um Pagamento válido.

---

# Campos Obrigatórios dos Value Objects

Todo Value Object deve possuir todos os atributos necessários para representar integralmente o conceito do domínio ao qual corresponde.

Um Value Object não pode existir:

- parcialmente preenchido;
- incompleto;
- inconsistente;
- separado da Entidade que o incorpora.

Caso qualquer informação essencial esteja ausente, o Value Object deixa de representar corretamente o conceito de negócio correspondente.

---

# Obrigatoriedade ao Longo do Ciclo de Vida

Determinados campos podem tornar-se obrigatórios apenas em fases específicas do ciclo de vida de uma Entidade.

Nesses casos:

- a obrigatoriedade depende do estado atual da Entidade;
- novos campos passam a ser exigidos conforme a evolução do processo de negócio;
- nenhuma transição de estado pode resultar em uma Entidade incompleta ou inconsistente.

Essa abordagem preserva os invariantes do domínio durante toda a evolução do ciclo de vida.  [oai_citation:1‡Protean](https://docs.proteanhq.com/guides/domain-behavior/invariants/?utm_source=chatgpt.com)

---

# Princípios dos Campos Obrigatórios

Os campos obrigatórios do TEAR seguem os seguintes princípios:

- Todo campo obrigatório representa uma necessidade do negócio.
- Nenhuma Entidade pode existir sem seus campos essenciais.
- Todo Aggregate Root garante a presença dos campos exigidos por seus invariantes.
- Value Objects devem possuir todos os atributos necessários para representar corretamente seu conceito.
- A obrigatoriedade dos campos pode evoluir conforme o ciclo de vida da Entidade.
- Campos opcionais complementam o modelo, mas não definem sua validade.
- A definição dos campos obrigatórios independe de banco de dados, linguagem, framework ou mecanismo de persistência.
- A implementação técnica deve respeitar as exigências do domínio, nunca defini-las.

# PASSO 8 — QUAIS CAMPOS SÃO HISTÓRICOS?
## ENTREGA A — CURADORIA

### Objetivo

Definir quais informações do domínio do TEAR possuem natureza histórica e, portanto, devem ser preservadas ao longo do tempo para manter a memória operacional, a rastreabilidade e a compreensão da evolução do negócio.

Um campo histórico representa uma informação cujo valor permanece relevante mesmo após mudanças no estado atual da Entidade.

Esta seção identifica exclusivamente campos históricos do domínio, sem definir mecanismos técnicos de auditoria, versionamento ou armazenamento. A preservação do histórico é um padrão amplamente utilizado em sistemas de negócio para manter a evolução dos objetos e permitir a reconstrução de estados anteriores.  [oai_citation:0‡CiteSeerX](https://citeseerx.ist.psu.edu/document?doi=f1a63fc85c5cfed3db1a3b72631066ffecd0652e&repid=rep1&type=pdf&utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Quais Campos São Históricos?" deverá responder apenas às seguintes perguntas:

- Quais informações devem ser preservadas permanentemente?
- Quais campos representam fatos históricos do domínio?
- Quais informações podem mudar sem apagar seu histórico?
- Quais dados permitem reconstruir o contexto operacional de uma Entidade?
- Quais informações pertencem à memória permanente do domínio?

Esta seção não define:

- logs técnicos;
- auditoria de banco de dados;
- versionamento de registros;
- tabelas de histórico;
- trilhas de auditoria;
- mecanismos de backup;
- implementação de eventos.

---

# Conteúdo aprovado para preservação

## Snapshot Comercial

**Preservar integralmente.**

Representa o principal conjunto de campos históricos do domínio.

As condições comerciais registradas na criação da Colaboração Mensal permanecem preservadas durante todo o seu ciclo de vida, mesmo que a política comercial da Marca seja alterada posteriormente.

---

## Estados da Colaboração Mensal

**Preservar.**

As mudanças relevantes no ciclo de vida da Colaboração Mensal constituem parte da memória operacional do domínio.

Seu histórico permite compreender a evolução da colaboração.

---

## Pagamento

**Preservar.**

As informações que registram a evolução do ciclo financeiro devem permanecer preservadas.

O histórico financeiro integra permanentemente a memória da Colaboração Mensal.

---

## Competências Encerradas

**Preservar.**

As Competências encerradas permanecem disponíveis para consulta histórica e análise da evolução do programa.

---

## Participação da Parceira

**Preservar.**

O histórico de participação da Parceira nas diferentes Competências e Colaborações Mensais constitui patrimônio informacional do domínio.

---

# Conteúdo adaptado

## Datas Operacionais

Datas relevantes tornam-se históricas após a ocorrência do evento correspondente.

Enquanto representam eventos futuros ou correntes, permanecem operacionais.

---

## Estados Operacionais

Os estados atuais não são históricos por definição.

Tornam-se históricos quando substituídos por novos estados ao longo do ciclo de vida da Entidade.

---

# Conteúdo removido

Não pertencem a esta seção:

- logs de infraestrutura;
- timestamps técnicos;
- campos de auditoria técnica;
- identificadores de transação;
- logs de aplicação;
- versionamento de banco de dados;
- metadados de persistência.

Esses elementos pertencem à infraestrutura e não ao modelo de domínio.

---

# Ajustes editoriais

## Histórico como Fato de Negócio

Somente informações que representam fatos relevantes do negócio devem ser classificadas como históricas.

---

## Imutabilidade do Histórico

Uma vez incorporada ao histórico do domínio, uma informação não deve perder seu significado nem ser alterada de forma a comprometer sua rastreabilidade.

---

## Memória Operacional

Os campos históricos existem para preservar a memória do negócio e permitir a reconstrução do contexto em que decisões e operações ocorreram.

---

## Independência Tecnológica

A definição dos campos históricos independe da tecnologia utilizada para armazená-los ou recuperá-los.

---

# Estrutura prevista para a documentação final

A seção "Quais Campos São Históricos?" deverá conter apenas:

1. Conceito de Campo Histórico
2. Campos Históricos da Colaboração Mensal
3. Campos Históricos do Pagamento
4. Campos Históricos da Competência
5. Campos Históricos da Parceira
6. Princípios dos Campos Históricos

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Snapshot Comercial | Preservar |
| Estados da Colaboração Mensal | Preservar |
| Histórico do Pagamento | Preservar |
| Competências Encerradas | Preservar |
| Histórico da Participação da Parceira | Preservar |
| Datas Operacionais | Adaptar |
| Estados Operacionais | Adaptar |
| Aspectos técnicos de auditoria | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os campos que representam fatos permanentes do negócio estiverem claramente identificados como históricos, permitindo preservar a memória operacional, reconstruir estados passados e manter a rastreabilidade do domínio, sem depender de mecanismos técnicos de auditoria, versionamento ou persistência.  [oai_citation:1‡CiteSeerX](https://citeseerx.ist.psu.edu/document?doi=f1a63fc85c5cfed3db1a3b72631066ffecd0652e&repid=rep1&type=pdf&utm_source=chatgpt.com)

# 8. QUAIS CAMPOS SÃO HISTÓRICOS?

## Conceito de Campo Histórico

No domínio do TEAR, um Campo Histórico representa uma informação que preserva um fato ocorrido durante a evolução do negócio.

Diferentemente dos campos que representam apenas o estado atual de uma Entidade, os campos históricos registram acontecimentos relevantes que permanecem importantes mesmo após mudanças posteriores.

Esses campos permitem reconstruir o contexto operacional, compreender decisões tomadas anteriormente e preservar a memória do domínio ao longo do tempo. A preservação de estados anteriores e fatos relevantes é uma prática consolidada em modelos de domínio que exigem rastreabilidade e histórico de negócio.  [oai_citation:0‡CiteSeerX](https://citeseerx.ist.psu.edu/document?doi=f1a63fc85c5cfed3db1a3b72631066ffecd0652e&repid=rep1&type=pdf&utm_source=chatgpt.com)

---

# Campos Históricos da Colaboração Mensal

A Colaboração Mensal concentra a maior parte das informações históricas do domínio.

Constituem campos históricos pertencentes à Colaboração Mensal as seguintes categorias:

- Snapshot Comercial utilizado na criação da colaboração;
- histórico das transições do ciclo de vida;
- registro das etapas operacionais concluídas;
- datas correspondentes aos marcos relevantes da colaboração;
- informações que permitam reconstruir o contexto em que a colaboração ocorreu.

Esses campos preservam permanentemente a evolução da colaboração, mesmo após seu encerramento.

---

## Snapshot Comercial

O Snapshot Comercial representa o principal conjunto de campos históricos do TEAR.

Seu conteúdo registra as condições comerciais vigentes no momento da criação da Colaboração Mensal.

Após esse momento:

- seu conteúdo permanece imutável;
- alterações posteriores nas políticas comerciais não modificam o Snapshot registrado;
- o Snapshot continua representando fielmente o contexto histórico original.

Sua preservação garante que decisões futuras possam ser analisadas considerando as condições existentes quando a colaboração foi iniciada.

---

## Histórico dos Estados

Cada mudança relevante de estado da Colaboração Mensal integra sua memória operacional.

Esses registros permitem compreender:

- a sequência de evolução da colaboração;
- os marcos relevantes do processo;
- o estado correspondente a cada etapa do ciclo de vida.

O histórico dos estados complementa a representação da evolução da colaboração sem substituir seu estado atual.

---

# Campos Históricos do Pagamento

O Pagamento preserva permanentemente as informações relacionadas ao seu ciclo financeiro.

Constituem campos históricos:

- evolução do estado financeiro;
- datas relevantes do processo financeiro;
- registros que caracterizam a conclusão das etapas financeiras.

Esses campos permitem compreender integralmente a evolução financeira da Colaboração Mensal correspondente.

---

# Campos Históricos da Competência

A Competência mantém informações históricas referentes aos ciclos operacionais concluídos.

Após seu encerramento, permanecem preservados:

- período correspondente;
- situação final da Competência;
- informações necessárias para identificar aquele ciclo operacional.

Competências encerradas continuam compondo a memória permanente do domínio.

---

# Campos Históricos da Parceira

A Parceira preserva permanentemente seu histórico de participação no programa.

Esse histórico compreende informações referentes às diferentes Colaborações Mensais e Competências das quais participou ao longo do tempo.

Esses registros permitem reconstruir a trajetória da Parceira dentro do domínio, independentemente de sua situação operacional atual.

---

# Princípios dos Campos Históricos

Os campos históricos do TEAR seguem os seguintes princípios:

- Todo campo histórico representa um fato relevante do negócio.
- Informações históricas preservam a memória operacional do domínio.
- O Snapshot Comercial permanece permanentemente imutável após sua criação.
- O histórico das Colaborações Mensais deve permitir reconstruir sua evolução.
- O histórico financeiro preserva a evolução dos Pagamentos.
- Competências encerradas permanecem disponíveis para consulta histórica.
- O histórico de participação da Parceira constitui parte permanente do domínio.
- Campos históricos independem da tecnologia utilizada para armazenamento.
- A preservação do histórico garante rastreabilidade, auditabilidade e compreensão da evolução do negócio sem depender de mecanismos técnicos específicos.  [oai_citation:1‡CiteSeerX](https://citeseerx.ist.psu.edu/document?doi=f1a63fc85c5cfed3db1a3b72631066ffecd0652e&repid=rep1&type=pdf&utm_source=chatgpt.com)

# PASSO 9 — QUAIS ÍNDICES CONCEITUAIS EXISTEM?
## ENTREGA A — CURADORIA

### Objetivo

Definir quais Índices Conceituais existem no domínio do TEAR para permitir a localização, identificação, agrupamento e recuperação lógica das informações do negócio.

Um Índice Conceitual representa um critério de organização utilizado pelo domínio para localizar ou agrupar Entidades e Agregados segundo conceitos relevantes do negócio.

Nesta seção, índice não significa índice de banco de dados, mecanismo de otimização ou estrutura física de busca. Trata-se exclusivamente de uma classificação conceitual do domínio, independente de qualquer tecnologia de persistência. Modelos conceituais organizam informações segundo critérios de negócio antes de qualquer decisão lógica ou física de implementação.  [oai_citation:0‡ScienceDirect](https://www.sciencedirect.com/topics/computer-science/conceptual-data-model?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Quais Índices Conceituais Existem?" deverá responder apenas às seguintes perguntas:

- Quais critérios permitem localizar Entidades no domínio?
- Quais atributos funcionam como referências conceituais?
- Quais agrupamentos fazem sentido para o negócio?
- Quais informações são naturalmente utilizadas para consulta?
- Quais referências estruturam a navegação pelo domínio?

Esta seção não define:

- índices SQL;
- índices compostos;
- índices B-Tree;
- índices Hash;
- mecanismos de busca;
- otimizações de consulta;
- estratégias de banco de dados;
- estruturas físicas de indexação.

---

# Conteúdo aprovado para preservação

## Índice por Marca

**Preservar.**

A Marca constitui um dos principais critérios conceituais de organização do domínio.

Diversas consultas e agrupamentos do negócio são realizados a partir da Marca.

---

## Índice por Competência

**Preservar integralmente.**

A Competência representa o principal eixo temporal do domínio.

Grande parte das informações é organizada segundo o ciclo operacional correspondente.

---

## Índice por Parceira

**Preservar integralmente.**

A Parceira constitui um índice conceitual para acompanhamento de sua participação histórica e operacional.

---

## Índice por Colaboração Mensal

**Preservar.**

Cada Colaboração Mensal representa uma unidade operacional identificável e recuperável individualmente.

---

## Índice por Pagamento

**Preservar.**

Os Pagamentos podem ser organizados conceitualmente segundo sua própria identidade e seu vínculo com a Colaboração Mensal correspondente.

---

# Conteúdo adaptado

## Índices por Estado

Os estados operacionais podem atuar como critérios conceituais de agrupamento quando relevantes para o acompanhamento do domínio.

Esses agrupamentos decorrem das regras de negócio e não de estratégias técnicas de consulta.

---

## Índices Históricos

Informações históricas poderão ser organizadas conceitualmente por período, Competência, Marca ou Parceira, preservando a rastreabilidade do domínio.

---

# Conteúdo removido

Não pertencem a esta seção:

- índices de banco de dados;
- índices de performance;
- índices de pesquisa textual;
- mecanismos de cache;
- planos de execução;
- otimização de consultas;
- mecanismos de busca da infraestrutura.

Esses elementos pertencem exclusivamente ao modelo lógico ou físico de dados.

---

# Ajustes editoriais

## Índice como Conceito de Negócio

Todo Índice Conceitual deverá representar uma forma natural de organização utilizada pelos especialistas do domínio.

---

## Organização da Informação

Os índices deverão facilitar a localização e compreensão das informações do domínio sem introduzir detalhes de implementação.

---

## Independência Tecnológica

Os Índices Conceituais permanecem válidos independentemente da tecnologia utilizada para armazenamento, pesquisa ou recuperação das informações.

---

# Estrutura prevista para a documentação final

A seção "Quais Índices Conceituais Existem?" deverá conter apenas:

1. Conceito de Índice Conceitual
2. Índices da Marca
3. Índices da Competência
4. Índices da Parceira
5. Índices da Colaboração Mensal
6. Índices do Pagamento
7. Índices por Estado
8. Princípios dos Índices Conceituais

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Índice por Marca | Preservar |
| Índice por Competência | Preservar |
| Índice por Parceira | Preservar |
| Índice por Colaboração Mensal | Preservar |
| Índice por Pagamento | Preservar |
| Índices por Estado | Adaptar |
| Índices Históricos | Adaptar |
| Índices físicos e técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os critérios utilizados pelo domínio para localizar, organizar e agrupar Entidades e Agregados estiverem definidos como Índices Conceituais, preservando a visão de negócio e mantendo completa independência de mecanismos físicos de indexação, bancos de dados ou tecnologias de implementação.  [oai_citation:1‡ScienceDirect](https://www.sciencedirect.com/topics/computer-science/conceptual-data-model?utm_source=chatgpt.com)

# 9. QUAIS ÍNDICES CONCEITUAIS EXISTEM?

## Conceito de Índice Conceitual

No domínio do TEAR, um Índice Conceitual representa um critério de organização utilizado para localizar, agrupar, acompanhar ou recuperar informações do negócio.

Diferentemente de um índice físico de banco de dados, um Índice Conceitual não existe para otimizar desempenho. Seu objetivo é refletir a forma como os especialistas do domínio organizam e consultam as informações durante a operação do programa.

Os Índices Conceituais são independentes de qualquer tecnologia de armazenamento e representam exclusivamente critérios de navegação e organização do domínio. Modelos conceituais organizam entidades e seus relacionamentos segundo a visão do negócio, sem depender de estruturas físicas de implementação.  [oai_citation:0‡ScienceDirect](https://www.sciencedirect.com/topics/computer-science/conceptual-data-model?utm_source=chatgpt.com)

---

# Índices da Marca

A Marca constitui um dos principais critérios de organização do domínio.

As informações podem ser organizadas conceitualmente por Marca para permitir:

- identificação das campanhas pertencentes à Marca;
- acompanhamento das Competências da Marca;
- consulta das Colaborações Mensais vinculadas;
- acompanhamento da evolução operacional do programa.

A Marca funciona como um eixo organizador das operações realizadas no domínio.

---

# Índices da Competência

A Competência representa o principal índice temporal do TEAR.

Grande parte das informações do domínio pode ser organizada segundo o ciclo operacional correspondente.

A organização por Competência permite:

- localizar Colaborações Mensais pertencentes ao mesmo ciclo;
- acompanhar a evolução operacional de cada período;
- preservar o histórico das campanhas executadas;
- realizar consultas por competência operacional.

A Competência estrutura cronologicamente a operação do domínio.

---

# Índices da Parceira

A Parceira constitui um índice conceitual voltado ao acompanhamento individual de cada participante do programa.

Esse índice permite organizar:

- histórico de participação;
- Colaborações Mensais realizadas;
- Competências das quais participou;
- evolução da atuação da Parceira no programa.

A Parceira representa um eixo permanente de organização das informações relacionadas à sua trajetória.

---

# Índices da Colaboração Mensal

Cada Colaboração Mensal representa uma unidade operacional individual do domínio.

Sua identificação permite localizar diretamente:

- estado atual da colaboração;
- Snapshot Comercial correspondente;
- etapas operacionais;
- informações históricas;
- Pagamento relacionado.

A Colaboração Mensal constitui o principal objeto operacional consultado durante a execução do programa.

---

# Índices do Pagamento

O Pagamento possui organização própria dentro do domínio.

Seu índice conceitual permite localizar:

- compromisso financeiro correspondente;
- situação financeira;
- histórico do ciclo financeiro;
- Colaboração Mensal que originou o pagamento.

Esse índice organiza a dimensão financeira do domínio sem interferir nos demais Agregados.

---

# Índices por Estado

Além dos índices baseados nas Entidades principais, o domínio pode organizar informações segundo seus estados operacionais.

Esses agrupamentos permitem acompanhar conjuntos de Entidades que compartilham a mesma situação de negócio.

Exemplos de organização incluem:

- Colaborações Mensais por estado do ciclo de vida;
- Pagamentos por situação financeira;
- Competências por situação operacional;
- Parceiras por situação no programa.

Esses índices representam critérios de acompanhamento do negócio, e não mecanismos técnicos de pesquisa.

---

# Índices Históricos

O domínio também organiza informações por critérios históricos.

Esses índices permitem recuperar fatos passados segundo diferentes perspectivas, como:

- Competência;
- Marca;
- Parceira;
- período operacional;
- histórico de Colaborações Mensais.

Os Índices Históricos preservam a memória operacional do TEAR e facilitam a reconstrução da evolução do programa ao longo do tempo.

---

# Princípios dos Índices Conceituais

Os Índices Conceituais do TEAR seguem os seguintes princípios:

- Todo Índice Conceitual representa um critério de organização do negócio.
- Os índices refletem a forma como especialistas do domínio localizam e agrupam informações.
- Marca, Competência, Parceira, Colaboração Mensal e Pagamento constituem os principais eixos de organização do domínio.
- Estados operacionais podem ser utilizados como critérios complementares de agrupamento.
- Informações históricas podem ser organizadas por diferentes perspectivas de negócio.
- Índices Conceituais independem de banco de dados, mecanismos de busca ou estruturas físicas de indexação.
- A implementação técnica poderá utilizar qualquer estratégia de pesquisa, desde que preserve os critérios conceituais definidos pelo domínio.
- Os Índices Conceituais fortalecem a clareza da Linguagem Ubíqua e facilitam a navegação pelo modelo de domínio.  [oai_citation:1‡quest.com](https://www.quest.com/learn/conceptual.aspx?utm_source=chatgpt.com)

# PASSO 10 — QUAIS DADOS NUNCA PODEM SER APAGADOS?
## ENTREGA A — CURADORIA

### Objetivo

Definir quais informações do domínio do TEAR possuem caráter permanente e, por isso, não podem ser eliminadas sem comprometer a integridade, a rastreabilidade ou a memória operacional do negócio.

Esta seção estabelece quais dados representam fatos permanentes do domínio e devem permanecer preservados durante todo o ciclo de vida do sistema.

A impossibilidade de exclusão decorre do significado desses dados para o negócio, e não de limitações técnicas de armazenamento ou infraestrutura. Em domínios que exigem rastreabilidade, registros históricos e eventos relevantes são preservados de forma imutável para permitir auditoria e reconstrução do estado do sistema.  [oai_citation:0‡ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0264837721001022?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Quais Dados Nunca Podem Ser Apagados?" deverá responder apenas às seguintes perguntas:

- Quais informações representam fatos permanentes do domínio?
- Quais registros devem permanecer preservados indefinidamente?
- Quais dados garantem a memória operacional do negócio?
- Quais informações são indispensáveis para reconstruir o histórico do domínio?
- Quais dados permanecem relevantes mesmo após o encerramento de um ciclo operacional?

Esta seção não define:

- políticas de backup;
- retenção legal;
- LGPD;
- arquivamento;
- exclusão física;
- soft delete;
- estratégias de banco de dados;
- mecanismos de auditoria.

---

# Conteúdo aprovado para preservação

## Colaborações Mensais

**Preservar integralmente.**

Toda Colaboração Mensal representa um fato permanente do domínio.

Mesmo após seu encerramento, continua compondo o histórico operacional do programa.

---

## Snapshot Comercial

**Preservar integralmente.**

O Snapshot Comercial registra o contexto comercial existente no momento da criação da Colaboração Mensal.

Sua preservação garante a reconstrução fiel das condições originalmente acordadas.

---

## Pagamentos

**Preservar.**

Os Pagamentos representam fatos financeiros do domínio.

Seu histórico permanece relevante independentemente de alterações posteriores.

---

## Competências Encerradas

**Preservar.**

Competências concluídas continuam representando ciclos operacionais do programa e integram permanentemente sua memória histórica.

---

## Histórico de Participação da Parceira

**Preservar.**

A trajetória da Parceira dentro do programa constitui patrimônio informacional do domínio.

As participações realizadas permanecem preservadas mesmo que sua situação operacional seja alterada posteriormente.

---

# Conteúdo adaptado

## Eventos de Domínio

Sempre que preservados pelo domínio, os Eventos representam fatos históricos permanentes.

Sua exclusão compromete a reconstrução da evolução do negócio.

---

## Estados Históricos

Estados superados podem deixar de representar o estado atual da Entidade, mas continuam integrando sua evolução histórica e, quando registrados, devem permanecer preservados.

---

# Conteúdo removido

Não pertencem a esta seção:

- arquivos temporários;
- cache;
- sessões;
- logs técnicos;
- dados derivados;
- índices físicos;
- projeções;
- mecanismos de armazenamento;
- políticas de limpeza da infraestrutura.

Esses elementos pertencem às camadas técnicas e não ao modelo de domínio.

---

# Ajustes editoriais

## Fatos Permanentes do Negócio

Somente informações que representam acontecimentos permanentes do domínio devem ser classificadas como dados não apagáveis.

---

## Preservação da Memória

A permanência desses dados garante que o domínio mantenha sua memória operacional, permitindo compreender decisões, reconstruir contextos e preservar a rastreabilidade.

---

## Independência Tecnológica

A impossibilidade de exclusão decorre exclusivamente das necessidades do domínio e permanece válida independentemente da tecnologia utilizada para armazenar os dados.

---

# Estrutura prevista para a documentação final

A seção "Quais Dados Nunca Podem Ser Apagados?" deverá conter apenas:

1. Conceito de Dados Permanentes
2. Colaborações Mensais Permanentes
3. Snapshot Comercial
4. Pagamentos
5. Competências Encerradas
6. Histórico da Parceira
7. Eventos de Domínio
8. Princípios da Preservação Permanente

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Colaborações Mensais | Preservar |
| Snapshot Comercial | Preservar |
| Pagamentos | Preservar |
| Competências Encerradas | Preservar |
| Histórico da Parceira | Preservar |
| Eventos de Domínio | Adaptar |
| Estados Históricos | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os dados que representam fatos permanentes do domínio estiverem claramente identificados como informações que nunca podem ser apagadas, assegurando a preservação da memória operacional, da rastreabilidade e da reconstrução histórica do TEAR, independentemente da tecnologia utilizada para persistência.  [oai_citation:1‡ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0264837721001022?utm_source=chatgpt.com)

# 10. QUAIS DADOS NUNCA PODEM SER APAGADOS?

## Conceito de Dados Permanentes

No domínio do TEAR, Dados Permanentes são informações que representam fatos definitivos do negócio e que, uma vez registrados, passam a integrar a memória operacional do sistema.

Esses dados preservam a rastreabilidade, permitem reconstruir acontecimentos passados e garantem a continuidade do conhecimento do domínio ao longo do tempo.

A impossibilidade de exclusão decorre do significado desses registros para o negócio e não da tecnologia utilizada para armazená-los. Em DDD e arquiteturas orientadas a eventos, fatos de negócio são tratados como registros permanentes e imutáveis para preservar histórico e auditabilidade.  [oai_citation:0‡martinfowler.com](https://martinfowler.com/eaaDev/DomainEvent.html?utm_source=chatgpt.com)

---

# Colaborações Mensais

Toda Colaboração Mensal representa um fato permanente do domínio.

Uma vez criada, passa a integrar definitivamente o histórico operacional do programa.

Mesmo após:

- encerramento da Competência;
- conclusão das entregas;
- finalização do Pagamento;
- desligamento da Parceira;
- alterações futuras na Marca;

a Colaboração Mensal continua representando um acontecimento histórico que jamais deve ser eliminado.

---

# Snapshot Comercial

O Snapshot Comercial representa o contexto comercial existente no momento da criação da Colaboração Mensal.

Após sua criação:

- permanece permanentemente associado à colaboração;
- preserva as condições comerciais originalmente estabelecidas;
- não sofre alterações decorrentes de mudanças posteriores na Marca.

Sua preservação garante que qualquer análise histórica reflita exatamente o contexto existente quando a colaboração foi iniciada.

---

# Pagamentos

Todo Pagamento representa um fato financeiro do domínio.

Mesmo após sua conclusão, continuam preservados:

- seu vínculo com a Colaboração Mensal;
- sua evolução financeira;
- seus estados históricos;
- as informações necessárias para reconstruir seu ciclo de vida.

O histórico financeiro integra permanentemente a memória operacional do TEAR.

---

# Competências Encerradas

Competências concluídas jamais deixam de existir para o domínio.

Após seu encerramento, permanecem preservadas:

- sua identificação;
- seu período operacional;
- sua situação final;
- seu relacionamento com as Colaborações Mensais correspondentes.

Cada Competência representa um ciclo histórico do programa e compõe sua evolução ao longo do tempo.

---

# Histórico da Parceira

A trajetória da Parceira dentro do programa constitui patrimônio informacional permanente do domínio.

Mesmo que sua situação operacional seja alterada, permanecem preservados:

- histórico de participação;
- Colaborações Mensais realizadas;
- Competências das quais participou;
- evolução de sua atuação no programa.

A permanência desses registros garante a reconstrução completa da participação da Parceira.

---

# Eventos de Domínio

Quando preservados pelo domínio, os Eventos representam fatos que efetivamente ocorreram.

Por essa razão:

- registram acontecimentos já concluídos;
- representam fatos históricos;
- preservam a sequência de evolução do domínio;
- não devem ser eliminados sem comprometer a rastreabilidade do negócio.

Eventos registram o passado e, por natureza, constituem informações permanentes.  [oai_citation:1‡Ontologic](https://ontologic.site/docs/domain-model/domain-events?utm_source=chatgpt.com)

---

# Estados Históricos

Embora o estado atual de uma Entidade possa evoluir ao longo do tempo, os estados anteriormente alcançados continuam representando fatos históricos do domínio.

Quando esses estados forem preservados, deverão permanecer disponíveis para:

- reconstrução da evolução da Entidade;
- compreensão das decisões tomadas;
- rastreabilidade do processo operacional;
- auditoria da evolução do negócio.

O domínio preserva a sequência histórica, ainda que apenas um estado seja considerado vigente.

---

# Princípios da Preservação Permanente

Os dados permanentes do TEAR seguem os seguintes princípios:

- Todo dado permanente representa um fato relevante do negócio.
- Colaborações Mensais nunca deixam de integrar o histórico do domínio.
- O Snapshot Comercial permanece permanentemente preservado e imutável.
- Pagamentos constituem fatos financeiros permanentes.
- Competências encerradas continuam compondo a memória operacional do programa.
- O histórico de participação da Parceira nunca perde seu significado de negócio.
- Eventos de Domínio representam fatos históricos e não devem ser apagados quando preservados.
- A preservação permanente garante rastreabilidade, auditabilidade e reconstrução histórica do domínio.
- A decisão de preservar um dado decorre exclusivamente das necessidades do negócio e independe de banco de dados, linguagem, framework ou mecanismo de persistência.
- A implementação técnica deve proteger esses dados permanentes, nunca definir quais deles possuem valor histórico.  [oai_citation:2‡Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing?utm_source=chatgpt.com)

# PASSO 11 — IDENTIFICADORES E IDENTIDADE DAS ENTIDADES
## ENTREGA A — CURADORIA

### Objetivo

Definir como a identidade das Entidades do domínio do TEAR é estabelecida, preservada e reconhecida ao longo de todo o seu ciclo de vida.

Nesta seção, identidade representa a propriedade que permite distinguir permanentemente uma Entidade das demais, independentemente das alterações ocorridas em seus atributos.

Os Identificadores Conceituais representam essa identidade no domínio, sem pressupor qualquer formato técnico, mecanismo de geração ou tecnologia de implementação. Em Domain-Driven Design, uma Entidade é definida principalmente por sua identidade contínua, e não pelos atributos que possui.  [oai_citation:0‡Microsoft Learn](https://learn.microsoft.com/pt-br/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Identificadores e Identidade das Entidades" deverá responder apenas às seguintes perguntas:

- Como cada Entidade é identificada no domínio?
- O que constitui sua identidade?
- Quais identidades permanecem estáveis durante todo o ciclo de vida?
- Quais conceitos possuem identidade própria?
- Quais conceitos não possuem identidade?

Esta seção não define:

- UUID;
- AUTO_INCREMENT;
- SERIAL;
- GUID;
- chaves primárias;
- chaves compostas;
- estratégias de geração de IDs;
- formatos técnicos;
- implementação de identificadores.

---

# Conteúdo aprovado para preservação

## Identidade da Marca

**Preservar.**

A Marca possui identidade própria e permanente.

Sua identidade permanece estável durante toda sua existência, independentemente de alterações em seus atributos.

---

## Identidade da Parceira

**Preservar integralmente.**

Cada Parceira representa uma Entidade distinta do domínio.

Mudanças em informações pessoais, contatos ou situação operacional não alteram sua identidade.

---

## Identidade da Competência

**Preservar.**

Cada Competência possui identidade própria que representa um ciclo operacional específico.

Sua identidade permanece preservada mesmo após o encerramento do ciclo correspondente.

---

## Identidade da Colaboração Mensal

**Preservar integralmente.**

Cada Colaboração Mensal constitui uma Entidade independente.

Sua identidade permanece única durante toda sua existência e distingue permanentemente aquela colaboração de qualquer outra.

---

## Identidade do Pagamento

**Preservar.**

Cada Pagamento possui identidade própria dentro do domínio financeiro.

Essa identidade permanece estável durante toda sua evolução.

---

# Conteúdo adaptado

## Identificadores Conceituais

Os Identificadores deverão ser tratados como conceitos do domínio responsáveis por distinguir permanentemente uma Entidade.

Sua representação técnica será definida posteriormente.

---

## Referências entre Agregados

Os relacionamentos entre Agregados deverão ocorrer por meio de suas identidades conceituais, preservando a autonomia e os limites de consistência de cada Aggregate Root.

---

## Value Objects

Os Value Objects não possuem identidade própria.

Seu significado deriva exclusivamente dos valores que representam e de sua incorporação à Entidade correspondente.

---

# Conteúdo removido

Não pertencem a esta seção:

- UUID;
- GUID;
- BIGINT;
- AUTO_INCREMENT;
- SEQUENCE;
- SERIAL;
- chaves primárias;
- índices;
- formatos de armazenamento;
- geração automática de IDs;
- implementação técnica.

Esses elementos pertencem ao modelo lógico ou físico de dados.

---

# Ajustes editoriais

## Identidade como Conceito de Negócio

A identidade deverá ser descrita exclusivamente sob a ótica do domínio, representando a continuidade da Entidade ao longo do tempo.

---

## Estabilidade da Identidade

Alterações em atributos nunca modificam a identidade de uma Entidade.

A identidade permanece constante durante todo o seu ciclo de vida.

---

## Independência Tecnológica

Os Identificadores Conceituais permanecem válidos independentemente da tecnologia utilizada para sua representação ou persistência.

---

# Estrutura prevista para a documentação final

A seção "Identificadores e Identidade das Entidades" deverá conter apenas:

1. Conceito de Identidade
2. Identidade da Marca
3. Identidade da Parceira
4. Identidade da Competência
5. Identidade da Colaboração Mensal
6. Identidade do Pagamento
7. Identidade dos Value Objects
8. Princípios da Identidade

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Identidade da Marca | Preservar |
| Identidade da Parceira | Preservar |
| Identidade da Competência | Preservar |
| Identidade da Colaboração Mensal | Preservar |
| Identidade do Pagamento | Preservar |
| Identificadores Conceituais | Adaptar |
| Referências entre Agregados | Adaptar |
| Value Objects sem identidade | Adaptar |
| Aspectos técnicos de ID | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todas as Entidades do TEAR tiverem sua identidade conceitual claramente definida, distinguindo os conceitos que possuem continuidade própria daqueles definidos exclusivamente por seus valores. A documentação deverá permanecer completamente independente de formatos técnicos, mecanismos de geração de identificadores ou tecnologias de persistência.  [oai_citation:1‡Microsoft Learn](https://learn.microsoft.com/pt-br/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model?utm_source=chatgpt.com)

# 11. IDENTIFICADORES E IDENTIDADE DAS ENTIDADES

## Conceito de Identidade

No domínio do TEAR, a identidade é a propriedade que permite distinguir permanentemente uma Entidade de todas as demais.

Uma Entidade continua sendo a mesma ao longo do tempo, mesmo quando seus atributos, estados ou relacionamentos evoluem. Sua identidade permanece estável durante todo o seu ciclo de vida e constitui o elemento que garante sua continuidade no domínio.

Os Identificadores Conceituais representam essa identidade de negócio. Sua forma de representação é uma decisão de implementação e não faz parte do modelo conceitual. Em Domain-Driven Design, Entidades são definidas por uma identidade contínua, enquanto Value Objects são definidos exclusivamente pelos valores que representam.  [oai_citation:0‡martinfowler.com](https://martinfowler.com/bliki/EvansClassification.html?utm_source=chatgpt.com)

---

# Identidade da Marca

Cada Marca possui uma identidade própria e permanente.

Essa identidade:

- distingue uma Marca das demais;
- permanece estável durante toda sua existência;
- independe de alterações em suas informações institucionais;
- permite reconhecer a mesma Marca ao longo de diferentes Competências e Colaborações Mensais.

Mudanças em atributos da Marca nunca alteram sua identidade.

---

# Identidade da Parceira

Cada Parceira representa uma participante única do programa.

Sua identidade permanece preservada mesmo quando ocorrerem alterações em:

- informações pessoais;
- dados de contato;
- localização;
- situação operacional;
- histórico de participação.

A Parceira continua sendo a mesma Entidade durante toda sua trajetória dentro do programa.

---

# Identidade da Competência

Cada Competência representa um ciclo operacional específico.

Sua identidade permite distinguir permanentemente um ciclo dos demais.

Mesmo após seu encerramento, a Competência continua existindo como parte da memória operacional do domínio, preservando sua identidade e seus relacionamentos históricos.

---

# Identidade da Colaboração Mensal

Cada Colaboração Mensal constitui uma Entidade independente.

Sua identidade:

- distingue uma colaboração de qualquer outra;
- permanece constante durante todo o ciclo operacional;
- preserva o vínculo com seu Snapshot Comercial;
- mantém seu relacionamento histórico com Marca, Parceira, Competência e Pagamento.

Alterações em seu estado operacional não modificam sua identidade.

---

# Identidade do Pagamento

Cada Pagamento possui identidade própria dentro do domínio financeiro.

Essa identidade permite acompanhar continuamente seu ciclo de vida, desde sua criação até sua conclusão, preservando sua relação exclusiva com a Colaboração Mensal que lhe deu origem.

Mudanças em seu estado financeiro não alteram sua identidade.

---

# Identidade dos Value Objects

Os Value Objects do TEAR não possuem identidade própria.

Seu significado deriva exclusivamente dos valores que representam.

Assim:

- dois Value Objects com os mesmos valores representam o mesmo conceito do domínio;
- sua existência depende da Entidade ou Aggregate Root que os incorpora;
- eles não possuem continuidade independente ao longo do tempo.

Caso seus valores precisem ser alterados, um novo Value Object representa o novo estado.  [oai_citation:1‡martinfowler.com](https://martinfowler.com/bliki/ValueObject.html?utm_source=chatgpt.com)

---

# Referências entre Agregados

Os relacionamentos entre Aggregate Roots são estabelecidos por meio de suas identidades conceituais.

Essa abordagem garante que:

- cada Agregado preserve sua autonomia;
- os limites de consistência permaneçam respeitados;
- nenhum Agregado dependa do estado interno de outro;
- os relacionamentos sejam preservados mesmo quando os estados evoluírem.

A identidade funciona como o elo permanente entre os diferentes conceitos do domínio.

---

# Princípios da Identidade

Os Identificadores e a Identidade das Entidades do TEAR seguem os seguintes princípios:

- Toda Entidade possui identidade própria e permanente.
- A identidade permanece estável durante todo o ciclo de vida da Entidade.
- Alterações de atributos nunca modificam a identidade de uma Entidade.
- Marca, Parceira, Competência, Colaboração Mensal e Pagamento possuem identidade própria.
- Value Objects não possuem identidade e são definidos exclusivamente por seus valores.
- Relacionamentos entre Aggregate Roots utilizam suas identidades conceituais como referência.
- A identidade constitui um conceito do domínio e independe de UUID, chaves primárias, formatos de armazenamento ou qualquer mecanismo técnico.
- A implementação técnica poderá representar essa identidade por qualquer estratégia adequada, desde que preserve sua continuidade e significado no domínio.  [oai_citation:2‡martinfowler.com](https://martinfowler.com/bliki/DomainDrivenDesign.html?utm_source=chatgpt.com)

# PASSO 12 — REGRAS DE UNICIDADE (UNICIDADE DE NEGÓCIO)
## ENTREGA A — CURADORIA

### Objetivo

Definir quais regras de unicidade existem no domínio do TEAR, estabelecendo quando um conceito do negócio pode existir apenas uma vez dentro de determinado contexto operacional.

Nesta seção, unicidade representa uma regra do domínio destinada a impedir duplicidades que comprometam a integridade do modelo.

As Regras de Unicidade descrevem exclusivamente restrições de negócio e não mecanismos técnicos de implementação, como índices únicos ou constraints de banco de dados. Em modelagem conceitual, restrições de unicidade garantem que determinados fatos do negócio ocorram apenas uma vez dentro de um contexto específico. ([oracle.com](https://docs.oracle.com/cd/B28359_01/server.111/b28310/general005.htm?utm_source=chatgpt.com))

---

# Escopo desta seção

A seção "Regras de Unicidade" deverá responder apenas às seguintes perguntas:

- Quais Entidades não podem existir em duplicidade?
- Em qual contexto uma informação deve ser única?
- Quais combinações de informações identificam exclusivamente um fato de negócio?
- Quais duplicidades comprometem o domínio?
- Quais regras preservam a consistência operacional?

Esta seção não define:

- UNIQUE;
- PRIMARY KEY;
- índices físicos;
- chaves compostas;
- validações SQL;
- validações de API;
- mecanismos de banco de dados;
- implementação técnica.

---

# Conteúdo aprovado para preservação

## Marca

**Preservar.**

Cada Marca representa um conceito único dentro do domínio.

Não pode existir duplicidade de identidade para uma mesma Marca.

---

## Parceira

**Preservar integralmente.**

Cada Parceira representa uma participante única do programa.

Uma mesma Parceira não pode ser cadastrada mais de uma vez como Entidade distinta.

---

## Competência

**Preservar.**

Cada Competência representa um único ciclo operacional.

Não podem coexistir duas Competências representando exatamente o mesmo ciclo para a mesma Marca.

---

## Colaboração Mensal

**Preservar integralmente.**

Uma Parceira somente pode possuir uma única Colaboração Mensal para a mesma Marca dentro da mesma Competência.

Essa combinação representa um fato único do domínio.

---

## Pagamento

**Preservar.**

Cada Colaboração Mensal origina exatamente um único Pagamento.

Não podem existir múltiplos Pagamentos representando o mesmo compromisso financeiro.

---

# Conteúdo adaptado

## Snapshot Comercial

Cada Colaboração Mensal incorpora exatamente um único Snapshot Comercial.

Não pode existir mais de um Snapshot representando o mesmo contexto comercial daquela colaboração.

---

## Eventos de Domínio

Eventos podem ocorrer diversas vezes, desde que cada ocorrência represente um fato distinto do domínio.

A unicidade decorre do acontecimento registrado e não apenas do tipo do evento.

---

# Conteúdo removido

Não pertencem a esta seção:

- índices UNIQUE;
- chaves primárias;
- chaves compostas;
- UUID;
- SERIAL;
- AUTO_INCREMENT;
- validações de banco;
- mecanismos de concorrência;
- implementação de restrições.

Esses elementos pertencem ao modelo lógico ou físico.

---

# Ajustes editoriais

## Unicidade como Regra de Negócio

Toda regra de unicidade deverá representar uma necessidade do domínio para impedir duplicidades de fatos de negócio.

---

## Contexto da Unicidade

A unicidade deve ser sempre interpretada dentro do contexto adequado.

Nem toda informação é globalmente única; muitas são únicas apenas dentro de uma Marca, Competência ou Colaboração Mensal.

---

## Independência Tecnológica

As regras de unicidade permanecem válidas independentemente do banco de dados, da linguagem ou da estratégia utilizada para implementá-las.

---

# Estrutura prevista para a documentação final

A seção "Regras de Unicidade" deverá conter apenas:

1. Conceito de Unicidade
2. Unicidade da Marca
3. Unicidade da Parceira
4. Unicidade da Competência
5. Unicidade da Colaboração Mensal
6. Unicidade do Pagamento
7. Unicidade dos Value Objects
8. Princípios da Unicidade

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Marca | Preservar |
| Parceira | Preservar |
| Competência | Preservar |
| Colaboração Mensal | Preservar |
| Pagamento | Preservar |
| Snapshot Comercial | Adaptar |
| Eventos de Domínio | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todas as regras de unicidade do TEAR estiverem claramente definidas como restrições de negócio, identificando quais fatos podem ocorrer apenas uma vez dentro de seus respectivos contextos e preservando a integridade do domínio sem depender de mecanismos técnicos de implementação. ([oracle.com](https://docs.oracle.com/cd/B28359_01/server.111/b28310/general005.htm?utm_source=chatgpt.com))

# 12. REGRAS DE UNICIDADE (UNICIDADE DE NEGÓCIO)

## Conceito de Unicidade

No domínio do TEAR, uma Regra de Unicidade estabelece que determinado fato de negócio somente pode existir uma única vez dentro de um contexto específico.

A unicidade protege a consistência do domínio ao impedir a existência de registros que representem o mesmo acontecimento, a mesma relação ou o mesmo conceito de negócio.

Essas regras decorrem exclusivamente das necessidades do domínio e independem da tecnologia utilizada para implementá-las. A forma de garantir essa unicidade é uma decisão de implementação; a necessidade de que ela exista pertence ao modelo de negócio.  [oai_citation:0‡Protean](https://docs.proteanhq.com/concepts/foundations/identity/?utm_source=chatgpt.com)

---

# Unicidade da Marca

Cada Marca representa um conceito único dentro do domínio.

Não podem existir duas Entidades distintas representando a mesma Marca.

Sua identidade deve permanecer exclusiva durante todo o seu ciclo de vida.

---

# Unicidade da Parceira

Cada Parceira representa uma participante única do programa.

Uma mesma Parceira não pode ser cadastrada mais de uma vez como Entidade distinta.

Alterações em seus dados cadastrais ou em sua situação operacional não originam uma nova Parceira, mas representam a evolução da mesma Entidade.

---

# Unicidade da Competência

Cada Competência representa um único ciclo operacional de uma determinada Marca.

Dentro de uma mesma Marca:

- uma Competência corresponde a um único período operacional;
- não podem coexistir duas Competências representando exatamente o mesmo ciclo.

Essa regra preserva a organização cronológica do programa.

---

# Unicidade da Colaboração Mensal

A Colaboração Mensal representa a participação de uma Parceira em uma Competência para uma determinada Marca.

Dentro desse contexto:

- uma Parceira pode possuir apenas uma Colaboração Mensal por Competência para a mesma Marca;
- não podem existir duas Colaborações Mensais representando exatamente a mesma participação.

A combinação entre Marca, Competência e Parceira identifica um único fato operacional do domínio.

---

# Unicidade do Pagamento

Cada Colaboração Mensal origina exatamente um único Pagamento.

Como consequência:

- um Pagamento corresponde exclusivamente a uma Colaboração Mensal;
- uma Colaboração Mensal não pode possuir dois Pagamentos representando o mesmo compromisso financeiro.

Essa unicidade preserva a correspondência entre execução operacional e obrigação financeira.

---

# Unicidade dos Value Objects

Os Value Objects não possuem identidade própria.

Sua unicidade decorre exclusivamente dos valores que representam.

Assim:

- dois Value Objects com os mesmos valores representam o mesmo conceito do domínio;
- não existe distinção baseada em identidade;
- sua existência depende da Entidade ou Aggregate Root que os incorpora.

Essa característica diferencia os Value Objects das Entidades do domínio.  [oai_citation:1‡Protean](https://docs.proteanhq.com/concepts/foundations/identity/?utm_source=chatgpt.com)

---

# Unicidade dos Eventos de Domínio

Eventos de Domínio representam acontecimentos específicos da evolução do negócio.

Cada Evento registra um fato único ocorrido em determinado contexto.

Eventos do mesmo tipo podem ocorrer diversas vezes, desde que cada ocorrência represente um acontecimento distinto na história do domínio.

---

# Princípios da Unicidade

As regras de unicidade do TEAR seguem os seguintes princípios:

- Toda regra de unicidade representa uma necessidade do negócio.
- Cada Marca possui identidade única.
- Cada Parceira representa uma única participante do programa.
- Cada Competência representa um único ciclo operacional dentro de uma Marca.
- Uma Parceira pode possuir apenas uma Colaboração Mensal para a mesma Marca na mesma Competência.
- Cada Colaboração Mensal origina exatamente um único Pagamento.
- Value Objects são definidos exclusivamente por seus valores e não por identidade.
- Eventos de Domínio representam fatos únicos da evolução do negócio.
- A unicidade preserva a consistência, a rastreabilidade e a integridade do modelo.
- A implementação técnica poderá utilizar qualquer mecanismo para garantir essas regras, desde que preserve integralmente o significado de negócio definido pelo domínio.  [oai_citation:2‡Protean](https://docs.proteanhq.com/concepts/foundations/identity/?utm_source=chatgpt.com)

# PASSO 13 — CICLOS DE VIDA E ESTADOS DE CADA ENTIDADE
## ENTREGA A — CURADORIA

### Objetivo

Definir os ciclos de vida das Entidades do domínio do TEAR, estabelecendo como seus estados evoluem ao longo do tempo e quais princípios governam essas transições.

Nesta seção, o ciclo de vida representa a sequência lógica de estados pelos quais uma Entidade pode passar desde sua criação até sua conclusão operacional ou arquivamento histórico.

Os estados representam condições válidas do domínio e devem refletir exclusivamente a evolução do negócio, nunca detalhes de implementação. Em Domain-Driven Design, Entidades preservam sua identidade durante todo o ciclo de vida, enquanto seus estados evoluem conforme a aplicação das regras de negócio.  [oai_citation:0‡Qlerify](https://www.qlerify.com/dddconcepts/entity?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Ciclos de Vida e Estados de Cada Entidade" deverá responder apenas às seguintes perguntas:

- Quais estados cada Entidade pode assumir?
- Como ocorre a evolução desses estados?
- Quais estados representam o início e o encerramento do ciclo de vida?
- Quais estados possuem significado permanente para o negócio?
- Quais princípios governam as transições de estado?

Esta seção não define:

- máquinas de estados;
- workflows técnicos;
- BPMN;
- automações;
- implementações de transição;
- eventos de infraestrutura;
- filas;
- processos assíncronos.

---

# Conteúdo aprovado para preservação

## Ciclo de Vida da Marca

**Preservar.**

A Marca possui um ciclo de vida próprio, representando sua existência e situação operacional dentro do domínio.

Mudanças em sua situação não alteram sua identidade.

---

## Ciclo de Vida da Parceira

**Preservar integralmente.**

A Parceira evolui durante sua participação no programa.

Seu histórico permanece preservado independentemente de mudanças em sua situação operacional.

---

## Ciclo de Vida da Competência

**Preservar.**

Cada Competência representa um ciclo operacional delimitado.

Ela possui início, período de execução e encerramento, permanecendo disponível para consulta histórica após sua conclusão.

---

## Ciclo de Vida da Colaboração Mensal

**Preservar integralmente.**

A Colaboração Mensal constitui o principal fluxo operacional do domínio.

Seu ciclo de vida acompanha toda a execução da colaboração, desde sua criação até seu encerramento.

---

## Ciclo de Vida do Pagamento

**Preservar.**

O Pagamento possui evolução própria dentro do domínio financeiro.

Sua conclusão representa o encerramento do compromisso financeiro correspondente.

---

# Conteúdo adaptado

## Estados do Domínio

Os estados deverão ser tratados como representações conceituais da situação atual da Entidade.

Não representam implementações técnicas nem códigos internos.

---

## Transições de Estado

Toda transição deverá decorrer exclusivamente da aplicação de regras de negócio válidas.

Não serão descritas sequências técnicas nem fluxos de implementação.

---

## Estados Históricos

Os estados anteriormente assumidos pela Entidade permanecem relevantes para reconstrução da evolução do domínio quando fizerem parte da memória operacional.

---

# Conteúdo removido

Não pertencem a esta seção:

- enums técnicos;
- códigos numéricos;
- workflows BPM;
- engines de workflow;
- state machines;
- filas;
- eventos de infraestrutura;
- implementação de transições;
- lógica de aplicação.

Esses elementos pertencem à arquitetura e à implementação.

---

# Ajustes editoriais

## Evolução do Negócio

Os ciclos de vida deverão refletir exclusivamente a evolução dos conceitos do domínio.

---

## Continuidade da Identidade

As Entidades preservam sua identidade durante todo o ciclo de vida.

Apenas seus estados evoluem.

---

## Independência Tecnológica

Os estados permanecem válidos independentemente da forma como forem implementados ou armazenados.

---

# Estrutura prevista para a documentação final

A seção "Ciclos de Vida e Estados de Cada Entidade" deverá conter apenas:

1. Conceito de Ciclo de Vida
2. Ciclo de Vida da Marca
3. Ciclo de Vida da Parceira
4. Ciclo de Vida da Competência
5. Ciclo de Vida da Colaboração Mensal
6. Ciclo de Vida do Pagamento
7. Estados e Transições
8. Princípios dos Ciclos de Vida

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Ciclo de Vida da Marca | Preservar |
| Ciclo de Vida da Parceira | Preservar |
| Ciclo de Vida da Competência | Preservar |
| Ciclo de Vida da Colaboração Mensal | Preservar |
| Ciclo de Vida do Pagamento | Preservar |
| Estados do Domínio | Adaptar |
| Transições de Estado | Adaptar |
| Estados Históricos | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todas as Entidades do TEAR possuírem seus ciclos de vida conceituais claramente definidos, com estados que representem exclusivamente a evolução do negócio, preservando a continuidade da identidade, a consistência do domínio e a independência de qualquer mecanismo técnico de implementação.  [oai_citation:1‡Qlerify](https://www.qlerify.com/dddconcepts/entity?utm_source=chatgpt.com)

# 13. CICLOS DE VIDA E ESTADOS DE CADA ENTIDADE

## Conceito de Ciclo de Vida

No domínio do TEAR, o ciclo de vida representa a evolução de uma Entidade ao longo do tempo, desde seu surgimento até o encerramento de sua participação operacional.

Durante essa evolução, a Entidade preserva permanentemente sua identidade enquanto seus estados refletem sua situação atual no negócio.

Os estados possuem significado exclusivamente no domínio e existem para representar momentos distintos da evolução operacional de cada Entidade. A identidade permanece constante enquanto o estado pode evoluir conforme as regras de negócio.  [oai_citation:0‡Qlerify](https://www.qlerify.com/dddconcepts/entity?utm_source=chatgpt.com)

---

# Ciclo de Vida da Marca

A Marca representa um programa permanente dentro do domínio.

Seu ciclo de vida compreende:

- criação da Marca;
- configuração do programa;
- operação regular;
- eventual suspensão operacional;
- eventual encerramento das atividades.

Mesmo quando deixa de operar, sua identidade e seu histórico permanecem preservados.

A evolução da Marca não altera as Competências nem as Colaborações Mensais já concluídas.

---

# Ciclo de Vida da Parceira

A Parceira representa uma participante do programa de relacionamento.

Seu ciclo de vida compreende:

- ingresso no programa;
- participação ativa;
- eventuais períodos de inatividade;
- retorno à operação, quando aplicável;
- encerramento definitivo da participação.

Independentemente de sua situação operacional, toda sua trajetória permanece registrada como parte da memória do domínio.

Sua identidade permanece inalterada durante toda sua existência.

---

# Ciclo de Vida da Competência

Cada Competência representa um ciclo operacional delimitado no tempo.

Seu ciclo de vida compreende:

- criação da Competência;
- preparação operacional;
- período de execução;
- encerramento;
- preservação histórica.

Após encerrada, a Competência deixa de receber novas operações, mas continua existindo como registro permanente do domínio.

---

# Ciclo de Vida da Colaboração Mensal

A Colaboração Mensal representa a principal unidade operacional do TEAR.

Seu ciclo de vida compreende:

- criação da colaboração;
- planejamento;
- execução das atividades;
- acompanhamento operacional;
- conclusão;
- preservação histórica.

Durante toda sua evolução:

- o Snapshot Comercial permanece imutável;
- sua identidade permanece constante;
- seus relacionamentos permanecem preservados;
- seu histórico continua disponível para consulta futura.

Nenhuma Colaboração Mensal deixa de existir após sua conclusão.

---

# Ciclo de Vida do Pagamento

O Pagamento representa o compromisso financeiro originado por uma Colaboração Mensal.

Seu ciclo de vida compreende:

- criação da obrigação financeira;
- processamento;
- conclusão financeira;
- preservação histórica.

Mesmo após sua conclusão, o Pagamento permanece como parte permanente do histórico financeiro do domínio.

---

# Estados e Transições

Cada Entidade possui estados compatíveis com seu próprio ciclo de vida.

As transições entre esses estados seguem os seguintes princípios:

- toda Entidade inicia seu ciclo em um estado válido;
- toda mudança de estado decorre de uma regra de negócio;
- nenhuma transição pode produzir um estado inconsistente;
- estados anteriores permanecem relevantes para reconstrução histórica quando integrarem a memória operacional do domínio;
- a identidade nunca é alterada durante as transições de estado.

Os estados representam a evolução natural do negócio e não mecanismos técnicos de controle de fluxo.  [oai_citation:1‡ftpdocs.broadcom.com](https://ftpdocs.broadcom.com/cadocs/0/CA%20Gen%208%205-ENU/Bookshelf_Files/HTML/AnalysisGuide/1100359.html?utm_source=chatgpt.com)

---

# Princípios dos Ciclos de Vida

Os ciclos de vida das Entidades do TEAR seguem os seguintes princípios:

- Toda Entidade possui um ciclo de vida próprio.
- Toda Entidade preserva sua identidade durante toda sua existência.
- Os estados representam exclusivamente situações do domínio.
- Toda transição de estado decorre de regras de negócio válidas.
- Nenhuma transição pode produzir estados inconsistentes.
- Competências encerradas permanecem preservadas para consulta histórica.
- Colaborações Mensais permanecem registradas permanentemente após sua conclusão.
- Pagamentos concluídos continuam compondo o histórico financeiro do domínio.
- O histórico dos estados preserva a rastreabilidade da evolução operacional.
- Os ciclos de vida independem de tecnologias, workflows, mecanismos de persistência ou implementações específicas.

# PASSO 14 — CATÁLOGO DE ENUMS DO DOMÍNIO
## ENTREGA A — CURADORIA

### Objetivo

Definir o conjunto de enumerações (Enums) que compõem a Linguagem Ubíqua do domínio do TEAR, estabelecendo os valores finitos utilizados para representar estados, classificações e categorias permanentes do negócio.

Nesta seção, um Enum representa um conjunto fechado de valores válidos para determinado conceito do domínio.

Os Enums documentados pertencem exclusivamente ao modelo conceitual e representam decisões do negócio, não implementações da linguagem de programação. Em Domain-Driven Design, a Linguagem Ubíqua deve ser refletida de forma consistente na documentação e no modelo do domínio.  [oai_citation:0‡Microsoft Learn](https://learn.microsoft.com/en-us/archive/msdn-magazine/2009/february/best-practice-an-introduction-to-domain-driven-design?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Catálogo de Enums do Domínio" deverá responder apenas às seguintes perguntas:

- Quais conceitos do domínio possuem conjunto finito de valores?
- Quais estados são oficialmente reconhecidos pelo negócio?
- Quais classificações fazem parte da Linguagem Ubíqua?
- Quais valores podem evoluir apenas mediante alteração do modelo do domínio?
- Quais Enums são compartilhados entre diferentes Entidades?

Esta seção não define:

- enums da linguagem de programação;
- constantes técnicas;
- códigos numéricos;
- valores inteiros;
- serialização;
- representação em banco de dados;
- convenções de nomenclatura do código;
- implementação.

---

# Conteúdo aprovado para preservação

## Enum de Situação da Marca

**Preservar.**

Representa os estados possíveis da operação de uma Marca dentro do programa.

Os valores deverão refletir exclusivamente situações reconhecidas pelo negócio.

---

## Enum de Situação da Parceira

**Preservar integralmente.**

Representa as situações operacionais possíveis de uma Parceira durante sua participação no programa.

Os estados deverão ser mutuamente exclusivos.

---

## Enum de Situação da Competência

**Preservar.**

Representa os estados válidos de um ciclo operacional.

Permite identificar a situação atual da Competência durante seu ciclo de vida.

---

## Enum de Situação da Colaboração Mensal

**Preservar integralmente.**

Representa a evolução operacional da Colaboração Mensal.

Os valores deverão corresponder às etapas reconhecidas pelo domínio.

---

## Enum de Situação do Pagamento

**Preservar.**

Representa a evolução do compromisso financeiro.

Os estados deverão refletir exclusivamente situações de negócio.

---

# Conteúdo adaptado

## Enums Compartilhados

Quando um mesmo conceito de negócio for utilizado por mais de uma Entidade, deverá existir apenas um Enum conceitual correspondente.

---

## Evolução dos Enums

Novos valores somente poderão ser adicionados quando representarem novos conceitos permanentes do domínio.

Mudanças temporárias de operação não justificam a criação de novos valores.

---

# Conteúdo removido

Não pertencem a esta seção:

- enum do TypeScript;
- enum do Java;
- enum do C#;
- constantes técnicas;
- códigos internos;
- valores inteiros;
- mapeamentos ORM;
- representação em banco de dados;
- serialização.

Esses elementos pertencem à implementação.

---

# Ajustes editoriais

## Enum como Vocabulário Oficial

Todo Enum deverá representar um termo oficial da Linguagem Ubíqua do TEAR.

---

## Conjunto Fechado

Cada Enum representa um conjunto fechado de valores válidos.

Qualquer novo valor exige evolução explícita do modelo do domínio.

---

## Independência Tecnológica

Os Enums deverão permanecer válidos independentemente da linguagem de programação, banco de dados ou mecanismo de persistência utilizado.

---

# Estrutura prevista para a documentação final

A seção "Catálogo de Enums do Domínio" deverá conter apenas:

1. Conceito de Enum do Domínio
2. Enums da Marca
3. Enums da Parceira
4. Enums da Competência
5. Enums da Colaboração Mensal
6. Enums do Pagamento
7. Enums Compartilhados
8. Princípios dos Enums do Domínio

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Enum da Marca | Preservar |
| Enum da Parceira | Preservar |
| Enum da Competência | Preservar |
| Enum da Colaboração Mensal | Preservar |
| Enum do Pagamento | Preservar |
| Enums Compartilhados | Adaptar |
| Evolução dos Enums | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os conceitos do TEAR que possuírem conjuntos finitos de valores estiverem identificados como Enums do domínio, compondo um vocabulário consistente da Linguagem Ubíqua, independente de qualquer linguagem de programação, mecanismo de persistência ou tecnologia de implementação.  [oai_citation:1‡Microsoft Learn](https://learn.microsoft.com/en-us/archive/msdn-magazine/2009/february/best-practice-an-introduction-to-domain-driven-design?utm_source=chatgpt.com)

# 14. CATÁLOGO DE ENUMS DO DOMÍNIO

## Conceito de Enum do Domínio

No domínio do TEAR, um Enum representa um conjunto finito e previamente definido de valores válidos para determinado conceito de negócio.

Os Enums fazem parte da Linguagem Ubíqua do domínio e existem para eliminar ambiguidades, padronizar a comunicação entre especialistas do negócio e equipe técnica e garantir que determinados conceitos possam assumir apenas estados oficialmente reconhecidos.

Os Enums representam conceitos permanentes do domínio. A forma como esses valores serão implementados em código constitui uma decisão técnica e não integra o modelo conceitual. A Linguagem Ubíqua deve ser refletida diretamente no modelo do domínio e evoluir juntamente com o entendimento do negócio.  [oai_citation:0‡martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com)

---

# Enums da Marca

## Situação da Marca

Representa a condição operacional de uma Marca dentro do programa.

Este Enum descreve exclusivamente estados reconhecidos pelo domínio para indicar se uma Marca está apta ou não para operar no TEAR.

Todos os valores são mutuamente exclusivos.

---

# Enums da Parceira

## Situação da Parceira

Representa a condição operacional de uma Parceira durante sua participação no programa.

Esse Enum descreve exclusivamente estados relacionados à participação da influenciadora, permitindo que sua situação seja interpretada de maneira uniforme em todo o domínio.

Uma Parceira encontra-se sempre em exatamente um estado válido.

---

# Enums da Competência

## Situação da Competência

Representa o estágio atual de uma Competência dentro do ciclo operacional.

Os valores desse Enum identificam em que momento do ciclo a Competência se encontra, permitindo que todas as Colaborações Mensais associadas sejam interpretadas dentro do mesmo contexto temporal.

---

# Enums da Colaboração Mensal

## Situação da Colaboração Mensal

Representa a evolução operacional da Colaboração Mensal.

Esse Enum acompanha o progresso da colaboração durante todo o seu ciclo de vida, refletindo exclusivamente estados reconhecidos pelo domínio.

Cada Colaboração Mensal encontra-se sempre em um único estado operacional.

---

# Enums do Pagamento

## Situação do Pagamento

Representa a evolução do compromisso financeiro originado por uma Colaboração Mensal.

Os valores desse Enum descrevem exclusivamente situações reconhecidas pelo domínio financeiro, permitindo acompanhar a evolução do pagamento até sua conclusão.

---

# Enums Compartilhados

Sempre que um mesmo conceito de negócio for utilizado por mais de uma Entidade, deverá existir apenas um único Enum conceitual correspondente.

Essa abordagem garante:

- consistência da Linguagem Ubíqua;
- ausência de duplicidade conceitual;
- uniformidade entre diferentes Agregados;
- redução de ambiguidades;
- evolução centralizada dos conceitos do domínio.

Nenhuma Entidade deve definir interpretações distintas para o mesmo conceito de negócio. A consistência da Linguagem Ubíqua reduz ambiguidades e fortalece o alinhamento entre especialistas do domínio e equipe de desenvolvimento.  [oai_citation:1‡martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com)

---

# Evolução dos Enums

Os Enums do domínio representam conjuntos fechados de valores.

Novos valores somente poderão ser incorporados quando representarem novos conceitos permanentes do negócio.

Mudanças temporárias de processo, ajustes operacionais ou necessidades específicas de implementação não justificam a criação de novos valores.

Toda evolução de um Enum representa uma evolução da própria Linguagem Ubíqua.

---

# Princípios dos Enums do Domínio

Os Enums do domínio do TEAR seguem os seguintes princípios:

- Todo Enum representa um conceito oficial da Linguagem Ubíqua.
- Todo Enum define um conjunto finito de valores válidos.
- Os valores de um Enum são mutuamente exclusivos.
- Cada Enum representa exclusivamente conceitos do domínio.
- Um mesmo conceito de negócio deve possuir apenas um único Enum conceitual.
- Os Enums devem permanecer consistentes entre todos os Agregados que os utilizam.
- A evolução de um Enum representa uma evolução do próprio domínio.
- Os Enums independem de linguagem de programação, banco de dados, mecanismo de persistência ou tecnologia de implementação.
- A implementação técnica poderá representar esses Enums por qualquer mecanismo adequado, desde que preserve integralmente seu significado no domínio.

# PASSO 15 — MATRIZ COMPLETA DE RELACIONAMENTOS
## ENTREGA A — CURADORIA

### Objetivo

Consolidar todos os relacionamentos existentes entre Entidades, Aggregate Roots e Value Objects do domínio do TEAR em uma única matriz de referência, permitindo visualizar integralmente a estrutura conceitual do modelo.

Esta seção não cria novos relacionamentos. Seu propósito é reunir, padronizar e documentar todos os vínculos definidos ao longo do DATA_MODEL, servindo como visão consolidada da estrutura do domínio.

A matriz de relacionamentos complementa as cardinalidades ao apresentar, em um único local, a natureza, direção e obrigatoriedade de cada relação entre os conceitos do domínio.

---

# Escopo desta seção

A seção "Matriz Completa de Relacionamentos" deverá responder apenas às seguintes perguntas:

- Quais Entidades se relacionam entre si?
- Qual é a natureza de cada relacionamento?
- Quais relacionamentos são obrigatórios?
- Quais relacionamentos representam composição?
- Quais relacionamentos ocorrem apenas por referência entre Agregados?
- Como o domínio se organiza estruturalmente?

Esta seção não define:

- chaves estrangeiras;
- joins;
- tabelas associativas;
- mapeamentos ORM;
- consultas;
- SQL;
- APIs;
- implementação técnica.

---

# Conteúdo aprovado para preservação

## Marca ↔ Competência

**Preservar.**

Relacionamento estrutural permanente.

Uma Marca organiza diversas Competências.

Cada Competência pertence exclusivamente a uma Marca.

---

## Marca ↔ Colaboração Mensal

**Preservar.**

Toda Colaboração Mensal pertence a uma única Marca.

Uma Marca pode originar inúmeras Colaborações Mensais.

---

## Parceira ↔ Colaboração Mensal

**Preservar integralmente.**

A Parceira participa de diversas Colaborações Mensais ao longo do tempo.

Cada Colaboração Mensal representa a participação de exatamente uma Parceira.

---

## Competência ↔ Colaboração Mensal

**Preservar integralmente.**

Cada Competência reúne diversas Colaborações Mensais.

Toda Colaboração Mensal pertence a uma única Competência.

---

## Colaboração Mensal ↔ Pagamento

**Preservar.**

Cada Colaboração Mensal origina exatamente um Pagamento.

O Pagamento depende da existência da Colaboração Mensal correspondente.

---

## Colaboração Mensal ↔ Snapshot Comercial

**Preservar.**

O Snapshot Comercial constitui composição da Colaboração Mensal.

Sua existência depende integralmente dela.

---

# Conteúdo adaptado

## Aggregate Roots

Os relacionamentos entre Aggregate Roots deverão ser apresentados explicitamente como relações por identidade conceitual, preservando os limites de consistência do domínio.

---

## Value Objects

Os Value Objects deverão aparecer na matriz apenas vinculados às Entidades que os incorporam.

Jamais como elementos independentes.

---

## Dependência Conceitual

A matriz deverá distinguir claramente:

- referência entre Agregados;
- composição;
- pertencimento;
- dependência de ciclo de vida.

---

# Conteúdo removido

Não pertencem a esta seção:

- foreign keys;
- relacionamentos físicos;
- tabelas intermediárias;
- cascatas;
- lazy loading;
- eager loading;
- mapeamentos ORM;
- estratégias de persistência;
- implementação.

Esses aspectos pertencem ao modelo lógico ou físico.

---

# Ajustes editoriais

## Visão Consolidada

A matriz deverá reunir todos os relacionamentos definidos anteriormente, evitando duplicidade de definições.

---

## Consistência Terminológica

Todos os relacionamentos deverão utilizar exatamente a mesma nomenclatura adotada na Linguagem Ubíqua do TEAR.

---

## Independência Tecnológica

A matriz deverá permanecer completamente independente da forma como os relacionamentos serão implementados.

---

# Estrutura prevista para a documentação final

A seção "Matriz Completa de Relacionamentos" deverá conter apenas:

1. Conceito de Relacionamento
2. Relacionamentos entre Aggregate Roots
3. Relacionamentos de Composição
4. Relacionamentos com Value Objects
5. Matriz Consolidada de Relacionamentos
6. Princípios dos Relacionamentos

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Marca ↔ Competência | Preservar |
| Marca ↔ Colaboração Mensal | Preservar |
| Parceira ↔ Colaboração Mensal | Preservar |
| Competência ↔ Colaboração Mensal | Preservar |
| Colaboração Mensal ↔ Pagamento | Preservar |
| Colaboração Mensal ↔ Snapshot Comercial | Preservar |
| Aggregate Roots | Adaptar |
| Value Objects | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os relacionamentos do domínio estiverem consolidados em uma única matriz conceitual, identificando claramente sua natureza, direção, obrigatoriedade, dependência e responsabilidade dentro do modelo de domínio, sem qualquer referência a mecanismos técnicos de implementação. Em DDD, os relacionamentos entre Agregados devem preservar seus limites de consistência e ser definidos em termos da Linguagem Ubíqua do domínio. ([martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com))

# 15. MATRIZ COMPLETA DE RELACIONAMENTOS

## Conceito de Relacionamento

No domínio do TEAR, um relacionamento representa um vínculo permanente entre dois conceitos do negócio.

Esses relacionamentos organizam a estrutura do domínio, estabelecendo responsabilidades, dependências e limites entre Entidades, Aggregate Roots e Value Objects.

Todo relacionamento possui significado próprio na Linguagem Ubíqua e existe para representar uma necessidade do negócio, nunca uma decisão de implementação.

Os relacionamentos entre Aggregate Roots preservam seus limites de consistência, enquanto os Value Objects existem exclusivamente como parte da Entidade ou Agregado que os incorpora. Em Domain-Driven Design, os Agregados devem manter baixo acoplamento e relacionar-se preferencialmente por referência à identidade de outros Agregados. ([martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com))

---

# Relacionamentos entre Aggregate Roots

## Marca → Competência

A Marca organiza seus ciclos operacionais por meio das Competências.

Cada Competência pertence exclusivamente a uma única Marca.

Uma Marca pode possuir diversas Competências ao longo de sua existência.

Natureza do relacionamento:

- pertencimento;
- dependência operacional;
- relação permanente.

---

## Marca → Colaboração Mensal

Toda Colaboração Mensal é realizada em nome de uma única Marca.

Uma Marca pode originar diversas Colaborações Mensais durante diferentes Competências.

Natureza do relacionamento:

- referência entre Agregados;
- dependência de contexto operacional.

---

## Parceira → Colaboração Mensal

A Parceira participa do programa por meio das Colaborações Mensais.

Cada Colaboração Mensal representa exatamente uma participação da Parceira em determinada Competência.

Natureza do relacionamento:

- participação operacional;
- referência entre Agregados.

---

## Competência → Colaboração Mensal

A Competência reúne todas as Colaborações Mensais pertencentes ao respectivo ciclo operacional.

Cada Colaboração Mensal pertence exclusivamente a uma Competência.

Natureza do relacionamento:

- organização temporal;
- referência entre Agregados.

---

## Colaboração Mensal → Pagamento

Cada Colaboração Mensal origina exatamente um Pagamento.

O Pagamento existe exclusivamente em razão da Colaboração Mensal correspondente.

Natureza do relacionamento:

- dependência financeira;
- responsabilidade operacional.

---

# Relacionamentos de Composição

## Colaboração Mensal → Snapshot Comercial

O Snapshot Comercial constitui uma composição da Colaboração Mensal.

Sua existência depende integralmente da colaboração que o incorpora.

Ele:

- não possui identidade própria;
- não pode ser compartilhado;
- acompanha integralmente o ciclo de vida da Colaboração Mensal;
- preserva permanentemente o contexto comercial original.

---

# Relacionamentos com Value Objects

Os demais Value Objects participam exclusivamente das Entidades às quais pertencem.

Assim:

- Informações de Contato pertencem à Parceira;
- Localização pertence à Parceira;
- Período pertence à Competência;
- Informações Financeiras pertencem ao Pagamento;
- Datas Operacionais pertencem à Entidade que representam.

Nenhum Value Object estabelece relacionamento independente com outras Entidades.

Sua existência depende integralmente do Aggregate Root que o incorpora.

---

# Matriz Consolidada de Relacionamentos

| Origem | Destino | Natureza | Obrigatório |
|---------|----------|-----------|-------------|
| Marca | Competência | Pertencimento | Sim |
| Marca | Colaboração Mensal | Referência entre Agregados | Sim |
| Parceira | Colaboração Mensal | Participação Operacional | Sim |
| Competência | Colaboração Mensal | Organização Temporal | Sim |
| Colaboração Mensal | Pagamento | Dependência Financeira | Sim |
| Colaboração Mensal | Snapshot Comercial | Composição | Sim |
| Parceira | Informações de Contato | Composição (Value Object) | Sim |
| Parceira | Localização | Composição (Value Object) | Sim |
| Competência | Período | Composição (Value Object) | Sim |
| Pagamento | Informações Financeiras | Composição (Value Object) | Sim |
| Entidade correspondente | Datas Operacionais | Composição (Value Object) | Conforme o domínio |

---

# Princípios dos Relacionamentos

Os relacionamentos do domínio do TEAR seguem os seguintes princípios:

- Todo relacionamento representa uma regra permanente do negócio.
- Aggregate Roots preservam seus próprios limites de consistência.
- Relacionamentos entre Aggregate Roots ocorrem por referência conceitual.
- Nenhum Agregado incorpora diretamente o estado interno de outro Agregado.
- Todo relacionamento obrigatório representa uma dependência estrutural do domínio.
- Value Objects existem exclusivamente como parte da Entidade ou Aggregate Root que os incorpora.
- Relações de composição implicam dependência integral do ciclo de vida.
- Os relacionamentos preservam a rastreabilidade e a consistência do domínio.
- A definição dos relacionamentos independe de banco de dados, ORM, APIs ou qualquer tecnologia de implementação.

# PASSO 16 — GLOSSÁRIO DOS ATRIBUTOS
## ENTREGA A — CURADORIA

### Objetivo

Consolidar um glossário oficial contendo a definição conceitual de todos os atributos utilizados no domínio do TEAR, garantindo que cada termo possua um único significado dentro da Linguagem Ubíqua.

O Glossário dos Atributos existe para eliminar ambiguidades, padronizar interpretações e servir como referência para analistas, especialistas do domínio e desenvolvedores.

Cada atributo deve possuir uma definição de negócio, independentemente da Entidade na qual seja utilizado. A construção de uma Linguagem Ubíqua compartilhada é um dos princípios centrais do Domain-Driven Design. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

---

# Escopo desta seção

A seção "Glossário dos Atributos" deverá responder apenas às seguintes perguntas:

- O que significa cada atributo do domínio?
- Qual conceito de negócio cada atributo representa?
- Como interpretar corretamente cada atributo?
- Quais atributos possuem o mesmo significado em diferentes Entidades?
- Quais termos compõem oficialmente a Linguagem Ubíqua do TEAR?

Esta seção não define:

- nomes de colunas;
- nomes de propriedades do código;
- aliases técnicos;
- convenções de nomenclatura;
- tipos de dados;
- formatos de armazenamento;
- serialização;
- implementação.

---

# Conteúdo aprovado para preservação

## Definição conceitual dos atributos

**Preservar integralmente.**

Cada atributo deverá possuir uma definição clara, objetiva e única.

A definição deve refletir exclusivamente seu significado para o negócio.

---

## Vocabulário único

**Preservar.**

Um mesmo atributo deve possuir apenas uma definição oficial em todo o domínio.

Não poderão existir interpretações diferentes para o mesmo termo.

---

## Reutilização de conceitos

**Preservar.**

Quando um atributo representar o mesmo conceito em diferentes Entidades, deverá compartilhar exatamente a mesma definição conceitual.

---

# Conteúdo adaptado

## Organização por ordem alfabética

O glossário deverá ser organizado alfabeticamente para facilitar consultas.

---

## Referência cruzada

Sempre que pertinente, cada atributo poderá indicar as Entidades nas quais é utilizado, sem repetir sua definição.

---

## Evolução do glossário

Novos atributos somente poderão ser incorporados quando representarem novos conceitos permanentes do domínio.

---

# Conteúdo removido

Não pertencem a esta seção:

- nomes de campos SQL;
- nomes de propriedades TypeScript;
- nomes de variáveis;
- DTOs;
- schemas;
- documentação de API;
- documentação ORM;
- formatos JSON;
- implementação.

Esses elementos pertencem às camadas técnicas.

---

# Ajustes editoriais

## Linguagem Ubíqua

Toda definição deverá utilizar exclusivamente a terminologia oficial do domínio.

---

## Definições atemporais

As definições deverão permanecer válidas independentemente de mudanças tecnológicas ou operacionais.

---

## Independência Tecnológica

O glossário deverá permanecer completamente independente da linguagem de programação, banco de dados ou mecanismo de persistência adotado.

---

# Estrutura prevista para a documentação final

A seção "Glossário dos Atributos" deverá conter apenas:

1. Conceito de Glossário dos Atributos
2. Organização do Glossário
3. Glossário Alfabético dos Atributos
4. Referências às Entidades
5. Evolução do Glossário
6. Princípios do Glossário

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Definição conceitual dos atributos | Preservar |
| Vocabulário único | Preservar |
| Reutilização de conceitos | Preservar |
| Organização alfabética | Adaptar |
| Referência cruzada | Adaptar |
| Evolução do glossário | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os atributos do domínio possuírem uma definição única, clara e consistente, organizada em um glossário oficial que componha a Linguagem Ubíqua do TEAR, eliminando ambiguidades e permanecendo totalmente independente de qualquer tecnologia ou detalhe de implementação. O glossário deverá servir como referência única para interpretação dos conceitos de negócio utilizados em todo o modelo de domínio. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

# 16. GLOSSÁRIO DOS ATRIBUTOS

## Conceito de Glossário dos Atributos

O Glossário dos Atributos reúne as definições oficiais dos atributos utilizados pelo domínio do TEAR.

Seu objetivo é estabelecer uma interpretação única para cada termo da Linguagem Ubíqua, eliminando ambiguidades e garantindo que um mesmo atributo possua exatamente o mesmo significado em qualquer parte do modelo.

As definições apresentadas descrevem exclusivamente conceitos de negócio e permanecem independentes de nomenclaturas técnicas, estruturas de persistência ou tecnologias de implementação. A Linguagem Ubíqua deve ser compartilhada entre especialistas do domínio e equipe técnica, refletindo fielmente os conceitos do negócio. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

---

# Organização do Glossário

Os atributos são apresentados em ordem alfabética.

Cada definição descreve:

- o significado do atributo no domínio;
- sua interpretação oficial;
- quando pertinente, as Entidades nas quais o atributo pode estar presente.

Sempre que um atributo representar o mesmo conceito em diferentes Entidades, sua definição permanecerá única.

---

# Glossário Alfabético dos Atributos

## Colaboração Mensal

Unidade operacional que representa a participação de uma Parceira em uma determinada Competência para uma Marca específica.

**Utilizado em:**

- Colaboração Mensal.

---

## Competência

Período operacional utilizado para organizar as atividades do programa.

**Utilizado em:**

- Competência;
- Colaboração Mensal.

---

## Data

Informação temporal utilizada para representar acontecimentos relevantes do domínio.

Seu significado específico depende do contexto em que é empregada.

**Utilizado em:**

- Competência;
- Colaboração Mensal;
- Pagamento.

---

## Identificador

Informação utilizada para distinguir unicamente uma Entidade dentro do domínio.

Permanece estável durante todo o seu ciclo de vida.

**Utilizado em:**

- Marca;
- Parceira;
- Competência;
- Colaboração Mensal;
- Pagamento.

---

## Informações Financeiras

Conjunto de informações que caracteriza um compromisso financeiro relacionado a uma Colaboração Mensal.

**Utilizado em:**

- Pagamento.

---

## Localização

Informação que representa a localização associada a uma Parceira.

É tratada como um conceito único do domínio.

**Utilizado em:**

- Parceira.

---

## Marca

Informação que identifica a organização responsável pelo programa de marketing de influência.

**Utilizado em:**

- Marca;
- Colaboração Mensal.

---

## Período

Intervalo temporal que caracteriza uma Competência.

**Utilizado em:**

- Competência.

---

## Snapshot Comercial

Registro imutável das condições comerciais existentes no momento da criação de uma Colaboração Mensal.

Seu conteúdo preserva permanentemente o contexto original da negociação.

**Utilizado em:**

- Colaboração Mensal.

---

## Situação

Informação que representa o estado atual de uma Entidade dentro de seu ciclo de vida.

Cada Entidade possui sua própria interpretação de Situação conforme as regras do domínio.

**Utilizado em:**

- Marca;
- Parceira;
- Competência;
- Colaboração Mensal;
- Pagamento.

---

## Valor

Informação que representa a dimensão financeira de um compromisso assumido pelo domínio.

Seu significado é sempre determinado pelo contexto financeiro correspondente.

**Utilizado em:**

- Pagamento.

---

# Referências às Entidades

Os atributos documentados podem ser compartilhados por diferentes Entidades sempre que representarem exatamente o mesmo conceito do domínio.

Quando isso ocorrer:

- a definição permanece única;
- apenas sua utilização varia conforme a Entidade correspondente;
- nenhuma Entidade redefine o significado do atributo.

Essa abordagem preserva a consistência da Linguagem Ubíqua em todo o modelo.

---

# Evolução do Glossário

O Glossário dos Atributos evolui juntamente com o domínio.

Novos atributos somente poderão ser incorporados quando representarem novos conceitos permanentes do negócio.

Alterações na definição de um atributo representam alterações na própria Linguagem Ubíqua e devem preservar a consistência de toda a documentação do domínio.

---

# Princípios do Glossário

O Glossário dos Atributos do TEAR segue os seguintes princípios:

- Todo atributo possui uma única definição oficial.
- Toda definição representa exclusivamente um conceito do domínio.
- Um mesmo atributo mantém o mesmo significado em todas as Entidades onde é utilizado.
- O Glossário constitui parte integrante da Linguagem Ubíqua.
- A evolução do Glossário acompanha a evolução do domínio.
- A organização do Glossário favorece a consulta e a padronização terminológica.
- As definições permanecem independentes de banco de dados, linguagem de programação, APIs ou qualquer tecnologia de implementação.
- O Glossário serve como referência oficial para interpretação dos atributos utilizados em todo o modelo de domínio.

# PASSO 17 — DIAGRAMA CONCEITUAL (ER OU UML DE DOMÍNIO)
## ENTREGA A — CURADORIA

### Objetivo

Definir a representação gráfica oficial do modelo conceitual do domínio do TEAR, consolidando Entidades, Aggregate Roots, Value Objects e seus relacionamentos em um único diagrama de referência.

O Diagrama Conceitual tem como finalidade facilitar a compreensão da estrutura do domínio, tornando explícitas as responsabilidades de cada conceito, seus limites de consistência e seus vínculos permanentes.

Esta seção representa o modelo de domínio e não a implementação do sistema. Em Domain-Driven Design, diagramas de domínio são utilizados para comunicar a estrutura conceitual e a Linguagem Ubíqua, sem reproduzir detalhes de infraestrutura ou persistência. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

---

# Escopo desta seção

A seção "Diagrama Conceitual" deverá responder apenas às seguintes perguntas:

- Quais são os principais conceitos do domínio?
- Como as Entidades se relacionam?
- Quais objetos constituem Aggregate Roots?
- Quais Value Objects pertencem a cada Entidade?
- Quais limites de consistência existem entre os Agregados?
- Como o domínio pode ser compreendido visualmente?

Esta seção não define:

- tabelas;
- banco de dados;
- chaves estrangeiras;
- diagramas físicos;
- arquitetura de software;
- componentes;
- microsserviços;
- APIs;
- implementação.

---

# Conteúdo aprovado para preservação

## Aggregate Roots

**Preservar integralmente.**

O diagrama deverá identificar claramente os seguintes Aggregate Roots:

- Marca;
- Parceira;
- Competência;
- Colaboração Mensal;
- Pagamento.

Cada Agregado deverá possuir limites conceituais claramente identificáveis.

---

## Entidades

**Preservar.**

As Entidades deverão aparecer representadas conforme a Linguagem Ubíqua oficial do domínio.

Não deverão ser utilizadas nomenclaturas técnicas.

---

## Value Objects

**Preservar integralmente.**

Os Value Objects deverão ser representados apenas como componentes das Entidades às quais pertencem.

Incluem:

- Snapshot Comercial;
- Informações de Contato;
- Localização;
- Período;
- Informações Financeiras;
- Datas Operacionais.

Nenhum Value Object deverá aparecer isoladamente.

---

## Relacionamentos

**Preservar integralmente.**

Todos os relacionamentos definidos anteriormente deverão ser representados graficamente.

As cardinalidades deverão permanecer consistentes com a seção correspondente do DATA_MODEL.

---

# Conteúdo adaptado

## UML de Domínio

O diagrama poderá utilizar notação UML simplificada, desde que represente exclusivamente conceitos do domínio.

Não deverão ser exibidos métodos, tipos de dados ou detalhes de implementação.

---

## ER Conceitual

Alternativamente, poderá ser utilizada uma representação Entidade-Relacionamento em nível exclusivamente conceitual.

O objetivo permanece comunicar o domínio e não o modelo físico.

---

## Limites dos Agregados

Sempre que possível, o diagrama deverá evidenciar visualmente os limites de cada Aggregate Root.

---

# Conteúdo removido

Não pertencem a esta seção:

- UML de classes de implementação;
- atributos técnicos;
- métodos;
- interfaces;
- controllers;
- repositories;
- services;
- DTOs;
- schemas;
- diagramas de banco de dados;
- diagramas de infraestrutura;
- componentes físicos.

Esses elementos pertencem à documentação técnica.

---

# Ajustes editoriais

## Linguagem Ubíqua

Todos os nomes apresentados no diagrama deverão utilizar exclusivamente a terminologia oficial do domínio.

---

## Legibilidade

O diagrama deverá privilegiar clareza e simplicidade, evitando excesso de informações.

---

## Independência Tecnológica

O Diagrama Conceitual deverá permanecer válido independentemente da arquitetura, linguagem de programação ou mecanismo de persistência adotado.

---

# Estrutura prevista para a documentação final

A seção "Diagrama Conceitual" deverá conter apenas:

1. Conceito de Diagrama Conceitual
2. Aggregate Roots
3. Entidades do Domínio
4. Value Objects
5. Relacionamentos
6. Diagrama UML de Domínio ou ER Conceitual
7. Princípios do Diagrama Conceitual

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Aggregate Roots | Preservar |
| Entidades | Preservar |
| Value Objects | Preservar |
| Relacionamentos | Preservar |
| UML de Domínio | Adaptar |
| ER Conceitual | Adaptar |
| Limites dos Agregados | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando o domínio do TEAR puder ser representado por um único diagrama conceitual, utilizando UML de Domínio ou ER Conceitual, evidenciando Aggregate Roots, Entidades, Value Objects, relacionamentos e limites de consistência, sem qualquer dependência de tecnologias, bancos de dados ou detalhes de implementação. O diagrama deverá servir como representação visual oficial da Linguagem Ubíqua e do modelo conceitual do domínio. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

# 17. DIAGRAMA CONCEITUAL

## Conceito de Diagrama Conceitual

O Diagrama Conceitual representa, de forma gráfica, a estrutura do domínio do TEAR.

Seu objetivo é tornar explícitos os principais conceitos do negócio, seus relacionamentos, os limites dos Aggregate Roots e a incorporação dos Value Objects, oferecendo uma visão única da organização do domínio.

O diagrama não descreve arquitetura de software, mecanismos de persistência ou estruturas físicas. Ele representa exclusivamente a organização conceitual da Linguagem Ubíqua e das regras permanentes do domínio. Diagramas de domínio em DDD têm como finalidade comunicar conceitos de negócio e seus relacionamentos, preservando a independência em relação à implementação. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

---

# Aggregate Roots

O domínio do TEAR é organizado pelos seguintes Aggregate Roots:

- Marca;
- Parceira;
- Competência;
- Colaboração Mensal;
- Pagamento.

Cada Aggregate Root representa um limite de consistência próprio e constitui o ponto de entrada para as operações realizadas sobre seu respectivo Agregado.

Nenhum Aggregate Root incorpora diretamente o estado interno de outro Agregado.

---

# Entidades do Domínio

As Entidades representadas no diagrama correspondem exclusivamente aos conceitos permanentes da Linguagem Ubíqua.

Cada uma possui identidade própria e ciclo de vida independente.

O modelo conceitual do TEAR é composto pelas seguintes Entidades:

- Marca;
- Parceira;
- Competência;
- Colaboração Mensal;
- Pagamento.

Os relacionamentos entre essas Entidades refletem exclusivamente regras permanentes do negócio.

---

# Value Objects

Os Value Objects aparecem no diagrama apenas como parte integrante das Entidades às quais pertencem.

O domínio incorpora os seguintes Objetos de Valor:

### Parceira

- Informações de Contato;
- Localização.

### Competência

- Período.

### Colaboração Mensal

- Snapshot Comercial.

### Pagamento

- Informações Financeiras;
- Datas Operacionais.

Nenhum Value Object possui identidade própria ou relacionamento independente.

---

# Relacionamentos

O modelo conceitual estabelece os seguintes relacionamentos permanentes:

- Marca organiza Competências;
- Marca origina Colaborações Mensais;
- Parceira participa de Colaborações Mensais;
- Competência reúne Colaborações Mensais;
- Colaboração Mensal origina um Pagamento;
- Colaboração Mensal incorpora um Snapshot Comercial;
- Parceira incorpora Informações de Contato e Localização;
- Competência incorpora um Período;
- Pagamento incorpora Informações Financeiras e Datas Operacionais.

Todos esses relacionamentos preservam os limites de consistência definidos para cada Agregado.

---

# Diagrama UML de Domínio

```text
┌────────────────────────────┐
│           Marca            │
│ <<Aggregate Root>>         │
└─────────────┬──────────────┘
              │ 1
              │
              │ N
      ┌───────▼────────┐
      │ Competência    │
      │ <<AR>>         │
      │─────────────── │
      │ ◼ Período      │
      └───────┬────────┘
              │ 1
              │
              │ N
              ▼
┌────────────────────────────┐
│    Colaboração Mensal      │
│ <<Aggregate Root>>         │
│────────────────────────────│
│ ◼ Snapshot Comercial       │
└───────┬───────────┬────────┘
        │           │
        │           │
        │           │
        │           ▼
        │      ┌───────────────┐
        │      │ Pagamento     │
        │      │ <<AR>>        │
        │      │────────────── │
        │      │ ◼ Informações │
        │      │   Financeiras │
        │      │ ◼ Datas Op.   │
        │      └───────────────┘
        │
        │
        ▼
┌────────────────────────────┐
│         Parceira           │
│ <<Aggregate Root>>         │
│────────────────────────────│
│ ◼ Informações de Contato   │
│ ◼ Localização              │
└────────────────────────────┘
```

### Legenda

- `<<Aggregate Root>>` representa um Agregado do domínio.
- `◼` representa um Value Object incorporado.
- As ligações representam relacionamentos permanentes da Linguagem Ubíqua.
- O diagrama possui caráter exclusivamente conceitual.

---

# Princípios do Diagrama Conceitual

O Diagrama Conceitual do TEAR segue os seguintes princípios:

- O diagrama representa exclusivamente conceitos do domínio.
- Toda Entidade corresponde à Linguagem Ubíqua oficial.
- Aggregate Roots delimitam os limites de consistência do modelo.
- Value Objects aparecem apenas incorporados às Entidades correspondentes.
- Os relacionamentos representam regras permanentes do negócio.
- O diagrama consolida a visão estrutural de todo o modelo de domínio.
- O modelo permanece independente de banco de dados, APIs, frameworks, linguagens de programação ou qualquer tecnologia de implementação.
- O Diagrama Conceitual constitui a representação visual oficial do modelo de domínio do TEAR.

# PASSO 18 — RESUMO FINAL DO MODELO
## ENTREGA A — CURADORIA

### Objetivo

Consolidar, em uma visão sintética e integrada, o Modelo de Domínio do TEAR, reunindo os principais conceitos, decisões estruturais e princípios documentados ao longo deste DATA_MODEL.

O Resumo Final do Modelo não introduz novos conceitos nem redefine regras já estabelecidas. Sua finalidade é oferecer uma visão executiva do modelo conceitual, facilitando sua compreensão por especialistas do domínio, arquitetos de software e equipes de desenvolvimento.

Esta seção representa a síntese oficial do Modelo de Domínio.

---

# Escopo desta seção

A seção "Resumo Final do Modelo" deverá responder apenas às seguintes perguntas:

- Como o domínio do TEAR está estruturado?
- Quais são seus principais conceitos?
- Como os Agregados se organizam?
- Quais princípios orientam o modelo?
- Quais características definem a arquitetura conceitual do domínio?

Esta seção não define:

- novas regras de negócio;
- novos relacionamentos;
- novos atributos;
- novas Entidades;
- decisões arquiteturais;
- tecnologias;
- banco de dados;
- APIs;
- implementação.

---

# Conteúdo aprovado para preservação

## Visão Geral do Modelo

**Preservar integralmente.**

Apresentar uma síntese do modelo como um todo.

Explicar, em alto nível, como o domínio está organizado.

---

## Aggregate Roots

**Preservar.**

Reafirmar os cinco Aggregate Roots oficiais:

- Marca;
- Parceira;
- Competência;
- Colaboração Mensal;
- Pagamento.

Sem redefinir seus detalhes.

---

## Linguagem Ubíqua

**Preservar.**

Reforçar que todo o modelo utiliza exclusivamente a terminologia oficial do domínio.

---

## Value Objects

**Preservar.**

Reafirmar que os Objetos de Valor complementam as Entidades e existem apenas incorporados aos respectivos Agregados.

---

## Integridade do Modelo

**Preservar.**

Reforçar que os invariantes, relacionamentos, cardinalidades e restrições compõem um único modelo consistente.

---

# Conteúdo adaptado

## Visão Arquitetural Conceitual

Apresentar uma síntese da arquitetura conceitual do domínio, enfatizando:

- baixo acoplamento;
- alta coesão;
- limites dos Agregados;
- preservação da consistência;
- independência tecnológica.

---

## Evolução do Modelo

Registrar que o modelo foi concebido para evoluir continuamente sem perder consistência conceitual.

---

## Papel do DATA_MODEL

Explicitar que este documento constitui a referência oficial para toda modelagem do domínio.

---

# Conteúdo removido

Não pertencem a esta seção:

- exemplos técnicos;
- código;
- banco de dados;
- frameworks;
- diagramas físicos;
- APIs;
- infraestrutura;
- estratégias de implementação;
- decisões arquiteturais específicas.

Esses assuntos pertencem a documentos técnicos complementares.

---

# Ajustes editoriais

## Síntese

A seção deverá resumir o modelo sem repetir integralmente conteúdos já documentados.

---

## Consistência

Toda afirmação deverá estar alinhada às definições apresentadas nas seções anteriores.

Nenhum novo conceito poderá ser introduzido.

---

## Independência Tecnológica

O resumo deverá permanecer completamente independente de qualquer tecnologia, linguagem de programação ou mecanismo de persistência.

---

# Estrutura prevista para a documentação final

A seção "Resumo Final do Modelo" deverá conter apenas:

1. Visão Geral do Modelo
2. Estrutura Conceitual
3. Aggregate Roots
4. Linguagem Ubíqua
5. Value Objects
6. Integridade do Modelo
7. Evolução do Modelo
8. Papel do DATA_MODEL
9. Princípios do Modelo

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Visão Geral do Modelo | Preservar |
| Aggregate Roots | Preservar |
| Linguagem Ubíqua | Preservar |
| Value Objects | Preservar |
| Integridade do Modelo | Preservar |
| Visão Arquitetural Conceitual | Adaptar |
| Evolução do Modelo | Adaptar |
| Papel do DATA_MODEL | Adaptar |
| Aspectos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando o DATA_MODEL puder ser encerrado por uma síntese única, coerente e abrangente do Modelo de Domínio do TEAR, consolidando todos os conceitos previamente definidos, reafirmando a Linguagem Ubíqua, os Aggregate Roots, os Value Objects e os princípios de consistência do domínio, sem introduzir novos elementos ou depender de qualquer tecnologia de implementação. Um modelo de domínio bem definido deve servir como a representação compartilhada do conhecimento do negócio e como referência permanente para sua evolução. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

# 18. RESUMO FINAL DO MODELO

## Visão Geral do Modelo

O Modelo de Domínio do TEAR descreve a estrutura conceitual responsável por representar o programa de marketing de influência da organização.

Todo o modelo foi construído sob a perspectiva do negócio, utilizando exclusivamente conceitos da Linguagem Ubíqua e separando integralmente o domínio das decisões de implementação.

O domínio é organizado em torno de Entidades, Aggregate Roots, Value Objects, relacionamentos, invariantes e regras permanentes que representam a realidade operacional do programa.

Seu propósito é fornecer uma representação estável, consistente e evolutiva do conhecimento do negócio. Em Domain-Driven Design, o modelo de domínio constitui a representação compartilhada dos conceitos centrais do negócio e orienta toda a evolução do sistema. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

---

# Estrutura Conceitual

O domínio do TEAR organiza-se a partir de um conjunto reduzido de conceitos centrais, cada um responsável por representar uma parte específica da operação.

Esses conceitos são relacionados entre si por regras permanentes do negócio, preservando responsabilidades claramente definidas e baixo acoplamento entre os diferentes Agregados.

O modelo estabelece:

- Entidades com identidade própria;
- Aggregate Roots responsáveis pelos limites de consistência;
- Value Objects representando conceitos sem identidade;
- relacionamentos permanentes entre os Agregados;
- invariantes que preservam a integridade do domínio;
- estados de ciclo de vida;
- histórico permanente das operações relevantes.

Essa organização permite compreender integralmente o funcionamento do domínio sem depender de qualquer tecnologia.

---

# Aggregate Roots

O domínio possui cinco Aggregate Roots oficiais:

- Marca;
- Parceira;
- Competência;
- Colaboração Mensal;
- Pagamento.

Cada Aggregate Root representa uma unidade de consistência do domínio e concentra a responsabilidade pela preservação das regras de negócio de seu respectivo Agregado.

Os relacionamentos entre Agregados ocorrem preservando seus limites conceituais e sua autonomia.

---

# Linguagem Ubíqua

Toda a documentação do DATA_MODEL utiliza exclusivamente a terminologia oficial do domínio.

Os conceitos, Entidades, atributos, relacionamentos e estados foram definidos para possuir um único significado em todo o modelo.

A Linguagem Ubíqua constitui o vocabulário oficial do TEAR e serve como referência permanente para especialistas do domínio, arquitetos e equipes de desenvolvimento.

A evolução do domínio deve preservar a consistência dessa linguagem compartilhada.

---

# Value Objects

Os Value Objects complementam o modelo ao representar conceitos definidos exclusivamente por seus valores.

No domínio do TEAR, esses Objetos de Valor:

- não possuem identidade própria;
- não possuem ciclo de vida independente;
- existem apenas incorporados às respectivas Entidades;
- preservam conceitos coesos do negócio;
- fortalecem a expressividade da Linguagem Ubíqua.

Sua utilização reduz a complexidade do modelo e contribui para uma representação mais fiel dos conceitos do domínio.

---

# Integridade do Modelo

A integridade do Modelo de Domínio é preservada por um conjunto consistente de regras permanentes.

Essas regras incluem:

- identidade das Entidades;
- limites dos Aggregate Roots;
- cardinalidades;
- relacionamentos obrigatórios;
- invariantes do domínio;
- estados válidos;
- imutabilidade dos Value Objects;
- preservação histórica;
- unicidade dos conceitos documentados.

Esses elementos formam um único modelo conceitual coeso e consistente.

---

# Evolução do Modelo

O Modelo de Domínio foi concebido para evoluir continuamente conforme o negócio evolui.

Novos conceitos poderão ser incorporados desde que:

- representem necessidades permanentes do domínio;
- preservem a Linguagem Ubíqua;
- respeitem os limites dos Aggregate Roots;
- mantenham a consistência dos relacionamentos;
- não violem os invariantes estabelecidos.

A evolução do modelo deverá ocorrer de maneira incremental, preservando sua estabilidade conceitual.

---

# Papel do DATA_MODEL

O DATA_MODEL constitui a documentação oficial do Modelo de Domínio do TEAR.

Seu propósito é consolidar, em um único documento, a definição formal de:

- Entidades;
- Aggregate Roots;
- Value Objects;
- atributos;
- relacionamentos;
- cardinalidades;
- invariantes;
- estados;
- restrições;
- conceitos da Linguagem Ubíqua.

Toda documentação técnica posterior deverá utilizar este documento como referência para interpretação do domínio.

---

# Princípios do Modelo

O Modelo de Domínio do TEAR segue os seguintes princípios:

- O domínio representa exclusivamente conceitos do negócio.
- Toda Entidade possui identidade própria.
- Aggregate Roots definem os limites de consistência do modelo.
- Value Objects representam conceitos definidos exclusivamente por seus valores.
- A Linguagem Ubíqua constitui a terminologia oficial do domínio.
- Os relacionamentos refletem regras permanentes do negócio.
- Os invariantes preservam a integridade do modelo.
- O histórico integra permanentemente a memória operacional do domínio.
- O modelo evolui preservando sua consistência conceitual.
- O DATA_MODEL constitui a referência oficial para compreensão e evolução do domínio.
- O Modelo de Domínio permanece completamente independente de bancos de dados, linguagens de programação, frameworks, APIs ou qualquer tecnologia de implementação.