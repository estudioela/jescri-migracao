# ADR-012 — Renome de Ativação/Fluxo Logístico para Entrega/Envio

- **Status:** Aceito
- **Data:** 2026-07-16
- **Autores:** Arquitetura TEAR
- **Resolve:** achado de auditoria registrado no `TASK_ROUTER.md` §7 (FASE 4 pós-SPECs)
- **Relaciona-se com:** ADR-003 (Linguagem Ubíqua do Domínio), CONTRATO_SOBERANO.md §4/§6.3, SPEC-012, SPEC-016
- **Substitui:** os termos "Ativação" e "Fluxo Logístico" como nomes dos agregados de conteúdo e de logística no vocabulário normativo do domínio.

---

## 1. Contexto

O domínio TEAR nomeou originalmente dois agregados vizinhos da Colaboração Mensal segundo a mecânica da planilha legada:

- **"Ativação"**: unidade de conteúdo contratada num formato (o que hoje o código chama `Entrega`).
- **"Fluxo Logístico"**: registro do envio físico do produto a uma Parceira (o que hoje o código chama `Envio`).

Esses dois termos foram substituídos por `Entrega` e `Envio` durante a especificação de SPEC-012 (Gestão de Conteúdo) e SPEC-016 (Gestão Logística), e o renome já está materializado em `src/domain/Entrega.js` e `src/domain/Envio.js` — ambos os arquivos documentam explicitamente "era 'Ativação'" e "era 'Fluxo Logístico'" em seus comentários de cabeçalho — assim como nos glossários §4 de SPEC-012 e SPEC-016, e na tabela de composições do ADR-003 (linha "Composições": `Briefing da Colaboração`, `Entrega`, `Envio`, `Obrigação Financeira da Colaboração`).

A auditoria da FASE 4 pós-SPECs (2026-07-16, registrada em `docs/_workspace/TASK_ROUTER.md` §7) encontrou que `CONTRATO_SOBERANO.md` §4 (Linguagem Ubíqua Oficial) nunca foi atualizado para acompanhar essa migração — ainda lista `Ativacao` e `EnvioLogistico` como termos oficiais, divergindo do código, das SPECs e do próprio ADR-003. Diferente do caso resolvido pelo ADR-003 (Q-02, vocabulário do agregado `Colaboração Mensal`), esta divergência específica nunca teve um ADR próprio — faltava o registro formal da decisão já tomada e aplicada.

## 2. Problema

Formalizar, com um ADR análogo ao ADR-003, o renome já efetivado no código e nas SPECs de `Ativação` → `Entrega` e `Fluxo Logístico` → `Envio`, e atualizar `CONTRATO_SOBERANO.md` §4 para eliminar a última divergência normativa — sem reabrir a decisão em si (ela já está em produção conceitual desde SPEC-012/016), apenas documentando-a e fechando o desalinhamento do Contrato.

Cuidado necessário: o termo "ativação" é homônimo. Ele também nomeia, em `Parceira` (SPEC-001/002), a transição de vínculo `Inativa → Ativa` (`Parceira.ativar()`, RN-01). Esse segundo sentido é um conceito de domínio **diferente** e **não** é afetado por este ADR — nenhuma ocorrência de "ativação"/"ativar"/"Ativa" referente ao vínculo da Parceira deve ser alterada.

## 3. Alternativas Consideradas

### A) Não formalizar — manter a divergência como dívida documentada
- **Prós:** custo zero imediato.
- **Contras:** perpetua uma fonte soberana (`CONTRATO_SOBERANO.md`) desalinhada do código e das SPECs; qualquer leitor que confronte o Contrato com `Entrega.js`/`Envio.js` encontra vocabulário divergente sem explicação; a própria dívida já está registrada como pendente de decisão no `TASK_ROUTER.md` §7 — não decidir é adiar indefinidamente.

### B) Reverter o código para "Ativação"/"Fluxo Logístico"
- **Prós:** alinharia com o Contrato sem editá-lo.
- **Contras:** reabriria uma decisão de nomenclatura já tomada, testada e documentada em SPEC-012/016 (que justificam a troca: "Ativação" colide semanticamente com o vínculo Ativa/Inativa da Parceira; "Fluxo Logístico" é mecânico, não nomeia o conceito de negócio); custo de migração maior (código + testes + specs) que a alternativa C; contraria o princípio de que o Contrato descreve o destino arquitetural (§Regras Soberanas), não a implementação legada.

### C) Formalizar o renome com ADR e atualizar o Contrato (adotada)
- **Prós:** elimina a única divergência normativa remanescente; documenta formalmente uma decisão que já rege o código e as SPECs há duas iterações; resolve a colisão semântica entre "Ativação" (conteúdo) e "ativação" (vínculo da Parceira), que o termo antigo carregava; segue o precedente e o formato já aceitos no projeto (ADR-003).
- **Contras:** nenhum de fundo — é registro de uma decisão já em vigor, não uma nova migração de código.

## 4. Decisão

**Adota-se a Alternativa C.**

Os termos canônicos da linguagem ubíqua do domínio TEAR para os agregados vizinhos da `Colaboração Mensal` são:

| Papel | Termo canônico | Termo banido (antigo) |
|---|---|---|
| Agregado de conteúdo | **`Entrega`** | `Ativação` |
| Agregado de logística | **`Envio`** | `Fluxo Logístico` (e a forma híbrida `EnvioLogistico`) |

`Ativação`/`Fluxo Logístico`/`EnvioLogistico` tornam-se termos banidos do domínio quando referentes a estes dois agregados — não podem aparecer em SPECs, código, eventos, APIs ou documentação normativa nova.

**Exceção explícita (homônimo preservado):** o verbo/estado "ativação"/"ativar"/"Ativa"/"Inativa" referente ao vínculo da `Parceira` (RN-01, SPEC-001/002) **não** é afetado por esta decisão — continua sendo o termo correto para esse conceito, que é diferente e não guarda relação com `Entrega`.

Nomes físicos de aba/coluna legados (`ATIVACOES`, `FLUXO LOGISTICO`, referenciados em `CONTRATO_SOBERANO.md` §7) não são alterados por este ADR — são artefatos de persistência física mapeados pela ACL, não vocabulário de domínio (§3 do Contrato: "nenhuma camada fora da ACL pode depender de nome físico de coluna").

## 5. Consequências

### Positivas
- `CONTRATO_SOBERANO.md` §4 passa a refletir o vocabulário real do código, das SPECs (012/016) e do ADR-003.
- Remove a colisão semântica entre "Ativação" (conteúdo) e "ativação" (vínculo da Parceira) do documento soberano.
- Fecha o último item de divergência terminológica pendente no `TASK_ROUTER.md` §7.

### Negativas / Trade-offs
- Nenhuma migração de código é necessária — `Entrega`/`Envio` já são os nomes em uso desde SPEC-012/016; o custo desta decisão é puramente documental (CONTRATO_SOBERANO.md §4).

### Riscos residuais
- Os mapeamentos físicos de §7 do Contrato (`ATIVACOES`, `FLUXO LOGISTICO`) continuam usando os nomes legados de aba/coluna — aceitável, pois são artefatos de persistência, não de linguagem ubíqua (mesmo raciocínio do ADR-003 para referências externas).

## 6. Aplicação

Diferente do ADR-003 (que abriu um plano de migração faseado), esta decisão já está aplicada no código e nas SPECs — resta apenas:

1. Este ADR é aprovado e mesclado no repositório.
2. `CONTRATO_SOBERANO.md` §4: substituir `Ativacao` por `Entrega` e `EnvioLogistico` por `Envio`.
3. `docs/_workspace/TASK_ROUTER.md` §7: mover este item de "Registradas para decisão" para "Corrigidas", referenciando este ADR.

**Critério de conclusão:** `CONTRATO_SOBERANO.md` §4 não contém mais `Ativacao` nem `EnvioLogistico`.

---

**Referências**
- `CONTRATO_SOBERANO.md` §4, §6.3
- `docs/_workspace/TASK_ROUTER.md` §7 (achado da FASE 4 pós-SPECs)
- ADR-003 — Linguagem Ubíqua do Domínio (tabela de Composições)
- `src/domain/Entrega.js`, `src/domain/Envio.js` (comentários "era 'Ativação'"/"era 'Fluxo Logístico'")
- SPEC-012 §4 — `Entrega`
- SPEC-016 §4 — `Envio`
