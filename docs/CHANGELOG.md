# CHANGELOG

## Sprint 1 - Parceiras

- Vertical Slice Parceiras concluida no fluxo administrativo existente (sem nova tela): listar, nova parceira, salvar, editar, salvar e ativar/desativar.
- Integracao frontend-backend consolidada para Parceiras com endpoints administrativos reutilizados: LIST_ALL, GET_BY_ID, UPSERT e SET_STATUS.
- Wizard administrativo ajustado para prefill em edicao e retorno para listagem apos salvar.
- Correcoes de consistencia aplicadas para chave canonica de Parceiras no salvar (compatibilidade entre INFLU_KEY e ID_Influenciadora).
- Validacoes da Vertical Slice Parceiras adicionadas/atualizadas com testes focados (backend, wizard admin e fluxo integrado).
- Hardening da Sprint 1.1 executado no slice Parceiras (revisao de codigo e revalidacao de testes do slice).
