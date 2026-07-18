# PROJECT GOVERNANCE — Projeto TEAR

> Documento soberano de governanca de processo, decisoes permanentes e evolucao da V2.
> Consolida as regras de colaboracao humana/IA, as decisoes arquiteturais e o roadmap oficial.

## 1. Objetivo

Garantir que toda evolucao do Projeto TEAR ocorra com:

- consistencia arquitetural;
- rastreabilidade de decisoes;
- fluxo operacional padronizado;
- seguranca de dados e de publicacao;
- entrega incremental e previsivel.

## 2. Protocolo Oficial de Trabalho

Toda atividade deve seguir o fluxo:

1. Auditoria
2. Plano de Migracao
3. Consolidacao
4. Validacao
5. Registro

Regras operacionais obrigatorias:

- trabalhar em uma frente por vez;
- nao alterar fora do escopo aprovado;
- nao apagar antes de migrar conhecimento valido;
- evitar duplicacao documental e tecnica;
- preservar fonte unica da verdade por conceito.

## 3. Decisoes Arquiteturais Permanentes

### 3.1 Separacao por camadas

Fluxo oficial:

Entrypoint -> Controller -> Service -> Repository

Consequencia:

- cada camada tem responsabilidade unica;
- regras de negocio ficam em Service;
- persistencia fica em Repository;
- contratos externos ficam em Controller/Entrypoint.

### 3.2 Organizacao do codigo

- projeto usa multiplos arquivos por responsabilidade;
- codigo em `.js` versionado localmente e sincronizado por clasp;
- repositório Git e a fonte principal de codigo.

### 3.3 Entrypoints e contrato de resposta

- funcoes expostas ao `google.script.run` devem ser de topo;
- envelope padrao externo:

```javascript
{ success: true, data: {} }
```

ou

```javascript
{ success: false, error: {} }
```

### 3.4 Seguranca e escopo

- operacoes administrativas exigem validacao de permissao;
- parceiros acessam apenas seu proprio escopo de dados;
- identificacao de parceiros por campos estaveis (`EMAIL`, `CNPJ`);
- sessao com expiracao e renovacao controladas.

### 3.5 Convencoes de dados e publicacao

- proibido versionar dados pessoais reais no repositório;
- cada Repository define projecao explicita de campos;
- identificacao de entidades por chave estavel (`INFLU_KEY`);
- `.claspignore` opera como allowlist de publicacao.

### 3.6 Migracoes e deploy

- migracoes so com mecanismo explicito de ativacao;
- deploy/publicacao sempre controlado pelo operador;
- agentes nao publicam sem autorizacao explicita.

## 4. Governanca de Colaboracao com IA

Agentes de IA devem:

- ler apenas contexto necessario;
- priorizar precisao sobre volume;
- justificar alteracoes propostas;
- manter rastreabilidade e continuidade;
- respeitar arquitetura documental e tecnica vigente.

## 5. Roadmap Oficial da V2

### 5.1 Direcao

A V2 e evolucao da arquitetura atual em Apps Script/Sheets. Nao e reescrita tecnologica.

### 5.2 Fases

1. Fundacao
2. Portal da Parceira
3. Administrativo
4. Operacao automatizada
5. Escalabilidade

### 5.3 Criterios de qualidade

- testes verdes;
- arquitetura preservada;
- documentacao atualizada quando aplicavel;
- commits pequenos e atomicos;
- ausencia de regressao funcional.

### 5.4 Fluxo de execucao por entrega

1. Ler documentacao obrigatoria
2. Implementar bloco logico
3. Executar testes
4. Corrigir falhas
5. Commit
6. Atualizar documentacao
7. Push manual
8. Encerrar sprint

### 5.5 Encerramento de sprint

Uma sprint encerra quando:

- objetivos definidos foram entregues;
- testes permanecem verdes;
- nao ha alteracoes pendentes;
- commits e push foram concluidos;
- documentacao aplicavel foi atualizada.

## 6. Estrutura e Integridade de Repositorio

- repositorio unico na raiz;
- proibido submodules e `.git` internos;
- mudancas estruturais exigem justificativa;
- proibido apagar ativos importantes sem respaldo de migracao/consolidacao.

## 7. Fontes de Autoridade

> **Correcao (2026-07-18, auditoria de apoio):** esta secao citava
> `PROJECT_PHILOSOPHY.md` e `OPERATIONS_GUIDE.md` como fontes na raiz do
> repositorio. Nenhum dos dois existe ali — sao artefatos arquivados em
> `CONHECIMENTO/docs/` (fase de planejamento anterior aos SPECs,
> explicitamente fora do escopo de codigo/documentacao vigente desde o
> Sprint 0, `eslint.config.js`), e `OPERATIONS_GUIDE.md` cita como suas
> proprias fontes `DOMAIN_MODEL_V2.md`/`DOMAIN_MODEL_CONSOLIDADO.md`
> (tambem inexistentes na raiz) e ainda usa vocabulario banido
> (`Ciclo`/`Plano`, Contrato Soberano §2) — confirma que e material
> anterior ao ADR-003, superado. Mesmo padrao de residuo ja corrigido no
> `CLAUDE.md` (nota "Correcao de 2026-07-16"), que nunca foi propagado
> para este documento. Lista abaixo reflete o que e lido de fato hoje
> (README.md, "Documentacao oficial").

- `docs/_workspace/TASK_ROUTER.md`: estado atual de cada SPEC e dependencias;
- `docs/PRD.md`: requisitos de produto;
- `CONTRATO_SOBERANO.md`: verdade soberana de negocio e dominio;
- `docs/adrs/`: decisoes arquiteturais;
- `docs/_workspace/DEPLOY_CHECKLIST.md`: checklist de pre-deploy e rollback;
- `docs/_workspace/ROTEIRO_HOMOLOGACAO.md`: roteiro manual de homologacao;
- `CLAUDE.md`: protocolo operacional para agentes.
