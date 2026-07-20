# TEAR V2.5 — Especificação Funcional

Data: 2026-07-20
Papel do autor: Product Architect / Business Analyst / Tech Lead (agente),
a pedido do responsável do projeto.
Status: **especificação de produto. Nenhum código foi escrito, nenhuma
tela foi criada, nenhuma arquitetura foi alterada para produzir este
documento.**

**Escopo:** exclusivamente `tear-v2-app/` (Laravel 13 + React/Vite).

---

## 0. Fontes analisadas

Nesta ordem:

1. `docs/HANDOFF_PRODUCTIZACAO_TEAR_V2.md` — estado atual do MVP e da
   transição.
2. `docs/ROADMAP_MESTRE_TEAR_V2.md` — roadmap de execução (Parte 1:
   sprint concluída; Parte 2: fases 0-6, sem lente SaaS).
3. `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` (raiz do repo) — plano de
   produtização com lente SaaS (Fases 1-4, decisões arquiteturais,
   priorização P0/P1/P2).
4. `docs/PRD.md` — processo de negócio da V1 legada (planilha Google
   Sheets + Apps Script), com todo fato de negócio citando sua fonte
   original (`Código.js`, `WebApp.js`, `SidebarBackend.js`). É a
   referência de comportamento validado que não pode regredir.
5. `docs/history/PLANILHA_TEAR_2.0_MAPA.md` — estrutura física exata da
   planilha oficial (11 abas, colunas linha a linha).
6. Leitura direta do código de `tear-v2-app/backend` nesta sessão:
   migrations de `parceiras`, `marcas`, `campanhas`,
   `participacoes_na_campanha`, `briefings`, `materiais`, `pagamentos`,
   e `StoreParceiraRequest` — para saber exatamente quais campos e
   validações já existem hoje, sem supor nada.

**Fora do escopo desta análise, por decisão de arquitetura já registrada
(não deste documento):** `src/` (a reescrita do Portal legado em Google
Apps Script), `CONTRATO_SOBERANO.md`, `docs/_workspace/TASK_ROUTER.md`,
`docs/domain/`, `docs/architecture/`, `docs/history/MIGRATION.md`,
`docs/specs/`, `docs/adrs/`. Esses documentos governam o domínio
soberano de um sistema **separado** (confirmado nesta sessão: `src/` é
um projeto Apps Script próprio, com seu próprio `.clasp.json` e
`appsscript.json`, independente de `tear-v2-app/`). Foram checados o
suficiente para confirmar que não se aplicam aqui — não foram usados
como fonte de regra de negócio para este documento, e nenhuma decisão
abaixo os reabre.

---

## 1. Mapeamento do processo atual

| Etapa | V1 legado (referência de comportamento) | `tear-v2-app` hoje | Gap / decisão desta especificação |
|---|---|---|---|
| Cadastro influenciadora | Formulário externo → aba `CADASTROS` → cópia para `BASE DE DADOS` com `STATUS=OFF`; CEP resolvido via BrasilAPI (RN-01/RN-02) | Existe cadastro público (`CadastroPublicoParceiraTest` já no repo) gravando `parceiras` com `status=Inativa` por padrão; campos: nome, email, telefone, instagram, chave_pix, cnpj (solto, sem validação de dígitos), cep/rua/bairro/cidade/uf/numero/complemento (sem preenchimento automático) | Falta: busca automática de endereço por CEP; validação formal de CNPJ/CPF; tamanhos/medidas; consentimento LGPD; histórico de alteração. Ver §3-§5. |
| Aprovação | Ativação (`STATUS=ON`) é decisão manual da equipe, sem função automática (RN-01) | `aprovado_por`/`aprovado_em` já existem na tabela `parceiras`; fluxo de aprovação testado (`ParceiraAprovacaoTest`) | Nenhum gap identificado — comportamento já preserva a regra V1. |
| Campanha | "Ciclo mensal" (mês+ano) gera pendências para toda influenciadora `ON` (RN-03, RN-06) | `Campanha` vinculada a `Marca`, com status `PLANEJADA/ATIVA/ENCERRADA/CANCELADA`; participação (`participacoes_na_campanha`) com `reels_qtd/carrossel_qtd/stories_qtd` e status `ATIVA/CANCELADA` | Modelo já compatível; falta a regra de **visibilidade** para a influenciadora autenticada (§6). |
| Escolha de produto | **Não existe na V1** — só "LOOKS_QTD" (quantidade contratada), sem produto/variante modelados | Não existe | Território totalmente novo — §9, §10. |
| Briefing | Um bloco por formato (Reel/Carrossel/Stories 1/Stories 2), com look, data de entrega, data de postagem, orientação (RN-04) | Uma única linha de `Briefing` por participação (`orientacoes` + `prazo` + `entregaveis_esperados` genéricos) — **menos granular que a V1** | Regressão em relação à V1 a corrigir — §8. |
| Produção de conteúdo | Influenciadora envia material, status `aguardando → ajustes → aprovado → publicado` (RN-07) | `Material` com upload e ação de aprovar/reprovar já funcional | Sem gap de regra; falta só a superfície de acesso da influenciadora (Fase 1 do roadmap, já mapeada, fora deste documento). |
| Envio (logística) | Confirmação de endereço, rastreio, arquivamento ao entregar (RN-13/RN-14) | Placeholder, sem fluxo real | Território de reformulação — §11 (desenho físico já existe em `docs/ROADMAP_MESTRE_TEAR_V2.md` Fase 3, não redesenhado aqui). |
| Aprovação (conteúdo) | Mesmo ciclo de estado da produção (RN-07) | Idem produção — mesma ação `aprovar`/`reprovar` de `Material` | Sem gap. |
| Pagamento | `em aberto → pago`, arquivamento automático (RN-09/RN-11) | Máquina de estados `PENDENTE → APROVADO → PAGO` testada ponta a ponta | Sem gap de regra central; falta consolidar exibição de "previsto x pago" no futuro portal (já mapeado, fora deste documento). |
| Contrato/arquivo | Documento gerado por template (AutoCrat) por influenciadora `ON` (RN-15) | Não existe | Território de reformulação — §13, §15. |

**Leitura do mapeamento:** o núcleo operacional (Cadastro → Aprovação →
Campanha → Produção → Pagamento) já está sólido e não regride a V1. As
lacunas reais estão em três frentes: (1) cadastro mais rico (endereço
automático, validação, tamanhos, consentimento); (2) território
inteiramente novo que a V1 nunca teve (produto/variante/permuta,
assessoria); (3) módulos que a V1 tinha e o MVP ainda não reconstruiu
(Briefing granular, Logística, Contrato).

---

## 2. Regras de negócio extraídas

### Obrigatórias (preservar — já validadas em produção pela V1)

| Regra | Descrição | Status em `tear-v2-app` |
|---|---|---|
| RN-01 | Influenciadora nasce inativa; ativação é decisão manual | ✅ preservada |
| RN-02 | Endereço resolvido automaticamente a partir do CEP | ❌ pendente (§3) |
| RN-03 | Só influenciadora ativa entra em novo ciclo/campanha | ✅ preservada (participação exige `parceira` existente; falta réplica no nível de "quem a influenciadora vê" — §6) |
| RN-04 | Um bloco de briefing por formato contratado, com prazo e orientação | ⚠️ parcialmente — hoje é um bloco genérico, não por formato (§8) |
| RN-06 | Uma pendência de conteúdo por unidade contratada de cada formato | ✅ preservada em `participacoes_na_campanha` (`reels_qtd` etc.) |
| RN-07 | Ciclo de vida de conteúdo com estados definidos | ✅ preservada (`Material` aprovar/reprovar) |
| RN-09/RN-11 | Pagamento nasce em aberto, arquivado ao ser pago | ✅ preservada |
| RN-13/RN-14 | Registro logístico nasce por influenciadora ativa; arquivado ao entregar | ❌ pendente — módulo placeholder (§11) |
| RN-15 | Contrato gerado por influenciadora ativa, a partir de template | ❌ pendente (§13, §15) |
| Falha de integração externa não deve impedir salvar dados principais (RNF, seção 10 do PRD) | CEP/rastreio degradam sem travar o salvamento | Aplicar ao desenhar §3 e §11 |

### Melhorias futuras (não existiam na V1 — decisão de produto nova, não regra herdada)

- Tamanhos/medidas de vestuário (§3).
- Consentimento LGPD com histórico de alteração campo a campo (§5).
- Regra de visibilidade de campanha por participação ativa da própria
  influenciadora, aplicada como RBAC de leitura no backend (§6).
- Briefing organizado por tipo de conteúdo, incluindo formatos que a V1
  não tinha (TikTok, UGC) (§8).
- Produto/variante com extração assistida por URL (§9, §10).
- Permuta com janela mensal (§12).
- Contrato com template editável pelo administrador, sem deploy (§13,
  §15).
- Assessoria como conceito de cadastro (§14).
- Métricas de perfil da influenciadora (§16).

---

## 3. Cadastro da influenciadora

### Dados pessoais (já existem, preservar)
`nome`, `email`, `telefone`, `instagram`, `cnpj`, `chave_pix` — já
obrigatórios em `StoreParceiraRequest`. Nenhuma mudança de campo aqui,
só de validação (§4).

### Endereço e CEP
Hoje: `cep`/`rua`/`bairro`/`cidade`/`uf`/`numero`/`complemento`/
`endereco_completo` existem como colunas soltas, preenchidas
manualmente — sem nenhuma integração de busca automática (confirmado:
não há nenhuma chamada a serviço de CEP no backend hoje).

**Especificação:**
- Ao informar CEP válido (8 dígitos), o backend consulta um serviço de
  CEP (ex.: ViaCEP ou BrasilAPI — mesma integração já validada na V1,
  RN-02) e preenche `rua`/`bairro`/`cidade`/`uf` automaticamente.
- Campos preenchidos automaticamente continuam **editáveis** pelo
  usuário (correção manual sempre permitida — nunca travar o campo).
- Falha do serviço de CEP **não bloqueia** o cadastro — os campos ficam
  em branco para preenchimento manual (mesma regra não-funcional já
  extraída da V1, seção 10 do PRD).
- `numero` e `complemento` continuam de digitação manual (não vêm do
  serviço de CEP).

### Tamanhos e medidas
**Não existe em nenhuma versão do sistema até hoje** — é território
novo. Proposta de armazenamento: tabela própria (`medidas_influenciadora`
ou equivalente, alinhada ao desenho já previsto de `measurements` em
`docs/ROADMAP_MESTRE_TEAR_V2.md` Fase 1), **versionada** — cada alteração
gera um novo registro em vez de sobrescrever, permitindo saber a medida
vigente em cada momento (útil quando um envio logístico antigo precisar
ser conferido).

Campos e domínio fechado (enum), conforme especificado pelo responsável
do projeto:

| Peça | Valores aceitos |
|---|---|
| Sutiã — tamanho | `P`, `M`, `G`, `GG` |
| Sutiã — numeração | `42`, `44`, `46`, `48` |
| Sutiã — taça | `A`, `B`, `C`, `D` (combinada com a numeração, ex. `42A`, `44B`) |
| Calcinha | `P`, `M`, `G`, `GG` |
| Linha noite (pijama/sleepwear) | `P`, `M`, `G`, `GG` |

Nenhum destes campos é obrigatório no cadastro inicial (só se torna
relevante quando a influenciadora participa de uma campanha com envio de
produto/permuta) — não bloquear o cadastro público por causa de medida
ainda não definida.

---

## 4. Validação de dados

Padrão único aplicado a todo campo sensível do cadastro:

| Campo | Regra | Máscara de exibição | Armazenamento | Mensagem de erro (exemplo) |
|---|---|---|---|---|
| CNPJ | 14 dígitos, dígito verificador válido | `XX.XXX.XXX/XXXX-XX` | somente dígitos (14 chars) | "CNPJ inválido — confira os dígitos digitados." |
| CPF | 11 dígitos, dígito verificador válido | `XXX.XXX.XXX-XX` | somente dígitos (11 chars) | "CPF inválido — confira os dígitos digitados." |
| CEP | 8 dígitos | `XXXXX-XXX` | somente dígitos (8 chars) | "CEP inválido — use o formato 00000-000." |
| Telefone | 10 ou 11 dígitos (com DDD) | `(XX) XXXXX-XXXX` / `(XX) XXXX-XXXX` | somente dígitos | "Telefone inválido — inclua o DDD." |
| Datas | Data real, dentro de faixa plausível (ex. prazo de briefing não pode ser retroativo) | `DD/MM/AAAA` na tela | ISO `AAAA-MM-DD` no banco | "Data inválida." |
| Campos obrigatórios | Depende do momento do fluxo (ver abaixo) | — | — | "Campo obrigatório." |

**CPF vs. CNPJ:** a V1 e o MVP atual só têm campo de CNPJ (influenciadora
opera como pessoa jurídica). Esta especificação propõe manter CNPJ como
principal, mas aceitar CPF como alternativa para influenciadoras que
ainda não abriram CNPJ — **decisão do responsável do projeto**: se isso
é uma necessidade real da operação hoje ou pode ficar para uma fase
futura (ver §17, decisões pendentes).

**Obrigatoriedade variável por momento:** o mesmo campo pode ser
obrigatório em um momento e opcional em outro — ex.: `chave_pix` é
obrigatória no cadastro público de hoje, mas medidas/tamanhos só se
tornam obrigatórias quando a influenciadora participa de uma campanha
com envio de produto. A regra de obrigatoriedade deve viver no
Form Request correspondente a cada ação, não em uma validação global
única.

---

## 5. Consentimento e histórico de alterações

**Não existe hoje em nenhuma camada** (nem V1, nem `tear-v2-app`) — já
sinalizado como dívida em ambos os roadmaps-fonte.

**Fluxo especificado:**

```
Influenciadora (ou ADMIN) edita um campo do cadastro
    ↓
Tela de confirmação mostra o diff: campo, valor anterior, valor novo
    ↓
Aceite explícito ("declaro que as informações estão corretas")
    ↓
Sistema grava a alteração E o registro de histórico na mesma transação
```

Cada alteração grava, por campo alterado (não por formulário inteiro):

- usuário que fez a alteração (`user_id`);
- data/hora;
- IP de origem, quando a alteração parte do Portal da Influenciadora
  (não é necessário capturar IP de alterações feitas pelo painel admin
  interno — só onde há valor de auditoria de titular de dado);
- campo alterado;
- valor anterior;
- valor novo.

**Nota de prioridade:** este documento recomenda tratar consentimento
como **P0**, não P1 — porque, assim que a Fase 1 (Portal da
Influenciadora, já mapeada em `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md`) for
ao ar, a influenciadora passa a editar e visualizar dados pessoais
próprios sem intervenção da equipe. Expor essa edição sem consentimento
capturado é a mesma classe de risco jurídico que expor RBAC de leitura
sem isolamento — ambos os documentos-fonte já cogitavam essa promoção
de prioridade sem fechá-la; este documento fecha a recomendação.

---

## 6. Campanhas e permissões da influenciadora

Regra de negócio: **a influenciadora só pode visualizar campanhas onde
sua participação está com status `ATIVA`.**

O schema já suporta isso sem migração nova: `participacoes_na_campanha`
já tem a coluna `status` (`ATIVA`/`CANCELADA`) e `parceira_id`. O que
falta é a camada de autorização, não o dado.

- **Regra de backend (obrigatória, não delegável ao frontend):** toda
  rota consumida pelo papel `INFLUENCIADORA` deve derivar `parceira_id`
  exclusivamente da sessão autenticada (nunca de parâmetro vindo do
  cliente) e filtrar por `participacoes_na_campanha.status = 'ATIVA'
  AND parceira_id = <parceira da sessão>`. Rotas "auto-escopadas" (ex.
  `GET /me/participacoes`) em vez de `GET /participacoes/{id}` genérico.
- **Regra de frontend:** a tela do Portal simplesmente renderiza o que a
  API já filtrada devolve — nenhuma lógica de esconder/mostrar campanha
  no cliente. Esconder no frontend sem filtrar no backend é o mesmo
  padrão de falha já identificado no RBAC de leitura atual (qualquer
  usuário autenticado lê qualquer dado hoje).
- **Filtro:** único critério de visibilidade é a própria participação
  ativa — não há regra adicional de data/campanha ativa/inativa
  combinada nesta especificação (a `Campanha` pode estar `ATIVA` e a
  participação da influenciadora nela `CANCELADA`, e vice-versa; o que
  importa para visibilidade é o status da **participação**, não da
  campanha em si).

---

## 7. Histórico legado

**Situação:** nenhum dos dois roadmaps-fonte trata a migração do
Google Sheets como parte da produtização — `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md`
§3.5 é explícito: "não é uma questão de produtização — é uma tarefa
pontual de dado histórico, independente da direção SaaS", recomendada
em paralelo à Fase 2 ou 3, sem bloquear nada.

**O que existe para mapear (fonte: `docs/history/PLANILHA_TEAR_2.0_MAPA.md`):**
ativações (aba `ATIVAÇÕES`, ~1961 linhas), campanhas/ciclos mensais
(coluna `MES_REFERENCIA` presente em quase todas as abas), pagamentos
(aba `PAGAMENTOS` + 3 históricos), conteúdos (`HISTÓRICO DE CONTEÚDOS`).
**Não existe conceito de produto na planilha legada** — não há o que
migrar nesse ponto.

**Estratégia proposta: histórico somente leitura, não migração
comportamental.** Não recriar o comportamento da V1 (recalcular
estados, reabrir fluxos) — apenas importar os registros já concluídos
(abas de `HISTÓRICO DE...` e linhas arquivadas de `ATIVAÇÕES`/
`PAGAMENTOS`/`FLUXO LOGÍSTICO`) como registros com `origem: legado`,
consultáveis mas não editáveis.

**Riscos identificados:**
- `INFLU_KEY` é a chave de junção na planilha, mas o `tear-v2-app` usa
  `nome` como chave única de `Parceira` — pode haver divergência de
  grafia entre as duas fontes que exige revisão manual antes de
  importar (não presumir correspondência automática 1:1).
- `INFLU_SHEET_URL` e `PASTA_DRIVE_LINK` (colunas de `BASE DE DADOS`)
  seriam preservados como referência externa, não como
  funcionalidade replicada.

**Decisão pendente do responsável do projeto:** escopo exato da
migração (quais abas entram, quais campos são obrigatórios, o que pode
ser descartado) — já registrado como pendência aberta em
`docs/ROADMAP_MESTRE_TEAR_V2.md` §5, reafirmado aqui.

---

## 8. Briefings

**Regressão identificada:** a V1 organizava o briefing em até 4 blocos
por formato (Reel, Carrossel, Stories 1, Stories 2 — RN-04), cada um com
look, data de entrega, data de postagem e orientação própria. O MVP
atual tem **um único registro genérico** de `Briefing` por participação
(`orientacoes` + `prazo` + `entregaveis_esperados`) — menos granular
que a V1.

**Especificação:** reorganizar `Briefing` de 1:1 com a participação para
**1:N**, uma linha por tipo de conteúdo — generalizando os formatos da
V1 e incluindo os que ela não tinha:

- Feed
- Reels
- Stories
- TikTok
- UGC

Cada item de briefing carrega, individualmente:

- instruções (texto livre);
- prazo (data);
- referências (links e/ou imagens de inspiração);
- produto vinculado (quando aplicável — depende de §9/§10 existir);
- observações.

A quantidade de itens por tipo nasce a partir das quantidades já
contratadas em `participacoes_na_campanha` (`reels_qtd`, `carrossel_qtd`,
`stories_qtd`) — mesma lógica de RN-06 já preservada — estendida para
cobrir TikTok e UGC, que hoje não têm coluna de quantidade contratada
(gap a fechar junto com esta mudança, não depois).

---

## 9. Escolha de produto inteligente

**Fluxo:** influenciadora cola a URL de um produto (ex.
`https://www.jescri.com.br/categorias/pijama-listrado?variant_id=11093`).

O sistema tenta extrair:
- foto principal;
- nome do produto (ver regra de nome abaixo);
- cor;
- variante;
- referência/SKU.

**Regra de nome:**

| Tipo | Exemplo | Uso |
|---|---|---|
| Nome SEO (bruto, extraído da página) | "Pijama Feminino Americano Longo Berenice em 100% Algodão" | Guardado apenas como referência/auditoria — **nunca** usado como nome operacional |
| Nome operacional (interno) | "Pijama Berenice" | Nome curto: categoria + nome próprio do modelo, quando identificável |
| Fallback | "Pijama Americano" | Quando não há nome próprio de modelo identificável — categoria + corte/característica genérica |

O nome operacional é **sempre editável manualmente** — a extração é uma
sugestão, nunca a fonte de verdade final. Consistente com o princípio já
adotado no roadmap de produtização para a Fase 3 (Inteligência
Operacional): nenhuma automação desta natureza aplica efeito sem
revisão humana nesta fase — a extração populariza um formulário de
conferência, não grava direto.

**Dependência:** esta funcionalidade pressupõe que produto/variante já
exista como conceito de domínio (§10) — não tem sentido isolada.

---

## 10. Validação da variante do produto

**Problema:** a influenciadora pode colar o link do produto pai (a
página de categoria/produto sem variante selecionada), sem cor/tamanho
definidos.

**Regra:** o sistema não aceita salvar uma escolha de produto sem uma
variante específica confirmada:

- cor escolhida (obrigatória);
- variante/tamanho escolhido (obrigatória, quando o produto tiver mais
  de uma);
- disponibilidade da variante escolhida checada no momento da
  confirmação (não no momento da extração da URL, que pode ficar
  desatualizada).

Se a URL colada aponta para um produto sem variante resolvida, o
sistema bloqueia o salvamento e força a influenciadora (ou a equipe) a
selecionar explicitamente cor/tamanho antes de prosseguir — nunca grava
"produto genérico" como escolha final.

---

## 11. Logística de estoque

**Ficha de retirada automática**, gerada no momento em que o look da
campanha é definido (via briefing/produto confirmado), substituindo o
processo manual atual (mensagem de WhatsApp + anotação manual — RN
implícita da V1, seção 5.5 do PRD).

Conteúdo da ficha:
- foto do produto;
- referência/SKU;
- produto e variante (cor/tamanho, ver §10);
- nome completo da influenciadora;
- endereço de entrega (do cadastro, §3).

**Nota:** o desenho de tabelas físicas para este módulo
(`products`, `product_variants`, `stock`, `shipments`, `shipment_items`)
já está detalhado em `docs/ROADMAP_MESTRE_TEAR_V2.md` Parte 2, Fase 3 —
este documento não redesenha esse schema, apenas especifica o
comportamento e o conteúdo da ficha gerada automaticamente.

---

## 12. Permutas

Especificação de comportamento (schema físico: mesma nota do §11):

- **Prazo mensal:** janela de dias corridos, a partir da abertura da
  campanha/ciclo, durante a qual a influenciadora pode escolher o
  produto de permuta. Duração exata **é decisão do responsável do
  projeto** (ver §17).
- **Escolha do produto:** feita pela influenciadora autenticada (Fase 1
  do Portal é pré-requisito real aqui — sem login não há quem escolha).
- **Validação de variante:** mesma regra do §10 — não aceitar escolha
  sem variante confirmada e disponível.
- **Confirmação:** a escolha entra em estado "solicitada" até aprovação
  (ou confirmação automática, a decidir) da equipe; só após confirmada
  vira ficha logística (§11).
- **O que acontece ao expirar o prazo sem escolha:** **decisão
  pendente** — fallback automático (ex. produto padrão) ou fallback
  manual (equipe decide caso a caso). Não assumir nenhum dos dois sem
  confirmação.

---

## 13. Contratos

**Situação atual:** não existe em `tear-v2-app`. Na V1, um job AutoCrat
gera um Google Doc individual por influenciadora `ON`, preenchido a
partir de um template com placeholders vinculados a `BASE DE DADOS`
(RN-15, seção 5.7 do PRD).

**Modelo proposto (comportamento, não schema físico final):**

```
Template editável (pelo ADMIN, sem deploy)
    ↓
Placeholders (ex.: {{nome}}, {{cnpj}}, {{valor_total}}, {{prazo_uso_imagem}})
    ↓
Preenchidos com dados de Cadastro + Campanha/Participação vigentes
    ↓
PDF gerado
    ↓
Envio para assinatura (provedor externo)
```

Tabelas conceituais equivalentes às já antecipadas em
`docs/ROADMAP_MESTRE_TEAR_V2.md` Fase 4: `contract_templates`,
`contracts`, `contract_signatures`, `contract_events` — contrato gerado
é **imutável** uma vez emitido (nova alteração de template não reescreve
contrato já gerado, gera nova versão).

**Provedor de assinatura digital** (Clicksign, D4Sign, DocuSign, ZapSign
etc.) é decisão do responsável do projeto/jurídico — já registrada como
pendência em `docs/ROADMAP_MESTRE_TEAR_V2.md` §5, reafirmada aqui, não
resolvida por este documento.

---

## 14. Assessoria

Duas arquiteturas possíveis, ambas avaliadas:

| | Modelo A — campo na influenciadora | Modelo B — entidade própria |
|---|---|---|
| Estrutura | `possui_assessoria` (bool) + `assessoria_nome` + `assessoria_contato` em `parceiras` | Tabela `assessorias` com 1:N para `parceiras` |
| Custo de implementação | Baixo — migration simples | Médio — nova entidade, CRUD, relacionamento |
| Escala se uma assessoria representa várias influenciadoras | Dado duplicado por influenciadora (mesmo contato repetido) | Dado único, reaproveitado |
| Permite futuro acesso próprio da assessoria (login, ver todas as influenciadoras que representa) | Não suporta sem migração maior depois | Suporta diretamente |
| Recomendação | Só se assessoria for exceção rara e sem necessidade de portal próprio | **Recomendado** se houver mais de uma influenciadora por assessoria hoje, ou se houver intenção de portal da assessoria no roadmap |

**Decisão pendente:** este documento recomenda o Modelo B por
extensibilidade, mas a escolha real depende de um dado operacional que
não está em nenhuma fonte analisada — quantas influenciadoras atuais
têm assessoria, e se mais de uma influenciadora compartilha a mesma
assessoria. **Confirmar com o responsável do projeto antes de
implementar.**

---

## 15. Geração de contrato

Complementa §13 com requisitos de implementação:

- **Formato:** PDF.
- **Armazenamento:** mesma abstração `Storage` já usada para materiais
  (hoje disco local, Drive real implementado sem credenciais) — sem
  necessidade de novo mecanismo de armazenamento.
- **Versionamento:** cada geração é um registro imutável; alteração de
  template não afeta contratos já emitidos, só os próximos.
- **Template editável sem código:** requisito central — o administrador
  deve conseguir alterar texto/placeholders do modelo base pela própria
  aplicação (tela de edição de template), sem exigir deploy ou alteração
  de código para uma mudança de cláusula. A ferramenta exata de geração
  de PDF (ex. biblioteca de templating/merge) é decisão técnica de
  implementação, não deste documento — mas o requisito de
  "editável pelo admin sem deploy" é **critério de aceite obrigatório**
  da fase de Contratos, não um "nice to have".

---

## 16. Métricas da influenciadora

Espaço de métricas de perfil, em três momentos:

1. **Cadastro inicial:** métricas autodeclaradas no momento do cadastro
   (ex. número de seguidores, engajamento médio) — entrada manual, sem
   verificação automática nesta fase.
2. **Envio sob demanda:** a influenciadora (ou a equipe) pode
   atualizar essas métricas periodicamente, também por entrada manual —
   **não** há integração automática com Instagram/TikTok nesta
   especificação (isso pertence à Fase 3 — Inteligência Operacional —
   do roadmap de produtização, e depende de decisão de escopo própria).
3. **Histórico:** cada atualização gera um novo registro versionado
   (mesma lógica de §3 para medidas) — nunca sobrescreve a métrica
   anterior, permitindo ver evolução ao longo do tempo.

---

## 17. Decisões que precisam do responsável do projeto

Consolidado de todos os pontos que este documento **não decide** —
nenhum deve ser assumido por omissão:

1. CPF como alternativa a CNPJ no cadastro (§4) — é necessidade real
   hoje?
2. Janela de escolha de permuta: quantos dias, e o que acontece ao
   expirar sem escolha (§12).
3. Escopo exato da migração do histórico legado: quais abas, quais
   campos obrigatórios, o que pode ser descartado (§7).
4. Provedor de assinatura digital para contratos (§13).
5. Modelo de Assessoria — campo simples vs. entidade própria — depende
   de dado operacional real (quantas influenciadoras têm assessoria
   hoje) (§14).
6. Se consentimento LGPD deve ser tratado como P0 (recomendação deste
   documento) ou pode permanecer P1 (§5).

---

## 18. Priorização final

### P0 — necessário para operação
- RBAC de leitura por papel e por dono do registro (pré-requisito já
  identificado nos dois roadmaps-fonte; sem ele nada do Portal pode
  abrir com segurança).
- Ativação do vínculo `Parceira.user_id` (pré-requisito técnico da Fase
  1, já mapeado).
- Cadastro avançado: busca automática de CEP + validação formal de
  CNPJ/CPF/telefone (§3, §4).
- Consentimento LGPD + histórico de alterações campo a campo (§5) —
  recomendado como P0 por este documento, dado que expõe dado pessoal
  assim que a influenciadora loga sozinha.
- Regra de visibilidade de campanha por participação ativa, aplicada no
  backend (§6).
- Briefing reorganizado por tipo de conteúdo (§8) — sem ele a
  influenciadora não tem o que consumir no Portal da Fase 1.

### P1 — alto valor, não bloqueia uso atual como produto interno
- Tamanhos/medidas de vestuário (§3).
- Produto/variante e validação de variante, sem a camada de extração
  automática (§10, sem §9).
- Logística e ficha de retirada automática (§11).
- Permutas (§12).
- Contratos — geração e template editável, mesmo sem assinatura digital
  integrada (§13, §15).
- Assessoria como campo/entidade de cadastro (§14) — sem portal próprio.
- Histórico legado (migração somente leitura) (§7).

### P2 — futuro / SaaS
- Escolha inteligente de produto via extração de URL (§9) — depende de
  produto/variante (§10) já maduro e estável.
- Assessoria com portal/login próprio.
- Métricas com integração automática a redes sociais (§16, ponto 2).
- Provedor de assinatura digital totalmente integrado (webhook de
  status), se a fase inicial de Contratos usar apenas geração de PDF
  para assinatura manual/externa.
- Preparação SaaS (multi-tenant, billing) — já coberta em
  `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md`, não repetida aqui.

---

Nenhum código foi escrito, nenhuma tela foi criada e nenhuma arquitetura
foi alterada para produzir este documento. Esta especificação é o
insumo de entrada para a próxima fase de execução (quebra em tarefas
técnicas), a ser conduzida separadamente, seguindo o fluxo obrigatório
do projeto (Auditoria → Plano → Execução → Validação → Commit).
