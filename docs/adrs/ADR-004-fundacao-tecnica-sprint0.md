# ADR-004 — Fundação técnica (Sprint 0)

- **Status:** Proposto
- **Data:** 2026-07-14
- **Relaciona-se a:** IMPLEMENTATION_ROADMAP_V2 §4; PROJECT_GOVERNANCE §3; ADR-001 (fail-fast/enums); ADR-002 (frontend); ADR-003 (linguagem ubíqua).
- **Autor da decisão:** (confirmar autor humano)

## Contexto

O Sprint 0 prepara o terreno técnico para o primeiro Vertical Slice (M1), sem
nenhuma feature de negócio (roadmap §4). Até aqui o repositório só tinha as
camadas de dados (`ACL.js`, `Repositories.js` na raiz), sem harness de teste,
sem convenção de diretórios por camada e sem pipeline local.

## Decisões

### D-04 — Convenção de diretórios `.js` por camada
Código de produção sob `src/`, um diretório por camada da arquitetura congelada:
`entrypoint/`, `controller/`, `service/`, `domain/`, `repository/`, `acl/`,
`adapters/` e `shared/` (infra transversal: `Envelope`, `Include`, `Config`).
Cada camada nasce com um `_contract.js` — apenas o contrato de interface
(responsabilidade + dependências permitidas), sem implementação.

### D-05 — Harness de teste: `jest` sobre GAS via `vm`
GAS não tem `require` e declara funções globais. `test/helpers/gasHarness.js`
carrega arquivos `.js` num contexto `vm` isolado com globais GAS mockáveis e
devolve o sandbox para asserção. Pipeline local: `npm run lint && npm test`.

### D-06 — Deploy e segredos
Publicação via `clasp`, **controlada pelo operador** (§3.6); agentes não publicam.
`.clasp.json` (com `scriptId`) é git-ignored; o repo versiona só `.clasp.json.example`.
`.claspignore` opera como allowlist (§3.5): sobem apenas `appsscript.json`, `src/**`
e o data-layer legado da raiz. Segredos/IDs (ex.: `SPREADSHEET_ID` da planilha
`portal-ela`) vivem em Script Properties, lidos por `src/shared/Config.js` com fail-fast.

## Escopo (não-objetivos explícitos)

- Nenhuma entidade de domínio (ex.: Parceira) — o domínio nasce vazio.
- Nenhum controller/service/repository/ACL concreto.
- Endpoint `doGet`/`smokePing` são **fumaça** (validam envelope + `include()`); removidos/substituídos em M1.

## Débitos registrados

1. **Migração do data-layer legado:** `ACL.js` e `Repositories.js` na raiz serão
   movidos para `src/acl/` e `src/repository/` em M1 — não movidos agora para não
   antecipar o slice nem alterar arquitetura.
2. **Esqueleto do design system (roadmap §4):** `webapp/design-system/` (tokens +
   `gallery.html`) NÃO foi criado neste Sprint por instrução de não ler os documentos
   de design system agora. Fica pendente de autorização.
3. **Reconciliar D-05/D-06 com Implementation Plan §8:** os rótulos foram derivados
   do roadmap §4; o texto oficial de D-05/D-06 no Implementation Plan não foi lido
   neste Sprint. Confirmar equivalência.
