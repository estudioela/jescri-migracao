# Relatório — QA Funcional do MVP TEAR V2

Data: 2026-07-20
Escopo: `tear-v2-app/` (Laravel + React), ambiente local (`npm run dev:all`,
backend `:8000`, frontend `:5173`, SQLite local, Google Drive não configurado).
Login usado: `admin@tear.test` (role `ADMIN`, seed `DevUserSeeder`).

Metodologia: navegação real no Chrome (clique/preenchimento/submit), sem
atalhos de banco — todo dado citado abaixo foi criado pela UI durante esta
sessão. Nível de profundidade: fluxo principal de cada módulo (abrir →
executar ação principal → confirmar resultado), sem teste exaustivo de cada
campo isolado.

---

## 1. Resumo executivo

O fluxo de negócio completo — **Cadastro → Campanha → Participação →
Briefing → Material → Aprovação → Pagamento** — **funciona ponta a ponta**
tecnicamente. Todos os dados testados nesta sessão foram criados, vinculados
e tiveram seus status avançados pela UI, sem intervenção manual no banco ou
no backend.

Dois problemas reais de impacto (P1) foram encontrados e **não foram
corrigidos** (conforme instrução: catalogar primeiro, corrigir depois):

1. O link "ver arquivo" de um material enviado pelo fallback local do Drive
   está quebrado (aponta para a porta errada do backend).
2. A navegação lateral (sidebar) para 9 dos 12 itens do menu — incluindo
   Briefings, Materiais, Aprovações e Pagamentos — leva a páginas
   "Em construção", e não ao fluxo funcional. O fluxo real só é alcançado
   entrando em Campanhas → detalhe da campanha → ações por participação.

Nenhum dos dois impede a operação de fato (dados salvam, status avança), mas
ambos comprometem a experiência de um operador que ainda não conhece o
sistema por dentro — o segundo, em particular, esconde o caminho real atrás
de uma navegação que parece funcional e não é.

---

## 2. Fluxos testados

### Fluxo: Login ADMIN
**Resultado:** ✅ Funcionando
Login com `admin@tear.test`, dashboard carrega, sessão persiste após reload
completo da página (`/` → hard reload → ainda autenticado).

### Fluxo: Parceiras
**Resultado:** ✅ Funcionando
Listar, visualizar, criar ("Beatriz QA Fluxo", nasce `INATIVA` — condiz com
a regra de novo cadastro pendente de aprovação), editar (formulário
pré-preenchido corretamente) e alterar status (`aprovar` → `INATIVA` →
`ATIVA`, refletido imediatamente na listagem e no seletor de parceiras de
Campanhas).
**Auditoria de campos obrigatórios:** frontend (`required` em
`ParceiraFormPage.tsx`) e backend (`StoreParceiraRequest`/
`UpdateParceiraRequest`) exigem exatamente os mesmos campos — nome, email,
telefone, instagram, chave_pix, cidade, uf. Submissão vazia foi
corretamente rejeitada pelo backend (todos os campos obrigatórios
retornaram erro 422) e o frontend exibiu a mensagem por campo.

### Fluxo: Marcas
**Resultado:** ✅ Funcionando
Listar, criar ("Marca QA Fluxo"), editar. Único campo obrigatório é `nome`,
consistente entre frontend e backend (`StoreMarcaRequest`).

### Fluxo: Campanhas
**Resultado:** ✅ Funcionando
Criação vinculada a uma marca (dropdown carrega marcas cadastradas,
incluindo a criada nesta sessão), status inicial `PLANEJADA`, detalhe exibe
marca e período corretamente. Campos obrigatórios (`marca_id`, `nome`,
`data_inicio`) consistentes entre frontend e backend.

### Fluxo: Participações
**Resultado:** ✅ Funcionando
Vínculo parceira↔campanha feito na própria página de detalhe da campanha
("Vincular parceira"). O seletor só lista parceiras `ATIVA` (confirma que a
mudança de status testada em Parceiras realmente afeta este fluxo). Linha
da participação nasce com status `ATIVA` e expõe ações diretas — Briefing,
Materiais, Pagamento, Cancelar.

### Fluxo: Briefings
**Resultado:** ✅ Funcionando
Formulário acessado pela ação "briefing" da participação. Campos
obrigatórios (`orientacoes`, `prazo`) consistentes entre frontend e
backend. Salvo com sucesso, retorna ao detalhe da campanha.

### Fluxo: Materiais
**Resultado:** ⚠️ Funciona, com bug real no link de visualização (ver §3)
Upload de arquivo real testado (PNG, via fallback de disco local — Google
Drive segue sem credenciais, comportamento já documentado no relatório da
sprint anterior). Material aparece como `PENDENTE` imediatamente após o
envio. O link "ver arquivo" gerado está quebrado (ver Bug 1).

### Fluxo: Aprovação
**Resultado:** ✅ Funcionando (funcionalidade) / ⚠️ sem página central (ver §3)
Botão "aprovar" na própria linha do material muda o status para `APROVADO`
e remove as ações (estado terminal). Testado com sucesso. Não existe uma
tela central "Aprovações" que liste pendências de todas as participações —
só a ação contextual dentro de cada Materiais/participação (ver Bug 2).

### Fluxo: Pagamentos
**Resultado:** ✅ Funcionando
Criação de pagamento (R$ 1.500,00) a partir da participação, com máquina de
estados completa testada nesta sessão: `PENDENTE` → `APROVADO` (botão
"aprovar") → `PAGO` (botão "marcar como pago"). Cada transição remove a
ação anterior e mostra a próxima, sem permitir pular etapa pela UI.

---

## 3. Bugs encontrados

### Bug 1 — Link "ver arquivo" do material aponta para porta errada
- **Prioridade:** P1
- **Onde:** backend, gerado a partir de `APP_URL` em
  `tear-v2-app/backend/.env` (`APP_URL=http://localhost`, sem porta) usado
  por `Storage::disk('public')->url()` no fallback local do
  `GoogleDriveService`/`MaterialController`.
- **Evidência:** material enviado nesta sessão gerou o link
  `http://localhost/storage/materiais/....png`. `curl` confirma: porta 80
  não conecta (`000`); a porta real do backend, `:8000`, responde `200`.
- **Efeito:** com o Drive real desligado (estado atual do ambiente), todo
  material enviado usa o fallback local — e o único jeito de conferir o
  conteúdo antes de aprovar (clicar "ver arquivo") está quebrado. O botão
  "aprovar" continua funcionando mesmo assim (não depende do link), então
  tecnicamente não bloqueia a transição de status — mas esvazia o
  propósito da etapa de aprovação (aprovar sem conseguir ver o material).
- **Não corrigido nesta sessão** (instrução explícita: catalogar primeiro).

### Bug 2 — Navegação lateral não leva ao fluxo funcional em 9 dos 12 itens
- **Prioridade:** P1
- **Onde:** frontend, `App.tsx` — rotas `/colaboracoes`, `/briefings`,
  `/materiais`, `/aprovacoes`, `/logistica`, `/pagamentos`, `/documentos`,
  `/historico`, `/perfil` renderizam `<PlaceholderPage>` ("Em construção —
  funcionalidade ainda não implementada.").
- **Efeito:** os módulos por trás desses nomes **existem e funcionam**
  (confirmado em todos os testes acima), mas só são alcançáveis por um
  caminho indireto: Campanhas → abrir uma campanha específica → ação por
  participação. Um operador que siga o menu lateral (o caminho óbvio) bate
  em página vazia em 9 de 12 destinos e pode concluir, errado, que o
  sistema não tem essas funcionalidades.
- Especificamente Aprovações: não existe uma lista central de pendências
  (materiais ou pagamentos aguardando aprovação de todas as participações);
  a aprovação só acontece uma a uma, dentro de cada participação.
- **Não corrigido nesta sessão** — é uma decisão de escopo de navegação,
  não um bug de lógica de negócio; registrar para priorização.

---

## 4. Melhorias futuras (P2 — não bloqueiam)

1. Mensagens de validação do backend em inglês ("The nome field is
   required.") em toda a aplicação, apesar da UI ser 100% em português.
   Falta locale `pt_BR` configurado no Laravel. Comportamento correto
   (bloqueia e informa por campo), só o idioma da mensagem está errado.
2. Valores monetários exibidos sem formatação pt-BR — `R$ 1500.00` em vez
   de `R$ 1.500,00` (`PagamentoPage.tsx`).
3. Dashboard (`/`) mostra um card cinza vazio, sem rótulo, ao lado de
   "Financeiro" — aparenta ser um placeholder de layout inacabado.

---

## 5. Dependência de infraestrutura (já documentada, reconfirmada)

Google Drive real segue sem `GOOGLE_DRIVE_CLIENT_EMAIL`/
`GOOGLE_DRIVE_PRIVATE_KEY`. Upload cai no fallback de disco local, que
**funciona** (testado nesta sessão) mas não é o destino real de produção.
Nenhuma alteração de arquitetura foi feita. Ver
`docs/reports/RELATORIO_SPRINT_ESTABILIZACAO_TEAR_V2.md` para o passo a passo de
ativação.

---

## 6. Status geral do MVP

**BLOQUEADORES DO MVP:** nenhum. Todo o fluxo de negócio salva dado real e
avança de estado sem intervenção técnica.

**MELHORIAS QUE MERECEM PRIORIDADE (P1, antes de homologação com usuário
real):**
- Bug 1 (link do material quebrado no fallback local).
- Bug 2 (navegação lateral não leva ao fluxo real em 9 módulos).

**MELHORIAS FUTURAS (P2):** locale de validação, formatação monetária, card
vazio no dashboard.

## 7. Critério de sucesso — resposta direta

> O TEAR V2 consegue executar Cadastro → Campanha → Participação →
> Briefing → Material → Aprovação → Pagamento sem depender de intervenção
> técnica?

**Sim.** Os sete passos foram executados nesta sessão inteiramente pela
UI, com dados reais, sem tocar em banco ou backend diretamente. As duas
ressalvas P1 (link de material e navegação lateral) não impedem a
operação, mas devem ser resolvidas antes de colocar um operador real, sem
conhecimento prévio do sistema, para trabalhar sem supervisão.
