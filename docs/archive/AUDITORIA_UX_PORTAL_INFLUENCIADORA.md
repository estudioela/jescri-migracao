# Auditoria de UX — Portal da Influenciadora (TEAR V2.5)

Data: 2026-07-20
Papel do autor: Product Designer (agente), a pedido do responsável do
projeto.
Escopo: exclusivamente `tear-v2-app/` (Laravel + React). Não programar —
este documento define experiência, não código. Nenhum arquivo de
aplicação foi alterado para produzi-lo.

## 0. Fontes

- `docs/PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md` — arquitetura já
  decidida (rotas, telas, ordem de execução). Esta auditoria **não reabre**
  essas decisões estruturais; detalha a experiência dentro delas.
- `docs/RELATORIO_SPRINT_1_FUNDACAO_DADOS.md`, `DIAGNOSTICO_AUTENTICACAO_TEAR_V2.md`
  — estado real de backend/frontend na data desta auditoria.
- `docs/design/UX_FLOW.md` ("Perfil: Influenciadora", linha 560) — jornada
  macro já registrada; esta auditoria especializa esse perfil.
- `docs/PRD.md` §6.8, §9 (RF-026…RF-030) — requisitos funcionais de
  referência (nascidos do Portal legado GAS; adaptados aqui ao modelo
  `Campanha`/`ParticipacaoNaCampanha`, não a `Ciclo Mensal`/`Ativação`).
- Leitura direta do código atual: models, controllers, migrations e telas
  já implementadas (`PortalShell`, `PortalDashboardPage`,
  `PortalPerfilPage`, e o equivalente administrativo — `BriefingFormPage`,
  `MateriaisPage`, `PagamentoPage`, `CampanhaDetailPage` — que definem o
  contrato de dados que o Portal vai consumir).

## 1. Estado atual — o que já existe versus o que esta auditoria define

| Etapa da jornada | Estado em 2026-07-20 |
|---|---|
| Convite | ✅ E-mail disparado na aprovação da parceira (`InfluenciadoraConviteNotification`) |
| Senha | ✅ `/definir-senha` funcional (fechado nesta sprint) |
| Login | ✅ `Login.tsx` reaproveitado, funciona para qualquer papel |
| Dashboard | 🟡 Existe (`PortalDashboardPage`), mas só mostra status da conta + 1 aviso de perfil incompleto — nenhuma participação/campanha real ainda |
| Perfil | 🟡 Existe (`PortalPerfilPage`), dados pessoais + endereço + medidas — sem revisão de UX de hierarquia/ordem ainda |
| Campanhas | ❌ Não existe tela no Portal — só existe no lado admin (`CampanhaDetailPage`) |
| Briefings | ❌ Não existe tela no Portal — endpoint de leitura já existe e já autoriza dono |
| Materiais | ❌ Não existe tela no Portal — endpoint de envio já foi reaberto para o dono (Sprint 2 item 6) |
| Aprovação | ❌ (é um estado do Material, não uma tela própria — ver §6) |
| Pagamento | ❌ Não existe tela no Portal — dado já vem embutido em `GET /me/participacoes` |

Esta auditoria define a experiência ideal para as células 🟡/❌, para servir
de insumo à próxima sessão de execução (Sprint 2, itens 5–8, já
sequenciados em `PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md` §9).

## 2. Princípio geral

A influenciadora não gerencia dados — ela **cumpre entregas e acompanha
resultado**. Toda tela do Portal responde a uma de três perguntas: *o que
eu preciso fazer agora?*, *o que eu já fiz?*, *quanto eu vou receber (ou
já recebi)?*. Qualquer informação que não sirva a uma dessas três
perguntas não pertence ao Portal — pertence ao admin.

Tom de microcópia: direto, em português informal, minúsculas em rótulos
de ação (`salvar dados pessoais`, `enviar material`, `sair`) — já
estabelecido em `PortalShell`/`PortalPerfilPage`; esta auditoria mantém o
padrão em todo texto novo proposto abaixo.

---

## 3. Jornada completa

```
Convite (e-mail)
   ↓
Definir senha (/definir-senha — fora da sessão)
   ↓
Login (/login)
   ↓
Dashboard (/)
   ↓
   ├── Perfil (/perfil) — a qualquer momento, não é etapa obrigatória
   │
   └── Campanhas (lista, dentro do Dashboard) → Participação (detalhe)
          ├── Briefing (por tipo de conteúdo)
          ├── Materiais (envio) → Aprovação (estado, não navegação)
          └── Pagamento (consulta, dentro do mesmo painel)
```

Duas correções de modelo mental em relação ao enunciado original da
tarefa: **Perfil não é uma etapa sequencial** (a influenciadora não
precisa completá-lo para ver campanhas — ver Dashboard, estado B) e
**Aprovação não é uma tela** — é um estado visível do Material dentro da
tela de Materiais, e um estado visível do Pagamento dentro do mesmo
painel. Criar telas dedicadas para "Aprovação" fragmentaria o que já é
uma unidade (a participação) em mais cliques sem ganho de clareza.

---

## 4. Dashboard

### Objetivo
Responder "o que eu preciso fazer agora?" em menos de 3 segundos de
leitura, sem exigir clique.

### O que aparece

1. **Saudação** (já implementada — `Bom dia/Boa tarde/Boa noite, {primeiro
   nome}`). Mantém.
2. **Lista de participações ativas**, uma por card, ordenada por prazo de
   briefing mais próximo primeiro (não por data de criação). Cada card:
   - nome da campanha + nome da marca (`campanha.marca.nome`);
   - contagem "entregáveis pendentes" — soma de `(qtd contratada − qtd
     enviada)` por tipo (Feed/Reels/Stories/TikTok/UGC), ex.: *"2 reels,
     1 story pendentes"*; se tudo enviado, mostra *"tudo enviado, aguardando
     aprovação"* ou *"tudo aprovado"*;
   - badge de status financeiro da participação (`pendente` / `aprovado` /
     `pago`), mesma paleta de tom já usada no admin (`Badge` — success/
     neutral/error), nunca um badge novo;
   - clique no card inteiro (não só um link) → Detalhe da Participação.
3. **Card de perfil incompleto** (já implementado) — mas rebaixado:
   aparece **acima** da lista de participações só se `perfilEstaCompleto`
   for falso, e **abaixo** dela (como aviso secundário, não bloqueio) caso
   contrário. Nunca impede o acesso às campanhas — perfil incompleto é um
   lembrete, não um gate.

### Estados

| Estado | O que mostrar |
|---|---|
| A — sem nenhuma participação ainda | Mensagem única: *"Você ainda não está em nenhuma campanha ativa. Quando a equipe te incluir em uma, ela aparece aqui."* Sem card vazio, sem ilustração — uma frase resolve. |
| B — participações, perfil incompleto | Lista de campanhas primeiro; aviso de perfil como card secundário depois, nunca bloqueando. |
| C — tudo entregue e aprovado, nada pendente | Cards permanecem visíveis (histórico recente), mas sem contagem de pendência — mostram "concluída" implicitamente pela ausência de números. |
| D — erro ao carregar | Mensagem de erro já implementada (`role="alert"`) — mantém, mas nunca substitui a saudação (a influenciadora sempre vê que está logada como quem é). |

### O que **não** aparece
Sem gráfico, sem "atividade recente", sem notificações genéricas. O
Dashboard lista compromissos, não narra histórico — histórico é uma
extensão natural da tela de Participação (não do Dashboard), e fica fora
desta sprint por decisão já registrada (§6 do plano técnico, "fora desta
sprint: Histórico").

---

## 5. Perfil

### Objetivo
Manter dados corretos para pagamento e contato — não é uma vitrine de
identidade, é um formulário de dados operacionais.

### Dados (grounded em `Parceira` + `Medida`, sem campo novo)

Três grupos, nesta ordem — do que afeta pagamento/contato primeiro,
medidas por último (são as menos urgentes, únicas usadas fora do ciclo
comercial direto):

1. **Contato e recebimento** — `nome`, `email`, `telefone`, `instagram`,
   `chave_pix`. É o grupo que mais importa: PIX errado significa
   pagamento não entregue. Sugestão de UX: mover `chave_pix` para o topo
   do grupo (hoje é o último campo do formulário atual) e adicionar
   auxiliar de texto abaixo do campo: *"confira com atenção — é para aqui
   que o pagamento vai."* no campo `chave_pix`.
2. **Endereço** — `cep`, `rua`, `numero`, `complemento`, `bairro`,
   `cidade`, `uf`. Usado para envio de produto físico (implícito no
   modelo, RN-02 de busca automática por CEP já é débito conhecido e fora
   de escopo — ver `TASK_ROUTER.md` §15). Mantém layout atual (CEP+UF na
   mesma linha, depois rua, depois número+complemento, depois bairro/
   cidade) — já é uma ordem de preenchimento razoável, não requer mudança.
3. **Medidas** (`sutia_tamanho/numeracao/taca`, `calcinha_tamanho`,
   `linha_noite_tamanho`) — formulário próprio, já corretamente separado
   do formulário de dados pessoais (dois `<form>`, dois botões de salvar
   independentes — mantém; salvar medidas não deve exigir reconfirmar
   consentimento LGPD, e hoje corretamente não exige).

### Consentimento LGPD
Mantém o padrão atual (checkbox obrigatório só no formulário de dados
pessoais, não no de medidas) — é a superfície certa: medidas não são dado
pessoal sensível regulado da mesma forma que endereço/PIX/contato.
Recomendação de texto: o rótulo atual (*"Confirmo que os dados acima
estão corretos e autorizo sua atualização"*) mistura duas afirmações
(veracidade + autorização) — manter como está é aceitável para esta
sprint, mas registrar como item de revisão jurídica futura, não bloqueio
de UX.

### Estados
- Carregando → `"Carregando…"` (já implementado, mantém).
- Erro ao carregar perfil → mensagem única, sem formulário (já
  implementado, mantém).
- Sucesso ao salvar → mensagem inline por formulário (já implementado,
  dois sucessos independentes — dados pessoais e medidas cada um com seu
  próprio aviso). Duração recomendada: some após ~4s ou na próxima
  edição, o que vier primeiro (não implementado ainda — hoje o aviso é
  permanente até novo submit; pequeno ajuste, não crítico).
- Erro de validação por campo (422) → já implementado, mantém (mapeamento
  campo a campo já existe em `PerfilFieldErrors`).

---

## 6. Campanhas

### Decisão de estrutura (herdada, não reaberta)
Um único painel por participação — não uma tela "Campanha" separada de
uma tela "Participação" como no admin. A influenciadora nunca navega
entre "a campanha" e "minha parte na campanha": para ela são a mesma
coisa. Isso já está decidido em `PLANO_TECNICO_SPRINT_2...md` §6 item 4 —
esta auditoria concorda e detalha.

### Como mostrar

**Cabeçalho do painel** (`/campanhas/:participacaoId`):
- nome da campanha, nome da marca, período (`data_inicio`–`data_fim` da
  campanha, não da participação — a participação não tem essas datas
  próprias);
- resumo de entregáveis contratados por tipo, em uma linha compacta:
  `Feed 1 · Reels 2 · Stories 4 · TikTok 0 · UGC 0` (tipos com quantidade
  zero aparecem apagados/cinza, não somem — mostra o que **não** foi
  contratado tanto quanto o que foi, evita a pergunta "cadê o TikTok?");
- **sem** botão/ação de "cancelar" (isso é uma ação administrativa —
  `status: CANCELADA` só é acionável pelo admin, corretamente já restrito
  no backend a `role:ADMIN` implícito na ausência de rota; não expor no
  Portal).

**Corpo do painel** — três seções verticais (não abas — abas escondem
conteúdo e a influenciadora precisa ver todo o estado de uma vez; seções
com âncora de rolagem são suficientes para o volume de conteúdo aqui):
1. Briefing (detalhado em §7);
2. Materiais (detalhado em §8);
3. Pagamento — ver §9.

### Estados
- Participação `ATIVA` sem nenhum briefing publicado ainda → seção de
  Briefing mostra: *"a equipe ainda não publicou o briefing desta
  campanha. Volte em breve."* — não mostrar formulário de envio de
  material antes de existir briefing para nenhum tipo (ver §8, regra de
  dependência).
- Participação não pertence à influenciadora logada / não existe → 404
  genérico, redireciona para Dashboard (mesmo padrão do admin, sem
  mensagem que revele se o ID existe — não vazar existência de dado de
  terceiro).

---

## 7. Briefings — organização por tipo de conteúdo

### Regra de dados (grounded)
Um briefing por tipo, no máximo 5 tipos possíveis por participação:
**Feed, Reels, Stories, TikTok, UGC** (`Briefing.tipo`, únicos valores
aceitos). Um tipo só tem briefing se a participação tiver quantidade
contratada `> 0` para aquele tipo (`quantidadeContratadaPara`). Portanto
a lista de briefings de uma participação é sempre um subconjunto dos
tipos contratados — nunca mais que 5, frequentemente menos.

### Como organizar
**Um bloco por tipo contratado, sempre nesta ordem fixa** (Feed → Reels →
Stories → TikTok → UGC — ordem estável para a influenciadora nunca
precisar "procurar" onde está cada bloco entre visitas):

Para cada tipo contratado:
- se **não existe** briefing ainda para esse tipo → bloco colapsado,
  cinza, texto: *"briefing de {tipo} ainda não publicado"`;
- se **existe** → bloco expandido mostrando:
  - `orientacoes` (texto principal, sempre visível, não escondido atrás
    de "ver mais");
  - `prazo` em destaque (data + contagem relativa: *"entrega até 15/08 —
    faltam 6 dias"* — hoje o campo existe mas não há essa contagem
    relativa em nenhuma tela; é a peça de maior valor de UX desta seção,
    é a resposta direta a "o que eu preciso fazer agora?");
  - `entregaveis_esperados`, se preenchido;
  - `referencias` (hoje é `json`/array, mas **não exposto em nenhuma tela
    admin ainda** — se vier vazio do backend, simplesmente omitir a
    subseção, não mostrar "nenhuma referência");
  - contador de progresso do tipo: *"1 de 2 reels enviados"* (cruza com
    Materiais, §8) — mesmo tom de badge usado no restante do Portal;
  - CTA para a seção de Materiais daquele tipo específico (rolagem
    ancorada, não navegação de página — ver §8).

### Por que não usar abas
Ordem fixa e progresso visível simultaneamente (quantos tipos faltam
entregar) são mais importantes do que economizar espaço vertical — o
volume por participação é baixo (no máximo 5 blocos), abas aqui
esconderiam a visão geral que o card do Dashboard já prometeu ("2 reels,
1 story pendentes").

---

## 8. Materiais — fluxo de envio e aprovação

### Decisão pendente de produto (não decidida por esta auditoria)
Existe uma **inconsistência de modelo entre `Briefing.tipo`** (`FEED,
REELS, STORIES, TIKTOK, UGC`) **e `Material.tipo`** (`REELS, STORIES,
FOTOS, OUTROS`) — nem os nomes nem a cardinalidade combinam (`Material`
não tem `FEED`, `TIKTOK` nem `UGC`; tem `FOTOS`/`OUTROS`, que não existem
em `Briefing`). Além disso, `Material` **não tem `briefing_id`** — só
`participacao_id` — então hoje não há vínculo estrutural entre "o
material X responde ao briefing de Reels Y". Isso é uma decisão de
negócio inédita (qual taxonomia é a correta, e se material deve linkar a
um briefing específico), não uma escolha de interface — **esta auditoria
para aqui e registra a pergunta**, conforme o mandato do projeto ("o
agente PARA e pede decisão humana... quando houver regra de negócio
inédita").

A experiência abaixo assume a resolução mais simples (unificar
`Material.tipo` para os mesmos 5 valores de `Briefing.tipo`, sem
`FOTOS`/`OUTROS`) porque é a que faz o fluxo fazer sentido para a
influenciadora — mas a implementação real depende da decisão do
responsável do projeto.

### Fluxo de envio (dentro de cada bloco de tipo, §7)

1. Botão "enviar material" aparece **somente** se existe briefing
   publicado para aquele tipo **e** a quantidade enviada `< ` quantidade
   contratada (mesma regra que hoje bloqueia `Briefing.store` no
   backend, replicada como regra de exibição, não só de validação de
   servidor).
2. Formulário mínimo: seletor de arquivo (permitir múltiplos arquivos por
   envio — hoje o admin só aceita um arquivo por vez; para a
   influenciadora, que frequentemente entrega um lote de fotos/stories de
   uma vez, isso é atrito real, recomenda-se `multiple` no input desde a
   primeira versão do Portal, mesmo que o admin continue single-file).
   Sem campo de "tipo" no formulário — o tipo já é implícito pelo bloco
   onde o botão foi clicado (diferente do admin, que exige selecionar
   tipo manualmente porque não está dentro de um contexto de briefing).
3. Estado de envio: barra/indicador simples, texto `"enviando…"` (mesmo
   padrão de `isLoading`/`loadingText` já usado em outros formulários do
   Portal, ex. `Button` de Perfil).
4. Confirmação: material aparece imediatamente na lista daquele bloco com
   badge `pendente` (tom neutro).

### Lista de materiais enviados (dentro de cada bloco de tipo)
- nome do arquivo + link "ver arquivo" (`drive_file_url`), já existente;
- badge de status, mesma paleta do admin:
  - `pendente` (neutro) — *"aguardando avaliação da equipe"*;
  - `aprovado` (verde) — *"aprovado"*, sem exigir mais ação;
  - `reprovado` (vermelho) — mostra `motivo_reprovacao` **sempre visível**
    (nunca atrás de clique — é a informação mais importante quando
    aparece) **+ botão "enviar novamente"** reaberto no mesmo bloco.

### Reenvio após reprovação (gap identificado, não implementado)
Hoje o backend não tem rota de "substituir" material — cada envio é um
registro novo (`POST` cria; não há `destroy`/`update` de arquivo). Do
ponto de vista de UX isso é aceitável **desde que o histórico de tentativas
reprovadas continue visível** (não escondido, não substituído
silenciosamente) — a influenciadora e a equipe precisam ver que houve uma
tentativa anterior recusada, não só a versão atual. Recomendação: listar
todas as tentativas daquele tipo em ordem cronológica, mais recente no
topo, reprovadas anteriores com opacidade reduzida mas sempre presentes
— nunca apagadas da tela.

### Aprovação — não é uma tela, é o estado acima
Confirma a decisão de fundir "Aprovação" na tela de Materiais (§3): o
único ato de "aprovar" é feito pela equipe (admin), do lado da
influenciadora é sempre leitura de estado. Não há necessidade de rota,
tela ou notificação push dedicada nesta sprint — o estado já é visível
sempre que a influenciadora abrir o painel da participação.

---

## 9. Pagamento (fechamento da jornada)

Não fazia parte da lista de seções a "definir", mas é o destino final da
jornada — registrado aqui por completude, em nível de resumo (o
detalhamento fica para uma auditoria financeira dedicada, se o volume de
participações por influenciadora justificar, conforme RF-030 já registrado
como entrega futura em `PLANO_TECNICO_SPRINT_2...md` §6.5).

Dentro do painel de participação (§6), última seção:
- `valor` formatado em R$;
- badge de status (`pendente`/`aprovado`/`pago` — hoje admin trata
  `aprovado` e `pago` visualmente idênticos, ambos verdes; para a
  influenciadora essa distinção importa mais do que para o admin —
  recomenda-se um segundo tom de verde ou um ícone diferenciador só nesta
  tela, não uma cor nova no sistema de design);
- sem ação nenhuma (a influenciadora nunca aciona transição de status —
  é território exclusivo do admin, já assim no backend).

---

## 10. Débitos e decisões pendentes (consolidado)

1. **Taxonomia `Material.tipo` vs `Briefing.tipo` divergente** — decisão
   de negócio pendente do responsável do projeto (§8). Bloqueia a
   implementação fiel do fluxo de Materiais desenhado aqui até
   resolvida.
2. **Múltiplos arquivos por envio** — recomendação de UX nova (múltiplos
   arquivos), backend hoje aceita um arquivo por request; requer decisão
   de implementação (loop de requests no frontend vs. endpoint que aceita
   array) — decisão técnica, não de produto, pode ser resolvida na
   execução.
3. **Contagem relativa de prazo** ("faltam 6 dias") — peça de maior valor
   de UX em Briefings, sem dependência de dado novo (`prazo` já existe),
   é lógica de apresentação pura.
4. **Distinção visual `aprovado` vs `pago`** em Pagamento — hoje
   indistinguível no admin; recomenda-se resolver ao menos no Portal.
5. Nenhum débito desta auditoria contraria decisão arquitetural já
   tomada (painel único por participação, sem abas de "Aprovação"
   separada) — todas as recomendações operam dentro da arquitetura
   existente.

---

Nenhum código foi escrito, nenhuma tela implementada e nenhuma decisão
arquitetural alterada para produzir este documento. Esta auditoria é o
insumo de entrada para a próxima sessão de execução (Sprint 2, itens 5–8),
seguindo o fluxo obrigatório do projeto (Auditoria → Plano → Execução →
Validação → Commit).
