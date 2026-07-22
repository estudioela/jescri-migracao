# BRIEFING DO PRODUCT OWNER
## SPEC-035 — Identidade e Acesso

## Objetivo

Esta SPEC definirá completamente o módulo de Identidade e Acesso do TEAR.

Ela deve servir como a documentação oficial para implementação, sem necessidade de criar várias SPECs menores.

---

## Contexto

O TEAR está deixando de utilizar Google Forms como entrada de novas influenciadoras.

A partir desta SPEC, todo o processo passa a acontecer dentro da plataforma.

Não estamos apenas criando um login.

Estamos criando a identidade digital de todos os usuários do sistema.

---

## Princípios

- O Google Forms será descontinuado.
- O cadastro passa a acontecer dentro do TEAR.
- A autenticação será feita utilizando Login com Google.
- O e-mail Google será a identidade principal do usuário.
- O sistema deve ser simples.
- Menos telas.
- Menos burocracia.
- Menos documentos.
- O foco é experiência de uso.

---

## Papéis do sistema

Existem apenas três papéis.

- Administrador
- Marca
- Influenciadora

Não criar novos papéis sem necessidade.

---

## Objetivos desta SPEC

Esta SPEC deverá definir:

- visão do módulo
- objetivos
- fluxo de primeiro acesso
- login Google
- cadastro
- aprovação
- estados do usuário
- regras de negócio
- permissões
- arquitetura
- UX
- modelo de dados
- eventos de domínio
- critérios de aceite

---

## O que NÃO queremos

- criação de dezenas de SPECs pequenas
- excesso de engenharia
- excesso de abstrações
- burocracia desnecessária
- soluções complexas quando uma simples resolve

---

## Filosofia

O TEAR é um software operacional.

Toda decisão deve priorizar:

- simplicidade
- clareza
- manutenção
- experiência do usuário
- facilidade de operação