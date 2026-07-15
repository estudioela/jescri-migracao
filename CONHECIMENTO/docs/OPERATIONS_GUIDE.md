# OPERATIONS_GUIDE.md — Guia Operacional V2 (Consolidado)

> Documento operacional consolidado para o estado-alvo V2.
> Foco: como a operacao deve funcionar segundo o Soberano V2.
>
> Fontes de autoridade:
> - CONTRATO_SOBERANO.md
> - DOMAIN_MODEL_V2.md
> - DOMAIN_MODEL_CONSOLIDADO.md
> - PLANILHA_TEAR_2.0_MAPA.md
>
> Nota de transicao:
> O runtime atual ainda possui rotas e estruturas herdadas de Ciclo/Plano.
> Esse comportamento e considerado transitorio e em descontinuacao.

## 1. Princípios Operacionais

- Fonte unica da verdade: planilha oficial definida no Contrato Soberano.
- Modelo oficial de negocio: V2 soberano, com MesReferencia e Colaboracao Mensal.
- ACL obrigatoria entre dominio e persistencia.
- Seguranca e escopo de acesso por perfil (admin e parceira).

## 2. Atores e Responsabilidades

- Operacao Admin
  - promover Cadastro para Parceira
  - manter condicao comercial da Parceira
  - executar Compilador do Mes
  - acompanhar Ativacoes, Logistica e Pagamentos
  - conduzir arquivamento de competencia

- Parceira
  - consultar briefing e pendencias do mes
  - enviar conteudo
  - atualizar dados permitidos de perfil
  - acompanhar pagamentos e historico

## 3. Fluxo Canonico do Mes

1. Curadoria e promocao de Cadastro para Parceira.
2. Confirmacao de condicao comercial da Parceira.
3. Execucao do Compilador do Mes para um MesReferencia.
4. Materializacao dos artefatos mensais:
   - Briefing
   - Ativacoes
   - EnvioLogistico
   - Pagamento
5. Execucao operacional:
   - producao de conteudo
   - acompanhamento logistico
   - liberacao e confirmacao de pagamento
6. Arquivamento da competencia (historico imutavel).

## 4. Regras de Operacao

- So Parceiras validas participam da compilacao mensal.
- Pagamento depende do cumprimento operacional definido pelo dominio.
- Historico nao e area de retrabalho: competencia arquivada permanece imutavel.
- Nenhum fluxo operacional deve depender de termo legado Ciclo/Plano.

## 5. Estados Operacionais (visao de negocio)

- Ativacao: fluxo de planejamento ate conclusao/arquivamento.
- EnvioLogistico: fluxo de preparo ate entrega/cancelamento.
- Pagamento: fluxo de elegibilidade ate confirmacao.

A lista fechada de estados e governada pelos contratos de dominio e deve permanecer sincronizada com a ACL.

## 6. Seguranca e Governanca

- Acoes administrativas exigem autorizacao explicita.
- Dados de uma Parceira nao podem vazar para outra.
- Dados sensiveis nao podem ser expostos em logs.
- Mudanca de regra de negocio so entra com atualizacao documental soberana.

## 7. Convivencia com a Divida Tecnica

- O comportamento legado ainda existente no codigo nao redefine o processo canonico.
- Sempre que houver conflito entre implementacao atual e V2 soberano:
  - registrar como gap de migracao;
  - manter a documentacao no estado-alvo;
  - tratar correcao no plano tecnico subsequente.

## 8. Fora de Escopo

Este guia nao cobre:

- detalhes de infraestrutura de deploy;
- troubleshooting tecnico de baixo nivel;
- historico de releases;
- desenho de testes.

Esses assuntos permanecem em documentos especificos.

## 9. Infraestrutura e Execucao V2

- Infra oficial da V2: Google Apps Script + Google Sheets.
- Arquitetura operacional por camadas: Entrypoint -> Controller -> Service -> Repository.
- Codigo versionado localmente em `.js` e sincronizado por clasp.
- Publicacao controlada por operador; nao ha deploy automatico por agentes.
- Migracoes de dados exigem ativacao explicita e trilha de aprovacao.

### 9.1 Contrato externo

- Entrypoints expostos devem ser funcoes de topo para `google.script.run`.
- Resposta externa padronizada em envelope `success/data` ou `success/error`.

### 9.2 Seguranca operacional

- Operacoes administrativas exigem autorizacao.
- Escopo de dados por identidade do parceiro.
- Dados sensiveis nao devem ser logados.

### 9.3 Publicacao

- `.claspignore` opera como allowlist de artefatos publicaveis.
- Mudancas devem passar por validacao e commit antes de push/deploy.
