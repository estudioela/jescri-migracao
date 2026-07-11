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
- Não publicar produção.
- Não apagar dados.
- Não alterar permissões sem autorização.

## Comandos padrão
Comandos permitidos e fluxo Git.

## Documentos oficiais

Antes de iniciar qualquer tarefa:

1. docs/PROJECT_PHILOSOPHY.md
2. docs/KNOWN_DECISIONS.md
3. docs/SYSTEM_MAP.md
4. docs/PROJECT_STATUS.md
5. docs/CHANGELOG_DE_DESENVOLVIMENTO.md
6. Documento da Sprint atual

## Fonte de decisão

Quando houver conflito:

- Filosofia operacional define comportamento.
- SYSTEM_MAP define arquitetura.
- SYSTEM_TRUTH define estado atual.
- KNOWN_DECISIONS define decisões históricas.

## Economia de contexto

O agente deve:

- Ler apenas arquivos necessários.
- Preferir grep/sed a leitura completa.
- Não explorar o repositório sem necessidade.
- Não abrir arquivos fora do escopo.
