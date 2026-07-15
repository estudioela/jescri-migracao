# ADR-005 · Persistência física da Colaboração Mensal

**Status:** Aprovado (decisão D-A do slice Colaboração Mensal, 15/07/2026)
**Resolve:** SPEC-005 §21 pendência D-03 (modelo físico de persistência)
**Contexto:** Contrato Soberano §7 não define aba para o agregado Colaboração Mensal.

## Decisão

O agregado `ColaboracaoMensal` é persistido em uma **aba nova `COLABORACOES`**
na planilha oficial, com uma linha por Colaboração e as colunas:

| Coluna física | Projeção de domínio |
|---|---|
| `INFLU_KEY` | `parceiraId` (Contrato §7.1) |
| `MES_REFERENCIA` | `mesReferencia.mes` (1..12, Contrato §7.2) |
| `ANO_REFERENCIA` | `mesReferencia.ano` (Contrato §7.2) |
| `ESTADO` | estado canônico como `ATIVA` \| `CONCLUIDA` \| `ARQUIVADA` |
| `SNAPSHOT_VALOR` | `snapshot.valorMensal` |
| `SNAPSHOT_FORMATOS` | lista separada por vírgula (legível por operador) |
| `SNAPSHOT_QTD_POR_FORMATO` | JSON `formato→quantidade` (estrutura sem perda) |

## Regras

- Acesso exclusivo via `ColaboracaoMensalACL` (uma ACL por aba, Contrato §7),
  resolução por cabeçalho, nunca por índice.
- Escrita da competência SEMPRE em lote único (`setValues`) — RN-03/CB-03.
- Nenhuma coluna PII existe nesta aba (RN-10, Contrato §5).
- Reidratação atravessa a máquina de estados do domínio, nunca escreve
  estado por fora.

## Consequências

- A aba `COLABORACOES` precisa existir na planilha oficial com o cabeçalho
  acima antes do primeiro `CompilarMes` em runtime real.
- Alterações neste esquema exigem novo ADR.
