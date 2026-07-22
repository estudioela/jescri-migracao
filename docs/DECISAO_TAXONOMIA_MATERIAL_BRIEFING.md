# TEAR V2.5 — Decisão de Negócio: Taxonomia Material × Briefing

Data: 2026-07-20
Papel do autor: Tech Lead de execução (agente), a pedido do responsável
do projeto.
Status: **análise de decisão. Nenhum código foi escrito, nenhuma
migration criada, nenhuma arquitetura alterada para produzir este
documento.** Gate da Onda 2 (`docs/PLANO_EXECUCAO_MVP.md`) — bloqueia
HU-4.1 e, por decorrência, HU-1.4.

**Escopo:** exclusivamente `tear-v2-app/`. Fontes: `docs/BACKLOG_EXECUTIVO_MVP.md`
EPIC 4, `docs/AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §8/§10, código atual
de `Material`/`Briefing` (models, migrations, requests, controllers,
`MateriaisPage.tsx`), lido nesta sessão sem alteração.

---

## 0. O problema, em uma frase

`Briefing.tipo` (`FEED/REELS/STORIES/TIKTOK/UGC`, 5 valores, 1 por
participação) e `Material.tipo` (`REELS/STORIES/FOTOS/OUTROS`, 4
valores) usam vocabulários diferentes e não têm nenhum vínculo
estrutural entre si (`Material` não tem `briefing_id`) — hoje não é
possível saber, no banco, "este material responde a este briefing
específico".

## 1. Modelo recomendado

**Opção B, na forma concreta abaixo — Material passa a ter `briefing_id`
obrigatório; `tipo` deixa de ser escolhido pelo usuário e passa a ser
sempre derivado do Briefing vinculado.**

Não é "Material simplesmente deixa de ter tipo" nem "Material ganha uma
segunda cópia solta do enum de Briefing" — é a hierarquia
`Briefing → Material` (1:N, um Briefing pode ter vários Materiais
enviados/reenviados) com `tipo` copiado do Briefing no momento da
criação, mesmo padrão de campo derivado já usado em `data_aprovacao_interna`
(HU-2.1, já implementada e testada nesta sessão) — não é um padrão
novo no código, é reaproveitar um precedente que já funciona.

## 2. Justificativa

### 2.1 Achado técnico decisivo: a divergência não é intencional, é deriva histórica

Confirmado pela ordem das migrations: `create_materiais_table`
(`2026_07_20_110000`) foi escrita **antes** de
`reorganize_briefings_para_1n_por_tipo` (`2026_07_20_130000`). O enum de
`Material` foi fixado quando `Briefing` ainda era um registro genérico
1:1; quando `Briefing` evoluiu para 1:N por tipo (Feed/Reels/Stories/
TikTok/UGC), `Material` não foi atualizado junto. Não existe nenhum
comentário no código, nenhum teste e nenhum documento-fonte que explique
`FOTOS`/`OUTROS` como decisão deliberada — `grep` em toda a suíte de
testes mostra que **nenhum teste hoje exercita `FOTOS` ou `OUTROS`**, só
`REELS`. Isso pesa a favor de tratar o enum atual de `Material` como
dívida técnica, não como requisito de produto a preservar.

### 2.2 Precedente operacional: é assim que a Jescri já opera (V1, validado em produção)

No sistema legado (V1, `AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md`, RN-04/
RN-07), o briefing é organizado em blocos por formato (Reel, Carrossel,
Stories 1, Stories 2), e o ciclo de vida do conteúdo enviado
(`aguardando → ajustes → aprovado → publicado`) **sempre existiu dentro
de um bloco específico** — nunca como um registro solto com uma
taxonomia própria e independente do briefing. A V1 nunca teve o
equivalente de um "tipo de material" desacoplado. Adotar a Opção B não
é inventar um processo novo — é alinhar o modelo de dados ao processo
que a operação real da Jescri já usa e já validou.

### 2.3 Por que não a Opção A

A Opção A (Material com taxonomia própria: Foto, Vídeo, Stories, Reels
etc.) resolve um problema que **ninguém tem hoje** — nenhuma fonte
(legado, especificação funcional, auditoria de UX) pede a capacidade de
"um material que não responde a nenhum briefing específico" ou "um
briefing que recebe materiais de tipos variados". Ela cria dois
vocabulários para manter sincronizados manualmente (o mesmo problema que
já causou o bug atual), sem resolver a pergunta que motivou a
investigação: como saber que 2 de 2 Reels já foram enviados. Isso teria
que ser resolvido de qualquer forma com um vínculo estrutural — ou seja,
a Opção A, para funcionar de verdade, teria que reimplementar por baixo
o mesmo vínculo Material↔Briefing que a Opção B já propõe diretamente,
só que com mais uma tabela de tipos para manter.

## 3. Impacto na UX

- **Influenciadora (Portal, HU-1.4 — ainda não implementada, é a
  história que este gate destrava):** o botão "enviar material" nasce
  dentro do bloco de Briefing (Feed/Reels/Stories/TikTok/UGC) — o tipo
  já é implícito pelo contexto onde o botão foi clicado, **sem campo de
  seleção de tipo no formulário**. Isso não é uma preferência de design
  — é exatamente o que `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §8 já
  havia especificado como fluxo ideal, hoje impossível de implementar
  fielmente sem esta decisão.
- **Administrador (`MateriaisPage.tsx`, já existente):** hoje o admin
  escolhe `tipo` de uma lista solta de 4 opções, sem nenhuma relação com
  o que foi briefado — nada impede registrar um material `FOTOS` numa
  participação sem nenhum briefing de foto. Com a Opção B, o admin
  escolhe **qual Briefing** o material responde (naturalmente restrito
  aos briefings já publicados daquela participação) — mais preciso, não
  mais uma etapa.
- **Progresso "X de Y enviados"** (já sinalizado como a peça de maior
  valor de UX da seção de Briefing, `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md`
  §7): passa a ser uma contagem trivial (`briefing.materiais()->count()`)
  em vez de uma correlação indireta e ambígua por tipo.

## 4. Impacto no backend

Mudança aditiva, de escopo pequeno — reaproveita padrões já existentes
no código, não introduz nenhum conceito novo:

- **Migration:** `materiais` ganha `briefing_id` (FK para `briefings`,
  `restrictOnDelete`). Enum de `tipo` passa a aceitar os mesmos 5
  valores de `Briefing.tipo` (`FEED/REELS/STORIES/TIKTOK/UGC`) —
  `FOTOS`/`OUTROS` saem do domínio válido para novos registros.
- **Model `Material`:** hook `saving` (mesmo padrão do `booted()` de
  `Briefing::calcularDataAprovacaoInterna`) copia `tipo` do
  `briefing_id` informado — `tipo` sai do `$fillable`, vira sempre
  derivado, nunca digitado.
- **`StoreMaterialRequest`:** troca a regra de `tipo` (`Rule::in([...])`)
  por `briefing_id` (`exists`, e validação de que o briefing pertence à
  mesma `participacao_id` da rota — mesmo padrão já usado em
  `StoreBriefingRequest::withValidator`).
- **`MaterialController`/`MateriaisPage.tsx`:** trocam o seletor de
  `tipo` por seletor de `briefing_id` (lista os briefings já publicados
  da participação).
- **Dado existente:** a suíte de testes hoje só cria materiais com
  `tipo: REELS` — não há evidência de dado real em `FOTOS`/`OUTROS` a
  migrar. Ambiente de desenvolvimento/staging, sem produção ativa neste
  módulo ainda (Portal de Materiais, HU-1.4, nunca foi ao ar) — risco de
  migração de dado é baixo, mas cabe confirmar no início da execução, não
  presumir vazio sem checar.
- Nenhuma mudança em `Briefing`, `ParticipacaoNaCampanha`, `Pagamento`
  ou qualquer outro módulo já entregue nas Ondas 1.

## 5. Impacto futuro

- **Positivo:** um vocabulário só para "tipo de conteúdo" em todo o
  sistema — Briefing, Material e (quando existir) qualquer relatório ou
  automação futura leem a mesma fonte de verdade, sem mapeamento.
  Reduz o risco de esta mesma divergência reaparecer em outro módulo.
- **Se a operação um dia precisar de upload "solto", sem vínculo a um
  briefing específico** (ex.: foto para logística/ficha de retirada,
  documento pessoal) — isso **não é o mesmo conceito de Material**
  (conteúdo de campanha para aprovação). O caminho correto, quando essa
  necessidade for real e confirmada, é um novo conceito de domínio
  (ex. `Anexo`/`Documento`, já cogitado no backlog para Contratos/
  Logística — EPIC 7/9), não reabrir `Material.tipo` como campo solto.
  Registrar aqui para não ser esquecido, não para decidir agora.

## 6. Terceira alternativa considerada (mais barata, não recomendada como definitiva)

**Alternativa C — só unificar o vocabulário do enum, sem `briefing_id`.**
Trocar `Material.tipo` para os mesmos 5 valores de `Briefing.tipo`, sem
adicionar a FK — o vínculo ficaria implícito (`participacao_id` +
`tipo` iguais), resolvido em runtime via
`Briefing::where('participacao_id', ...)->where('tipo', ...)->first()`,
funcionando hoje porque `Briefing` já tem `unique(participacao_id, tipo)`
— no máximo um briefing por tipo por participação, então o match é
determinístico.

- **Custo:** menor agora (uma migration de enum, sem coluna nova, sem
  necessidade de decidir o que fazer com materiais existentes sem
  vínculo).
- **Por que não é a recomendação:** é uma dependência implícita, não
  uma constraint de banco — se um dia a regra "no máximo 1 briefing por
  tipo por participação" mudar (nenhuma fonte pede isso hoje, mas é
  exatamente o tipo de suposição frágil que já causou o problema atual),
  o vínculo quebra silenciosamente, sem erro em tempo de escrita.
  Contraria o critério "escalabilidade futura" pedido nesta análise.
  Fica registrada como opção de menor esforço, caso o prazo da Onda 2
  precise ser comprimido — mas a recomendação continua sendo a FK
  explícita (§1).

---

## Resumo

| Critério pedido | Como a Opção B (recomendada) atende |
|---|---|
| Simplicidade do MVP | Reaproveita padrão já existente (campo derivado); menos estado a manter que a Opção A |
| Operação real da Jescri | Alinha ao modelo do legado V1, já validado em produção |
| Experiência da influenciadora | Destrava o fluxo já especificado em `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §8, sem campo de tipo redundante |
| Experiência do administrador | Upload passa a ser contextual ao briefing, mais preciso que hoje |
| Escalabilidade futura | Vínculo por FK, não por coincidência de colunas; base pronta para progresso "X de Y" e futuros relatórios |
| Menor retrabalho | Migration aditiva pequena; não toca nenhum módulo já entregue nas Ondas 1 |

---

Nenhum código foi escrito, nenhuma migration criada, nenhuma arquitetura
alterada para produzir este documento. Aguardando aprovação do
responsável do projeto antes de iniciar a Onda 2 (HU-4.1 seguida de
HU-1.4).
