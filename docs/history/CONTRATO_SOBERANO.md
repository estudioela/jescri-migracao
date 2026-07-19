# CONTRATO SOBERANO — Projeto TEAR

> Fonte oficial e imutavel da verdade de negocio e dominio do Projeto TEAR.
> Este documento define o estado-alvo V2 e prevalece sobre qualquer interpretacao de implementacao legada.

## 1. Autoridade Oficial

### 1.1 Planilha oficial

https://docs.google.com/spreadsheets/d/1ZKqrmz80oOaU70gcHeIgr-yK9zeJ_5YkE8b5CKkuRdM/edit?gid=1430454491#gid=1430454491

- Spreadsheet ID: `1ZKqrmz80oOaU70gcHeIgr-yK9zeJ_5YkE8b5CKkuRdM`

### 1.2 Apps Script oficial

- Script ID: `1fE8w10O3MwHvfa4gLgJvcUXD4HIWKNL0ar5YMmjzMamujRfwqiPfcLyK`

## 2. Regras Soberanas

- Planilha oficial e script oficial sao read-only para decisoes de referencia.
- Em conflito entre documentacao/implementacao e a fonte oficial, prevalece a fonte oficial.
- O modelo de negocio V2 descreve destino arquitetural; divergencias do runtime atual sao divida tecnica em migracao.
- Termos banidos do dominio: `Ciclo` e `Plano de Colaboracao`.

## 3. Principio de Modelagem

- O dominio modela negocio, nao colunas de planilha.
- A Camada Anticorrupcao (ACL) e a unica ponte entre linguagem de dominio e persistencia fisica.
- Nenhuma camada fora da ACL pode depender de nome fisico de coluna.
- Conceitos de negocio podem existir no dominio mesmo sem coluna explicita (ex.: Compilador do Mes).

## 4. Linguagem Ubiqua Oficial

- Parceira
- Cadastro
- Colaboracao Mensal
- MesReferencia
- Compilador do Mes
- Briefing
- Entrega
- Envio
- Pagamento
- Arquivamento

## 5. Value Objects

- ChaveInfluenciadora
- MesReferencia
- PIX
- CNPJ
- Endereco
- CondicaoComercial

PII (`PIX`, `CNPJ`, `Endereco`) nunca deve ser exposta em logs.

## 6. Agregados e Entidades

### 6.1 Agregado raiz

- Parceira: fonte unica da condicao comercial e identidade da colaboracao.

### 6.2 Entidade de entrada

- Cadastro: candidata a promocao para Parceira.

### 6.3 Fronteira por competencia

- Colaboracao Mensal (Parceira x MesReferencia), materializada por:
	- Briefing
	- Ativacao
	- EnvioLogistico
	- Pagamento

### 6.4 Historico

- Competencia arquivada e imutavel.

## 7. Especificacao Soberana da ACL

Regra geral:

- uma ACL por aba;
- resolucao por cabecalho;
- proibido acoplamento por indice de coluna.

### 7.1 ChaveInfluenciadora

| Aba fisica | Coluna fisica |
|---|---|
| `BASE DE DADOS` | `INFLU_KEY` |
| `ATIVACOES` | `INFLU_KEY` |
| `PAGAMENTOS` | `INFLU_KEY` |
| `HISTORICO DE CONTEUDOS` / `HISTORICO DE PAGAMENTOS` / `HISTORICO LOGISTICO` | `INFLU_KEY` |
| `FLUXO LOGISTICO` | `INFLU KEY` |
| `BRIEFING` | `INFLUENCIADORA` |

### 7.2 MesReferencia

| Aba fisica | Coluna fisica |
|---|---|
| `BASE DE DADOS`, `ATIVACOES`, `PAGAMENTOS`, historicos | `MES_REFERENCIA` |
| `FLUXO LOGISTICO` | `MES REFERENCIA` |
| `ATIVACOES`, `PAGAMENTOS`, historicos | `ANO_REFERENCIA` |
| `BRIEFING` | sem carimbo fisico persistente |

### 7.3 Conceitos de dominio e projecoes fisicas

| Conceito | Aba fisica | Coluna fisica |
|---|---|---|
| `Parceira.status` | `BASE DE DADOS` | `STATUS` |
| `CondicaoComercial.valor` | `BASE DE DADOS` | `VALOR_TOTAL` |
| `CondicaoComercial.entregaveis` | `BASE DE DADOS` | `REELS_TEXTO`, `CARROSSEL_TEXTO`, `STORIES_TEXTO`, `LOOKS_QTD` |
| `Endereco` | `BASE DE DADOS` | `INFLUENCIADORA_ENDERECO` e derivados |
| `PIX` | `BASE DE DADOS` / `PAGAMENTOS` | `CHAVE_PIX` |
| `CNPJ` | `BASE DE DADOS` | `INFLUENCIADORA_CNPJ` |
| `Ativacao.estado` | `ATIVACOES` | `STATUS_CONTEUDO` |
| `Ativacao.arquivo` | `ATIVACOES` | `LINK_ARQUIVO` |
| `Ativacao.id` | `ATIVACOES` | `ID` |
| `EnvioLogistico.estado` | `FLUXO LOGISTICO` | `STATUS LOGISTICA` |
| `EnvioLogistico.rastreio` | `FLUXO LOGISTICO` | `RASTREIO` |
| `EnvioLogistico.endereco` | `FLUXO LOGISTICO` | `ENDERECO` |
| `Pagamento.valor` | `PAGAMENTOS` | `VALOR_TOTAL` |
| `Pagamento.estado` | `PAGAMENTOS` | `STATUS_PAGAMENTO` |
| `Arquivamento.data` | abas `HISTORICO` | `DATA_ARQUIVAMENTO` |

## 8. Eventos de Dominio

- CadastroRecebido
- ParceiraPromovida
- MesCompilado
- BriefingPublicado
- ConteudoEnviado
- ConteudoAprovado
- ProdutoDespachado
- ProdutoEntregue
- PagamentoLiberado
- PagamentoConfirmado
- CompetenciaArquivada
- ConteudoPublicado (payload: `entregaId`, `dataArquivamento`; adotado pelo
  PO em 2026-07-15 para a transição Publicado→arquivamento da Entrega,
  SPEC-012 §12 — nomeado aqui em 2026-07-16, decisão vivia só em comentário
  de código em `EntregaService.js`)

## 9. Pendencias de Design (controle)

- Enumeracao fechada dos estados de Parceira, Conteudo, Logistica e Pagamento.
- Regra canonica de composicao de MesReferencia (`MES_REFERENCIA` + `ANO_REFERENCIA`).
- Regra formal de elegibilidade para `PagamentoLiberado`.
- Mapeamento completo de promocao `Cadastro -> Parceira`.

## 10. Legado

Implementacoes e documentos legados sao consulta historica apenas. Nao redefinem este contrato soberano.
