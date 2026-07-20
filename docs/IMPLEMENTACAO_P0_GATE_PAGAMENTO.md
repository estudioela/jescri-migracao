# P0-1 — Gate de pagamento por aprovação de conteúdo

**Sistema:** B (`tear-v2-app`, Laravel + React).
**Origem do requisito:** `docs/CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md`
(branch `worktree-auditoria-regras-legado`, PR #42 — ainda não mergeada em
`feat/ui-design-system-ela`; item P0-1 lido diretamente do remoto para esta
implementação).

## Regra implementada

`Pagamento` só pode transicionar para `APROVADO` se todo `Material` da
`ParticipacaoNaCampanha` correspondente estiver com `status = APROVADO`.
Participação sem nenhum `Material` esperado aprova por vacuidade (mesma
regra do legado, `PagamentoService.exigirConteudoAprovado`). Violação retorna
`409` e não altera o status nem os campos de auditoria (`aprovado_por`/
`aprovado_em`).

Equivalência com o legado: lá o critério é "Aprovado *ou* Publicado"
(SPEC-020 Q-04). O Sistema B ainda não tem status "Publicado" para
`Material` (enum atual: `PENDENTE`/`APROVADO`/`REPROVADO`), então o
equivalente direto é só `APROVADO`. A pergunta 🟠 do documento de
consolidação (publicação obrigatória ou não) segue aberta para o PO, mas
não bloqueia esta implementação — o requisito consolidado já define o
comportamento a implementar, mesmo padrão de precedência usado em SPEC-020
do Sistema A (implementado, PO confirma depois).

**Achado não previsto:** a restrição por papel administrativo que o
documento de consolidação apontava como ausente ("hoje qualquer usuário
autenticado... consegue aprovar") já estava coberta pelo middleware
`role:ADMIN` na rota `PATCH /pagamentos/{pagamento}` (`routes/api.php`),
com teste próprio já verde
(`test_usuario_sem_role_admin_nao_pode_atualizar_pagamento`). Achado do
documento estava desatualizado nesse ponto — nenhuma mudança necessária ali.

## Arquivos alterados

- `tear-v2-app/backend/app/Http/Controllers/Api/PagamentoController.php` —
  método privado `existeMaterialNaoAprovado()` chamado em `update()` antes
  de aceitar a transição para `APROVADO`.
- `tear-v2-app/backend/tests/Feature/PagamentoTest.php` — 4 testes novos:
  material pendente bloqueia, material reprovado bloqueia, todo material
  aprovado permite, ausência de material permite (vacuidade).

## Validação

- `php artisan test`: 121/121 verde (117 pré-existentes + 4 novos).
- `./vendor/bin/pint --test`: limpo.
- Sem alteração de schema, sem frontend tocado (Portal ainda não expõe tela
  de Pagamentos — fora do escopo deste item).
