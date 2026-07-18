# SPEC-035 — Identidade e Acesso

## Documento Técnico de Arquitetura de Software

---

> **Nota de revisão (2026-07-17):** Documento ajustado após revisão
> arquitetural. Correções aplicadas: nomenclatura de tabela alinhada ao
> `CONTRATO_SOBERANO.md` (§10); fronteira de responsabilidade sobre dados
> contratuais (§1.4/§3.1.2); validação de emissor/audiência do token
> (§14.1); bootstrap do primeiro Administrador (§6, RN-07); reconciliação
> de identidade com Parceira pré-existente (§5.1-A); reconciliação entre
> `ESTADO_CONTA` e `Parceira.status` (§8.1); fronteira de agregado
> `Usuario`/`Parceira` (§9.1.6); restrição de uso de `buscarPorEmail`
> (§6 RN-02/§9.1.4); teste de reconciliação (§15.3, CT-06). Pendências que
> exigem decisão do PO ou ADR permanecem marcadas com 🟠 ao longo do texto
> — não foram decididas por este documento.
>
> **Nota de revisão 2 (2026-07-17):** Pendências resolvidas por inferência
> direta da arquitetura e documentação já existentes (sem decisão de
> negócio inédita): Q-07 resolvido reaproveitando integralmente a stack de
> sessão de SPEC-025 (§9.1.7/§9.2/§9.2-A — `AuthController`/`AuthService`
> removidos do desenho); Q-08 resolvido para os papéis `Administrador` e
> `Influenciadora` (§4.2, já nomeados no PRD); Q-09 tratado como débito
> herdado, mesmo precedente de SPEC-027/030/032 (§3.2), não bloqueante.
> Única pendência real remanescente: o ator `Marca` como tenant externo
> (§4.2) não é inferível de nenhum documento do projeto — fica definido
> na SPEC, mas fora do escopo desta implementação, até decisão do PO.

---

### Capítulo 1 — Visão do Módulo

#### 1.1 Propósito

O módulo de **Identidade e Acesso (M-ID)** é responsável por centralizar a identificação, autenticação e autorização de todos os usuários no ecossistema TEAR V2. Ele estabelece de forma segura a identidade do usuário e determina quais ações ele tem permissão para executar, servindo como base para o controle de acesso de todos os demais módulos do sistema.

#### 1.2 Posicionamento Estratégico

Este módulo unifica o ciclo de vida da identidade digital dos atores dentro da própria plataforma, eliminando a dependência de formulários e ferramentas externas de captação de dados.

A arquitetura do TEAR V2 deixa de gerenciar credenciais locais (como senhas) e transfere a responsabilidade de autenticação para um provedor de identidade externo. Essa abordagem simplifica o desenvolvimento, elimina riscos de segurança associados ao armazenamento de senhas e melhora a experiência do usuário por meio de um fluxo de acesso unificado.

#### 1.3 Pilares Arquiteturais

O desenho técnico deste módulo fundamenta-se em três princípios:

* **Identidade Imutável e Estável:** A chave primária de identificação do usuário no sistema utiliza um identificador permanente e exclusivo fornecido pelo provedor de identidade (mapeado através do atributo `sub` do *Google Identity*, adotado por esta especificação em substituição ao modelo de credencial local vigente — ver nota de dependência arquitetural no Capítulo 9). O e-mail e o nome do usuário são tratados apenas como atributos mutáveis de perfil. Isso impede a corrupção de históricos operacionais caso o usuário altere seu endereço de e-mail.
* **Autenticação Delegada (Federação):** O ecossistema não armazena credenciais confidenciais nem processa fluxos de recuperação de senha. O processo de login é delegado integralmente ao provedor de identidade. O TEAR apenas recebe, valida e consome o token assinado gerado pelo provedor para estabelecer o contexto da sessão.
* **Segregação Lógica de Atores:** O módulo identifica e isola as permissões de três atores distintos: **Administrador**, **Marca** e **Influenciadora**. Embora utilizem a mesma interface de entrada, suas propriedades de negócio e níveis de acesso são independentes para garantir a segurança dos dados.

#### 1.4 Limites de Responsabilidade

Para manter o módulo coeso e evitar o excesso de engenharia, os limites de atuação do M-ID foram delimitados da seguinte forma:

##### O que o módulo FAZ:

* Valida a autenticidade do usuário por meio dos tokens emitidos pelo provedor de identidade.
* Associa o identificador estável externo do usuário ao seu registro interno no sistema.
* Gerencia o ciclo de vida e o estado do usuário (ex: Pendente, Ativo, Inativo).
* Controla os níveis de acesso e aplica as regras de permissão baseadas nos papéis de Administrador, Marca e Influenciadora.

##### O que o módulo deliberadamente NÃO FAZ:

* Não armazena, valida ou recupera senhas, e não gerencia fluxos de segundo fator de autenticação (MFA).
* Não gerencia regras de negócio específicas de outros módulos, como a vigência de contratos, a logística de produtos ou a liberação de pagamentos (apenas fornece a identidade confirmada do usuário para que os outros módulos processem suas respectivas regras).
* Não realiza a renderização de telas ou componentes de interface que estejam fora do fluxo direto de login e do cadastro inicial de primeiro acesso.

---

*Fim do Capítulo 1. O documento foi simplificado e reestruturado conforme os objetivos editoriais informados. Aguardo sua revisão e aprovação formal para prosseguirmos para o Capítulo 2 — Objetivos.*

### Capítulo 2 — Objetivos

#### 2.1 Objetivos Funcionais

* **Nativização do Onboarding:** Substituir integralmente os formulários externos por um fluxo interno de primeiro acesso e captura de dados cadastrais diretamente na plataforma TEAR V2.
* **Unificação do Ponto de Entrada:** Disponibilizar uma interface única de autenticação capaz de direcionar e adaptar o contexto do sistema de acordo com o papel do ator identificado (Administrador, Marca ou Influenciadora).
* **Fluxo de Governança Cadastral:** Estabelecer um ciclo de vida controlado para as contas de usuário, exigindo a validação e aprovação explícita da equipe de administração antes de liberar o acesso operacional às ferramentas internas.
* **Consolidação de Perfis:** Permitir que cada ator gerencie suas informações básicas de contato e preferências em ambiente logado, mantendo seus dados sincronizados com o estado do seu cadastro corporativo.

#### 2.2 Objetivos Técnicos

* **Garantia de Integridade Referencial:** Adotar um identificador técnico definitivo e imutável fornecido pelo provedor de identidade como chave primária de relacionamento. O objetivo é proteger os históricos e as amarrações do banco de dados contra alterações futuras em dados voláteis do usuário, como o endereço de e-mail.
* **Zero Armazenamento de Credenciais:** Eliminar a existência de senhas locais, tabelas de recuperação de acessos e códigos de redefinição no banco de dados da aplicação, transferindo todo o risco e a execução da segurança criptográfica para o provedor de identidade.
* **Segregação Física na Persistência:** Organizar as estruturas de armazenamento dos dados cadastrais em repositórios separados para cada tipo de ator, otimizando o desempenho de leitura da aplicação e reduzindo o acoplamento de propriedades que não pertencem ao mesmo domínio de negócio.
* **Isolamento do Contexto de Autorização:** Prover uma subcamada de validação que intercepte as requisições e verifique se o usuário possui o papel necessário para interagir com o módulo solicitado, impedindo o escalonamento indevido de privilégios.
* **Rastreabilidade por Eventos:** Disparar notificações internas no ecossistema (Eventos de Domínio) sempre que um usuário alterar seu estado no sistema (ex: aprovação de cadastro ou inativação de conta), permitindo que os módulos de logística, contratos e finanças reajam automaticamente sem depender de acoplamento direto.

---

*Fim do Capítulo 2. O conteúdo cumpre as metas de simplicidade e foco técnico acordadas. A documentação está congelada neste ponto e aguarda sua revisão para seguirmos para o Capítulo 3 — Escopo.*

### Capítulo 3 — Escopo

#### 3.1 Escopo Funcional (O que pertence ao módulo)

##### 3.1.1 Fluxo de Autenticação e Entrada Unificada

* Interceção de acessos na página inicial da plataforma para validação do estado logado junto ao provedor de identidade.
* Resolução e decodificação do token assinado para extração segura do identificador estável único (`sub`), nome e e-mail do usuário.
* Redirecionamento dinâmico para a interface correspondente após a validação do papel do usuário (Administrador, Marca ou Influenciadora).

##### 3.1.2 Onboarding e Ingestão de Dados (Primeiro Acesso)

* Captura e triagem de novos utilizadores quando o identificador `sub` não for localizado nos registos internos.
* Fornecimento de formulários nativos diferenciados para recolha de dados cadastrais iniciais de acordo com o perfil solicitado (ex: dados de identificação e de contacto para Influenciadoras; dados corporativos e de contacto para Marcas). Dados contratuais e condições comerciais permanecem fora deste formulário — são de responsabilidade exclusiva do módulo de Contratos, conforme o limite fixado no §1.4 e no §3.3.
* Bloqueio preventivo de navegação em áreas operacionais da plataforma até que o cadastro inicial seja concluído.

##### 3.1.3 Gestão do Ciclo de Vida e Estados da Conta

* Mecanismo para alteração e consulta do estado lógico do utilizador (Pendente, Ativo, Inativo).
* Interface administrativa restrita para avaliação, aprovação ou rejeição de cadastros que se encontrem no estado "Pendente".
* Bloqueio imediato de chamadas à API e rejeição de acessos para contas marcadas no estado "Inativo".

##### 3.1.4 Controlo de Autorização (RBAC)

* Guarda de segurança que valida se o ator possui o papel exigido pelo endpoint ou serviço antes de permitir a sua execução.
* Emissão de respostas padronizadas de erro de autorização através do envelope oficial do sistema quando houver tentativa de violação de privilégios.

#### 3.2 Escopo Não-Funcional e Restrições Técnicas

* **Isolamento de Credenciais:** Proibição absoluta de processamento, transporte ou gravação de senhas ou chaves criptográficas de autenticação locais.
* **Chave Relacional Estável:** Obrigatoriedade do uso do identificador `sub` obtido na federação como chave primária de amarração nos repositórios geridos por este módulo (`SIS_IDENTIDADES`, `BASE_ADMINISTRADORES`, `BASE_MARCAS`). Para o papel Influenciadora, `sub` é persistido como atributo de identidade federada associado à chave soberana `INFLU_KEY` (`CONTRATO_SOBERANO.md` §7.1), sem substituí-la (ver §10.1).
* **Imutabilidade Referencial:** Vedação do uso de strings mutáveis (como e-mails ou nomes comerciais) para fins de joins ou indexação relacional direta no banco de dados.

> ⚪ **Q-09 — débito herdado, não bloqueante (revisão SPEC-035, 2026-07-17):** Q-09 (`TASK_ROUTER.md`) já é uma pendência aberta desde SPEC-025 e foi herdada, sem bloquear implementação, por SPEC-027/030/032 — todas expõem dados da Influenciadora no Portal com Q-09 ainda aberta. Este módulo segue o mesmo precedente já estabelecido pelo projeto: implementa, e carrega a dívida adiante (retenção, consentimento, direito ao esquecimento continuam pendentes de tratamento formal). Não é uma decisão nova desta SPEC.

#### 3.3 Fora de Escopo (O que deliberadamente não pertence ao módulo)

* **Gestão de Sessões do Provedor:** O módulo não controla o tempo de expiração da conta externa do utilizador, renovação de tokens globais ou políticas de segurança de segundo fator (MFA).
* **Regras de Negócio de Contratos ou Campanhas:** A validação se uma influenciadora está apta a participar de uma campanha ou receber pagamentos é de responsabilidade dos módulos de Contratos e Finanças. O M-ID apenas atesta quem é o utilizador e o seu papel.
* **Comunicação Externa Automatizada:** O envio de e-mails de boas-vindas, alertas de alteração de senha ou notificações de auditoria de segurança delegadas ao provedor de identidade ficam fora do escopo deste módulo.

---

*Fim do Capítulo 3. O texto preserva o alinhamento com a visão arquitetural e a objetividade exigida. Aguardo sua revisão para seguirmos para o Capítulo 4 — Atores.*

### Capítulo 4 — Atores

O sistema limita o controlo de acesso e a definição de contextos a três atores específicos. Cada utilizador autenticado pelo provedor de identidade deve estar obrigatoriamente associado a apenas um destes papéis operacionais:

#### 4.1 Administrador

* **Perfil:** Equipa interna de gestão do Estúdio Elã.
* **Contexto de Acesso:** Possui privilégios globais de leitura e escrita em todo o ecossistema TEAR V2.
* **Responsabilidade no Módulo:** Atua como a autoridade moderadora do fluxo de acesso, sendo o único papel com permissão para aprovar, rejeitar, ativar ou inativar contas de Marcas e Influenciadoras.

#### 4.2 Marca

* **Perfil:** Empresas parceiras comerciais e clientes do Estúdio Elã.
* **Contexto de Acesso:** Restrito estritamente aos dados, campanhas, briefings e orçamentos vinculados à sua própria organização. Não possui visibilidade sobre operações de outras marcas.
* **Responsabilidade no Módulo:** Concluir o onboarding corporativo e manter atualizados os dados de perfil da empresa após a libertação do acesso pela administração.

> 🟠 **Escopo de implementação (revisão SPEC-035, 2026-07-17):** `docs/PRD.md` declara que o sistema opera hoje para uma única marca (Jescri) — na prática, o ator descrito no PRD como "Equipe Jescri/Estúdio Elã" já corresponde ao papel `Administrador` desta SPEC, não a um tenant externo. O ator `Marca`, como cliente externo com onboarding e isolamento de dados próprios, é escopo de negócio novo (suporte a múltiplos clientes/tenants), não inferível de nenhum documento existente — decisão real de produto, não de arquitetura. Esta é a única pendência desta SPEC que permanece bloqueada: **a implementação desta unidade de trabalho cobre os papéis `Administrador` e `Influenciadora`; o ator `Marca` (§4.2, `BASE_MARCAS` em §10.2.3, enum `MARCA` em §10.2.1) fica definido no documento mas não implementado, até validação explícita do responsável do projeto.**

> ✅ **Q-08 resolvida para este escopo (revisão SPEC-035, 2026-07-17):** O modelo de papéis para `Administrador` e `Influenciadora` é inferível diretamente do PRD (§ "Quem usa o sistema": equipe Jescri/Elã e influenciadora já são os dois atores reais do sistema hoje) — não é uma regra de negócio inédita. Registrado como resolução de Q-08 para esses dois papéis em `TASK_ROUTER.md`. `Marca` permanece fora de Q-08 até a decisão de escopo acima.

#### 4.3 Influenciadora

* **Perfil:** Criadoras de conteúdo e parceiras operacionais contratadas.
* **Contexto de Acesso:** Restrito de forma exclusiva ao seu painel individual de entregas, cronogramas, dados logísticos e históricos financeiros pessoais. Não possui acesso a dados de marcas ou de outras influenciadoras.
* **Responsabilidade no Módulo:** Realizar o primeiro acesso para vinculação da identidade digital, preencher o cadastro inicial obrigatório e gerir os seus dados de contacto e faturação.

---

*Fim do Capítulo 4. O conteúdo mantém-se estritamente focado na definição dos papéis arquiteturais, sem antecipar ecrãs ou tabelas de dados. A documentação encontra-se congelada e aguarda a sua revisão para avançarmos para o Capítulo 5 — Jornada do utilizador.*

Capítulo 5 — Jornada do Utilizador
A jornada do utilizador mapeia o ciclo de interação dos atores com o módulo de Identidade e Acesso, desde o primeiro contacto até à operação regular no sistema.

5.1 Primeiro Acesso
Cenário: Um novo utilizador entra na URL principal da plataforma.

Fluxo: O utilizador é direcionado para a validação no provedor de identidade. Após a autenticação bem-sucedida, o sistema intercepta o token e verifica que o identificador imutável (sub) não existe nos registos internos. Para o papel Influenciadora, o sistema tenta primeiro a vinculação a um cadastro pré-existente (§5.1-A) antes de assumir tratar-se de um cadastro do zero. Não havendo vinculação possível, o TEAR bloqueia a navegação para as áreas operacionais e redireciona o utilizador automaticamente para o ecrã de seleção de perfil.

5.1-A Vinculação de Identidade para Parceira Pré-Existente
Cenário: Uma Influenciadora já cadastrada como `Parceira` (via módulo de Gestão de Influenciadoras, anterior a este módulo) realiza o primeiro login federado.

Fluxo: Antes de abrir o formulário de onboarding do zero, o sistema tenta localizar um registo compatível pré-existente em `BASE DE DADOS` (por e-mail informado pelo provedor de identidade), apresentando o resultado para confirmação manual explícita da própria Influenciadora — nunca associação automática silenciosa. Caso a utilizadora confirme a correspondência, o sistema grava `SUB_PROVIDER` na linha existente (vínculo por `INFLU_KEY`, ver §10.2.4) e cria o registo em `SIS_IDENTIDADES` já apontando para essa `Parceira`, sem reabrir ou duplicar os dados contratuais já existentes. Apenas quando nenhum registo correspondente é localizado ou confirmado o fluxo segue para o cadastro completo (§5.3).

5.2 Login
Cenário: Um utilizador já registado tenta entrar na plataforma.

Fluxo: O utilizador executa a autenticação através do provedor de identidade. O TEAR recebe o token assinado, extrai o identificador imutável estável e valida o estado atual da conta. Se a conta estiver ativa, o utilizador é encaminhado diretamente para o painel correspondente ao seu papel.

5.3 Cadastro
Cenário: O novo utilizador preenche os seus dados iniciais.

Fluxo: Após escolher o papel pretendido (Marca ou Influenciadora), o utilizador preenche o formulário nativo com as informações cadastrais obrigatórias. Ao submeter o formulário, o sistema grava o identificador imutável associado a estes dados e define o estado da conta como "Pendente", exibindo um aviso de que o acesso aguarda revisão.

5.4 Aprovação
Cenário: O Administrador analisa os novos registos na plataforma.

Fluxo: O Administrador acede à área restrita de moderação e visualiza a lista de utilizadores no estado "Pendente". O Administrador revê as informações submetidas e aciona a opção de aprovar ou rejeitar o registo.

5.5 Ativação
Cenário: O sistema processa a decisão de aprovação tomada pelo Administrador.

Fluxo: Caso o registo seja aprovado, o módulo altera o estado do utilizador para "Ativo". Esta alteração dispara um Evento de Domínio interno para alertar os outros módulos de que o utilizador está autorizado a operar. Se o registo for rejeitado, a conta é marcada com um estado impeditivo correspondente.

5.6 Uso da Plataforma
Cenário: O utilizador validado interage com o ecossistema no dia a dia.

Fluxo: Em cada pedido ou transação efetuada, o sistema valida silenciosamente se o identificador imutável permanece associado a uma conta no estado "Ativo" e se o papel do ator possui privilégios para a ação pretendida, garantindo a segurança contínua sem prejudicar a experiência de navegação.

Fim do Capítulo 5. A documentação está congelada e aguarda a sua revisão para avançarmos para o Capítulo 6 — Regras de Negócio.

### Capítulo 6 — Regras de Negócio

As regras de negócio do módulo de Identidade e Acesso estabelecem as diretivas obrigatórias que governam o comportamento do sistema, a integridade dos perfis e a segurança das operações.

#### RN-01 — Unicidade da Identidade Técnica

Cada utilizador registado no ecossistema TEAR V2 deve possuir apenas um identificador imutável e exclusivo fornecido pelo provedor de identidade. É expressamente proibida a existência de múltiplos perfis internos associados ao mesmo identificador técnico externo.

#### RN-02 — Independência de Dados de Perfil

O endereço de e-mail e o nome do utilizador são tratados estritamente como atributos mutáveis de contacto e exibição. Nenhuma regra de negócio, junção de dados ou validação de integridade referencial pode utilizar strings de e-mail ou nome como chave ou indexador relacional. A busca por e-mail exposta pelo repositório (§9.1.4) é permitida exclusivamente para apresentação de correspondência candidata durante a vinculação de identidade (§5.1-A) — sempre sujeita a confirmação manual da utilizadora, nunca para associar, criar ou resolver automaticamente a identidade de um registo.

#### RN-03 — Bloqueio Preventivo de Acesso Operacional

A autorização para consumir qualquer serviço ou endpoint da plataforma está estritamente condicionada ao estado da conta do utilizador. Contas cujo estado lógico seja diferente de "Ativo" (como "Pendente" ou "Inativo") terão o seu acesso bloqueado na camada de controlo, interrompendo imediatamente a execução e devolvendo uma resposta de erro padronizada.

#### RN-04 — Soberania da Moderação Administrativa

Todo o novo utilizador que conclua o fluxo de cadastro inicial entrará obrigatoriamente no estado "Pendente". A transição deste estado para "Ativo" ou "Rejeitado" é um privilégio exclusivo do papel de Administrador, não existindo aprovação automática ou por decurso de prazo.

#### RN-05 — Exclusividade de Papel Operacional (Role)

Um utilizador autenticado pode estar associado a apenas um papel operacional no sistema (Administrador, Marca ou Influenciadora). Não é permitida a acumulação simultânea de múltiplos papéis numa única conta técnica.

#### RN-06 — Vedação de Credenciais Locais

É terminantemente proibido ao ecossistema capturar, transportar, processar ou persistir senhas físicas, contra-senhas ou chaves de acesso locais de utilizadores. Qualquer necessidade de redefinição de segurança, bloqueio por força bruta ou segundo fator de autenticação (MFA) é de total responsabilidade do provedor de identidade federado.

#### RN-07 — Bootstrap do Primeiro Administrador

Como a transição para `ACTIVE` depende de um Administrador já ativo (RN-04), o primeiro registo com papel `Administrador` do ecossistema é uma exceção operacional: é provisionado diretamente no estado `ACTIVE` por ação manual do responsável técnico do projeto (inserção direta na aba `SIS_IDENTIDADES`, fora do fluxo de onboarding), nunca por aprovação automática do sistema. Após a existência de ao menos um Administrador `ACTIVE`, todos os registos subsequentes — incluindo novos Administradores — seguem obrigatoriamente o fluxo padrão de aprovação (RN-04).

---

*Fim do Capítulo 6. O texto cumpre as diretrizes de concisão, objetividade e foco exclusivo nas regras abstratas de negócio. A documentação encontra-se congelada neste ponto e aguarda a sua revisão para avançarmos para o Capítulo 7 — Estados do utilizador.*

Capítulo 7 — Estados do Utilizador
O ciclo de vida de um utilizador dentro do ecossistema TEAR V2 é controlado por uma máquina de estados finitos. Cada conta técnica associada a um identificador imutável deve possuir apenas um estado ativo num determinado momento.

7.1 Definição dos Estados
Pendente (PENDING)

Contexto: Atribuído automaticamente assim que o utilizador conclui o preenchimento do formulário de cadastro inicial (onboarding).

Comportamento do Sistema: Bloqueia o acesso a qualquer módulo operacional da plataforma. A conta fica visível exclusivamente no painel de moderação do Administrador.

Ativo (ACTIVE)

Contexto: Concedido após a aprovação manual e explícita do cadastro pela equipa de administração.

Comportamento do Sistema: Liberta integralmente as permissões associadas ao papel do ator (Administrador, Marca ou Influenciadora), permitindo a operação regular no sistema.

Inativo (INACTIVE)

Contexto: Aplicado manualmente pela administração para suspender o acesso de um utilizador anteriormente ativo.

Comportamento do Sistema: Interrompe imediatamente a sessão atual, bloqueia a navegação e rejeita qualquer chamada à API em nome deste utilizador.

Rejeitado (REJECTED)

Contexto: Definido quando a administração recusa um registo que se encontrava em estado pendente.

Comportamento do Sistema: Impede o utilizador de aceder à plataforma. O identificador imutável permanece registado no histórico de rejeições para mitigar tentativas consecutivas de reenvio de dados.

7.2 Regras de Transição de Estados
Aprovação Cadastral: A transição do estado PENDING para ACTIVE exige a ação direta de um utilizador com o papel de Administrador.

Rejeição Cadastral: A transição de PENDING para REJECTED encerra o fluxo de onboarding e fixa a conta como ilegível para operação.

Suspensão Operacional: Apenas contas em estado ACTIVE podem transitar para INACTIVE.

Reativação Operacional: Contas em estado INACTIVE podem retornar ao estado ACTIVE mediante nova autorização expressa do Administrador.

Fim do Capítulo 7. A definição lógica dos estados está concluída. Aguardo a sua revisão para avançarmos para o Capítulo 8 — Permissões.

### Capítulo 8 — Permissões

O modelo de autorização do TEAR V2 baseia-se na combinação de Controlo de Acesso Baseado em Papéis (RBAC) e Controlo de Acesso Baseado em Estados (SBAC). A concessão de privilégios para executar qualquer operação no ecossistema é determinada estritamente pelo papel funcional do ator e pelo estado lógico atual da sua conta.

#### 8.1 Matriz de Acesso por Estado da Conta

* **Estado `PENDING` (Pendente)**
* **Administrador:** Acesso total de leitura e escrita para fins de auditoria e moderação.
* **Marca / Influenciadora:** Permissão restrita exclusivamente à submissão do formulário de onboarding inicial e à leitura do ecrã de bloqueio preventivo (aviso de aguardo de aprovação). Qualquer pedido a APIs operacionais de outros módulos é intercetado e rejeitado.


* **Estado `ACTIVE` (Ativo)**
* **Administrador / Marca / Influenciadora:** Permissões integrais libertadas de acordo com as atribuições específicas do seu papel funcional (ver secção 8.2).
* **Regra de Reconciliação com o Domínio Soberano (Influenciadora):** Para o papel `Influenciadora`, o estado `ACTIVE` em `ESTADO_CONTA` é condição necessária, mas não suficiente. O acesso operacional exige adicionalmente que `Parceira.status` (`CONTRATO_SOBERANO.md` §7.3, aba `BASE DE DADOS`) esteja `Ativa`. Prevalece sempre a condição mais restritiva — se qualquer um dos dois estados não permitir operação, o acesso é bloqueado. `ESTADO_CONTA` governa a identidade/login; `Parceira.status` governa a elegibilidade de negócio da parceria; nenhum dos dois substitui o outro.


* **Estados `INACTIVE` (Inativo) e `REJECTED` (Rejeitado)**
* **Todos os papéis (exceto Administrador):** Revogação imediata e absoluta de todas as permissões de leitura e escrita. O gateway de segurança rejeita qualquer tentativa de interação antes do processamento de regras de negócio a jusante.



#### 8.2 Matriz de Operações por Papel Funcional (Contas em Estado `ACTIVE`)

##### 8.2.1 Operações de Administração Geral

* **Gestão e Moderação de Contas (Aprovar/Rejeitar/Suspender):** Exclusivo do papel `Administrador`.
* **Visualização de Logs de Auditoria Globais:** Exclusivo do papel `Administrador`.

##### 8.2.2 Operações do Contexto de Marcas

* **Leitura e Escrita de Dados de Perfil Corporativo:** Permitido ao papel `Marca` (restrito aos seus próprios dados) e ao papel `Administrador` (global). Proibido ao papel `Influenciadora`.
* **Criação e Consulta de Briefings/Campanhas:** Permitido ao papel `Marca` (vinculado ao seu ID único) e ao papel `Administrador`. Proibido ao papel `Influenciadora`.

##### 8.2.3 Operações do Contexto de Influenciadoras

* **Leitura e Escrita de Dados Cadastrais e Faturação:** Permitido ao papel `Influenciadora` (restrito ao seu próprio perfil) e ao papel `Administrador` (global). Proibido ao papel `Marca`.
* **Consulta de Cronogramas, Entregas e Histórico Financeiro Pessoal:** Permitido ao papel `Influenciadora` (restrito ao seu próprio `sub`) e ao papel `Administrador`. Proibido ao papel `Marca`.

#### 8.3 Guarda de Segurança e Isolamento Relacional

A validação de permissões é executada de forma mandatória e binária na camada de controlo (`Controller`) antes do encaminhamento do pedido para as regras de negócio:

1. **Verificação de Identidade e Estado:** O sistema valida se o utilizador possui um registo correspondente ao `sub` do token e se o seu estado é `ACTIVE`.
2. **Verificação de Escopo Relacional:** Para o papel `Marca`, o sistema injeta obrigatoriamente o `SUB_PROVIDER` extraído do token como parâmetro implícito de filtragem. Para o papel `Influenciadora`, o parâmetro implícito é a `INFLU_KEY` resolvida a partir do `SUB_PROVIDER` (§11.2), preservando o mesmo parâmetro (`parceiraId`) já usado pelos módulos de Portal. Em ambos os casos a injeção é mecânica e obrigatória em todas as consultas e escritas, impedindo a exposição de dados transfronteiriços entre utilizadores do mesmo nível.

---

*Fim do Capítulo 8. A especificação das permissões e da matriz de controlo de acessos está concluída. Aguardo a sua revisão para avançarmos para o Capítulo 9 — Arquitetura.*

### Capítulo 9 — Arquitetura

O módulo de Identidade e Acesso segue rigorosamente a arquitetura em camadas orientada ao domínio (DDD) estabelecida para o TEAR V2. O fluxo de execução é estritamente unidirecional e síncrono, operando sob o acoplamento topológico: `Entrypoint → Controller → Service → Repository → ACL → Domain`.

#### 9.1 Responsabilidades por Camada no Contexto de Identidade

##### 9.1.1 Entrypoint (`Portal.js` / Endpoints API)

* **Função:** Ponto de entrada e terminação única para as requisições HTTP do Portal (ex: funções expostas para a interface Web).
* **Restrições Absolutas:** É a única camada autorizada a interagir diretamente com `SpreadsheetApp`, `Session` e `LockService`. Chamadas de rede (`UrlFetchApp`) ficam isoladas nos adaptadores (§9.1.7), conforme o contrato de adaptadores já estabelecido no projeto (`src/adapters/_contract.js`: "Pode depender de UrlFetchApp, DriveApp — conforme o adaptador"). O Entrypoint extrai o token bruto vindo do frontend, gerencia o estado físico da sessão e delega o processamento lógico para o respectivo Controller.

##### 9.1.2 Controller (`UsuarioController`)

* **Função:** Orquestração do recebimento de dados desestruturados da requisição e normalização da resposta corporativa. Não existe um `AuthController` separado (ver resolução em §9.2-A) — a renovação/encerramento de sessão continua servida pelo `AcessoController` já existente (SPEC-025); `UsuarioController` cobre exclusivamente login federado, onboarding, moderação e RBAC.
* **Mecanismo:** Captura o payload bruto enviado pelo Entrypoint (o ID Token do Google, como string opaca) e invoca `UsuarioService`. É o único componente responsável por interceptar exceções internas e convertê-las no envelope padronizado de resposta (`src/shared/Envelope.js` — `envelopeOk`/`falharComCodigo`, reaproveitados sem alteração), garantindo que o contrato de retorno `{ success, data | error }` seja mantido independentemente do resultado.

##### 9.1.3 Service (`UsuarioService`)

* **Função:** Centralização das regras de fluxo, coordenação de transações de identidade e verificação de políticas de estado. Único Service novo desta SPEC — não há `AuthService` paralelo.
* **Operação:** Recebe o `sub`/`email`/`name` já validados criptograficamente pelo adaptador `ValidadorDeTokenGoogle` (§9.1.7) e consulta `UsuarioRepository` (`SIS_IDENTIDADES`) para decidir o direcionamento: utilizador inexistente → tenta vinculação a Parceira pré-existente (§5.1-A) antes de abrir onboarding; utilizador existente não-`ACTIVE` → bloqueia com o erro correspondente ao estado; utilizador `ACTIVE` → resolve o identificador de sessão (`INFLU_KEY` via `ParceiraACL`, para Influenciadora; `SUB_PROVIDER`, para Administrador) e reaproveita `Sessao`/`TokenDeSessao`/`SessaoRepository` (domínio e persistência de SPEC-025, sem alteração) para emitir a sessão. Coordena de forma atómica as transações que alteram o estado do utilizador e assegura que os eventos de domínio correlatos só sejam disparados após a confirmação da persistência.

##### 9.1.4 Repository (`UsuarioRepository`)

* **Função:** Abstração dos mecanismos de persistência de dados de usuários e permissões.
* **Operação:** Expõe métodos puramente semânticos para as camadas de negócio (ex: `buscarPorSub()`, `buscarPorEmail()` — uso restrito à checagem de correspondência candidata no fluxo de vinculação, §5.1-A/RN-02, nunca à resolução automática de identidade —, `salvar()`). Não possui conhecimento sobre cabeçalhos, colunas físicas ou formatação interna da planilha Google Sheets.

##### 9.1.5 ACL — Camada Anticorrupção (`UsuarioACL`)

* **Função:** Tradução bidirecional entre o modelo conceitual do domínio e a infraestrutura física de armazenamento.
* **Mecanismo:** Mapeia dinamicamente os objetos de domínio puramente tipados para matrizes bidimensionais compatíveis com as abas do Sheets (e vice-versa). A resolução das propriedades é feita obrigatoriamente através do mapeamento de strings de cabeçalho, blindando o repositório contra quebras causadas por inserções ou deslocamentos manuais de colunas efetuados por utilizadores na interface da planilha.

##### 9.1.6 Domain (`Usuario` / `Identidade`)

* **Função:** Núcleo puro de regras de negócio, invariantes de identidade e controle de estados lógicos.
* **Restrições Absolutas:** Código JavaScript de fidelidade pura, sem qualquer acoplamento com APIs do ecossistema Google, HTML ou primitivas HTTP. Contém a máquina de estados conceitual (`PENDING`, `ACTIVE`, `INACTIVE`, `REJECTED`) e as validações intrínsecas de transição de papéis funcionais (`Administrador`, `Marca`, `Influenciadora`).
* **Fronteira de Agregado:** `Usuario` é a raiz de um bounded context próprio (identidade e acesso), distinto do agregado soberano `Parceira` (`CONTRATO_SOBERANO.md` §6.1). Para o papel Influenciadora, `Usuario` referencia `Parceira` apenas por identificador (`INFLU_KEY`, ligação fraca) — nunca modela, herda ou duplica os seus atributos de negócio (condição comercial, contratos, entregas).

##### 9.1.7 Adapter (`ValidadorDeTokenGoogle`)

* **Função:** Cumpre a porta de verificação de identidade federada, seguindo o mesmo contrato de adaptadores já estabelecido no projeto (`src/adapters/_contract.js`: um adaptador por dependência externa, falha explícita tratada pelo chamador).
* **Mecanismo:** Recebe o ID Token bruto e valida-o por meio do endpoint `tokeninfo` do provedor de identidade (chamada de rede isolada neste adaptador, via `UrlFetchApp`), conferindo `aud` (client_id do TEAR), `iss` (emissor oficial) e a validade temporal (`exp`/`iat`) — ver §14.1. Em caso de êxito, devolve `{ sub, email, name }`; em qualquer falha (assinatura, `aud`/`iss`, expiração, ou indisponibilidade do provedor), lança exceção fail-closed — nunca retorna identidade parcial ou presumida.
* **Não reaproveita** `Autenticador`/`Credencial`/`JanelaDeBloqueio`/`BloqueioRepository` (SPEC-025) — decisão técnica justificada em §9.2-A, não duplicação.

#### 9.2 Fluxo Arquitetural de Autenticação e Onboarding

O desacoplamento mecânico é garantido pela separação estrita entre a validação criptográfica da identidade (adaptador `ValidadorDeTokenGoogle`) e o ciclo de vida do utilizador dentro do TEAR (`UsuarioService`):

1. O frontend realiza o handshake com o Identity Provider do Google e encaminha o ID Token para o **Entrypoint**.
2. O **Entrypoint** repassa o token bruto (sem validá-lo) para o **Controller**.
3. O **Controller** invoca o **Service**, que primeiro delega ao adaptador `ValidadorDeTokenGoogle` a validação criptográfica (§9.1.7). Token inválido → erro `ERR_AUTH_INVALID_TOKEN` (§14.3), sem consultar o Repository.
4. Com `sub`/`email`/`name` validados, o **Service** consulta o **Repository** (`SIS_IDENTIDADES`) para determinar o direcionamento lógico:
* **Utilizador Existente e `ACTIVE`:** o Service resolve o identificador de sessão (`INFLU_KEY` via `ParceiraACL`, para Influenciadora; `SUB_PROVIDER`, para Administrador) e reaproveita `Sessao`/`TokenDeSessao`/`SessaoRepository` (SPEC-025, sem alteração) para emitir e persistir a sessão. O Controller encapsula os metadados no Envelope de sucesso.
* **Utilizador Existente e não-`ACTIVE`:** bloqueado com o erro correspondente ao estado (§14.3) — nenhuma sessão é emitida.
* **Utilizador Inexistente:** tenta a vinculação a uma Parceira pré-existente (§5.1-A); não havendo correspondência, sinaliza Onboarding Pendente, sem criar sessão nem registro transiente.

#### 9.2-A Resolução da Pendência Arquitetural (Q-07)

A revisão arquitetural desta SPEC identificou sobreposição funcional entre a stack então proposta (`AuthController`/`AuthService` paralelos) e a stack de sessão já implementada em SPEC-025. Resolução adotada, seguindo o próprio design de SPEC-025 (`VerificadorDeCredencialLegado`: "trocar o modelo de autenticação = trocar só o adaptador"):

* **Reaproveitado sem alteração:** `Sessao`, `TokenDeSessao`, `SessaoRepository`, `SessaoACL` (aba `SESSOES`), `AcessoController.renovar()`/`.sair()`, `AcessoPortalService.renovar()`/`.sair()`, `geradorDeTokenUuid()`, `relogioDoSistema()`, `comTravaDeAcesso()`, `Envelope.js`. A renovação e o encerramento de sessão do Portal continuam servidos pelas funções já expostas (`renovarSessaoDoPortal`/`sairDoPortal`) — nenhuma duplicação nesse eixo.
* **Não reaproveitado (decisão técnica, não duplicação):** `Autenticador`/`Credencial`/`JanelaDeBloqueio`/`BloqueioRepository`/`VerificadorDeCredencialLegado`. O modelo de bloqueio por tentativas (RN-02 de SPEC-025) foi desenhado para mitigar força bruta contra um segredo compartilhado adivinhável (5 dígitos de CNPJ). Um ID Token assinado criptograficamente não é adivinhável — força bruta não é uma ameaça aplicável a este mecanismo; reaproveitar o bloqueio por tentativas aqui aplicaria uma proteção desenhada para outro modelo de ameaça, sem benefício de segurança real. `VerificadorDeCredencialLegado` permanece disponível caso algum fluxo legado não migrado ainda dependa dele — fora do escopo desta SPEC.
* **Genuinamente novo (não existia em SPEC-025):** `Usuario`/`Identidade` (domínio), `UsuarioACL`/`UsuarioRepository` (`SIS_IDENTIDADES`, `BASE_ADMINISTRADORES`), `ValidadorDeTokenGoogle` (adaptador), `UsuarioService`/`UsuarioController` (orquestração de identidade, estado e papel — SPEC-025 nunca teve conceito de papel, estado de conta ou onboarding).

---

*Fim do Capítulo 9. A especificação da arquitetura do módulo está concluída. Aguardo a sua revisão para avançarmos para o Capítulo 10 — Modelo de Dados.*

### Capítulo 10 — Modelo de Dados

O modelo de dados do módulo de Identidade e Acesso foi desenhado para garantir a integridade referencial, o isolamento de responsabilidades e a eficiência de leitura no ecossistema baseado em tabelas (abas) do Google Sheets.

A arquitetura adota uma estratégia de **Segregação por Coesão de Domínio**, separando a tabela de autenticação central das tabelas de propriedades específicas de cada ator.

#### 10.1 Justificação Arquitetural da Estrutura

* **Centralização de Login:** A aba `SIS_IDENTIDADES` funciona como o único ponto de consulta para validação de sessões e verificação de estados de conta. Isto evita que o sistema tenha de fazer varreduras em múltiplas abas concorrentes durante o aperto de mão (*handshake*) inicial de login.
* **Prevenção contra Degradação de Desempenho:** O Google Sheets apresenta perda de performance à medida que o volume de colunas e dados cresce. Separar os dados corporativos das Marcas e os dados operacionais das Influenciadoras reduz o tamanho horizontal das tabelas, otimizando o tempo de varredura executado pela Camada Anticorrupção (ACL).
* **Preservação do Contrato Soberano:** A integração com o módulo de Influenciadoras é feita através da injeção da coluna `SUB_PROVIDER` na aba soberana já existente `BASE DE DADOS` (nome físico oficial definido em `CONTRATO_SOBERANO.md` §7.1), associada à chave soberana `INFLU_KEY` — nunca a substituindo. `INFLU_KEY` permanece a chave relacional oficial de `Parceira`; `SUB_PROVIDER` é um atributo de identidade federada dependente dela, preservando o histórico de negócio sem misturar dados confidenciais de outros atores.



---

#### 10.2 Dicionário de Estruturas (Abas do Banco de Dados)

##### 10.2.1 Aba: `SIS_IDENTIDADES`

Esta aba armazena exclusivamente as credenciais de federação e o estado lógico global de todos os utilizadores da plataforma.

| Nome da Coluna (Cabeçalho) | Tipo de Dado | Restrição | Descrição |
| --- | --- | --- | --- |
| `SUB_PROVIDER` | String (Alfanumérico) | **Chave Primária (PK)** | Identificador imutável e permanente (`sub`) retornado pelo provedor de identidade. |
| `EMAIL_PERFIL` | String (Texto) | Único / Mutável | Endereço de e-mail atual do utilizador. Usado estritamente para contacto e exibição. |
| `PAPEL_ATOR` | String (Enum) | Obrigatório | Define o papel: `ADMINISTRADOR`, `MARCA` ou `INFLUENCIADORA`. |
| `ESTADO_CONTA` | String (Enum) | Obrigatório | Estado atual: `PENDING`, `ACTIVE`, `INACTIVE` ou `REJECTED`. |
| `DATA_CRIACAO` | Timestamp (Data/Hora) | Obrigatório | Data e hora do primeiro acesso (onboarding). |
| `ULTIMO_ACESSO` | Timestamp (Data/Hora) | Opcional | Registro da última autenticação bem-sucedida do utilizador. |

##### 10.2.2 Aba: `BASE_ADMINISTRADORES`

Armazena os dados complementares dos utilizadores que possuem o papel de administração interna do Estúdio Elã.

| Nome da Coluna (Cabeçalho) | Tipo de Dado | Restrição | Descrição |
| --- | --- | --- | --- |
| `SUB_PROVIDER` | String (Alfanumérico) | **Chave Estrangeira (FK)** | Vínculo obrigatório com a tabela `SIS_IDENTIDADES`. |
| `NOME_COMPLETO` | String (Texto) | Obrigatório | Nome do operador interno para exibição em auditorias. |
| `AREA_RESPONSABILIDADE` | String (Texto) | Opcional | Departamento do administrador (ex: Financeiro, Logística, Atendimento). |

##### 10.2.3 Aba: `BASE_MARCAS`

> 🟠 Não implementada nesta unidade de trabalho — depende da decisão de escopo do ator `Marca` (§4.2).

Armazena os dados cadastrais e as informações corporativas das empresas parceiras comerciais.

| Nome da Coluna (Cabeçalho) | Tipo de Dado | Restrição | Descrição |
| --- | --- | --- | --- |
| `SUB_PROVIDER` | String (Alfanumérico) | **Chave Estrangeira (FK)** | Vínculo obrigatório com a tabela `SIS_IDENTIDADES`. |
| `CNPJ_EMPRESA` | String (Numérico) | Único / Obrigatório | Cadastro Nacional da Pessoa Jurídica da Marca. |
| `RAZAO_SOCIAL` | String (Texto) | Obrigatório | Nome de registo legal da empresa. |
| `NOME_FANTASIA` | String (Texto) | Obrigatório | Nome comercial utilizado na interface do ecossistema. |
| `TELEFONE_CORPORATIVO` | String (Texto) | Obrigatório | Contacto telefónico principal da organização. |

##### 10.2.4 Aba: `BASE DE DADOS` (Extensão de Identidade)

Aba de domínio soberano das influenciadoras (nome físico oficial definido em `CONTRATO_SOBERANO.md` §7.1, chaveada por `INFLU_KEY`; ver também `ADR-010`). O módulo de Identidade apenas injeta e consome a coluna de ancoragem abaixo — não redefine, renomeia nem substitui a chave soberana existente.

| Nome da Coluna (Cabeçalho) | Tipo de Dado | Restrição | Descrição |
| --- | --- | --- | --- |
| `INFLU_KEY` | String (Alfanumérico) | **Chave Primária Soberana (herdada)** | Chave relacional oficial da Influenciadora, definida em `CONTRATO_SOBERANO.md` §7.1. Não é gerida por este módulo. |
| `SUB_PROVIDER` | String (Alfanumérico) | Único / Opcional | Identificador federado do Google associado à linha existente de `INFLU_KEY`, gravado após a vinculação de identidade (§5.1-A) ou no cadastro novo (§5.3). Não substitui `INFLU_KEY` como chave relacional. |

---

#### 10.3 Regras de Integridade e Relacionamento

* **Cascata Lógica de Inativação:** A alteração do campo `ESTADO_CONTA` para `INACTIVE` ou `REJECTED` na aba `SIS_IDENTIDADES` anula imediatamente a validade das chaves estrangeiras `SUB_PROVIDER` nas tabelas de especialização, suspendendo o acesso do utilizador sem apagar os seus dados históricos.
* **Resolução Dinâmica por Cabeçalho (ACL):** A leitura e escrita nestas estruturas não utilizam índices fixos de colunas (ex: Coluna A, Coluna B). A camada ACL localiza as propriedades rastreando o texto exato dos cabeçalhos definidos neste capítulo, permitindo a expansão horizontal de novas colunas futuras sem quebra de compatibilidade com o código.

---

*Fim do Capítulo 10. O modelo de dados e a estratégia de tabelas segregadas estão formalizados. Aguardo a sua revisão para avançarmos para o Capítulo 11 — Integrações e Serviços.*

### Capítulo 11 — Integrações e Serviços

O módulo de Identidade e Acesso opera como o ponto central de segurança do ecossistema TEAR V2, integrando-se com serviços externos de federação e expondo interfaces de serviços e eventos para consumo dos demais módulos internos.

#### 11.1 Integração com o Provedor de Identidade Externo

A comunicação com o provedor de identidade externo é estritamente unidirecional e baseada em tokens de segurança (OpenID Connect / OAuth2), seguindo o fluxo de integração estabelecido:

* **Validação do ID Token (JWT):** O ecrã de interface (frontend) obtém o token assinado diretamente do provedor de identidade e envia-o ao backend do TEAR V2. O adaptador `ValidadorDeTokenGoogle` (§9.1.7) delega a validação da assinatura e integridade do token ao endpoint oficial de verificação do provedor (`tokeninfo`), evitando reimplementar verificação criptográfica de assinatura RSA localmente — o Google Apps Script não expõe uma API nativa para isso.
* **Consumo de Claims de Segurança:** Após a validação criptográfica, o módulo extrai exclusivamente três atributos do payload:
* `sub`: O identificador estável utilizado como chave primária interna.
* `email`: O endereço eletrónico para fins de contacto.
* `name`: O nome de exibição inicial do perfil.


* **Isolamento de Infraestrutura:** Toda a comunicação de rede para validação de chaves e tokens é isolada na camada de `Entrypoint` (utilizando o serviço de chamadas HTTP nativo do ambiente de runtime), impedindo que as camadas de domínio tenham conhecimento sobre os protocolos de rede do provedor.

#### 11.2 Serviços Expostos ao Ecossistema Interno

O módulo disponibiliza um conjunto de serviços de aplicação e domínio que devem ser obrigatoriamente consumidos pelos outros módulos para garantir a segurança das operações:

* **Serviço de Verificação de Sessão (`UsuarioService.validarSessao`):** Método invocado no início de cada execução para confirmar se o utilizador está autenticado e se a sua conta técnica na tabela `SIS_IDENTIDADES` encontra-se no estado `ACTIVE`. Internamente reaproveita `AcessoPortalService.renovar()` (SPEC-025) para resolver o token na Sessão, mesmo padrão já usado por `PortalDeConteudoService`/`PerfilPortalService` (SPEC-027/032).
* **Serviço de Guarda de Segurança (`UsuarioService.exigirPapel`):** Interceptador que recebe o papel exigido por uma funcionalidade e barra a execução caso o ator logado não possua o privilégio correspondente (ex: impedir que uma `Influenciadora` aceda a um serviço restrito ao `Administrador`).
* **Serviço de Contexto do Utilizador (`UsuarioService.obterContexto`):** Fornece aos módulos dependentes as amarrações do utilizador logado. Para o papel `Influenciadora`, devolve a `INFLU_KEY` (chave soberana, `CONTRATO_SOBERANO.md` §7.1) já resolvida a partir do `SUB_PROVIDER`, preservando o parâmetro implícito de filtragem (`parceiraId`) já em uso pelos módulos de Portal (SPEC-027/030/032). Para os papéis `Administrador` e `Marca`, o próprio `SUB_PROVIDER` é usado como parâmetro implícito de isolamento, por não existir chave soberana equivalente para esses atores.

#### 11.3 Mecanismo de Eventos de Domínio

Para evitar o acoplamento direto entre as tabelas físicas da base de dados, o módulo de Identidade e Acesso comunica alterações de ciclo de vida através de **Eventos de Domínio** síncronos e sequenciais:

* **`UsuarioCadastradoEvent`:** Disparado imediatamente após um novo utilizador concluir o formulário de onboarding inicial. Permite que o sistema envie alertas visuais para o painel de moderação da administração.
* **`UsuarioAprovadoEvent`:** Emitido no momento exato em que o Administrador altera o estado da conta de `PENDING` para `ACTIVE`. Este evento é consumido pelo módulo de Contratos para ativar as amarrações operacionais da Influenciadora na aba `BASE DE DADOS` (§10.2.4) ou inicializar o espaço de trabalho da Marca.


* **`UsuarioInativadoEvent`:** Disparado quando um utilizador é suspenso pela administração. Os outros módulos reagem a este evento interrompendo imediatamente o processamento de quaisquer rotinas automáticas, relatórios ou agendamentos vinculados àquele utilizador específico.

---

*Fim do Capítulo 11. A especificação das integrações, serviços internos e eventos de domínio está concluída. A documentação encontra-se congelada neste ponto e aguarda a sua revisão para avançarmos para o Capítulo 12 — Fluxos de Controle (Sequência).*

### Capítulo 12 — Fluxos de Controle (Sequência)

Este capítulo descreve a sequência de interação e a passagem de responsabilidades entre as camadas do sistema para os três principais fluxos operacionais do módulo.

#### 12.1 Fluxo de Autenticação de Utilizador Registado (Login)

Este fluxo detalha os passos executados quando um utilizador que já concluiu o onboarding tenta aceder à plataforma:

1. **Frontend → Entrypoint (`Portal.js`):** O ecrã inicial envia o token criptográfico obtido junto ao provedor de identidade.
2. **Entrypoint → Controller (`UsuarioController`):** Repassa o token bruto, sem validá-lo (validação é do adaptador, passo 3).
3. **Controller → Service (`UsuarioService`) → Adapter (`ValidadorDeTokenGoogle`):** Valida assinatura/`exp`/`iat`/`aud`/`iss` (§9.1.7/§14.1) e extrai `sub`/e-mail.
4. **Service → Repository (`UsuarioRepository`):** Solicita a busca do utilizador através do identificador técnico `sub`.
5. **Repository → ACL (`UsuarioACL`):** Executa a varredura dinâmica na aba `SIS_IDENTIDADES` com base no cabeçalho indexador.
6. **ACL → Repository:** Retorna a entidade de domínio instanciada com os dados extraídos da planilha.
7. **Repository → Service:** Devolve o objeto `Usuario` carregado com o seu respetivo papel e estado.
8. **Service:** Consulta a entidade `Usuario` (camada Domain) para verificar o estado da conta:
* Se o estado for `ACTIVE`, o Service resolve o identificador de sessão (`INFLU_KEY`/`SUB_PROVIDER`, §9.2) e reaproveita `Sessao`/`TokenDeSessao`/`SessaoRepository` (SPEC-025, §9.2-A) para emitir e persistir a sessão.


9. **Service → Controller:** Retorna os metadados do utilizador autenticado e o painel correspondente ao seu papel.
10. **Controller → Entrypoint:** Formata os dados sob o padrão do `Envelope.js` de sucesso.
11. **Entrypoint → Frontend:** Disponibiliza a resposta que redireciona o utilizador para a sua área logada.

#### 12.2 Fluxo de Primeiro Acesso e Onboarding (Cadastro)

Este fluxo descreve o comportamento do ecossistema quando um novo utilizador tenta aceder à plataforma pela primeira vez:

1. **Camadas Iniciais (Entrypoint → Controller → Service):** O token é validado e o `sub` é extraído.
2. **Service → Repository:** Solicita a busca pelo `sub` na base de dados.
3. **Repository → Service:** Retorna vazio (`null`), indicando que o utilizador não possui registo interno.
3.1. **Service → Repository (papel Influenciadora, §5.1-A):** Antes de sinalizar onboarding do zero, tenta localizar um registo compatível em `BASE DE DADOS`. Se localizado e confirmado pela utilizadora, o fluxo segue direto para o passo 9 (persistência), vinculando `SUB_PROVIDER` à `Parceira` existente em vez de criar um cadastro novo.
4. **Service → Controller:** Alerta que a identidade externa é válida, mas não existe um utilizador associado no TEAR.
5. **Controller → Frontend:** Envia uma resposta envelopada instruindo a interface a travar a navegação operacional e a renderizar o formulário de onboarding de primeiro acesso.
6. **Frontend → Entrypoint:** O utilizador preenche os dados, seleciona o seu papel operacional e submete o cadastro.
7. **Entrypoint → Controller → Service:** O payload de cadastro é validado sintaticamente e encaminhado para persistência.
8. **Service → Repository:** Comanda a gravação do registo básico na aba `SIS_IDENTIDADES` com o estado fixado em `PENDING`, e encaminha os dados complementares para a aba de especialização correspondente (`BASE_MARCAS` ou `BASE DE DADOS`, §10.2.4).


9. **Repository → ACL:** Converte os objetos de negócio em linhas bidimensionais referenciadas por cabeçalho dinâmico e grava no Google Sheets.
10. **Service:** Instancia o evento `UsuarioCadastradoEvent` na camada de domínio e encerra a transação com segurança através do `LockService` no Entrypoint.

#### 12.3 Fluxo de Aprovação Administrativa

Este fluxo descreve a ação de moderação executada pela equipa interna do Estúdio Elã:

1. **Frontend → Entrypoint:** Um utilizador com papel `ADMINISTRADOR` aciona o comando de aprovação para um registo pendente.
2. **Entrypoint → Controller → Service:** O pedido é intercetado pela guarda de segurança, que valida os privilégios do administrador antes de encaminhar o identificador do utilizador a ser aprovado.
3. **Service → Repository:** Solicita o carregamento do registo do utilizador alvo a partir da aba `SIS_IDENTIDADES`.
4. **Service → Domain (`Usuario`):** Invoca a regra de transição de estado na entidade de domínio (`Usuario.aprovar()`). A entidade altera internamente o seu estado de `PENDING` para `ACTIVE`.
5. **Service → Repository:** Solicita a atualização do estado do utilizador na persistência.
6. **Repository → ACL → Planilha:** A linha correspondente na aba `SIS_IDENTIDADES` tem o seu campo `ESTADO_CONTA` atualizado para `ACTIVE`.
7. **Service:** Dispara o evento de domínio `UsuarioAprovadoEvent` síncronamente, permitindo que o módulo de Contratos tome conhecimento da aprovação e inicialize as rotinas operacionais associadas àquele ator.



---

*Fim do Capítulo 12. Os fluxos de controlo e sequência estrutural estão formalizados. Aguardo a sua revisão para avançarmos para o Capítulo 13 — UX/UI (Componentes Visuais).*

Capítulo 13 — Interface e Componentes Visuais (UX/UI)Este capítulo especifica o comportamento lógico, os componentes abstratos e as regras de navegação que as interfaces do utilizador (frontend) devem respeitar ao interagir com o módulo de Identidade e Acesso.13.1 Ecrã de Entrada Unificado (Login)Componente Base: Um ponto de entrada único contendo exclusivamente a opção de autenticação através do provedor de identidade federado.Comportamento Lógico: Fica impedido qualquer formulário local de inserção de e-mail e senha. O botão dispara diretamente o fluxo de handshake com a API externa do provedor.Estados de Transição: O ecrã aguarda o retorno do token criptográfico assinado e envia-o imediatamente ao backend para validação de rota através do UsuarioController.13.2 Fluxo de Onboarding Nativo (Primeiro Acesso)Ativação: Renderizado de forma mandatória apenas quando o backend retorna o status de utilizador não localizado.Componentes de Captura:Seletor de Papel: Componente de escolha exclusiva onde o utilizador define se está a registar-se como Marca ou Influenciadora.Formulário Dinâmico: Campos de texto estruturados de preenchimento obrigatório com base no papel selecionado (dados corporativos para marcas ou dados de identificação e contacto para influenciadoras — dados contratuais permanecem fora deste formulário, §1.4/§3.1.2).Restrição de Navegação: O menu de navegação lateral, cabeçalhos operacionais e painéis de dados do ecossistema TEAR permanecem totalmente ocultos e inacessíveis até que o utilizador submeta o formulário com sucesso.13.3 Painéis de Bloqueio Preventivo e Estados de EsperaPainel Pendente: Exibido imediatamente após a submissão do onboarding. Apresenta uma mensagem fixa informando que os dados foram guardados com sucesso e que a conta aguarda a análise e aprovação da administração. O utilizador fica impedido de avançar.Painel Suspenso/Rejeitado: Exibido caso o utilizador tente fazer login e a sua conta esteja marcada na tabela SIS_IDENTIDADES como INACTIVE ou REJECTED. Apresenta uma mensagem clara de recusa de acesso, bloqueando qualquer outra interação com o sistema.13.4 Painel de Moderação de Identidades (Visão do Administrador)Componente de Listagem: Área restrita inserida na visão do papel Administrador, que consome o repositório filtrando utilizadores com ESTADO_CONTA = PENDING.Componentes de Ação: Botões binários de ação direta ("Aprovar" / "Rejeitar") associados a cada linha de utilizador pendente. O acionamento dispara o fluxo síncrono de transição de estado detalhado no capítulo anterior.Capítulo 14 — Segurança, Auditoria e ExceçõesEste capítulo estabelece as barreiras de proteção criptográfica, os mecanismos de rastreabilidade e a política de tratamento de erros para mitigar riscos de acessos indevidos e corrupção de dados.14.1 Diretivas de Segurança e Proteção de FronteiraValidação Criptográfica Assíncrona: O adaptador `ValidadorDeTokenGoogle` (§9.1.7) rejeita qualquer ID Token que o endpoint oficial de verificação do provedor (`tokeninfo`) não confirme como íntegro.Validação de Emissor e Audiência: O sistema verifica obrigatoriamente se a claim `iss` corresponde ao emissor oficial do provedor de identidade e se a claim `aud` corresponde ao identificador de cliente (`client_id`) registado do TEAR V2. Tokens válidos emitidos para qualquer outra aplicação são rejeitados, mesmo com assinatura íntegra.Validação de Janela Temporal (TTL): O sistema inspeciona obrigatoriamente as claims de expiração do token (exp) e tempo de emissão (iat). Tokens com tempo de vida expirados ou emitidos no futuro são sumariamente descartados na camada de Entrypoint.Controlo de Concorrência Transacional: Toda a alteração de estado cadastral ou inserção de novos utilizadores utiliza de forma mandatória o serviço LockService nativo no ponto de entrada. Isto impede condições de corrida (race conditions) e duplicidade de registros na tabela SIS_IDENTIDADES caso ocorram cliques múltiplos consecutivos na interface.14.2 Infraestrutura de Auditoria OperacionalRastreabilidade de Estado: Toda alteração aplicada aos campos ESTADO_CONTA ou PAPEL_ATOR na aba SIS_IDENTIDADES deve salvar automaticamente o timestamp exato da modificação e o identificador (sub) do administrador responsável pela ação.Imutabilidade de Histórico: Os logs de alteração e registros de acessos gerados pelo sistema são de escrita exclusiva (append-only). O ecossistema TEAR V2 não expõe nenhum método ou serviço capaz de apagar, editar ou truncar linhas de histórico de auditoria.14.3 Tratamento de Exceções e Respostas de Erro (Política de Falha Segura)Em alinhamento com a padronização de envelopes do sistema, o módulo intercepta anomalias lógicas e responde sob a estrutura de falha protegida (src/shared/Envelope.js):Cenário de ExceçãoCódigo / Mensagem InternaComportamento Lógico do SistemaToken Inválido ou VioladoERR_AUTH_INVALID_TOKENInterrompe o processamento imediatamente, limpa os cookies de sessão locais da interface e redireciona para o ecrã de login unificado.Tentativa de EscalonamentoERR_AUTH_UNAUTHORIZED_ROLEGrava um alerta no log de auditoria com os dados do infrator e devolve uma resposta impeditiva através do envelope de erro.Utilizador SuspensoERR_AUTH_ACCOUNT_INACTIVERecusa a geração de sessão de trabalho e renderiza o painel de bloqueio preventivo na interface do utilizador.Erro na Persistência (Sheets)ERR_SYS_PERSISTENCE_FAILAciona o rollback transiente da operação de domínio, liberta o trinco de segurança (LockService) e informa o utilizador sobre a indisponibilidade momentânea do serviço, sem expor caminhos físicos de tabelas ou dados do sistema.Fim do Capítulo 13 e do Capítulo 14. A especificação visual abstrata e os mecanismos de segurança e proteção estão consolidados. Aguardo a sua revisão para avançarmos para o Capítulo 15 — Estratégia de Testes, completando formalmente a SPEC-035.

### Capítulo 15 — Estratégia de Testes

A estratégia de testes para o módulo de Identidade e Acesso visa garantir a robustez das validações de segurança, a precisão da máquina de estados e a integridade do mapeamento de dados, mantendo a conformidade operacional estabelecida no ecossistema TEAR V2.

#### 15.1 Testes Unitários (Camadas Puras: Domain e Service)

Os testes unitários devem isolar a lógica de negócio de qualquer infraestrutura ou dependência externa do ambiente de runtime.

* **Validação da Máquina de Estados:** Testar exaustivamente as transições permitidas e proibidas na entidade `Usuario` (ex: garantir que uma conta `PENDING` pode passar para `ACTIVE`, mas nunca diretamente de `PENDING` para `INACTIVE`).
* **Regras de Autorização (RBAC):** Validar se o método interceptador de permissões barra ou concede o acesso corretamente com base na matriz de papéis (`Administrador`, `Marca`, `Influenciadora`) e estados lógicos.
* **Inspeção de Claims do Token:** Testar o comportamento do serviço de autenticação diante de payloads de tokens simulados (mocks), incluindo casos de tokens expirados (`TTL`), tokens com assinaturas inválidas ou ausência do atributo estável `sub`.

#### 15.2 Testes de Integração (Camadas: Repository e ACL)

Os testes de integração validam o comportamento combinado das camadas de abstração com a estrutura física de persistência.

* **Resolução Dinâmica de Cabeçalhos:** Garantir que a camada ACL localiza e mapeia corretamente as informações mesmo se a ordem física das colunas nas abas `SIS_IDENTIDADES`, `BASE_MARCAS` ou `BASE_ADMINISTRADORES` for alterada na planilha.
* **Persistência Segregada:** Validar se a criação de um novo utilizador escreve simultaneamente a linha de credenciais na aba central e a linha de especialização na respetiva tabela do ator, sob o mesmo identificador `SUB_PROVIDER`.
* **Garantia de Isenção de Efeitos Colaterais:** Confirmar que a camada de Domínio permanece completamente isolada e intocada pelas operações de leitura e escrita executadas pela ACL no Google Sheets.

#### 15.3 Matriz de Cenários Críticos (Casos de Teste Obrigatórios)

Para homologação do módulo, os seguintes cenários devem apresentar cobertura total de sucesso ou falha protegida:

| ID | Cenário de Teste | Entrada Esperada | Comportamento Esperado | Resultado no Sistema |
| --- | --- | --- | --- | --- |
| **CT-01** | Login de utilizador ativo | Token válido com `sub` existente e estado `ACTIVE` | Identificar o ator e carregar o contexto operacional | Redirecionamento direto para o painel do papel correspondente |
| **CT-02** | Primeiro acesso (Onboarding) | Token válido com `sub` inexistente na base | Barrar acesso operacional e expor formulário de cadastro | Conta criada como `PENDING` na aba `SIS_IDENTIDADES` |
| **CT-03** | Bloqueio de utilizador suspenso | Token válido com `sub` existente e estado `INACTIVE` | Intercetar o pedido na camada de controlo e rejeitar a sessão | Retorno do envelope com o erro `ERR_AUTH_ACCOUNT_INACTIVE` |
| **CT-04** | Tentativa de violação de privilégios | Utilizador logado como `Influenciadora` acede a rota de moderação | Intercetar a chamada através da guarda de segurança | Execução barrada com o erro de autorização `ERR_AUTH_UNAUTHORIZED_ROLE` |
| **CT-05** | Concorrência no cadastro | Cliques múltiplos simultâneos no envio do onboarding | Ativar o mecanismo de exclusão mútua (`LockService`) no entrypoint | Apenas um registo é persistido; os pedidos concorrentes são controlados com segurança |
| **CT-06** | Vinculação de identidade a Parceira pré-existente | Token válido com `sub` inexistente, e-mail correspondente a uma `Parceira` já cadastrada em `BASE DE DADOS` | Localizar o registo candidato e propor vinculação em vez de abrir cadastro do zero (§5.1-A) | `SUB_PROVIDER` gravado na linha existente via `INFLU_KEY`; nenhum registo duplicado criado |

---

*Fim da SPEC-035 — Identidade e Acesso. O documento está completamente concluído e formalizado em todas as suas 15 secções estruturais.*