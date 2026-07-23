# GOVERNANÇA DO PROJETO

> Versão: 2.0
> Projeto: Influencia
> Status: Ativo

---

# 1. PROPÓSITO

Este documento define as regras oficiais de governança do projeto Influencia.

Seu objetivo é garantir:

- continuidade entre sessões;
- padronização entre diferentes IAs;
- documentação consistente;
- redução de perda de contexto;
- evolução sustentável do projeto.

Toda IA, colaborador ou mantenedor deve seguir estas regras.

---

# 2. PRINCÍPIOS

## 2.1 Fonte Única da Verdade

Cada informação deve existir em apenas um local.

Nunca duplicar informações entre documentos.

---

## 2.2 Separação de Responsabilidades

Cada documento possui apenas uma responsabilidade.

Nenhum documento deve assumir funções de outro.

---

## 2.3 Estado ≠ Histórico

O estado atual representa somente o momento presente.

O histórico registra apenas acontecimentos concluídos.

Jamais utilizar histórico para controlar o estado atual.

---

## 2.4 Sessões são descartáveis

Nenhuma sessão de IA deve ser considerada memória permanente.

Toda informação importante deve ser registrada na documentação oficial.

---

## 2.5 Governança acima da ferramenta

A governança do projeto não depende de uma IA específica.

Claude, GPT, Gemini ou qualquer outra ferramenta devem seguir exatamente as mesmas regras.

---

# 3. CAMADAS DE CONHECIMENTO

O projeto possui quatro níveis oficiais de conhecimento.

## Permanente

Conhecimento válido por longo prazo.

Exemplos:

- arquitetura
- padrões
- convenções
- stack
- workflows
- decisões permanentes

---

## Operacional

Conhecimento referente ao estado atual do projeto.

Exemplos:

- fase atual
- missão atual
- bloqueios
- próxima tarefa
- branch

---

## Histórico

Registro apenas de marcos importantes.

Exemplos:

- conclusão de fases
- grandes refatorações
- migrações
- releases

---

## Técnico

Documentação funcional do sistema.

Exemplos:

- SPEC
- ADR
- PRD
- arquitetura
- diagramas
- regras de negócio

---

# 4. RESPONSABILIDADES DOS DOCUMENTOS

| Documento | Responsabilidade |
|------------|------------------|
| CLAUDE.md | Conhecimento permanente |
| ESTADO_SESSAO.md | Snapshot operacional |
| docs/handoff/README.md | Histórico executivo |
| docs/specs | Especificações |
| docs/adrs | Decisões arquiteturais |
| docs/planning | Planejamento |

---

# 5. REGRAS GERAIS

É proibido:

- duplicar documentação;
- transformar ESTADO_SESSAO em diário;
- utilizar handoff como backlog;
- registrar pensamentos da IA;
- registrar tentativas fracassadas;
- manter informações obsoletas.

Sempre priorizar documentação objetiva, curta e atualizada.

---

# 6. CRITÉRIO DE CLASSIFICAÇÃO

Sempre que surgir uma nova informação, responder:

"Ela continuará válida daqui a seis meses?"

Se SIM:

→ documentação permanente.

Se NÃO:

→ documentação operacional.

Se representar um marco:

→ histórico.

Se representar comportamento do sistema:

→ documentação técnica.

---

# 7. OBJETIVO DA GOVERNANÇA

Esta governança existe para tornar o projeto independente da memória das sessões, garantindo continuidade, previsibilidade e facilidade de manutenção ao longo de toda a evolução do Influencia.

# HANDOFF DO PROJETO

> Projeto: Influencia
> Objetivo: Registrar apenas marcos relevantes da evolução do projeto.

---

# PROPÓSITO

Este documento registra exclusivamente os grandes marcos da evolução do projeto.

Ele não deve ser utilizado para:

- controle de tarefas;
- backlog;
- diário de desenvolvimento;
- registro de sessões;
- documentação técnica.

Seu objetivo é permitir que qualquer pessoa compreenda rapidamente a evolução do projeto sem precisar ler conversas, commits ou históricos extensos. Boas práticas de handoff recomendam registrar apenas informações necessárias para a continuidade operacional, evitando duplicação com a documentação técnica.  [oai_citation:0‡AlterSquare](https://altersquare.io/blog/code-handover-checklist-good-documentation-outsourced-team?utm_source=chatgpt.com)

---

# QUANDO REGISTRAR

Adicionar uma nova entrada apenas quando ocorrer um marco relevante.

Exemplos:

- conclusão de uma fase;
- mudança arquitetural significativa;
- migração tecnológica;
- início de produção;
- release importante;
- refatoração estrutural.

Não registrar pequenas correções.

---

# FORMATO OFICIAL

Cada registro deve seguir exatamente esta estrutura:

```md
## AAAA-MM-DD

### Marco

Resumo do marco.

### Principais decisões

- decisão 1
- decisão 2

### Impacto

Descrição objetiva.

### Próxima fase

Descrição.
```

---

# HISTÓRICO

## 2026-07-23

### Marco

Encerramento oficial da Fase 1 e início da Governança da Fase 2.

### Principais decisões

- Consolidação do repositório.
- Sincronização completa entre ambiente local e GitHub.
- Criação da estrutura de governança.
- Separação entre documentação permanente, operacional e histórica.

### Impacto

O projeto passa a possuir uma governança independente da ferramenta utilizada (Claude, GPT, Gemini ou outra IA).

### Próxima fase

Implantação completa da Governança da Fase 2 e padronização do fluxo de abertura e encerramento das sessões.

# ESTADO DA SESSÃO

> Este documento representa exclusivamente o estado operacional atual do projeto.
> Não registrar histórico, decisões antigas ou discussões encerradas.

---

# PROJETO

**Nome:** Influencia

**Fase Atual:**
Fase 2 — Governança

**Status Geral:**
🟢 Em andamento

---

# MISSÃO ATUAL

Implantar a Governança da Fase 2.

---

# OBJETIVO DA SESSÃO

Padronizar a documentação, definir o fluxo operacional das IAs e estabelecer o novo modelo oficial de governança do projeto.

---

# BRANCH ATUAL

main

---

# CONTEXTO ATUAL

A Fase 1 foi oficialmente encerrada.

O repositório encontra-se sincronizado entre ambiente local e GitHub.

A documentação de governança começou a ser implantada.

---

# CONCLUÍDO

- Estrutura inicial da governança criada.
- Pasta docs/governanca criada.
- Pasta docs/handoff criada.
- GOVERNANCA_DO_PROJETO.md criado.
- handoff/README.md criado.

---

# EM EXECUÇÃO

- Escrita da documentação oficial de governança.

---

# BLOQUEIOS

Nenhum.

---

# PRÓXIMA TAREFA

Atualizar o CLAUDE.md para refletir a nova Governança da Fase 2.

---

# CHECKLIST

## Governança

- [x] Estrutura criada
- [x] Documento de Governança criado
- [x] Documento de Handoff criado
- [x] Estado da Sessão padronizado
- [ ] CLAUDE.md atualizado
- [ ] Fluxo de abertura de sessão definido
- [ ] Fluxo de encerramento de sessão definido

---

# OBSERVAÇÕES

Este documento deve permanecer pequeno.

Sempre substituir informações antigas.

Nunca transformar este arquivo em histórico.

Todas as decisões permanentes pertencem ao CLAUDE.md.

Todo marco concluído pertence ao docs/handoff/README.md.

---

**Última atualização**

2026-07-23

# GOVERNANÇA DO PROJETO

Esta seção define como toda IA deve trabalhar dentro do projeto Influencia.

Estas regras possuem prioridade sobre qualquer preferência operacional da IA.

---

# DOCUMENTOS OFICIAIS

O projeto possui quatro níveis oficiais de documentação.

## 1. Conhecimento Permanente

Responsável por armazenar tudo que permanece válido ao longo do projeto.

Documento:

- CLAUDE.md

Exemplos:

- arquitetura
- padrões
- convenções
- stack
- workflow
- linguagem ubíqua
- decisões permanentes

---

## 2. Estado Operacional

Representa exclusivamente o estado atual do projeto.

Documento:

docs/_workspace/ESTADO_SESSAO.md

Este documento deve permanecer pequeno.

Seu conteúdo deve ser atualizado continuamente.

Jamais deve funcionar como histórico.

---

## 3. Histórico Executivo

Responsável por registrar apenas grandes marcos.

Documento:

docs/handoff/README.md

Registrar apenas:

- encerramento de fases
- grandes refatorações
- releases
- mudanças arquiteturais
- migrações importantes

Nunca registrar pequenas tarefas.

---

## 4. Documentação Técnica

Documentação funcional do sistema.

Inclui:

- PRD
- SPEC
- ADR
- Architecture
- Domain
- Business Rules

---

# SINGLE SOURCE OF TRUTH

Toda informação deve possuir exatamente um local oficial.

Nunca duplicar conteúdo entre documentos.

Sempre atualizar o documento responsável.

Nunca copiar o mesmo conteúdo para múltiplos arquivos. Esse princípio reduz inconsistências e facilita a manutenção da documentação ao longo do tempo.  [oai_citation:0‡Atlassian](https://www.atlassian.com/work-management/knowledge-sharing/documentation/building-a-single-source-of-truth-ssot-for-your-team?utm_source=chatgpt.com)

---

# ABERTURA DE SESSÃO

Ao iniciar uma nova sessão a IA deve obrigatoriamente:

1. Ler CLAUDE.md.

2. Ler docs/_workspace/ESTADO_SESSAO.md.

3. Identificar a fase atual.

4. Identificar a missão atual.

5. Verificar a branch ativa.

6. Propor um plano de execução.

Nenhuma alteração deve ser realizada antes dessa análise.

---

# ENCERRAMENTO DA SESSÃO

Antes de finalizar uma sessão a IA deve:

1. Atualizar ESTADO_SESSAO.md.

2. Remover informações obsoletas.

3. Registrar um handoff apenas se um marco relevante tiver sido concluído.

4. Informar a próxima tarefa sugerida.

5. Garantir que toda decisão permanente esteja documentada.

---

# REGRAS GERAIS

É proibido:

- usar ESTADO_SESSAO.md como diário;
- registrar pensamentos internos da IA;
- duplicar documentação;
- criar documentação redundante;
- manter informações obsoletas;
- criar novos documentos quando já existir um apropriado.

---

# PRINCÍPIO FUNDAMENTAL

A governança pertence ao projeto.

Ela não pertence ao Claude.

Ela não pertence ao GPT.

Ela não pertence ao Gemini.

Qualquer IA deve seguir exatamente estas regras.

O objetivo é garantir continuidade, previsibilidade e independência da ferramenta utilizada.