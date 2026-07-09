# Estúdio Elã - Design System Package

Este pacote contém a infraestrutura de Design Tokens do Estúdio Elã. A única fonte de verdade absoluta e institucional é o vermelho `#a1231f`. Todos os demais valores e tokens são derivações técnicas inferidas para viabilizar a implementação da identidade visual no ambiente Google Apps Script.

## Arquitetura do Pacote

O sistema segue uma hierarquia rigorosa:

1.  **Primitivos (`tokens.json`)**: Definição de valores base.
2.  **Semânticos (`tokens.json`)**: Aliases que atribuem significado.
3.  **Variáveis CSS (`variables.css`)**: Implementação em tempo de execução.
4.  **Utilities (`utilities.css`)**: Classes utilitárias que consomem exclusivamente as variáveis.

## Notas Técnicas Importantes

### Media Queries e Variáveis CSS
**Atenção:** Variáveis CSS (`var(--breakpoint-*)`) **não funcionam** dentro de regras `@media`. Por este motivo, as media queries no arquivo `utilities.css` utilizam o valor literal `768px`. Esta é a **única exceção permitida** à regra de não utilizar valores literais no código.

## Fontes e Tipografia

-   **Sans**: `acumin-pro`.
-   **Serif Editorial**: `ivypresto-display`. Refletida semanticamente como `italic` por diretriz visual.
-   **Nota**: O carregamento das fontes reais é responsabilidade da aplicação. As famílias e o kit Typekit associado não foram verificados no material fornecido.
-   **Regra Visual**: O texto institucional permanece em minúsculas. Não utilize `text-transform: uppercase`.

## Valores Inferidos (Inventados/Estimados)

Abaixo estão listados os valores que foram **inferidos** para garantir a integridade do sistema, uma vez que não constam explicitamente no material original fornecido:

| Token | Justificativa Técnica |
| :--- | :--- |
| `color.dark` (#3a3838) | **Inferido**; nenhum valor de cor de texto padrão foi fornecido. |
| `color.black` (#000000) | **Inferido**; adicionado para suportar contrastes extremos não especificados. |
| `font-size-xs` a `3xl` | **Inferido**; escala tipográfica estimada para permitir hierarquia visual. |
| `spacing-xs` a `2xl` | **Inferido**; escala de espaçamento estimada para ritmo vertical. |
| `radius-*` e `shadow-*` | **Inferido**; modelados para suportar elevações e arredondamentos comuns em UI. |
| `line-height` e `letter-spacing` | **Inferido**; ajustes de legibilidade estimados. |
| `motion.duration.base` (0.6s) | **Inferido**; valor para suavizar transições. |
| `motion.easing.out` | **Inferido**; curva de aceleração para feeling "premium". |
| `safe-area-top/bottom` | **Inferido**; suporte a dispositivos móveis modernos. |

## Manutenção

1. Altere o valor no `tokens.json`.
2. Reflita a mudança em `variables.css`.
3. As utilities atualizarão automaticamente.

**Nunca** utilize valores literais (hardcoded) nos arquivos de estilo da aplicação; utilize sempre as variáveis CSS fornecidas.