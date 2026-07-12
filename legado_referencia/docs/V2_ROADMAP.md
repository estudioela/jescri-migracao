# V2 — Roadmap do Projeto Tear

> Documento oficial de evolução da V2.
>
> Este roadmap define a direção do projeto, as fases de implementação e os
> critérios de evolução da plataforma.
>
> O estado atual da implementação deve ser consultado em:
>
> **docs/PROJECT_STATUS.md**
>
> As regras permanentes do projeto encontram-se em:
>
> **docs/PROJECT_PHILOSOPHY.md**
>
> **docs/KNOWN_DECISIONS.md**

---

# 1. Objetivo

Consolidar o Projeto Tear como uma plataforma profissional de gestão de
influenciadoras utilizando Google Apps Script como infraestrutura da V2,
priorizando estabilidade, organização, modularização e facilidade de evolução.

A V2 não representa uma migração tecnológica.

Ela representa a evolução da arquitetura existente.

---

# 2. Princípios

Toda evolução da V2 deve respeitar os seguintes princípios:

- estabilidade antes de novas funcionalidades;
- pequenas entregas incrementais;
- arquitetura por camadas;
- baixo acoplamento;
- alta coesão;
- testes automatizados;
- documentação mínima porém suficiente;
- economia de contexto para agentes de IA;
- nenhuma reescrita completa sem necessidade comprovada.

---

# 3. Arquitetura

A arquitetura oficial da V2 é composta pelas seguintes camadas:

```
Portal Parceira

↓

Roteador

↓

Controllers

↓

Services

↓

Repositories

↓

Google Sheets
```

Responsabilidades:

- Frontend → Interface do usuário.
- Controller → Casos de uso.
- Service → Regras de negócio.
- Repository → Persistência.
- Infraestrutura → Apps Script / Google Sheets.

---

# 4. Fases da V2

## Fase 1 — Fundação

Objetivo:

Consolidar toda a base arquitetural.

Entregas:

- Repository Pattern
- Service Layer
- Controller Layer
- Governança
- Testes
- Organização do projeto

Critério de conclusão:

Arquitetura consolidada e estável.

---

## Fase 2 — Portal da Parceira

Objetivo:

Modernizar completamente o Portal.

Entregas:

- Login
- Dashboard
- Perfil
- Briefing
- Ativações
- Upload
- Histórico
- Pagamentos

Critério de conclusão:

Portal totalmente funcional.

---

## Fase 3 — ERP Administrativo

Objetivo:

Centralizar toda a operação.

Entregas:

- Gestão de Parceiras
- Ciclos
- Ativações
- Logística
- Pagamentos
- Contratos
- Relatórios

Critério de conclusão:

Operação administrativa executada integralmente pelo ERP.

---

## Fase 4 — Operação

Objetivo:

Automatizar processos.

Entregas:

- geração de ciclos;
- geração de contratos;
- notificações;
- fluxos automáticos;
- validações.

Critério de conclusão:

Redução máxima de tarefas manuais.

---

## Fase 5 — Escalabilidade

Objetivo:

Preparar a plataforma para crescimento.

Entregas previstas:

- melhorias de desempenho;
- observabilidade;
- monitoramento;
- preparação para futura V3.

Critério de conclusão:

Sistema preparado para expansão sem ruptura arquitetural.

---

# 5. Critérios de Qualidade

Toda entrega deve atender aos seguintes requisitos:

- testes verdes;
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
3. Executar testes.
4. Corrigir falhas.
5. Realizar commit.
6. Atualizar documentação quando aplicável.
7. Push manual.
8. Encerrar a sprint.

---

# 7. Critérios de Encerramento de Sprint

Uma sprint é considerada concluída quando:

- todos os objetivos definidos forem entregues;
- todos os testes permanecerem verdes;
- não existirem alterações pendentes;
- commits estiverem realizados;
- push realizado;
- documentação atualizada quando aplicável.

---

# 8. Próximas Grandes Entregas

A ordem macro de evolução da V2 é:

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
- melhorias de UX;
- novas funcionalidades do negócio.

Não faz parte da V2:

- migração para Supabase;
- PostgreSQL;
- Next.js;
- NestJS;
- reescrita completa da plataforma.

Esses estudos permanecem documentados separadamente para eventual V3.

---

# 10. Documento Vivo

Este roadmap é um documento vivo.

Ele deve ser atualizado apenas quando houver mudanças relevantes na direção do projeto.

Alterações de estado, progresso de sprint ou tarefas concluídas pertencem exclusivamente ao:

**docs/PROJECT_STATUS.md**git status