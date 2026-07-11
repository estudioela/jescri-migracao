# V2 — Roadmap do Projeto Tear

> Documento oficial de evolução da V2.
>
> Este roadmap define a direção estratégica da plataforma, as fases de
> implementação e os critérios de evolução do Projeto Tear.
>
> O estado atual do projeto é documentado em:
>
> **docs/PROJECT_STATUS.md**
>
> As decisões permanentes estão em:
>
> **docs/KNOWN_DECISIONS.md**
>
> A filosofia operacional dos agentes está em:
>
> **docs/PROJECT_PHILOSOPHY.md**

---

# 1. Objetivo

Consolidar o Projeto Tear como uma plataforma profissional para gestão de campanhas com influenciadoras, mantendo a infraestrutura baseada em Google Apps Script na V2 e priorizando estabilidade, organização, modularização e facilidade de evolução.

A V2 representa uma evolução da arquitetura existente, e não uma reescrita completa do sistema.

---

# 2. Princípios

Toda evolução da V2 deve respeitar os seguintes princípios:

- estabilidade antes de novas funcionalidades;
- pequenas entregas incrementais;
- arquitetura por camadas;
- baixo acoplamento;
- alta coesão;
- testes automatizados;
- documentação objetiva;
- economia de contexto para agentes de IA;
- nenhuma reescrita completa sem necessidade comprovada.

---


# 4. Fases da V2

## Fase 1 — Fundação

### Objetivo

Consolidar toda a base arquitetural do projeto.

### Entregas

- Repository Pattern
- Service Layer
- Controller Layer
- Governança
- Testes automatizados
- Organização do projeto

### Critério de conclusão

Arquitetura consolidada e estável.

---

## Fase 2 — Portal da Parceira

### Objetivo

Modernizar completamente o Portal da Parceira.

### Entregas

- Login
- Dashboard
- Perfil
- Briefings
- Ativações
- Upload
- Histórico
- Pagamentos

### Critério de conclusão

Portal totalmente funcional.

---

## Fase 3 — ERP Administrativo

### Objetivo

Centralizar toda a operação administrativa.

### Entregas

- Gestão de Parceiras
- Ciclos
- Ativações
- Logística
- Pagamentos
- Contratos
- Relatórios

### Critério de conclusão

Toda a operação administrativa executada pelo ERP.

---

## Fase 4 — Operação

### Objetivo

Automatizar processos operacionais.

### Entregas

- geração automática de ciclos;
- geração de contratos;
- notificações;
- fluxos automáticos;
- validações.

### Critério de conclusão

Redução máxima de tarefas manuais.

---

## Fase 5 — Escalabilidade

### Objetivo

Preparar a plataforma para crescimento.

### Entregas previstas

- melhorias de desempenho;
- observabilidade;
- monitoramento;
- preparação para uma futura V3.

### Critério de conclusão

Sistema preparado para expansão sem ruptura arquitetural.

---

# 5. Critérios de Qualidade

Toda entrega deve atender aos seguintes requisitos:

- testes automatizados verdes;
- arquitetura preservada;
- documentação atualizada quando necessário;
- commits pequenos e atômicos;
- nenhuma regressão funcional;
- código legível;
- reutilização antes de duplicação.

---

# 6. Fluxo Oficial de Desenvolvimento

Toda implementação deverá seguir a sequência:

1. Ler a documentação obrigatória.
2. Implementar um bloco lógico.
3. Executar os testes.
4. Corrigir falhas.
5. Realizar commit.
6. Atualizar a documentação quando aplicável.
7. Realizar o push manual.
8. Encerrar a sprint.

---

# 7. Critérios de Encerramento de Sprint

Uma sprint é considerada concluída quando:

- todos os objetivos definidos forem entregues;
- todos os testes permanecerem verdes;
- não existirem alterações pendentes;
- os commits estiverem realizados;
- o push tiver sido executado;
- a documentação estiver atualizada quando aplicável.

---

# 8. Próximas Grandes Entregas

A evolução macro da V2 seguirá, preferencialmente, esta ordem:

1. Consolidação de Ativações
2. Consolidação de Logística
3. Consolidação de Pagamentos
4. Portal da Parceira
5. Dashboard Administrativo
6. Upload HD
7. Contratos
8. Relatórios
9. Automações Operacionais

A priorização detalhada de cada sprint é mantida em:

**docs/PROJECT_STATUS.md**

---

# 9. Escopo da V2

Faz parte da V2:

- evolução incremental;
- organização do código;
- melhoria da arquitetura;
- evolução da experiência do usuário;
- novas funcionalidades do negócio.

Não faz parte da V2:

- migração para Supabase;
- migração para PostgreSQL;
- migração para Next.js;
- migração para NestJS;
- reescrita completa da plataforma.

Esses estudos permanecem separados para uma eventual V3.

---

# 10. Documento Vivo

Este roadmap é um documento vivo.

Ele deve ser atualizado apenas quando houver mudanças relevantes na direção do projeto.

Alterações de estado, progresso de sprint ou tarefas concluídas pertencem exclusivamente ao:

**docs/PROJECT_STATUS.md**
