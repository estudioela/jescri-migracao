# Relatório — Sprint de Estabilização TEAR V2 (upload de materiais)

Data: 2026-07-20
Escopo: `tear-v2-app/` (Laravel + React) — implementação paralela ao Portal
GAS descrita no `TASK_ROUTER.md` §15. `src/` (Portal legado GAS) e
`TASK_ROUTER.md` não foram tocados, por decisão explícita de escopo.

## Problema investigado

Prioridade 1 do `docs/planning/ROADMAP_MESTRE_TEAR_V2.md`: upload de materiais
"implementado, porém não validado corretamente".

## Causa raiz

Não é um bug de código. `MaterialController::store` → `GoogleDriveService`
está estruturalmente correto (auditado linha a linha) e o frontend
(`MateriaisPage.tsx`, `lib/materiais.ts`) já cobre seleção de arquivo,
`FormData`, chamada ao endpoint, tratamento de erro e atualização da lista.

A causa raiz é **ausência de credenciais**: `GOOGLE_DRIVE_CLIENT_EMAIL` e
`GOOGLE_DRIVE_PRIVATE_KEY` estão vazios em
`tear-v2-app/backend/.env` local. `GOOGLE_DRIVE_ROOT_FOLDER_ID` já está
corretamente preenchido com o ID da pasta raiz do roadmap
(`1O9CYZNguX0zL1w1Tz9f5eM5Co4xO18CW`). Sem as duas primeiras variáveis,
`GoogleDriveService::isConfigured()` retorna `false` e todo upload cai no
fallback de disco local (`Storage::disk('public')`) — que funciona, mas
nunca é o Google Drive real. Consequência prática: **o caminho de código
que fala com o Drive nunca foi exercitado**, nem manualmente nem em teste
(`test_admin_pode_enviar_material_sem_drive_configurado` cobria só o
fallback).

## Decisão registrada

O responsável do projeto decidiu, nesta sessão, **não configurar
credenciais reais do Google Drive** (dependem de acesso externo ao GCP que
o agente não possui) e tratar isso como **débito técnico documentado**
(ver seção "Ativação futura do Drive" abaixo), em vez de bloquear a sprint.

## Correção aplicada

Como não havia bug de código a corrigir, o trabalho desta sprint foi
**fechar a lacuna de validação** sem depender de credenciais reais, usando
`Http::fake()` do Laravel para simular as respostas da API do Google Drive:

- `tear-v2-app/backend/tests/Feature/GoogleDriveServiceTest.php` (novo):
  - `isConfigured()` reflete corretamente as 3 variáveis de ambiente.
  - `ensureFolder` reaproveita uma pasta já existente (sem criar duplicata).
  - `ensureFolder` cria a pasta quando não encontrada.
  - `uploadFile` monta a requisição multipart corretamente e retorna
    `id`/`url` da resposta do Drive.
  - `uploadFile` usa a URL de fallback (`.../file/d/{id}/view`) quando a
    resposta não traz `webViewLink`.
- `tear-v2-app/backend/tests/Feature/MaterialTest.php` (alterado): novo
  teste `test_admin_pode_enviar_material_com_drive_configurado`, cobrindo o
  fluxo completo do `MaterialController::store` com Drive "configurado"
  (chave RSA descartável gerada em runtime, nunca uma credencial real) —
  parceira → campanha → tipo → upload → `Material` gravado com
  `drive_file_id`/`drive_file_url` vindos da resposta simulada da API.

Nenhuma linha de `GoogleDriveService.php` ou `MaterialController.php` foi
alterada — a auditoria linha a linha não encontrou bug real nesse código;
os testes novos comprovam isso mesmo sem credenciais reais.

## Arquivos alterados

- `tear-v2-app/backend/tests/Feature/GoogleDriveServiceTest.php` (novo)
- `tear-v2-app/backend/tests/Feature/MaterialTest.php` (+1 teste, +1 import)

## Testes executados

- `composer test` (PHPUnit, `tear-v2-app/backend`): **84/84 verde**
  (76 pré-existentes + 8 novos: 5 em `GoogleDriveServiceTest`, 1 novo em
  `MaterialTest`, e reexecução dos demais sem regressão).
- `vendor/bin/pint --test`: limpo.
- `npm run build` (`tsc -b && vite build`, `tear-v2-app/frontend`): build ok.
- `npm run lint` (`oxlint`, `tear-v2-app/frontend`): 1 warning pré-existente
  em `src/lib/auth.tsx:72` (`react(only-export-components)`), não
  relacionado a este trabalho — não corrigido (fora do escopo desta
  sprint, que é upload de materiais).
- `git status`: nenhuma alteração além dos dois arquivos de teste listados
  acima; `dist/` do frontend (gerado pelo build) está fora do controle de
  versão.

## Riscos restantes

1. **Drive real nunca testado ponta a ponta.** Os testes novos provam que
   o código do lado TEAR está correto contra o contrato documentado da API
   do Drive, mas não substituem um teste manual com credenciais reais —
   pode haver comportamento de produção não coberto por mock (ex.:
   permissões da pasta raiz, quotas, latência).
2. **Upload restrito a `role:ADMIN`.** Hoje só o admin envia material pela
   participação (não há Portal da Influenciadora nesta stack ainda) — é um
   gap de escopo já conhecido, não um bug; registrado aqui para não ser
   perdido de vista.
3. **Fallback local em produção seria inaceitável.** Se o deploy de
   produção subir sem as 3 variáveis configuradas, os arquivos caem no
   disco local do servidor (não no Drive) sem nenhum erro visível ao
   usuário — vale um alerta operacional antes do primeiro deploy real.

## Ativação futura do Google Drive (passo a passo)

1. No Google Cloud Console, criar (ou reaproveitar) um projeto e habilitar
   a **Google Drive API**.
2. Criar uma **Service Account** nesse projeto; gerar uma chave JSON.
3. Compartilhar a pasta raiz do Drive
   (`https://drive.google.com/drive/u/0/folders/1O9CYZNguX0zL1w1Tz9f5eM5Co4xO18CW`)
   com o e-mail da service account, permissão **Editor**.
4. Preencher em `tear-v2-app/backend/.env`:
   - `GOOGLE_DRIVE_CLIENT_EMAIL` = campo `client_email` do JSON da service
     account.
   - `GOOGLE_DRIVE_PRIVATE_KEY` = campo `private_key` do JSON (mantendo as
     quebras de linha; o código já converte `\n` literal para quebra real).
   - `GOOGLE_DRIVE_ROOT_FOLDER_ID` = já preenchido corretamente
     (`1O9CYZNguX0zL1w1Tz9f5eM5Co4xO18CW`), não precisa mudar.
5. Reiniciar o backend e enviar um material de teste pela UI —
   `GoogleDriveService::isConfigured()` passará a retornar `true`
   automaticamente, sem nenhuma alteração de código.
6. Confirmar visualmente na pasta raiz do Drive a criação da árvore
   Parceira → Campanha → Tipo de conteúdo, e que o arquivo aparece lá.
