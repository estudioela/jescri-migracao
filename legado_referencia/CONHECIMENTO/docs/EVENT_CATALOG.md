# Catálogo de Eventos — TEAR V2

> **Fontes (exclusivas):** [`docs/PLANILHA_TEAR_1.0_MAPA.md`](./PLANILHA_TEAR_1.0_MAPA.md), [`docs/DOMAIN_MODEL.md`](./DOMAIN_MODEL.md) (§8) e as *Diretrizes de Engenharia*.
> **Natureza:** catálogo consolidado de **eventos** (fatos no passado), **comandos** (imperativos que os disparam), **políticas** (reações automáticas) e **gatilhos**. Estende o catálogo do modelo (§8) com os eventos ausentes identificados na Fase 2.5, justificando cada adição.
> **Escopo:** Fase 2.5 — consolidação arquitetural. Não altera os documentos de referência. Sem código, tecnologia ou framework.
> **Convenção:** eventos no **passado** (`CicloGerado`); comandos no **imperativo** (`GerarCicloMensal`); políticas como **"quando X então Y"**. Status: `MODELO` = já em DOMAIN_MODEL §8; `NOVO` = adicionado aqui; `A CONFIRMAR` = depende de validação.

---

## 1. Eventos de domínio

### 1.1 Eventos já no modelo (mantidos)

Nomenclatura e semântica confirmadas — todos no passado, correspondendo a fatos (DDD Reviewer: nomenclatura correta).

| Evento | Produtor | Consumidor(es) | Gatilho | Status |
|---|---|---|---|---|
| `InscriçãoRecebida` | Inscrição | Fila de triagem | Submissão do formulário | MODELO |
| `ParceiraCadastrada` | Parceira | — | Promoção concluída | MODELO |
| `ParceiraAtivada` | Parceira | GeradorDeCicloMensal (próximos Ciclos) | Admin liga STATUS ON | MODELO |
| `ParceiraDesativada` | Parceira | GeradorDeCicloMensal | Admin liga STATUS OFF | MODELO |
| `ContratoAtualizado` | Parceira | — (vale para Ciclos futuros) | Admin altera termos | MODELO |
| `CicloGerado` | Ciclo | Ativação, Briefing, Envio, Pagamento | Comando de geração do mês | MODELO |
| `AtivaçãoAgendada` | Ativação | Briefing | Data + formato definidos | MODELO |
| `ConteúdoAprovado` | Ativação | — | Admin aprova a peça | MODELO |
| `AjusteSolicitado` | Ativação | — | Admin pede ajustes | MODELO |
| `ConteúdoPostado` | Ativação | Histórico (arquiva) | Admin marca `POSTADO` | MODELO |
| `BriefingPublicado` | Briefing | — | Orientação disponibilizada | MODELO |
| `BriefingAtualizado` | Briefing | — | Orientação alterada | MODELO |
| `EnvioRegistrado` | Envio | — | Remessa criada | MODELO |
| `RastreioAtualizado` | Envio | — | Status vindo da transportadora | MODELO |
| `ProdutoEntregue` | Envio | (habilita produção — ver P-14) | Rastreio indica entrega | MODELO |
| `PagamentoSolicitado` | Pagamento | — | Cobrança emitida | MODELO |
| `PagamentoConfirmado` | Pagamento | Histórico (arquiva) | Admin marca `PAGO` | MODELO |

### 1.2 Eventos ausentes — adicionados na Fase 2.5

Cada adição resolve uma lacuna apontada por dois ou mais revisores.

| Evento | Produtor | Consumidor(es) | Por que faltava | Sev. | Status |
|---|---|---|---|---|---|
| `AtivaçãoReagendada` | Ativação | Briefing (recalcula aprovação) | **O evento mais importante que falta.** Existe só o agendamento inicial; quando o admin muda a `DATA`, nada propaga ao Briefing e a data de aprovação fica obsoleta para sempre (INV-22). | ALTA | NOVO |
| `ContratoGerado` | Parceira | CalculadoraDeReferenciaMensal | A **primeira** definição do contrato é distinta de "atualizar". É ela que carimba a `DATA` e dispara a regra do mês seguinte; hoje só existe `ContratoAtualizado`. | ALTA | NOVO |
| `DataDeAprovaçãoCalculada` | Briefing | Painel de aprovações | A regra mais crítica e testável (data−7) não emitia fato; ficava escondida dentro do Briefing (Event Storming L4; DDD I4). | ALTA | NOVO |
| `RecebimentoConfirmado` | Envio | Produção (gate P-14) | Entre `ProdutoEntregue` e o início da produção há uma confirmação de recebimento (`STATUS REVISÃO = Aguardando Confirmação`, mapa linha 103). Sem ela, o gate "recebeu → pode produzir" não conecta logística e conteúdo. | ALTA | A CONFIRMAR |
| `CicloEncerrado` | Ciclo | Relatórios / fechamento | Não há fechamento do mês. O `PeriodoOperacional` tem fim, mas nenhum fato o marca; o ciclo de vida do mês nunca fecha (Event Storming L1; Business Analyst F4). | ALTA | A CONFIRMAR |
| `InscriçãoPromovida` | Inscrição | Parceira (origem) | A promoção (decisão de curadoria) é distinta da criação da Parceira; sem ela não há rastro da aprovação. | MÉDIA | NOVO |
| `InscriçãoRejeitada` | Inscrição | Fila de triagem | Não há caminho negativo; FORMS acumula lixo (mapa inconsistência #5) sem forma de descartar formalmente. | MÉDIA | NOVO |
| `EndereçoEnriquecido` | Parceira | Envio (indica endereço pronto) | Enriquecimento por CEP (ACL) é um fato relevante; sem ele, um Envio pode ser gerado com endereço incompleto. | MÉDIA | NOVO |
| `MensagemDeCobrançaGerada` | Pagamento | — | A mensagem de WhatsApp é derivada e distinta de "cobrança solicitada" (mapa linha 149). | MÉDIA | NOVO |
| `ItemArquivado` | Histórico | — | O arquivamento é um fato: o item saiu do operacional. Sem ele, "postado" e "arquivado" ficam indistinguíveis; sustenta a atomicidade de INV-16. | MÉDIA | NOVO |
| `PagamentoArquivado` | Histórico | — | Idem para o Pagamento `PAGO`. | MÉDIA | NOVO |
| `CupomGerado` | Parceira | — | Fato discreto útil para auditoria do cupom `NOME+10`. | BAIXA | NOVO |
| `MaterialAnexado` | Ativação | — | Anexar o link da pasta do mês (col G) é passo real antes de `POSTADO`. | BAIXA | NOVO |

### 1.3 Eventos avaliados e **não** adicionados (decisão do Arquiteto)

Nem toda sugestão dos revisores foi aceita — Diretriz de não inflar o vocabulário sem ganho de negócio.

| Sugestão | Decisão | Justificativa |
|---|---|---|
| `ReferênciaMensalCalculada` | **Rejeitado** | O cálculo do mês seguinte é detalhe interno de `ContratoGerado`/`CicloGerado`; um evento próprio não tem consumidor de negócio. Fica como regra (INV-7), não como fato publicado. |
| `AtivaçõesGeradas` / `OperacionalDoMêsCriado` (marco de fan-out) | **Adiado** | Útil só se a geração for um processo com etapas observáveis. Como INV-5 já exige geração idempotente em ponto único, o marco de conclusão é uma preocupação de **implementação** (saga), não um evento de domínio agora. Reavaliar na arquitetura (ver OA-3 de INVARIANTS). |
| `FaltaDriveRegistrada` / `FaltaNFRegistrada` (eventos para cada estado intermediário) | **Rejeitado** | As transições intermediárias são internas ao agregado; publicá-las como eventos de domínio é observabilidade, não fato de negócio. A máquina de estados (INV-17/18) já as cobre. |

---

## 2. Comandos (imperativos)

Pareados 1:1 com eventos onde possível (DDD: manter simetria comando→evento).

| Comando | Ator | Alvo | Evento resultante |
|---|---|---|---|
| RegistrarInscrição | Candidata (externo) | Inscrição | `InscriçãoRecebida` |
| PromoverInscrição | Admin | Inscrição → Parceira | `InscriçãoPromovida` → `ParceiraCadastrada` |
| RejeitarInscrição | Admin | Inscrição | `InscriçãoRejeitada` |
| EnriquecerEndereço | Sistema (ACL CEP) | Parceira | `EndereçoEnriquecido` |
| GerarCupom | Sistema/Admin | Parceira | `CupomGerado` |
| GerarContrato | Admin | Parceira | `ContratoGerado` |
| AtualizarContrato | Admin | Parceira | `ContratoAtualizado` |
| AtivarParceira / DesativarParceira | Admin | Parceira | `ParceiraAtivada` / `ParceiraDesativada` |
| GerarCicloMensal | Admin | Ciclo | `CicloGerado` |
| AgendarAtivação | Admin | Ativação | `AtivaçãoAgendada` |
| ReagendarAtivação | Admin | Ativação | `AtivaçãoReagendada` |
| AprovarConteúdo | Admin | Ativação | `ConteúdoAprovado` |
| SolicitarAjuste | Admin | Ativação | `AjusteSolicitado` |
| AnexarMaterial | Admin | Ativação | `MaterialAnexado` |
| MarcarPostado | Admin | Ativação | `ConteúdoPostado` |
| PublicarBriefing / AtualizarBriefing | Admin | Briefing | `BriefingPublicado` / `BriefingAtualizado` |
| RegistrarEnvio | Admin | Envio | `EnvioRegistrado` |
| InformarRastreio | Admin | Envio | (atualiza rastreio manual) |
| AtualizarRastreio | Transportadora (ACL) | Envio | `RastreioAtualizado` → `ProdutoEntregue` |
| ConfirmarRecebimento | Admin/Sistema | Envio | `RecebimentoConfirmado` |
| GerarMensagemDeCobrança | Sistema | Pagamento | `MensagemDeCobrançaGerada` |
| SolicitarPagamento | Admin | Pagamento | `PagamentoSolicitado` |
| ConfirmarPagamento | Admin | Pagamento | `PagamentoConfirmado` |
| EncerrarCiclo | Admin/Sistema | Ciclo | `CicloEncerrado` |

---

## 3. Políticas (reações "quando X então Y")

| # | Política | Sev. | Fonte |
|---|---|---|---|
| P-1 | Quando `InscriçãoRecebida`, **não** promover automaticamente — aguardar `PromoverInscrição` (curadoria manual). | ALTA | Modelo §3.1 (promoção deliberada). Política de inibição. |
| P-2 | Quando `ParceiraCadastrada` com CEP, então `EnriquecerEndereço` (ACL) → `EndereçoEnriquecido`. | MÉDIA | Mapa (RUA/BAIRRO/CIDADE/UF via script). |
| P-3 | Quando `ParceiraCadastrada`, então `GerarCupom` (`NOME+10`) → `CupomGerado`. | BAIXA | Mapa BASE col C. |
| P-4 | Quando `ContratoGerado`, então calcular Referência Mensal = mês seguinte (INV-7). | ALTA | Mapa regra #2. |
| P-5 | Quando `GerarCicloMensal`, então incluir **apenas** Parceiras `ATIVA` (INV-6) e criar Ativações (nº = quantidades, INV-9), esqueleto de Briefing, Envios e Pagamentos — de forma **idempotente** (INV-5). | ALTA | Modelo §6; consolidação Fase 2.5. |
| P-6 | Quando `CicloGerado`, então ordenar a agenda (alfabética → cronológica). | MÉDIA | Mapa linhas 118, 244. |
| P-7 | Quando `AtivaçãoAgendada` **ou** `AtivaçãoReagendada`, então preencher/atualizar no Briefing a data do item correspondente, pareado por (Formato, ordinal) (INV-10). | ALTA | Mapa (DATA roteada por FORMATO). |
| P-8 | Quando a data de publicação de um item é definida/alterada, então calcular a data de aprovação (data−7, evita fim de semana) → `DataDeAprovaçãoCalculada` (INV-21/22). | ALTA | Mapa regra #10. |
| P-9 | Quando `RastreioAtualizado` indica entrega, então marcar `ProdutoEntregue`. | MÉDIA | Mapa (STATUS LOGISTICA via API — pendente). |
| P-10 | Quando `RecebimentoConfirmado`, então liberar a produção de conteúdo (gate recebimento→produção). | MÉDIA · A CONFIRMAR | Mapa linha 102 ("pré-requisito para a produção"). Ver OA-7. |
| P-11 | Quando Pagamento pronto para cobrança, então `GerarMensagemDeCobrança` → `MensagemDeCobrançaGerada`. | MÉDIA | Mapa linha 149. |
| P-12 | Quando `ConteúdoPostado`, então arquivar a Ativação **atomicamente** (INV-16) → `ItemArquivado`. | ALTA | Mapa regra #15. |
| P-13 | Quando `PagamentoConfirmado`, então arquivar o Pagamento **atomicamente** (INV-16) → `PagamentoArquivado`. | ALTA | Mapa regra #15. |
| P-14 | Quando `ContratoAtualizado`, então **não** alterar Ciclos já gerados (garantido pelos snapshots, INV-12/27). | MÉDIA | Modelo §3.2. Política de inibição. |
| P-15 | Quando fim do `PeriodoOperacional` (ou comando manual), então `EncerrarCiclo` → `CicloEncerrado`. | ALTA · A CONFIRMAR | Lacuna (Event Storming L1). Ver dúvida: encerramento manual vs. temporal. |

---

## 4. Gatilhos

**Temporais**
- Regra do **mês seguinte** (INV-7): a data de geração do contrato define a Referência Mensal.
- **Aprovação = data − 7, evitando fim de semana** (INV-21): derivado da data de publicação.
- **Fim do período operacional** (INV/`CicloEncerrado`, a confirmar): encerramento do Ciclo.
- **Carimbo automático de data de envio** (mapa, FLUXO LOGÍSTICO col F).

**Manuais (admin)**
- Ligar/desligar STATUS ON/OFF (participação no Ciclo).
- Disparar a geração do mês.
- Preencher datas/status em Ativações; escrever resumo e "sobre" no Briefing.
- Colar código de rastreio (manual — mapa linha 105).
- Marcar `POSTADO` e `PAGO`.
- Promover/rejeitar inscrição.

**Externos (sempre via ponto de contato único / ACL — Diretriz §2)**
- Transportadora (brcomerce): alimenta `StatusLogistica` → `RastreioAtualizado` *(integração desejada, pendente — inconsistência #11)*.
- Serviço de CEP: enriquece o endereço → `EndereçoEnriquecido`.
- Formulário de captação: submissão → `InscriçãoRecebida`.
- Acervo de looks: referência puxada para o Briefing.

---

## 5. Linha temporal consolidada

Notação: **[Comando]** → *EventoNoPassado* → ⟿ política.

```
CAPTAÇÃO / CADASTRO (sem escopo de Ciclo)
  [RegistrarInscrição] (externo)   → InscriçãoRecebida
        ⟿ P-1: não promover automaticamente (aguarda curadoria)
  [PromoverInscrição] (admin)      → InscriçãoPromovida → ParceiraCadastrada
        ⟿ P-2 EnriquecerEndereço (ACL)   → EndereçoEnriquecido
        ⟿ P-3 GerarCupom                 → CupomGerado
  [GerarContrato] (admin)          → ContratoGerado
        ⟿ P-4 Referência Mensal = mês seguinte
  [AtivarParceira] (admin)         → ParceiraAtivada     (STATUS ON)
   (alternativa: [RejeitarInscrição] → InscriçãoRejeitada)

GERAÇÃO DO MÊS (abre o Ciclo) — idempotente (INV-5)
  [GerarCicloMensal] (admin)       → CicloGerado
        ⟿ P-5 só Parceiras ATIVA; cria operacional (nº Ativações = quantidades)
        ⟿ P-6 ordena a agenda (alfabética → cronológica)

TRILHA CONTEÚDO
  [AgendarAtivação] (admin)        → AtivaçãoAgendada
        ⟿ P-7 preenche data no Briefing (Formato+ordinal)
        ⟿ P-8 DataDeAprovaçãoCalculada (data−7, evita fds)
  [ReagendarAtivação] (admin)      → AtivaçãoReagendada
        ⟿ P-7/P-8 recalcula item e aprovação (INV-22)
  [PublicarBriefing] (admin)       → BriefingPublicado
  [AprovarConteúdo] / [SolicitarAjuste] → ConteúdoAprovado / AjusteSolicitado
  [AnexarMaterial] (admin)         → MaterialAnexado
  [MarcarPostado] (admin)          → ConteúdoPostado   (terminal)
        ⟿ P-12 arquiva atômico       → ItemArquivado

TRILHA LOGÍSTICA (paralela, desde CicloGerado)
  [RegistrarEnvio]                 → EnvioRegistrado
  [InformarRastreio] (admin)       → (rastreio manual)
  [AtualizarRastreio] (externo)    → RastreioAtualizado
        ⟿ P-9                        → ProdutoEntregue
  [ConfirmarRecebimento]           → RecebimentoConfirmado
        ⟿ P-10 libera produção  (a confirmar)

TRILHA PAGAMENTO (paralela, desde CicloGerado)
  (Pagamento criado na geração; fee/PIX = snapshot, INV-13)
        ⟿ P-11 GerarMensagemDeCobrança → MensagemDeCobrançaGerada
  [SolicitarPagamento] (admin)     → PagamentoSolicitado
      (bloqueios: AGUARDANDO / FALTA_NF / FALTA_DRIVE — podem coexistir, INV-18)
  [ConfirmarPagamento] (admin)     → PagamentoConfirmado (terminal)
        ⟿ P-13 arquiva atômico       → PagamentoArquivado

FECHAMENTO
  (fim do PeriodoOperacional ou comando)
  [EncerrarCiclo]                  → CicloEncerrado      (a confirmar)
```

---

## 6. Read models esperados (consequências)

Consolidados dos revisores; são **visões de leitura**, não agregados.

| Read model | Conteúdo | Sev. |
|---|---|---|
| Agenda do mês ordenada | Ativações do Ciclo por parceira (alfabética+cronológica): formato, data, status. | ALTA |
| Briefing consolidado | Por (Parceira, Ciclo): resumo + por peça (look, data publicação, aprovação, "sobre"). | ALTA |
| Painel de aprovações | Datas de aprovação (data−7) por peça, sinalizando prazos. | MÉDIA |
| Quadro logístico | Endereço, rastreio, status revisão/logística, data de envio. | MÉDIA |
| Painel financeiro | Pagamentos por status; mensagem de cobrança pronta. | MÉDIA |
| Histórico / acervo | Itens `POSTADO`/`PAGO` arquivados, com Ciclo e momento (INV-16). | ALTA |
| Fila de triagem | Inscrições pendentes de promoção/rejeição; marca lixo/incompletas. | MÉDIA |
| Visão da Parceira (mestre) | Contrato vigente, endereço, cupom, status, quantidades. | ALTA |

---

## Observações Arquiteturais

**OA-E1 — Assimetria comando/evento herdada.** O modelo tinha estados sem comando/evento correspondentes (`FALTA_DRIVE`, `FALTA_NF`). Decisão: os estados permanecem na máquina (INV-17/18), mas **não** ganham eventos de domínio próprios (seção 1.3) — são transições internas, não fatos publicados.

**OA-E2 — `RecebimentoConfirmado`, `CicloEncerrado` e o gate P-10 são `A CONFIRMAR`.** Dependem de confirmação da operação sobre (a) como o recebimento é confirmado e se bloqueia a produção; (b) se o encerramento do Ciclo é manual ou temporal. Não os fixo como firmes sem essa validação (Diretriz §5).

**OA-E3 — Integração de rastreio ainda inexistente.** `RastreioAtualizado`/`ProdutoEntregue` pressupõem a API da transportadora (brcomerce), hoje apenas desejada (inconsistência #11). Até a ACL existir, esses eventos não têm gatilho externo real; podem ser alimentados manualmente nesse intervalo.

---

*Fim do Catálogo de Eventos — TEAR V2 (Fase 2.5). Documento de consolidação; não altera os documentos de referência.*
