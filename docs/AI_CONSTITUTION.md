# AI_CONSTITUTION.md — Constituição de Engenharia do Projeto TEAR

> Autoridade máxima de engenharia do projeto. Rege qualquer IA (Claude,
> ChatGPT, Gemini, Codex ou outra) e qualquer humano que altere código ou
> arquitetura. Não registra estado, tarefas ou decisões pontuais — isso
> pertence a `docs/_workspace/TASK_ROUTER.md` e `ESTADO_SESSAO.md`. Alterar
> este documento é decisão rara e explícita do responsável do projeto; se
> algo aqui parece errado por causa de um evento pontual, o problema é do
> evento, não da regra.

## 1. Propósito

O TEAR é a V2 do sistema de gestão de parcerias com influenciadoras digitais
(Estúdio Elã / Jescri), migrando de um legado acoplado e sem estado (Google
Apps Script + Planilhas) para Laravel 12 + PostgreSQL, em hospedagem
compartilhada (Locaweb: PHP 8.3, sem Docker, sem root, CPU/memória
limitados). A robustez do sistema depende da adesão estrita da IA aos
princípios abaixo — o descumprimento gera alucinação de referência e
corrupção de integridade, não apenas "código feio".

## 2. Hierarquia das Verdades

Em caso de conflito, a ordem é:

1. **Contrato Soberano** (`docs/history/CONTRATO_SOBERANO.md`) — define
   entidades, colunas e relacionamentos. Nunca se adapta o contrato ao
   código; o código se adapta ao contrato.
2. **Legado** — define regras de negócio e comportamento (cálculos, fluxos)
   já validados. Mudança de regra é decisão de produto, não refatoração.
3. **Arquitetura V2** (ADRs, SPECs) — define como implementar (camadas,
   padrões).
4. **Esta Constituição** — define como a IA se comporta ao transitar entre
   os três níveis acima.

Regras derivadas:

- Nunca reabrir o Contrato Soberano ou um ADR fechado sem um novo ADR.
- `INFLU_KEY` é o identificador soberano de relacionamento entre Parceiras,
  Campanhas e Pagamentos — nunca duplicar PII (PIX/CNPJ) fora da tabela de
  origem.
- Linguagem ubíqua é obrigatória (ver `ADR-003`): um único vocabulário
  atravessa documentação, código, eventos e APIs; termos do legado banidos
  não retornam por sinônimo criativo.

## 3. Mandamentos da IA

A IA SEMPRE deve:

- Pensar antes de alterar código.
- Entender a causa raiz antes de corrigir bugs — nunca "vibe debugging".
- Modificar o menor número possível de arquivos.
- Preferir soluções simples (KISS).
- Preservar SSOT, DRY e SoC.
- Respeitar a arquitetura por Features (agrupar por funcionalidade, não por
  camada técnica) — reduz poluição de contexto e erro de integração.
- Procurar reutilização antes de criar algo novo.
- Justificar soluções complexas (ver §7).
- Validar Schema e Model antes de gerar código de UI/frontend.
- Tratar identidade técnica pelo `sub` do provedor federado (nunca e-mail);
  autenticação é 100% delegada ao provedor — nunca senha local.
- Filtrar implicitamente toda consulta/escrita pelo identificador imutável
  do usuário (previne IDOR).
- Manter PII (PIX, CNPJ, endereço) fora de logs e eventos de domínio.
- Interromper a implementação ao detectar conflito arquitetural.

A IA NUNCA deve:

- Implementar funcionalidades não solicitadas (YAGNI).
- Criar código antes de compreender o domínio.
- Duplicar lógica ou documentação.
- Fazer refatoração oportunista fora do escopo pedido.
- Alterar arquitetura sem ADR correspondente.
- Assumir comportamento sem evidência no código.
- Iniciar pelo "telhado" (UI) sem o Schema/Model aprovado por baixo.
- Deixar regra de negócio vazar para Repository (só traduz) ou Controller
  (só orquestra entrada/saída) — regra de negócio vive 100% em Service.
- Depender de nomes físicos de coluna/aba fora da Camada Anticorrupção
  (ACL) — é a única ponte entre domínio e persistência física do legado.
- Silenciar uma violação de contrato/tipo: dado inválido na fonte estoura
  erro imediato (fail-fast), nunca é "adaptado" na hora.
- Implementar real-time/WebSockets ou multi-tenant sem pedido explícito.
- Commitar operação financeira crítica sem garantir atomicidade
  (lock/transação) — nunca estado financeiro parcial.

## 4. Regras para modificar código

- Fluxo obrigatório: **Auditoria → Plano (SPEC se estrutural) → Execução →
  Validação → Commit.**
- Ler o PRD/SPEC/ADR relevante antes de propor mudança — nunca adivinhar.
- Uma unidade lógica de trabalho por commit; não misturar frentes não
  relacionadas na mesma branch/commit.
- Validar antes de commit: testes, lint e, para UI, uso real da feature.

## 5. Regras para corrigir bugs

- Diagnosticar a causa raiz antes de propor correção.
- Preferir a correção que resolve a causa raiz à que apenas mascara o
  sintoma ou "faz passar" o teste.
- Se a causa raiz exigir mudança de contrato ou arquitetura, parar — não
  improvisar. Seguir §8.

## 6. Regras para documentação

- Não criar documentação duplicada ou paralela a uma fonte já oficial;
  referenciar, não copiar.
- Decisão arquitetural nova → ADR novo; edição de ADR existente só para
  nota de "Superseded".
- Documentos de estado (`ESTADO_SESSAO.md`) são reescritos por completo;
  documentos de histórico (`TASK_ROUTER.md`) são append-only.
- Esta Constituição muda apenas por decisão explícita do responsável do
  projeto.

## 7. Critérios de qualidade

Antes de aceitar uma solução, ela deve responder "sim" a todas:

- Isso deixa o projeto mais simples?
- Isso reduz complexidade?
- Isso facilita entender o código?
- Isso é realmente necessário agora (não hipoteticamente)?

Clareza acima de estética técnica ou criatividade não solicitada. Código é
o executor do domínio (contrato + legado) — não o autor dele.

## 8. Quando interromper e pedir decisão humana

Parar e aguardar decisão do responsável do projeto apenas quando houver:

- regra de negócio inédita (decisão de PO ainda não tomada);
- necessidade de credenciais ou acessos que a IA não possui;
- impossibilidade técnica objetiva;
- conflito insolúvel entre requisitos;
- erro crítico de arquitetura detectado em andamento (acoplamento indevido
  de camadas, duplicação de UI, campo sem Schema) — interromper e corrigir
  antes de prosseguir, nunca acumular como dívida.

Fora esses casos, decidir e continuar: confirmação a cada etapa trivial é
custo, não segurança. Detalhe do mandato vigente em `CLAUDE.md` §Mandato
de operação autônoma.
