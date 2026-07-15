# SPEC — TEAR V2 · Entrega 01: Cadastro e Base de Influenciadoras

**Status:** pronta para implementação após as decisões arquiteturais pendentes serem definidas  
**Fonte exclusiva de requisitos:** `PRD.md`  
**Escopo:** primeira entrega funcional do TEAR V2. Esta SPEC não define tecnologia, arquitetura, stack, arquivos físicos ou código.

## 1. Funcionalidade prioritária

A primeira funcionalidade do TEAR V2 é **Cadastro e Base de Influenciadoras**.

Ela é prioritária porque a abertura de ciclo mensal usa exclusivamente influenciadoras com status `ON`, e os demais módulos dependem de seus dados cadastrais, comerciais, bancários e de endereço. O PRD também define este módulo como a origem dos dados usados por ciclo mensal, pagamentos, logística, contratos, briefing e Portal.

## 2. Objetivo da entrega

Disponibilizar uma base de influenciadoras que permita:

1. receber o cadastro inicial por formulário externo;
2. criar a influenciadora inicialmente inativa (`OFF`);
3. permitir à equipe ativar ou inativar a influenciadora;
4. permitir à equipe editar os dados contratuais;
5. preencher o endereço a partir do CEP, sem impedir o salvamento dos dados principais se a integração estiver indisponível.

Esta entrega estabelece a base necessária para os módulos posteriores, mas não os implementa.

## 3. Requisitos funcionais

### RF-001 — Cadastro inicial

O sistema deve permitir o cadastro de uma nova influenciadora por formulário externo.

O cadastro deve criar um registro de influenciadora com status inicial `OFF`. A ativação não pode ocorrer automaticamente como resultado do cadastro.

Os dados confirmados pelo PRD para a entidade são: nome/chave, cupom, e-mail, CNPJ, chave PIX, endereço completo, valor total contratado, quantidades contratadas de Reels/Carrossel/Stories, quantidade de looks, canais, prazo de uso de imagem e status.

### RF-002 — Ativação e inativação

O sistema deve permitir à equipe Jescri/Estúdio Elã alterar manualmente o status da influenciadora entre `ON` e `OFF`.

### RF-003 — Endereço por CEP

O sistema deve preencher automaticamente os componentes de endereço a partir do CEP: rua, bairro, cidade e UF. O endereço completo deve refletir o CEP e os componentes de endereço disponíveis, inclusive número e complemento quando informados.

O preenchimento deve ser aplicado no cadastro inicial e em edições posteriores de CEP, número ou complemento.

Se o serviço de CEP estiver indisponível ou não puder resolver o CEP, o cadastro ou a edição dos dados principais deve continuar possível.

### RF-004 — Dados contratuais

O sistema deve permitir à equipe editar os dados contratuais da influenciadora: valor, quantidades contratadas, prazo e canais de uso de imagem e referência à planilha externa de looks.

### RF-005 — Consulta da base pela equipe

A equipe deve conseguir consultar a base de influenciadoras ativas e inativas para localizar e editar uma influenciadora.

**Decisão arquitetural pendente:** o PRD não define interface, mecanismos de busca, ordenação, paginação, proteção de acesso ou campos exibidos em listagens.

## 4. Regras de negócio preservadas

| Identificador | Regra |
|---|---|
| RN-01 | Toda influenciadora proveniente do formulário de cadastro nasce com `STATUS = OFF`. A ativação para `ON` é decisão manual da equipe. |
| RN-02 | O endereço completo é resolvido a partir do CEP no cadastro e em edições posteriores de CEP, número ou complemento. |
| RN-03 | Somente influenciadoras com `STATUS = ON` participam de novo ciclo mensal e geração de contrato. Esta entrega deve preservar o status para que os módulos futuros apliquem a regra. |

Não existe no PRD regra para o que ocorre quando uma influenciadora é inativada com pendências abertas de um ciclo já iniciado. Como ciclo mensal não faz parte desta entrega, esse comportamento não será definido nem implementado agora.

## 5. Escopo delimitado

### Incluído

- formulário externo de cadastro;
- criação de registro inativo;
- manutenção da base pela equipe;
- ativação e inativação manual;
- edição de dados contratuais;
- preenchimento de endereço por CEP com tolerância à indisponibilidade da integração.

### Fora do escopo

- ciclo mensal, briefing, ativações, upload de conteúdo e histórico;
- pagamentos, logística, rastreio e geração de mensagens;
- contratos e geração de documentos;
- portal da influenciadora, login por cupom e senha, bloqueio por tentativas e sessão;
- edição de perfil pela própria influenciadora;
- notificações automáticas, WhatsApp automatizado e gateway de pagamento;
- papéis e permissões distintos na equipe;
- multimarcas, aplicativo móvel e dashboards de gestão;
- migração da planilha oficial e sincronização com o V1;
- regras de LGPD, retenção ou expurgo de dados pessoais e bancários.

## 6. Premissas

- O TEAR V2 continua atendendo uma única marca, Jescri.
- A equipe Jescri/Estúdio Elã é tratada como um único operador de gestão; o PRD não define papéis internos distintos.
- A integração de endereço depende de um serviço externo de CEP.
- A planilha e o Apps Script V1 são fontes de comportamento de negócio; esta entrega não os modifica.
- Dados pessoais, bancários e comerciais da influenciadora são necessários para os módulos definidos no PRD, mas o PRD não estabelece política de proteção, retenção ou expurgo.

## 7. Decisões arquiteturais pendentes

Os itens a seguir são necessários para implementar a entrega, mas não são definidos pelo PRD e não fazem parte desta SPEC como requisito de produto:

- tecnologias, linguagem, framework, banco de dados, ORM, estrutura de diretórios e formato dos arquivos;
- identificador técnico e estratégia de persistência da influenciadora;
- mecanismo de integração entre formulário externo e TEAR V2;
- mecanismo de controle de acesso da equipe;
- interfaces, rotas, contratos de API e modelo de transporte de dados;
- critérios de unicidade para nome/chave, cupom, e-mail ou CNPJ;
- validações de formato além do necessário para consulta de CEP;
- comportamento e mensagem de interface quando a consulta de CEP falhar;
- forma de armazenar e atualizar o endereço completo;
- estratégia de logs e mascaramento de dados sensíveis;
- migração, reconciliação ou coexistência operacional com os dados da planilha V1.

Essas decisões devem ser registradas em documento de arquitetura ou decisão técnica antes do início da implementação. Elas não podem alterar RN-01, RN-02, RN-03 ou os requisitos funcionais desta SPEC.

## 8. Artefatos de implementação necessários

Os nomes, localizações e formatos de arquivos são **decisão arquitetural pendente**. Independentemente da tecnologia escolhida, a implementação deverá criar ou modificar artefatos com estas responsabilidades:

| Artefato | Responsabilidade |
|---|---|
| Modelo de dados da influenciadora | Representar os campos confirmados pelo PRD, status e endereço. |
| Mecanismo de persistência | Criar, consultar e atualizar influenciadoras. |
| Processo de cadastro externo | Receber os dados do formulário e criar o registro em `OFF`. |
| Processo administrativo de manutenção | Consultar, editar dados contratuais e alterar status manualmente. |
| Adaptador de CEP | Consultar o serviço externo e devolver os componentes de endereço sem impedir o salvamento em caso de falha. |
| Composição de endereço | Atualizar o endereço completo a partir de CEP, rua, bairro, cidade, UF, número e complemento. |
| Testes automatizados | Verificar as regras desta SPEC e as falhas da integração. |

**Arquivos existentes a modificar:** nenhum é definido nesta SPEC. O PRD não define a arquitetura física do V2, e os arquivos do V1 não devem ser alterados como parte desta entrega.

## 9. Estratégia de implementação

1. Registrar as decisões arquiteturais pendentes da Seção 7 sem alterar os requisitos desta SPEC.
2. Criar a representação persistente da influenciadora com todos os campos confirmados pelo PRD e status `ON`/`OFF`.
3. Implementar o recebimento do formulário externo, garantindo que todo novo registro seja criado em `OFF`.
4. Implementar a consulta e manutenção administrativa, incluindo edição dos dados contratuais e alteração manual de status.
5. Implementar a integração de CEP como ponto isolado de dependência externa, com falha degradável.
6. Implementar a atualização do endereço completo após cadastro ou alteração de CEP, número ou complemento.
7. Executar as verificações automatizadas e manuais previstas na Seção 11.

Essa ordem é obrigatória porque a manutenção administrativa e os módulos futuros dependem de uma base persistida; a integração de CEP não pode impedir as operações principais.

## 10. Critérios de aceite

### Cadastro e dados

- [ ] Uma influenciadora consegue enviar o formulário externo com os dados exigidos pelo fluxo de cadastro definido para a implementação.
- [ ] Todo cadastro válido cria uma influenciadora com status `OFF`; nenhum dado enviado pelo formulário pode ativá-la automaticamente.
- [ ] O registro mantém os dados cadastrais, bancários, comerciais e de endereço confirmados pelo PRD.
- [ ] Com CEP resolvido, rua, bairro, cidade e UF são preenchidos; número e complemento informados são preservados no endereço completo.
- [ ] Após edição de CEP, número ou complemento, o endereço completo é atualizado.
- [ ] Quando o serviço de CEP estiver indisponível, lento, retornar erro ou não localizar o CEP, os dados principais ainda podem ser salvos e o endereço pode permanecer incompleto para ajuste posterior.

### Gestão pela equipe

- [ ] A equipe consegue consultar influenciadoras ativas e inativas e selecionar uma influenciadora para manutenção.
- [ ] A equipe consegue editar valor, quantidades contratadas, prazo, canais de uso de imagem e referência à planilha externa de looks.
- [ ] A equipe consegue alterar manualmente o status entre `ON` e `OFF`.
- [ ] A alteração para `OFF` não exclui o registro cadastral ou contratual.
- [ ] Uma influenciadora em `OFF` permanece fora do conjunto elegível para ciclo mensal e geração de contrato quando esses módulos forem implementados, conforme RN-03.

### Integridade e independência do V1

- [ ] A falha da integração de CEP não bloqueia a criação ou a edição dos dados principais.
- [ ] A implementação não altera planilha, Apps Script ou arquivos do V1 como parte desta entrega.
- [ ] A implementação mantém as regras RN-01, RN-02 e RN-03 sem exceções não previstas nesta SPEC.

## 11. Estratégia de testes

### Testes automatizados de regra de negócio

- criação por formulário sempre resulta em status `OFF`, inclusive se o formulário tentar informar outro status;
- alteração manual entre `ON` e `OFF`;
- edição de valor, quantidades, prazo, canais e referência à planilha de looks;
- preenchimento de rua, bairro, cidade e UF quando o CEP for resolvido;
- recomposição do endereço completo após mudança de CEP, número ou complemento;
- persistência dos dados principais quando a integração de CEP retornar erro, timeout, indisponibilidade ou CEP não localizado;
- manutenção de registro inativado sem exclusão cadastral ou contratual.

### Testes automatizados de integração

- recebimento de cadastro externo e persistência inicial em `OFF`;
- consulta administrativa de registros `ON` e `OFF`;
- edição administrativa de dados contratuais;
- alteração de status persistida;
- integração de CEP bem-sucedida e integração de CEP indisponível sem rollback dos dados principais;
- verificação de que o V1 não é chamado, alterado ou usado como destino de escrita pela funcionalidade implementada.

### Verificação manual

1. Enviar um cadastro pelo formulário externo e confirmar que a nova influenciadora está em `OFF`.
2. Consultar a nova influenciadora pela área de gestão, preencher dados contratuais e ativá-la manualmente.
3. Alterar CEP, número e complemento e confirmar que o endereço completo foi atualizado.
4. Simular indisponibilidade do serviço de CEP e confirmar que um cadastro e uma edição continuam sendo salvos.
5. Inativar uma influenciadora e confirmar que o registro continua disponível para consulta e manutenção.

**Decisão arquitetural pendente:** os comandos concretos de lint, compilação, testes e build dependem da tecnologia escolhida e devem ser definidos no documento de arquitetura correspondente.

## 12. Riscos

- A indisponibilidade da integração de CEP pode deixar o endereço incompleto; isso não pode bloquear o cadastro ou a edição.
- A inexistência de regra no PRD para inativação durante ciclo em aberto exige que módulos futuros não assumam comportamento não especificado.
- A ausência de regras de LGPD, retenção e expurgo de CNPJ, PIX e endereço é um risco de conformidade a ser tratado fora desta entrega.
- A ausência de estratégia de migração mantém os dados V1 fora do TEAR V2 até que exista especificação própria para importação e validação.
- Decisões arquiteturais pendentes podem bloquear o início da implementação, mas não justificam alterar as regras de negócio desta SPEC.

## 13. Referências do PRD

- Seções 5.1 e 6.1: fluxo e módulo de Cadastro & Base de Influenciadoras.
- RN-01, RN-02 e RN-03: status inicial, endereço por CEP e elegibilidade para ciclo/contrato.
- RF-001, RF-002, RF-003 e RF-004: cadastro, ativação/inativação, endereço e dados contratuais.
- Requisitos não funcionais: disponibilidade degradável da integração de CEP.
- Seções 11 e 12: restrições e comportamentos fora do escopo.
