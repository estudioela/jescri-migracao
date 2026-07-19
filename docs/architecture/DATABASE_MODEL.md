# 1. FILOSOFIA DO MODELO DE DADOS

## Propósito

O Modelo de Dados do TEAR define a forma pela qual o conhecimento do domínio será organizado, estruturado e preservado ao longo do tempo.

Seu objetivo é garantir que todas as informações necessárias para a operação do negócio sejam representadas de maneira consistente, íntegra e evolutiva, mantendo correspondência direta com o Modelo de Domínio estabelecido no DATA_MODEL.

O Modelo de Dados não redefine o domínio. Ele traduz sua estrutura conceitual para uma organização lógica adequada à persistência das informações, preservando o significado dos conceitos originais. A literatura de modelagem de dados distingue claramente os níveis conceitual, lógico e físico, sendo o modelo lógico responsável por transformar o domínio em uma estrutura organizada sem depender de um mecanismo específico de armazenamento.  [oai_citation:0‡ScienceDirect](https://www.sciencedirect.com/topics/engineering/data-model?utm_source=chatgpt.com)

---

# Princípios Fundamentais

O Modelo de Dados do TEAR é orientado pelos seguintes princípios:

- fidelidade ao Modelo de Domínio;
- preservação da Linguagem Ubíqua;
- separação entre regras de negócio e persistência;
- consistência estrutural;
- evolução incremental;
- rastreabilidade das informações;
- independência tecnológica.

Toda decisão estrutural deverá respeitar esses princípios.

---

# O Modelo de Dados Como Derivação do Domínio

O Modelo de Dados deriva integralmente do Modelo de Domínio.

Nenhuma estrutura poderá existir sem representar um conceito previamente definido no domínio.

Da mesma forma:

- toda estrutura persistida deverá corresponder a um conceito do negócio;
- todo relacionamento deverá refletir uma relação permanente do domínio;
- toda restrição deverá representar uma regra de negócio documentada;
- toda informação armazenada deverá possuir significado para a operação do TEAR.

O modelo de persistência existe para sustentar o domínio, e não para defini-lo.

---

# Separação entre Domínio e Persistência

O Modelo de Dados constitui uma camada de representação das informações, distinta do Modelo de Domínio.

Enquanto o domínio descreve conceitos, responsabilidades e regras do negócio, o Modelo de Dados organiza essas informações para armazenamento, consulta e manutenção.

Essa separação permite que alterações tecnológicas ocorram sem modificar a estrutura conceitual do negócio e preserva a estabilidade do domínio diante da evolução da infraestrutura.  [oai_citation:1‡typedb.com](https://typedb.com/docs/academy/9-modeling-schemas/9.1-the-pera-model?utm_source=chatgpt.com)

---

# Organização do Modelo

O Modelo de Dados será organizado de forma a representar:

- estruturas persistentes;
- identificadores;
- atributos;
- relacionamentos;
- restrições de integridade;
- mecanismos de histórico;
- convenções de nomenclatura;
- elementos necessários para garantir consistência dos dados.

Cada elemento deverá possuir responsabilidade claramente definida e participar de uma única representação coerente do domínio.

---

# Evolução do Modelo

O Modelo de Dados foi concebido para evoluir continuamente conforme o domínio evolui.

Novas estruturas poderão ser incorporadas desde que:

- representem conceitos permanentes do negócio;
- preservem a compatibilidade com o Modelo de Domínio;
- mantenham a integridade das informações existentes;
- não comprometam a consistência estrutural do modelo.

Toda evolução deverá priorizar estabilidade, clareza e continuidade histórica.

---

# Papel do DATABASE_MODEL

O DATABASE_MODEL constitui a documentação oficial da estrutura lógica de persistência do TEAR.

Este documento estabelece as diretrizes para organização dos dados, servindo como referência para futuras implementações em diferentes mecanismos de armazenamento.

As decisões aqui documentadas descrevem **como as informações do domínio são estruturadas**, sem impor dependência a qualquer banco de dados, linguagem, framework ou plataforma específica.

---

# Princípios da Documentação

A documentação do Modelo de Dados segue os seguintes princípios:

- representar exclusivamente estruturas de persistência derivadas do domínio;
- preservar integralmente a Linguagem Ubíqua;
- manter correspondência direta com o DATA_MODEL;
- documentar todas as estruturas de forma consistente;
- permanecer independente de tecnologias específicas;
- permitir evolução controlada e rastreável;
- servir como referência oficial para a construção do modelo lógico e de suas futuras implementações físicas.

# 2. MAPEAMENTO AGGREGATE → TABELA

## Objetivo

O Modelo de Dados do TEAR estabelece uma correspondência direta entre os Aggregate Roots definidos no DATA_MODEL e as estruturas responsáveis por sua persistência.

Como princípio geral, cada Aggregate Root é representado por uma estrutura persistente própria, responsável por armazenar sua identidade, seus atributos e as referências necessárias para manter a integridade do domínio.

Essa organização preserva os limites de consistência estabelecidos pelo Modelo de Domínio e mantém a independência entre os diferentes Agregados.

---

# Princípios de Mapeamento

O mapeamento entre Agregados e estruturas persistentes segue os seguintes princípios:

- cada Aggregate Root origina uma estrutura persistente principal;
- cada estrutura representa apenas um conceito do domínio;
- nenhum Aggregate Root compartilha sua estrutura principal com outro Agregado;
- os limites de consistência definidos no DATA_MODEL permanecem preservados;
- os relacionamentos entre Agregados são representados por referências entre suas respectivas estruturas persistentes.

---

# Correspondência entre Aggregate Roots e Estruturas Persistentes

| Aggregate Root | Estrutura Persistente |
|----------------|-----------------------|
| Marca | Marca |
| Parceira | Parceira |
| Competência | Competência |
| Colaboração Mensal | Colaboração_Mensal |
| Pagamento | Pagamento |

Cada estrutura persistente constitui a representação oficial de seu respectivo Aggregate Root.

---

# Persistência dos Value Objects

Os Value Objects não originam estruturas persistentes independentes.

Eles são incorporados diretamente à estrutura persistente do Aggregate Root ao qual pertencem, preservando o princípio de que não possuem identidade nem ciclo de vida próprios.

O mapeamento é o seguinte:

| Aggregate Root | Value Objects Incorporados |
|----------------|----------------------------|
| Parceira | Informações de Contato, Localização |
| Competência | Período |
| Colaboração Mensal | Snapshot Comercial |
| Pagamento | Informações Financeiras, Datas Operacionais |

A Entidade **Marca** não incorpora Value Objects definidos no Modelo de Domínio.

---

# Persistência das Relações entre Agregados

Os relacionamentos definidos no DATA_MODEL são preservados por meio de referências entre as estruturas persistentes correspondentes.

As principais dependências são:

| Origem | Destino |
|---------|---------|
| Competência | Marca |
| Colaboração Mensal | Marca |
| Colaboração Mensal | Competência |
| Colaboração Mensal | Parceira |
| Pagamento | Colaboração Mensal |

Essas referências mantêm a organização lógica do domínio sem alterar os limites de responsabilidade de cada Aggregate Root.

---

# Correspondência com o Modelo de Domínio

Todo elemento persistido possui origem direta no DATA_MODEL.

Não existem estruturas persistentes criadas exclusivamente por conveniência técnica.

Da mesma forma:

- nenhuma estrutura representa mais de um Aggregate Root;
- nenhum Aggregate Root deixa de possuir representação persistente;
- nenhum relacionamento é criado sem respaldo no Modelo de Domínio.

Essa correspondência garante rastreabilidade completa entre o domínio e o modelo de dados.

---

# Princípios do Mapeamento

O mapeamento Aggregate → Estrutura Persistente segue os seguintes princípios:

- existe correspondência direta entre Aggregate Root e estrutura persistente principal;
- os limites dos Agregados permanecem preservados;
- Value Objects são incorporados às estruturas dos respectivos Agregados;
- relacionamentos entre Agregados são representados por referências persistentes;
- nenhuma estrutura existe sem representar um conceito do domínio;
- toda estrutura deriva exclusivamente do Modelo de Domínio;
- o Modelo de Dados mantém correspondência integral com o DATA_MODEL, preservando a Linguagem Ubíqua e a consistência do negócio.

# 3. LISTA DE TABELAS

## Objetivo

O Modelo de Dados do TEAR organiza a persistência das informações por meio de tabelas que representam exclusivamente conceitos permanentes do domínio.

Cada tabela corresponde a uma responsabilidade claramente definida e possui origem direta no Modelo de Domínio, preservando a Linguagem Ubíqua, os limites dos Aggregate Roots e a consistência das relações estabelecidas no DATA_MODEL.

A lista apresentada nesta seção define o conjunto oficial de tabelas do modelo lógico de dados.

---

# Princípios de Organização

A definição das tabelas segue os seguintes princípios:

- cada tabela representa um único conceito do domínio;
- cada Aggregate Root possui uma tabela principal;
- nenhuma tabela representa mais de um Aggregate Root;
- Value Objects são incorporados às tabelas de seus respectivos Agregados;
- relacionamentos são estabelecidos por referências entre tabelas;
- não existem tabelas criadas exclusivamente por conveniência técnica.

---

# Tabelas Oficiais do Modelo

## Marca

Representa a organização responsável pelo programa de influência.

Armazena as informações institucionais da marca e serve como referência para as Competências e Colaborações Mensais.

---

## Parceira

Representa a influenciadora cadastrada no programa.

Concentra os dados cadastrais, comerciais e operacionais permanentes da participante, incluindo os Value Objects incorporados de Informações de Contato e Localização.

---

## Competência

Representa um ciclo operacional do programa, normalmente associado a um período específico.

Cada Competência pertence a uma Marca e organiza o conjunto de Colaborações Mensais realizadas naquele ciclo.

O Value Object **Período** é incorporado diretamente nesta tabela.

---

## Colaboração_Mensal

Representa a participação efetiva de uma Parceira em uma determinada Competência.

É a principal entidade operacional do domínio, concentrando o acompanhamento das atividades executadas, o Snapshot Comercial e as referências para Marca, Competência e Parceira.

Cada registro corresponde a uma única colaboração realizada em um único ciclo operacional.

---

## Pagamento

Representa a obrigação financeira originada por uma Colaboração Mensal.

Cada registro mantém as informações necessárias para controlar o ciclo financeiro correspondente, incorporando os Value Objects **Informações Financeiras** e **Datas Operacionais**.

---

# Relação entre as Tabelas

O conjunto de tabelas mantém a seguinte organização conceitual:

| Tabela | Relaciona-se com |
|---------|------------------|
| Marca | Competência, Colaboração_Mensal |
| Parceira | Colaboração_Mensal |
| Competência | Marca, Colaboração_Mensal |
| Colaboração_Mensal | Marca, Competência, Parceira, Pagamento |
| Pagamento | Colaboração_Mensal |

Esses relacionamentos preservam integralmente a estrutura definida no Modelo de Domínio.

---

# Estruturas Não Representadas por Tabelas

Os seguintes elementos **não originam tabelas independentes**, por não possuírem identidade própria no domínio:

- Informações de Contato;
- Localização;
- Período;
- Snapshot Comercial;
- Informações Financeiras;
- Datas Operacionais.

Todos esses elementos são persistidos como parte integrante das tabelas de seus respectivos Aggregate Roots.

---

# Convenções de Nomeação

As tabelas seguem as seguintes convenções:

- utilizam substantivos da Linguagem Ubíqua;
- representam conceitos permanentes do domínio;
- possuem nomenclatura única e inequívoca;
- evitam abreviações e termos técnicos;
- mantêm correspondência direta com os Aggregate Roots definidos no DATA_MODEL.

---

# Resumo das Tabelas

| Tabela | Origem no Domínio | Responsabilidade Principal |
|---------|-------------------|----------------------------|
| Marca | Aggregate Root | Representar a organização responsável pelo programa |
| Parceira | Aggregate Root | Representar a participante cadastrada |
| Competência | Aggregate Root | Representar um ciclo operacional do programa |
| Colaboração_Mensal | Aggregate Root | Representar a execução mensal da parceria |
| Pagamento | Aggregate Root | Representar a obrigação financeira da colaboração |

---

# Princípios da Estrutura de Tabelas

A estrutura de tabelas do TEAR segue os seguintes princípios:

- todas as tabelas derivam diretamente do Modelo de Domínio;
- cada tabela possui uma única responsabilidade;
- Aggregate Roots possuem representação persistente própria;
- Value Objects permanecem incorporados às tabelas dos respectivos Agregados;
- não existem tabelas sem significado para o negócio;
- toda tabela preserva a Linguagem Ubíqua;
- a estrutura permanece independente de qualquer tecnologia específica de banco de dados, podendo ser implementada em diferentes mecanismos de persistência sem alterar sua organização lógica.

# 4. COLUNAS DE CADA TABELA

## Objetivo

Esta seção define as colunas que compõem cada tabela do Modelo de Dados do TEAR.

Cada coluna representa uma informação permanente do domínio e possui correspondência direta com os atributos documentados no DATA_MODEL.

As colunas descritas nesta seção representam a estrutura lógica do modelo, independentemente de qualquer tecnologia de banco de dados.

---

# Tabela: Marca

## Identificação

| Coluna | Finalidade |
|---------|------------|
| marca_id | Identificador único da Marca |

## Informações Institucionais

| Coluna | Finalidade |
|---------|------------|
| nome | Nome oficial da marca |
| nome_fantasia | Nome utilizado comercialmente |
| situacao | Situação operacional da marca |

---

# Tabela: Parceira

## Identificação

| Coluna | Finalidade |
|---------|------------|
| parceira_id | Identificador único da Parceira |

## Dados Cadastrais

| Coluna | Finalidade |
|---------|------------|
| nome | Nome completo da parceira |
| apelido | Nome utilizado operacionalmente |
| documento | Documento identificador |
| data_cadastro | Data de ingresso no programa |
| situacao | Situação atual da participante |

## Informações de Contato

| Coluna | Finalidade |
|---------|------------|
| email | Endereço eletrônico principal |
| telefone | Telefone principal |

## Localização

| Coluna | Finalidade |
|---------|------------|
| cidade | Cidade de referência |
| estado | Unidade federativa |
| pais | País de residência |

---

# Tabela: Competência

## Identificação

| Coluna | Finalidade |
|---------|------------|
| competencia_id | Identificador único da Competência |

## Referência Organizacional

| Coluna | Finalidade |
|---------|------------|
| marca_id | Marca responsável pela competência |

## Período

| Coluna | Finalidade |
|---------|------------|
| competencia | Identificação do período operacional |
| data_inicio | Início do período |
| data_fim | Encerramento do período |

## Situação

| Coluna | Finalidade |
|---------|------------|
| situacao | Estado atual da competência |

---

# Tabela: Colaboração_Mensal

## Identificação

| Coluna | Finalidade |
|---------|------------|
| colaboracao_mensal_id | Identificador único da colaboração |

## Referências do Domínio

| Coluna | Finalidade |
|---------|------------|
| marca_id | Marca relacionada |
| competencia_id | Competência correspondente |
| parceira_id | Parceira participante |

## Snapshot Comercial

| Coluna | Finalidade |
|---------|------------|
| categoria | Categoria vigente no momento da colaboração |
| percentual_comissao | Percentual aplicado |
| cupom | Cupom vigente |
| condicoes_comerciais | Condições comerciais registradas |

## Execução

| Coluna | Finalidade |
|---------|------------|
| status | Situação operacional da colaboração |
| data_inicio | Início da colaboração |
| data_encerramento | Encerramento da colaboração |

---

# Tabela: Pagamento

## Identificação

| Coluna | Finalidade |
|---------|------------|
| pagamento_id | Identificador único do pagamento |

## Referência

| Coluna | Finalidade |
|---------|------------|
| colaboracao_mensal_id | Colaboração que originou o pagamento |

## Informações Financeiras

| Coluna | Finalidade |
|---------|------------|
| valor | Valor previsto |
| moeda | Unidade monetária |
| forma_pagamento | Forma prevista de pagamento |

## Datas Operacionais

| Coluna | Finalidade |
|---------|------------|
| data_prevista | Data prevista para pagamento |
| data_realizada | Data efetiva de pagamento |

## Situação

| Coluna | Finalidade |
|---------|------------|
| status | Estado atual do pagamento |

---

# Colunas Compartilhadas

As seguintes colunas aparecem em mais de uma tabela por representarem conceitos recorrentes do domínio:

| Coluna | Utilização |
|---------|------------|
| situacao | Representa o estado geral da entidade |
| status | Representa o estado operacional de processos específicos |
| data_inicio | Marca o início de um ciclo operacional |
| data_fim | Marca o encerramento de um período |
| marca_id | Referência à Marca |
| competencia_id | Referência à Competência |
| parceira_id | Referência à Parceira |

---

# Correspondência com o DATA_MODEL

Todas as colunas apresentadas nesta seção possuem origem direta nos atributos definidos no DATA_MODEL.

Os Value Objects são representados por conjuntos de colunas incorporadas às respectivas tabelas, preservando sua natureza conceitual e evitando estruturas independentes.

Nenhuma coluna existe sem representar um conceito permanente do domínio.

---

# Princípios da Estrutura de Colunas

A definição das colunas segue os seguintes princípios:

- toda coluna representa um atributo do domínio;
- cada coluna possui uma única responsabilidade;
- Value Objects são desdobrados em colunas da tabela do Aggregate Root correspondente;
- identificadores permanecem exclusivos de cada tabela;
- referências entre tabelas preservam os relacionamentos do Modelo de Domínio;
- a nomenclatura mantém aderência à Linguagem Ubíqua;
- a estrutura lógica permanece independente de tipos de dados, mecanismos de armazenamento ou tecnologias específicas.

# 5. TIPOS DOS CAMPOS

## Objetivo

Esta seção define os tipos lógicos atribuídos aos campos do Modelo de Dados do TEAR.

Os tipos apresentados representam a natureza das informações armazenadas e estabelecem um contrato semântico para cada atributo do domínio, independentemente do banco de dados ou tecnologia utilizada.

Não são especificados tipos físicos de implementação (como `VARCHAR`, `UUID`, `TIMESTAMP` ou equivalentes), pois estes pertencem ao modelo físico de dados.

---

# Tipos Lógicos Oficiais

O Modelo de Dados utiliza exclusivamente os seguintes tipos lógicos:

| Tipo Lógico | Descrição |
|--------------|-----------|
| Identificador | Identifica unicamente um registro do domínio |
| Texto | Representa informações textuais |
| Texto Longo | Representa conteúdos textuais extensos |
| Número Inteiro | Representa valores numéricos inteiros |
| Número Decimal | Representa valores numéricos com precisão decimal |
| Percentual | Representa taxas ou percentuais |
| Data | Representa uma data do calendário |
| Data e Hora | Representa um instante temporal completo |
| Valor Monetário | Representa valores financeiros |
| Booleano | Representa valores verdadeiro ou falso |
| Enumeração | Representa um conjunto fechado de valores definidos pelo domínio |

---

# Tipos por Tabela

## Marca

| Campo | Tipo Lógico |
|--------|-------------|
| marca_id | Identificador |
| nome | Texto |
| nome_fantasia | Texto |
| situacao | Enumeração |

---

## Parceira

| Campo | Tipo Lógico |
|--------|-------------|
| parceira_id | Identificador |
| nome | Texto |
| apelido | Texto |
| documento | Texto |
| data_cadastro | Data |
| situacao | Enumeração |
| email | Texto |
| telefone | Texto |
| cidade | Texto |
| estado | Texto |
| pais | Texto |

---

## Competência

| Campo | Tipo Lógico |
|--------|-------------|
| competencia_id | Identificador |
| marca_id | Identificador |
| competencia | Texto |
| data_inicio | Data |
| data_fim | Data |
| situacao | Enumeração |

---

## Colaboração_Mensal

| Campo | Tipo Lógico |
|--------|-------------|
| colaboracao_mensal_id | Identificador |
| marca_id | Identificador |
| competencia_id | Identificador |
| parceira_id | Identificador |
| categoria | Texto |
| percentual_comissao | Percentual |
| cupom | Texto |
| condicoes_comerciais | Texto Longo |
| status | Enumeração |
| data_inicio | Data |
| data_encerramento | Data |

---

## Pagamento

| Campo | Tipo Lógico |
|--------|-------------|
| pagamento_id | Identificador |
| colaboracao_mensal_id | Identificador |
| valor | Valor Monetário |
| moeda | Texto |
| forma_pagamento | Enumeração |
| data_prevista | Data |
| data_realizada | Data |
| status | Enumeração |

---

# Tipos Compartilhados

Determinados tipos lógicos aparecem de forma recorrente em diferentes tabelas por representarem conceitos comuns do domínio.

| Tipo Lógico | Exemplos de Utilização |
|--------------|------------------------|
| Identificador | Chaves de entidades e referências entre tabelas |
| Texto | Nomes, documentos, localidades e códigos de negócio |
| Data | Períodos, cadastros e eventos operacionais |
| Enumeração | Situações, estados e formas de pagamento |
| Percentual | Comissões e taxas comerciais |
| Valor Monetário | Valores financeiros relacionados aos pagamentos |

---

# Regras para Utilização dos Tipos

A definição dos tipos lógicos segue as seguintes diretrizes:

- Identificadores representam exclusivamente a identidade das entidades.
- Enumerações devem utilizar apenas valores previamente definidos pelo domínio.
- Valores monetários representam quantias financeiras e não devem ser utilizados para outros fins.
- Percentuais representam relações proporcionais e possuem significado próprio no domínio.
- Datas representam eventos de negócio e não informações técnicas do sistema.
- Campos textuais armazenam informações descritivas da Linguagem Ubíqua.

---

# Independência Tecnológica

Os tipos apresentados nesta seção possuem natureza exclusivamente lógica.

A definição de tipos físicos específicos, precisão numérica, tamanho máximo de campos, codificação de caracteres, formatos de armazenamento ou particularidades do mecanismo de persistência será realizada posteriormente no Modelo Físico de Dados.

---

# Princípios dos Tipos de Campos

A definição dos tipos de campos segue os seguintes princípios:

- todo campo possui um único tipo lógico;
- o tipo representa o significado do dado, e não sua implementação;
- tipos iguais representam conceitos equivalentes em todo o modelo;
- a escolha do tipo preserva a semântica do domínio;
- o modelo permanece independente de qualquer banco de dados ou tecnologia específica;
- os tipos lógicos servem como contrato permanente entre o Modelo de Domínio e o Modelo de Dados.

# 6. PRIMARY KEYS

## Objetivo

As Primary Keys definem a identidade permanente de cada registro persistido no Modelo de Dados do TEAR.

Cada tabela possui exatamente uma Primary Key responsável por identificar unicamente seus registros, garantindo integridade de entidade, rastreabilidade e estabilidade dos relacionamentos estabelecidos com as demais estruturas do modelo. Em modelos relacionais, toda relação deve possuir uma chave primária capaz de identificar unicamente cada registro, servindo como base para a integridade e para os relacionamentos entre tabelas.  [oai_citation:0‡Pressbooks UIowa](https://pressbooks.uiowa.edu/fundamentalsofdatabasemanagement/chapter/chapter-3/?utm_source=chatgpt.com)

---

# Princípios das Primary Keys

As Primary Keys do TEAR seguem os seguintes princípios:

- cada tabela possui exatamente uma Primary Key;
- nenhuma Primary Key pode ser nula;
- nenhuma Primary Key pode possuir valores duplicados;
- a identidade de um registro permanece estável durante todo o seu ciclo de vida;
- a Primary Key não representa regras de negócio nem atributos operacionais;
- relacionamentos entre tabelas utilizam as Primary Keys como referência.

---

# Primary Keys Oficiais

## Marca

| Tabela | Primary Key |
|---------|-------------|
| Marca | marca_id |

Representa a identidade permanente de uma Marca.

---

## Parceira

| Tabela | Primary Key |
|---------|-------------|
| Parceira | parceira_id |

Representa a identidade permanente de uma Parceira cadastrada no programa.

---

## Competência

| Tabela | Primary Key |
|---------|-------------|
| Competência | competencia_id |

Representa a identidade permanente de uma Competência.

Mesmo que o período operacional seja semelhante ao de outra Competência, sua identidade permanece exclusiva.

---

## Colaboração_Mensal

| Tabela | Primary Key |
|---------|-------------|
| Colaboração_Mensal | colaboracao_mensal_id |

Representa a identidade permanente de cada Colaboração Mensal.

Cada colaboração constitui um registro independente do domínio.

---

## Pagamento

| Tabela | Primary Key |
|---------|-------------|
| Pagamento | pagamento_id |

Representa a identidade permanente de cada obrigação financeira originada por uma Colaboração Mensal.

---

# Correspondência entre Entidades e Primary Keys

| Entidade | Primary Key |
|-----------|-------------|
| Marca | marca_id |
| Parceira | parceira_id |
| Competência | competencia_id |
| Colaboração Mensal | colaboracao_mensal_id |
| Pagamento | pagamento_id |

Essa correspondência é direta e permanente durante toda a evolução do domínio.

---

# Regras de Utilização

As Primary Keys devem observar as seguintes regras:

- identificam exclusivamente um único registro;
- não carregam significado operacional do negócio;
- não devem ser reutilizadas após a remoção lógica ou encerramento de um registro;
- permanecem imutáveis após sua criação;
- servem como ponto oficial de referência para relacionamentos entre tabelas;
- não substituem regras de unicidade definidas pelo domínio.

---

# Relação com o Modelo de Domínio

As Primary Keys representam apenas a identidade persistente das Entidades.

Elas não substituem a identidade conceitual definida no DATA_MODEL, mas constituem sua representação no Modelo de Dados, permitindo que os Aggregate Roots sejam persistidos de forma consistente e que seus relacionamentos permaneçam íntegros ao longo do tempo.

---

# Princípios das Primary Keys

A definição das Primary Keys do TEAR segue os seguintes princípios:

- toda tabela possui exatamente uma Primary Key;
- toda Primary Key identifica unicamente um registro;
- Primary Keys permanecem estáveis durante todo o ciclo de vida do registro;
- relacionamentos entre tabelas são estabelecidos a partir das Primary Keys;
- a identidade persistente preserva a identidade conceitual do domínio;
- a estrutura de chaves permanece independente de qualquer tecnologia específica de banco de dados, podendo ser implementada em diferentes mecanismos de persistência sem alterar sua função lógica.

# 7. FOREIGN KEYS

## Objetivo

As Foreign Keys estabelecem os vínculos permanentes entre as tabelas do Modelo de Dados do TEAR.

Seu propósito é preservar a integridade referencial do modelo, garantindo que todo relacionamento persistido corresponda a uma relação válida previamente definida no DATA_MODEL.

As Foreign Keys representam exclusivamente relações entre Aggregate Roots e não possuem significado próprio fora desse contexto.

---

# Princípios das Foreign Keys

O Modelo de Dados do TEAR adota os seguintes princípios para utilização de Foreign Keys:

- toda Foreign Key referencia a Primary Key de outra tabela;
- toda Foreign Key representa um relacionamento permanente do domínio;
- nenhum relacionamento é criado apenas por conveniência técnica;
- toda referência deve preservar a integridade do Modelo de Domínio;
- relacionamentos respeitam os limites de responsabilidade dos Aggregate Roots;
- nenhuma Foreign Key substitui regras de negócio.

---

# Foreign Keys Oficiais

## Competência

| Campo | Referencia |
|--------|------------|
| marca_id | Marca.marca_id |

Cada Competência pertence obrigatoriamente a uma única Marca.

---

## Colaboração_Mensal

| Campo | Referencia |
|--------|------------|
| marca_id | Marca.marca_id |
| competencia_id | Competência.competencia_id |
| parceira_id | Parceira.parceira_id |

Cada Colaboração Mensal:

- pertence a uma Marca;
- ocorre em uma Competência;
- envolve exatamente uma Parceira.

---

## Pagamento

| Campo | Referencia |
|--------|------------|
| colaboracao_mensal_id | Colaboração_Mensal.colaboracao_mensal_id |

Cada Pagamento é originado por uma única Colaboração Mensal.

---

# Mapa Geral das Foreign Keys

| Tabela | Foreign Key | Referência |
|---------|-------------|------------|
| Competência | marca_id | Marca |
| Colaboração_Mensal | marca_id | Marca |
| Colaboração_Mensal | competencia_id | Competência |
| Colaboração_Mensal | parceira_id | Parceira |
| Pagamento | colaboracao_mensal_id | Colaboração_Mensal |

---

# Cadeia de Dependências

A organização das dependências entre as tabelas segue a estrutura abaixo:

```text
Marca
 │
 ├────────► Competência
 │              │
 │              ▼
 └──────► Colaboração_Mensal ◄──────── Parceira
                     │
                     ▼
                Pagamento
```

Essa estrutura representa a cadeia oficial de relacionamentos do Modelo de Dados.

---

# Integridade Referencial

Toda Foreign Key deve satisfazer as seguintes condições:

- referenciar obrigatoriamente um registro existente;
- preservar a coerência dos relacionamentos definidos pelo domínio;
- impedir referências para registros inexistentes;
- manter a consistência histórica das informações;
- preservar a rastreabilidade entre os Aggregate Roots.

A existência de um relacionamento persistido pressupõe sempre a existência da entidade referenciada.

---

# Relação com o Modelo de Domínio

As Foreign Keys representam, no Modelo de Dados, os relacionamentos definidos no DATA_MODEL.

Elas não criam novos vínculos entre os conceitos do domínio, apenas materializam as relações permanentes previamente estabelecidas entre os Aggregate Roots.

Dessa forma, existe correspondência direta entre:

- relacionamentos do Modelo de Domínio;
- referências do Modelo de Dados;
- integridade referencial do banco de dados.

---

# Princípios das Foreign Keys

A definição das Foreign Keys do TEAR segue os seguintes princípios:

- toda Foreign Key deriva de um relacionamento do Modelo de Domínio;
- toda referência aponta para uma Primary Key válida;
- Aggregate Roots permanecem independentes, relacionando-se apenas por referências;
- não existem relacionamentos sem significado para o negócio;
- a integridade referencial preserva a consistência do domínio;
- a estrutura de relacionamentos permanece compatível com a Linguagem Ubíqua;
- o Modelo de Dados mantém independência em relação ao mecanismo físico de persistência, estabelecendo apenas a organização lógica das referências entre as tabelas.

# 8. UNIQUE CONSTRAINTS

## Objetivo

As Unique Constraints definem regras de unicidade para atributos ou combinações de atributos que representam identidades naturais do domínio.

Enquanto as Primary Keys garantem a identidade técnica de cada registro, as Unique Constraints preservam regras de negócio que impedem a existência de registros duplicados para um mesmo conceito operacional. Em bancos de dados relacionais, uma restrição de unicidade garante que uma coluna ou conjunto de colunas não contenha valores duplicados, preservando a integridade dos dados sem substituir a função da Primary Key.  [oai_citation:0‡Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/21/sqlrf/constraint.html?utm_source=chatgpt.com)

---

# Princípios das Unique Constraints

O Modelo de Dados do TEAR adota os seguintes princípios:

- toda Unique Constraint representa uma regra permanente do domínio;
- uma Unique Constraint pode envolver uma ou mais colunas;
- Primary Keys e Unique Constraints possuem responsabilidades distintas;
- apenas atributos que representam identidade natural recebem restrições de unicidade;
- nenhuma restrição de unicidade é criada exclusivamente por conveniência técnica.

---

# Unique Constraints Oficiais

## Marca

| Restrição | Colunas |
|-----------|----------|
| UQ_MARCA_NOME | nome |

Cada Marca deve possuir um nome único dentro do domínio do TEAR.

---

## Parceira

| Restrição | Colunas |
|-----------|----------|
| UQ_PARCEIRA_DOCUMENTO | documento |
| UQ_PARCEIRA_EMAIL | email |

O documento identifica unicamente uma Parceira cadastrada.

O endereço de e-mail também deve ser exclusivo, impedindo múltiplos cadastros utilizando o mesmo canal principal de comunicação.

---

## Competência

| Restrição | Colunas |
|-----------|----------|
| UQ_COMPETENCIA_PERIODO | marca_id + competencia |

Uma Marca não pode possuir duas Competências representando o mesmo período operacional.

Competências de Marcas diferentes podem utilizar a mesma identificação temporal sem conflito.

---

## Colaboração_Mensal

| Restrição | Colunas |
|-----------|----------|
| UQ_COLABORACAO_MENSAL | competencia_id + parceira_id |

Uma Parceira pode possuir apenas uma Colaboração Mensal para cada Competência.

Essa restrição garante que uma mesma participante não seja registrada mais de uma vez no mesmo ciclo operacional.

---

## Pagamento

| Restrição | Colunas |
|-----------|----------|
| UQ_PAGAMENTO_COLABORACAO | colaboracao_mensal_id |

Cada Colaboração Mensal origina, no máximo, um registro oficial de Pagamento.

---

# Resumo das Restrições

| Tabela | Unique Constraint | Finalidade |
|---------|-------------------|------------|
| Marca | nome | Evitar duplicidade de marcas |
| Parceira | documento | Garantir unicidade cadastral |
| Parceira | email | Garantir unicidade do contato principal |
| Competência | marca_id + competencia | Evitar duplicidade de competências por marca |
| Colaboração_Mensal | competencia_id + parceira_id | Garantir uma única colaboração por parceira em cada competência |
| Pagamento | colaboracao_mensal_id | Garantir um único pagamento por colaboração |

---

# Relação com as Primary Keys

As Unique Constraints não substituem as Primary Keys.

Enquanto a Primary Key fornece a identidade persistente de um registro, as Unique Constraints preservam regras de unicidade derivadas do domínio.

Dessa forma, um registro pode possuir:

- uma Primary Key responsável por sua identidade técnica;
- uma ou mais Unique Constraints responsáveis por preservar identidades naturais e regras de negócio.

Essa separação reduz o acoplamento entre persistência e negócio e facilita a evolução do modelo.

---

# Evolução das Restrições

Novas Unique Constraints poderão ser incorporadas ao Modelo de Dados desde que:

- representem uma regra permanente do domínio;
- preservem a compatibilidade com o DATA_MODEL;
- não conflitem com as Primary Keys existentes;
- mantenham a integridade lógica dos relacionamentos.

Toda alteração deverá ser motivada por uma evolução explícita do domínio e não por necessidades específicas de implementação.

---

# Princípios das Unique Constraints

A definição das Unique Constraints do TEAR segue os seguintes princípios:

- toda restrição de unicidade representa uma regra permanente do domínio;
- identidades naturais são protegidas contra duplicidade;
- Primary Keys e Unique Constraints possuem responsabilidades distintas e complementares;
- restrições compostas preservam unicidade quando um único atributo não é suficiente;
- nenhuma restrição é criada sem significado para o negócio;
- a estrutura de unicidade permanece independente da tecnologia de banco de dados adotada, constituindo parte integrante do Modelo Lógico de Dados.

# 9. ÍNDICES

## Objetivo

Os índices do Modelo de Dados do TEAR têm como finalidade otimizar o acesso às informações persistidas sem alterar a estrutura lógica do domínio.

Os índices representam estruturas auxiliares de acesso aos dados e existem exclusivamente para melhorar o desempenho das operações de consulta, ordenação e relacionamento. Eles não modificam o significado das entidades, dos atributos ou das relações definidas no Modelo de Dados.  [oai_citation:0‡IBM](https://www.ibm.com/docs/en/db2/12.1.x?topic=objects-indexes&utm_source=chatgpt.com)

---

# Princípios dos Índices

A estratégia de indexação do TEAR segue os seguintes princípios:

- os índices não alteram o Modelo de Domínio;
- toda Primary Key possui indexação própria;
- toda Foreign Key deve possuir índice para suportar relacionamentos;
- atributos frequentemente utilizados em consultas podem receber índices adicionais;
- índices compostos devem refletir padrões permanentes de acesso ao domínio;
- a estratégia de indexação permanece independente do mecanismo físico de banco de dados.

---

# Índices Obrigatórios

## Índices das Primary Keys

Toda Primary Key possui um índice associado para garantir identificação rápida dos registros.

| Tabela | Índice |
|---------|---------|
| Marca | marca_id |
| Parceira | parceira_id |
| Competência | competencia_id |
| Colaboração_Mensal | colaboracao_mensal_id |
| Pagamento | pagamento_id |

---

## Índices das Foreign Keys

Toda Foreign Key possui índice próprio para otimizar operações de relacionamento entre tabelas.

| Tabela | Campo Indexado |
|---------|----------------|
| Competência | marca_id |
| Colaboração_Mensal | marca_id |
| Colaboração_Mensal | competencia_id |
| Colaboração_Mensal | parceira_id |
| Pagamento | colaboracao_mensal_id |

Essa estratégia reduz o custo das operações de junção e preserva o desempenho das consultas relacionais.  [oai_citation:1‡IT Plataforma Hitachi](https://itpfdoc.hitachi.co.jp/manuals/3020/3020635100e/d635100e.PDF?utm_source=chatgpt.com)

---

# Índices Derivados das Regras de Unicidade

As Unique Constraints estabelecidas na seção anterior originam índices de unicidade para garantir o cumprimento das regras de negócio.

| Restrição | Colunas Indexadas |
|------------|-------------------|
| UQ_MARCA_NOME | nome |
| UQ_PARCEIRA_DOCUMENTO | documento |
| UQ_PARCEIRA_EMAIL | email |
| UQ_COMPETENCIA_PERIODO | marca_id + competencia |
| UQ_COLABORACAO_MENSAL | competencia_id + parceira_id |
| UQ_PAGAMENTO_COLABORACAO | colaboracao_mensal_id |

Esses índices possuem dupla responsabilidade:

- preservar a unicidade dos dados;
- acelerar consultas realizadas sobre esses atributos.

---

# Índices Compostos

Quando uma operação do domínio depende simultaneamente de mais de um atributo, recomenda-se a utilização de índices compostos.

Os principais índices compostos previstos para o TEAR são:

| Índice | Colunas |
|---------|----------|
| IDX_COMPETENCIA_PERIODO | marca_id + competencia |
| IDX_COLABORACAO_COMPETENCIA | competencia_id + parceira_id |

Esses índices refletem padrões permanentes do domínio e não requisitos específicos de implementação.

---

# Critérios para Criação de Novos Índices

Novos índices poderão ser incorporados quando atenderem simultaneamente aos seguintes critérios:

- representarem um padrão recorrente de acesso aos dados;
- beneficiarem consultas permanentes do domínio;
- não introduzirem redundância desnecessária;
- preservarem a simplicidade do modelo;
- não conflitarem com índices já existentes.

A criação de índices deve priorizar equilíbrio entre desempenho de leitura e custo de manutenção das operações de escrita, uma vez que cada índice adicional também precisa ser atualizado durante inserções, alterações e exclusões.  [oai_citation:2‡Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/indexes-and-index-organized-tables.html?utm_source=chatgpt.com)

---

# Independência Tecnológica

Esta seção define apenas a estratégia lógica de indexação.

Aspectos físicos como:

- tipo de índice;
- algoritmo utilizado;
- ordenação;
- armazenamento;
- particionamento;
- compressão;
- configuração específica do banco de dados;

serão definidos posteriormente no Modelo Físico de Dados, conforme as características do mecanismo de persistência adotado.

---

# Relação com o Modelo de Dados

Os índices não constituem elementos do domínio.

Sua função é fornecer mecanismos eficientes de acesso às estruturas já definidas pelo Modelo de Dados, preservando integralmente:

- a identidade das entidades;
- a integridade referencial;
- as regras de unicidade;
- a organização lógica da persistência.

Assim, a existência ou ausência de um índice não altera o significado do modelo, apenas sua eficiência operacional.

---

# Princípios dos Índices

A estratégia de indexação do TEAR segue os seguintes princípios:

- toda Primary Key possui indexação própria;
- toda Foreign Key possui indexação para suporte à integridade referencial;
- índices de unicidade derivam diretamente das Unique Constraints;
- índices compostos refletem padrões permanentes de consulta do domínio;
- nenhum índice altera a estrutura lógica do Modelo de Dados;
- a definição dos índices permanece independente da tecnologia de banco de dados, constituindo parte do Modelo Lógico e servindo de base para futuras implementações físicas.

# 10. NORMALIZAÇÃO

## Objetivo

A normalização do Modelo de Dados do TEAR tem como objetivo organizar as informações de forma consistente, reduzindo redundâncias, eliminando dependências indevidas e preservando a integridade lógica do domínio.

O modelo foi concebido para que cada fato do negócio seja armazenado uma única vez, garantindo que alterações ocorram em um único ponto de verdade e que as relações entre as entidades permaneçam coerentes ao longo de todo o ciclo de vida das informações.

---

# Princípios da Normalização

A estratégia de normalização do TEAR segue os seguintes princípios:

- cada informação permanente possui uma única localização de armazenamento;
- cada tabela representa apenas um conceito do domínio;
- atributos pertencem exclusivamente à entidade que os define;
- relacionamentos são representados por referências entre entidades;
- redundâncias são evitadas sempre que não representarem um requisito explícito do domínio;
- otimizações de desempenho não alteram a estrutura lógica do modelo.

---

# Primeira Forma Normal (1FN)

O Modelo de Dados atende aos princípios da Primeira Forma Normal.

Cada coluna armazena um único valor lógico e indivisível.

Como consequência:

- não existem grupos repetitivos;
- não existem listas armazenadas em uma mesma coluna;
- cada atributo representa um único conceito;
- cada registro representa exatamente uma ocorrência da entidade correspondente.

---

# Segunda Forma Normal (2FN)

O Modelo de Dados atende aos princípios da Segunda Forma Normal.

Todos os atributos não identificadores dependem integralmente da identidade da entidade à qual pertencem.

Não existem dependências parciais entre atributos e partes de chaves compostas, uma vez que cada entidade possui uma Primary Key própria e independente.

---

# Terceira Forma Normal (3FN)

O Modelo de Dados atende aos princípios da Terceira Forma Normal.

Nenhum atributo não identificador depende de outro atributo não identificador.

Cada informação é armazenada exclusivamente na entidade responsável por sua manutenção.

Como consequência:

- dados da Marca permanecem na tabela **Marca**;
- dados permanentes da Parceira permanecem na tabela **Parceira**;
- informações do ciclo operacional permanecem em **Competência**;
- informações da execução mensal permanecem em **Colaboração_Mensal**;
- informações financeiras permanecem em **Pagamento**.

---

# Eliminação de Redundâncias

O modelo evita duplicidade de informações estruturais.

Em particular:

- dados cadastrais da Parceira não são replicados em Colaboração_Mensal;
- dados institucionais da Marca não são copiados para Competência ou Pagamento;
- informações financeiras não são armazenadas fora da entidade Pagamento;
- períodos operacionais são definidos exclusivamente em Competência.

Quando um relacionamento exige acesso a outra entidade, utiliza-se referência por Foreign Key em vez de replicação de dados.

---

# Value Objects e Normalização

Os Value Objects permanecem incorporados aos seus respectivos Aggregate Roots.

Essa decisão não viola os princípios de normalização porque:

- não possuem identidade própria;
- não possuem ciclo de vida independente;
- não são compartilhados entre entidades;
- representam atributos intrínsecos do Aggregate Root.

Assim, sua incorporação reduz complexidade sem introduzir redundância conceitual.

---

# Snapshot Comercial

O **Snapshot Comercial** constitui uma exceção deliberada ao princípio geral de eliminação de redundâncias.

Os atributos comerciais registrados em **Colaboração_Mensal** representam o estado vigente da parceria no momento da execução da campanha.

Esses dados são preservados como registro histórico e não devem ser atualizados quando houver alterações futuras no cadastro da Parceira ou nas políticas comerciais da Marca.

Trata-se de uma duplicação intencional orientada pela necessidade de preservar a verdade histórica do domínio, e não de uma violação da normalização.

---

# Integridade do Modelo

A estratégia de normalização garante que:

- cada entidade possua responsabilidade exclusiva sobre seus atributos;
- alterações ocorram em um único ponto de manutenção;
- inconsistências decorrentes de duplicação sejam evitadas;
- relacionamentos sejam preservados por meio de referências;
- o histórico do domínio permaneça íntegro mesmo diante da evolução dos dados cadastrais.

---

# Evolução da Normalização

Novas entidades ou atributos deverão respeitar os seguintes critérios:

- representar um conceito permanente do domínio;
- possuir responsabilidade claramente definida;
- evitar duplicação desnecessária de informações;
- preservar a independência entre Aggregate Roots;
- manter compatibilidade com o DATA_MODEL.

Exceções à normalização somente poderão ser introduzidas quando representarem um requisito explícito do domínio, como preservação histórica, auditoria ou snapshots operacionais.

---

# Princípios da Normalização

A normalização do Modelo de Dados do TEAR segue os seguintes princípios:

- o modelo atende aos princípios da Primeira, Segunda e Terceira Forma Normal;
- cada fato do domínio é armazenado uma única vez;
- redundâncias são evitadas, exceto quando exigidas pelo próprio domínio;
- Value Objects permanecem incorporados aos seus Aggregate Roots;
- snapshots históricos constituem exceções conscientes e documentadas;
- a estrutura lógica preserva integridade, consistência e rastreabilidade dos dados;
- a estratégia de normalização permanece independente da tecnologia de persistência, servindo como referência para qualquer implementação física futura.

# 11. ESTRATÉGIA PARA VALUE OBJECTS

## Objetivo

Esta seção define a estratégia oficial de persistência dos Value Objects no Modelo de Dados do TEAR.

Os Value Objects representam conceitos do domínio definidos exclusivamente por seus atributos, sem identidade própria e sem ciclo de vida independente. Consequentemente, sua persistência ocorre sempre como parte integrante do Aggregate Root ao qual pertencem, preservando os limites de consistência do Modelo de Domínio.  [oai_citation:0‡Microsoft Learn](https://learn.microsoft.com/en-us/archive/msdn-magazine/2009/february/best-practice-an-introduction-to-domain-driven-design?utm_source=chatgpt.com)

---

# Princípios Gerais

A estratégia de persistência dos Value Objects segue os seguintes princípios:

- Value Objects não possuem identidade própria;
- Value Objects não originam tabelas independentes;
- todo Value Object pertence exclusivamente a um Aggregate Root;
- o ciclo de vida de um Value Object depende integralmente do seu Aggregate Root;
- alterações em um Value Object ocorrem somente por meio da atualização do Aggregate Root;
- não existe acesso direto a um Value Object pela camada de persistência.

---

# Estratégia de Persistência

O TEAR adota a estratégia de **incorporação (embedding)** dos Value Objects.

Isso significa que seus atributos são armazenados diretamente na tabela correspondente ao Aggregate Root proprietário.

Essa abordagem preserva:

- simplicidade do modelo;
- integridade do Aggregate;
- consistência transacional;
- independência entre Agregados;
- aderência ao Modelo de Domínio.

Essa é a estratégia recomendada para Value Objects que não possuem identidade nem compartilhamento entre diferentes entidades.  [oai_citation:1‡Virtual Genius](https://virtualgenius.com/blog/persisting-value-objects/?utm_source=chatgpt.com)

---

# Value Objects do TEAR

O Modelo de Domínio define os seguintes Value Objects:

| Aggregate Root | Value Object |
|----------------|--------------|
| Parceira | Informações de Contato |
| Parceira | Localização |
| Competência | Período |
| Colaboração_Mensal | Snapshot Comercial |
| Pagamento | Informações Financeiras |
| Pagamento | Datas Operacionais |

Todos são persistidos como parte integrante de seus respectivos Aggregate Roots.

---

# Mapeamento dos Value Objects

## Informações de Contato

Persistido na tabela **Parceira**.

Seus atributos são representados diretamente pelas colunas de contato da Parceira.

Exemplos:

- email;
- telefone.

---

## Localização

Persistido na tabela **Parceira**.

Seus atributos são incorporados diretamente ao cadastro permanente da participante.

Exemplos:

- cidade;
- estado;
- pais.

---

## Período

Persistido na tabela **Competência**.

Representa o intervalo temporal que caracteriza o ciclo operacional.

Exemplos:

- competencia;
- data_inicio;
- data_fim.

---

## Snapshot Comercial

Persistido na tabela **Colaboração_Mensal**.

Representa uma fotografia das condições comerciais vigentes no momento da execução da colaboração.

Exemplos:

- categoria;
- percentual_comissao;
- cupom;
- condicoes_comerciais.

Por possuir natureza histórica, esse Value Object permanece preservado mesmo que as informações comerciais atuais da Parceira sejam posteriormente alteradas.

---

## Informações Financeiras

Persistido na tabela **Pagamento**.

Representa os atributos financeiros da obrigação de pagamento.

Exemplos:

- valor;
- moeda;
- forma_pagamento.

---

## Datas Operacionais

Persistido na tabela **Pagamento**.

Representa os eventos temporais relacionados ao processamento financeiro.

Exemplos:

- data_prevista;
- data_realizada.

---

# Ausência de Identidade

Nenhum Value Object do TEAR possui:

- Primary Key;
- Foreign Key própria;
- identificador permanente;
- repositório independente;
- referência direta por outras entidades.

Sua existência é determinada exclusivamente pelo Aggregate Root ao qual pertence.  [oai_citation:2‡Microsoft Learn](https://learn.microsoft.com/en-us/archive/msdn-magazine/2009/february/best-practice-an-introduction-to-domain-driven-design?utm_source=chatgpt.com)

---

# Compartilhamento

Os Value Objects do TEAR não são compartilhados entre Aggregate Roots.

Mesmo quando dois Agregados utilizam conceitos semelhantes, cada Aggregate mantém sua própria representação persistida.

Essa decisão garante:

- isolamento dos Agregados;
- independência evolutiva;
- preservação das fronteiras de consistência;
- simplicidade da persistência.

---

# Evolução dos Value Objects

Novos Value Objects poderão ser incorporados ao Modelo de Dados desde que:

- representem um conceito sem identidade própria;
- sejam definidos exclusivamente por seus atributos;
- pertençam a um único Aggregate Root;
- não possuam ciclo de vida independente;
- não exijam compartilhamento entre diferentes Agregados.

Caso um conceito passe a exigir identidade própria, relacionamento independente ou ciclo de vida autônomo, ele deverá evoluir para uma Entidade do Modelo de Domínio, deixando de ser tratado como Value Object.

---

# Princípios da Estratégia para Value Objects

A estratégia de persistência dos Value Objects do TEAR segue os seguintes princípios:

- Value Objects são persistidos por incorporação em seus Aggregate Roots;
- não existem tabelas exclusivas para Value Objects;
- todo Value Object depende integralmente do ciclo de vida do Aggregate proprietário;
- alterações ocorrem exclusivamente por meio do Aggregate Root;
- a persistência preserva os limites de consistência definidos pelo Modelo de Domínio;
- o Modelo de Dados permanece fiel aos conceitos de Domain-Driven Design e independente da tecnologia de persistência adotada.  [oai_citation:3‡Baeldung on Kotlin](https://www.baeldung.com/spring-persisting-ddd-aggregates?utm_source=chatgpt.com)

# 12. ESTRATÉGIA PARA ENUMS

## Objetivo

Esta seção define a estratégia oficial para utilização e persistência de Enumerações (Enums) no Modelo de Dados do TEAR.

Os Enums representam conjuntos finitos e previamente conhecidos de valores válidos para determinados atributos do domínio, restringindo as possibilidades de preenchimento e preservando a consistência semântica das informações.

Os Enums fazem parte do Modelo de Domínio e são refletidos no Modelo de Dados como restrições de valores permitidos, permanecendo independentes da tecnologia utilizada para persistência.  [oai_citation:0‡Enterprise Craftsmanship](https://enterprisecraftsmanship.com/posts/having-the-domain-model-separate-from-the-persistence-model/?utm_source=chatgpt.com)

---

# Papel dos Enums no Modelo

Os Enums possuem a responsabilidade de representar estados, classificações e categorias cujo conjunto de valores é conhecido e controlado pelo domínio.

Eles existem para:

- padronizar valores utilizados pelo sistema;
- eliminar ambiguidades de interpretação;
- impedir valores inválidos;
- facilitar validações;
- preservar a Linguagem Ubíqua.

Os Enums não representam entidades nem objetos de valor.

---

# Princípios Gerais

A estratégia para Enums segue os seguintes princípios:

- todo Enum representa um conceito permanente do domínio;
- os valores de um Enum pertencem a um conjunto fechado;
- Enums não possuem identidade própria;
- Enums não originam tabelas independentes;
- alterações em Enums devem decorrer exclusivamente da evolução do domínio;
- o significado de cada valor deve permanecer estável ao longo do tempo.

---

# Estratégia de Persistência

Os Enums são persistidos como atributos das entidades às quais pertencem.

Não existe estrutura própria de armazenamento para Enumerações.

Cada campo do tipo Enum armazena diretamente um dos valores válidos definidos pelo domínio.

Essa abordagem mantém o modelo simples, evita relacionamentos artificiais e preserva a independência entre os Aggregate Roots.  [oai_citation:1‡Enterprise Craftsmanship](https://enterprisecraftsmanship.com/posts/having-the-domain-model-separate-from-the-persistence-model/?utm_source=chatgpt.com)

---

# Campos que Utilizam Enums

O Modelo de Dados prevê a utilização de Enumerações nos seguintes atributos:

| Tabela | Campo |
|---------|--------|
| Marca | situacao |
| Parceira | situacao |
| Competência | situacao |
| Colaboração_Mensal | status |
| Pagamento | status |
| Pagamento | forma_pagamento |

Novos campos poderão utilizar Enumerações sempre que representarem conjuntos fechados de valores do domínio.

---

# Critérios para Utilização

Um atributo deve ser modelado como Enum quando:

- o conjunto de valores possíveis for conhecido;
- novos valores surgirem apenas por evolução do domínio;
- não existir necessidade de cadastro dinâmico;
- os valores representarem estados, categorias ou classificações permanentes.

Caso um conjunto de valores passe a exigir administração pelos usuários, histórico próprio ou ciclo de vida independente, ele deverá evoluir para uma Entidade do domínio.

---

# Evolução dos Enums

A evolução de um Enum deverá observar os seguintes critérios:

- novos valores somente poderão ser adicionados mediante evolução formal do domínio;
- valores existentes não devem alterar seu significado;
- alterações incompatíveis deverão ser tratadas por mecanismos de migração e versionamento;
- a evolução dos Enums deve preservar a integridade dos dados históricos.

Esses princípios reduzem o impacto de mudanças e mantêm a consistência entre domínio e persistência.

---

# Independência Tecnológica

O Modelo de Dados não impõe uma forma específica de implementação física para os Enums.

Cada mecanismo de persistência poderá representá-los utilizando os recursos mais adequados à tecnologia adotada, desde que:

- todos os valores válidos sejam preservados;
- o significado de cada valor permaneça inalterado;
- as restrições definidas pelo domínio sejam respeitadas.

Aspectos como armazenamento textual, numérico ou por tipos nativos pertencem ao Modelo Físico de Dados e não fazem parte desta especificação lógica.  [oai_citation:2‡Baeldung on Kotlin](https://www.baeldung.com/jpa-persisting-enums-in-jpa?utm_source=chatgpt.com)

---

# Relação com o Modelo de Domínio

Os Enums são derivados diretamente do Modelo de Domínio.

Eles representam conceitos definidos pela Linguagem Ubíqua e constituem uma forma de expressar invariantes do negócio.

O Modelo de Dados apenas materializa esses conjuntos de valores, sem criar novas categorias ou modificar sua semântica.

---

# Princípios da Estratégia para Enums

A estratégia para Enums do TEAR segue os seguintes princípios:

- Enums representam conjuntos fechados de valores do domínio;
- Enums não possuem identidade nem ciclo de vida próprios;
- Enums não originam tabelas independentes;
- os valores permitidos são controlados pelo Modelo de Domínio;
- alterações em Enumerações ocorrem somente por evolução do domínio;
- a persistência preserva integralmente o significado dos valores definidos pela Linguagem Ubíqua;
- o Modelo de Dados permanece independente da tecnologia de persistência, definindo apenas a estratégia lógica de utilização das Enumerações.

# 13. ESTRATÉGIA PARA HISTÓRICO

## Objetivo

Esta seção define a estratégia oficial para preservação do histórico das informações no Modelo de Dados do TEAR.

O histórico tem como finalidade registrar a evolução dos fatos do domínio ao longo do tempo, preservando a rastreabilidade das operações, a consistência das informações e a capacidade de reconstruir estados anteriores quando necessário.

A estratégia adotada distingue claramente os dados operacionais atuais dos registros históricos, permitindo que ambos coexistam sem comprometer a integridade do modelo. A literatura de modelagem de dados trata o tempo como uma dimensão relevante do modelo lógico quando a evolução das entidades faz parte do domínio de negócio.  [oai_citation:0‡ScienceDirect](https://www.sciencedirect.com/topics/computer-science/logical-modeling?utm_source=chatgpt.com)

---

# Princípios Gerais

A estratégia de histórico segue os seguintes princípios:

- o histórico representa fatos ocorridos no domínio;
- registros históricos nunca substituem o estado atual das entidades;
- alterações relevantes devem permanecer rastreáveis;
- o histórico preserva a verdade do negócio em cada momento do tempo;
- mecanismos de histórico não alteram a identidade das entidades;
- a preservação histórica deve ser independente da tecnologia utilizada para persistência.

---

# Tipos de Histórico

O Modelo de Dados do TEAR reconhece duas categorias distintas de histórico.

## Histórico de Estado

Representa a evolução do estado de uma entidade ao longo do tempo.

Exemplos:

- mudança de situação de uma Parceira;
- evolução do status de um Pagamento;
- alterações na situação de uma Competência.

---

## Histórico de Negócio

Representa fatos permanentes que jamais devem ser sobrescritos.

Exemplos:

- uma Colaboração Mensal realizada;
- um Pagamento efetuado;
- um Snapshot Comercial registrado durante uma campanha.

Esses registros constituem parte da memória operacional do domínio e permanecem preservados indefinidamente.

---

# Estratégia de Persistência

O Modelo de Dados não impõe uma única estratégia física para armazenamento do histórico.

A implementação poderá utilizar mecanismos como:

- tabelas históricas;
- versionamento de registros;
- bancos de dados temporais;
- trilhas de auditoria;
- outras estratégias equivalentes.

Independentemente da tecnologia adotada, deverá ser possível reconstruir o estado histórico das entidades quando necessário.  [oai_citation:1‡IBM](https://www.ibm.com/docs/en/imdm/14.0.0?topic=features-history-tables&utm_source=chatgpt.com)

---

# Snapshot Comercial

O **Snapshot Comercial** representa o principal mecanismo de preservação histórica do domínio do TEAR.

Ele registra as condições comerciais existentes no momento da realização da Colaboração Mensal.

Após seu registro:

- não acompanha alterações futuras do cadastro da Parceira;
- não acompanha mudanças de categoria;
- não acompanha alterações de comissão;
- não acompanha alterações comerciais posteriores.

Seu objetivo é preservar exatamente o contexto comercial existente quando a campanha foi executada.

---

# Histórico das Entidades

Cada Aggregate Root possui responsabilidade distinta quanto ao histórico.

| Aggregate Root | Estratégia |
|----------------|------------|
| Marca | Preservação da evolução institucional |
| Parceira | Preservação da evolução cadastral e operacional |
| Competência | Preservação dos ciclos operacionais concluídos |
| Colaboração_Mensal | Registro permanente das colaborações executadas |
| Pagamento | Preservação integral do histórico financeiro |

---

# Integridade Histórica

O histórico deve garantir que:

- registros antigos permaneçam interpretáveis;
- informações históricas não sejam sobrescritas por alterações futuras;
- eventos passados possam ser reconstruídos;
- referências entre entidades permaneçam válidas;
- a sequência cronológica dos fatos seja preservada.

---

# Atualização versus Preservação

O Modelo de Dados distingue claramente informações que podem ser atualizadas daquelas que representam fatos históricos.

São exemplos de informações atualizáveis:

- dados de contato;
- localização;
- situação operacional.

São exemplos de informações históricas:

- colaborações realizadas;
- pagamentos registrados;
- snapshots comerciais;
- competências concluídas.

Essa separação evita perda de contexto histórico e reduz inconsistências decorrentes da evolução dos dados.

---

# Evolução da Estratégia

Novos mecanismos de histórico poderão ser incorporados ao modelo desde que:

- preservem a integridade do domínio;
- mantenham rastreabilidade completa;
- não alterem a identidade das entidades;
- garantam reconstrução cronológica dos fatos;
- permaneçam compatíveis com o DATA_MODEL.

A evolução da estratégia deverá priorizar a preservação da informação histórica em detrimento da simplificação operacional.

---

# Relação com Auditoria

Histórico e auditoria possuem responsabilidades distintas.

O histórico documenta a evolução dos dados do negócio.

A auditoria documenta como, quando, por quem e por qual processo essas alterações ocorreram.

Embora complementares, ambos representam preocupações independentes e são tratados separadamente neste Modelo de Dados.

---

# Princípios da Estratégia para Histórico

A estratégia de histórico do TEAR segue os seguintes princípios:

- o histórico preserva a evolução temporal das informações do domínio;
- fatos históricos não são sobrescritos;
- snapshots representam o contexto vigente no momento de sua criação;
- entidades mantêm sua identidade ao longo de toda sua evolução;
- mecanismos físicos de historização permanecem independentes do Modelo Lógico;
- o histórico garante rastreabilidade, reconstrução cronológica e preservação da memória operacional do domínio;
- a estratégia permanece compatível com diferentes tecnologias de persistência e futuras implementações físicas.

# 14. SOFT DELETE / AUDITORIA

## Objetivo

Esta seção define a estratégia oficial de exclusão lógica (Soft Delete) e auditoria do Modelo de Dados do TEAR.

Esses dois mecanismos possuem responsabilidades distintas e complementares.

O **Soft Delete** controla a disponibilidade operacional dos registros sem remover sua identidade persistente.

A **Auditoria** registra as alterações realizadas sobre os dados, permitindo rastrear quando, como e por quem cada modificação ocorreu.

Embora frequentemente utilizados em conjunto, ambos representam preocupações independentes do Modelo de Dados. O padrão de Soft Delete consiste em marcar registros como excluídos logicamente em vez de removê-los fisicamente, preservando recuperação, integridade referencial e rastreabilidade.  [oai_citation:0‡Software Patterns Lexicon](https://softwarepatternslexicon.com/data-modeling/relational-modeling-patterns/soft-deletes/?utm_source=chatgpt.com)

---

# Princípios Gerais

A estratégia de Soft Delete e Auditoria segue os seguintes princípios:

- exclusões lógicas não removem a identidade da entidade;
- auditoria não altera os dados do domínio;
- histórico, auditoria e Soft Delete possuem responsabilidades distintas;
- registros históricos permanecem íntegros após exclusões lógicas;
- toda alteração relevante deve ser rastreável;
- os mecanismos permanecem independentes da tecnologia de persistência.

---

# Estratégia para Soft Delete

O Modelo de Dados adota **Soft Delete** como estratégia padrão para entidades permanentes do domínio.

A exclusão lógica consiste em tornar um registro inativo para a operação do sistema sem remover sua persistência.

Como consequência:

- a identidade da entidade permanece preservada;
- relacionamentos continuam válidos;
- informações históricas permanecem consistentes;
- registros podem ser restaurados quando permitido pelas regras do domínio.

---

# Entidades Elegíveis para Soft Delete

As seguintes entidades podem utilizar exclusão lógica:

| Entidade | Estratégia |
|-----------|------------|
| Marca | Soft Delete |
| Parceira | Soft Delete |
| Competência | Soft Delete |
| Colaboração_Mensal | Restrição por regra de negócio |
| Pagamento | Restrição por regra de negócio |

Em entidades que representam fatos consumados do domínio, como Colaboração_Mensal e Pagamento, a exclusão lógica somente poderá ocorrer quando prevista explicitamente pelas regras de negócio.

---

# Exclusão Física

A exclusão física não faz parte do fluxo operacional normal do sistema.

Ela poderá ocorrer apenas em situações excepcionais, como:

- políticas formais de retenção;
- processos de arquivamento;
- migrações controladas;
- exigências legais;
- saneamento administrativo autorizado.

Sempre que utilizada, deverá preservar a integridade referencial e respeitar a política de retenção definida para o sistema. Uma prática comum é adotar o modelo "soft delete agora, purge posteriormente", executando remoções físicas apenas após o período de retenção estabelecido.  [oai_citation:1‡ASOasis Tech](https://asoasis.tech/articles/2026-04-29-0253-rest-api-soft-delete-patterns/?utm_source=chatgpt.com)

---

# Objetivos da Auditoria

A Auditoria possui como finalidade registrar:

- criação de registros;
- alterações relevantes;
- exclusões lógicas;
- restaurações;
- demais eventos significativos do domínio.

Seu propósito é permitir rastreabilidade completa das operações realizadas sobre os dados.

---

# Informações Auditáveis

Cada evento auditável deverá permitir identificar, quando aplicável:

- entidade afetada;
- identificador da entidade;
- operação realizada;
- instante da operação;
- responsável pela operação;
- origem da operação;
- alterações realizadas.

O Modelo de Dados estabelece esses requisitos de forma lógica, independentemente da implementação física da auditoria.

---

# Relação entre Soft Delete e Auditoria

Toda operação de Soft Delete constitui um evento auditável.

Da mesma forma, toda restauração de um registro previamente excluído logicamente também deverá gerar um evento de auditoria.

Entretanto:

- Soft Delete controla a visibilidade operacional;
- Auditoria registra o evento ocorrido;
- Histórico preserva a evolução temporal do domínio.

Esses três mecanismos atuam de forma complementar, sem sobreposição de responsabilidades.  [oai_citation:2‡Soulstack](https://soulstack.co.uk/blog/soft-deletes-audit-trails-and-history-tables/?utm_source=chatgpt.com)

---

# Integridade da Auditoria

Os registros de auditoria devem observar os seguintes princípios:

- não alteram o estado histórico do domínio;
- não substituem o histórico operacional;
- permanecem íntegros durante todo o período de retenção;
- possibilitam reconstrução cronológica das operações;
- preservam a rastreabilidade das alterações realizadas.

---

# Independência Tecnológica

O Modelo de Dados não impõe uma implementação específica para Soft Delete ou Auditoria.

A implementação física poderá utilizar mecanismos como:

- indicadores de exclusão lógica;
- estados operacionais;
- registros de auditoria;
- tabelas de auditoria;
- logs imutáveis;
- sistemas especializados de rastreabilidade.

Independentemente da tecnologia adotada, deverão ser preservados os princípios definidos nesta seção.

---

# Evolução da Estratégia

Novos mecanismos de Soft Delete ou Auditoria poderão ser incorporados desde que:

- preservem a identidade das entidades;
- mantenham compatibilidade com o Modelo de Domínio;
- não comprometam a integridade histórica;
- garantam rastreabilidade completa;
- permaneçam independentes da tecnologia de persistência.

---

# Princípios da Estratégia para Soft Delete e Auditoria

A estratégia de Soft Delete e Auditoria do TEAR segue os seguintes princípios:

- Soft Delete controla a disponibilidade operacional dos registros sem eliminar sua identidade;
- Auditoria registra a ocorrência das operações realizadas sobre os dados;
- histórico, auditoria e exclusão lógica possuem responsabilidades distintas e complementares;
- fatos consolidados do domínio possuem proteção contra exclusões indevidas;
- a rastreabilidade das operações é preservada durante todo o ciclo de vida das entidades;
- mecanismos físicos de exclusão lógica e auditoria permanecem independentes do Modelo Lógico;
- o Modelo de Dados garante integridade, recuperabilidade e transparência das operações em qualquer tecnologia de persistência adotada.

# 15. CONVENÇÕES DE NOMENCLATURA

## Objetivo

Esta seção estabelece o padrão oficial de nomenclatura do Modelo de Dados do TEAR.

As convenções definidas neste documento têm como finalidade garantir consistência, clareza, previsibilidade e estabilidade na representação dos elementos do modelo, preservando a correspondência entre o Modelo de Domínio, o Modelo de Dados e futuras implementações físicas.

Uma convenção de nomenclatura consistente facilita a compreensão do modelo, reduz ambiguidades e melhora sua evolução ao longo do tempo.  [oai_citation:0‡Baeldung on Kotlin](https://www.baeldung.com/sql/database-table-column-naming-conventions?utm_source=chatgpt.com)

---

# Princípios Gerais

A nomenclatura do TEAR segue os seguintes princípios:

- utilizar exclusivamente termos da Linguagem Ubíqua;
- manter consistência em todo o Modelo de Dados;
- evitar abreviações desnecessárias;
- utilizar nomes descritivos;
- preservar estabilidade ao longo da evolução do domínio;
- evitar termos técnicos dependentes de tecnologia;
- cada nome deve possuir significado único.

---

# Convenções para Tabelas

As tabelas seguem as seguintes regras:

- representam um único conceito do domínio;
- utilizam substantivos;
- possuem nomenclatura única;
- evitam prefixos técnicos;
- preservam a terminologia oficial do domínio.

Exemplos:

- Marca
- Parceira
- Competência
- Colaboração_Mensal
- Pagamento

---

# Convenções para Colunas

As colunas seguem as seguintes regras:

- representam atributos do domínio;
- utilizam nomes completos;
- evitam siglas sem significado explícito;
- mantêm consistência em todas as tabelas;
- utilizam o mesmo termo sempre que representarem o mesmo conceito.

Exemplos:

- nome
- documento
- email
- telefone
- cidade
- estado
- competencia
- valor
- situacao
- status

---

# Convenções para Identificadores

Toda Primary Key utiliza o padrão:

```text
<entidade>_id
```

Exemplos:

- marca_id
- parceira_id
- competencia_id
- colaboracao_mensal_id
- pagamento_id

Toda Foreign Key utiliza exatamente o mesmo nome da Primary Key referenciada.

Essa convenção elimina ambiguidades e facilita a identificação dos relacionamentos entre entidades.

---

# Convenções para Constraints

As Constraints seguem prefixos padronizados.

## Primary Key

```text
PK_<TABELA>
```

Exemplo:

```text
PK_MARCA
```

---

## Foreign Key

```text
FK_<ORIGEM>_<DESTINO>
```

Exemplo:

```text
FK_COLABORACAO_MENSAL_COMPETENCIA
```

---

## Unique Constraint

```text
UQ_<TABELA>_<CAMPO>
```

Exemplos:

```text
UQ_PARCEIRA_EMAIL
UQ_COMPETENCIA_PERIODO
```

---

# Convenções para Índices

Os índices seguem a seguinte nomenclatura:

```text
IDX_<TABELA>_<CAMPO>
```

Exemplos:

```text
IDX_PARCEIRA_DOCUMENTO
IDX_COLABORACAO_COMPETENCIA
```

Índices derivados de restrições de unicidade mantêm correspondência direta com a respectiva Unique Constraint.

---

# Convenções para Enums

Os Enums seguem as seguintes regras:

- representam substantivos ou classificações do domínio;
- utilizam nomenclatura única;
- seus valores seguem exatamente a Linguagem Ubíqua;
- evitam abreviações;
- não utilizam códigos numéricos como representação lógica.

Exemplos:

- SituacaoMarca
- SituacaoParceira
- StatusPagamento
- FormaPagamento

---

# Convenções para Value Objects

Os Value Objects seguem as seguintes regras:

- utilizam substantivos compostos quando necessário;
- representam conceitos do domínio;
- não utilizam prefixos técnicos;
- permanecem semanticamente independentes da implementação.

Exemplos:

- Informações de Contato
- Localização
- Período
- Snapshot Comercial
- Informações Financeiras
- Datas Operacionais

---

# Convenções para Relacionamentos

Os relacionamentos seguem a nomenclatura dos identificadores das entidades relacionadas.

Exemplos:

- marca_id
- competencia_id
- parceira_id
- colaboracao_mensal_id

Não são utilizados nomes artificiais ou genéricos como:

- id_referencia;
- id_pai;
- id_destino;
- chave_externa.

---

# Termos Proibidos

Não devem ser utilizados:

- abreviações sem significado documentado;
- siglas específicas de tecnologia;
- prefixos como tbl, tb, obj, ent, dto, model;
- nomes genéricos como dados, info, item, registro, objeto;
- nomes dependentes da implementação física;
- palavras reservadas quando houver alternativa semanticamente equivalente.

---

# Evolução da Nomenclatura

Novos elementos incorporados ao Modelo de Dados deverão:

- utilizar a Linguagem Ubíqua;
- respeitar os padrões definidos nesta seção;
- preservar consistência com os elementos existentes;
- evitar mudanças retroativas de nomenclatura;
- manter estabilidade documental.

Alterações de nomes somente deverão ocorrer quando houver evolução explícita do domínio de negócio.

---

# Princípios das Convenções de Nomenclatura

As convenções de nomenclatura do TEAR seguem os seguintes princípios:

- todos os nomes derivam da Linguagem Ubíqua;
- nomes representam conceitos permanentes do domínio;
- identificadores seguem padrões previsíveis e consistentes;
- constraints e índices utilizam prefixos padronizados;
- tabelas, colunas e relacionamentos mantêm correspondência direta com o Modelo de Domínio;
- abreviações e termos técnicos são evitados sempre que possível;
- a nomenclatura permanece independente da tecnologia de persistência, constituindo parte integrante do Modelo Lógico de Dados.

# 16. DIAGRAMA ER LÓGICO

## Objetivo

Esta seção apresenta o Diagrama Entidade-Relacionamento (ER) Lógico oficial do TEAR.

O diagrama representa a organização lógica das entidades, seus relacionamentos e respectivas cardinalidades, preservando integralmente o Modelo de Domínio e servindo como referência para futuras implementações físicas.

Este diagrama possui natureza **lógica**, portanto não descreve tipos físicos, índices, mecanismos de armazenamento ou características específicas de qualquer banco de dados. Modelos ER lógicos descrevem entidades, atributos e relacionamentos, mantendo independência em relação à implementação física do banco de dados.  [oai_citation:0‡IBM](https://www.ibm.com/think/topics/entity-relationship-diagram?utm_source=chatgpt.com)

---

# Notação Adotada

O TEAR adota a notação **Crow's Foot** para representação das cardinalidades entre entidades.

Essa notação foi escolhida por ser amplamente utilizada em modelagem de bancos relacionais, oferecer boa legibilidade e representar explicitamente relacionamentos de um-para-um, um-para-muitos e muitos-para-muitos.  [oai_citation:1‡Mermaid](https://mermaid.ai/open-source/syntax/entityRelationshipDiagram.html?utm_source=chatgpt.com)

---

# Entidades do Modelo

O Diagrama ER Lógico é composto pelas seguintes entidades:

- Marca
- Parceira
- Competência
- Colaboração_Mensal
- Pagamento

Cada entidade representa exatamente um Aggregate Root definido no DATA_MODEL.

---

# Relacionamentos

O modelo estabelece os seguintes relacionamentos permanentes.

## Marca → Competência

Uma Marca pode possuir várias Competências.

Cada Competência pertence obrigatoriamente a uma única Marca.

**Cardinalidade**

```text
Marca (1) ────────────────< (N) Competência
```

---

## Marca → Colaboração_Mensal

Uma Marca pode possuir diversas Colaborações Mensais.

Cada Colaboração Mensal pertence obrigatoriamente a uma única Marca.

**Cardinalidade**

```text
Marca (1) ────────────────< (N) Colaboração_Mensal
```

---

## Competência → Colaboração_Mensal

Uma Competência pode conter várias Colaborações Mensais.

Cada Colaboração Mensal pertence exatamente a uma Competência.

**Cardinalidade**

```text
Competência (1) ──────────< (N) Colaboração_Mensal
```

---

## Parceira → Colaboração_Mensal

Uma Parceira pode participar de diversas Colaborações Mensais ao longo do tempo.

Cada Colaboração Mensal refere-se exatamente a uma Parceira.

**Cardinalidade**

```text
Parceira (1) ─────────────< (N) Colaboração_Mensal
```

---

## Colaboração_Mensal → Pagamento

Cada Colaboração Mensal pode originar no máximo um Pagamento.

Cada Pagamento pertence obrigatoriamente a uma única Colaboração Mensal.

**Cardinalidade**

```text
Colaboração_Mensal (1) ──── (0..1) Pagamento
```

---

# Diagrama ER Lógico

```text
                     ┌──────────────────────┐
                     │        MARCA         │
                     └──────────┬───────────┘
                                │ 1
                ┌───────────────┴───────────────┐
                │                               │
                │ N                             │ N
                ▼                               ▼
     ┌──────────────────────┐        ┌──────────────────────────┐
     │     COMPETÊNCIA      │        │  COLABORAÇÃO_MENSAL      │
     └──────────┬───────────┘        └──────────────┬───────────┘
                │ 1                                ▲
                │                                  │ N
                ▼                                  │
     ┌──────────────────────┐                      │
     │  COLABORAÇÃO_MENSAL  │──────────────────────┘
     └──────────┬───────────┘
                │
                │ 0..1
                ▼
     ┌──────────────────────┐
     │      PAGAMENTO       │
     └──────────────────────┘

     ┌──────────────────────┐
     │      PARCEIRA        │
     └──────────┬───────────┘
                │ 1
                │
                │ N
                ▼
     ┌──────────────────────┐
     │  COLABORAÇÃO_MENSAL  │
     └──────────────────────┘
```

---

# Dependências do Modelo

A hierarquia lógica das entidades é representada pela seguinte estrutura:

```text
Marca
 │
 ├────────► Competência
 │               │
 │               ▼
 └──────► Colaboração_Mensal ◄──────── Parceira
                     │
                     ▼
                Pagamento
```

Essa organização representa todas as dependências permanentes existentes no domínio.

---

# Entidades sem Representação Própria

Os seguintes conceitos do domínio não aparecem como entidades independentes no Diagrama ER Lógico:

- Informações de Contato;
- Localização;
- Período;
- Snapshot Comercial;
- Informações Financeiras;
- Datas Operacionais.

Esses elementos são Value Objects incorporados aos seus respectivos Aggregate Roots e, portanto, não originam entidades próprias no modelo lógico.

---

# Integridade dos Relacionamentos

Todos os relacionamentos apresentados no Diagrama ER Lógico observam os seguintes princípios:

- derivam diretamente do Modelo de Domínio;
- preservam os limites dos Aggregate Roots;
- utilizam cardinalidades explícitas;
- mantêm integridade referencial;
- evitam relacionamentos artificiais;
- não representam detalhes específicos de implementação física.

---

# Correspondência com o Modelo de Domínio

Existe correspondência direta entre:

- Aggregate Root → Entidade;
- Relacionamento do Domínio → Relacionamento do Diagrama ER;
- Dependência entre Agregados → Cardinalidade do Modelo Lógico.

Essa correspondência garante que o Diagrama ER permaneça fiel à Linguagem Ubíqua e às responsabilidades definidas pelo DATA_MODEL.

---

# Princípios do Diagrama ER Lógico

O Diagrama ER Lógico do TEAR segue os seguintes princípios:

- representa exclusivamente entidades do domínio;
- cada entidade corresponde a um Aggregate Root;
- Value Objects permanecem incorporados às entidades proprietárias;
- relacionamentos utilizam cardinalidades explícitas em notação Crow's Foot;
- a estrutura lógica é independente de qualquer banco de dados específico;
- o diagrama constitui a representação oficial dos relacionamentos persistentes do Modelo de Dados;
- o Modelo ER Lógico serve como base para a construção do futuro Modelo ER Físico e da implementação da persistência do TEAR.  [oai_citation:2‡IBM](https://www.ibm.com/think/topics/entity-relationship-diagram?utm_source=chatgpt.com)

# 17. DIAGRAMA ER FÍSICO

## Objetivo

Esta seção apresenta o Diagrama Entidade-Relacionamento (ER) Físico de referência do TEAR.

O Diagrama ER Físico representa a materialização do Modelo Lógico em uma estrutura de persistência relacional, evidenciando tabelas, colunas, chaves primárias, chaves estrangeiras, restrições e relacionamentos necessários para implementação do banco de dados.

Diferentemente do Diagrama ER Lógico, o modelo físico aproxima-se da implementação da base de dados, detalhando os elementos estruturais que servirão de base para a geração do esquema do banco de dados.  [oai_citation:0‡Amazon Web Services, Inc.](https://aws.amazon.com/compare/the-difference-between-logical-and-physical-data-model/?utm_source=chatgpt.com)

---

# Escopo

O Diagrama ER Físico documenta:

- tabelas físicas;
- colunas persistidas;
- Primary Keys;
- Foreign Keys;
- Unique Constraints;
- cardinalidades;
- dependências entre tabelas.

Aspectos específicos de uma tecnologia, como tipos SQL (`VARCHAR`, `UUID`, `BIGINT`, `TIMESTAMP`, etc.), engines, índices físicos, particionamento e otimizações permanecem fora do escopo deste documento e serão definidos durante a implementação do banco de dados.  [oai_citation:1‡Amazon Web Services, Inc.](https://aws.amazon.com/compare/the-difference-between-logical-and-physical-data-model/?utm_source=chatgpt.com)

---

# Tabelas Físicas

O modelo físico é composto pelas seguintes tabelas:

- Marca
- Parceira
- Competência
- Colaboração_Mensal
- Pagamento

Cada tabela corresponde diretamente a um Aggregate Root do Modelo de Domínio.

---

# Diagrama ER Físico

```text
┌────────────────────────────────────────────┐
│ MARCA                                     │
├────────────────────────────────────────────┤
│ PK  marca_id                              │
│ UQ  nome                                  │
│ nome                                      │
│ nome_fantasia                             │
│ situacao                                  │
└────────────────────────────────────────────┘
                 │
                 │ FK
                 │
      ┌──────────┴───────────┐
      │                      │
      ▼                      ▼

┌────────────────────────────────────────────┐
│ COMPETÊNCIA                               │
├────────────────────────────────────────────┤
│ PK  competencia_id                        │
│ FK  marca_id                              │
│ UQ (marca_id, competencia)                │
│ competencia                               │
│ data_inicio                               │
│ data_fim                                  │
│ situacao                                  │
└────────────────────────────────────────────┘

                 │
                 │ FK
                 ▼

┌────────────────────────────────────────────┐
│ COLABORAÇÃO_MENSAL                        │
├────────────────────────────────────────────┤
│ PK  colaboracao_mensal_id                 │
│ FK  marca_id                              │
│ FK  competencia_id                        │
│ FK  parceira_id                           │
│ UQ (competencia_id, parceira_id)          │
│ categoria                                 │
│ percentual_comissao                       │
│ cupom                                     │
│ condicoes_comerciais                      │
│ status                                    │
│ data_inicio                               │
│ data_encerramento                         │
└────────────────────────────────────────────┘
                 │
                 │ FK
                 ▼

┌────────────────────────────────────────────┐
│ PAGAMENTO                                │
├────────────────────────────────────────────┤
│ PK  pagamento_id                          │
│ FK  colaboracao_mensal_id                 │
│ UQ colaboracao_mensal_id                  │
│ valor                                     │
│ moeda                                     │
│ forma_pagamento                           │
│ data_prevista                             │
│ data_realizada                            │
│ status                                    │
└────────────────────────────────────────────┘


┌────────────────────────────────────────────┐
│ PARCEIRA                                 │
├────────────────────────────────────────────┤
│ PK  parceira_id                           │
│ UQ documento                              │
│ UQ email                                  │
│ nome                                      │
│ apelido                                   │
│ documento                                 │
│ data_cadastro                             │
│ situacao                                  │
│ email                                     │
│ telefone                                  │
│ cidade                                    │
│ estado                                    │
│ pais                                      │
└────────────────────────────────────────────┘
                  │
                  │ FK
                  └────────────────────────────►
                           COLABORAÇÃO_MENSAL
```

---

# Relacionamentos Físicos

O modelo físico estabelece os seguintes relacionamentos:

| Origem | Destino | Cardinalidade |
|---------|----------|---------------|
| Competência.marca_id | Marca.marca_id | N : 1 |
| Colaboração_Mensal.marca_id | Marca.marca_id | N : 1 |
| Colaboração_Mensal.competencia_id | Competência.competencia_id | N : 1 |
| Colaboração_Mensal.parceira_id | Parceira.parceira_id | N : 1 |
| Pagamento.colaboracao_mensal_id | Colaboração_Mensal.colaboracao_mensal_id | 1 : 1 (opcional do lado da colaboração) |

---

# Estrutura de Chaves

## Primary Keys

| Tabela | Chave Primária |
|----------|----------------|
| Marca | marca_id |
| Parceira | parceira_id |
| Competência | competencia_id |
| Colaboração_Mensal | colaboracao_mensal_id |
| Pagamento | pagamento_id |

---

## Foreign Keys

| Tabela | Foreign Key |
|----------|-------------|
| Competência | marca_id |
| Colaboração_Mensal | marca_id |
| Colaboração_Mensal | competencia_id |
| Colaboração_Mensal | parceira_id |
| Pagamento | colaboracao_mensal_id |

---

## Unique Constraints

| Restrição |
|------------|
| UQ_MARCA_NOME |
| UQ_PARCEIRA_DOCUMENTO |
| UQ_PARCEIRA_EMAIL |
| UQ_COMPETENCIA_PERIODO |
| UQ_COLABORACAO_MENSAL |
| UQ_PAGAMENTO_COLABORACAO |

---

# Estruturas Incorporadas

Os seguintes conceitos permanecem incorporados às respectivas tabelas físicas:

| Value Object | Tabela |
|---------------|--------|
| Informações de Contato | Parceira |
| Localização | Parceira |
| Período | Competência |
| Snapshot Comercial | Colaboração_Mensal |
| Informações Financeiras | Pagamento |
| Datas Operacionais | Pagamento |

Esses elementos não originam tabelas próprias, pois não possuem identidade nem ciclo de vida independente.

---

# Correspondência entre Modelo Lógico e Modelo Físico

Existe correspondência direta entre os dois modelos.

| Modelo Lógico | Modelo Físico |
|---------------|---------------|
| Aggregate Root | Tabela |
| Atributo | Coluna |
| Relacionamento | Foreign Key |
| Identidade | Primary Key |
| Regra de unicidade | Unique Constraint |
| Associação | Cardinalidade física |

O Modelo Físico representa uma especialização do Modelo Lógico, acrescentando apenas os elementos necessários para a implementação da persistência, sem alterar o significado do domínio.  [oai_citation:2‡Amazon Web Services, Inc.](https://aws.amazon.com/compare/the-difference-between-logical-and-physical-data-model/?utm_source=chatgpt.com)

---

# Princípios do Diagrama ER Físico

O Diagrama ER Físico do TEAR segue os seguintes princípios:

- toda tabela deriva diretamente de um Aggregate Root;
- toda coluna representa um atributo persistido do domínio;
- Primary Keys identificam unicamente cada registro;
- Foreign Keys preservam a integridade referencial;
- Unique Constraints materializam regras permanentes de negócio;
- Value Objects permanecem incorporados às tabelas proprietárias;
- o modelo físico constitui a representação oficial da estrutura relacional do banco de dados e serve como base para a futura geração do esquema SQL do TEAR.  [oai_citation:3‡Amazon Web Services, Inc.](https://aws.amazon.com/compare/the-difference-between-logical-and-physical-data-model/?utm_source=chatgpt.com)

# 18. RESUMO DO BANCO DE DADOS

## Objetivo

Esta seção consolida a estrutura do Modelo de Dados do TEAR, apresentando uma visão executiva da organização do banco de dados, suas entidades, relacionamentos e princípios arquiteturais.

Seu propósito é oferecer uma referência rápida para compreensão da estrutura de persistência definida neste documento, preservando alinhamento com o Modelo de Domínio e servindo como ponto de partida para futuras implementações físicas.

---

# Visão Geral

O banco de dados do TEAR foi projetado seguindo uma abordagem orientada ao domínio (Domain-Driven Design), na qual cada estrutura persistente representa um conceito permanente do negócio.

O modelo prioriza:

- fidelidade ao domínio;
- simplicidade estrutural;
- consistência dos dados;
- rastreabilidade;
- independência tecnológica;
- evolução incremental.

Toda a organização do banco deriva diretamente do DATA_MODEL, sem introduzir estruturas artificiais motivadas apenas por aspectos técnicos.

---

# Estrutura Geral

O Modelo de Dados é composto por cinco entidades principais.

| Entidade | Responsabilidade |
|-----------|------------------|
| Marca | Representa a organização responsável pelo programa de influência |
| Parceira | Representa a influenciadora participante do programa |
| Competência | Representa um ciclo operacional do programa |
| Colaboração_Mensal | Representa a execução da parceria em uma competência específica |
| Pagamento | Representa a obrigação financeira decorrente de uma colaboração |

Cada entidade corresponde exatamente a um Aggregate Root do Modelo de Domínio.

---

# Estrutura dos Relacionamentos

A organização das entidades segue a seguinte hierarquia:

```text
Marca
 │
 ├────────► Competência
 │               │
 │               ▼
 └──────► Colaboração_Mensal ◄──────── Parceira
                     │
                     ▼
                Pagamento
```

Todos os relacionamentos são permanentes, explícitos e preservados por meio de Foreign Keys.

---

# Estrutura de Identificação

Cada entidade possui uma identidade própria representada por uma Primary Key.

| Entidade | Primary Key |
|-----------|-------------|
| Marca | marca_id |
| Parceira | parceira_id |
| Competência | competencia_id |
| Colaboração_Mensal | colaboracao_mensal_id |
| Pagamento | pagamento_id |

As Primary Keys possuem responsabilidade exclusiva de identificar unicamente cada registro persistido.

---

# Organização das Informações

As informações do domínio são organizadas segundo três categorias principais:

## Entidades

Representam conceitos com identidade própria e ciclo de vida independente.

## Value Objects

Representam conceitos definidos exclusivamente por seus atributos.

São incorporados diretamente às entidades proprietárias.

## Enumerações

Representam conjuntos fechados de valores controlados pelo domínio.

São persistidas como atributos das entidades.

---

# Integridade do Modelo

A integridade do banco de dados é garantida por meio de:

- Primary Keys;
- Foreign Keys;
- Unique Constraints;
- regras de normalização;
- convenções de nomenclatura;
- mecanismos de histórico;
- Soft Delete;
- Auditoria.

Esses mecanismos atuam de forma complementar para preservar consistência, rastreabilidade e confiabilidade das informações.

---

# Estratégia de Persistência

O Modelo de Dados adota as seguintes estratégias estruturais:

| Elemento | Estratégia |
|-----------|------------|
| Aggregate Root | Uma tabela própria |
| Value Object | Incorporação na tabela proprietária |
| Enum | Persistência como atributo |
| Histórico | Preservação temporal dos fatos do domínio |
| Soft Delete | Exclusão lógica para entidades permanentes |
| Auditoria | Rastreabilidade das operações |
| Snapshot Comercial | Preservação histórica das condições comerciais |

Essa organização busca minimizar redundâncias sem comprometer a preservação do contexto histórico do negócio.

---

# Independência Tecnológica

Todo o Modelo de Dados foi concebido de forma independente da tecnologia de persistência.

Este documento não define:

- banco de dados específico;
- tipos físicos de armazenamento;
- linguagem SQL;
- ORM;
- framework;
- mecanismo de indexação específico;
- plataforma de execução.

Essas decisões pertencem ao Modelo Físico e à arquitetura de implementação, mantendo o Modelo de Dados estável mesmo diante de mudanças tecnológicas. A separação entre modelos lógico e físico permite que o esquema seja adaptado a diferentes tecnologias sem alterar a estrutura conceitual do domínio. ([aws.amazon.com](https://aws.amazon.com/compare/the-difference-between-logical-and-physical-data-model/?utm_source=chatgpt.com))

---

# Correspondência entre os Modelos

Existe correspondência direta entre os principais artefatos arquiteturais do TEAR.

| Documento | Responsabilidade |
|------------|------------------|
| DOMAIN_MODEL | Define os conceitos e regras do domínio |
| DATABASE_MODEL | Define a organização lógica da persistência |
| Futuro Modelo ER Físico | Define a implementação relacional |
| Futuras Migrações | Materializam o banco de dados |
| Repositórios | Implementam o acesso aos dados |

Essa separação garante baixo acoplamento entre negócio, persistência e infraestrutura.

---

# Síntese Arquitetural

O Modelo de Dados do TEAR caracteriza-se por:

- cinco entidades centrais derivadas do domínio;
- correspondência de um Aggregate Root para uma tabela;
- incorporação de Value Objects;
- utilização de Enumerações para estados e classificações;
- integridade garantida por chaves e restrições;
- normalização até a Terceira Forma Normal, com exceções históricas documentadas;
- preservação de histórico por meio de snapshots e registros permanentes;
- suporte a Soft Delete e Auditoria;
- independência em relação à tecnologia de persistência.

---

# Considerações Finais

O DATABASE_MODEL estabelece a representação oficial da estrutura lógica de persistência do TEAR.

Todas as futuras implementações do banco de dados deverão respeitar os princípios, relacionamentos, restrições e responsabilidades definidos neste documento.

Alterações estruturais deverão sempre partir da evolução do Modelo de Domínio, garantindo que a persistência permaneça fiel à Linguagem Ubíqua e aos objetivos do negócio.

---

# Princípios Gerais do Banco de Dados

O banco de dados do TEAR segue os seguintes princípios fundamentais:

- toda estrutura persistida deriva diretamente do Modelo de Domínio;
- cada entidade possui responsabilidade única e claramente definida;
- relacionamentos preservam a integridade do negócio;
- Value Objects permanecem incorporados às entidades proprietárias;
- Enumerações representam conjuntos fechados controlados pelo domínio;
- histórico, auditoria e exclusão lógica possuem responsabilidades complementares;
- a estrutura lógica é independente da tecnologia de persistência;
- o DATABASE_MODEL constitui a especificação oficial para a construção e evolução do banco de dados do TEAR.