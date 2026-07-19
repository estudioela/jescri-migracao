# DOMAIN.md
# PASSO 1 — VISÃO DO DOMÍNIO
## ENTREGA A — CURADORIA

### Objetivo

Definir a visão estratégica do domínio do TEAR, estabelecendo claramente qual problema de negócio o sistema resolve, quais são seus limites e quais princípios orientam toda a modelagem do domínio.

Esta seção representa a porta de entrada do DOMAIN.md.

Ela não descreve entidades, regras ou fluxos em detalhes. Seu objetivo é responder **o que é o domínio do TEAR** antes de explicar **como ele funciona**.

---

# Escopo desta seção

A seção "Visão do Domínio" deverá responder apenas às seguintes perguntas:

- Qual é o domínio do TEAR?
- Qual problema de negócio ele resolve?
- Quem participa desse domínio?
- Quais operações fazem parte dele?
- Quais operações estão fora dele?
- Qual é o foco principal do sistema?

Todo detalhamento operacional será tratado nas próximas seções.

---

# Conteúdo aprovado para preservação

## Propósito do domínio

**Preservar integralmente.**

O TEAR existe para gerenciar todo o ciclo de relacionamento entre uma marca e suas parceiras de marketing de influência.

Seu objetivo não é administrar ferramentas ou processos internos, mas representar corretamente as relações comerciais e operacionais que ocorrem durante uma colaboração.

---

## Problema de negócio

**Preservar.**

O domínio resolve a fragmentação da operação de marketing de influência.

Em vez de múltiplos controles independentes, o TEAR centraliza todo o ciclo operacional em um único modelo de negócio consistente e rastreável.

---

## Núcleo do domínio

**Preservar integralmente.**

A Colaboração Mensal permanece como núcleo do domínio.

Todo comportamento relevante do sistema existe em função dela.

Nenhum processo operacional importante ocorre fora de uma Colaboração Mensal.

---

## Participantes

**Preservar.**

Fazem parte do domínio:

- Marca;
- Parceira;
- Usuários responsáveis pela operação.

Outros sistemas ou serviços são considerados externos ao domínio.

---

## Limites do domínio

**Preservar.**

O domínio termina onde começam responsabilidades exclusivamente técnicas, como:

- autenticação;
- armazenamento;
- infraestrutura;
- integrações;
- comunicação entre sistemas.

Esses assuntos pertencem à arquitetura.

---

# Conteúdo adaptado

## Campanhas

O conceito de campanha passa a representar apenas o contexto comercial da Colaboração Mensal.

A campanha deixa de ser considerada a unidade principal do domínio.

---

## Planilhas

Planilhas deixam de representar o domínio.

Passam a ser apenas uma implementação histórica utilizada pelo sistema legado.

---

## Portal

O portal deixa de ser tratado como parte do domínio.

Passa a ser apenas uma interface de interação com o negócio.

---

# Conteúdo removido

Não pertencem à Visão do Domínio:

- Google Sheets;
- Google Apps Script;
- APIs;
- banco de dados;
- autenticação;
- upload de arquivos;
- infraestrutura;
- arquitetura de software;
- frameworks;
- provedores de nuvem;
- detalhes de interface.

Esses elementos pertencem às camadas técnicas da solução.

---

# Ajustes editoriais

## Negócio antes da tecnologia

Toda descrição deverá utilizar exclusivamente linguagem do negócio.

Nenhum conceito técnico deve aparecer nesta seção.

---

## Linguagem Ubíqua

Todos os termos utilizados nesta seção deverão corresponder exatamente à Linguagem Ubíqua definida pelo projeto.

Novos termos somente poderão ser introduzidos após validação do domínio.

A linguagem compartilhada entre especialistas do negócio e desenvolvedores é um dos pilares do Domain-Driven Design e deve permanecer consistente em toda a documentação.  [oai_citation:0‡martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com)

---

## Independência

A Visão do Domínio deve permanecer válida mesmo que todo o sistema seja reescrito utilizando outra arquitetura ou outra tecnologia.

---

# Estrutura prevista para a documentação final

A seção "Visão do Domínio" do DOMAIN.md deverá conter apenas:

1. O Domínio do TEAR
2. Propósito do Sistema
3. Problema de Negócio
4. Escopo do Domínio
5. Participantes
6. Limites do Domínio
7. Princípios do Domínio

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Propósito do domínio | Preservar |
| Problema de negócio | Preservar |
| Colaboração Mensal como núcleo | Preservar |
| Participantes do domínio | Preservar |
| Limites do domínio | Preservar |
| Campanha | Adaptar |
| Portal | Adaptar |
| Planilhas | Remover |
| Tecnologia | Remover |
| Infraestrutura | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando a Visão do Domínio descrever exclusivamente o universo de negócio do TEAR, estabelecendo seu propósito, seus limites e seus princípios fundamentais, sem qualquer dependência de tecnologia, arquitetura ou implementação. Essa visão servirá como base para todas as demais seções do DOMAIN.md e para a construção da Linguagem Ubíqua do projeto.  [oai_citation:1‡Wikipedia](https://en.wikipedia.org/wiki/Domain-driven_design?utm_source=chatgpt.com)

# 1. VISÃO DO DOMÍNIO

## O Domínio do TEAR

O TEAR é um sistema especializado na gestão de programas de marketing de influência.

Seu domínio concentra-se na administração do relacionamento operacional entre uma marca e suas parceiras, acompanhando todo o ciclo de vida de cada colaboração, desde o ingresso da parceira até o registro permanente de seu histórico.

O foco do sistema não está na produção de conteúdo, na logística ou no pagamento de forma isolada, mas na coordenação integrada de todas essas atividades dentro de um único modelo de negócio.

Essa abordagem segue os princípios do *Domain-Driven Design (DDD)*, nos quais o domínio representa o principal ativo do sistema e orienta toda a modelagem da solução.  [oai_citation:0‡Wikipedia](https://en.wikipedia.org/wiki/Domain-driven_design?utm_source=chatgpt.com)

---

## Propósito do Sistema

O propósito do TEAR é transformar um conjunto de processos operacionais independentes em um fluxo único, consistente e rastreável.

Para isso, o sistema estabelece um modelo de domínio capaz de representar todas as etapas que compõem uma colaboração entre a marca e uma parceira, preservando seu histórico, suas regras e seu contexto comercial.

Cada colaboração deve possuir início, evolução e encerramento claramente definidos, permitindo que toda a operação seja compreendida como uma única unidade de negócio.

---

## Problema de Negócio

Programas de marketing de influência normalmente envolvem diversas atividades distribuídas entre pessoas, documentos e ferramentas distintas.

Cadastros, briefings, aprovações, logística, pagamentos e históricos frequentemente são administrados de forma independente, dificultando a rastreabilidade da operação e aumentando a complexidade da gestão.

O TEAR resolve esse problema ao centralizar todas essas informações em um único domínio, onde cada atividade passa a fazer parte de uma mesma colaboração, preservando seu contexto e sua relação com as demais operações.

---

## Escopo do Domínio

O domínio do TEAR contempla:

- cadastro e evolução das parceiras;
- configuração das relações comerciais;
- abertura das competências;
- gerenciamento das colaborações mensais;
- planejamento das entregas;
- produção de conteúdo;
- acompanhamento logístico;
- controle dos pagamentos;
- encerramento das competências;
- preservação do histórico operacional.

Todas essas operações pertencem ao mesmo universo de negócio e compartilham uma linguagem comum.

---

## Participantes do Domínio

O domínio é composto pelos seguintes participantes:

### Marca

Organização responsável pela execução do programa de marketing de influência e pela definição das relações comerciais.

---

### Parceira

Pessoa participante do programa de influência, responsável pela realização das colaborações previstas em cada competência.

---

### Operação

Conjunto de usuários responsáveis pelo planejamento, acompanhamento, aprovação e encerramento das atividades do programa.

---

Esses participantes representam os agentes centrais do domínio.

Sistemas externos, integrações e ferramentas de apoio não fazem parte do modelo de negócio.

---

## Limites do Domínio

O domínio do TEAR encerra-se nas responsabilidades relacionadas ao negócio.

Não fazem parte deste domínio:

- autenticação;
- infraestrutura;
- banco de dados;
- armazenamento de arquivos;
- APIs;
- serviços externos;
- integrações técnicas;
- tecnologias específicas de implementação.

Esses elementos pertencem à arquitetura da solução e existem apenas para viabilizar a execução do domínio.

---

## Princípios do Domínio

O domínio do TEAR é orientado pelos seguintes princípios:

- O negócio é o centro do sistema.
- A Colaboração Mensal representa a principal unidade operacional do domínio.
- Toda operação ocorre dentro de uma competência.
- Cada colaboração preserva seu contexto comercial por meio de um snapshot imutável.
- O histórico operacional é permanente e rastreável.
- A linguagem utilizada na documentação deve refletir exatamente a linguagem do negócio.
- O domínio deve permanecer válido independentemente da tecnologia utilizada para implementá-lo.

Esses princípios estabelecem a base sobre a qual todas as entidades, fluxos, regras e decisões arquiteturais do TEAR serão construídos, mantendo a documentação alinhada à linguagem ubíqua e ao modelo de domínio compartilhado entre especialistas do negócio e desenvolvedores.  [oai_citation:1‡martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com)

# PASSO 2 — LINGUAGEM UBÍQUA
## ENTREGA A — CURADORIA

### Objetivo

Definir a linguagem oficial utilizada pelo domínio do TEAR, garantindo que todas as pessoas envolvidas no projeto utilizem exatamente os mesmos termos para representar os mesmos conceitos de negócio.

A Linguagem Ubíqua representa o vocabulário oficial do sistema e elimina ambiguidades entre documentação, desenvolvimento e operação.

---

# Escopo desta seção

A seção "Linguagem Ubíqua" deverá responder apenas às seguintes perguntas:

- Quais termos oficiais existem no domínio?
- O que cada termo significa?
- Quais termos deixam de existir?
- Quais sinônimos devem ser evitados?
- Como manter consistência entre negócio e desenvolvimento?

Esta seção não descreve regras de negócio nem implementação.

---

# Conteúdo aprovado para preservação

## Linguagem única

**Preservar integralmente.**

Todo conceito do domínio deve possuir um único nome oficial.

Um mesmo conceito nunca deverá possuir múltiplas denominações na documentação ou no sistema.

---

## Vocabulário compartilhado

**Preservar.**

A linguagem utilizada deve ser compreendida igualmente por:

- negócio;
- operação;
- produto;
- arquitetura;
- desenvolvimento;
- documentação.

Não devem existir traduções entre áreas.

---

## Definição formal dos termos

**Preservar.**

Cada termo oficial deverá possuir:

- definição;
- contexto de utilização;
- significado preciso;
- relação com outros conceitos do domínio.

---

## Consistência documental

**Preservar.**

Toda documentação oficial deverá utilizar exatamente os mesmos termos.

Mudanças na Linguagem Ubíqua devem refletir simultaneamente em toda a documentação oficial do projeto.

---

# Conteúdo adaptado

## Cadastro

O termo "Cadastro" passa a ser substituído por **Onboarding**, quando representar o processo de ingresso de uma nova Parceira no programa.

---

## Ativação

O termo "Ativação" deixa de representar o núcleo do processo operacional.

Quando necessário, deverá ser utilizado apenas para descrever ações específicas dentro de uma Colaboração Mensal.

---

## Campanha

O termo "Campanha" passa a representar exclusivamente o contexto comercial da colaboração.

Não deverá ser utilizado como sinônimo de competência, colaboração ou operação.

---

## Influenciadora

Sempre que possível, o domínio utilizará o termo **Parceira**, por representar de forma mais ampla o papel desempenhado no programa.

---

# Conteúdo removido

Não pertencem à Linguagem Ubíqua:

- nomes de tabelas;
- nomes de planilhas;
- nomes de APIs;
- nomes de classes;
- nomes de arquivos;
- nomes de bancos;
- nomes de endpoints;
- nomes técnicos de implementação;
- siglas internas sem significado para o negócio.

Esses elementos pertencem exclusivamente à implementação.

---

# Ajustes editoriais

## Linguagem do negócio

A documentação deverá utilizar exclusivamente termos compreensíveis para especialistas do domínio.

Expressões técnicas somente poderão aparecer na documentação técnica.

---

## Evolução controlada

Novos termos somente poderão ser incorporados após validação do domínio.

Sempre que um novo conceito surgir, deverá ser avaliado se realmente representa uma nova ideia ou apenas um novo nome para um conceito já existente.

---

## Eliminação de sinônimos

Cada conceito deverá possuir um único nome oficial.

Sinônimos, abreviações e variações deverão ser evitados para impedir interpretações diferentes sobre o mesmo elemento do domínio.

Essa prática é um dos fundamentos do *Ubiquitous Language* proposto pelo Domain-Driven Design, promovendo comunicação consistente entre especialistas do negócio e equipe técnica. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

---

# Estrutura prevista para a documentação final

A seção "Linguagem Ubíqua" do DOMAIN.md deverá conter apenas:

1. Objetivo
2. Princípios da Linguagem
3. Vocabulário Oficial
4. Definições dos Termos
5. Termos Descontinuados
6. Convenções de Uso
7. Evolução da Linguagem

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Linguagem única | Preservar |
| Vocabulário compartilhado | Preservar |
| Definição formal dos termos | Preservar |
| Consistência documental | Preservar |
| Cadastro → Onboarding | Adaptar |
| Campanha | Adaptar |
| Influenciadora → Parceira | Adaptar |
| Termos técnicos | Remover |
| Estruturas de implementação | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os conceitos do TEAR possuírem uma terminologia única, precisa e compartilhada por todas as áreas do projeto, eliminando ambiguidades e estabelecendo uma Linguagem Ubíqua consistente, capaz de servir como referência para toda a documentação, comunicação e evolução do domínio. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

# 2. LINGUAGEM UBÍQUA

## Objetivo

A Linguagem Ubíqua do TEAR estabelece o vocabulário oficial utilizado em todo o domínio do sistema.

Seu objetivo é garantir que especialistas do negócio, usuários, arquitetos, desenvolvedores e toda a documentação utilizem exatamente os mesmos termos para representar os mesmos conceitos, eliminando ambiguidades e promovendo uma comunicação consistente, conforme os princípios do *Domain-Driven Design (DDD)*. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

---

## Princípios da Linguagem

A Linguagem Ubíqua do TEAR segue os seguintes princípios:

- Cada conceito possui um único nome oficial.
- Um termo representa apenas um conceito.
- Um conceito nunca possui múltiplos nomes oficiais.
- A documentação deve utilizar exclusivamente essa terminologia.
- O sistema deve refletir a linguagem do negócio.
- Mudanças na linguagem devem ser refletidas em toda a documentação oficial.

---

## Vocabulário Oficial

### Marca

Organização responsável pela operação do programa de marketing de influência.

---

### Parceira

Pessoa participante do programa de influência que mantém relacionamento operacional e comercial com a Marca.

Este é o termo oficial utilizado pelo domínio.

---

### Onboarding

Processo de ingresso de uma nova Parceira no programa.

Compreende todas as etapas necessárias para que ela esteja apta a participar das futuras colaborações.

---

### Competência

Período operacional utilizado para organizar uma rodada de colaborações.

Toda Colaboração Mensal pertence exatamente a uma Competência.

---

### Colaboração Mensal

Principal unidade operacional do domínio.

Representa o relacionamento estabelecido entre a Marca e uma Parceira durante uma Competência específica.

É o centro de todas as operações do sistema.

---

### Snapshot Comercial

Registro imutável das condições comerciais vigentes no momento da criação de uma Colaboração Mensal.

Preserva o contexto histórico da relação comercial mesmo que configurações futuras sejam alteradas.

---

### Planejamento

Conjunto de definições que estabelece os objetivos, entregas e responsabilidades da Colaboração Mensal.

---

### Produção

Execução das entregas previstas para a Colaboração Mensal.

---

### Logística

Conjunto das operações relacionadas ao envio, recebimento e acompanhamento dos materiais necessários para execução da colaboração.

---

### Pagamento

Processo responsável pela remuneração da Parceira conforme as condições definidas no Snapshot Comercial.

---

### Histórico

Registro permanente das Colaborações Mensais concluídas e dos acontecimentos relevantes do domínio.

O Histórico nunca deve perder informações anteriormente registradas.

---

## Termos Descontinuados

Os seguintes termos deixam de fazer parte da linguagem oficial do domínio:

| Termo | Substituição Oficial |
|--------|----------------------|
| Influenciadora | Parceira |
| Cadastro | Onboarding |
| Ativação (como processo principal) | Colaboração Mensal |
| Planilha | Não pertence ao domínio |
| Portal | Interface |
| Campanha (como unidade operacional) | Competência ou Colaboração Mensal, conforme o contexto |

Esses termos podem aparecer apenas quando houver necessidade de referência histórica ao sistema legado.

---

## Convenções de Uso

Toda documentação do TEAR deve respeitar as seguintes convenções:

- utilizar sempre o nome oficial dos conceitos;
- evitar abreviações desnecessárias;
- evitar sinônimos para conceitos existentes;
- não utilizar termos técnicos para representar conceitos de negócio;
- manter a mesma terminologia em documentos, diagramas e implementações.

Sempre que surgir um novo conceito, sua definição deverá ser incorporada primeiro à Linguagem Ubíqua antes de ser utilizada em qualquer outra documentação.

---

## Evolução da Linguagem

A Linguagem Ubíqua é parte integrante do domínio e evolui juntamente com o produto.

Novos termos somente poderão ser incorporados quando representarem conceitos efetivamente novos do negócio.

Alterações de nomenclatura devem preservar a consistência histórica da documentação e evitar a coexistência de diferentes nomes para o mesmo conceito.

---

## Princípios da Linguagem

A Linguagem Ubíqua do TEAR segue os seguintes princípios permanentes:

- O domínio determina a linguagem.
- A linguagem pertence ao negócio, não à tecnologia.
- Cada conceito possui uma definição única.
- Toda documentação utiliza o mesmo vocabulário.
- O sistema deve refletir a linguagem oficial do domínio.
- A comunicação entre negócio e desenvolvimento deve ocorrer sem necessidade de tradução.
- A consistência da linguagem é essencial para preservar a integridade do domínio ao longo da evolução do projeto.

# PASSO 3 — ENTIDADES
## ENTREGA A — CURADORIA

### Objetivo

Identificar e consolidar todas as entidades permanentes do domínio do TEAR, definindo quais objetos possuem identidade própria, ciclo de vida independente e relevância para o negócio.

Esta seção estabelece quais elementos representam o núcleo do domínio e servirão de base para toda a modelagem posterior.

Não descreve banco de dados, classes, tabelas ou implementação.

---

# Escopo desta seção

A seção "Entidades" deverá responder apenas às seguintes perguntas:

- Quais entidades existem no domínio?
- Quais possuem identidade própria?
- Qual é a responsabilidade de cada entidade?
- Como cada entidade participa do negócio?
- Quais elementos não são entidades?

As relações entre entidades serão detalhadas em uma seção específica posteriormente.

---

# Conteúdo aprovado para preservação

## Parceira

**Preservar integralmente.**

Representa a pessoa participante do programa de marketing de influência.

Possui identidade própria, histórico permanente e participa de diversas Colaborações Mensais ao longo do tempo.

---

## Marca

**Preservar integralmente.**

Representa a organização responsável pelo programa de influência.

Define regras comerciais, competências e relacionamentos com as Parceiras.

---

## Competência

**Preservar integralmente.**

Representa um período operacional do programa.

Organiza temporalmente todas as Colaborações Mensais pertencentes ao mesmo ciclo.

---

## Colaboração Mensal

**Preservar integralmente.**

É a principal entidade do domínio.

Representa a relação operacional entre uma Marca e uma Parceira durante uma Competência específica.

Toda atividade relevante do domínio ocorre dentro de uma Colaboração Mensal.

---

## Pagamento

**Preservar.**

Representa a obrigação financeira decorrente de uma Colaboração Mensal.

Possui ciclo próprio dentro da colaboração e integra seu histórico operacional.

---

# Conteúdo adaptado

## Briefing

Deixa de ser tratado como entidade principal.

Passa a representar um elemento pertencente ao Planejamento da Colaboração Mensal.

---

## Logística

Deixa de ser considerada entidade independente.

Passa a representar um conjunto de atividades pertencentes à Colaboração Mensal.

---

## Produção

Também deixa de representar uma entidade.

Passa a descrever uma etapa operacional da Colaboração Mensal.

---

## Campanha

Não representa uma entidade do domínio.

Permanece apenas como contexto comercial quando aplicável.

---

# Conteúdo removido

Não são entidades do domínio:

- planilhas;
- abas;
- formulários;
- uploads;
- arquivos;
- APIs;
- usuários autenticados;
- sessões;
- permissões técnicas;
- serviços externos.

Esses elementos pertencem à implementação da solução.

---

# Ajustes editoriais

## Entidade ≠ Documento

Documentos, arquivos e registros administrativos não representam entidades do domínio.

Uma entidade existe independentemente da forma como suas informações são armazenadas.

---

## Entidade ≠ Processo

Processos representam comportamentos.

Entidades representam elementos permanentes do domínio.

Fluxos como Planejamento, Produção e Logística pertencem ao comportamento das entidades, não à sua identidade.

---

## Identidade permanente

Toda entidade deve possuir identidade própria que permaneça válida durante todo seu ciclo de vida.

Mesmo que seus atributos mudem, sua identidade permanece inalterada, característica fundamental das entidades em Domain-Driven Design. ([martinfowler.com](https://martinfowler.com/bliki/EvansClassification.html?utm_source=chatgpt.com))

---

# Estrutura prevista para a documentação final

A seção "Entidades" do DOMAIN.md deverá conter apenas:

1. Conceito de Entidade
2. Entidades do Domínio
3. Responsabilidade de Cada Entidade
4. Ciclo de Vida das Entidades
5. Identidade
6. Limites das Entidades
7. Princípios das Entidades

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Parceira | Preservar |
| Marca | Preservar |
| Competência | Preservar |
| Colaboração Mensal | Preservar |
| Pagamento | Preservar |
| Briefing | Adaptar |
| Produção | Adaptar |
| Logística | Adaptar |
| Campanha | Adaptar |
| Elementos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todas as entidades permanentes do domínio estiverem claramente identificadas, diferenciadas dos processos e das tecnologias, com responsabilidades bem definidas e identidade própria, formando a base conceitual para a modelagem completa do TEAR. ([martinfowler.com](https://martinfowler.com/bliki/EvansClassification.html?utm_source=chatgpt.com))

# 3. ENTIDADES

## Conceito de Entidade

No domínio do TEAR, uma entidade representa um elemento do negócio que possui identidade própria, ciclo de vida contínuo e relevância permanente para a operação.

Uma entidade permanece sendo a mesma ao longo do tempo, mesmo que seus atributos sejam alterados.

As entidades constituem os principais elementos do modelo de domínio e organizam todos os comportamentos do sistema, conforme os princípios do *Domain-Driven Design (DDD)*. ([martinfowler.com](https://martinfowler.com/bliki/EvansClassification.html?utm_source=chatgpt.com))

---

## Entidades do Domínio

O domínio do TEAR é composto pelas seguintes entidades principais:

- Marca
- Parceira
- Competência
- Colaboração Mensal
- Pagamento

Cada uma possui responsabilidades específicas e participa do funcionamento do programa de marketing de influência.

---

## Marca

A Marca representa a organização responsável pelo programa de marketing de influência.

É responsável por estabelecer as relações comerciais, definir competências, organizar as colaborações e conduzir toda a operação do programa.

Uma Marca pode manter relacionamento com diversas Parceiras ao longo de múltiplas Competências.

---

## Parceira

A Parceira representa a pessoa participante do programa de marketing de influência.

Possui identidade permanente dentro do sistema e pode participar de diversas Colaborações Mensais ao longo do tempo.

Seu histórico deve permanecer preservado independentemente das mudanças ocorridas durante sua participação no programa.

---

## Competência

A Competência representa um período operacional do programa.

Seu papel é organizar temporalmente as Colaborações Mensais, permitindo que cada ciclo operacional seja tratado como uma unidade claramente delimitada.

Uma Competência pode conter diversas Colaborações Mensais.

---

## Colaboração Mensal

A Colaboração Mensal é a principal entidade do domínio.

Ela representa a relação operacional entre uma Marca e uma Parceira durante uma Competência específica.

Todo comportamento relevante do sistema ocorre dentro de uma Colaboração Mensal.

Planejamento, produção, logística, pagamentos e histórico são aspectos pertencentes a essa entidade.

Cada Colaboração Mensal preserva seu contexto comercial por meio de um Snapshot Comercial imutável.

---

## Pagamento

O Pagamento representa a obrigação financeira originada por uma Colaboração Mensal.

Seu ciclo de vida está vinculado à colaboração que lhe deu origem e registra todas as informações necessárias para preservar o histórico financeiro da operação.

Uma Colaboração Mensal pode possuir um ou mais registros de pagamento, conforme as regras do programa.

---

## Ciclo de Vida das Entidades

Cada entidade possui um ciclo de vida próprio.

- A Marca existe independentemente das Competências.
- A Parceira permanece ativa durante toda sua participação no programa.
- A Competência possui início e encerramento definidos.
- A Colaboração Mensal nasce dentro de uma Competência e encerra-se ao final de seu ciclo operacional.
- O Pagamento acompanha o ciclo financeiro da Colaboração Mensal.

O encerramento de uma entidade não implica a perda de seu histórico.

---

## Identidade

Cada entidade possui uma identidade única e permanente.

Essa identidade não depende de seus atributos nem de sua forma de armazenamento.

Alterações em informações descritivas não modificam a identidade da entidade.

Esse princípio garante rastreabilidade e consistência durante toda a evolução do domínio.

---

## Limites das Entidades

Não representam entidades do domínio:

- documentos;
- briefings;
- arquivos;
- formulários;
- uploads;
- integrações;
- APIs;
- bancos de dados;
- interfaces;
- tecnologias utilizadas pelo sistema.

Esses elementos existem apenas para apoiar a operação das entidades do domínio.

---

## Princípios das Entidades

As entidades do TEAR seguem os seguintes princípios:

- Toda entidade possui identidade própria.
- Toda entidade participa diretamente do domínio do negócio.
- Entidades representam elementos permanentes, não processos.
- Processos descrevem comportamentos das entidades.
- O histórico das entidades deve permanecer preservado.
- A Colaboração Mensal representa a principal entidade do domínio.
- Toda entidade deve permanecer independente da tecnologia utilizada para implementá-la.
- A integridade do domínio depende da consistência das entidades e de seus relacionamentos ao longo de todo o ciclo de vida do sistema.

# PASSO 4 — AGREGADOS
## ENTREGA A — CURADORIA

### Objetivo

Definir os Agregados do domínio do TEAR, estabelecendo os limites de consistência do modelo de negócio e identificando quais entidades devem ser tratadas como uma única unidade lógica durante sua evolução.

Cada Agregado representa um conjunto coeso de objetos do domínio cuja integridade é garantida por uma única Entidade Raiz (*Aggregate Root*). Esse conceito é um dos pilares táticos do Domain-Driven Design.  [oai_citation:0‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Agregados" deverá responder apenas às seguintes perguntas:

- Quais agregados existem no domínio?
- Qual é a Raiz de cada agregado?
- Quais objetos pertencem a cada agregado?
- Quais regras precisam permanecer consistentes dentro de cada agregado?
- Quais referências podem existir entre agregados?

Esta seção não descreve banco de dados, APIs ou implementação.

---

# Conteúdo aprovado para preservação

## Colaboração Mensal como Aggregate Root

**Preservar integralmente.**

A Colaboração Mensal permanece como o principal Aggregate Root do domínio.

Todo comportamento operacional ocorre dentro de seus limites de consistência.

Planejamento, Produção, Logística e Pagamento pertencem ao seu agregado.

---

## Parceira

**Preservar.**

Parceira constitui um agregado próprio.

É responsável exclusivamente pelo ciclo de vida da Parceira e por suas informações permanentes.

Não controla regras da Colaboração Mensal.

---

## Competência

**Preservar.**

Competência constitui um agregado independente.

Seu papel é organizar temporalmente as Colaborações Mensais.

Não administra o comportamento interno de cada colaboração.

---

## Marca

**Preservar.**

Marca constitui um agregado próprio responsável pelas definições institucionais e comerciais do programa.

---

# Conteúdo adaptado

## Pagamento

Pagamento deixa de ser considerado um agregado independente.

Passa a integrar o Agregado da Colaboração Mensal.

Sua consistência depende da colaboração que lhe deu origem.

---

## Snapshot Comercial

Snapshot Comercial não constitui agregado.

Passa a ser considerado um objeto interno pertencente ao Agregado da Colaboração Mensal.

---

## Planejamento, Produção e Logística

Não representam agregados.

São componentes internos da Colaboração Mensal.

---

# Conteúdo removido

Não representam agregados:

- documentos;
- planilhas;
- arquivos;
- uploads;
- APIs;
- integrações;
- banco de dados;
- usuários técnicos;
- autenticação;
- interfaces.

Esses elementos pertencem à infraestrutura da solução.

---

# Ajustes editoriais

## Limites de Consistência

Cada agregado define um limite dentro do qual as regras de negócio devem permanecer sempre válidas.

Mudanças realizadas dentro desse limite devem preservar a integridade do agregado como um todo.  [oai_citation:1‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

## Uma única Raiz

Todo agregado deverá possuir exatamente uma Entidade Raiz.

Qualquer modificação em elementos internos deverá ocorrer por intermédio dessa Raiz.

Objetos externos nunca devem manipular diretamente elementos internos do agregado.  [oai_citation:2‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

## Referências entre agregados

Agregados não devem compartilhar seus objetos internos.

Relacionamentos entre agregados devem ocorrer apenas por meio das respectivas Entidades Raiz.

---

## Agregados pequenos

Os agregados deverão permanecer pequenos, coesos e orientados pelas regras de negócio.

Seu objetivo é preservar consistência, e não agrupar grandes quantidades de informações relacionadas.  [oai_citation:3‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

# Estrutura prevista para a documentação final

A seção "Agregados" do DOMAIN.md deverá conter apenas:

1. Conceito de Agregado
2. Aggregate Roots
3. Limites dos Agregados
4. Objetos pertencentes a cada Agregado
5. Regras de Consistência
6. Relacionamentos entre Agregados
7. Princípios dos Agregados

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Colaboração Mensal | Aggregate Root principal |
| Parceira | Agregado independente |
| Competência | Agregado independente |
| Marca | Agregado independente |
| Pagamento | Incorporar ao Agregado da Colaboração Mensal |
| Snapshot Comercial | Incorporar ao Agregado da Colaboração Mensal |
| Planejamento | Incorporar ao Agregado da Colaboração Mensal |
| Produção | Incorporar ao Agregado da Colaboração Mensal |
| Logística | Incorporar ao Agregado da Colaboração Mensal |
| Elementos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os limites de consistência do domínio estiverem claramente definidos, cada agregado possuir uma única Entidade Raiz e todas as responsabilidades do domínio estiverem distribuídas de forma coesa, garantindo integridade do modelo de negócio e independência entre agregados.  [oai_citation:4‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

# 4. AGREGADOS

## Conceito de Agregado

No domínio do TEAR, um Agregado representa um conjunto coeso de objetos de negócio que devem ser tratados como uma única unidade de consistência.

Cada Agregado estabelece um limite dentro do qual as regras do domínio devem permanecer sempre válidas.

Todas as modificações realizadas em seus objetos internos ocorrem por intermédio de uma única Entidade Raiz (*Aggregate Root*), responsável por preservar a integridade do conjunto. Essa abordagem é um dos fundamentos do *Domain-Driven Design (DDD)*.  [oai_citation:0‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

## Aggregate Roots

O domínio do TEAR é organizado pelos seguintes Aggregate Roots:

- Marca
- Parceira
- Competência
- Colaboração Mensal

Cada um representa um limite próprio de consistência e administra exclusivamente os elementos pertencentes ao seu agregado.

---

## Agregado Marca

### Entidade Raiz

**Marca**

### Responsabilidade

Representa a organização responsável pelo programa de marketing de influência.

Administra suas próprias informações institucionais e comerciais, mantendo independência em relação às demais entidades do domínio.

### Objetos pertencentes

- informações institucionais;
- configurações comerciais permanentes;
- políticas gerais do programa.

---

## Agregado Parceira

### Entidade Raiz

**Parceira**

### Responsabilidade

Representa a participante do programa de marketing de influência.

Seu agregado preserva todas as informações permanentes relacionadas à identidade da Parceira durante sua permanência no programa.

As Colaborações Mensais não pertencem a este agregado, sendo apenas associadas à Parceira.

### Objetos pertencentes

- identidade;
- dados permanentes;
- informações cadastrais;
- histórico de participação.

---

## Agregado Competência

### Entidade Raiz

**Competência**

### Responsabilidade

Representa um período operacional do programa.

Organiza temporalmente as Colaborações Mensais, sem controlar o comportamento interno de cada uma delas.

### Objetos pertencentes

- período operacional;
- informações de abertura;
- informações de encerramento.

---

## Agregado Colaboração Mensal

### Entidade Raiz

**Colaboração Mensal**

Este é o principal Agregado do domínio.

Toda operação relevante do TEAR ocorre dentro de seus limites de consistência.

É por meio dessa entidade que o sistema garante a integridade da colaboração entre Marca e Parceira durante uma Competência.

### Objetos pertencentes

O Agregado Colaboração Mensal é composto por:

- Snapshot Comercial;
- Planejamento;
- Produção;
- Logística;
- Pagamentos;
- Histórico operacional da colaboração.

Esses objetos não possuem autonomia perante o domínio e somente podem ser modificados através da Colaboração Mensal.

---

## Limites dos Agregados

Cada agregado possui responsabilidades claramente delimitadas.

- A Marca não modifica informações internas da Colaboração Mensal.
- A Parceira não administra o estado operacional da colaboração.
- A Competência apenas organiza o período operacional.
- A Colaboração Mensal administra exclusivamente sua própria operação.

Essa separação reduz acoplamentos e preserva a consistência do domínio.  [oai_citation:1‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

## Regras de Consistência

Cada agregado é responsável por garantir suas próprias regras de negócio.

No Agregado Colaboração Mensal, por exemplo:

- toda colaboração pertence exatamente a uma Competência;
- toda colaboração está associada a exatamente uma Parceira;
- o Snapshot Comercial torna-se imutável após sua criação;
- pagamentos pertencem exclusivamente à colaboração que lhes deu origem;
- nenhum componente interno pode existir sem sua Colaboração Mensal.

Essas regras devem permanecer válidas durante todo o ciclo de vida do agregado.

---

## Relacionamentos entre Agregados

Os agregados relacionam-se apenas por intermédio de suas Entidades Raiz.

Nenhum agregado manipula diretamente os objetos internos de outro agregado.

Assim:

- uma Colaboração Mensal referencia uma Marca;
- uma Colaboração Mensal referencia uma Parceira;
- uma Colaboração Mensal referencia uma Competência;

mas nunca acessa diretamente elementos internos pertencentes aos agregados dessas entidades.

Essa abordagem preserva baixo acoplamento e independência entre os limites de consistência.  [oai_citation:2‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

## Princípios dos Agregados

Os agregados do TEAR seguem os seguintes princípios:

- Todo agregado possui exatamente uma Entidade Raiz.
- Toda modificação ocorre por intermédio da Entidade Raiz.
- Cada agregado define um limite de consistência do domínio.
- Objetos internos não podem ser manipulados diretamente por elementos externos.
- Agregados relacionam-se apenas por meio de suas Entidades Raiz.
- A Colaboração Mensal representa o principal Aggregate Root do domínio.
- Os agregados devem permanecer pequenos, coesos e orientados pelas regras do negócio, e não pela estrutura de armazenamento ou pela tecnologia utilizada.  [oai_citation:3‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

# PASSO 5 — OBJETOS DE VALOR (VALUE OBJECTS)
## ENTREGA A — CURADORIA

### Objetivo

Identificar todos os Objetos de Valor (*Value Objects*) do domínio do TEAR, definindo quais conceitos representam características do negócio sem possuir identidade própria.

Os Value Objects descrevem atributos relevantes do domínio, são definidos exclusivamente pelos seus valores e existem apenas como parte de uma entidade ou agregado.

Sua utilização reduz ambiguidades, fortalece a linguagem ubíqua e preserva a integridade do modelo de domínio, conforme os princípios do *Domain-Driven Design (DDD)*. ([martinfowler.com](https://martinfowler.com/bliki/ValueObject.html?utm_source=chatgpt.com))

---

# Escopo desta seção

A seção "Objetos de Valor" deverá responder apenas às seguintes perguntas:

- Quais conceitos do domínio são Value Objects?
- Quais características definem cada Value Object?
- Quais Value Objects pertencem a quais agregados?
- Quais objetos não possuem identidade própria?
- Quais regras de imutabilidade devem ser preservadas?

Esta seção não descreve entidades, banco de dados ou implementação.

---

# Conteúdo aprovado para preservação

## Snapshot Comercial

**Preservar integralmente.**

Representa as condições comerciais vigentes no momento da criação de uma Colaboração Mensal.

É definido exclusivamente por seus valores.

Após sua criação torna-se imutável.

Pertence ao Agregado Colaboração Mensal.

---

## Competência (como representação temporal)

**Adaptar.**

A Competência permanece uma Entidade.

Entretanto, elementos que representam seu período (mês, ano, intervalo operacional) podem ser modelados futuramente como Value Objects internos.

---

## Configuração Comercial

**Preservar como Value Object.**

Representa as condições comerciais utilizadas para originar um Snapshot Comercial.

Não possui identidade própria.

Existe apenas como descrição das condições comerciais.

---

## Dados de Endereço

**Preservar como candidato.**

Endereço representa um conjunto coeso de atributos.

Seu significado depende exclusivamente de seus valores.

Não necessita identidade própria dentro do domínio.

---

## Informações de Contato

**Preservar como candidato.**

Telefone, e-mail e demais meios de contato representam características da Parceira, e não entidades independentes.

---

# Conteúdo adaptado

## Planejamento

Planejamento deixa de ser considerado candidato a entidade.

Passa a representar um componente interno da Colaboração Mensal.

Partes de sua estrutura poderão futuramente ser modeladas como Value Objects.

---

## Logística

Logística continua pertencendo ao Agregado Colaboração Mensal.

Elementos como endereço de entrega, modalidade de envio ou prazo poderão ser representados por Value Objects.

---

## Pagamento

Pagamento permanece uma Entidade.

Valores monetários, formas de remuneração e condições financeiras podem ser modelados como Value Objects pertencentes ao Pagamento.

---

# Conteúdo removido

Não representam Value Objects:

- Parceira;
- Marca;
- Competência;
- Colaboração Mensal;
- Pagamento;
- documentos;
- arquivos;
- uploads;
- APIs;
- planilhas;
- tecnologias de armazenamento.

Todos esses elementos possuem identidade própria ou pertencem à infraestrutura.

---

# Ajustes editoriais

## Imutabilidade

Todo Value Object deverá ser imutável.

Qualquer alteração deverá resultar na criação de uma nova instância conceitual, preservando o histórico e evitando mudanças implícitas. ([martinfowler.com](https://martinfowler.com/bliki/ValueObject.html?utm_source=chatgpt.com))

---

## Igualdade por valor

Value Objects são comparados exclusivamente por seus valores.

Dois objetos com os mesmos valores representam exatamente o mesmo conceito do domínio.

Sua identidade individual não possui significado para o negócio.

---

## Pertencimento

Todo Value Object pertence a uma Entidade ou Agregado.

Não possui ciclo de vida independente.

Não existe isoladamente dentro do domínio.

---

## Coesão

Um Value Object deve representar um único conceito do negócio.

Não deve agrupar informações sem relação semântica apenas por conveniência de implementação.

---

# Estrutura prevista para a documentação final

A seção "Objetos de Valor" do DOMAIN.md deverá conter apenas:

1. Conceito de Value Object
2. Value Objects do Domínio
3. Responsabilidade de Cada Value Object
4. Imutabilidade
5. Pertencimento aos Agregados
6. Igualdade por Valor
7. Princípios dos Value Objects

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Snapshot Comercial | Preservar |
| Configuração Comercial | Preservar |
| Endereço | Preservar |
| Informações de Contato | Preservar |
| Planejamento | Adaptar |
| Logística | Adaptar |
| Pagamento | Adaptar (VOs internos) |
| Entidades do domínio | Remover |
| Elementos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os conceitos definidos exclusivamente por seus valores estiverem claramente identificados, diferenciados das entidades do domínio e organizados como componentes imutáveis pertencentes aos respectivos agregados, fortalecendo a consistência da Linguagem Ubíqua e da modelagem do TEAR. ([martinfowler.com](https://martinfowler.com/bliki/ValueObject.html?utm_source=chatgpt.com))

# 5. OBJETOS DE VALOR (VALUE OBJECTS)

## Conceito de Value Object

No domínio do TEAR, um Objeto de Valor (*Value Object*) representa um conceito do negócio definido exclusivamente pelos seus valores, sem possuir identidade própria.

Diferentemente das entidades, sua importância está nas características que representa e não em uma identificação única.

Dois Value Objects com exatamente os mesmos valores representam o mesmo conceito para o domínio, independentemente de onde estejam sendo utilizados.  [oai_citation:0‡martinfowler.com](https://martinfowler.com/bliki/ValueObject.html?utm_source=chatgpt.com)

---

## Value Objects do Domínio

O domínio do TEAR utiliza os seguintes Objetos de Valor:

- Snapshot Comercial
- Configuração Comercial
- Endereço
- Informações de Contato
- Período Operacional
- Valor Monetário
- Condição Comercial

Cada um descreve características do domínio pertencentes a uma Entidade ou Agregado, não existindo de forma independente.

---

## Snapshot Comercial

O Snapshot Comercial representa as condições comerciais vigentes no momento da criação de uma Colaboração Mensal.

Seu objetivo é preservar exatamente o contexto comercial utilizado durante aquela colaboração.

Após sua criação, seu conteúdo permanece inalterado, garantindo que mudanças futuras na relação comercial não modifiquem o histórico da operação.

Pertence exclusivamente ao Agregado Colaboração Mensal.

---

## Configuração Comercial

A Configuração Comercial representa as condições negociadas entre a Marca e a Parceira.

Ela descreve informações como forma de remuneração, benefícios e demais parâmetros comerciais utilizados para originar um Snapshot Comercial.

Não possui ciclo de vida próprio e existe apenas como característica da relação comercial.

---

## Endereço

O Endereço representa a localização utilizada nas operações do domínio.

É composto por informações que somente fazem sentido quando analisadas em conjunto.

Seu significado está no conjunto completo de seus atributos, e não em cada informação isoladamente.

Pode ser utilizado tanto pela Parceira quanto por processos logísticos pertencentes à Colaboração Mensal.

---

## Informações de Contato

As Informações de Contato representam os meios pelos quais uma Parceira pode ser contatada.

Telefone, e-mail e demais canais fazem parte desse conceito.

Essas informações descrevem características da Parceira e não constituem elementos independentes do domínio.

---

## Período Operacional

O Período Operacional representa a dimensão temporal utilizada para caracterizar uma Competência.

Embora a Competência seja uma Entidade, a representação de seu intervalo temporal pode ser modelada como um Value Object, descrevendo exclusivamente seu período de vigência.

---

## Valor Monetário

O Valor Monetário representa uma quantia financeira utilizada nas operações do domínio.

Seu significado depende exclusivamente do valor e da moeda associados.

Esse conceito pode ser utilizado na composição de Pagamentos e Configurações Comerciais, evitando o uso de valores primitivos dispersos pelo modelo.  [oai_citation:1‡martinfowler.com](https://martinfowler.com/bliki/CurrencyAsValue.html?utm_source=chatgpt.com)

---

## Condição Comercial

A Condição Comercial representa parâmetros específicos de uma relação comercial.

Ela descreve características como modalidade de remuneração, benefícios negociados ou outras condições acordadas entre a Marca e a Parceira.

Seu propósito é representar regras comerciais sem criar novas entidades para informações que não possuem identidade própria.

---

## Imutabilidade

Todos os Value Objects do TEAR são imutáveis.

Após sua criação, seus valores não devem ser alterados.

Sempre que uma informação precisar ser modificada, um novo Value Object deverá ser criado, preservando a consistência do domínio e o histórico das operações.  [oai_citation:2‡martinfowler.com](https://martinfowler.com/bliki/ValueObject.html?utm_source=chatgpt.com)

---

## Pertencimento aos Agregados

Todo Value Object pertence a uma Entidade ou Agregado.

Ele nunca possui existência independente.

No domínio do TEAR:

- o Snapshot Comercial pertence à Colaboração Mensal;
- a Configuração Comercial pertence à Marca ou à relação comercial;
- o Endereço pertence à Parceira ou à Logística;
- as Informações de Contato pertencem à Parceira;
- o Valor Monetário pertence ao Pagamento;
- a Condição Comercial pertence ao Snapshot Comercial ou à Configuração Comercial.

Seu ciclo de vida acompanha o ciclo do objeto ao qual pertence.

---

## Igualdade por Valor

Os Value Objects são comparados exclusivamente pelos valores que contêm.

Se dois objetos possuem exatamente os mesmos valores, representam o mesmo conceito do domínio.

Sua localização, instância ou forma de armazenamento não altera seu significado.  [oai_citation:3‡martinfowler.com](https://martinfowler.com/bliki/ValueObject.html?utm_source=chatgpt.com)

---

## Princípios dos Value Objects

Os Objetos de Valor do TEAR seguem os seguintes princípios:

- Não possuem identidade própria.
- São definidos exclusivamente por seus valores.
- São imutáveis.
- Existem apenas como parte de Entidades ou Agregados.
- Representam conceitos coesos da Linguagem Ubíqua.
- Devem encapsular regras e validações relacionadas ao conceito que representam.
- Seu uso reduz ambiguidades, fortalece o modelo de domínio e evita a proliferação de tipos primitivos, tornando a linguagem do sistema mais expressiva e aderente ao negócio.  [oai_citation:4‡martinfowler.com](https://martinfowler.com/bliki/ValueObject.html?utm_source=chatgpt.com)

# PASSO 6 — RELACIONAMENTOS
## ENTREGA A — CURADORIA

### Objetivo

Definir como as Entidades, Agregados e Objetos de Valor do domínio do TEAR se relacionam, estabelecendo associações claras, responsabilidades bem delimitadas e dependências compatíveis com o modelo de domínio.

Esta seção descreve exclusivamente os relacionamentos do negócio.

Não define implementação, banco de dados, APIs ou mecanismos de persistência.

---

# Escopo desta seção

A seção "Relacionamentos" deverá responder apenas às seguintes perguntas:

- Como as entidades do domínio se relacionam?
- Quais relacionamentos são permanentes?
- Quais relacionamentos são temporais?
- Quais agregados podem referenciar outros agregados?
- Quais dependências são proibidas?

A cardinalidade detalhada poderá ser refinada posteriormente, caso necessário.

---

# Conteúdo aprovado para preservação

## Marca → Parceira

**Preservar.**

Uma Marca mantém relacionamento com diversas Parceiras ao longo do tempo.

Esse relacionamento representa o vínculo comercial existente dentro do programa de marketing de influência.

---

## Marca → Competência

**Preservar.**

Uma Marca organiza diversas Competências.

Cada Competência pertence a uma única Marca.

---

## Competência → Colaboração Mensal

**Preservar integralmente.**

Cada Competência organiza diversas Colaborações Mensais.

Toda Colaboração Mensal pertence obrigatoriamente a uma única Competência.

---

## Parceira → Colaboração Mensal

**Preservar integralmente.**

Uma Parceira pode participar de diversas Colaborações Mensais ao longo de sua permanência no programa.

Cada Colaboração Mensal está associada exatamente a uma Parceira.

---

## Colaboração Mensal → Pagamento

**Preservar.**

Uma Colaboração Mensal origina um ou mais Pagamentos, conforme as regras comerciais aplicáveis.

O Pagamento não existe independentemente da colaboração que lhe deu origem.

---

## Colaboração Mensal → Snapshot Comercial

**Preservar.**

Cada Colaboração Mensal contém exatamente um Snapshot Comercial, responsável por preservar o contexto comercial utilizado durante sua criação.

---

# Conteúdo adaptado

## Planejamento

Planejamento deixa de representar um relacionamento entre entidades.

Passa a ser um componente interno da Colaboração Mensal.

---

## Produção

Produção não estabelece relacionamento próprio.

Representa apenas uma etapa pertencente à Colaboração Mensal.

---

## Logística

Logística deixa de conectar entidades distintas.

Passa a representar um conjunto de atividades internas da Colaboração Mensal.

---

# Conteúdo removido

Não representam relacionamentos do domínio:

- integrações entre sistemas;
- chamadas de APIs;
- referências entre tabelas;
- chaves estrangeiras;
- dependências de infraestrutura;
- autenticação;
- armazenamento;
- comunicação entre serviços.

Esses elementos pertencem exclusivamente à arquitetura da solução.

---

# Ajustes editoriais

## Relacionamentos representam regras de negócio

Todo relacionamento deve existir porque possui significado para o domínio.

Nenhuma associação deve ser criada apenas para facilitar implementação.

---

## Referências entre agregados

Relacionamentos entre agregados devem ocorrer exclusivamente por meio de suas Entidades Raiz.

Objetos internos nunca devem ser acessados diretamente por outros agregados.  [oai_citation:0‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

## Baixo acoplamento

Os relacionamentos devem preservar a independência entre os agregados.

Cada agregado mantém autonomia sobre seus próprios objetos e regras de consistência.  [oai_citation:1‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

## Clareza semântica

Todo relacionamento deve expressar claramente seu significado dentro da Linguagem Ubíqua.

Relações implícitas ou ambíguas devem ser evitadas.

---

# Estrutura prevista para a documentação final

A seção "Relacionamentos" do DOMAIN.md deverá conter apenas:

1. Objetivo dos Relacionamentos
2. Relacionamentos entre Entidades
3. Relacionamentos entre Agregados
4. Dependências Permitidas
5. Dependências Proibidas
6. Limites dos Relacionamentos
7. Princípios dos Relacionamentos

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Marca → Parceira | Preservar |
| Marca → Competência | Preservar |
| Competência → Colaboração Mensal | Preservar |
| Parceira → Colaboração Mensal | Preservar |
| Colaboração Mensal → Pagamento | Preservar |
| Colaboração Mensal → Snapshot Comercial | Preservar |
| Planejamento | Incorporar à Colaboração Mensal |
| Produção | Incorporar à Colaboração Mensal |
| Logística | Incorporar à Colaboração Mensal |
| Relacionamentos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os relacionamentos relevantes do domínio estiverem claramente definidos, respeitando os limites dos agregados, preservando baixo acoplamento e representando exclusivamente vínculos de negócio, independentes de qualquer decisão tecnológica ou de persistência.  [oai_citation:2‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

# 6. RELACIONAMENTOS

## Objetivo dos Relacionamentos

Os relacionamentos do domínio do TEAR descrevem como as Entidades, Agregados e Objetos de Valor interagem para representar o funcionamento do programa de marketing de influência.

Esses relacionamentos expressam exclusivamente vínculos de negócio.

Eles não representam estruturas de armazenamento, integrações técnicas ou dependências de implementação.

Cada relacionamento existe porque possui significado para o domínio e contribui para a integridade do modelo.  [oai_citation:0‡martinfowler.com](https://martinfowler.com/bliki/DomainDrivenDesign.html?utm_source=chatgpt.com)

---

## Relacionamentos entre Entidades

### Marca → Competência

Uma Marca organiza diversas Competências ao longo de sua existência.

Cada Competência pertence a uma única Marca e representa um ciclo operacional específico do programa.

---

### Marca → Parceira

Uma Marca mantém relacionamento comercial com diversas Parceiras.

Esse relacionamento representa a participação contínua das Parceiras no programa de marketing de influência.

---

### Competência → Colaboração Mensal

Cada Competência organiza diversas Colaborações Mensais.

Toda Colaboração Mensal pertence obrigatoriamente a uma única Competência.

A Competência estabelece o contexto temporal no qual a colaboração acontece.

---

### Parceira → Colaboração Mensal

Uma Parceira pode participar de diversas Colaborações Mensais ao longo do tempo.

Cada Colaboração Mensal está associada exatamente a uma Parceira.

Esse relacionamento preserva toda a evolução histórica da participação da Parceira no programa.

---

### Colaboração Mensal → Pagamento

Uma Colaboração Mensal origina um ou mais Pagamentos, conforme as condições comerciais estabelecidas.

Todo Pagamento pertence exclusivamente à Colaboração Mensal que lhe deu origem.

Não existe Pagamento desvinculado de uma colaboração.

---

### Colaboração Mensal → Snapshot Comercial

Cada Colaboração Mensal possui exatamente um Snapshot Comercial.

Esse Snapshot preserva de forma permanente as condições comerciais vigentes no momento da criação da colaboração.

Após sua criação, permanece inalterado durante todo o ciclo de vida da colaboração.

---

## Relacionamentos entre Agregados

Os Agregados do TEAR relacionam-se exclusivamente por meio de suas respectivas Entidades Raiz.

Assim:

- a Colaboração Mensal referencia uma Marca;
- a Colaboração Mensal referencia uma Parceira;
- a Colaboração Mensal referencia uma Competência.

Nenhum agregado acessa diretamente objetos internos pertencentes a outro agregado.

Essa separação preserva os limites de consistência do domínio.  [oai_citation:1‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

## Dependências Permitidas

São consideradas dependências legítimas do domínio:

- uma Competência organiza Colaborações Mensais;
- uma Parceira participa de Colaborações Mensais;
- uma Marca mantém relacionamento com Parceiras;
- uma Colaboração Mensal referencia uma Marca;
- uma Colaboração Mensal referencia uma Parceira;
- uma Colaboração Mensal referencia uma Competência;
- um Pagamento pertence a uma Colaboração Mensal;
- um Snapshot Comercial pertence a uma Colaboração Mensal.

Essas dependências representam relações permanentes do negócio.

---

## Dependências Proibidas

Não fazem parte do modelo de domínio:

- dependências entre bancos de dados;
- chaves estrangeiras;
- APIs;
- integrações entre sistemas;
- chamadas de serviços;
- dependências entre módulos técnicos;
- autenticação;
- infraestrutura;
- interfaces de usuário;
- mecanismos de persistência.

Esses relacionamentos pertencem exclusivamente à arquitetura da solução.

---

## Limites dos Relacionamentos

Todo relacionamento do domínio deve respeitar os limites definidos pelos Agregados.

Isso significa que:

- nenhum agregado modifica diretamente o estado interno de outro agregado;
- toda interação ocorre por intermédio da Entidade Raiz correspondente;
- objetos internos permanecem encapsulados dentro de seu próprio agregado.

Essa abordagem reduz acoplamento e garante que cada agregado permaneça responsável apenas por sua própria consistência.  [oai_citation:2‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

---

## Princípios dos Relacionamentos

Os relacionamentos do TEAR seguem os seguintes princípios:

- Todo relacionamento deve possuir significado para o negócio.
- Relacionamentos existem para representar regras do domínio, e não decisões de implementação.
- Agregados comunicam-se apenas por meio de suas Entidades Raiz.
- Objetos internos não podem ser acessados diretamente por outros agregados.
- Os limites de consistência definidos pelos agregados devem ser preservados.
- Relacionamentos devem manter baixo acoplamento entre os diferentes elementos do domínio.
- O modelo de relacionamentos deve permanecer válido independentemente da tecnologia utilizada para implementar o sistema.
- A clareza e a consistência dos relacionamentos são essenciais para preservar a integridade do modelo de domínio ao longo da evolução do TEAR.  [oai_citation:3‡martinfowler.com](https://martinfowler.com/bliki/DDD_Aggregate.html?utm_source=chatgpt.com)

# PASSO 7 — FLUXOS DE NEGÓCIO
## ENTREGA A — CURADORIA

### Objetivo

Definir os Fluxos de Negócio do domínio do TEAR, descrevendo como os processos de negócio evoluem ao longo do tempo e quais transformações relevantes ocorrem durante o ciclo de vida de uma Colaboração Mensal.

Os fluxos representam a sequência lógica de atividades do domínio, independentemente da forma como são implementados pelo sistema.

Seu objetivo é modelar o comportamento do negócio, preservando a Linguagem Ubíqua e a consistência do domínio.  [oai_citation:0‡Microsoft Learn](https://learn.microsoft.com/pt-br/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Fluxos de Negócio" deverá responder apenas às seguintes perguntas:

- Quais fluxos existem no domínio?
- Como cada fluxo se inicia?
- Como evolui?
- Como termina?
- Quais entidades participam de cada fluxo?
- Quais estados de negócio são percorridos?

Esta seção não descreve interfaces, telas, APIs, automações ou infraestrutura.

---

# Conteúdo aprovado para preservação

## Onboarding

**Preservar.**

Representa o fluxo de ingresso de uma nova Parceira no programa.

Seu objetivo é preparar a Parceira para participar de futuras Colaborações Mensais.

Encerra-se quando a Parceira está apta a integrar o programa.

---

## Planejamento da Competência

**Preservar.**

Representa o fluxo de preparação de uma nova Competência.

Durante esse fluxo são organizadas as futuras Colaborações Mensais pertencentes ao período operacional.

---

## Colaboração Mensal

**Preservar integralmente.**

Representa o principal fluxo do domínio.

Toda operação relevante ocorre dentro desse fluxo.

Seu ciclo compreende desde sua criação até seu encerramento e preservação histórica.

---

## Pagamento

**Preservar.**

Representa o fluxo financeiro decorrente de uma Colaboração Mensal.

Inicia-se após a conclusão das condições comerciais necessárias e encerra-se quando a obrigação financeira é concluída.

---

## Encerramento da Competência

**Preservar.**

Representa o fechamento formal do ciclo operacional de uma Competência.

Após seu encerramento, seu histórico permanece preservado.

---

# Conteúdo adaptado

## Produção

Produção deixa de ser considerada um fluxo independente.

Passa a representar uma etapa interna do fluxo da Colaboração Mensal.

---

## Logística

Logística também deixa de constituir um fluxo próprio.

Passa a integrar a evolução operacional da Colaboração Mensal.

---

## Aprovações

As aprovações deixam de representar fluxos isolados.

Passam a ser transições internas pertencentes ao fluxo da Colaboração Mensal.

---

# Conteúdo removido

Não representam Fluxos de Negócio:

- login;
- autenticação;
- upload de arquivos;
- sincronizações;
- chamadas de APIs;
- integrações;
- persistência;
- processamento técnico;
- comunicação entre serviços.

Esses processos pertencem exclusivamente à solução tecnológica.

---

# Ajustes editoriais

## Fluxos representam comportamento

Fluxos descrevem como o domínio evolui ao longo do tempo.

Não representam telas, funcionalidades ou casos de uso da aplicação.

---

## Fluxos descrevem o negócio

Cada fluxo deve ser compreensível por especialistas do domínio sem necessidade de conhecimento técnico.

Sua descrição deve utilizar exclusivamente a Linguagem Ubíqua do TEAR.

---

## Estados pertencem ao domínio

Cada fluxo percorre estados de negócio claramente definidos.

Esses estados representam mudanças reais ocorridas na operação e não mudanças técnicas do sistema.  [oai_citation:1‡Microsoft Learn](https://learn.microsoft.com/pt-br/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation?utm_source=chatgpt.com)

---

## Fluxos independem da implementação

O comportamento descrito nesta seção deve permanecer válido mesmo que toda a solução seja reescrita utilizando outra arquitetura ou tecnologia.

---

# Estrutura prevista para a documentação final

A seção "Fluxos de Negócio" do DOMAIN.md deverá conter apenas:

1. Conceito de Fluxo de Negócio
2. Fluxos do Domínio
3. Etapas dos Fluxos
4. Estados de Negócio
5. Participação das Entidades
6. Início e Encerramento dos Fluxos
7. Princípios dos Fluxos

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Onboarding | Preservar |
| Planejamento da Competência | Preservar |
| Colaboração Mensal | Preservar |
| Pagamento | Preservar |
| Encerramento da Competência | Preservar |
| Produção | Incorporar à Colaboração Mensal |
| Logística | Incorporar à Colaboração Mensal |
| Aprovações | Incorporar à Colaboração Mensal |
| Fluxos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os processos relevantes do domínio estiverem organizados como Fluxos de Negócio claramente definidos, descrevendo exclusivamente a evolução operacional do programa de marketing de influência, sem dependência de tecnologia, interface ou implementação, e preservando a integridade da Linguagem Ubíqua do TEAR.  [oai_citation:2‡Wikipedia](https://en.wikipedia.org/wiki/Event_storming?utm_source=chatgpt.com)

# 7. FLUXOS DE NEGÓCIO

## Conceito de Fluxo de Negócio

No domínio do TEAR, um Fluxo de Negócio representa a evolução de um processo operacional ao longo do tempo.

Cada fluxo descreve uma sequência de atividades que transforma um estado inicial em um estado final, sempre refletindo acontecimentos relevantes para o negócio.

Os Fluxos de Negócio representam comportamentos do domínio e não funcionalidades da aplicação, interfaces ou processos técnicos. Sua modelagem permite compreender como o programa de marketing de influência opera independentemente da tecnologia utilizada.  [oai_citation:0‡Wikipedia](https://en.wikipedia.org/wiki/Event_storming?utm_source=chatgpt.com)

---

## Fluxos do Domínio

O domínio do TEAR é composto pelos seguintes Fluxos de Negócio:

- Onboarding da Parceira
- Planejamento da Competência
- Colaboração Mensal
- Pagamento
- Encerramento da Competência

Esses fluxos representam toda a evolução operacional do programa de marketing de influência.

---

## Onboarding da Parceira

O fluxo de Onboarding inicia quando uma nova Parceira ingressa no programa.

Durante esse processo são registradas as informações necessárias para sua participação e estabelecida sua relação com a Marca.

O fluxo é concluído quando a Parceira está apta a participar de futuras Colaborações Mensais.

Após seu encerramento, a Parceira passa a integrar permanentemente o domínio.

---

## Planejamento da Competência

O Planejamento da Competência representa a preparação de um novo ciclo operacional.

Nesse fluxo são definidas as Colaborações Mensais que farão parte da Competência, respeitando as regras comerciais e operacionais do programa.

Seu encerramento marca o início da execução das colaborações previstas para aquele período.

---

## Colaboração Mensal

A Colaboração Mensal representa o principal Fluxo de Negócio do TEAR.

Ela organiza toda a relação operacional entre uma Marca e uma Parceira durante uma Competência específica.

Ao longo desse fluxo, a colaboração percorre diferentes estados de negócio, como:

- criação da colaboração;
- definição do Snapshot Comercial;
- planejamento das entregas;
- execução da produção;
- acompanhamento logístico;
- conclusão das entregas;
- preparação para pagamento;
- encerramento da colaboração.

Essas etapas representam a evolução natural da colaboração e não fluxos independentes.

---

## Pagamento

O fluxo de Pagamento inicia quando uma Colaboração Mensal atende às condições estabelecidas para remuneração.

Seu objetivo é registrar e concluir a obrigação financeira decorrente da colaboração.

O fluxo encerra-se quando o pagamento é considerado concluído, preservando permanentemente seu histórico.

---

## Encerramento da Competência

O Encerramento da Competência representa a conclusão formal de um ciclo operacional.

Após esse fluxo:

- nenhuma nova Colaboração Mensal passa a integrar aquela Competência;
- seu histórico permanece preservado;
- inicia-se a preparação para uma nova Competência.

Esse encerramento garante a separação entre diferentes ciclos operacionais do programa.

---

## Estados de Negócio

Cada Fluxo de Negócio percorre estados que representam mudanças reais na operação.

Esses estados descrevem fatos relevantes para o domínio e não alterações técnicas do sistema.

Exemplos incluem:

- Parceira integrada ao programa;
- Competência planejada;
- Colaboração iniciada;
- Colaboração concluída;
- Pagamento concluído;
- Competência encerrada.

Estados de negócio representam fatos permanentes que podem ser utilizados para compreender a evolução da operação e originar eventos significativos do domínio.  [oai_citation:1‡Qlerify](https://www.qlerify.com/dddconcepts/domain-event?utm_source=chatgpt.com)

---

## Participação das Entidades

Os Fluxos de Negócio são executados pelas entidades do domínio.

Cada entidade participa conforme sua responsabilidade:

- a Marca organiza o programa;
- a Parceira participa das colaborações;
- a Competência organiza o ciclo operacional;
- a Colaboração Mensal coordena toda a operação da colaboração;
- o Pagamento registra a obrigação financeira correspondente.

Nenhuma entidade executa responsabilidades pertencentes a outra.

---

## Início e Encerramento dos Fluxos

Todo Fluxo de Negócio possui um início claramente definido, uma evolução coerente e um encerramento explícito.

Um fluxo encerrado passa a integrar o histórico do domínio, preservando todas as informações necessárias para rastreabilidade e auditoria.

O encerramento de um fluxo nunca implica a perda de seu contexto histórico.

---

## Princípios dos Fluxos

Os Fluxos de Negócio do TEAR seguem os seguintes princípios:

- Todo fluxo representa um comportamento do negócio.
- Todo fluxo possui início, evolução e encerramento claramente definidos.
- Fluxos descrevem processos do domínio, e não funcionalidades do sistema.
- Os estados percorridos representam fatos relevantes para o negócio.
- A Colaboração Mensal constitui o principal Fluxo de Negócio do domínio.
- Produção, Logística e Planejamento são etapas da Colaboração Mensal, e não fluxos independentes.
- Todo fluxo deve preservar seu histórico após o encerramento.
- A descrição dos fluxos deve permanecer válida independentemente da arquitetura ou tecnologia utilizada para implementar o TEAR.  [oai_citation:2‡Wikipedia](https://en.wikipedia.org/wiki/Event_storming?utm_source=chatgpt.com)

# PASSO 8 — REGRAS DE NEGÓCIO
## ENTREGA A — CURADORIA

### Objetivo

Identificar e consolidar todas as Regras de Negócio do domínio do TEAR, estabelecendo as condições que devem ser permanentemente respeitadas para garantir a integridade das operações do programa de marketing de influência.

As Regras de Negócio representam decisões próprias do domínio e independem de tecnologia, interface ou implementação.

No contexto do *Domain-Driven Design (DDD)*, essas regras correspondem às invariantes do domínio (*domain invariants*), isto é, condições que devem permanecer verdadeiras durante todo o ciclo de vida das entidades e agregados.  [oai_citation:0‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Regras de Negócio" deverá responder apenas às seguintes perguntas:

- Quais regras o domínio deve sempre respeitar?
- Quais condições impedem uma operação?
- Quais regras garantem a consistência do domínio?
- Quais entidades são responsáveis por manter essas regras?
- Quais regras pertencem exclusivamente ao negócio?

Esta seção não descreve validações técnicas, banco de dados, APIs ou implementação.

---

# Conteúdo aprovado para preservação

## Uma Colaboração Mensal pertence a exatamente uma Competência

**Preservar integralmente.**

Não pode existir Colaboração Mensal sem Competência.

Uma colaboração nunca pode pertencer simultaneamente a duas Competências.

---

## Uma Colaboração Mensal pertence a exatamente uma Parceira

**Preservar integralmente.**

Cada colaboração representa a relação operacional de uma única Parceira durante uma Competência.

---

## Snapshot Comercial é imutável

**Preservar integralmente.**

Após sua criação, o Snapshot Comercial não pode ser alterado.

Mudanças futuras nas condições comerciais não modificam colaborações já existentes.

---

## Pagamento depende da Colaboração Mensal

**Preservar.**

Todo Pagamento deve estar obrigatoriamente associado a uma Colaboração Mensal.

Não existe Pagamento independente.

---

## Histórico é permanente

**Preservar.**

Informações históricas não podem ser removidas por fazerem parte da memória operacional do domínio.

---

# Conteúdo adaptado

## Planejamento

Planejamento deixa de possuir regras próprias.

Suas regras passam a integrar a Colaboração Mensal.

---

## Produção

As regras relacionadas à Produção passam a representar estados internos da Colaboração Mensal.

---

## Logística

As regras da Logística deixam de ser independentes.

Passam a existir apenas dentro da evolução operacional da Colaboração Mensal.

---

## Aprovações

Aprovações deixam de representar um conjunto autônomo de regras.

Passam a ser transições válidas dentro do fluxo da colaboração.

---

# Conteúdo removido

Não representam Regras de Negócio:

- validação de formulários;
- autenticação;
- autorização técnica;
- permissões de usuário;
- regras de banco de dados;
- validações de API;
- restrições de infraestrutura;
- regras de interface;
- mecanismos de persistência.

Esses elementos pertencem à arquitetura da solução.

---

# Ajustes editoriais

## Regras representam conhecimento do domínio

Toda Regra de Negócio deve expressar uma política, restrição ou obrigação existente na operação do programa.

Ela existe porque o negócio assim determina, e não por conveniência técnica.  [oai_citation:1‡InfoQ](https://www.infoq.com/articles/ddd-business-rules/?utm_source=chatgpt.com)

---

## Invariantes do domínio

As Regras de Negócio representam invariantes do domínio.

Sempre que uma operação for concluída, todas essas regras devem permanecer verdadeiras.

Uma entidade ou agregado nunca deve existir em estado inválido.  [oai_citation:2‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

---

## Responsabilidade das Entidades

Cada regra pertence à Entidade ou Aggregate Root responsável pelo conceito envolvido.

Nenhuma regra deve depender de infraestrutura para ser considerada válida.

---

## Independência tecnológica

As Regras de Negócio devem permanecer verdadeiras independentemente da linguagem de programação, banco de dados, arquitetura ou plataforma utilizada para implementar o TEAR.

---

# Estrutura prevista para a documentação final

A seção "Regras de Negócio" do DOMAIN.md deverá conter apenas:

1. Conceito de Regra de Negócio
2. Regras Fundamentais do Domínio
3. Invariantes das Entidades
4. Invariantes dos Agregados
5. Responsabilidade pelas Regras
6. Violações das Regras
7. Princípios das Regras de Negócio

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Colaboração pertence a uma Competência | Preservar |
| Colaboração pertence a uma Parceira | Preservar |
| Snapshot Comercial imutável | Preservar |
| Pagamento depende da Colaboração | Preservar |
| Histórico permanente | Preservar |
| Planejamento | Incorporar à Colaboração Mensal |
| Produção | Incorporar à Colaboração Mensal |
| Logística | Incorporar à Colaboração Mensal |
| Aprovações | Incorporar à Colaboração Mensal |
| Regras técnicas | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todas as regras essenciais do domínio estiverem identificadas como invariantes do negócio, claramente separadas de validações técnicas e atribuídas às entidades ou agregados responsáveis por garantir sua consistência, preservando a integridade do modelo de domínio do TEAR.  [oai_citation:3‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

# 8. REGRAS DE NEGÓCIO

## Conceito de Regra de Negócio

No domínio do TEAR, uma Regra de Negócio representa uma condição que deve permanecer verdadeira para garantir a integridade do programa de marketing de influência.

Essas regras definem os limites do comportamento esperado das Entidades e Agregados e expressam políticas próprias do negócio, independentemente da forma como o sistema é implementado.

No contexto do *Domain-Driven Design (DDD)*, essas regras correspondem às invariantes do domínio, cuja responsabilidade de preservação pertence principalmente às Entidades Raiz dos Agregados.  [oai_citation:0‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

---

## Regras Fundamentais do Domínio

O domínio do TEAR é governado pelas seguintes regras fundamentais:

- Toda Colaboração Mensal pertence exatamente a uma Competência.
- Toda Colaboração Mensal pertence exatamente a uma Parceira.
- Toda Colaboração Mensal possui exatamente um Snapshot Comercial.
- O Snapshot Comercial torna-se imutável após sua criação.
- Todo Pagamento pertence a uma Colaboração Mensal.
- Toda Competência organiza exclusivamente as Colaborações pertencentes ao seu período operacional.
- O histórico operacional deve ser preservado permanentemente.

Essas regras definem a estrutura mínima necessária para que o domínio permaneça consistente.

---

## Invariantes das Entidades

Cada Entidade possui regras que devem permanecer verdadeiras durante todo o seu ciclo de vida.

### Marca

- Organiza Competências.
- Mantém relacionamento comercial com Parceiras.
- Preserva suas definições institucionais e comerciais.

---

### Parceira

- Possui identidade permanente.
- Pode participar de diversas Colaborações Mensais.
- Seu histórico permanece preservado mesmo após o encerramento de colaborações.

---

### Competência

- Representa um único ciclo operacional.
- Organiza Colaborações Mensais pertencentes ao mesmo período.
- Não pode existir sem uma Marca responsável.

---

### Colaboração Mensal

A Colaboração Mensal concentra as principais regras do domínio.

Ela deve:

- pertencer exatamente a uma Competência;
- pertencer exatamente a uma Parceira;
- preservar um único Snapshot Comercial;
- coordenar seu Planejamento, Produção, Logística e Pagamentos;
- manter coerência entre todas as etapas de seu ciclo de vida.

---

### Pagamento

- Sempre pertence a uma Colaboração Mensal.
- Nunca existe de forma independente.
- Deve preservar permanentemente seu histórico financeiro.

---

## Invariantes dos Agregados

Cada Agregado é responsável por garantir a consistência de seus próprios objetos.

No domínio do TEAR:

- apenas a Entidade Raiz pode modificar o estado do agregado;
- objetos internos não podem ser alterados diretamente por elementos externos;
- nenhuma operação pode deixar o agregado em estado inconsistente.

Essas invariantes garantem que todas as mudanças preservem a integridade do modelo de negócio.  [oai_citation:1‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

---

## Responsabilidade pelas Regras

Cada Regra de Negócio possui um responsável claramente definido.

- A Marca preserva suas políticas comerciais.
- A Parceira preserva sua identidade e histórico.
- A Competência preserva a organização do ciclo operacional.
- A Colaboração Mensal preserva toda a consistência operacional da colaboração.
- O Pagamento preserva a consistência da obrigação financeira.

Nenhuma entidade deve assumir responsabilidades pertencentes a outra.

---

## Violações das Regras

Sempre que uma Regra de Negócio for violada, a operação correspondente deve ser considerada inválida.

Exemplos de violações incluem:

- criar uma Colaboração Mensal sem Competência;
- associar uma Colaboração Mensal a mais de uma Parceira;
- alterar um Snapshot Comercial já consolidado;
- registrar um Pagamento sem Colaboração Mensal correspondente;
- remover informações pertencentes ao histórico operacional.

Essas situações representam estados incompatíveis com o domínio e não devem ser permitidas.  [oai_citation:2‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

---

## Princípios das Regras de Negócio

As Regras de Negócio do TEAR seguem os seguintes princípios:

- Toda regra representa uma necessidade do negócio.
- Toda regra deve permanecer válida durante todo o ciclo de vida das Entidades e Agregados.
- As invariantes do domínio são responsabilidade dos respectivos Agregados.
- Nenhuma operação pode produzir um estado inconsistente.
- Regras de negócio são independentes de tecnologia, arquitetura ou persistência.
- Validações técnicas não substituem regras do domínio.
- O histórico operacional nunca pode ser comprometido por alterações posteriores.
- A preservação das Regras de Negócio garante a consistência, a rastreabilidade e a evolução segura do modelo de domínio do TEAR.  [oai_citation:3‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

# PASSO 9 — ESTADOS E CICLO DE VIDA
## ENTREGA A — CURADORIA

### Objetivo

Definir os Estados e Ciclos de Vida das principais Entidades e Agregados do domínio do TEAR, estabelecendo como cada conceito evolui ao longo do tempo e quais transições são consideradas válidas pelo negócio.

Esta seção descreve exclusivamente a evolução natural dos elementos do domínio.

Não define implementação, banco de dados, enums, máquinas de estado ou qualquer mecanismo técnico utilizado para controlar essas transições.

No contexto do *Domain-Driven Design (DDD)*, os estados representam mudanças relevantes do negócio e devem sempre respeitar as invariantes definidas pelos Agregados.  [oai_citation:0‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Estados e Ciclo de Vida" deverá responder apenas às seguintes perguntas:

- Quais entidades possuem ciclo de vida?
- Quais estados cada entidade pode assumir?
- Como ocorrem as transições entre estados?
- Quais estados são permanentes?
- Quais transições são proibidas?
- Como o histórico desses estados deve ser preservado?

Esta seção não descreve eventos, automações ou implementação.

---

# Conteúdo aprovado para preservação

## Ciclo de Vida da Parceira

**Preservar.**

A Parceira percorre um ciclo iniciado pelo Onboarding.

Após ingressar no programa, pode participar de diversas Colaborações Mensais ao longo do tempo.

Seu histórico permanece preservado independentemente de sua situação operacional.

---

## Ciclo de Vida da Competência

**Preservar.**

A Competência possui início, período operacional e encerramento claramente definidos.

Após encerrada, permanece disponível apenas para consulta histórica.

---

## Ciclo de Vida da Colaboração Mensal

**Preservar integralmente.**

A Colaboração Mensal representa o principal ciclo de vida do domínio.

Sua evolução acompanha todo o relacionamento operacional entre Marca e Parceira durante uma Competência.

Todo comportamento relevante ocorre dentro desse ciclo.

---

## Ciclo de Vida do Pagamento

**Preservar.**

O Pagamento nasce a partir de uma Colaboração Mensal e evolui até a conclusão da obrigação financeira.

Seu histórico nunca é descartado.

---

# Conteúdo adaptado

## Planejamento

Planejamento deixa de possuir ciclo próprio.

Passa a representar uma etapa da evolução da Colaboração Mensal.

---

## Produção

Produção deixa de possuir estados independentes.

Representa uma fase operacional pertencente ao ciclo da Colaboração Mensal.

---

## Logística

Logística deixa de possuir ciclo de vida próprio.

Passa a integrar a evolução operacional da Colaboração Mensal.

---

## Aprovações

As aprovações deixam de representar estados autônomos.

Passam a constituir transições internas válidas da Colaboração Mensal.

---

# Conteúdo removido

Não representam Estados ou Ciclos de Vida do domínio:

- status de banco de dados;
- status de processamento;
- filas;
- autenticação;
- sessões;
- upload de arquivos;
- sincronizações;
- integrações;
- estados técnicos da aplicação;
- estados da infraestrutura.

Esses elementos pertencem exclusivamente à implementação.

---

# Ajustes editoriais

## Estados representam fatos do negócio

Um estado deve representar uma condição relevante para o domínio.

Mudanças de estado refletem acontecimentos do negócio e não alterações técnicas do sistema.  [oai_citation:1‡Protean](https://docs.proteanhq.com/guides/domain-behavior/status-transitions/?utm_source=chatgpt.com)

---

## Ciclo de Vida representa evolução

O Ciclo de Vida descreve a sequência lógica de estados percorridos por uma Entidade ou Agregado desde sua criação até seu encerramento.

Essa evolução deve permanecer compreensível independentemente da tecnologia utilizada.

---

## Transições válidas

Nem toda mudança de estado é permitida.

Cada transição deve respeitar as Regras de Negócio e preservar as invariantes do Agregado responsável.  [oai_citation:2‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

---

## Preservação histórica

O encerramento do ciclo de vida nunca implica a perda de seu histórico.

Os estados percorridos constituem parte permanente da memória operacional do domínio.

---

# Estrutura prevista para a documentação final

A seção "Estados e Ciclo de Vida" do DOMAIN.md deverá conter apenas:

1. Conceito de Estado
2. Conceito de Ciclo de Vida
3. Ciclo de Vida das Entidades
4. Estados Principais do Domínio
5. Transições Permitidas
6. Transições Proibidas
7. Princípios dos Estados e Ciclo de Vida

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Ciclo de Vida da Parceira | Preservar |
| Ciclo de Vida da Competência | Preservar |
| Ciclo de Vida da Colaboração Mensal | Preservar |
| Ciclo de Vida do Pagamento | Preservar |
| Planejamento | Incorporar à Colaboração Mensal |
| Produção | Incorporar à Colaboração Mensal |
| Logística | Incorporar à Colaboração Mensal |
| Aprovações | Incorporar à Colaboração Mensal |
| Estados técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todas as Entidades e Agregados relevantes possuírem ciclos de vida claramente definidos, seus estados representarem exclusivamente fatos do negócio, todas as transições preservarem as invariantes do domínio e nenhum estado depender de tecnologia, persistência ou implementação para existir.  [oai_citation:3‡Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations?utm_source=chatgpt.com)

# 9. ESTADOS E CICLO DE VIDA

## Conceito de Estado

No domínio do TEAR, um Estado representa a situação atual de uma Entidade ou Agregado em determinado momento de seu ciclo de vida.

Cada estado descreve uma condição relevante para o negócio e indica quais operações são compatíveis com aquele momento da evolução do domínio.

Estados existem para representar fatos do negócio e nunca detalhes técnicos de implementação. As transições entre estados devem respeitar as regras de negócio e as invariantes do agregado responsável.  [oai_citation:0‡Protean](https://docs.proteanhq.com/guides/domain-behavior/status-transitions/?utm_source=chatgpt.com)

---

## Conceito de Ciclo de Vida

O Ciclo de Vida representa a evolução completa de uma Entidade ou Agregado desde sua criação até seu encerramento.

Durante essa evolução, diferentes estados são percorridos conforme acontecimentos relevantes do domínio.

Cada entidade possui seu próprio ciclo de vida, preservando sua identidade durante todas as mudanças de estado.

O encerramento de um ciclo não elimina sua existência histórica dentro do domínio.  [oai_citation:1‡Qlerify](https://www.qlerify.com/dddconcepts/entity?utm_source=chatgpt.com)

---

## Ciclo de Vida das Entidades

### Parceira

O ciclo de vida da Parceira inicia com seu Onboarding.

Após ingressar no programa, a Parceira passa a integrar permanentemente o domínio e pode participar de diversas Colaborações Mensais ao longo de diferentes Competências.

Mesmo quando deixa de participar do programa, seu histórico permanece preservado.

---

### Competência

A Competência representa um ciclo operacional delimitado no tempo.

Seu ciclo inicia com seu planejamento, evolui durante a execução das Colaborações Mensais pertencentes ao período e encerra-se formalmente ao término da operação.

Após o encerramento, permanece disponível apenas como registro histórico.

---

### Colaboração Mensal

A Colaboração Mensal possui o principal ciclo de vida do domínio.

Seu ciclo compreende toda a evolução da colaboração entre uma Marca e uma Parceira durante uma Competência específica.

Ao longo desse percurso, a colaboração evolui por estados compatíveis com sua operação, incluindo:

- criação;
- planejamento;
- produção;
- logística;
- conclusão das entregas;
- preparação do pagamento;
- encerramento.

Esses estados representam a evolução natural da colaboração e preservam permanentemente seu histórico.

---

### Pagamento

O ciclo de vida do Pagamento inicia quando nasce uma obrigação financeira decorrente de uma Colaboração Mensal.

Seu estado evolui até a conclusão da obrigação financeira.

Após concluído, permanece registrado como parte permanente do histórico da colaboração.

---

## Estados Principais do Domínio

Os principais estados percorridos pelas entidades do domínio incluem:

### Parceira

- Em Onboarding;
- Integrada ao Programa;
- Histórico Preservado.

---

### Competência

- Planejada;
- Em Execução;
- Encerrada.

---

### Colaboração Mensal

- Criada;
- Planejada;
- Em Produção;
- Em Logística;
- Concluída;
- Encerrada.

---

### Pagamento

- Pendente;
- Em Processamento;
- Concluído.

Esses estados representam situações relevantes para o negócio e podem evoluir ao longo do tempo sem alterar a identidade da entidade.  [oai_citation:2‡Qlerify](https://www.qlerify.com/dddconcepts/entity?utm_source=chatgpt.com)

---

## Transições Permitidas

Toda transição de estado deve respeitar a sequência lógica definida pelo domínio.

Em termos gerais:

- uma Parceira deve concluir o Onboarding antes de participar de Colaborações Mensais;
- uma Competência deve ser planejada antes de entrar em execução;
- uma Colaboração Mensal deve ser criada antes de iniciar suas etapas operacionais;
- um Pagamento somente pode ser concluído após existir uma obrigação financeira válida.

Cada transição deve preservar a consistência do agregado responsável.

---

## Transições Proibidas

São incompatíveis com o domínio situações como:

- iniciar uma Colaboração Mensal antes de sua criação;
- associar uma Colaboração Mensal a uma Competência encerrada;
- concluir um Pagamento inexistente;
- alterar o Snapshot Comercial após sua consolidação;
- eliminar estados pertencentes ao histórico operacional.

Essas transições violam as Regras de Negócio e comprometem a integridade do domínio.  [oai_citation:3‡Protean](https://docs.proteanhq.com/guides/domain-behavior/status-transitions/?utm_source=chatgpt.com)

---

## Princípios dos Estados e Ciclo de Vida

Os Estados e Ciclos de Vida do TEAR seguem os seguintes princípios:

- Todo estado representa uma condição relevante para o negócio.
- Toda entidade possui um ciclo de vida compatível com sua responsabilidade no domínio.
- A identidade da entidade permanece inalterada durante suas mudanças de estado.
- As transições devem respeitar as Regras de Negócio e as invariantes dos Agregados.
- Estados técnicos não fazem parte do modelo de domínio.
- O encerramento de um ciclo nunca implica a perda de seu histórico.
- A evolução das entidades deve permanecer compreensível independentemente da tecnologia utilizada para implementar o sistema.
- A preservação dos ciclos de vida garante rastreabilidade, consistência e continuidade do modelo de domínio do TEAR.  [oai_citation:4‡Qlerify](https://www.qlerify.com/dddconcepts/entity?utm_source=chatgpt.com)

# PASSO 10 — EVENTOS DE DOMÍNIO
## ENTREGA A — CURADORIA

### Objetivo

Identificar e consolidar todos os Eventos de Domínio do TEAR, registrando os acontecimentos relevantes do negócio que representam fatos consumados e que podem ser observados por outras partes do domínio.

Eventos de Domínio descrevem acontecimentos que já ocorreram e possuem significado para o negócio.

Eles não representam comandos, intenções, notificações técnicas ou integrações, mas sim fatos históricos produzidos naturalmente pela evolução das Entidades e Agregados do domínio.  [oai_citation:0‡Microsoft Learn](https://learn.microsoft.com/pt-br/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation?utm_source=chatgpt.com)

---

# Escopo desta seção

A seção "Eventos de Domínio" deverá responder apenas às seguintes perguntas:

- Quais acontecimentos relevantes existem no domínio?
- Quando cada evento ocorre?
- Qual entidade origina cada evento?
- Quais fatos devem ser preservados historicamente?
- Quais acontecimentos não representam Eventos de Domínio?

Esta seção não descreve mensageria, filas, brokers, webhooks ou mecanismos de publicação.

---

# Conteúdo aprovado para preservação

## Parceira Integrada ao Programa

**Preservar.**

Representa a conclusão do fluxo de Onboarding.

Indica que uma nova Parceira passou a integrar oficialmente o programa de marketing de influência.

---

## Competência Planejada

**Preservar.**

Representa a conclusão do planejamento de uma nova Competência.

Marca o início de um novo ciclo operacional.

---

## Colaboração Mensal Criada

**Preservar integralmente.**

Representa o nascimento da principal unidade operacional do domínio.

Toda Colaboração Mensal inicia seu ciclo de vida a partir desse acontecimento.

---

## Snapshot Comercial Consolidado

**Preservar.**

Representa o momento em que as condições comerciais da colaboração tornam-se definitivas e imutáveis.

Após esse evento, o Snapshot Comercial não pode mais ser alterado.

---

## Colaboração Mensal Concluída

**Preservar.**

Representa o encerramento operacional da colaboração.

Marca a conclusão das entregas previstas para aquele ciclo.

---

## Pagamento Concluído

**Preservar.**

Representa a conclusão da obrigação financeira decorrente da colaboração.

Passa a integrar permanentemente o histórico do domínio.

---

## Competência Encerrada

**Preservar.**

Representa o encerramento formal do ciclo operacional de uma Competência.

Após esse evento, a Competência passa a existir apenas como histórico.

---

# Conteúdo adaptado

## Produção

Produção deixa de originar eventos próprios.

Os acontecimentos relevantes passam a integrar a evolução da Colaboração Mensal.

---

## Logística

Eventos relacionados à Logística deixam de ser independentes.

Passam a representar acontecimentos internos da Colaboração Mensal.

---

## Aprovações

As aprovações deixam de originar Eventos de Domínio próprios.

Representam apenas transições internas do ciclo de vida da colaboração.

---

# Conteúdo removido

Não representam Eventos de Domínio:

- login realizado;
- autenticação concluída;
- upload de arquivo;
- envio de e-mail;
- chamada de API;
- sincronização;
- persistência em banco de dados;
- processamento interno;
- publicação em filas;
- integração com sistemas externos.

Esses acontecimentos pertencem exclusivamente à implementação da solução.

---

# Ajustes editoriais

## Eventos representam fatos

Todo Evento de Domínio descreve algo que efetivamente aconteceu.

Seu nome deve representar um fato consumado e utilizar linguagem no passado, refletindo acontecimentos relevantes para o negócio.  [oai_citation:1‡ontologic.site](https://ontologic.site/docs/domain-model/domain-events?utm_source=chatgpt.com)

---

## Imutabilidade

Após ocorrer, um Evento de Domínio torna-se parte permanente da história do domínio.

Seu significado nunca deve ser alterado.

Eventos registram fatos históricos e, por isso, são naturalmente imutáveis.  [oai_citation:2‡Qlerify](https://www.qlerify.com/dddconcepts/domain-event?utm_source=chatgpt.com)

---

## Origem dos Eventos

Todo Evento de Domínio deve ser originado por uma Entidade ou Aggregate Root.

Eventos nunca existem de forma isolada.

Eles representam consequências naturais da evolução do domínio.

---

## Independência tecnológica

Eventos de Domínio existem independentemente da forma como são registrados, armazenados ou comunicados.

Sua existência não depende de mensageria, arquitetura orientada a eventos ou qualquer mecanismo técnico.

---

# Estrutura prevista para a documentação final

A seção "Eventos de Domínio" do DOMAIN.md deverá conter apenas:

1. Conceito de Evento de Domínio
2. Eventos Fundamentais do Domínio
3. Origem dos Eventos
4. Características dos Eventos
5. Eventos que não pertencem ao Domínio
6. Preservação Histórica
7. Princípios dos Eventos de Domínio

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Parceira Integrada ao Programa | Preservar |
| Competência Planejada | Preservar |
| Colaboração Mensal Criada | Preservar |
| Snapshot Comercial Consolidado | Preservar |
| Colaboração Mensal Concluída | Preservar |
| Pagamento Concluído | Preservar |
| Competência Encerrada | Preservar |
| Produção | Incorporar à Colaboração Mensal |
| Logística | Incorporar à Colaboração Mensal |
| Aprovações | Incorporar à Colaboração Mensal |
| Eventos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os acontecimentos relevantes do domínio estiverem identificados como fatos históricos do negócio, cada evento possuir origem clara em uma Entidade ou Aggregate Root, seus nomes representarem acontecimentos já ocorridos e nenhum evento depender de tecnologia, integração ou infraestrutura para existir como conceito do domínio.  [oai_citation:3‡Microsoft Learn](https://learn.microsoft.com/pt-br/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation?utm_source=chatgpt.com)

# 10. EVENTOS DE DOMÍNIO

## Conceito de Evento de Domínio

No domínio do TEAR, um Evento de Domínio representa um fato relevante do negócio que efetivamente ocorreu durante a evolução de uma Entidade ou Agregado.

Eventos registram acontecimentos consumados que possuem significado para o domínio e que podem influenciar outros processos de negócio.

Eles não representam intenções, comandos ou mecanismos técnicos de comunicação, mas fatos históricos produzidos naturalmente pela operação do programa de marketing de influência. ([learn.microsoft.com](https://learn.microsoft.com/pt-br/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation?utm_source=chatgpt.com))

---

## Eventos Fundamentais do Domínio

Os principais Eventos de Domínio do TEAR são:

- Parceira Integrada ao Programa;
- Competência Planejada;
- Colaboração Mensal Criada;
- Snapshot Comercial Consolidado;
- Colaboração Mensal Concluída;
- Pagamento Concluído;
- Competência Encerrada.

Esses eventos representam acontecimentos que modificam o estado do domínio e passam a integrar permanentemente sua história.

---

## Parceira Integrada ao Programa

Esse evento ocorre quando o processo de Onboarding é concluído com sucesso.

A partir desse momento, a Parceira torna-se oficialmente apta a participar das Colaborações Mensais do programa.

Esse acontecimento marca seu ingresso definitivo no domínio.

---

## Competência Planejada

Esse evento ocorre quando uma nova Competência é preparada para iniciar um ciclo operacional.

Ele representa a conclusão do planejamento do período e autoriza o início das Colaborações Mensais pertencentes àquela Competência.

---

## Colaboração Mensal Criada

A criação de uma Colaboração Mensal representa o nascimento da principal unidade operacional do domínio.

Esse evento estabelece formalmente a relação entre uma Marca, uma Parceira e uma Competência específica.

A partir desse acontecimento inicia-se todo o ciclo operacional da colaboração.

---

## Snapshot Comercial Consolidado

Esse evento ocorre quando as condições comerciais da Colaboração Mensal são definidas de forma definitiva.

Após sua consolidação, o Snapshot Comercial torna-se imutável, preservando permanentemente o contexto comercial da colaboração.

Mudanças posteriores nas condições comerciais da Marca ou da Parceira não alteram esse registro histórico.

---

## Colaboração Mensal Concluída

Esse evento representa a conclusão operacional da Colaboração Mensal.

Todas as etapas previstas para aquela colaboração foram finalizadas e seu ciclo operacional encontra-se encerrado.

A colaboração passa então a compor o histórico permanente do domínio.

---

## Pagamento Concluído

O evento Pagamento Concluído ocorre quando a obrigação financeira originada pela Colaboração Mensal é integralmente satisfeita.

Esse acontecimento encerra o ciclo financeiro da colaboração e passa a integrar seu histórico operacional.

---

## Competência Encerrada

Esse evento representa o encerramento formal de uma Competência.

Após sua ocorrência, nenhuma nova Colaboração Mensal pode ser incorporada àquele ciclo operacional.

A Competência permanece disponível apenas como registro histórico.

---

## Origem dos Eventos

Todo Evento de Domínio possui origem em uma Entidade ou Aggregate Root.

No domínio do TEAR:

- a Parceira origina o evento **Parceira Integrada ao Programa**;
- a Competência origina os eventos **Competência Planejada** e **Competência Encerrada**;
- a Colaboração Mensal origina os eventos **Colaboração Mensal Criada**, **Snapshot Comercial Consolidado** e **Colaboração Mensal Concluída**;
- o Pagamento origina o evento **Pagamento Concluído**.

Eventos nunca existem de forma isolada.

Eles sempre representam consequências naturais da evolução do domínio.

---

## Características dos Eventos

Os Eventos de Domínio do TEAR possuem as seguintes características:

- representam fatos consumados;
- possuem significado para o negócio;
- são imutáveis;
- integram permanentemente o histórico operacional;
- podem ser observados por outros processos do domínio;
- independem da forma como são registrados ou comunicados.

Essas características garantem que os eventos preservem a memória do domínio e expressem sua evolução de maneira consistente. ([qlerify.com](https://www.qlerify.com/dddconcepts/domain-event?utm_source=chatgpt.com))

---

## Eventos que não pertencem ao Domínio

Não são considerados Eventos de Domínio:

- autenticação realizada;
- login efetuado;
- upload de arquivos;
- envio de notificações;
- chamadas de APIs;
- sincronizações;
- persistência em banco de dados;
- publicação em filas;
- integrações com sistemas externos;
- processamento interno da aplicação.

Esses acontecimentos pertencem exclusivamente à infraestrutura da solução.

---

## Preservação Histórica

Todo Evento de Domínio passa a integrar permanentemente a história do TEAR.

Após sua ocorrência, seu significado permanece inalterado.

Eventos históricos podem ser utilizados para compreender a evolução do domínio, auditar operações e reconstruir o contexto de uma Colaboração Mensal, sem que isso implique qualquer dependência de uma arquitetura orientada a eventos. ([learn.microsoft.com](https://learn.microsoft.com/pt-br/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation?utm_source=chatgpt.com))

---

## Princípios dos Eventos de Domínio

Os Eventos de Domínio do TEAR seguem os seguintes princípios:

- Todo evento representa um fato consumado do negócio.
- Todo evento possui origem em uma Entidade ou Aggregate Root.
- Eventos são imutáveis.
- Eventos preservam acontecimentos relevantes da operação.
- Eventos representam a evolução natural do domínio.
- Eventos não dependem de tecnologia, mensageria ou infraestrutura.
- O histórico dos eventos deve permanecer íntegro durante todo o ciclo de vida do sistema.
- A representação consistente dos Eventos de Domínio fortalece a rastreabilidade, a auditabilidade e a compreensão da evolução do modelo de domínio do TEAR. ([learn.microsoft.com](https://learn.microsoft.com/pt-br/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation?utm_source=chatgpt.com))

# PASSO 11 — GLOSSÁRIO
## ENTREGA A — CURADORIA

### Objetivo

Consolidar o Glossário Oficial do domínio do TEAR, reunindo em um único local as definições formais dos principais conceitos utilizados ao longo do DOMAIN.md.

O Glossário funciona como uma referência rápida para consulta, reforçando a Linguagem Ubíqua e garantindo que todos os termos do domínio possuam significado único, consistente e compartilhado.

Esta seção não cria novos conceitos; apenas consolida aqueles já definidos nas seções anteriores. O Glossário é uma prática recomendada para manter um modelo de domínio compreensível e consistente entre especialistas do negócio e equipe técnica. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

---

# Escopo desta seção

A seção "Glossário" deverá responder apenas às seguintes perguntas:

- Quais são os principais termos do domínio?
- O que significa cada termo?
- Qual é o significado oficial de cada conceito?
- Quais definições devem ser utilizadas em toda a documentação?
- Como evitar ambiguidades de interpretação?

Esta seção não introduz novas regras de negócio, fluxos ou entidades.

---

# Conteúdo aprovado para preservação

## Marca

**Preservar.**

Organização responsável pela operação do programa de marketing de influência.

---

## Parceira

**Preservar.**

Pessoa participante do programa de marketing de influência que realiza Colaborações Mensais com a Marca.

---

## Onboarding

**Preservar.**

Processo de ingresso de uma Parceira no programa.

---

## Competência

**Preservar.**

Período operacional que organiza um conjunto de Colaborações Mensais.

---

## Colaboração Mensal

**Preservar integralmente.**

Principal unidade operacional do domínio.

Representa a relação entre uma Marca e uma Parceira durante uma Competência.

---

## Snapshot Comercial

**Preservar.**

Registro imutável das condições comerciais existentes no momento da criação da Colaboração Mensal.

---

## Pagamento

**Preservar.**

Obrigação financeira decorrente de uma Colaboração Mensal.

---

## Histórico

**Preservar.**

Registro permanente da evolução operacional do domínio.

---

# Conteúdo adaptado

## Planejamento

Passa a ser definido como etapa da Colaboração Mensal.

Não constitui entidade independente.

---

## Produção

Passa a representar etapa operacional da Colaboração Mensal.

---

## Logística

Passa a representar etapa operacional pertencente à Colaboração Mensal.

---

## Evento de Domínio

Passa a integrar oficialmente o Glossário como conceito do modelo de domínio.

---

# Conteúdo removido

Não pertencem ao Glossário do domínio:

- nomes de tabelas;
- nomes de planilhas;
- APIs;
- endpoints;
- classes;
- serviços;
- frameworks;
- banco de dados;
- infraestrutura;
- termos técnicos de implementação.

Esses elementos pertencem exclusivamente à documentação técnica.

---

# Ajustes editoriais

## Definições únicas

Cada termo deve possuir exatamente uma definição oficial.

Não devem existir definições concorrentes para um mesmo conceito.

---

## Linguagem Ubíqua

Todas as definições devem utilizar exclusivamente a Linguagem Ubíqua do TEAR.

O Glossário representa a consolidação dessa linguagem e deve permanecer alinhado com todas as demais seções do DOMAIN.md. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

---

## Consistência documental

Sempre que um conceito for alterado, sua definição deverá ser atualizada simultaneamente no Glossário e nas demais seções da documentação.

---

## Independência tecnológica

As definições do Glossário devem permanecer válidas independentemente da arquitetura, tecnologia ou plataforma utilizada para implementar o TEAR.

---

# Estrutura prevista para a documentação final

A seção "Glossário" do DOMAIN.md deverá conter apenas:

1. Objetivo do Glossário
2. Termos Fundamentais
3. Definições Oficiais
4. Convenções de Uso
5. Termos Excluídos
6. Evolução do Glossário
7. Princípios do Glossário

---

# Resultado da curadoria

| Item | Decisão |
|------|----------|
| Marca | Preservar |
| Parceira | Preservar |
| Onboarding | Preservar |
| Competência | Preservar |
| Colaboração Mensal | Preservar |
| Snapshot Comercial | Preservar |
| Pagamento | Preservar |
| Histórico | Preservar |
| Planejamento | Adaptar |
| Produção | Adaptar |
| Logística | Adaptar |
| Evento de Domínio | Incorporar |
| Termos técnicos | Remover |

---

## Critério de aprovação

A curadoria estará concluída quando todos os conceitos fundamentais do domínio estiverem reunidos em um Glossário único, utilizando definições oficiais, consistentes e alinhadas à Linguagem Ubíqua do TEAR, eliminando ambiguidades e garantindo uma referência permanente para toda a documentação do projeto. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

# 11. GLOSSÁRIO

## Objetivo do Glossário

O Glossário do TEAR reúne as definições oficiais dos principais conceitos utilizados em todo o modelo de domínio.

Seu propósito é consolidar a Linguagem Ubíqua, garantindo que especialistas do negócio, produto, arquitetura e desenvolvimento utilizem exatamente os mesmos termos para representar os mesmos conceitos.

Cada definição presente nesta seção possui caráter normativo e deve servir como referência para toda a documentação do projeto. A manutenção de uma linguagem única é um dos princípios centrais do *Domain-Driven Design (DDD)*. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))

---

## Termos Fundamentais

### Marca

Organização responsável pela operação do programa de marketing de influência.

A Marca estabelece as políticas comerciais, organiza Competências e mantém relacionamento com as Parceiras participantes do programa.

---

### Parceira

Pessoa participante do programa de marketing de influência.

A Parceira integra o domínio após concluir seu Onboarding e pode participar de diversas Colaborações Mensais ao longo do tempo.

---

### Onboarding

Processo de ingresso de uma Parceira no programa.

Seu objetivo é preparar a participante para integrar oficialmente o domínio e participar das futuras Colaborações Mensais.

---

### Competência

Período operacional utilizado para organizar um conjunto de Colaborações Mensais.

Cada Competência representa um ciclo operacional completo do programa.

---

### Colaboração Mensal

Principal unidade operacional do domínio.

Representa a relação estabelecida entre uma Marca e uma Parceira durante uma Competência específica.

Todo comportamento relevante do TEAR ocorre no contexto de uma Colaboração Mensal.

---

### Snapshot Comercial

Objeto de Valor responsável por preservar as condições comerciais vigentes no momento da criação de uma Colaboração Mensal.

Seu conteúdo é imutável e garante a preservação do contexto histórico da colaboração.

---

### Planejamento

Etapa da Colaboração Mensal dedicada à definição das entregas, responsabilidades e objetivos da colaboração.

Não constitui entidade independente do domínio.

---

### Produção

Etapa operacional da Colaboração Mensal na qual as entregas previstas são executadas pela Parceira.

---

### Logística

Etapa operacional da Colaboração Mensal responsável pelas atividades relacionadas ao fornecimento, movimentação ou acompanhamento dos materiais necessários para a colaboração.

---

### Pagamento

Entidade responsável por representar a obrigação financeira decorrente de uma Colaboração Mensal.

Seu ciclo de vida acompanha a evolução financeira da colaboração e integra permanentemente seu histórico.

---

### Histórico

Conjunto permanente dos registros que documentam a evolução das Entidades, Colaborações Mensais, Pagamentos e Eventos de Domínio.

O Histórico constitui a memória operacional do TEAR e nunca deve perder informações anteriormente registradas.

---

### Evento de Domínio

Fato relevante do negócio que efetivamente ocorreu durante a evolução de uma Entidade ou Agregado.

Eventos representam acontecimentos consumados e preservam a evolução histórica do domínio.

---

## Definições Oficiais

As definições apresentadas neste Glossário constituem a terminologia oficial do domínio.

Sempre que um desses termos for utilizado em qualquer documentação, seu significado deverá corresponder exatamente ao definido nesta seção.

Não devem existir interpretações alternativas para os conceitos aqui estabelecidos.

---

## Convenções de Uso

O uso do Glossário deve obedecer às seguintes convenções:

- cada conceito possui um único nome oficial;
- um mesmo termo nunca representa conceitos distintos;
- sinônimos devem ser evitados;
- abreviações somente podem ser utilizadas quando oficialmente definidas;
- toda documentação do projeto deve utilizar as definições deste Glossário;
- novos conceitos devem ser incorporados ao Glossário antes de serem adotados em outras documentações.

Essas convenções preservam a consistência da Linguagem Ubíqua ao longo da evolução do domínio.

---

## Termos Excluídos

Os seguintes elementos não pertencem ao Glossário do domínio:

- nomes de planilhas;
- nomes de tabelas;
- APIs;
- endpoints;
- classes;
- serviços;
- frameworks;
- bancos de dados;
- mecanismos de autenticação;
- infraestrutura;
- tecnologias específicas de implementação.

Esses elementos pertencem exclusivamente à documentação técnica da solução.

---

## Evolução do Glossário

O Glossário evolui juntamente com o domínio do TEAR.

Sempre que um novo conceito de negócio for incorporado ao modelo, sua definição oficial deverá ser registrada nesta seção antes de sua utilização em documentos, diagramas ou implementações.

Alterações nas definições existentes devem preservar a coerência histórica da documentação e manter alinhamento com a Linguagem Ubíqua adotada pelo projeto.

---

## Princípios do Glossário

O Glossário do TEAR segue os seguintes princípios:

- Cada conceito possui uma definição oficial.
- Cada termo representa exatamente um conceito do domínio.
- A Linguagem Ubíqua deve permanecer consistente em toda a documentação.
- O Glossário representa a referência normativa para o vocabulário do projeto.
- Conceitos do domínio independem de tecnologia, arquitetura ou implementação.
- Alterações terminológicas devem preservar a consistência histórica do modelo.
- O Glossário deve evoluir em conjunto com o domínio.
- A padronização da terminologia fortalece a comunicação, reduz ambiguidades e preserva a integridade do modelo de domínio do TEAR. ([martinfowler.com](https://martinfowler.com/bliki/UbiquitousLanguage.html?utm_source=chatgpt.com))