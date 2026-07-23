# CLAUDE.md

## Papel do agente
Como o agente deve atuar no Projeto Tear.

## Leitura obrigatória antes de alterar código
Lista curta de documentos oficiais.

## Regras de execução
- Não alterar arquitetura sem ADR.
- Não criar documentação duplicada.
- Não trabalhar em múltiplas frentes.
- Validar antes de commit.

## Fluxo obrigatório
Auditoria
→ Plano
→ Execução
→ Validação
→ Commit

## Regras de arquivos
- Onde procurar informações.
- Quais arquivos possuem cada responsabilidade.

## Restrições
- Não apagar dados.
- Não alterar permissões sem autorização.
- Deploy de produção: ver "Mandato de operação autônoma" abaixo.

## Mandato de operação autônoma (2026-07-16)

Autorização explícita do responsável pelo projeto, registrada nesta data:

- O agente assume responsabilidade operacional (Tech Lead de execução):
  decide a ordem de SPECs desbloqueadas, conduz integração, QA, arquitetura,
  performance, documentação, preparação para deploy e homologação sem
  aguardar confirmação a cada etapa.
- `git push` e deploy para produção estão autorizados sem confirmação
  pontual, a cada unidade lógica de trabalho concluída (testes verdes,
  lint limpo).
- O agente PARA e pede decisão humana apenas quando houver: regra de negócio
  inédita (ex.: decisão de PO pendente, como Q-04), necessidade de
  credenciais/acessos que não possui, impossibilidade técnica objetiva, ou
  conflito insolúvel entre requisitos. Fora isso, decide e continua.
- Esta autorização substitui a restrição anterior "Não publicar produção"
  enquanto vigente; revogável a qualquer momento pelo responsável do projeto.

## Comandos padrão

Comandos permitidos e fluxo Git.

**Protocolo de sessão:** `/comecar` no início de qualquer sessão (lê
`docs/_workspace/ESTADO_SESSAO.md` e reporta fase, próxima tarefa,
pendências, riscos e IA recomendada); `/fim` ao encerrar (reescreve
`ESTADO_SESSAO.md` com o que mudou). `ESTADO_SESSAO.md` é o snapshot
rápido; `docs/_workspace/TASK_ROUTER.md` continua sendo o histórico
completo e a fonte única de estado de longo prazo.

## Documentos oficiais

Antes de iniciar qualquer tarefa:

1. `docs/_workspace/TASK_ROUTER.md` — fonte única de estado (o que está
   `[x]`/`[>]`/`[ ]`, dependências entre SPECs, dívidas registradas).
2. `docs/PRD.md` (seções indicadas pelo TASK_ROUTER para a SPEC em questão).
3. `CONTRATO_SOBERANO.md` (domínio soberano — nunca reabrir).
4. `docs/specs/SPEC-NNN.md` da SPEC em questão.
5. `docs/adrs/` — ADRs relevantes (listados no TASK_ROUTER §1/§2).

> **Correção de 2026-07-16:** esta seção listava `docs/PROJECT_PHILOSOPHY.md`,
> `docs/KNOWN_DECISIONS.md`, `docs/SYSTEM_MAP.md`, `docs/PROJECT_STATUS.md` e
> `docs/CHANGELOG_DE_DESENVOLVIMENTO.md` — nenhum desses arquivos jamais
> existiu neste repositório (achado da FASE 1 pós-SPECs, auditoria de
> integração). O projeto usa `TASK_ROUTER.md` como fonte única de estado
> desde a SPEC-025; a lista acima reflete o que é lido de fato hoje.

## Fonte de decisão

Quando houver conflito:

- `docs/AI_CONSTITUTION.md` é a autoridade máxima de engenharia do
  projeto — hierarquia das verdades, mandamentos da IA, regras de código/
  bugs/documentação, critérios de qualidade e quando interromper.
- `TASK_ROUTER.md` define estado atual e dependências entre SPECs.
- `CONTRATO_SOBERANO.md` define domínio soberano (nunca reabrir).
- ADRs definem decisões arquiteturais históricas (nunca reabrir sem novo ADR).
- `docs/specs/SPEC-NNN.md` define o comportamento esperado da SPEC.

## Economia de contexto

O agente deve:

- Ler apenas arquivos necessários.
- Preferir grep/sed a leitura completa.
- Não explorar o repositório sem necessidade.
- Não abrir arquivos fora do escopo.
