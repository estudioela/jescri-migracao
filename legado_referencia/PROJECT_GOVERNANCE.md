# PROJECT GOVERNANCE

## Estrutura oficial do projeto
- /mae → sistema principal (ERP + Portal, projeto Apps Script único)
- /sites → projetos auxiliares (sites estáticos)
- /docs → documentação

## Regras obrigatórias
- Apenas 1 repositório Git (root)
- Proibido submodules
- Proibido .git internos
- Nada deve fugir dessa estrutura

## Pendência resolvida
- /mae estava registrado como gitlink (submodule) no índice do repositório
  raiz, sem .gitmodules — resquício de uma vendorização incompleta anterior.
  Corrigido em 2026-07-04: confirmado que não existia mae/.git (nem diretório
  nem arquivo ponteiro) — não havia histórico a perder. O gitlink foi
  removido do índice (`git rm --cached mae`) e o conteúdo de /mae passou a
  ser versionado normalmente como parte do repositório único, conforme a
  regra "proibido submodules" acima.

## Regra de segurança
- Nunca apagar sem backup
- Mudanças estruturais devem ser justificadas
