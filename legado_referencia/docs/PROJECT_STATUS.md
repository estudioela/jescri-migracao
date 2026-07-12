PROJECT STATUS

Última atualização: 11/07/2026

⸻

Objetivo

Este documento apresenta o estado atual do Projeto Tear.

Seu objetivo é fornecer uma visão executiva sobre o progresso do projeto, permitindo compreender rapidamente sua situação, seus principais avanços e os bloqueios existentes.

Este documento representa sempre o estado presente do projeto.

⸻

Resumo Executivo

Situação Geral

🟢 Fase 1 (Estrutura e UI V2) concluída — pronto para a Migração de Dados.

A arquitetura V2 está consolidada (`tear/`, 10 arquivos por camada), a UI administrativa (Logística e Ativações) está implementada e protegida por `ADMIN_TOKEN`, e a documentação oficial é a base única de referência do projeto.

O próximo esforço é a **Fase 2 — Migração de Dados V1 → V2**: scripts que transportam a base legada (`mae/` / planilha V1) para o schema V2.

⸻

Estado dos Módulos

Módulo	Status
Arquitetura	🟢 Consolidada
Backend	🟢 Estruturado
Administração	🟡 Em evolução
Portal da Parceira	🟡 Em desenvolvimento
Logística	🟢 Painel Admin (UI + auth ADMIN_TOKEN) concluído; aguarda provisionamento
Pagamentos	⚪ Planejado
Integrações	🟡 Em desenvolvimento

⸻

Qualidade do Projeto

Documentação

🟢 Consolidada.

A documentação oficial foi reorganizada para estabelecer uma base única de referência do Projeto Tear.

Foram consolidados:

* contrato operacional para agentes (CLAUDE.md);
* mapa arquitetural do sistema (SYSTEM_MAP.md);
* decisões permanentes (KNOWN_DECISIONS.md);
* filosofia operacional (PROJECT_PHILOSOPHY.md);
* roadmap de evolução (V2_ROADMAP.md).

A documentação agora representa a arquitetura atual do projeto e suas responsabilidades.

⸻

Arquitetura

🟢 Consolidada.

A estrutura arquitetural encontra-se definida e serve como base para a evolução do sistema.

A arquitetura atual estabelece separação entre:

* camada de apresentação;
* roteamento;
* controllers;
* serviços;
* persistência;
* infraestrutura.

⸻

Testes

🟢 Estruturados.

O projeto possui base de testes automatizados para apoiar a evolução contínua do sistema.

⸻

Bloqueios

O único bloqueio conhecido é de provisionamento de plataforma (ações de operador no editor Apps Script, não de desenvolvimento):

* executar `setupV2Database()` para materializar as abas `Logistica`, `Ativacoes` e `Planos_Colaboracao` na planilha principal;
* definir a propriedade `ADMIN_TOKEN` em `PropertiesService` (Script Properties) para habilitar os entrypoints administrativos.

Enquanto esses passos não forem executados, o Painel Admin de Logística está pronto no código, mas inerte em produção.

Débitos técnicos conhecidos:

* **Wizard admin de parceiras usa vocabulário legado.** `ParceiroService.salvar()` e os entrypoints `apiBuscarParceira`/`apiSalvarParceira` (`tear/`) operam no cabeçalho FÍSICO antigo (`INFLU_KEY`, `INFLUENCIADORA_RAZAO_SOCIAL`, `CUPOM`, `EMAIL`, `INFLUENCIADORA_CNPJ`) e fazem upsert por `INFLU_KEY`. Após a Fase 2, a aba `Parceiros_Influenciadoras` passou ao cabeçalho CANÔNICO (`ID_Influenciadora`, `Nome`, `Cupom` — `CAMPOS_PARCEIRO`), então esse wizard **não casa** com a base migrada (o upsert não acha `INFLU_KEY`). O funil de cadastro (`onFormSubmit` → `ParceiroService.registrarCadastro`) já opera no vocabulário canônico e não é afetado. Pendente: alinhar o wizard admin ao cabeçalho canônico em missão dedicada (tem testes verdes próprios, por isso foi deixado intacto para não abrir frente dupla).

Novos bloqueios devem ser registrados nesta seção à medida que forem identificados.

⸻

Foco Atual

Concluída a Fase 1 (estrutura e UI da V2), o projeto entra na Fase 2 — Migração de Dados.

O trabalho concentra-se em:

* projetar e implementar os scripts de migração V1 → V2;
* mapear a base legada (`mae/` / planilha V1) para o schema V2 (`docs/spec/SCHEMA_V2.md`);
* provisionar a plataforma (`setupV2Database()` + `ADMIN_TOKEN`) para o ambiente de destino;
* validar a integridade dos dados migrados antes do cut-over.

⸻

Escopo

Este documento registra exclusivamente o estado atual do Projeto Tear.

Não fazem parte de sua responsabilidade:

* arquitetura do sistema;
* princípios de engenharia;
* decisões arquiteturais;
* procedimentos operacionais;
* planejamento detalhado;
* histórico do projeto.

Esses assuntos pertencem aos respectivos documentos oficiais.