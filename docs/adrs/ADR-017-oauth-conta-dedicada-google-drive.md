# ADR-017 — Autenticação do Google Drive via OAuth de conta dedicada (sem Service Account Key)

- **Status:** Aceito
- **Data:** 2026-07-22
- **Autores:** responsável do projeto (decisão) + Arquitetura TEAR (análise e aplicação)
- **Resolve:** bloqueio confirmado durante a Etapa 5 do Go-Live
  (`PLANO_DE_IMPLANTACAO.md`) — a organização `elafashionmkt-org` tem a
  Org Policy `constraints/iam.disableServiceAccountKeyCreation` habilitada,
  impedindo a geração da chave JSON (`client_email` + `private_key`) que
  `GoogleDriveService` exige hoje.
- **Relaciona-se com:** `docs/deployment/PLANO_DE_IMPLANTACAO.md` Etapa 5,
  `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` P0-9,
  `docs/deployment/IMPLEMENTACAO_TECNICA.md` §4, `TASK_ROUTER.md` §32.
- **Escopo:** só o mecanismo de obtenção de access token dentro de
  `App\Services\GoogleDriveService`
  (`backend/app/Services/GoogleDriveService.php`) e as
  variáveis de ambiente `GOOGLE_DRIVE_*` correspondentes. **Não altera**
  `ensureFolder()`, `uploadFile()`, o Shared Drive institucional, nenhuma
  rota, controller, policy ou regra de negócio.

---

## 1. Contexto

`GoogleDriveService::accessToken()` implementa manualmente o fluxo OAuth
"JWT Bearer Token for Service Accounts" (RFC 7523): monta um JWT assinado
com `openssl_sign()` usando a `private_key` de uma Service Account, e
troca esse JWT por um access token no endpoint padrão do Google
(`oauth2.googleapis.com/token`). Esse fluxo **exige** que a chave privada
da Service Account exista em texto, obtida via download de um arquivo
JSON no Google Cloud Console.

Ao tentar executar a Etapa 5 do plano de implantação, o responsável do
projeto encontrou a Org Policy `constraints/iam.disableServiceAccountKeyCreation`
habilitada em `elafashionmkt-org`, que bloqueia exatamente essa geração de
chave. Foram avaliadas alternativas que evitam alterar essa política:

- **Workload Identity Federation** — rejeitada: exige que a carga de
  trabalho apresente um token OIDC de um provedor de identidade externo
  reconhecido pelo Google. O backend do TEAR roda em hospedagem
  convencional (Locaweb), sem nenhum IdP compatível disponível.
- **Impersonation via Service Account Credentials API**
  (`generateAccessToken`) — rejeitada pelo mesmo motivo: quem chama a API
  precisaria de uma identidade GCP já autenticada (ADC), inexistente fora
  do Google Cloud.
- **Override da Org Policy no escopo do projeto** (permitir a criação da
  chave só para o projeto do TEAR, reversível depois) — tecnicamente
  viável, mas **rejeitada por decisão explícita do responsável do
  projeto**, que priorizou manter a política de segurança da organização
  intacta em vez de abrir uma exceção, mesmo temporária.

## 2. Decisão

Substituir a autenticação por Service Account Key por **OAuth 2.0 com uma
conta de usuário dedicada do Google Workspace** (ex.: uma caixa de e-mail
criada só para essa finalidade, nunca usada para login humano), usando o
fluxo padrão de `refresh_token` — mecanismo que não envolve Service
Account e portanto não é afetado por
`iam.disableServiceAccountKeyCreation`.

Mudança de código, mínima e contida a um único método:

- `GoogleDriveService::accessToken()` passa a trocar um `refresh_token`
  de longa duração por um access token via
  `grant_type=refresh_token` no mesmo endpoint (`oauth2.googleapis.com/token`),
  em vez de montar e assinar um JWT.
- `GoogleDriveService::isConfigured()` passa a verificar
  `client_id`/`client_secret`/`refresh_token`/`root_folder_id`, no lugar
  de `client_email`/`private_key`/`root_folder_id`.
- Novas variáveis de ambiente: `GOOGLE_DRIVE_CLIENT_ID`,
  `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`, substituindo
  `GOOGLE_DRIVE_CLIENT_EMAIL`/`GOOGLE_DRIVE_PRIVATE_KEY`.
- O acesso ao Shared Drive institucional é concedido para a conta de
  usuário dedicada (papel Content Manager), exatamente como seria
  concedido ao e-mail de uma Service Account — o Shared Drive em si não
  muda.
- Obtenção do `refresh_token` via **OAuth 2.0 Device Authorization Grant**
  (RFC 8628 — "TVs and Limited Input devices" no Cloud Console): não exige
  URI de redirecionamento nem servidor web local, adequado para um
  processo de configuração único rodado por linha de comando contra um
  host de hospedagem convencional.

### O que **não** muda

- `ensureFolder()` e `uploadFile()` — inalterados; ambos só consomem
  `accessToken()`, sem saber como o token foi obtido.
- O Shared Drive `TEAR — Materiais de Campanha` e sua subpasta `Backup`.
- `BackupDatabaseToDrive`, `MaterialController`, `PagamentoController` —
  inalterados; todos dependem só da interface pública de
  `GoogleDriveService`.

## 3. Alternativas consideradas

### A) Override da Org Policy no escopo do projeto
Tecnicamente mais simples (zero mudança de código), reversível (a
constraint só bloqueia criação de novas chaves, não invalida uma já
emitida). **Rejeitada** por decisão do responsável do projeto: mesmo
temporário e reversível, representa enfraquecer uma política de segurança
da organização, e existe alternativa que não exige isso.

### B) Workload Identity Federation / Service Account Impersonation
**Rejeitadas** — ambas pressupõem uma identidade de carga de trabalho já
reconhecida pelo Google (rodando em GCP, ou com um IdP externo
configurado). Não há equivalente disponível na hospedagem Locaweb.

### C) OAuth de conta dedicada via `refresh_token` (adotada)
Não usa Service Account, portanto não esbarra na Org Policy. Mudança de
código pequena e isolada a um método. Trade-off aceito: a credencial fica
amarrada ao ciclo de vida de uma conta de usuário do Workspace (precisa
existir, não pode ter a senha trocada sem reobter o token, não pode ser
suspensa) — mitigado tratando essa conta como uma identidade de serviço
interna (sem uso humano, documentada nesta ADR e no runbook de Go-Live).

## 4. Consequências

### Positivas
- Resolve o bloqueio confirmado sem abrir exceção alguma na Org Policy da
  organização — a política permanece habilitada em toda
  `elafashionmkt-org`, sem qualquer enfraquecimento, nem temporário.
- Mudança de código mínima: um método reescrito, mesma interface pública.
- Elimina de vez a dependência de uma chave privada RSA em texto no
  `.env` de produção (o `refresh_token` é revogável a qualquer momento
  pelo painel do Google, sem exigir rotação de chave criptográfica).

### Negativas / Trade-offs
- A credencial passa a depender do ciclo de vida de uma conta de usuário
  do Workspace, não de uma identidade de serviço nativa. Se a conta for
  suspensa, tiver a senha alterada, ou ficar 6 meses sem uso, o
  `refresh_token` deixa de funcionar e precisa ser reobtido (novo
  Device Authorization Grant, procedimento de poucos minutos).
- Quem tiver acesso ao `refresh_token` em texto no `.env` de produção tem
  acesso equivalente ao de um login completo dessa conta dedicada para a
  API do Drive — mesma superfície de risco que já existia com a
  `private_key` de Service Account, só que amarrada a uma conta de
  usuário em vez de uma identidade não-humana.

### Riscos residuais / dívidas conscientes
- Documentar claramente (runbook de Go-Live) que a conta dedicada
  (`GOOGLE_DRIVE_CLIENT_ID`/e-mail associado) nunca deve ser usada para
  login humano nem ter 2FA dependente de um dispositivo pessoal — deve ser
  tratada como uma credencial de sistema.

## 5. Aplicação

1. `backend/app/Services/GoogleDriveService.php` —
   `accessToken()` reescrito para `grant_type=refresh_token`;
   `isConfigured()` ajustado.
2. `backend/config/services.php` — chaves `client_id`/
   `client_secret`/`refresh_token` no lugar de `client_email`/
   `private_key`.
3. `backend/.env.example`,
   `backend/.env.production.example`,
   `backend/.env` — variáveis `GOOGLE_DRIVE_*` atualizadas.
4. `backend/tests/Feature/GoogleDriveServiceTest.php` —
   fixture de credenciais fake ajustada para o novo formato; nenhum teste
   de comportamento de `ensureFolder`/`uploadFile` precisou mudar.
5. Novo comando `php artisan google-drive:obter-refresh-token` — só
   ferramenta de configuração local/operacional (Device Authorization
   Grant), não integra o fluxo de produção da aplicação.
6. `docs/deployment/PLANO_DE_IMPLANTACAO.md` Etapa 5 — reescrita para o
   novo procedimento (OAuth Client + Device Flow, sem Service Account).
7. `docs/deployment/IMPLEMENTACAO_TECNICA.md` §4 — variáveis atualizadas.
8. `docs/_workspace/TASK_ROUTER.md` §33 — registro desta decisão.

**Critério de conclusão:** suíte de testes do backend verde (Pest/PHPUnit)
com o novo fixture; Pint limpo; teste real de upload em homologação com
credenciais reais da conta dedicada (fora do escopo desta ADR — é
execução da Etapa 5/16 de `PLANO_DE_IMPLANTACAO.md`).

---

**Referências**
- `docs/deployment/PLANO_DE_IMPLANTACAO.md` Etapa 5, Etapa 16
- `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` P0-9
- `docs/deployment/IMPLEMENTACAO_TECNICA.md` §4
- `docs/_workspace/TASK_ROUTER.md` §32, §33
- RFC 8628 — OAuth 2.0 Device Authorization Grant

---

## 6. Adendo (2026-07-22) — Device Authorization Grant substituído por Authorization Code + loopback

Ao executar `google-drive:obter-refresh-token` pela primeira vez com
credenciais reais, o Google recusou a requisição do Device Authorization
Grant para o escopo `https://www.googleapis.com/auth/drive`:

```
"error": "invalid_scope",
"error_description": "Invalid device flow scope: https://www.googleapis.com/auth/drive"
```

Confirmado na documentação oficial
(`developers.google.com/identity/protocols/oauth2/limited-input-device`,
seção "Allowed scopes"): o Device Authorization Grant só é suportado para
uma lista fechada de escopos — `email`, `openid`, `profile`,
`drive.appdata`, `drive.file`, `youtube`, `youtube.readonly`. O escopo
`drive` completo **não está nessa lista**; é uma restrição do Google,
independente de qualquer configuração do client OAuth.

`drive.file` foi descartado como alternativa: esse escopo só concede
acesso a arquivos **criados pelo próprio app** sob esta autorização (ou
abertos via Google Picker). A estrutura de pastas
(ROOT/Materiais/Backup/Temporarios/Contratos/Exportacoes) e o arquivo de
teste (`Temporarios/teste-upload.txt`) já existem, criados manualmente —
adotar `drive.file` exigiria recriar toda a estrutura via API sob a nova
autorização, descartando o que já existe e antecipando, sem necessidade,
a decisão de produto ainda pendente sobre estrutura fixa vs. dinâmica de
pastas (`ESTADO_SESSAO.md` §4).

**Decisão do adendo:** manter o escopo `drive` completo e trocar apenas o
*mecanismo de obtenção do `refresh_token`* — não o runtime de produção —
para **Authorization Code + redirect loopback local** (RFC 8252), fluxo
padrão para aplicações instaladas/desktop, sem essa restrição de escopo.

- Exige um OAuth Client tipo **Desktop app** no Cloud Console — o client
  "TVs and Limited Input devices" existente não suporta `redirect_uri`
  (confirmado em `developers.google.com/identity/protocols/oauth2/native-app`,
  que reserva o loopback redirect a clients Desktop app e direciona
  TV/entrada-limitada exclusivamente ao Device Flow). O client antigo é
  preservado (não usado neste fluxo, sem necessidade de exclusão).
- `google-drive:obter-refresh-token` reescrito: abre um servidor HTTP
  loopback temporário em `127.0.0.1:<porta livre>`, gera a URL de
  autorização (`response_type=code`, `access_type=offline`,
  `prompt=consent`), aguarda o redirect do navegador, troca o `code` por
  tokens em `oauth2.googleapis.com/token` com
  `grant_type=authorization_code`. Continua sendo execução manual única,
  fora do fluxo de produção.
- `GoogleDriveService::accessToken()` **não muda**: já consome só
  `client_id`/`client_secret`/`refresh_token` via
  `grant_type=refresh_token`, independente de como o `refresh_token` foi
  obtido.
- `GOOGLE_DRIVE_CLIENT_ID`/`_CLIENT_SECRET` no `.env` passam a ser os do
  novo client Desktop app (o valor de `_REFRESH_TOKEN` também muda,
  emitido sob a nova autorização).

### O que não muda (reafirmado)
Tudo listado na §"O que não muda" original permanece válido — a única
mudança é o mecanismo de obtenção do `refresh_token`, não o que ele
autoriza nem como é consumido em produção.
