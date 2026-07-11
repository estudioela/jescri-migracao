# GUIA OPERACIONAL TEAR

> Documento operacional do Projeto Tear.
>
> Contém detalhes de funcionamento, fluxos operacionais e procedimentos de manutenção.
>
> Não substitui:
>
> - SYSTEM_MAP.md (arquitetura)
> - SYSTEM_TRUTH.md (estado atual)
> - KNOWN_DECISIONS.md (decisões)
> - CHANGELOG_DE_DESENVOLVIMENTO.md (histórico)
> Documentação oficial do ERP e do Portal de Influenciadoras Jescri.
> Este documento deve ser atualizado sempre que houver alterações estruturais, novos links, novas credenciais, mudanças de funcionamento ou novas funcionalidades no sistema. Nada aqui é inventado — tudo reflete o código-fonte e as configurações reais em vigor na data da última atualização (ver seção 9).

---

## 1. Visão Geral

**O que é o ERP:** uma planilha Google Sheets ("[JESCRI] INFLUÊNCIA 360º") com Apps Script embutido (*container-bound script*), usada pela equipe do Estúdio Elã para gerenciar o ciclo mensal de campanhas com influenciadoras: cadastro, planejamento do mês, briefing de conteúdo, logística de envio de produtos, controle de ativações/conteúdos e pagamentos. A equipe interage com o ERP diretamente na planilha, através de um menu customizado (" ERP ELÃ 6.2") e de gatilhos automáticos (`onEdit`, `onFormSubmit`).

**O que é o Portal:** um Web App (HtmlService) publicado a partir do **mesmo** projeto Apps Script, servido como aplicativo de página única (SPA) para as influenciadoras. Nele, cada influenciadora faz login com cupom + senha, vê suas pendências de conteúdo do mês, lê o briefing, envia o material de entrega, acompanha pagamentos, histórico e edita seu próprio perfil.

**Como eles se comunicam:** não há duas aplicações separadas nem API REST — é **um único projeto Apps Script**, vinculado a uma única planilha. `Código.js` contém a lógica do ERP; `WebApp.js` contém a lógica do Portal; `Index.html` é a interface do Portal. Como estão no mesmo projeto, funções e constantes são compartilhadas livremente entre os arquivos (ex.: `SETUP`, `getHeaderMap()`, `isInfluenciadoraOn()`, as chaves de cache `CHAVE_CACHE_*` e as funções `invalidarCacheAba()`/`invalidarCachePorAba()` são definidas em um arquivo e usadas no outro sem nenhuma importação). A planilha é a única fonte de dados para os dois lados — o Portal só lê/escreve nas mesmas abas que o ERP usa, através de `SpreadsheetApp.getActiveSpreadsheet()`.

---

## 2. Links importantes

| Recurso | Link / ID |
|---|---|
| Projeto Apps Script | https://script.google.com/home/projects/1fE8w10O3MwHvfa4gLgJvcUXD4HIWKNL0ar5YMmjzMamujRfwqiPfcLyK/edit |
| Script ID | `1fE8w10O3MwHvfa4gLgJvcUXD4HIWKNL0ar5YMmjzMamujRfwqiPfcLyK` |
| Portal (Web App em produção) | https://script.google.com/macros/s/AKfycbyBqxe6HpQEEQ0Wk5z27TpIDrpHl64EilmY7ZuMbBCJinnU-LGO4H8nJauf7Cz6UTTcuA/exec |
| Deployment ID de produção | `AKfycbyBqxe6HpQEEQ0Wk5z27TpIDrpHl64EilmY7ZuMbBCJinnU-LGO4H8nJauf7Cz6UTTcuA` (versão ativa: **11**, ver seção 9) |
| Pasta raiz de entregas (Drive) | https://drive.google.com/drive/folders/1X7BSY9R7dUUNYXgYnmnCIACVMFcqBUPH (ID fixo no código, constante `PASTA_MAE_ID`; pode ser sobrescrito sem alterar código — ver seção 8) |
| Formulário externo de cadastro | https://estudioela.com/cliente/jescri-cadastro/ (aberto pelo menu "Abrir Formulário de Cadastro") |

**Não disponível no código (confirmar manualmente e atualizar aqui):**
- **Planilha principal (Google Sheets):** o script é *vinculado diretamente* à planilha (`SpreadsheetApp.getActiveSpreadsheet()`), então o ID/URL da própria planilha não aparece em nenhum lugar do código-fonte. Preencher aqui o link da planilha assim que confirmado.

**Atenção — deployment extra existente, não documentado até agora:** além do deployment de produção acima, existe um segundo deployment ativo no projeto, `AKfycbz64jILT22S1Ti-KFyDaVscZrMv7-KBqoXnWuRgnVAq @HEAD`. Deployments `@HEAD` atualizam automaticamente a cada `clasp push`, sem controle de versão — **não é o link oficial usado pelas influenciadoras** (que é o `AKfycbyBqxe6...` acima), mas existe e alguém pode estar com esse link salvo. Vale investigar se ainda é necessário ou se pode ser removido.

---

## 3. Credenciais

**Login do Portal (cada influenciadora):**
- **Usuário:** o CUPOM cadastrado na coluna `CUPOM` da aba `BASE DE DADOS`.
- **Senha:** os **5 primeiros dígitos numéricos do CNPJ** cadastrado na coluna `INFLUENCIADORA_CNPJ` da mesma linha (não é uma senha separada armazenada — é sempre derivada do CNPJ na hora do login).
- Só autentica quem estiver com status **ON** na coluna A da `BASE DE DADOS` (checkbox `true`, texto `"ON"` ou texto `"TRUE"` — ver `isInfluenciadoraOn()`). Influenciadora OFF nunca loga, mesmo com cupom/senha corretos.
- **Não existe fluxo de recuperação/redefinição de senha.** Para "resetar o acesso" de alguém, o único caminho é conferir/corrigir o CNPJ e/ou o CUPOM diretamente na `BASE DE DADOS`.
- **Sessão:** ao logar com sucesso, é gerado um token (UUID) guardado no `CacheService` por 6 horas (21600s), renovado a cada chamada válida ao Portal (renovação deslizante). Não existe um comando administrativo para invalidar todas as sessões de uma vez — elas expiram sozinhas.
- **Rate limit / bloqueio progressivo por cupom** (não por IP): até 5 tentativas erradas em uma janela de 5 minutos; ao atingir o limite, o cupom fica bloqueado por um cooldown que começa em 1 minuto e dobra a cada novo ciclo de 5 erros (2min, 4min, 8min...) até um teto de 1 hora. O número de ciclos já ocorridos fica "lembrado" por 6 horas, mesmo que o cooldown individual já tenha passado.

**Acesso ao ERP (equipe interna):** não usa cupom/senha — é controlado pelo **compartilhamento normal do Google Sheets** (quem é editor da planilha, acessa o menu e as abas). Não há um login separado para a equipe.

**Execução do Web App:** o `appsscript.json` define `"executeAs": "USER_DEPLOYING"` e `"access": "ANYONE_ANONYMOUS"`. Isso significa: (a) qualquer pessoa com o link consegue abrir a tela de login, sem precisar de conta Google; (b) todo o backend (leitura/escrita na planilha, criação de pastas no Drive) roda com a identidade Google de **quem publicou o deployment** — não com a identidade de quem está visitando o Portal.

---

## 4. Estrutura da planilha

### BASE DE DADOS
Cadastro mestre de todas as influenciadoras. Colunas usadas pelo código: status ON/OFF (coluna A, sem cabeçalho fixo — sempre lida como `r[0]`), `INFLU_KEY`, `CUPOM`, `INFLUENCIADORA_CNPJ`, `INFLUENCIADORA_RAZAO_SOCIAL`, `CHAVE_PIX`, `EMAIL`, `CEP`, `NUMERO`, `COMPLEMENTO`, `RUA`, `BAIRRO`, `CIDADE`, `UF`, `INFLUENCIADORA_ENDERECO`, `VALOR_TOTAL`, `PASTA_DRIVE_LINK`, `REELS_TEXTO`, `CARROSSEL_TEXTO`, `STORIES_TEXTO`, `INFLU_SHEET_URL`.
- **Quem altera:** a equipe (cadastro manual ou via `onFormSubmit`, que recebe o formulário externo de cadastro) e a própria influenciadora, parcialmente, pelo Portal (`updatePerfil`: só chave PIX, e-mail, CEP/número/complemento).
- **Como é usada:** é a única fonte de verdade para "quem está ativo" — todo processo de geração de mês filtra só quem está ON aqui. Nunca é limpa/arquivada.

### FLUXO LOGÍSTICO
Controla o envio físico de produtos (endereço, rastreio, status de entrega) por mês.
- **Quando é preenchida:** uma linha por influenciadora ON a cada "Gerar Novo Mês", com a referência do mês na coluna `MES_REFERENCIA`.
- **Histórico:** nunca é limpa na geração de um novo mês (sempre acrescenta linhas no final) — o único jeito de uma linha sair dessa aba é o status de logística virar "entregue"/"entrega realizada"/"objeto entregue", que a arquiva automaticamente em `HISTÓRICO LOGÍSTICO`.

### ATIVAÇÕES
Fila de conteúdos que cada influenciadora precisa produzir e postar no mês (um item por Reel/Carrossel/Stories esperado).
- **O que representa:** cada linha é uma peça de conteúdo (`FORMATO`) de uma influenciadora num mês, com datas de aprovação/ativação e status (`STATUS_CONTEUDO`).
- **Arquivamento:** quando `STATUS_CONTEUDO` recebe "postado", a linha é automaticamente movida para `HISTÓRICO DE CONTEÚDOS` (via gatilho `onEdit`) e some da lista ativa.
- **Link da pasta (coluna G, `LINK_ARQUIVO`):** guarda o link da **pasta do Drive** daquela ativação específica (Influenciadora > Mês > Formato), não links de arquivos individuais. É gravado automaticamente quando a influenciadora termina de enviar material pelo Portal (`finalizarEnvioResumable`) — mesmo que ela envie vários arquivos, o valor é sempre o link da pasta, nunca acumula.

### BRIEFING
Conteúdo criativo do mês (o que produzir, referências de looks, aprovações).
- **Como funciona:** uma linha por influenciadora por mês, com o texto de briefing por formato (`SOBRE_REEL`, `SOBRE_CARROSSEL`, `SOBRE_STORIES_1/2`), looks sugeridos (`LOOK_*`) e datas de aprovação espelhadas automaticamente a partir das datas preenchidas em `ATIVAÇÕES` (gatilho `onEdit`, não alterar essa lógica).
- **Como é criado um novo mês:** ao rodar "Gerar Novo Mês", a aba `BRIEFING` atual é **renomeada** para `BRIEFING_AAAA_MM` (ex.: `BRIEFING_2026_07`) e arquivada — nunca é apagada, fica preservada para sempre como aba própria. Uma nova aba, chamada de novo `BRIEFING`, é criada como cópia exata da anterior (fórmulas, validações, formatação condicional, negrito/itálico/cor/alinhamento, largura de coluna, altura de linha, mesclagens e proteções de intervalo/aba são todos preservados). Só os **dados operacionais** das linhas (2 em diante) são limpos — e mesmo assim, qualquer coluna que já tenha fórmula na linha 2 é automaticamente preservada, nunca apagada.
- **Proteção contra duplicidade:** se o mês digitado já tiver registros em `FLUXO LOGÍSTICO`, o sistema avisa antes de gerar de novo (evita duplicar Fluxo/Ativações/Pagamentos por engano).
- **RESUMO_MES:** ver seção 6.

### PAGAMENTOS
Controle financeiro do mês por influenciadora.
- **Como funciona:** uma linha por influenciadora ON a cada "Gerar Novo Mês" (ou lançamento avulso via menu), com valor, chave PIX e status (`STATUS_PAGAMENTO`).
- **Arquivamento:** quando `STATUS_PAGAMENTO` recebe "pago", a linha é automaticamente movida para `HISTÓRICO DE PAGAMENTOS` (via `onEdit`) e some da lista ativa. Histórico nunca é apagado.

---

## 5. Como gerar um novo mês

1. Conferir quem está **ON** na `BASE DE DADOS` (só essas entram na geração).
2. No menu " ERP ELÃ 6.2" → "Planejamento & Campanhas" → **"1. Iniciar Novo Mês"**, digitar o nome do mês (ex.: `AGOSTO`).
3. Se já existir esse mês em `FLUXO LOGÍSTICO`, o sistema vai avisar antes de continuar — confirme só se for intencional.
4. Conferir a nova aba **BRIEFING** (deve estar vazia nas linhas de dados, com a mesma formatação de antes) e a aba antiga arquivada como `BRIEFING_AAAA_MM`.
5. Conferir **FLUXO LOGÍSTICO** (novas linhas do mês, endereços preenchidos a partir da BASE).
6. Conferir **ATIVAÇÕES** (quantidade de Reels/Carrossel/Stories gerada por influenciadora, conforme `REELS_TEXTO`/`CARROSSEL_TEXTO`/`STORIES_TEXTO` da BASE).
7. Conferir **PAGAMENTOS** (valor e PIX de cada influenciadora ON).
8. Abrir o **Portal** e validar (login de teste, pendências do mês aparecendo corretamente).

---

## 6. Como alterar o banner do Portal

- **Onde fica:** coluna `RESUMO_MES` (coluna D, conforme informado) da aba `BRIEFING` **atual** (a aba viva chamada exatamente `BRIEFING` — não as abas arquivadas `BRIEFING_AAAA_MM`).
- **Como alterar o texto:** editar a célula `RESUMO_MES` de qualquer linha do mês vigente. Como normalmente todas as linhas de um mesmo mês compartilham o mesmo resumo, edite a mesma frase em todas as linhas daquele mês para consistência.
- **Como alterar o link:** a célula pode ser só texto (banner aparece, mas não é clicável) ou conter um link (inserido via "Inserir > Link" ou fórmula `=HYPERLINK("url"; "texto")`) — nesse caso o banner fica clicável e abre o link em nova aba.
- **Como aparece no Portal:** um banner fixo aparece no topo de todas as telas (exceto login), mostrando o texto e, se houver link, abrindo-o ao ser tocado. Ele se atualiza sozinho sempre que a influenciadora troca o mês em qualquer um dos seletores de mês (Pendências, Pagamentos ou Histórico). A leitura usa cache de 60s por mês, mas uma edição direta na célula `RESUMO_MES` já invalida esse cache na hora — não precisa esperar o TTL expirar.

---

## 7. Fluxos automáticos

- **Login:** cupom + senha (5 dígitos do CNPJ) + checagem de status ON + rate limit progressivo (ver seção 3).
- **Cache:** `CacheService` do Apps Script, com invalidação explícita a cada escrita relevante (não depende só do TTL expirar):
  - `BASE DE DADOS`: 90s.
  - `ATIVAÇÕES`, `BRIEFING`, `PAGAMENTOS`, `HISTÓRICO DE CONTEÚDOS`, `HISTÓRICO DE PAGAMENTOS`: 60s cada, chave própria por aba.
  - Banner `RESUMO_MES`: 60s, chave própria por mês.
  - `LockService` (trava de escrita) só é usado nas escritas (perfil, criação de pasta, finalização de upload) e no *cache miss* das leituras — nunca em leitura pura com cache válido.
- **Upload de arquivos:** protocolo *resumable* do Google Drive, em pedaços de 8MB — `iniciarEnvioResumable` (abre a sessão de upload na pasta certa) → `enviarPedacoResumable` (envia cada pedaço) → `finalizarEnvioResumable` (grava o link da pasta na coluna G e muda o status do conteúdo para "em revisão", que o Portal mostra como "Em aprovação").
- **Criação automática de pastas:** `obterOuCriarPastaDestino` monta/reaproveita a estrutura `Pasta raiz > Influenciadora > Mês > Formato` no Drive, criando só o que ainda não existe (idempotente).
- **Arquivamento de conteúdos:** status "postado" em `ATIVAÇÕES` → move automaticamente para `HISTÓRICO DE CONTEÚDOS`.
- **Arquivamento de pagamentos:** status "pago" em `PAGAMENTOS` → move automaticamente para `HISTÓRICO DE PAGAMENTOS`.
- **Sincronizações manuais (menu):** "Puxar Looks da Planilha Externa para Briefing" (`sincronizarLooks`, lê planilhas individuais das influenciadoras) e "Atualizar Rastreios Automáticos (BRComerce)" (`atualizarRastreiosBRComerce`, consulta a API da BRComerce e arquiva `FLUXO LOGÍSTICO` como entregue quando aplicável).

---

## 8. Manutenção

Fluxo obrigatório para qualquer alteração de código, nessa ordem:

1. Editar o código localmente (pasta clonada via `clasp clone`).
2. Validar sintaxe: `node --check Código.js && node --check WebApp.js`.
3. Conferir que não há função duplicada nem código órfão.
4. `clasp push` (isso já atualiza imediatamente os gatilhos/menu do ERP, que sempre rodam a versão mais recente enviada — **não** esperam um deploy).
5. `clasp version "descrição da mudança"` — nunca promover direto sem criar uma versão nomeada.
6. `clasp deploy -i AKfycbyBqxe6HpQEEQ0Wk5z27TpIDrpHl64EilmY7ZuMbBCJinnU-LGO4H8nJauf7Cz6UTTcuA -V <número>` — só depois de confirmação explícita de quem está acompanhando, já que isso afeta o link real usado pelas influenciadoras.
7. **Atualizar este documento** sempre que a mudança envolver: novo link, nova credencial/regra de acesso, nova aba/coluna estrutural, mudança de comportamento de algum fluxo já documentado aqui, ou nova funcionalidade.

Outras notas de manutenção:
- Nomes de coluna são normalizados pelo código (maiúsculas, sem acento, espaço vira `_`) via `getHeaderMap()` — ao criar uma coluna nova, o nome do cabeçalho na planilha pode ter acento/espaço normalmente, o código vai encontrá-la do mesmo jeito.
- A pasta raiz de entregas pode ser trocada sem alterar código: criar uma Propriedade do Script chamada `PASTA_RAIZ_ENTREGAS` (Apps Script → Configurações do projeto → Propriedades do script) com o ID da nova pasta — ela tem prioridade sobre o ID fixo no código.

---

## 9. Histórico de versões

| Versão | Data | Resumo |
|---|---|---|
| 1 | não registrada | ERP 1.0 |
| 2 | não registrada | ERP INFLU 1 |
| 3 | não registrada | Unificação: Portal + ERP na planilha mãe (V7.0) |
| 4 | não registrada | v.1.1 [JESCRI] INFLUÊNCIA 360º |
| 5 | não registrada | Promoção HEAD → PROD |
| 6 | não registrada | Rate limit de login + cache de leitura da BASE |
| 7 | não registrada | Atualização do rate limit de login + cache de leitura da BASE |
| 8 | 2026-07-03 | Consolidação: cache com invalidação e `LockService` cirúrgico em ATIVAÇÕES/BRIEFING/PAGAMENTOS/HISTÓRICO; remoção de lock das leituras puras |
| 9 | 2026-07-03 | Fix: `normalizarStatusAtivacao` (status "aprovado" nunca aparecia, mascarado por "aprova"); criação de `isInfluenciadoraOn()` como fonte única da checagem ON/OFF |
| 10 | 2026-07-04 | Novo fluxo "Gerar Novo Mês": BRIEFING arquivada por mês (`BRIEFING_AAAA_MM`) com layout/fórmulas/formatação preservados via `copyTo()`; coluna G de ATIVAÇÕES passa a gravar o link da pasta (não mais links de arquivo); banner "Resumo do Mês" no Portal |
| 11 | 2026-07-04 | Proteção contra geração duplicada do mesmo mês; cópia das proteções de intervalo/aba da BRIEFING (não replicadas nativamente por `copyTo()`); cache dedicado do banner Resumo do Mês com invalidação; limpeza da BRIEFING passa a preservar qualquer coluna com fórmula |

**Não apagar linhas desta tabela em atualizações futuras — sempre acrescentar uma nova linha no final.**
