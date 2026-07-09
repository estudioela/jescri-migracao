# SCHEMA_V2.md — Schema relacional das abas da Arquitetura V2 (Projeto Tear)

> Escrito à mão em 2026-07-09. **As abas descritas aqui ainda não existem na planilha viva** — por isso o `mae/SchemaExporter.js` não as enxerga e não gera este arquivo. Quando as abas forem criadas (ação manual, exige autorização do usuário — ver `CLAUDE.md` seção 12), `SYSTEM_SCHEMA.md` passa a ser a fonte gerada e este documento vira a especificação de referência.
>
> Nomes de aba são os valores literais de `PLANILHAS` em `mae/Config.js`. **Não confundir com as abas da V1**: `Ativacoes` (V2) ≠ `ATIVAÇÕES` (V1). São abas distintas, coexistindo na mesma planilha.
>
> Linha 1 é sempre cabeçalho. Acesso a dados é feito **por nome de cabeçalho**, nunca por índice fixo — inserir ou reordenar colunas não pode quebrar código.

---

## Aba `Ativacoes`

Entidade central do domínio. Uma linha = uma peça de conteúdo a ser produzida por uma influenciadora dentro de um ciclo.

| Coluna | Papel | Descrição |
|---|---|---|
| `ID_Ativacao` | **Chave primária** | UUID gerado por `Utilities.getUuid()` em `AtivacaoRepository.save()` quando ausente. |
| `ID_Ciclo` | Chave estrangeira → `Ciclos.ID_Ciclo` | Ciclo ao qual a ativação pertence. Campo de filtro de `AtivacaoRepository.findByCiclo()`. |
| `ID_Influenciadora` | Chave estrangeira → `Parceiros_Influenciadoras` | Influenciadora responsável pela entrega. |
| `Tipo_Conteudo` | Dado | Formato da peça (ex.: REEL, CARROSSEL, STORIES). |
| `Estado_Principal` | Dado (máquina de estados) | Etapa atual. Domínio fechado: os 13 valores de `ESTADOS_ATIVACAO` (`mae/Config.js`). Transições válidas em `mae/Ativacao.js`. |
| `Look_Referencia` | Dado | Look/peça de vestuário associado à ativação. |
| `Data_Prevista_Entrega` | Dado (data) | Prazo acordado de entrega do conteúdo. |
| `Link_Briefing` | Dado (URL) | Link para o briefing da peça. |
| `Link_Upload_HD` | Dado (URL) | Link do arquivo em alta definição enviado pela influenciadora. |
| `Nota_Fiscal_Anexa` | Dado | Nota fiscal vinculada à ativação. |
| `Estado_Derivado` | Apresentação (somente leitura) | Flag visual exibida pelo Sheets/UI (ex.: `Atrasado`, `No Prazo`). **A camada de domínio ignora completamente este campo**: nenhum Repository, Entity ou Service da V2 lê ou escreve nele. Não é fonte de verdade e não participa da máquina de estados. |

### Máquina de estados de `Estado_Principal`

Valores vêm de `ESTADOS_ATIVACAO` (`mae/Config.js`). Transições permitidas estão em `Ativacao.TRANSICOES_PERMITIDAS` (`mae/Ativacao.js`) e são validadas por `Ativacao.validateStateTransition()` antes de qualquer persistência.

```
Planejamento → Pronta para Envio → Aguardando Recebimento → Em Produção
  → Aguardando Aprovação ⇄ Em Ajustes
  → Aprovada → Agendada → Publicada → Aguardando Upload HD
  → Concluída → Elegível para Pagamento → Arquivada (terminal)
```

`Arquivada` é alcançável a partir de qualquer estado não-terminal (cancelamento/encerramento antecipado) e não tem saída.

> **Atenção**: este grafo de transições foi **inferido** da ordem natural das 13 etapas, não extraído de uma especificação de negócio. Confirmar com o usuário antes de tratar como regra definitiva.

---

## Aba `Ciclos`

Janela temporal de operação. Agrupa ativações.

| Coluna | Papel | Descrição |
|---|---|---|
| `ID_Ciclo` | **Chave primária** | Identificador do ciclo. Referenciado por `Ativacoes.ID_Ciclo`. |
| `Nome_Ciclo` | Dado | Nome legível do ciclo (ex.: campanha/mês de referência). |
| `Data_Inicio_Logistica` | Dado (data) | Início da janela logística (envio de peças às influenciadoras). |
| `Data_Fim_Operacao` | Dado (data) | Encerramento da operação do ciclo. |

---

## Aba `Parceiros_Influenciadoras`

Cadastro de influenciadoras parceiras. Uma linha = uma parceira.

| Coluna | Papel | Descrição |
|---|---|---|
| `ID_Influenciadora` | **Chave primária** | Referenciada por `Ativacoes.ID_Influenciadora` e `Planos_Colaboracao.ID_Influenciadora`. |
| `Nome` | Dado | Nome da influenciadora. |
| `Status_Contrato` | Dado | Situação contratual vigente. Domínio de valores ainda não fechado. |
| `Categoria` | Dado | Segmento/classificação da parceira. |

---

## Aba `Planos_Colaboracao`

Associa uma influenciadora a um ciclo, com o volume e o valor acordados. Tabela de junção entre `Parceiros_Influenciadoras` e `Ciclos`.

| Coluna | Papel | Descrição |
|---|---|---|
| `ID_Plano` | **Chave primária** | Identificador do plano de colaboração. |
| `ID_Influenciadora` | Chave estrangeira → `Parceiros_Influenciadoras.ID_Influenciadora` | Parceira contratada. |
| `ID_Ciclo` | Chave estrangeira → `Ciclos.ID_Ciclo` | Ciclo do acordo. |
| `Qtd_Entregaveis` | Dado (número) | Quantidade de entregáveis acordada para o ciclo. |
| `Valor_Cache` | Dado (número) | Cachê acordado. |

---

## Colunas somente-leitura e fórmulas

`Ativacoes.Estado_Derivado` é a única coluna de apresentação conhecida hoje. Se ela for implementada como **fórmula** na planilha, qualquer escrita de valor literal na célula destruiria a fórmula.

`AtivacaoRepository.save()` protege contra isso: em updates, lê as fórmulas da linha alvo (`getFormulas()`) e regrava a fórmula original em toda célula que a tenha, ignorando o valor vindo do objeto de domínio. Em inserts (`appendRow`), colunas de fórmula nascem vazias — se `Estado_Derivado` for fórmula por linha, a planilha precisa propagá-la (`ARRAYFORMULA` numa coluna inteira, ou preenchimento manual).
