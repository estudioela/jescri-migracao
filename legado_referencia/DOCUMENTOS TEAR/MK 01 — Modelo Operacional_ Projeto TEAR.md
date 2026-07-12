# MK 01 — Modelo Operacional: Projeto TEAR

## 1. Visão Geral do Negócio
O Projeto TEAR não é apenas uma ferramenta de gestão; é o motor operacional de uma agência de marketing de influência (Estúdio Elã). O negócio funciona através de ciclos mensais de campanhas, onde influenciadoras (Parceiras) são selecionadas para produzir conteúdos (Ativações) em troca de um cachê (Pagamento) e produtos (Logística).

## 2. Ciclo de Vida das Entidades

### 2.1. Parceira (Influenciadora)
*   **Nascimento**: Ocorre via prospecção ou inscrição espontânea em formulário. O dado nasce "bruto" e não validado.
*   **Maturação**: Um administrador valida o perfil, define o valor do contrato (Fee) e a capacidade de entrega (Reels, Carrossel, Stories).
*   **Ativação**: A parceira é marcada como "ON". Isso a torna elegível para os processos automáticos do sistema.
*   **Identidade**: A parceira é identificada por uma `INFLU_KEY` (geralmente o nome artístico) e um `CUPOM` (usado para login e rastreio de vendas).

### 2.2. Campanha e Ciclo Mensal
*   **Nascimento**: O negócio opera em "bateladas" mensais. Um administrador decide iniciar o mês (ex: "SETEMBRO 2026").
*   **Explosão de Dados**: No momento em que o mês nasce, o sistema "clona" as configurações da Parceira (da Base de Dados) para as abas operacionais (Ativações, Logística, Pagamentos).
*   **Fim do Ciclo**: Um ciclo termina quando todas as ativações estão "PUBLICADAS" e os pagamentos estão "PAGOS". Os dados são então arquivados para manter a planilha operacional limpa.

### 2.3. Ativação (O Produto)
*   **Nascimento**: Gerada automaticamente no início do mês. Cada linha representa um entregável único (ex: 1 Reel).
*   **Produção**: A parceira recebe o produto, consulta o briefing (looks e roteiro) e produz o conteúdo.
*   **Aprovação**: O conteúdo passa por uma curadoria interna. Pode haver idas e vindas (ajustes).
*   **Conclusão**: O conteúdo é postado. Este é o gatilho para o faturamento.

### 2.4. Logística (O Insumo)
*   **Nascimento**: Gerada junto com a ativação. Se há conteúdo a produzir, há produto a enviar.
*   **Fluxo**: Confirmação de endereço -> Envio -> Rastreio -> Recebimento.
*   **Dependência**: A produção da ativação está bloqueada até que a logística chegue ao estado "ENTREGUE".

### 2.5. Pagamento (A Contrapartida)
*   **Nascimento**: Provisionado no início do mês com base no valor do contrato.
*   **Liquidação**: Ocorre após a conclusão das ativações do mês. É um processo de conferência entre o que foi planejado e o que foi postado.

## 3. Papéis e Decisões

### 3.1. Administrador (Equipe Elã)
*   **Decisões Humanas**: Seleção de quem fica "ON/OFF", definição de valores de contrato, aprovação estética de conteúdos, resolução de problemas logísticos.
*   **Ações de Gatilho**: Iniciar novo mês, arquivar mês anterior, disparar pagamentos.

### 3.2. Parceira (Influenciadora)
*   **Ações**: Confirmar dados, realizar upload de conteúdos, consultar briefings, acompanhar status de seus pagamentos e envios.
*   **Interface**: Interage via Portal (Web App), nunca diretamente na planilha.

## 4. Regras de Ouro do Negócio
1.  **Sem "ON", sem Trabalho**: Se a influenciadora não estiver "ON" na base, ela não existe para o sistema de ativações.
2.  **O Mês é a Unidade de Tempo**: Tudo é organizado por competência mensal.
3.  **Logística Precede Conteúdo**: Não se cobra conteúdo de quem não recebeu o produto.
4.  **Postagem Precede Pagamento**: O cachê é liberado mediante a comprovação da publicação.
