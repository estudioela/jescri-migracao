# MATRIZ DE MIGRAÇÃO DOCUMENTAL

> Status: Em elaboração

Este documento define o destino de todo conhecimento existente na documentação do Projeto Tear.

Nenhuma informação poderá ser removida antes de estar corretamente incorporada ao seu destino oficial.

---

# Objetivo

Garantir migração com perda zero de conhecimento.

A Matriz de Migração é o documento que conecta:

Inventário
↓

Documentação Oficial

---

# Legenda

🟢 Migração direta

🟡 Consolidação

🔵 Histórico

🔴 Remoção (apenas após validação)

---

# Matriz

| Documento de Origem | Informação | Documento de Destino | Situação |
|----------------------|------------|----------------------|----------|
| README.md | Visão geral do projeto | README.md | ⬜ |
| README.md | Objetivos do sistema | README.md | ⬜ |
| PROJECT_STATUS.md | Estado atual do projeto | PROJECT_STATUS.md (avaliar permanência) | ⬜ |
| PROJECT_STATUS.md | Pendências técnicas | KNOWN_DECISIONS.md ou Workspace | ⬜ |
| SYSTEM_MAP.md | Arquitetura do sistema | SYSTEM_MAP.md | ⬜ |
| SYSTEM_MAP.md | Estrutura de diretórios | SYSTEM_MAP.md | ⬜ |
| PROJECT_PHILOSOPHY.md | Filosofia do projeto | PROJECT_PHILOSOPHY.md | ⬜ |
| KNOWN_DECISIONS.md | Decisões permanentes | KNOWN_DECISIONS.md | ⬜ |
| AI_WORKFLOW.md | Fluxo para agentes de IA | AI_WORKFLOW.md | ⬜ |
| V2_ROADMAP.md | Planejamento histórico | docs/HISTORICO/ | ⬜ |
| V2_ESPECIFICACAO_TECNICA.md | Arquitetura V2 | docs/HISTORICO/ | ⬜ |
| CHANGELOG_DE_DESENVOLVIMENTO.md | Histórico de alterações | docs/HISTORICO/ | ⬜ |
| MAPA_SISTEMA.txt | Estrutura do sistema | SYSTEM_MAP.md | ⬜ |
| PLANO_MIGRACAO_TEAR.md | Estratégia de migração | docs/HISTORICO/ ou Workspace | ⬜ |
| INFOS SOBRE ERP - JESCRI.md | Regras de negócio | README.md / SYSTEM_MAP.md / KNOWN_DECISIONS.md (avaliar) | ⬜ |

---

# Critérios de Conclusão

Uma linha só poderá ser marcada como concluída quando:

- A informação estiver incorporada ao destino.
- A migração for validada.
- Não existir duplicação.
- A origem puder ser arquivada ou removida com segurança.

---

# Observações

A Matriz de Migração é o documento de controle da Sprint.

Toda movimentação de conhecimento deverá passar por ela antes de alterar a documentação oficial.
