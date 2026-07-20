# TEAR V2 — ROADMAP DE EXECUÇÃO + SPRINT DE ESTABILIZAÇÃO

Documento único, resultado da junção entre o roadmap de execução (visão futura) e as diretrizes do sprint de estabilização (estado atual e pendências imediatas). Serve como fonte de verdade combinada para o TEAR V2.

---

# PARTE 1 — SPRINT DE ESTABILIZAÇÃO + PREPARAÇÃO DE EVOLUÇÃO

Você está assumindo o TEAR V2 após a conclusão do MVP funcional.

**IMPORTANTE:**
Este projeto NÃO está começando do zero. Existe um sistema construído.

Sua função nesta sessão é:
- auditar;
- corrigir problemas reais;
- estabilizar;
- preparar a próxima fase.

Não criar novos módulos.
Não reescrever arquitetura.
Não trocar tecnologias.

## Documentos de Referência

Você receberá:
1. `ROADMAP_EXECUCAO_TEAR_V2.md` — representa a visão futura de evolução (Parte 2 deste documento).
2. `FASE_REFINAMENTO_QA.md` — representa o estado atual e as pendências imediatas.

Use ambos como fonte de verdade.

## Contexto Atual

O TEAR V2 possui:
- ✅ Cadastro público de influenciadoras
- ✅ Gestão de parceiras
- ✅ Aprovação administrativa
- ✅ Marcas
- ✅ Campanhas
- ✅ Participações
- ✅ Briefings
- ✅ Materiais/upload
- ✅ Aprovação de conteúdo
- ✅ Pagamentos
- ✅ Menu frontend completo

**Fluxo atual:**

```
Influenciadora
    ↓
Cadastro
    ↓
Aprovação
    ↓
Campanha
    ↓
Participação
    ↓
Briefing
    ↓
Material
    ↓
Aprovação
    ↓
Pagamento
```

## Regra Principal

Antes de qualquer alteração: faça uma auditoria curta. Não faça análise longa.

Retorne:
1. Estado do Git.
2. Estrutura frontend.
3. Estrutura backend.
4. Rotas principais.
5. Fluxos quebrados.
6. Prioridades de correção.

## Prioridade 1 — Corrigir Upload de Materiais

Esse é o único bug conhecido prioritário.

**Investigar o fluxo completo:**

Frontend:
- componente upload;
- seleção de arquivo;
- FormData;
- endpoint chamado;
- tratamento de erro;
- atualização da interface.

Backend:
- rota;
- controller;
- validação;
- autenticação;
- persistência.

Google Drive — Pasta raiz:
`https://drive.google.com/drive/u/0/folders/1O9CYZNguX0zL1w1Tz9f5eM5Co4xO18CW`

Validar:
- credenciais;
- permissões;
- criação de pastas;
- upload;
- retorno da URL;
- armazenamento no banco.

**Fluxo esperado:**

```
Participação
    ↓
Upload arquivo
    ↓
Criar/encontrar pasta influenciadora
    ↓
Criar pasta campanha/mês
    ↓
Criar subpasta tipo conteúdo
    ↓
Salvar Material
    ↓
Exibir na aplicação
```

## Prioridade 2 — QA Visual do MVP

Validar no navegador:
1. Login ADMIN
2. Parceiras
3. Marcas
4. Campanhas
5. Briefings
6. Materiais
7. Aprovação
8. Pagamentos

Não considerar apenas testes backend. Validar experiência real.

## Prioridade 3 — Qualidade

Após correções, executar:
- testes;
- build;
- lint;
- análise de erros;
- git diff.

Garantir que:
- nada existente quebre;
- rotas continuem funcionando;
- banco permaneça consistente.

## Não Fazer Nesta Sessão

Não criar:
- Portal Influenciadora;
- Portal Marca;
- novas entidades;
- contratos;
- migração legado;
- IA;
- automações novas.

Esses itens pertencem ao roadmap futuro (Parte 2 deste documento).

## Saída Obrigatória

Ao finalizar, gerar:

**1. `RELATORIO_SPRINT_ESTABILIZACAO_TEAR_V2.md`**
Contendo:
- problemas encontrados;
- causa raiz;
- alterações realizadas;
- arquivos modificados;
- testes executados;
- riscos restantes.

**2. `STATUS_PRONTO_PARA_ROADMAP.md`**
Contendo:
- estado atual do MVP;
- o que está estável;
- o que ainda falta;
- quais itens do roadmap (Parte 2) podem começar.

## Critério de Sucesso

Ao final, TEAR V2 deve estar:

```
Cadastro
    ↓
Campanha
    ↓
Briefing
    ↓
Material funcionando
    ↓
Aprovação
    ↓
Pagamento
```

com fluxo validado.

Somente depois disso, iniciar a evolução prevista na Parte 2 deste documento.

---

# PARTE 2 — ROADMAP DE EXECUÇÃO (VISÃO FUTURA)

Documento de planejamento executivo para a próxima fase do TEAR V2.
Público-alvo: Product Manager, Tech Lead, Arquiteto de Produto e time de desenvolvimento.
Formato: plano de execução realista, não conceitual.

## 1. Visão Geral

### Onde estamos hoje

O TEAR V2 possui um **MVP funcional** com:
- Frontend em React.
- Backend em Laravel.
- Banco de dados relacional.
- APIs internas.
- Integrações externas iniciais.

O sistema legado (Google Sheets + Apps Script + Drive) segue operando em paralelo e ainda concentra parte do histórico e do conhecimento operacional do time.

### Objetivo da próxima fase

Transformar o MVP em uma **plataforma estruturada de operação de influenciadoras**, migrando de forma controlada os processos hoje executados no Google Sheets, sem replicar o legado — reinterpretando-o como fluxos de negócio.

### Resultado esperado

- Cadastro confiável de influenciadoras (dados, endereço, medidas, consentimento).
- Portal da Influenciadora funcional com autenticação e campanhas.
- Operação de produtos, variantes e permutas rastreável.
- Contratos gerados e assinados digitalmente dentro da plataforma.
- Histórico do legado migrado e auditável.
- Base técnica pronta para automações inteligentes (extração de URLs, IA operacional).

## 2. Princípios de Execução

Regras inegociáveis para o time durante toda a execução do roadmap:

1. **Estabilidade antes de expansão.** Nenhuma nova funcionalidade entra em produção se quebra fluxo já validado.
2. **Não criar telas sem fluxo de negócio.** Toda UI existe para servir um processo operacional real, não o inverso.
3. **Validar operação antes de automatizar.** Automatiza-se apenas o que já foi feito manualmente e comprovadamente funciona.
4. **Preservar histórico.** Dados do legado e do MVP nunca são descartados; são migrados, versionados ou arquivados.
5. **Backend é a fonte de verdade.** Regras de negócio vivem no Laravel, nunca no React.
6. **Contratos, LGPD e consentimento são P0 permanente.** Qualquer feature que toque dados pessoais passa por revisão antes do merge.
7. **Migração é feature, não script solto.** Toda importação do legado é auditável, reversível e idempotente.
8. **Nada avança sem critério de conclusão objetivo.** Cada fase tem checklist verificável.

## 3. Roadmap por Fases

Fases sequenciais. Uma fase só é iniciada quando a anterior atinge seu critério de conclusão (com exceção de trabalhos paralelos explicitamente marcados).

### Fase 0 — Preparação

| Item | Descrição |
|---|---|
| Objetivo | Consolidar base técnica atual, eliminar dívidas críticas e estabelecer padrões antes de expandir escopo. |
| Valor para negócio | Reduz retrabalho, evita bugs em cascata nas fases seguintes e dá previsibilidade ao roadmap. |
| Alterações backend | Auditoria de rotas Laravel, padronização de respostas de API, adoção de Form Requests, cobertura de testes em endpoints críticos, logs estruturados. |
| Alterações frontend | Padronização de camada de dados (React Query ou equivalente), tipagem consistente, remoção de estados mortos, boundary de erro global. |
| Banco de dados | Revisão do schema atual, nomeação de tabelas/colunas, índices em FKs, migrations consolidadas, seeds para ambiente de desenvolvimento. |
| Dependências | Nenhuma. Ponto de partida. |
| Critério de conclusão | (1) Pipeline de CI verde; (2) documentação de arquitetura publicada; (3) cobertura mínima de testes acordada nos módulos críticos; (4) ambiente de staging estável. |

### Fase 1 — Fundação do Cadastro

| Item | Descrição |
|---|---|
| Objetivo | Estabelecer o cadastro canônico da influenciadora como entidade central da plataforma. |
| Valor para negócio | Sem cadastro confiável nenhum outro processo funciona: campanhas, envios, contratos e permutas dependem dele. |
| Alterações backend | Endpoints de CRUD de influenciadora; integração com serviço de CEP; validação de CPF/CNPJ; modelo de medidas versionadas; captura e armazenamento de consentimento LGPD com timestamp e IP; log de alterações (histórico). |
| Alterações frontend | Formulário de cadastro em etapas; autopreenchimento por CEP; máscara e validação de CPF/CNPJ; tela de medidas; tela de consentimento; visualização de histórico de alterações. |
| Banco de dados | Tabelas: `influencers`, `addresses`, `measurements`, `consents`, `influencer_history`. Constraints de unicidade em documento. |
| Dependências | Fase 0 concluída. |
| Critério de conclusão | Cadastro completo end-to-end validado pela operação; consentimento registrado com prova; histórico auditável; testes de integração cobrindo o fluxo. |

### Fase 2 — Portal da Influenciadora

| Item | Descrição |
|---|---|
| Objetivo | Dar à influenciadora um canal autenticado para consumir campanhas, briefings e materiais. |
| Valor para negócio | Reduz troca manual por WhatsApp/e-mail, centraliza comunicação e cria trilha de auditoria da entrega de briefing. |
| Alterações backend | Autenticação (login/reset/2FA opcional); autorização por perfil; endpoints de campanhas ativas por influenciadora; entrega de materiais (assets); endpoint de perfil próprio. |
| Alterações frontend | Fluxo de login; dashboard da influenciadora; lista e detalhe de campanhas; visualização de briefing; download/consulta de materiais; edição limitada de perfil. |
| Banco de dados | Tabelas: `users`, `sessions`, `campaigns`, `campaign_influencers`, `briefings`, `assets`. |
| Dependências | Fase 1 (cadastro é o sujeito autenticado). |
| Critério de conclusão | Influenciadora consegue logar, ver campanha ativa, ler briefing e acessar materiais sem intervenção da operação. |

### Fase 3 — Operação de Produtos e Logística

| Item | Descrição |
|---|---|
| Objetivo | Modelar produtos, variantes, escolha de permuta e ficha logística de forma rastreável. |
| Valor para negócio | Habilita o coração operacional: o que é enviado, para quem, em que variante, com que custo logístico. |
| Alterações backend | CRUD de produtos e variantes; regras de disponibilidade; janela e regras de escolha de permuta; ficha logística (peso, dimensões, transportadora); baixa de estoque atômica. |
| Alterações frontend | Catálogo interno; tela de escolha de permuta pela influenciadora; ficha logística por envio; visão operacional de estoque. |
| Banco de dados | Tabelas: `products`, `product_variants`, `stock`, `permutas`, `shipments`, `shipment_items`. Transações para baixa de estoque. |
| Dependências | Fase 2 (portal para escolha) e Fase 1 (endereço para envio). |
| Critério de conclusão | Operação consegue cadastrar produto, disponibilizar em campanha, receber escolha de permuta, gerar ficha logística e baixar estoque, tudo pela plataforma. |

### Fase 4 — Contratos

| Item | Descrição |
|---|---|
| Objetivo | Gerar, versionar e assinar contratos digitalmente a partir da plataforma. |
| Valor para negócio | Elimina contrato manual em Word/PDF, garante rastreabilidade jurídica e integra a assinatura ao ciclo da campanha. |
| Alterações backend | Templates de contrato; sistema de placeholders vinculado a dados de cadastro/campanha; geração de PDF; integração com provedor de assinatura digital; webhook de status de assinatura; versionamento imutável. |
| Alterações frontend | Editor/visualizador de templates; preview do contrato preenchido; painel de status de assinatura; download do contrato assinado. |
| Banco de dados | Tabelas: `contract_templates`, `contracts`, `contract_signatures`, `contract_events`. |
| Dependências | Fases 1, 2 e 3 (dados de cadastro, campanha e permuta alimentam placeholders). |
| Critério de conclusão | Um contrato completo é gerado a partir de template, preenchido com dados reais, assinado por ambas as partes e arquivado com trilha de auditoria. |

### Fase 5 — Migração do Legado

| Item | Descrição |
|---|---|
| Objetivo | Trazer o histórico relevante do Google Sheets para o modelo do TEAR V2. |
| Valor para negócio | Preserva memória operacional, permite análise histórica e desliga oficialmente o legado. |
| Alterações backend | Importadores idempotentes por planilha; camada de mapeamento planilha → modelo; validadores; relatório de divergências; reversão. |
| Alterações frontend | Painel de importação (upload, dry-run, status, erros linha a linha); visualização do histórico migrado marcado como `origem: legado`. |
| Banco de dados | Campo `source` / `legacy_id` nas entidades migradas; tabela `imports` com log de execução. |
| Dependências | Fases 1–4 concluídas — não se migra para um modelo que ainda vai mudar. |
| Critério de conclusão | Planilhas críticas importadas com relatório zero-erros ou erros justificados; legado colocado em modo somente leitura. |

### Fase 6 — Inteligência e Automações

| Item | Descrição |
|---|---|
| Objetivo | Adicionar automações de alto valor sobre uma base já estável. |
| Valor para negócio | Ganho de produtividade real (leitura de URLs de e-commerce, extração automática de produtos, sugestões operacionais). |
| Alterações backend | Serviço de scraping/extração de URLs; fila de jobs; provider de IA para normalização de dados; regras de automação configuráveis. |
| Alterações frontend | Interface de colar URL e revisar extração; painel de automações; logs de execução. |
| Banco de dados | Tabelas: `automation_jobs`, `url_extractions`, `ai_runs`. |
| Dependências | Fases 1–5. Automação sobre base instável amplifica erro. |
| Critério de conclusão | Pelo menos um fluxo de automação em produção com métricas de acerto acompanhadas e reversível. |

## 4. Revisão das Prioridades

### P0 — Obrigatório antes de avançar
- Fase 0 (Preparação).
- Fase 1 (Cadastro + Consentimento LGPD).
- Autenticação da Fase 2.
- Modelo de produtos/variantes/permuta da Fase 3.
- Geração e assinatura de contrato da Fase 4 (assinatura pode entrar em P1 se bloqueio jurídico).

### P1 — Grande ganho operacional
- Portal completo da influenciadora (Fase 2 além do login).
- Ficha logística e baixa de estoque (Fase 3).
- Migração do legado (Fase 5).
- Templates avançados de contrato com múltiplos placeholders.

### P2 — Melhoria futura
- Automação por IA (Fase 6).
- Extração de URLs.
- 2FA na autenticação.
- Dashboards analíticos avançados.

### Alterações de prioridade em relação ao entendimento inicial

- **Consentimento LGPD subiu para P0** dentro da Fase 1: sem prova de consentimento, o resto da plataforma fica juridicamente exposto.
- **Migração do legado desceu para P1** e foi movida para depois dos contratos: migrar para um modelo instável gera retrabalho.
- **Automações inteligentes permanecem P2** intencionalmente: alto custo, alto risco se aplicado sobre base ainda em evolução.

## 5. Pontos que Precisam de Decisão Humana

Decisões que **não devem ser tomadas pelo time de desenvolvimento sozinho**. Precisam de Product/Operação/Jurídico antes do início das fases correspondentes:

1. **Provedor de assinatura digital** (ex.: Clicksign, D4Sign, DocuSign, ZapSign) — impacta Fase 4.
2. **Regras contratuais**: cláusulas obrigatórias, versões por tipo de campanha, prazo de vigência, política de rescisão.
3. **Janela de escolha de permuta**: quantos dias a influenciadora tem, o que acontece ao expirar, fallback automático ou manual.
4. **Escopo da migração do legado**: quais planilhas entram, quais campos são obrigatórios, o que pode ser descartado.
5. **Regras de aprovação interna**: quem aprova campanha, quem aprova envio, quem aprova contrato, com ou sem etapa dupla.
6. **Política de LGPD**: tempo de retenção, direito ao esquecimento, exportação de dados.
7. **Perfis e permissões**: quais papéis existem (operação, gestão, influenciadora, financeiro) e o que cada um vê.
8. **SLA da operação**: prazos aceitáveis por etapa (envio, assinatura, resposta) — alimenta alertas.
9. **Estratégia de comunicação com influenciadora**: e-mail transacional, WhatsApp oficial, apenas portal.
10. **Critérios de sucesso do desligamento do legado**: quando o Google Sheets vira read-only definitivo.

## 6. Ordem Recomendada de Implementação

Sequência final, do primeiro ao último trabalho:

```text
Fase 0 — Preparação técnica
        ↓
Fase 1 — Cadastro + Consentimento (fundação de dados)
        ↓
Fase 2 — Autenticação e Portal da Influenciadora
        ↓
Fase 3 — Produtos, Variantes, Permuta e Logística
        ↓
Fase 4 — Contratos (templates, geração, assinatura)
        ↓
Fase 5 — Migração do legado sobre o modelo já estável
        ↓
Fase 6 — Automações e IA sobre base madura
```

### Por que essa ordem

- **Fase 0 antes de tudo**: sem base técnica sólida, cada fase seguinte multiplica bugs.
- **Cadastro antes de portal**: não faz sentido autenticar quem ainda não existe como entidade.
- **Portal antes de produtos**: a escolha de permuta acontece pela influenciadora autenticada.
- **Produtos antes de contratos**: contratos referenciam produtos e permutas escolhidas.
- **Contratos antes de migrar**: se o modelo de contrato mudar durante a migração, o histórico importado fica inconsistente.
- **Migração antes de automação**: automatizar sobre dados incompletos gera decisões erradas em escala.
- **IA por último**: automação amplifica o que existe — só se amplifica um sistema estável.

## 7. Checklist Final para Iniciar Desenvolvimento

- [ ] Arquitetura validada (frontend, backend, banco, integrações mapeadas).
- [ ] Banco de dados planejado (entidades, relacionamentos, índices e migrations desenhados por fase).
- [ ] Fluxos aprovados por Produto e Operação (cadastro, portal, permuta, contrato, migração).
- [ ] Regras de negócio documentadas (permuta, contrato, aprovação, LGPD, SLA).
- [ ] Prioridades P0/P1/P2 confirmadas com stakeholders.
- [ ] Decisões humanas da seção 5 respondidas por escrito antes das fases dependentes.
- [ ] Ambiente de staging equivalente a produção.
- [ ] Estratégia de testes definida (unitário, integração, e2e nos fluxos críticos).
- [ ] Política de observabilidade (logs, métricas, alertas) acordada.
- [ ] Plano de rollback por fase documentado.
- [ ] Critério de desligamento do legado combinado com a operação.

---

**Fim do documento.** Este roadmap é o contrato de execução entre Produto, Tech Lead e time de desenvolvimento do TEAR V2. Alterações devem ser versionadas neste mesmo arquivo com data e justificativa.
