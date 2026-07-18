# AUDITORIA — SPEC-012 (Conformidade) + Cobertura de Testes do Domínio

**Data:** 2026-07-16
**Autor:** Claude-Apoio (Revisor Técnico)
**Status:** Relatório de auditoria — nenhum código foi alterado.
**Escopo Parte 1:** `Entrega.js`, `EntregaACL.js`, `EntregaRepository.js`, `EntregaService.js`, `EntregaController.js` e costuras com `CompiladorDoMes.js`, `BriefingService.js`/`Briefing.js` e `Portal.js`.
**Escopo Parte 2:** regras de negócio (§10) das SPECs 001, 002, 005, 009, 012, 016 (entregues) e 023 (em implementação) × suíte `test/`.

---

# PARTE 1 · Auditoria de conformidade SPEC-012 × implementação

**Veredito geral:** implementação **fortemente aderente à SPEC** — máquina de 4 estados fiel (§9), CB-01/CB-03 e INV-04 corretos, coerção fail-fast exemplar na ACL (inclusive checagem de coerência na reidratação, `EntregaACL.js:203`), eventos só após persistência, zero PII na aba, colunas por cabeçalho. Os achados estão nas **costuras entre módulos** e em dívidas não registradas, não no núcleo.

## F1 · Reação a `MesCompilado` não é atômica e a idempotência sela o estado parcial

- **Arquivos:** `src/service/CompiladorDoMes.js:42-48,68-74`; `src/entrypoint/Portal.js:211-220`
- **SPEC:** Roadmap §6/S2 ("atômico e idempotente"); SPEC-012 RN-01; SPEC-005 RN-09/CB-01
- **Implementação atual:** o compilador persiste as Colaborações (`salvarTodas`) e **depois** publica `MesCompilado`, cujo consumidor cablado roda em sequência briefings → entregas → envios. Se qualquer materialização falhar, as Colaborações já estão gravadas. Na tentativa seguinte, `existeCompetencia` → `jaCompilada: true` → **no-op**: as materializações faltantes **nunca mais rodam**. Não há caminho de reparo.
- **Classificação:** Bug (arquitetural, de recuperação) · **Impacto:** Alto
- **Bloqueia SPEC futura?** Sim — SPEC-027 listaria pendências de competência inconsistente; SPEC-034 arquivaria estado incompleto.
- **Recomendação:** no ramo `jaCompilada`, reconciliar materializações ausentes (rodar `materializar*` apenas quando a aba da competência estiver vazia — as materializações são derivação pura do snapshot) ou expor comando de reparo. Registrar em ADR. Correção pequena, sem refatoração.

## F2 · `recriarCompetencia`/`substituirCompetencia` é destrutivo sem guarda de estado

- **Arquivos:** `src/acl/EntregaACL.js:108-122`; `src/repository/EntregaRepository.js:32-35` (padrão provável em `EnvioACL`)
- **SPEC:** INV-04 ("Entrega arquivada é somente leitura"); RNF-03 ("data de arquivamento preservada")
- **Implementação atual:** apaga **todas** as Entregas da competência e recria em `AguardandoMaterial` — destruiria uploads, aprovações e datas de arquivamento. Hoje inalcançável após a 1ª compilação (pelo no-op do F1), mas o método é público e **qualquer correção do F1 que re-dispare materialização cairia nele**.
- **Classificação:** Dívida técnica (latente, não registrada) · **Impacto:** Alto se F1 for corrigido sem esta guarda
- **Bloqueia SPEC futura?** Sim — condiciona a correção de F1 e a SPEC-034.
- **Recomendação:** guarda que recusa substituição quando existem Entregas da competência em estado ≠ `AguardandoMaterial` (fail-fast), ou semântica "criar apenas as ausentes". Corrigir **junto** com F1.

## F3 · `espelharAprovacoes` falha no meio do lote quando uma Entrega já foi publicada

- **Arquivos:** `src/service/EntregaService.js:91-97`; `src/domain/Entrega.js:179-182`; `src/domain/Briefing.js:129-145`; `src/entrypoint/Portal.js:262-272`
- **SPEC:** SPEC-009 RN-04/§14.1; SPEC-012 §14.1
- **Implementação atual:** nada impede publicar uma Entrega **antes** de o Briefing ser publicado (fluxos independentes). Quando o Briefing publicar, `espelharDataAprovacao` lança INV-04 na Entrega arquivada **no meio do `.map`**: blocos anteriores salvos, posteriores não. Pior: o Briefing já foi persistido como `Publicado` e `preencherEPublicar` exige `Rascunho` — **retry impossível**, Entregas restantes ficam sem data espelhada. Mesmo padrão de falha parcial se um bloco não tiver Entrega correspondente (CT-01).
- **Classificação:** Bug (caso de borda) · **Impacto:** Médio
- **Bloqueia SPEC futura?** Não.
- **Recomendação:** no espelhamento, **pular** Entregas arquivadas (documentando) em vez de lançar; teste de borda "publicar Entrega antes do Briefing".

## F4 · Escrita por reescrita total da aba, sem `LockService` — lost update em concorrência

- **Arquivos:** `src/acl/EntregaACL.js:129-145,261-265` (padrão repetido nas demais ACLs de escrita)
- **SPEC:** lacuna — nenhuma SPEC trata concorrência; PRD §10 (integridade)
- **Implementação atual:** `salvar()` faz read-all → filter → `clearContents()` + `setValues()` da **aba inteira**. Duas escritas concorrentes (duas Parceiras enviando material pelo Portal, ou operador aprovando enquanto uma Parceira envia) fazem a segunda reescrever a aba a partir de leitura obsoleta, **apagando silenciosamente** a escrita da primeira. Não há registro desta dívida.
- **Classificação:** Dívida técnica **não registrada** · **Impacto:** Baixo hoje / Alto a partir da SPEC-027
- **Bloqueia SPEC futura?** Sim — pré-condição de qualidade para escrita concorrente no Portal (S6).
- **Recomendação:** registrar a dívida; correção pequena e local: `LockService.getScriptLock()` envolvendo as operações de escrita na composição do entrypoint (sem refatorar as ACLs).

## F5 · CT-04/§13 — funções administrativas expostas sem verificação de papel

- **Arquivos:** `src/entrypoint/Portal.js` (todas as funções `google.script.run`); dívida parcialmente reconhecida em `src/service/EntregaService.js:20-21`
- **SPEC:** SPEC-012 §13 (Parceira não aprova/publica; equipe não envia material) e §17 CT-04
- **Implementação atual:** nenhuma função exposta verifica papel. Correto **hoje** (Web App restrito). O risco é a SPEC-025 gatear apenas as funções **novas** do Portal e deixar as administrativas expostas quando o acesso abrir.
- **Classificação:** Dívida técnica (registrada em comentário; sem item de verificação no plano) · **Impacto:** Alto no momento em que o Web App ficar público (S6)
- **Bloqueia SPEC futura?** Sim — a DoD da SPEC-025 deve incluir gate sobre **todas** as funções já expostas.
- **Recomendação:** item explícito na DoD da SPEC-025: "toda função `google.script.run` preexistente exige sessão de operador ou é bloqueada para Parceira".

## F6 · UC-012.01 pede "ordem cronológica"; a listagem devolve ordem física da aba

- **Arquivos:** `src/repository/EntregaRepository.js:75-82`
- **SPEC:** SPEC-012 UC-012.01; SPEC-027 UC-027.01
- **Implementação atual (histórico):** `listarPor` filtra e devolve na ordem das linhas da aba, sem ordenação — e a `Entrega` **não carrega chave cronológica própria** (a data de entrega vive no bloco do Briefing, SPEC-009).
- **Classificação:** Divergência da SPEC · **Impacto:** Baixo
- **Bloqueia SPEC futura?** Não — mas a SPEC-027 herda o requisito e **só a fachada dela pode cumpri-lo** (join com `bloco.dataEntrega` pelo `rotulo`).
- **Recomendação:** atribuir formalmente a ordenação à fachada da SPEC-027 e registrar a divergência aceita em UC-012.01. Não espelhar a data na Entrega (duplicaria fonte de verdade).
- ✅ **Resolvido (2026-07-18, auditoria de apoio):** `PortalDeConteudoService.listarPendencias` (SPEC-027, UC-027.01) agora ordena por `item.briefing.dataEntrega` (join já existente via `ItemDePendencia.de`/`blocoDe`) através do novo método `ordenarPorDataDeEntrega` — sort estável, itens sem bloco preenchido (RN-03) vão por último. `Entrega`/`EntregaRepository.listarPor` permanecem sem chave cronológica própria, exatamente como recomendado (não duplica fonte de verdade). `EntregaRepository.listarPor` (consumido por SPEC-012 fora do Portal) continua em ordem física — a SPEC-012 em si (equipe interna) não tinha requisito de ordenação registrado em teste, só a SPEC-027 herdava. Teste novo: `test/portal-conteudo-service.test.js` ("F6 (auditoria SPEC-012): ordena por dataEntrega..."); suíte completa 624/624 verde; lint limpo.

## F7 · Decisões do PO vivas só em comentário de código; documentos oficiais desatualizados

- **Arquivos:** `src/acl/EntregaACL.js:5-10` e `src/service/EntregaService.js:17-24` (Q-03, D-02 e nome do evento `ConteudoPublicado` "aprovados pelo PO em 2026-07-15") × `ARCHITECTURE_FREEZE_FINAL.md` §5 e SPEC-012 §21, que ainda listam Q-03/D-01/D-02 como 🟠 abertos; o Contrato §8 não nomeia o evento adotado.
- **Classificação:** Dívida documental/governança · **Impacto:** Médio (agente futuro pode bloquear num portão já decidido ou re-decidir diferente)
- **Bloqueia SPEC futura?** Não tecnicamente.
- **Recomendação:** PO/curador registrar ADR datado consolidando Q-03, D-02 e o batismo de `ConteudoPublicado` no catálogo (§8).

## Resumo da Parte 1

| Métrica | Valor |
|---|---|
| Total de achados | 7 (2 bugs, 1 divergência de SPEC, 4 dívidas técnicas/documentais; 0 falsos positivos) |
| Bloqueantes de SPECs futuras | 4 — F1, F2, F4, F5 |
| Adiáveis | 3 — F3, F6, F7 |

**Corrigir antes da SPEC-027 (antes/junto do bloco S6):** F1+F2 juntos (reconciliação idempotente com guarda anti-destruição — F1 já é risco operacional hoje); F4 (`LockService` no entrypoint); F5 (item obrigatório na DoD da SPEC-025).
**Sprint de qualidade:** F3, F6, F7.
Nenhum achado exige refatoração grande: F1/F2/F4 são correções localizadas (uma guarda, um ramo de reconciliação e um lock na composição), testáveis no harness existente.

---

# PARTE 2 · Auditoria de cobertura de testes das regras de negócio

**Método:** tabelas §10 das SPECs entregues × 40 arquivos de `test/` (referências a RN confirmadas pelos títulos dos casos).
**Veredito geral:** cobertura **excelente onde há implementação** — a suíte funciona como especificação executável, com bordas (CB-xx), invariantes (INV-xx) e disciplina de eventos testadas nominalmente. As lacunas são de dois tipos: **regras nunca implementadas** e **duas bordas cross-módulo de alto risco**.

## SPEC-001 · Cadastro de Parceira

| RN | Regra | Cobertura |
|---|---|---|
| RN-01 | Nasce `OFF`; ativação manual | ✅ 4 testes (inclusive "ignora status vindo do formulário") |
| RN-02 | Endereço resolvido por CEP no cadastro e em edições | ❌ **Sem teste porque não há implementação** — nenhum adaptador de CEP existe (`src/adapters/_contract.js:8`) |
| RN-03 | Só `ON` entra em compilação e contrato | ✅ `parceira-acl`, compilador, `documento-service` |

**Achado:** o roadmap declara o M1 aceito com "endereço recomposto após CEP; falha de CEP não bloqueia" (§5) — **critério de aceite não verificável hoje**. Divergência entre o aceite declarado do M1 e o código.

## SPEC-002 · Consulta/Edição Admin

| RN | Regra | Cobertura |
|---|---|---|
| RN-01/03 | (herdadas da SPEC-001) | ✅ |
| RN-02 | CEP em edições posteriores | ❌ mesma lacuna de implementação |
| RN-11 | Inativar preserva o registro (sem exclusão) | ⚠️ Parcial — testada só no domínio; sem teste de persistência da linha |

**Achado:** os casos de uso da SPEC-002 (consultar, editar, ativar/inativar via UI) **não têm service, controller nem entrypoint** — `ParceiraController` só tem `cadastrar()`. Domínio pronto e testado; fluxo inexistente. SPEC-002 efetivamente **incompleta**.

## SPEC-005 · Colaboração Mensal / Compilador

| RN | Regra | Cobertura |
|---|---|---|
| RN-01 | Máx. 1 Colaboração por Parceira×mês | ⚠️ Parcial — identidade + no-op; falta duplicata no mesmo lote (risco baixo) |
| RN-02 | Várias competências ao longo do tempo | ✅ |
| RN-03 | Compilação atômica | ⚠️ **Parcial — maior risco.** Atômica no lote de Colaborações; **sem teste do cenário cross-módulo** (falha na materialização a jusante após persistir — ver F1) |
| RN-04 | Snapshot = condições do instante | ✅ |
| RN-05 | Snapshot imutável | ✅ (congelamento profundo) |
| RN-06 | Alterações não retroagem | ✅ |
| RN-07 | Pertence a 1 mês × 1 Parceira | ✅ |
| RN-08 | Arquivada é imutável | ✅ |
| RN-09 | `CompilarMes` idempotente | ✅ |
| RN-10 | Snapshot sem PII | ✅ (CM-04 + projeção curada) |

## SPEC-009 · Briefing

| RN | Regra | Cobertura |
|---|---|---|
| RN-01 | Aprovação = postagem−7, 4 bordas de dia | ✅ Completa (dia útil, sexta+3, sábado+2, domingo+1) |
| RN-02 | Um bloco por formato contratado | ✅ |
| RN-03 | Recriado a cada compilação | ✅ |
| RN-04 | Data espelhada na Entrega | ⚠️ Caminho feliz ✅; **borda sem teste**: espelhamento com Entrega já `Publicado` (ver F3) |

## SPEC-012 · Conteúdo/Entregas

| RN | Regra | Cobertura |
|---|---|---|
| RN-01 | Uma Entrega por unidade contratada | ✅ |
| RN-02 | Máquina de 4 estados | ✅ |
| RN-03 | Upload → `EmRevisao` | ✅ (+ CB-01 re-upload) |
| RN-04 | Publicar arquiva com data | ✅ (+ CB-03, INV-04) |
| RN-05 | Estado desconhecido fail-fast | ✅ (CT-02 + incoerência EM_REVISAO sem link) |

Única lacuna: UC-012.01 "ordem cronológica" sem teste — coerente, pois também não há implementação (F6).

## SPEC-016 · Logística/Envio

| RN | Regra | Cobertura |
|---|---|---|
| RN-01 | Envio por Ativa, nasce `AguardandoConfirmacao` | ✅ |
| RN-02 | Rastreio preenche data se vazia | ✅ (+ CB-02) |
| RN-03 | Entregue → arquiva com data | ✅ |
| RN-04 | Revisão e Jornada independentes | ✅ (nos dois sentidos) |
| RN-05 | Estado desconhecido fail-fast | ✅ |

Cobertura exemplar, incluindo PII (INV-04 em `toString`/JSON) e degradabilidade do adaptador (CB-01).

## SPEC-023 · Documentos (em implementação — leitura informativa)

RN-01 (contrato só Ativa) ✅ e RN-02 (briefing formal só `SIM`) ✅ já cobertos. **RN-03 (dados comerciais refletem termos vigentes/Snapshot) ainda sem teste nomeado** — sinalizar ao agente implementador antes da DoD.

## Testes faltantes, priorizados por risco

| Prioridade | Teste faltante | SPEC/RN | Risco |
|---|---|---|---|
| **P1** | Slice: falha na materialização a jusante após `salvarTodas` → documenta estado parcial + no-op (protege a correção de F1/F2) | SPEC-005 RN-03 | Alto — corrupção operacional silenciosa e irrecuperável |
| **P2** | Espelhamento de aprovação com uma Entrega já `Publicado` no lote | SPEC-009 RN-04 / SPEC-012 INV-04 | Médio-alto — falha parcial sem retry (F3) |
| **P3** | Persistência da inativação: linha preservada na aba após `inativar()` | SPEC-002 RN-11 | Médio |
| **P4** | (bloqueado) RN-02/CEP — exige implementar o adaptador primeiro | SPEC-001/002 RN-02 | Médio — aceite do M1 não verificável |
| **P5** | Duplicata de Parceira no mesmo lote de compilação | SPEC-005 RN-01 | Baixo |
| **P6** | Ordem cronológica de UC-012.01 — aguardar decisão da fachada SPEC-027 | SPEC-012 | Baixo |

## Resumo da Parte 2

- **Regras auditadas:** 30 (6 SPECs entregues) + 3 da SPEC-023 em andamento.
- **Cobertas:** 24 ✅ · **Parciais:** 4 ⚠️ (SPEC-005 RN-01/RN-03, SPEC-009 RN-04, SPEC-002 RN-11) · **Sem teste por ausência de implementação:** 2 ❌ (RN-02 CEP nas SPEC-001/002).
- **Achados que transcendem testes:** (1) SPEC-002 tem domínio pronto mas casos de uso inexistentes; (2) o adaptador de CEP do aceite do M1 nunca foi construído. Ambos pedem decisão do PO: completar o M1 ou registrar formalmente o corte de escopo.
- Os dois testes de maior valor (P1 e P2) cobrem exatamente F1 e F3 — escrevê-los **antes** das correções os transforma em testes de caracterização, no espírito das regras do projeto.
