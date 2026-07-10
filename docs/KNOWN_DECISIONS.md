# Decisões Permanentes — Projeto Tear (V2)

Registre aqui só o que é permanente (padrões, regras entre camadas, segurança,
convenções, restrições). Nada temporário.

## Arquitetura
- **10 arquivos por camada** (não 1 por classe): o Apps Script tem escopo global único; menos arquivos = menos ruído. Bindings de topo são só literais/classes, então a ordem de carga é irrelevante.
- **Extensão `.js` local** (não `.gs`): o clasp renderiza como `.gs` no editor; `.js` preserva Jest/eslint.
- **Camadas:** Entrypoint → Controller → Service → Repository.

## Segurança
- Entrypoints devem ser `function` de topo — `google.script.run` chama por NOME (string). Trava: `test/tear-entrypoints-globais`.
- Envelope `{success, data|error}` só no Controller/`_comEnvelope`; camadas internas lançam exceção.
- Operações admin (`apiBuscarParceira`, `apiSalvarParceira`, `adminDefinirSenha`) exigem `ADMIN_TOKEN` (PropertiesService) via `_exigirAdmin`: rate-limit + comparação em tempo constante; mesma mensagem para "ausente" e "errado".
- Escopo por sessão: entrypoints de parceira filtram por `idInfluenciadora` da sessão (posse rigorosa).
- Busca de parceira só por EMAIL/CNPJ, nunca coluna arbitrária.
- Token de sessão em `sessionStorage`, nunca `localStorage`. Todo valor interpolado no front passa por `escaparHtml`.

## Convenções
- Repositório público: nenhum PII/seed real no código; IDs/dados reais vêm de PropertiesService.
- `CAMPOS_*` de cada Repository = projeção de LEITURA daquela aba, **não** o schema físico. O schema físico está em `DevTools.cabecalhosV2_()`.
- Upsert de parceira casa por `INFLU_KEY` e escreve só as colunas mapeadas (preserva fórmulas e colunas não mapeadas).
- `.claspignore` é allowlist: só os 10 arquivos sobem. Trava: `test/claspignore-allowlist`.

## Restrições
- `clasp push` exige autorização explícita do usuário (CLAUDE.md §12.4.4).
- Migração roda só com `MIGRACAO_HABILITADA=true`; `parceirosDaBaseV1` migra TODO o histórico (ignora status ON/OFF), descartando só SEM_CUPOM/SEM_INFLU_KEY.
