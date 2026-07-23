# ELÃ | influência — ENTREGA 1: ANÁLISE ESTRATÉGICA

Data: 2026-07-21
Papel: CEO Advisor / CTO / Head de Produto
Base factual: auditoria direta do repositório nesta data (TASK_ROUTER, PRD, ADRs, `docs/release/TEAR_V2.5_RELEASE_READINESS.md`, relatório de QA funcional do MVP, `docs/deployment/ARQUITETURA_PRODUCAO.md`, código de `tear-v2-app`).

Estado real verificado antes da análise:

- `tear-v2-app` (Laravel 12 + React 19): suíte 149/149 verde, lint limpo, 20 migrations reversíveis, RBAC, rate limit, security headers, Pulse. Fluxo ponta a ponta funciona (QA de 2026-07-20).
- Pendências de Go Live são exclusivamente de infraestrutura: variáveis de produção, credenciais do Google Drive, SMTP real, deploy na Locaweb.
- Dois P1 de QA abertos: link de material quebrado no fallback local e sidebar com 9 de 12 itens levando a "Em construção".
- Legado GAS V2 (`src/`): 625 testes verdes, publicado, mas o login OAuth nunca foi validado ponta a ponta em produção. A operação real ainda roda na planilha V1.
- Restrição soberana de infra (2026-07-21): custo recorrente adicional zero.

---

## 1. Concordo com a visão?

Sim, com uma ressalva central.

Concordo com: evoluir por uso real, mínimo de código, legado como referência morta, IA só depois de produto sólido, versões que existem para resolver problemas de produção. Isso é a estratégia correta para um fundador solo.

A ressalva: o plano, como está, valida um sistema interno, não um SaaS. Usar diariamente com a Jescri prova que o produto serve para o Estúdio Elã. Não prova que serve para uma empresa que não é você. "Maduro para começar a jornada comercial" em 15/01/2027 exige pelo menos um piloto externo concluído antes dessa data. Sem isso, o lançamento é uma aposta, não uma constatação.

## 2. O que está excelente

- A decisão de matar o legado GAS como produto. Ela chegou na hora certa: o portal GAS consumiu esforço enorme (625 testes) e travou exatamente na fronteira que o Apps Script não resolve bem (OAuth, origem de iframe). Insistir seria custo afundado.
- A barra de qualidade do MVP Laravel: testes, migrations reversíveis, RBAC, rate limit, headers, upload que falha de forma segura. Isso é raro em MVP e é o seu maior ativo de velocidade futura.
- As tabelas `consentimentos` e `historico_alteracoes` já existirem: fundação de LGPD e auditoria antes de qualquer cliente externo.
- A recusa a construir por hipótese. O backlog V2.6 já classificado em MUST/SHOULD/COULD/FUTURE é disciplina de produto de verdade.
- O modelo de dados já contemplar `marcas`, `campanhas` e `participacoes`: a semente do multi-cliente existe sem ter virado complexidade prematura.

## 3. O que considero arriscado

- **Infra de custo zero versus ambição SaaS.** Hospedagem compartilhada Locaweb sem Docker, sem root, com backup do Postgres "a confirmar" é aceitável para uso interno. É inaceitável para guardar dados de um cliente externo pagante (PII de influenciadoras: CNPJ, PIX, endereço, medidas corporais). A restrição de custo zero precisa ter data de validade.
- **Validação de cliente único.** Jescri é cliente, mas é você operando. O risco: construir seis meses de refinamentos que só servem ao seu jeito de operar.
- **Tenancy indefinida.** `marcas` existe como entidade, mas não há modelo de isolamento por tenant (usuário ↔ marca, dados entre concorrentes no mesmo banco). Essa é a decisão arquitetural mais cara de errar. Precisa de ADR antes do piloto externo, não depois.
- **LGPD (Q-09) segue aberta** desde o legado e o produto novo lida com dados mais sensíveis (medidas corporais). Para uso interno é dívida. Para cliente externo é bloqueador legal.
- **Capacidade: uma pessoa.** O mesmo Dani opera a agência (Jescri, Dra. Renata), faz o produto, o suporte e a validação. O plano precisa de folga estrutural, não de otimismo.
- **Dezembro.** Pico operacional de lingerie e festas. Planejar trabalho pesado de produto para dezembro é planejar atraso. O 15/01 exige que 0.9 esteja pronto em novembro.
- **E-mail transacional inexistente** (`MAIL_MAILER=log`). Convite e reset de senha não saem. Sem isso não existe usuário real, nem interno.

## 4. O que eu mudaria

- Definir 1.0 por evidência, não por lista de funcionalidades: "1.0 = um ciclo mensal completo operado por uma empresa externa, sem eu tocar no banco". Tudo o mais deriva disso.
- Inserir a fase de piloto externo explicitamente antes do 1.0 (modo concierge: você opera junto, o sistema é o mesmo).
- Trocar a escada 0.1→0.9 por versões amarradas a portões de fase (detalho na Entrega 2). Números de versão não são progresso; portões cruzados são.
- Dar data de validade à restrição de custo zero: ela vale até o primeiro dado de cliente externo entrar no banco. Nesse dia, um VPS pequeno e backup externo deixam de ser custo e viram requisito.

## 5. O que eu removeria completamente

- Qualquer esforço restante para destravar o login do portal GAS V2. Congelar `src/` hoje: sem correção de OAuth, sem deploy, sem versão nova. Vira biblioteca de regras de negócio, como você mesmo definiu. O item pendente "validar login ponta a ponta no /exec" morre sem execução.
- Os 9 itens de menu "Em construção" da sidebar: remover as entradas do menu, não construir as páginas. Menu que mente é pior que menu curto.
- A proliferação de documentos de planejamento. Já existem 5 roadmaps/planos sobrepostos em `docs/planning` e `docs/reports`. O Plano Mestre (Entrega 3) substitui todos; os anteriores devem ser removidos da árvore ativa (recomendação já executada — `docs/reports/` e `docs/archive/` não existem mais neste repositório, histórico fica só no Git).

## 6. O que eu adiaria

- IA no produto: pós-1.0, sem exceção. Não encontrei nenhum caso de IA de baixo risco que pague seu custo antes disso (justificativa técnica na Entrega 3, seção IA).
- Central de ajuda completa, base de conhecimento, treinamento formal: antes do 1.0 basta FAQ de uma página e vídeos curtos de tela gravada.
- Auditoria completa de acessibilidade: manter o básico (contraste, foco, labels) e auditar de verdade pós-1.0.
- Integrações (GA4 no produto, E-goi, gateway de pagamento, API pública): nenhuma antes do 1.0.
- Papel Marca self-service (SPEC-035): no piloto, o cliente externo é operado em modo concierge; a UI de autosserviço do tenant vem depois da evidência.

## 7. O que eu faria antes (ordem de ataque imediata)

1. Fechar os NO-GO de infraestrutura: variáveis de produção, SMTP real, credenciais do Drive, deploy na Locaweb.
2. Corrigir os dois P1 de QA (link de material, sidebar).
3. Migrar os dados reais da planilha V1 para o Postgres (importador é pré-requisito do uso diário, e hoje só existe no legado GAS).
4. Aposentar a planilha como fonte de verdade: o Go Live interno é o dia em que o mês abre no sistema, não na planilha.
5. ADR de tenancy (decisão, não implementação).
6. LGPD mínima: política de privacidade, termos de uso, fluxo de consentimento ativo no cadastro público.

## 8. O que eu faria depois

- Identidade visual completa e polimento de UX: depois de 2 ciclos de uso real, quando os fluxos estiverem estáveis (polir tela que ainda vai mudar é desperdício).
- Landing page, vídeo, apresentação comercial: novembro/dezembro, com telas reais e números reais do piloto.
- Precificação final: hipótese cedo (para qualificar o piloto), número final só depois do piloto.
- Hardening final, teste de restore de backup, revisão de segurança: na reta do 0.9.

## 9. Riscos que acredito que você ainda não enxergou

- **Adoção pelas influenciadoras.** O concorrente do portal não é outro SaaS, é o WhatsApp. Se o portal for 10% mais difícil que mandar mensagem, elas não vão usar, e você passa a operar dois canais em vez de um. A régua de UX do portal é "mais fácil que o WhatsApp", e isso precisa ser medido, não suposto.
- **Suporte é um produto novo dentro do produto.** Cada cliente externo cria carga permanente (dúvidas, incidentes, expectativas de SLA). Um fundador solo precisa decidir quanto suporte cabe na agenda antes de vender a segunda licença.
- **Fiscal e societário.** SaaS gera receita recorrente sobre o mesmo CNPJ da agência. Limite do MEI, emissão de nota de software (ISS), e a pergunta "quem vende o produto: o Estúdio Elã ou uma empresa nova?" precisam de resposta antes da primeira cobrança. Lacuna de dados: não tenho seu faturamento atual nem regime alvo; isso é decisão sua com contador.
- **Marca.** "ELÃ | influência" mistura o nome da agência com o nome do produto. Se o produto for vendido para outras agências (concorrentes suas), o nome da sua agência no produto pode ser atrito comercial. E: registro no INPI da marca do produto, classe de software, antes do lançamento público. Lacuna: não sei o status de registro atual.
- **Confiança entre concorrentes.** Dados da Jescri e de uma marca piloto no mesmo banco, operados pela agência que atende a Jescri. Cliente externo vai perguntar. A resposta (isolamento técnico + contrato) precisa existir por escrito.
- **Google Drive como storage de terceiros.** Quota, service account e termos de uso ficam desconfortáveis quando o arquivo é de um cliente externo. Aceitável no piloto, revisar antes de escalar.
- **Restore nunca testado.** Backup que nunca foi restaurado não é backup. Teste de restore precisa ser critério de fase, não boa intenção.
- **Bus factor 1 aplicado ao produto.** Se você parar duas semanas, o que acontece com o ciclo mensal dos clientes? A resposta mínima é documentação operacional + acesso de emergência documentado.

## 10. Se o projeto fosse meu: estratégia até janeiro de 2027

Três movimentos, nesta ordem:

**Movimento 1 (agora): virar meu próprio primeiro cliente de verdade.** Go Live interno em agosto com dados reais migrados e a planilha aposentada. Enquanto a operação não roda 100% no sistema, nada do resto importa. Custo zero de infra mantido aqui.

**Movimento 2 (setembro/outubro): transformar as influenciadoras em usuárias reais.** Portal aberto para o squad da Jescri, ciclo inteiro (briefing, material, pagamento) passando por dentro. Medir adoção de verdade: quantas entregas entraram pelo portal versus WhatsApp. Cada fricção encontrada aqui vale mais que qualquer feature nova.

**Movimento 3 (outubro/dezembro): um piloto externo concierge.** Uma marca ou agência próxima, escopo fechado (um ciclo mensal), de preferência pagando um valor simbólico, porque cliente que paga se comporta como cliente. Esse piloto força a existência de tudo que separa sistema de produto: termos, privacidade, onboarding, suporte, isolamento de dados, preço. No dia em que ele fecha um ciclo sem você tocar no banco, o 1.0 está pronto de fato; 15/01/2027 vira o empacotamento comercial de uma evidência, não uma promessa.

Transversal aos três: congelar o legado hoje, uma frente de trabalho por vez (seu próprio CLAUDE.md já manda isso), dezembro deliberadamente leve, e as decisões de negócio (tenancy, preço, CNPJ, marca) tomadas nos portões certos, que estão marcados na Entrega 2.

---

## Lacunas de informação (não inventei; preciso de você)

1. Preço e modelo de licenciamento pretendidos (mensalidade por marca? por influenciadora ativa? setup?).
2. Quem é "a equipe" que usará o sistema além de você (existe alguém hoje?).
3. Faturamento atual e regime tributário alvo (MEI hoje? migração planejada?).
4. Status de registro de marca (Elã, ELÃ | influência) no INPI.
5. Candidatas reais a piloto externo (existe marca ou agência próxima disposta?).
6. Orçamento mensal aceitável para infra a partir do piloto externo.
