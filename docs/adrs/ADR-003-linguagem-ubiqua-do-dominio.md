# ADR-002 — Linguagem Ubíqua do Domínio TEAR

- **Status:** Aceito
- **Data:** 2026-07-14
- **Autores:** Arquitetura TEAR
- **Resolve:** Q-02 (`IMPLEMENTATION_PLAN.md`)
- **Relaciona-se com:** ADR-001 (MesReferencia), CONTRATO_SOBERANO §2/§6/§7, SPEC-005 v2.0
- **Substitui:** vocabulário "Ciclo Mensal" / "Parceria em Ciclo" / "Combinado do Ciclo" nos documentos conceituais.

---

## 1. Contexto

O projeto TEAR possui, em sua Fase 4 (Especificação), dois vocabulários concorrentes para o mesmo conceito de negócio — a unidade operacional mensal entre a marca e cada parceira:

- **Grupo A ("Ciclo Mensal"):** PRD, 03 (Fronteiras do Domínio), 04 (Capacidades), 06 (Modelo Conceitual). Todo o modelo conceitual e o glossário do PRD foram construídos com este vocabulário, herdado da planilha operacional legada.
- **Grupo B ("Colaboração Mensal"):** CONTRATO_SOBERANO.md §2, §6 e §7. Este documento declara `Ciclo` e `Plano de Colaboração` como **termos banidos** do domínio e fixa como canônicos: `Colaboração Mensal`, `MesReferencia`, `Compilador do Mês`.

`IMPLEMENTATION_PLAN.md` reconhece formalmente a inconsistência como **Q-02** e a marca como bloqueadora de M2 (a fase que materializa o mês) e de toda a linguagem ubíqua subsequente.

## 2. Problema

Definir a **linguagem ubíqua oficial** do domínio TEAR, de forma que:

1. Um único vocabulário atravesse PRD, modelo conceitual, SPECs, código, eventos, migrações e APIs.
2. A decisão seja consistente com o Contrato Soberano ou, se contrariá-lo, o faça de forma explícita e fundamentada.
3. A decisão seja durável — não force nova migração terminológica ao introduzir cadências alternativas (avulso, quinzenal, trimestral) no futuro.
4. A decisão preserve os princípios de DDD: o termo deve **nomear o conceito de negócio**, não a mecânica de implementação.

## 3. Alternativas Consideradas

### A) Manter "Ciclo Mensal" e revogar o Contrato Soberano §2
- **Prós:** custo zero de migração documental.
- **Contras:** `Ciclo` é substantivo mecânico e ambíguo (colide com ciclo de vida do vínculo, ciclo de aprovação, ciclo de pagamento); não escala para outras cadências; exige revogação do único documento declarado soberano — mudança de governança maior que Q-02.

### B) Adotar "Colaboração Mensal" (Contrato Soberano)
- **Prós:** alinha o corpus ao documento soberano; nomeia a **relação** (parceira × mês), não a cadência; casa com o trio canônico `Colaboração Mensal` + `MesReferencia` + `Compilador do Mês`; ausente de colisões semânticas; escalável a outras cadências sem renomear o agregado.
- **Contras:** exige migração terminológica localizada em PRD, 03, 04 e 06 (mecânica, sem impacto de negócio).

### C) Terceiro termo (ex.: "Parceria Mensal", "Campanha Mensal")
- **Prós:** poderia mediar os dois grupos.
- **Contras:** cria um terceiro vocabulário sem endosso documental; "Campanha" é herança de marketing legado (rejeitada pelo PRD §6.2 como sinônimo secundário); "Parceria" já é usada para o vínculo permanente (Parceira) e geraria colisão nova.

## 4. Decisão

**Adota-se a Alternativa B.**

A linguagem ubíqua oficial do domínio TEAR é:

| Papel | Termo canônico | Natureza |
|---|---|---|
| Agregado central | **`Colaboração Mensal`** | Encontro Parceira × MesReferencia. Unidade fundamental do produto. |
| Eixo temporal | **`MesReferencia`** | Value Object `AAAA-MM`, ordenável, imutável (ADR-001). |
| Serviço de domínio | **`Compilador do Mês`** | Materializa, para um dado `MesReferencia`, uma `Colaboração Mensal` por Parceira Ativa. |
| Snapshot | **`Snapshot Comercial da Colaboração`** | Fotografia dos Termos Comerciais Vigentes no ato da compilação. |
| Composições | **`Briefing da Colaboração`**, **`Entrega`**, **`Envio`**, **`Obrigação Financeira da Colaboração`** | Substituem `Combinado do Ciclo`, mantendo cardinalidades. |
| Eventos de domínio | **`MesCompilado`**, **`CompetenciaArquivada`** | Substituem `CicloMensalAberto` / `CicloMensalEncerrado`. |

**Termos banidos do domínio** (não podem aparecer em SPECs, código, eventos, APIs, migrations, tabelas ou documentação normativa): `Ciclo`, `Ciclo Mensal`, `Campanha`, `Parceria em Ciclo`, `Combinado do Ciclo`, `Plano de Colaboração`.

Termos banidos permanecem admissíveis apenas em conversas informais de time, quando útil para transição — nunca em artefato normativo.

## 5. Consequências

### Positivas
- **Consistência total** entre Contrato Soberano, SPEC-005 v2.0 e demais artefatos após migração.
- **DDD íntegro**: o agregado nomeia o conceito, não o mecanismo.
- **Escalabilidade**: novas cadências (avulsa, trimestral) apenas variam o adjetivo (`Colaboração Avulsa`), sem renomear agregado, eventos ou APIs.
- **Coesão de bounded context**: elimina colisões com "ciclo de vida", "ciclo de aprovação", "ciclo de pagamento".
- **Fecha Q-02** definitivamente e desbloqueia M2 do plano de implementação.

### Negativas / Trade-offs
- Migração terminológica em 4 documentos (PRD, 03, 04, 06) — mecânica.
- Curva breve de adaptação para especialistas de negócio herdeiros do vocabulário legado — mitigada por glossário único no PRD e por nota de tradução `Ciclo Mensal ≡ Colaboração Mensal` (temporária).

### Riscos residuais
- Referências externas (planilha legada, comunicações com parceiras) podem continuar usando "Ciclo Mensal". Aceitável — não são artefatos do domínio.

## 6. Plano de Migração

**Fase M0 — Ratificação (imediata, dia 0)**
1. Este ADR é aprovado e mesclado no repositório.
2. `DECISOES_BLOQUEANTES.md`: Q-02 marcada como **RESOLVIDA → ADR-002**.
3. `IMPLEMENTATION_PLAN.md`: Q-02 removida da lista de bloqueadores; nota de link para ADR-002.

**Fase M1 — Migração documental (dias 1–2)**
4. `PRD.md`: substituir todas as ocorrências de `Ciclo Mensal` / `Ciclo` (quando referirem a unidade mensal) por `Colaboração Mensal`; atualizar §6.2 e glossário; incluir nota de tradução.
5. `03_FRONTEIRAS_DO_DOMINIO.md`: renomear a fronteira correspondente e ajustar dependências.
6. `04_CAPACIDADES_DO_SISTEMA.md`: renomear seção B ("Condução do ciclo mensal") → "Condução da Colaboração Mensal"; reescrever bullets com o novo vocabulário e introduzir `Compilador do Mês` como capacidade nomeada.
7. `06_MODELO_CONCEITUAL_DOS_DADOS.md`: renomear C12/C13/C14/C15 conforme §4 desta decisão; atualizar todas as referências cruzadas e a seção de relacionamentos.

**Fase M2 — Especificações (dias 2–3)**
8. `SPEC-005.md`: publicar a v2.0 já revisada (que adota o novo vocabulário) como versão oficial.
9. Verificar SPECs adjacentes (004, 006…) por eventuais menções remanescentes.

**Fase M3 — Guarda-corpos (contínuo)**
10. Adicionar ao `ENGENHARIA.md` uma checklist de PR: nenhum artefato normativo deve conter os termos banidos.
11. Opcional: linter/CI que falha se `Ciclo Mensal` / `Parceria em Ciclo` aparecerem em `docs/`, `specs/`, migrations ou código.

**Critério de conclusão da migração:**
`grep -RniE "ciclo mensal|parceria em ciclo|combinado do ciclo|plano de colaboração" docs/ specs/ src/ migrations/` retorna vazio (exceto ADR-002 e nota de tradução do PRD).

---

**Referências**
- `CONTRATO_SOBERANO.md` §2, §6, §7
- `IMPLEMENTATION_PLAN.md` Q-02, Fase 2
- ADR-001 — MesReferencia
- SPEC-005 v2.0 — Colaboração Mensal
- Evans, E. *Domain-Driven Design*, cap. 2 (Ubiquitous Language)
