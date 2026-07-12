# MK 02 — Modelo Funcional: Projeto TEAR

## 1. A Planilha como Interface (Semântica e Intenção)

No Projeto TEAR, a planilha não é apenas um depósito de dados, mas um **Painel de Controle Operacional**. Cada elemento visual possui uma função sistêmica.

### 1.1. Mapa de Cores Operacional
| Cor | Código Hex | Significado Sistêmico | Intenção do UX |
|---|---|---|---|
| **Verde Suave** | `#D9EAD3` | Estado **ON / ATIVO** | Indica que a entidade está apta para processamento automático. |
| **Vermelho Suave** | `#F4CCCC` | Estado **OFF / INATIVO** | Indica bloqueio, pausa ou necessidade de validação manual. |
| **Vermelho Alerta** | `#cd0005` | **Cabeçalho Principal** | Delimita a área de dados mestre. Protege visualmente o topo da aba. |
| **Cinza** | - | **Histórico / Arquivado** | Dados que não devem mais ser editados. |

### 1.2. Organização de Colunas e Agrupamentos
*   **Colunas à Esquerda**: Sempre contêm as chaves primárias (`ID`, `INFLU_KEY`, `CUPOM`). São as colunas de "Identificação".
*   **Colunas Centrais**: Contêm os dados de "Processo" (Status, Datas, Links). É onde a operação acontece no dia a dia.
*   **Colunas à Direita**: Geralmente contêm metadados, carimbos de data/hora (`TIMESTAMP`) ou dados de auditoria.

## 2. Máquinas de Estado (Lógica Funcional)

O sistema é regido por transições rigorosas de estado para garantir a integridade do fluxo.

### 2.1. Estados da Ativação (Conteúdo)
A ativação segue um fluxo linear com ramificações de erro:
1.  **Planejamento**: Linha criada, aguardando início do ciclo.
2.  **Pronta para Envio**: Logística autorizada.
3.  **Aguardando Recebimento**: Produto em trânsito.
4.  **Em Produção**: Influenciadora com o produto em mãos.
5.  **Aguardando Aprovação**: Conteúdo enviado pela influenciadora.
6.  **Em Ajustes**: Conteúdo reprovado, aguardando nova versão.
7.  **Aprovada**: Conteúdo pronto para ser postado.
8.  **Agendada / Publicada**: Controle de veiculação.
9.  **Concluída**: Fim do ciclo de produção.
10. **Elegível para Pagamento**: Gatilho para o financeiro.

### 2.2. Estados da Logística (Envio)
1.  **Pendente**: Aguardando dados ou estoque.
2.  **Aguardando Envio**: Dados validados, aguardando coleta.
3.  **Enviado**: Código de rastreio gerado.
4.  **Entregue**: Confirmado pelo transportador ou influenciadora.
5.  **Cancelado**: Estado terminal para envios abortados.

## 3. Fluxos Funcionais Detalhados

### 3.1. O Fluxo de "Geração de Mês"
Este é o processo mais crítico do sistema. Ele funciona como um **Compilador de Dados**:
*   **Input**: Aba `BASE DE DADOS`.
*   **Processamento**: Varre todas as linhas. Se `Status == ON`, lê as colunas de "Capacidade" (`REELS_TEXTO`, etc.).
*   **Output**: Cria N linhas na aba `ATIVAÇÕES` (onde N é a soma das capacidades) e 1 linha na aba `PAGAMENTOS` e `FLUXO LOGÍSTICO`.
*   **Intenção**: Garantir que o planejamento seja uma foto fiel do contrato da influenciadora naquele momento.

### 3.2. O Fluxo de "Upload e Aprovação"
*   A influenciadora faz upload via Portal.
*   O sistema grava o link na aba `ATIVAÇÕES` e altera o status para `ajustes` (que funcionalmente significa "Aguardando Revisão").
*   O administrador altera manualmente para `aprovado` ou volta para `ajustes` com comentários.

## 4. Regras de Validação e Integridade
*   **Unicidade**: O sistema utiliza UUIDs para garantir que, mesmo se uma linha for movida, o link entre o Portal e a Planilha não se quebre.
*   **Proteção**: Colunas calculadas ou automáticas são visualmente distintas (geralmente via formatação condicional) para evitar sobreposição manual.
*   **Sincronização de Looks**: O sistema não armazena o briefing de moda; ele o "espelha" de planilhas externas de estilo, garantindo que a informação de moda esteja sempre atualizada sem duplicação de esforço.
