# KNOWN_DECISIONS.md — Decisões permanentes do Projeto Tear

> Este documento registra decisões arquiteturais permanentes.
>
> Não contém histórico de implementação, bugs, testes ou procedimentos operacionais.

---

# 1. Arquitetura

## Separação por camadas

Decisão:

O sistema utiliza a separação:
Entrypoint
↓
Controller
↓
Service
↓
Repository

Motivo:

Separar responsabilidades e impedir que regras de negócio fiquem misturadas com entrada de dados ou persistência.

Consequência:

Cada camada possui responsabilidade única:

- Entrypoint:
  recebe chamadas externas.

- Controller:
  controla fluxo e contratos de resposta.

- Service:
  contém regras de negócio.

- Repository:
  acessa dados.

---

## Organização de arquivos no Apps Script

Decisão:

O projeto utiliza múltiplos arquivos organizados por responsabilidade, evitando concentração excessiva de código.

Motivo:

Facilitar manutenção, navegação e evolução do sistema.

Consequência:

Novas funcionalidades devem respeitar a separação existente.

---

## Extensão dos arquivos

Decisão:

O código utiliza arquivos `.js` versionados localmente.

Motivo:

O clasp realiza a sincronização com o ambiente Apps Script.

Consequência:

O repositório Git permanece como fonte principal do código.

---

# 2. Segurança

## Entrypoints como funções de topo

Decisão:

Funções expostas ao `google.script.run` devem existir como funções públicas de topo.

Motivo:

O Apps Script exige funções acessíveis diretamente pelo ambiente de execução.

Consequência:

Chamadas externas não devem depender de métodos internos ou classes não expostas.

---

## Contrato de resposta

Decisão:

Controllers utilizam envelope padronizado:

```javascript
{
  success: true,
  data: {}
}

ou

{
  success: false,
  error: {}
}

Motivo:

Centralizar o contrato externo e evitar que camadas internas conheçam detalhes de comunicação.

Consequência:

Services e Repositories não devem definir respostas para o usuário final.

⸻

Controle de acesso

Decisão:

Operações administrativas devem possuir validação de permissão.

Motivo:

Separar ações administrativas de ações realizadas por parceiros/influenciadoras.

Consequência:

Toda nova função administrativa deve validar autorização antes da execução.

⸻

Escopo de dados por sessão

Decisão:

Usuários parceiros devem acessar somente dados vinculados à própria identidade.

Motivo:

Evitar exposição de dados entre usuários.

Consequência:

Consultas externas devem sempre aplicar filtro de contexto.

⸻

Busca de parceiros

Decisão:

Identificação de parceiros deve utilizar campos estáveis:

* EMAIL;
* CNPJ.

Motivo:

Evitar dependência de posição de coluna ou dados alteráveis.

Consequência:

Não utilizar índices fixos da planilha para identificação.

⸻

Armazenamento de sessão

Decisão:

Tokens temporários de sessão devem utilizar armazenamento adequado para sessão.

Motivo:

Evitar persistência permanente de credenciais no navegador.

Consequência:

Sessões devem possuir expiração e renovação controladas.

⸻

3. Convenções

Código sem dados reais

Decisão:

O repositório não deve conter dados pessoais reais, seeds reais ou informações privadas.

Motivo:

Preservar segurança e permitir versionamento seguro.

Consequência:

Dados de teste devem ser fictícios.

⸻

Projeção de dados por Repository

Decisão:

Cada Repository define explicitamente os campos utilizados.

Motivo:

Evitar dependência de estruturas completas e reduzir acoplamento.

Consequência:

Alterações de schema devem atualizar as projeções correspondentes.

⸻

Identificação de entidades

Decisão:

Registros de parceiros devem ser identificados por INFLU_KEY.

Motivo:

Utilizar identificador estável independente de alterações cadastrais.

Consequência:

Operações de atualização devem utilizar identificadores únicos.

⸻

Controle de publicação

Decisão:

O .claspignore funciona como allowlist dos arquivos publicados.

Motivo:

Evitar envio acidental de arquivos auxiliares ou documentação.

Consequência:

Novos arquivos publicados devem ser adicionados conscientemente.

⸻

4. Migrações

Controle explícito de migração

Decisão:

Migrações de dados devem possuir mecanismo explícito de ativação.

Motivo:

Evitar alterações acidentais em dados reais.

Consequência:

Nenhuma migração deve executar automaticamente sem autorização.

⸻

5. Governança

Fonte de autoridade

Decisão:

PROJECT_PHILOSOPHY.md define os princípios gerais do projeto.

Motivo:

Garantir consistência entre decisões técnicas e objetivos do sistema.

⸻

Operação de agentes IA

Decisão:

CLAUDE.md define como agentes devem atuar no projeto.

Motivo:

Padronizar execução, economia de contexto e controle de alterações.

⸻

Commits

Decisão:

Commits devem ser pequenos e atômicos.

Motivo:

Facilitar rastreamento, revisão e reversão.

Consequência:

Cada etapa concluída deve possuir seu próprio commit.

⸻

Publicação

Decisão:

Deploy e publicação são ações controladas pelo operador.

Motivo:

Separar desenvolvimento de produção.

Consequência:

Nenhum agente deve publicar alterações sem autorização.

⸻

Controle de escopo

Decisão:

Cada Sprint deve possuir um único objetivo.

Motivo:

Evitar dispersão e aumento desnecessário de complexidade.

Consequência:

Novas demandas devem aguardar uma Sprint própria.

⸻

Economia de contexto

Decisão:

Ferramentas de IA devem priorizar leitura mínima necessária.

Motivo:

Reduzir custo operacional e manter foco.

Consequência:

Evitar abertura de arquivos completos quando uma análise localizada for suficiente.
