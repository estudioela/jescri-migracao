# ARQUITETURA DO CONHECIMENTO DO PROJETO TEAR

> **Status:** Draft v1
>
> **Tipo:** Documento de Engenharia (Workspace)
>
> Este documento define o modelo arquitetural utilizado para organizar, consolidar, evoluir e governar todo o conhecimento do Projeto Tear durante a Sprint de Consolidação Documental.
>
> Ele não faz parte da documentação oficial do sistema.
>
> Sua função é servir como contrato arquitetural da Sprint.

---

# 1. Objetivo

Antes de reorganizar documentos, é necessário definir como o conhecimento do Projeto Tear será tratado.

Este documento estabelece:

- quais tipos de conhecimento existem;
- como cada tipo evolui;
- como cada tipo deve ser documentado;
- como evitar duplicação;
- como preservar uma única Fonte da Verdade.

---

# 2. Princípios Fundamentais

Toda decisão durante esta Sprint deve obedecer aos seguintes princípios.

## 2.1 Fonte Única da Verdade

Cada informação possui um único proprietário documental.

Documentos podem referenciar.

Nunca duplicar.

---

## 2.2 Responsabilidade Única

Cada documento responde apenas uma pergunta.

Quando um documento começa a responder duas perguntas, ele deve ser dividido.

---

## 2.3 Consolidação antes de Expansão

Novos documentos somente poderão ser criados quando ficar demonstrado que nenhum documento existente possui responsabilidade adequada para receber aquele conhecimento.

---

## 2.4 Arquitetura precede Migração

Nenhuma informação será movida antes de existir uma justificativa arquitetural para seu novo destino.

---

## 2.5 Conhecimento antes de Documento

O Projeto Tear organiza conhecimento.

Documentos são apenas implementações dessa organização.

---

# 3. Tipos Canônicos de Conhecimento

Todo conhecimento produzido pelo Projeto Tear pertence exatamente a um dos seguintes tipos.

## Constitucional

Princípios permanentes.

Exemplos:

- Filosofia
- Engenharia
- Governança

---

## Referência

Representa o estado atual do sistema.

Exemplos:

- README
- SYSTEM_MAP
- SCHEMA

---

## Decisão

Registra escolhas permanentes.

Exemplos:

- KNOWN_DECISIONS
- ADRs

---

## Operacional

Ensina como executar atividades.

Exemplos:

- AI_WORKFLOW
- Procedimentos

---

## Planejamento

Representa intenções futuras.

Exemplos:

- Sprint
- Roadmap
- Planos

---

## Histórico

Registra fatos passados.

Nunca representa o estado atual.

---

# 4. Unidade da Fonte da Verdade

A menor unidade da Fonte da Verdade do Projeto Tear é o **conceito**.

Não o documento.

Não a seção.

Não o arquivo.

Cada conceito possui exatamente um documento proprietário.

Outros documentos apenas referenciam esse conceito.

---

# 5. Fluxo de Consolidação

Toda migração documental deverá seguir obrigatoriamente este fluxo.

1. Identificar o conceito.
2. Classificar o tipo de conhecimento.
3. Identificar o documento proprietário.
4. Migrar a informação.
5. Validar ausência de duplicação.
6. Arquivar a origem.

Nenhuma etapa poderá ser ignorada.

---

# 6. Critérios de Aceitação da Sprint

A Sprint somente será considerada concluída quando:

- não existir conhecimento duplicado;
- toda informação possuir um documento proprietário;
- documentos responderem apenas uma pergunta;
- documentos históricos não representarem o estado atual;
- existir uma única Fonte da Verdade para cada conceito.

---

# 7. Governança

Este documento governa exclusivamente a Sprint de Consolidação Documental.

Ao término da Sprint ele será arquivado no Workspace como registro da arquitetura utilizada durante a consolidação.

Ele não deverá substituir a documentação oficial do Projeto Tear.

---

# 8. Encerramento

Este documento representa o contrato arquitetural da Sprint.

Toda decisão tomada durante a consolidação deverá estar em conformidade com estas regras.
