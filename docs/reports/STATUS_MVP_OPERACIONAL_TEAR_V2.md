# Status — MVP Operacional TEAR V2

Data: 2026-07-20
Escopo: `tear-v2-app/` (Laravel + React). Fecha os dois bloqueadores P1
identificados em `docs/reports/RELATORIO_QA_FUNCIONAL_MVP_TEAR_V2.md`. Nenhuma feature
nova, nenhuma alteração de arquitetura, nenhum início de roadmap.

---

## 1. O que foi corrigido

### Correção 1 — URL do arquivo de Material

**Causa raiz:** `APP_URL=http://localhost` (sem porta) em
`tear-v2-app/backend/.env` / `.env.example`. `config/filesystems.php`
monta a URL pública do disco `public` a partir de `APP_URL`
(`rtrim(env('APP_URL'), '/').'/storage'`), e `MaterialController::store`
usa exatamente essa URL como `drive_file_url` quando o Google Drive real
não está configurado (fallback local). Resultado: todo material enviado
pelo fallback gerava um link para a porta 80 (onde nada escuta em
desenvolvimento), enquanto o backend real roda em `:8000`.

**Correção aplicada:**
- `tear-v2-app/backend/.env.example` (versionado): `APP_URL=http://localhost:8000`.
- `tear-v2-app/backend/.env` (local, gitignored): mesma correção, para que
  o ambiente desta máquina reflita o template.
- Nenhuma linha de código de aplicação alterada — o bug era de
  configuração, não de lógica.

**Efeito colateral esperado, não é bug novo:** materiais enviados *antes*
desta correção mantêm a URL antiga gravada (a coluna `drive_file_url` é um
snapshot tirado no momento do upload, não recalculada a cada leitura). Só
uploads feitos a partir de agora usam a URL corrigida. Não há dado de
produção nesta base local (só dados de teste desta sessão de QA) — nenhuma
migração de dado foi necessária ou feita.

**Validação:** upload de um novo material confirmado gerando
`http://localhost:8000/storage/materiais/....png`; `curl` confirma `200`
nessa URL.

### Correção 2 — Navegação lateral sem destino funcional

**Causa raiz:** `App.tsx` mapeava `/colaboracoes`, `/briefings`,
`/materiais`, `/aprovacoes` e `/pagamentos` para `<PlaceholderPage>`
("Em construção"), embora os fluxos reais por trás desses nomes já
existissem e funcionassem — só alcançáveis indiretamente via
Campanhas → detalhe da campanha → ações por participação.

**Correção aplicada:** as 5 rotas acima agora fazem `<Navigate to="/campanhas" replace />`,
levando direto ao ponto de entrada real desses fluxos.

**Por que redirect e não uma tela de listagem própria:** não existe hoje
nenhum endpoint de backend que agregue materiais, aprovações pendentes ou
pagamentos *entre* participações/campanhas — cada um desses recursos só é
exposto por participação (`GET /participacoes/{id}/materiais`,
`GET /participacoes/{id}/pagamento`, etc.). Construir uma listagem central
exigiria endpoint novo + agregação + tela nova — feature nova, fora do
escopo explícito desta correção ("não criar novas features"). O redirect
resolve o problema relatado (menu leva a beco sem saída) sem abrir essa
frente.

**Não alterado:** `/logistica`, `/documentos`, `/historico` e `/perfil`
continuam como `PlaceholderPage`. Não têm fluxo real implementado em
nenhum outro lugar do sistema — não são o mesmo tipo de bug (menu
desalinhado de funcionalidade existente); são itens de roadmap futuro
ainda não construídos. Redirecioná-los seria enganoso.

---

## 2. Validação executada

- **Navegador:** upload de material novo confirmado com URL corrigida
  (`:8000`, `200 OK`); as 5 rotas redirecionadas (`/materiais`,
  `/aprovacoes`, `/pagamentos`, `/briefings`, `/colaboracoes`) confirmadas
  levando a `/campanhas`; `/logistica` e `/perfil` confirmados inalterados
  (continuam como placeholder).
- **Build** (`tsc -b && vite build`): ok.
- **Lint** (`oxlint`): limpo — só o warning pré-existente e não relacionado
  em `src/lib/auth.tsx:72`.
- **Backend** (`php artisan test`): 84/84 verde, sem regressão.
- **Pint** (`vendor/bin/pint --test`): limpo.
- **Commit separado:** `fix: correct material file URL and route
  placeholder dead ends`.

---

## 3. Status geral

**MVP operacional.** Os dois bloqueadores P1 identificados na QA funcional
anterior estão corrigidos e validados. O fluxo completo — Cadastro →
Campanha → Participação → Briefing → Material → Aprovação → Pagamento —
funciona ponta a ponta pela UI, incluindo agora a navegação lateral para os
módulos que antes levavam a página vazia.

**Sem bloqueadores conhecidos restantes.**

**Débitos registrados, não bloqueantes (P2, fora do escopo desta correção):**
- Mensagens de validação do backend em inglês (`APP_LOCALE=en` — achado
  durante esta correção, ao ler o mesmo `.env` do bug 1; locale pt_BR não
  configurado).
- Valores monetários sem formatação pt-BR (`R$ 1500.00`).
- Card vazio sem rótulo no dashboard.
- Google Drive real segue sem credenciais (débito já documentado em
  `docs/reports/RELATORIO_SPRINT_ESTABILIZACAO_TEAR_V2.md`); upload funciona via
  fallback local.
- Ausência de endpoint agregado (materiais/aprovações/pagamentos entre
  participações) — relevante se o roadmap futuro pedir uma tela central
  de pendências; não implementado agora por estar fora do escopo desta
  sessão.

## 4. Próximo passo sugerido (não iniciado)

Nenhum — aguardando decisão do responsável do projeto sobre iniciar a
Parte 2 do `docs/planning/ROADMAP_MESTRE_TEAR_V2.md` ou priorizar os débitos P2
acima antes disso.
